/**
 * /api/subdomain/sync — owner pushes an updated public mirror.
 *
 *   POST { subdomain, ownerWallet, mirror } → { ok: true } |
 *                                              { ok: false, error: 'not-found' | 'not-owner' | ... }
 *
 * Called from the EditProductModal "Republish" button after the creator
 * tweaks anything that should be visible at <slug>.solborn.xyz. We verify
 * the caller still owns the slug (Redis owner record === ownerWallet)
 * before overwriting the mirror, so a stolen slug never gets repointed
 * by a different wallet.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getSubdomainOwner,
  isRedisConfigured,
  setProductMirror,
  validateSubdomain,
  type ProductMirror,
} from '@/lib/redis'
import { getSbornBalance } from '@/lib/sborn-balance'
import { isSbornHolder } from '@/lib/staking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Body {
  subdomain: string
  ownerWallet: string
  mirror: ProductMirror
}

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status })
}

export async function POST(req: NextRequest) {
  if (!isRedisConfigured()) return bad('redis-unavailable', 503)

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return bad('invalid-json')
  }

  const slug = typeof body.subdomain === 'string' ? body.subdomain.trim().toLowerCase() : ''
  const ownerWallet = typeof body.ownerWallet === 'string' ? body.ownerWallet.trim() : ''
  const mirror = body.mirror
  if (!slug || !ownerWallet || !mirror) return bad('missing-fields')

  const validationError = validateSubdomain(slug)
  if (validationError) return bad(validationError)

  let owner: string | null
  try {
    owner = await getSubdomainOwner(slug)
  } catch (e) {
    console.error('[subdomain/sync] redis error', e instanceof Error ? e.message : e)
    return bad('redis-error', 502)
  }
  if (!owner) return bad('not-found', 404)
  if (owner !== ownerWallet) return bad('not-owner', 403)

  // Refresh holder status on every republish — the owner might have bought
  // or sold tokens since their last sync, and the featured-row signal should
  // reflect "is a holder right now", not "was a holder at first claim".
  let ownerIsHolder = false
  try {
    const balance = await getSbornBalance(ownerWallet)
    ownerIsHolder = isSbornHolder(balance)
  } catch {
    // Non-fatal: default to non-holder.
  }

  try {
    await setProductMirror(slug, {
      ...mirror,
      syncedAt: Date.now(),
      ownerIsHolder,
    })
  } catch (e) {
    console.error('[subdomain/sync] mirror write failed', e instanceof Error ? e.message : e)
    return bad('mirror-write-failed', 502)
  }

  return NextResponse.json({ ok: true })
}
