import type { StakePosition } from './types'

export const SBORN_TOKEN_ADDRESS = '3VNSmRLTvS54LWnynJNqEege21nzdjy1rEsPhsNxpump'
export const STAKING_MIN_USD = 10

// v1 uses a visible estimate only. The on-chain version should replace this
// with live pair data before enforcing access.
export const SBORN_ESTIMATED_PRICE_USD = 0.0000105
export const STAKING_MIN_SBORN = Math.ceil(STAKING_MIN_USD / SBORN_ESTIMATED_PRICE_USD)

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
