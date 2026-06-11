/**
 * /api/subdomain/claim — the creator picks a subdomain for their project.
 *
 *   POST { subdomain, ownerWallet, mirror } → { ok: true } |
 *                                              { ok: false, error: 'taken' | 'invalid-format' | 'too-short' | 'too-long' | 'reserved' | 'missing-fields' | 'redis-unavailable' }
 *
 * Atomicity: the slug claim uses Redis SET NX. Two concurrent claimers for
 * the same slug serialise — one gets OK, the other gets null → 'taken'.
 * Only after the claim succeeds do we write the mirror, so a failed claim
 * never leaves stale public data.
 *
 * Wallet check (light): we accept any non-empty base58-ish string as the
 * owner. We do not verify a signature on this route — anyone who can read
 * the local zustand store already has full edit rights, so adding a
 * signature gate would be friction without security gain. When subdomains
 * become valuable (paid mode), we'll add a signed challenge here.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  claimSubdomain,
  isRedisConfigured,
  setProductMirror,
  validateSubdomain,
  type ProductMirror,
} from '@/lib/redis'

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

function isPlausibleWallet(s: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)
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

  if (!isPlausibleWallet(ownerWallet)) return bad('invalid-wallet')

  if (!mirror.agent?.id || !mirror.project?.id) return bad('invalid-mirror')

  let claimed: boolean
  try {
    claimed = await claimSubdomain(slug, ownerWallet)
  } catch (e) {
    console.error('[subdomain/claim] redis error', e instanceof Error ? e.message : e)
    return bad('redis-error', 502)
  }
  if (!claimed) return bad('taken', 409)

  try {
    await setProductMirror(slug, {
      ...mirror,
      syncedAt: Date.now(),
    })
  } catch (e) {
    // Ownership recorded but mirror write failed — surface the error so the
    // client can retry sync. We deliberately do NOT release the claim: the
    // owner already paid the friction of picking a slug, we shouldn't lose
    // it for a transient Redis hiccup.
    console.error('[subdomain/claim] mirror write failed', e instanceof Error ? e.message : e)
    return NextResponse.json(
      { ok: false, error: 'mirror-write-failed' },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true })
}
