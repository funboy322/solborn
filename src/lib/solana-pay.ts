/**
 * Client-side Solana Pay helpers for the "generate landing page" Pro flow.
 *
 * Single-purpose: build a 0.05 SOL transfer to the publisher wallet and
 * wait until the network confirms it. The on-chain proof (tx signature)
 * then gets POSTed to /api/landing/generate, which re-verifies everything
 * server-side before calling the LLM.
 *
 * Pure functions only — no React, no global state, safe to import from
 * server too if ever needed (though primary callers are client modals).
 *
 * Why we wait on the client even though the server re-verifies: a stale
 * RPC race where the server queries before the tx propagates would return
 * tx-not-found and burn the user's payment slot. Waiting until the
 * sender's connection reports 'confirmed' gives the network a chance to
 * propagate to whatever RPC the server uses.
 */

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  type Commitment,
} from '@solana/web3.js'

/** Recipient of all 0.05 SOL landing-generation payments (publisher wallet). */
export const LANDING_RECIPIENT = new PublicKey(
  'AKpZ68kWBf6htCBE8Vz1WVJN1Kg5adXtuUwsoVidMDoj'
)

/** 0.05 SOL in lamports. Single source of truth for the price. */
export const LANDING_PRICE_LAMPORTS = Math.floor(0.05 * LAMPORTS_PER_SOL)

/**
 * Returns a Connection pointed at mainnet.
 * Prefers NEXT_PUBLIC_HELIUS_RPC_MAINNET for rate limits / reliability;
 * falls back to the public endpoint (rate-limited but works for low volume).
 */
export function getMainnetConnection(commitment: Commitment = 'confirmed'): Connection {
  const rpc =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_HELIUS_RPC_MAINNET) ||
    clusterApiUrl('mainnet-beta')
  return new Connection(rpc, commitment)
}

/**
 * Build an unsigned Transaction transferring `lamports` from `sender` to
 * `recipient`. The caller signs + sends via their wallet adapter.
 *
 * No Memo instruction — the server identifies the tx purely by signature,
 * sender/recipient/amount triple. Adding a memo would burn extra lamports
 * for no gain.
 */
export function buildPayTx(opts: {
  sender: PublicKey
  recipient: PublicKey
  lamports: number
  recentBlockhash: string
}): Transaction {
  const tx = new Transaction({
    recentBlockhash: opts.recentBlockhash,
    feePayer: opts.sender,
  })
  tx.add(
    SystemProgram.transfer({
      fromPubkey: opts.sender,
      toPubkey: opts.recipient,
      lamports: opts.lamports,
    })
  )
  return tx
}

interface ConfirmResult {
  ok: boolean
  error?: string
}

/**
 * Polls the signature's status until it reaches `confirmed` (or `finalized`)
 * or the timeout elapses. Uses exponential-ish backoff to avoid hammering
 * the RPC during the typical 5-15s confirmation window.
 */
export async function waitForConfirmation(
  connection: Connection,
  signature: string,
  opts: { timeoutMs?: number } = {}
): Promise<ConfirmResult> {
  const timeoutMs = opts.timeoutMs ?? 60_000
  const startedAt = Date.now()
  let delay = 800

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const { value } = await connection.getSignatureStatus(signature, {
        searchTransactionHistory: true,
      })
      if (value) {
        if (value.err) {
          return { ok: false, error: `tx-failed: ${JSON.stringify(value.err)}` }
        }
        if (value.confirmationStatus === 'confirmed' || value.confirmationStatus === 'finalized') {
          return { ok: true }
        }
      }
    } catch {
      // Transient RPC errors — keep polling. We surface a hard timeout only.
    }
    await sleep(delay)
    // Backoff: 0.8s → 1.2s → 1.8s → 2.5s, cap at 3s.
    delay = Math.min(3000, Math.floor(delay * 1.5))
  }
  return { ok: false, error: 'confirmation-timeout' }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
