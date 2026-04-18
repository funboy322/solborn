/**
 * Real compressed-NFT minting on Solana devnet via Metaplex Bubblegum.
 *
 * Strategy (Variant A — user pays):
 *   - Tree is created ONCE (see scripts/create-tree.mjs) and is PUBLIC,
 *     so anyone can mint into it. Tree address is in NEXT_PUBLIC_BUBBLEGUM_TREE.
 *   - The user's connected wallet (Phantom) is the leafOwner AND pays the tx fee.
 *   - Metadata URI points at our /api/agent/[id]/metadata endpoint, which
 *     serves the current agent JSON so that "updating" a cNFT is just evolving
 *     the agent in our DB — the URI resolves to the latest state automatically.
 *
 * Safe-by-default: if NEXT_PUBLIC_BUBBLEGUM_TREE is missing, callers should
 * fall back to Memo-program mint (on-chain.ts) so the hackathon demo keeps
 * working even without a tree.
 */
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { publicKey, none } from '@metaplex-foundation/umi'
import {
  walletAdapterIdentity,
  type WalletAdapter,
} from '@metaplex-foundation/umi-signer-wallet-adapters'
import { mplBubblegum, mintV1 } from '@metaplex-foundation/mpl-bubblegum'
import type { ForgeAgent } from '../types'

const RPC =
  process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.devnet.solana.com'

export function getTreeAddress(): string | null {
  return process.env.NEXT_PUBLIC_BUBBLEGUM_TREE || null
}

export function isBubblegumEnabled(): boolean {
  return !!getTreeAddress()
}

function metadataUri(agent: ForgeAgent): string {
  // cNFT URIs are baked-in at mint time, so we snapshot the agent state
  // into query params. Our /api/nft-metadata endpoint reconstructs the
  // Metaplex JSON on demand. Each stage evolution = fresh mint with a
  // new snapshot — the user collects one cNFT per stage.
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://solborn.vercel.app'
  const params = new URLSearchParams({
    id: agent.id,
    n: agent.name,
    s: agent.stage,
    p: agent.personality,
    xp: String(agent.xp),
    i: String(agent.totalInteractions),
    c: String(agent.traits.curiosity ?? 0),
    sk: String(agent.traits.solanaKnowledge ?? 0),
    cd: String(agent.traits.codingSkill ?? 0),
    cr: String(agent.traits.creativity ?? 0),
    fm: String(agent.traits.founderMindset ?? 0),
  })
  return `${origin}/api/nft-metadata?${params.toString()}`
}

export interface CNFTMintResult {
  assetId: string      // leaf assetId (computed from tree + nonce) — we return tx instead for simplicity
  txSignature: string
  explorerUrl: string
  treeAddress: string
  network: 'devnet'
}

/**
 * Mint a cNFT for this agent into the shared SolBorn tree.
 * The leafOwner is the user's wallet, so it appears in Phantom as "their" NFT.
 */
export async function mintAgentCNFT(
  agent: ForgeAgent,
  wallet: WalletAdapter,
): Promise<CNFTMintResult> {
  const tree = getTreeAddress()
  if (!tree) throw new Error('NEXT_PUBLIC_BUBBLEGUM_TREE not set')
  if (!wallet.publicKey) throw new Error('Wallet not connected')

  const umi = createUmi(RPC)
    .use(mplBubblegum())
    .use(walletAdapterIdentity(wallet))

  const name = `${agent.name} #${agent.id.slice(0, 4).toUpperCase()}`.slice(0, 32)

  const { signature } = await mintV1(umi, {
    leafOwner: umi.identity.publicKey,
    merkleTree: publicKey(tree),
    metadata: {
      name,
      symbol: 'SOLBORN',
      uri: metadataUri(agent),
      sellerFeeBasisPoints: 500, // 5% — royalties (multi-trainer split later)
      collection: none(),
      creators: [
        {
          address: umi.identity.publicKey,
          verified: true,
          share: 100,
        },
      ],
    },
  }).sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })

  const sigStr = bs58FromBytes(signature)

  return {
    assetId: sigStr, // placeholder; real assetId requires DAS lookup
    txSignature: sigStr,
    explorerUrl: `https://explorer.solana.com/tx/${sigStr}?cluster=devnet`,
    treeAddress: tree,
    network: 'devnet',
  }
}

// Tiny base58 encoder for tx signatures (avoid pulling bs58 dep)
function bs58FromBytes(bytes: Uint8Array): string {
  const ALPHABET =
    '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const digits: number[] = [0]
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i]
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8
      digits[j] = carry % 58
      carry = (carry / 58) | 0
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }
  let out = ''
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out += '1'
  for (let i = digits.length - 1; i >= 0; i--) out += ALPHABET[digits[i]]
  return out
}

/**
 * "Updating" a cNFT in our design is a no-op on-chain:
 * the metadata URI serves the latest agent state from our DB.
 * If a stronger on-chain audit trail is needed, we write a Memo
 * transaction recording the evolution — see on-chain.ts mintAgentOnChain.
 */
export async function noteEvolutionOnChain(
  agent: ForgeAgent,
  wallet: WalletAdapter,
): Promise<void> {
  // Intentionally left as a thin wrapper — callers already use the Memo
  // fallback for evolution events. Kept here so call sites import from one file.
  void agent
  void wallet
}
