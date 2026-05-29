/**
 * Wallet-based ownership checks.
 *
 * v1 is intentionally narrow: only the wallet that created the agent (the
 * Passport NFT minter) can edit the product page. Multi-trainer co-ownership
 * is on the roadmap but lives in a separate Trainer permissions model.
 *
 * Solana base58 keys are case-sensitive on the wire, so a plain === is correct.
 * We only trim whitespace and tolerate undefined/null on either side so
 * callers can blindly pass `useSolanaSigner().publicKey?.toBase58()` without
 * a separate guard.
 */

import type { ForgeAgent } from './types'

export function ownsAgent(
  agent: Pick<ForgeAgent, 'walletAddress'> | null | undefined,
  wallet: string | null | undefined
): boolean {
  if (!agent || !wallet) return false
  const owner = agent.walletAddress?.trim()
  const candidate = wallet.trim()
  if (!owner || !candidate) return false
  return owner === candidate
}
