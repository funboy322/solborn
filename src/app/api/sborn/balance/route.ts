/**
 * /api/sborn/balance?wallet=<base58>
 * → { balance: number, isHolder: boolean, tier: 'none' | 'holder' }
 *
 * Live check of $SBORN balance for token-gating UI. The underlying helper
 * caches each wallet for 60s, so a navbar badge that polls every minute
 * costs at most one RPC call per minute per wallet.
 *
 * No auth — anyone can query any wallet's public balance. The endpoint is
 * a thin server wrapper so the Helius RPC URL stays out of the client
 * bundle and we control the rate limit shape if abuse appears.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSbornBalance } from '@/lib/sborn-balance'
import { isSbornHolder } from '@/lib/staking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isPlausibleWallet(s: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const wallet = (url.searchParams.get('wallet') ?? '').trim()
  if (!wallet) {
    return NextResponse.json({ error: 'missing-wallet' }, { status: 400 })
  }
  if (!isPlausibleWallet(wallet)) {
    return NextResponse.json({ error: 'invalid-wallet' }, { status: 400 })
  }

  const balance = await getSbornBalance(wallet)
  const holder = isSbornHolder(balance)

  return NextResponse.json(
    {
      balance,
      isHolder: holder,
      tier: holder ? 'holder' : 'none',
    },
    {
      headers: {
        // Mirror the in-memory cache TTL on the edge so concurrent tabs
        // re-use the same response.
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  )
}
