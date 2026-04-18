/**
 * One-time setup: creates a Bubblegum merkle tree on Solana devnet.
 *
 * Tree params:
 *   maxDepth = 14   → up to 2^14 = 16,384 leaves (cNFTs)
 *   maxBufferSize = 64
 *   canopyDepth = 10
 *
 * Cost on devnet: ~0.2 SOL (free via airdrop).
 * Run once:
 *   node --env-file=.env.local scripts/create-tree.mjs
 *
 * Then copy the printed tree address to:
 *   .env.local       → NEXT_PUBLIC_BUBBLEGUM_TREE=...
 *   Vercel env vars  → NEXT_PUBLIC_BUBBLEGUM_TREE=...
 */
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { generateSigner, keypairIdentity, sol } from '@metaplex-foundation/umi'
import {
  mplBubblegum,
  createTree,
} from '@metaplex-foundation/mpl-bubblegum'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const RPC = process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.devnet.solana.com'
const KEYPAIR_PATH = path.join(os.homedir(), '.config/solana/solborn-tree-authority.json')

async function loadOrCreateKeypair(umi) {
  if (fs.existsSync(KEYPAIR_PATH)) {
    const secret = new Uint8Array(JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf-8')))
    return umi.eddsa.createKeypairFromSecretKey(secret)
  }
  const kp = umi.eddsa.generateKeypair()
  fs.mkdirSync(path.dirname(KEYPAIR_PATH), { recursive: true })
  fs.writeFileSync(KEYPAIR_PATH, JSON.stringify(Array.from(kp.secretKey)))
  console.log(`✓ new tree authority keypair saved to ${KEYPAIR_PATH}`)
  return kp
}

async function ensureBalance(umi, pubkey) {
  const balance = await umi.rpc.getBalance(pubkey)
  const solBalance = Number(balance.basisPoints) / 1e9
  console.log(`  authority balance: ${solBalance} SOL`)
  if (solBalance >= 1) return

  // Try up to 3 airdrop attempts of 1 SOL each
  for (let i = 1; i <= 3; i++) {
    try {
      console.log(`  airdrop attempt ${i}/3 (1 SOL) …`)
      await umi.rpc.airdrop(pubkey, sol(1))
      await new Promise((r) => setTimeout(r, 4000))
      const after = await umi.rpc.getBalance(pubkey)
      const afterSol = Number(after.basisPoints) / 1e9
      console.log(`  balance now: ${afterSol} SOL`)
      if (afterSol >= 1) return
    } catch (e) {
      console.warn(`  airdrop ${i} failed: ${e.message ?? e}`)
      await new Promise((r) => setTimeout(r, 3000))
    }
  }

  throw new Error(
    `Devnet faucet rate-limited. Fund manually then re-run:\n` +
      `  1) visit https://faucet.solana.com → paste ${pubkey}\n` +
      `  2) or run: curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"requestAirdrop","params":["${pubkey}",1000000000]}' https://api.devnet.solana.com`,
  )
}

async function main() {
  console.log('SolBorn — Bubblegum tree creator')
  console.log(`RPC: ${RPC}`)

  const umi = createUmi(RPC).use(mplBubblegum())

  const authority = await loadOrCreateKeypair(umi)
  umi.use(keypairIdentity(authority))
  console.log(`authority pubkey: ${authority.publicKey}`)

  await ensureBalance(umi, authority.publicKey)

  const merkleTree = generateSigner(umi)
  console.log(`creating merkle tree: ${merkleTree.publicKey}`)

  const builder = await createTree(umi, {
    merkleTree,
    maxDepth: 14,
    maxBufferSize: 64,
    canopyDepth: 10,
    public: true, // anyone can mint into it (user pays — variant A)
  })
  const { signature } = await builder.sendAndConfirm(umi, {
    confirm: { commitment: 'confirmed' },
  })

  const sigStr = Buffer.from(signature).toString('base64')
  console.log('\n✅ tree created')
  console.log('  tree:     ', merkleTree.publicKey)
  console.log('  authority:', authority.publicKey)
  console.log('  tx:       ', sigStr)
  console.log('\nAdd to .env.local AND Vercel:')
  console.log(`  NEXT_PUBLIC_BUBBLEGUM_TREE=${merkleTree.publicKey}`)
}

main().catch((e) => {
  console.error('\n❌ failed:', e)
  process.exit(1)
})
