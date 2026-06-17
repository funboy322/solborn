/**
 * /api/discover/list — paginated card feed for the marketplace.
 *
 *   GET ?cursor=<n>&limit=<n>
 *   →   { items: DiscoverCard[], nextCursor: number | null, total: number }
 *
 * Used by the discover page for "Load more" navigation and by anyone
 * wanting a JSON feed of solborn products (future: build a Twitter/X
 * bot that tweets new claims, RSS-style integrations, etc.).
 *
 * Cached at the edge for 30s to keep Redis quota low even under bursts.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  getDiscoverPage,
} from '@/lib/discover'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const cursorRaw = url.searchParams.get('cursor')
  const limitRaw = url.searchParams.get('limit')

  const cursor = cursorRaw ? parseInt(cursorRaw, 10) : 0
  const limit = limitRaw ? parseInt(limitRaw, 10) : DEFAULT_PAGE_SIZE
  if (!Number.isFinite(cursor) || cursor < 0) {
    return NextResponse.json({ error: 'invalid-cursor' }, { status: 400 })
  }
  if (!Number.isFinite(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    return NextResponse.json({ error: 'invalid-limit' }, { status: 400 })
  }

  try {
    const page = await getDiscoverPage(cursor, limit)
    return NextResponse.json(page, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
      },
    })
  } catch (e) {
    console.error('[discover/list] failed', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'redis-error' }, { status: 502 })
  }
}
