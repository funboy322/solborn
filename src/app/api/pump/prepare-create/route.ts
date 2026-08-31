/**
 * /api/pump/prepare-create
 *
 * Server-side builder for the pump.fun createV2 instruction. Client sends:
 *   { subdomain, mintPubkey (base58), userPubkey (base58) }
 *
 * We look up the mirror to source name + ticker + metadata URI, ask the
 * @pump-fun/pump-sdk to produce a `createV2Instruction`, wrap it in an
 * unsigned Transaction (fee payer = user, recent blockhash set), and return
 * the serialized-then-base64 bytes plus the mint pubkey so the client can:
 *
 *   1. Deserialize the tx
 *   2. Partial-sign with the ephemeral mint keypair
 *   3. Hand it to the wallet for the final user signature
 *   4. Send + confirm
 *
 * The mint keypair NEVER leaves the browser — the server only sees the
 * pubkey. That means we can't accidentally leak or reuse it. Mainnet-only.
 */
import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { PumpSdk } from '@pump-fun/pump-sdk'
import { getProductMirror, isRedisConfigured } from '@/lib/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 20

interface Body {
  subdomain: string
  mintPubkey: string
  userPubkey: string
}

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

export async function POST(req: NextRequest) {
  if (!isRedisConfigured()) return bad('redis-not-configured', 503)

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return bad('invalid-json')
  }

  const { subdomain, mintPubkey, userPubkey } = body
  if (!subdomain || !mintPubkey || !userPubkey) return bad('missing-fields')

  let mint: PublicKey
  let user: PublicKey
  try {
    mint = new PublicKey(mintPubkey)
    user = new PublicKey(userPubkey)
  } catch {
    return bad('invalid-pubkey')
  }

  const mirror = await getProductMirror(subdomain).catch(() => null)
  if (!mirror) return bad('mirror-not-found', 404)
  const { project } = mirror

  const ticker = project.memecoinBrief?.ticker?.toUpperCase()
  if (!ticker) return bad('ticker-missing')
  if (project.memecoinBrief?.contractAddress) return bad('already-deployed', 409)

  const name = project.name.slice(0, 32)
  const symbol = ticker.slice(0, 10)
  const uri = `https://solborn.xyz/api/pump/metadata/${subdomain}`

  // PumpSdk builds instructions offline — no RPC needed here. We still need
  // a Connection for the latest blockhash and lastValidBlockHeight so the
  // client can broadcast without staleness.
  const rpcUrl =
    process.env.NEXT_PUBLIC_HELIUS_RPC_MAINNET ??
    process.env.HELIUS_RPC_URL ??
    'https://api.mainnet-beta.solana.com'
  const connection = new Connection(rpcUrl, 'confirmed')
  const sdk = new PumpSdk()

  let instruction
  try {
    instruction = await sdk.createV2Instruction({
      mint,
      name,
      symbol,
      uri,
      creator: user,
      user,
      mayhemMode: false,
    })
  } catch (e) {
    console.error('[pump] createV2Instruction failed', e)
    return bad('sdk-failed', 502)
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
  const tx = new Transaction({
    feePayer: user,
    blockhash,
    lastValidBlockHeight,
  })
  tx.add(instruction)

  // Serialize WITHOUT requiring any signatures — the mint keypair (client
  // side) and the user wallet will both add theirs in the browser.
  const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false })
  const txBase64 = Buffer.from(serialized).toString('base64')

  return NextResponse.json({
    txBase64,
    mintPubkey: mint.toBase58(),
    name,
    symbol,
    uri,
    blockhash,
    lastValidBlockHeight,
  })
}
