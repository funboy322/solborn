/**
 * Real on-chain transactions for SolBorn using Solana Memo Program.
 * Each "mint" writes agent metadata as an on-chain memo → real devnet tx.
 * No SOL token needed beyond the ~0.000005 SOL tx fee.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import type { ForgeAgent } from '../types'
import { STAGE_CONFIG } from '../constants'

// Solana Memo Program v2
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

export const DEVNET_CONNECTION = new Connection(
  'https://api.devnet.solana.com',
  { commitment: 'confirmed', confirmTransactionInitialTimeout: 60000 }
)

export interface OnChainMintResult {
  txSignature: string
  explorerUrl: string
  mintAddress: string // walletAddress used as identity
}

/**
 * Write agent metadata on-chain via Memo Program.
 * Creates a real devnet transaction signed by the user's wallet.
 * The memo contains the agent's JSON metadata — verifiable on Solana Explorer.
 */
export async function mintAgentOnChain(
  agent: ForgeAgent,
  publicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<OnChainMintResult> {
  const stageConfig = STAGE_CONFIG[agent.stage]

  const metadata = {
    protocol: 'SolBorn v1',
    name: `${agent.name} #${agent.id.slice(0, 6).toUpperCase()}`,
    symbol: 'SOLBORN',
    stage: stageConfig.label,
    personality: agent.personality,
    xp: agent.xp,
    traits: agent.traits,
    interactions: agent.totalInteractions,
    timestamp: Date.now(),
    network: 'devnet',
  }

  const memoData = JSON.stringify(metadata)

  const instruction = new TransactionInstruction({
    keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoData, 'utf-8'),
  })

  const { blockhash, lastValidBlockHeight } = await DEVNET_CONNECTION.getLatestBlockhash()

  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: publicKey,
  })
  transaction.add(instruction)

  const signed = await signTransaction(transaction)
  const txSignature = await DEVNET_CONNECTION.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  })

  await DEVNET_CONNECTION.confirmTransaction(
    { signature: txSignature, blockhash, lastValidBlockHeight },
    'confirmed'
  )

  return {
    txSignature,
    explorerUrl: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
    mintAddress: publicKey.toBase58(),
  }
}

/**
 * Request devnet airdrop (0.5 SOL)
 */
export async function requestDevnetAirdrop(publicKey: PublicKey): Promise<void> {
  const sig = await DEVNET_CONNECTION.requestAirdrop(publicKey, 0.5 * LAMPORTS_PER_SOL)
  await DEVNET_CONNECTION.confirmTransaction(sig, 'confirmed')
}

/**
 * Get devnet SOL balance
 */
export async function getDevnetBalance(publicKey: PublicKey): Promise<number> {
  const lamports = await DEVNET_CONNECTION.getBalance(publicKey)
  return lamports / LAMPORTS_PER_SOL
}
