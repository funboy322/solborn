/**
 * Birth-fee payment: user pays 0.1 SOL (devnet) to birth a SolBorn agent.
 * Implemented as a self-transfer with a Memo instruction that records
 * the agent's name/personality on-chain — auditable on Solana Explorer.
 */

import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import { DEVNET_CONNECTION, MEMO_PROGRAM_ID } from './on-chain'
import { BIRTH_FEE_SOL } from '../constants'

export interface BirthPaymentResult {
  txSignature: string
  explorerUrl: string
  paidLamports: number
}

export interface BirthPaymentInput {
  name: string
  emoji: string
  personality: string
}

/**
 * Pays the birth fee and records agent metadata on-chain.
 * Self-transfer so the user doesn't actually lose 0.1 SOL —
 * only the ~5k-lamport network fee. Memo is auditable.
 */
export async function payBirthFee(
  publicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  agent: BirthPaymentInput
): Promise<BirthPaymentResult> {
  const balance = await DEVNET_CONNECTION.getBalance(publicKey)
  const required = BIRTH_FEE_SOL * LAMPORTS_PER_SOL
  if (balance < required + 5000) {
    throw new Error(
      `Need at least ${BIRTH_FEE_SOL} SOL + fees. Current balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL. Use the airdrop button.`
    )
  }

  // Self-transfer (money lock + audit trail, not burn)
  const transferIx = SystemProgram.transfer({
    fromPubkey: publicKey,
    toPubkey: publicKey,
    lamports: required,
  })

  const memoPayload = JSON.stringify({
    protocol: 'SolBorn v1',
    action: 'birth',
    name: agent.name,
    emoji: agent.emoji,
    personality: agent.personality,
    timestamp: Date.now(),
  })

  const memoIx = new TransactionInstruction({
    keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoPayload, 'utf-8'),
  })

  const { blockhash, lastValidBlockHeight } = await DEVNET_CONNECTION.getLatestBlockhash()

  const tx = new Transaction({
    recentBlockhash: blockhash,
    feePayer: publicKey,
  })
  tx.add(transferIx, memoIx)

  const signed = await signTransaction(tx)
  const txSignature = await DEVNET_CONNECTION.sendRawTransaction(signed.serialize(), {
    skipPreflight: true,
  })

  await DEVNET_CONNECTION.confirmTransaction(
    { signature: txSignature, blockhash, lastValidBlockHeight },
    'confirmed'
  )

  return {
    txSignature,
    explorerUrl: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
    paidLamports: required,
  }
}

/**
 * Record an evolution event on-chain via memo.
 */
export async function recordEvolution(
  publicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  data: { agentName: string; fromStage: string; toStage: string; xp: number }
): Promise<{ txSignature: string; explorerUrl: string }> {
  const memoPayload = JSON.stringify({
    protocol: 'SolBorn v1',
    action: 'evolve',
    ...data,
    timestamp: Date.now(),
  })

  const memoIx = new TransactionInstruction({
    keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoPayload, 'utf-8'),
  })

  const { blockhash, lastValidBlockHeight } = await DEVNET_CONNECTION.getLatestBlockhash()
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: publicKey })
  tx.add(memoIx)
  const signed = await signTransaction(tx)
  const txSignature = await DEVNET_CONNECTION.sendRawTransaction(signed.serialize(), {
    skipPreflight: true,
  })
  await DEVNET_CONNECTION.confirmTransaction(
    { signature: txSignature, blockhash, lastValidBlockHeight },
    'confirmed'
  )
  return {
    txSignature,
    explorerUrl: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
  }
}
