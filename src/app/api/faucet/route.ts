/**
 * Internal devnet faucet — drips a small amount of SOL from a project-owned
 * "house" keypair to any address that asks. Lets users (especially Privy
 * email-login folks) actually try the mint flow without fighting the
 * built-in `connection.requestAirdrop()`, which is heavily rate-limited on
 * solana devnet and almost always returns 429.
 *
 * Anti-abuse strategy is intentionally simple — we just refuse if the
 * recipient already has SOL above a threshold. Good enough for hackathon
 * demo: the worst case is one bad actor draining 5 SOL, which is recoverable
 * by topping up the house keypair.
 *
 * Configuration (Vercel env):
 *   FAUCET_PRIVATE_KEY   base58-encoded Solana private key (Phantom-style)
 *                        OR JSON array (solana-keygen-style: "[1,2,3,...]")
 *
 * The faucet only operates on devnet — see RPC fallback below. Mainnet would
 * require completely different controls.
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import bs58 from 'bs58'

const RPC = process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.devnet.solana.com'

/** How much we send per request. Small enough that 5 SOL house wallet covers ~50 demos. */
const FAUCET_AMOUNT_SOL = 0.1

/** If recipient already has more than this, we refuse — they have enough to mint. */
const MAX_BALANCE_FOR_FAUCET_SOL = 0.1

/** Minimum balance the house wallet must keep to cover tx fees. */
const HOUSE_RESERVE_SOL = 0.001

function loadFaucetKeypair(): Keypair | null {
  const raw = process.env.FAUCET_PRIVATE_KEY
  if (!raw) return null
  const trimmed = raw.trim()
  try {
    // JSON array format from solana-keygen ("[12,34,56,...]")
    if (trimmed.startsWith('[')) {
      const arr = JSON.parse(trimmed) as number[]
      return Keypair.fromSecretKey(Uint8Array.from(arr))
    }
    // base58 format from Phantom export
    return Keypair.fromSecretKey(bs58.decode(trimmed))
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { address?: unknown }
    const address = typeof body.address === 'string' ? body.address.trim() : ''
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }

    let recipient: PublicKey
    try {
      recipient = new PublicKey(address)
    } catch {
      return NextResponse.json({ error: 'Invalid Solana address' }, { status: 400 })
    }

    const faucet = loadFaucetKeypair()
    if (!faucet) {
      return NextResponse.json(
        { error: 'Faucet is not configured on the server' },
        { status: 503 },
      )
    }

    const conn = new Connection(RPC, 'confirmed')

    // Anti-abuse: don't fund wallets that already have SOL
    const recipientBalance = await conn.getBalance(recipient)
    if (recipientBalance >= MAX_BALANCE_FOR_FAUCET_SOL * LAMPORTS_PER_SOL) {
      return NextResponse.json(
        {
          error: `Wallet already has ${(recipientBalance / LAMPORTS_PER_SOL).toFixed(3)} SOL. Use a public faucet (faucet.solana.com / solfaucet.com) for more.`,
        },
        { status: 429 },
      )
    }

    // Make sure the house wallet can actually pay
    const faucetBalance = await conn.getBalance(faucet.publicKey)
    if (faucetBalance < (FAUCET_AMOUNT_SOL + HOUSE_RESERVE_SOL) * LAMPORTS_PER_SOL) {
      return NextResponse.json(
        { error: 'Faucet is temporarily empty. Please use solfaucet.com.' },
        { status: 503 },
      )
    }

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: faucet.publicKey,
        toPubkey: recipient,
        lamports: Math.floor(FAUCET_AMOUNT_SOL * LAMPORTS_PER_SOL),
      }),
    )

    const signature = await sendAndConfirmTransaction(conn, tx, [faucet], {
      commitment: 'confirmed',
    })

    return NextResponse.json({
      signature,
      amount: FAUCET_AMOUNT_SOL,
      explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown faucet error'
    console.error('[faucet] request failed:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
