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
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import { NATIVE_MINT } from '@solana/spl-token'
import {
  OnlinePumpSdk,
  PumpSdk,
  getBuyTokenAmountFromSolAmount,
} from '@pump-fun/pump-sdk'
// @coral-xyz/anchor re-exports BN with proper types, avoids @types/bn.js dep.
import { BN } from '@coral-xyz/anchor'
import { getProductMirror, isRedisConfigured } from '@/lib/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 20

interface Body {
  subdomain: string
  mintPubkey: string
  userPubkey: string
  /** SOL amount for the initial dev-buy in the same tx. 0 = create-only. */
  devBuySol?: number
}

const LAMPORTS_PER_SOL = 1_000_000_000
// Hard-cap the dev-buy at 5 SOL so a fat-fingered "500" cannot drain a wallet
// silently. pump.fun's bonding curve absorbs a lot, but this is a UX guard.
const MAX_DEV_BUY_SOL = 5

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

  const devBuySol = typeof body.devBuySol === 'number' && body.devBuySol > 0 ? body.devBuySol : 0
  if (devBuySol > MAX_DEV_BUY_SOL) return bad('dev-buy-too-large')

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

  // PumpSdk builds most instructions offline. For create+dev-buy we need
  // OnlinePumpSdk (fetches Global + FeeConfig from chain) so the token
  // amount comes out correctly for the current bonding curve params.
  const rpcUrl =
    process.env.NEXT_PUBLIC_HELIUS_RPC_MAINNET ??
    process.env.HELIUS_RPC_URL ??
    'https://api.mainnet-beta.solana.com'
  const connection = new Connection(rpcUrl, 'confirmed')

  const instructions: import('@solana/web3.js').TransactionInstruction[] = []
  let estimatedTokens: string | null = null

  try {
    if (devBuySol > 0) {
      const onlineSdk = new OnlinePumpSdk(connection)
      const [global, feeConfig] = await Promise.all([
        onlineSdk.fetchGlobal(),
        onlineSdk.fetchFeeConfig(),
      ])

      const quoteAmount = new BN(Math.floor(devBuySol * LAMPORTS_PER_SOL))
      // Fresh curve — mintSupply=null, bondingCurve=null. Returns the token
      // amount the user will receive for `quoteAmount` SOL as the first buy.
      const tokenAmount = getBuyTokenAmountFromSolAmount({
        global,
        feeConfig,
        mintSupply: null,
        bondingCurve: null,
        amount: quoteAmount,
        quoteMint: NATIVE_MINT,
      })
      estimatedTokens = tokenAmount.toString()

      // V1 create+buy is materially smaller than V2 (fewer accounts, no
      // fee-sharing/cashback plumbing) and fits in a single VersionedTransaction
      // without needing an Address Lookup Table. V2 requires an ALT which the
      // SDK doesn't expose a canonical one for.
      const sdk = new PumpSdk()
      const buyInstructions = await sdk.createAndBuyInstructions({
        global,
        mint,
        name,
        symbol,
        uri,
        creator: user,
        user,
        amount: tokenAmount,
        solAmount: quoteAmount,
      })
      instructions.push(...buyInstructions)
    } else {
      const sdk = new PumpSdk()
      const createOnly = await sdk.createV2Instruction({
        mint,
        name,
        symbol,
        uri,
        creator: user,
        user,
        mayhemMode: false,
      })
      instructions.push(createOnly)
    }
  } catch (e) {
    console.error('[pump] SDK failed', e)
    return bad('sdk-failed', 502)
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')

  // VersionedTransaction (v0). Legacy Transaction packs less efficiently and
  // create+dev-buy overflows the 1232-byte per-tx limit; v0's message format
  // is a bit tighter and typically fits without needing an ALT here.
  const message = new TransactionMessage({
    payerKey: user,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message()
  const tx = new VersionedTransaction(message)
  const serialized = tx.serialize()
  const txBase64 = Buffer.from(serialized).toString('base64')

  return NextResponse.json({
    txBase64,
    mintPubkey: mint.toBase58(),
    name,
    symbol,
    uri,
    blockhash,
    lastValidBlockHeight,
    devBuySol,
    /** Raw token amount (with decimals baked in) the user will receive from the dev-buy; null if none. */
    estimatedTokens,
  })
}
