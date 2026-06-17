import type { StakePosition } from './types'

export const SBORN_TOKEN_ADDRESS = '3VNSmRLTvS54LWnynJNqEege21nzdjy1rEsPhsNxpump'
export const STAKING_MIN_USD = 10

// v1 uses a visible estimate only. The on-chain version should replace this
// with live pair data before enforcing access.
export const SBORN_ESTIMATED_PRICE_USD = 0.0000105
export const STAKING_MIN_SBORN = Math.ceil(STAKING_MIN_USD / SBORN_ESTIMATED_PRICE_USD)

/**
 * Minimum $SBORN balance for the v2 token-gated holder tier.
 * Anyone holding ≥ this amount of $SBORN in their wallet (no lock) gets
 * the holder badge and Featured placement on /discover.
 *
 * Tuned for the early-launch price (~$0.0000105/SBORN → 1M ≈ $10.50).
 * Adjust down as price rises so the bar stays roughly "$10 in tokens".
 */
export const SBORN_HOLDER_MIN_TOKENS = 1_000_000

export function isSbornHolder(balance: number): boolean {
  return balance >= SBORN_HOLDER_MIN_TOKENS
}

/**
 * Compact display, e.g. 1_234_567 → "1.23M", 850_000 → "850k".
 * Used on cards where horizontal space is tight.
 */
export function formatSbornCompact(amount: number): string {
  if (amount >= 1_000_000)
    return `${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 2)}M`
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`
  return Math.round(amount).toString()
}

export function formatSborn(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: amount >= 1000 ? 0 : 2,
  }).format(amount)
}

export function estimateStakeUsd(amount: number): number {
  return amount * SBORN_ESTIMATED_PRICE_USD
}

export function getActiveStakeForWallet(
  positions: StakePosition[],
  walletAddress: string | null | undefined,
): number {
  if (!walletAddress) return 0
  return positions
    .filter((position) => position.walletAddress === walletAddress && position.status === 'active')
    .reduce((sum, position) => sum + position.amount, 0)
}

export function getStakeVoteWeight(stakedAmount: number): number {
  if (stakedAmount <= 0) return 0
  const multiplier = Math.sqrt(stakedAmount / STAKING_MIN_SBORN)
  return Number(Math.min(3, 1 + multiplier).toFixed(2))
}
