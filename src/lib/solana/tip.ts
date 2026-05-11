/**
 * Founder tip jar — anyone with a connected Solana wallet (Phantom or
 * Privy embedded) can tip the creator of a product page in SOL.
 *
 * The flow is a plain SystemProgram.transfer with a Memo instruction
 * attached so the tip is human-auditable on Solana Explorer ("which
 * project did this tip go to, when, from whom"). The memo doesn't carry
 * any private data — just a SolBorn protocol marker, the project id,
 * and the project name (already public on solborn.xyz).
 *
 * Devnet only. Mainnet rollout will require:
 *   - real liquidity for the recipient wallet
 *   - $SBORN denomination as an alternate path
 *   - server-backed leaderboard of top tippers
 */

import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import { DEVNET_CONNECTION, MEMO_PROGRAM_ID } from './on-chain'

/** Default suggested amounts (SOL). Stored here so the picker UI and any
 * future Blink integration stay in sync. */
export const TIP_PRESETS_SOL = [0.01, 0.05, 0.1] as const

/** Hard floor — anti-spam against zero-value Phantom popups. */
export const MIN_TIP_SOL = 0.001

/** Reserved for tx fee + rent safety so the sender doesn't get stuck. */
const SENDER_RESERVE_LAMPORTS = 10_000

export interface TipInput {
  fromPubkey: PublicKey
  toPubkey: PublicKey
  amountSol: number
  projectId: string
  projectName: string
  signTransaction: (tx: Transaction) => Promise<Transaction>
}

export interface TipResult {
  txSignature: string
  explorerUrl: string
  amountLamports: number
}

/**
 * Sends a tip from `fromPubkey` to `toPubkey` with a Memo record.
 * Throws with a human-readable message on insufficient balance,
 * invalid amount, or RPC failure — the UI surfaces this directly.
 */
export async function tipFounder({
  fromPubkey,
  toPubkey,
  amountSol,
  projectId,
  projectName,
  signTransaction,
}: TipInput): Promise<TipResult> {
  if (amountSol < MIN_TIP_SOL) {
    throw new Error(`Minimum tip is ${MIN_TIP_SOL} SOL.`)
  }
  if (fromPubkey.equals(toPubkey)) {
    throw new Error("You can't tip yourself.")
  }

  const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL)

  const balance = await DEVNET_CONNECTION.getBalance(fromPubkey)
  if (balance < lamports + SENDER_RESERVE_LAMPORTS) {
    const have = (balance / LAMPORTS_PER_SOL).toFixed(4)
    throw new Error(
      `Not enough SOL. You have ${have} SOL, need ${amountSol} SOL plus fees. Use the faucet to top up.`,
    )
  }

  const transferIx = SystemProgram.transfer({
    fromPubkey,
    toPubkey,
    lamports,
  })

  const memoPayload = JSON.stringify({
    protocol: 'SolBorn v1',
    action: 'tip',
    projectId,
    projectName: projectName.slice(0, 60),
    amountSol,
    timestamp: Date.now(),
  })

  const memoIx = new TransactionInstruction({
    keys: [{ pubkey: fromPubkey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoPayload, 'utf-8'),
  })

  const { blockhash, lastValidBlockHeight } = await DEVNET_CONNECTION.getLatestBlockhash()
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: fromPubkey })
  tx.add(transferIx, memoIx)

  const signed = await signTransaction(tx)
  const txSignature = await DEVNET_CONNECTION.sendRawTransaction(signed.serialize(), {
    skipPreflight: true,
  })
  await DEVNET_CONNECTION.confirmTransaction(
    { signature: txSignature, blockhash, lastValidBlockHeight },
    'confirmed',
  )

  return {
    txSignature,
    explorerUrl: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
    amountLamports: lamports,
  }
}
