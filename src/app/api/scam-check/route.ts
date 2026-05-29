/**
 * Safe-Browsing proxy for the customize-launch-page feature.
 *
 *   POST /api/scam-check   { url: string }
 *   →    { safe: true }                                          (clean)
 *   →    { safe: false, threats: string[] }                      (flagged by Google)
 *   →    { safe: false, error: 'invalid-url' | 'timeout' | ... } (other failures)
 *
 * Why a server proxy:
 *   - GOOGLE_SAFE_BROWSING_API_KEY stays out of the client bundle.
 *   - We can rate-limit and cache without trusting browser-side code.
 *   - Same-origin call from the EditProductModal avoids CORS configuration.
 *
 * Fail-closed policy: if the env key is missing, the API errors, or the URL
 * smells like a non-http(s) scheme, we return { safe: false }. The modal
 * blocks save on anything but { safe: true }, so it is impossible to
 * accidentally publish an unchecked link.
 *
 * In-memory cache (1h TTL per URL) sized to a few hundred entries keeps the
 * Google quota use down across rapid retries / multi-tab edits. The cache is
 * per-Lambda-instance, which is fine — Safe Browsing is cheap and Vercel
 * recycles instances frequently anyway.
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface SafeBrowsingResult {
  safe: boolean
  threats?: string[]
  error?: string
}

const SAFE_BROWSING_ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find'

const THREAT_TYPES = [
  'MALWARE',
  'SOCIAL_ENGINEERING',
  'UNWANTED_SOFTWARE',
  'POTENTIALLY_HARMFUL_APPLICATION',
]

const PLATFORM_TYPES = ['ANY_PLATFORM']

// Per-URL cache keyed by normalised URL. Entries expire 1h after a successful
// "safe" check. We deliberately do NOT cache "unsafe" results — if a site gets
// delisted we want the next save to succeed without waiting an hour.
const CACHE_TTL_MS = 60 * 60 * 1000
const CACHE_MAX = 256
const safeCache = new Map<string, number>() // url → expiry ms

function pruneCache() {
  if (safeCache.size <= CACHE_MAX) return
  const now = Date.now()
  for (const [k, exp] of safeCache) {
    if (exp < now) safeCache.delete(k)
  }
  // If still over, drop oldest insertion order.
  while (safeCache.size > CACHE_MAX) {
    const firstKey = safeCache.keys().next().value
    if (firstKey === undefined) break
    safeCache.delete(firstKey)
  }
}

function normaliseUrl(input: string): string | null {
  try {
    const u = new URL(input.trim())
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    // Strip fragments and trailing slashes for cache stability.
    u.hash = ''
    const s = u.toString().replace(/\/$/, '')
    if (s.length > 2048) return null
    return s
  } catch {
    return null
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<SafeBrowsingResult>> {
  let url: string
  try {
    const body = (await req.json()) as { url?: unknown }
    if (typeof body.url !== 'string' || !body.url.trim()) {
      return NextResponse.json({ safe: false, error: 'missing-url' }, { status: 400 })
    }
    url = body.url.trim()
  } catch {
    return NextResponse.json({ safe: false, error: 'invalid-json' }, { status: 400 })
  }

  const normalised = normaliseUrl(url)
  if (!normalised) {
    return NextResponse.json({ safe: false, error: 'invalid-url' }, { status: 400 })
  }

  // Cache hit — clean result still fresh.
  const cachedExpiry = safeCache.get(normalised)
  if (cachedExpiry && cachedExpiry > Date.now()) {
    return NextResponse.json({ safe: true })
  }
  if (cachedExpiry) safeCache.delete(normalised)

  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY
  if (!apiKey) {
    console.warn('[scam-check] GOOGLE_SAFE_BROWSING_API_KEY missing — failing closed')
    return NextResponse.json(
      { safe: false, error: 'check-disabled' },
      { status: 503 }
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(`${SAFE_BROWSING_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        client: { clientId: 'solborn', clientVersion: '1.0.0' },
        threatInfo: {
          threatTypes: THREAT_TYPES,
          platformTypes: PLATFORM_TYPES,
          threatEntryTypes: ['URL'],
          threatEntries: [{ url: normalised }],
        },
      }),
    })

    if (!res.ok) {
      console.error('[scam-check] Safe Browsing returned', res.status)
      return NextResponse.json(
        { safe: false, error: `upstream-${res.status}` },
        { status: 502 }
      )
    }

    const data = (await res.json()) as { matches?: Array<{ threatType?: string }> }
    const matches = data.matches ?? []

    if (matches.length === 0) {
      safeCache.set(normalised, Date.now() + CACHE_TTL_MS)
      pruneCache()
      return NextResponse.json({ safe: true })
    }

    const threats = Array.from(
      new Set(matches.map((m) => m.threatType ?? 'UNKNOWN'))
    )
    return NextResponse.json({ safe: false, threats })
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError'
    const message = aborted ? 'timeout' : 'request-failed'
    console.error('[scam-check]', message, e instanceof Error ? e.message : e)
    return NextResponse.json({ safe: false, error: message }, { status: aborted ? 504 : 500 })
  } finally {
    clearTimeout(timeout)
  }
}
