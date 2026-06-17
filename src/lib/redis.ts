/**
 * Upstash Redis client + subdomain mirror helpers.
 *
 * SolBorn is local-first (zustand persist in the browser), so we only touch
 * Redis when a creator opts in by claiming a custom subdomain. Once they
 * claim "harmonia", we push a "public mirror" of the product into Redis
 * so visitors hitting `harmonia.solborn.xyz` can server-render the page
 * even though they don't have the agent in their own zustand store.
 *
 * Two keys per subdomain:
 *   subdomain:owner:<slug>    → wallet address that claimed the slug
 *                                (SETNX so concurrent claims serialise cleanly)
 *   subdomain:mirror:<slug>   → JSON ProductMirror, refreshed on Republish
 *
 * No TTL on either key — claims are durable until the owner releases the
 * slug or we delete it administratively.
 */

import { Redis } from '@upstash/redis'
import type { ForgeAgent, GeneratedProject } from './types'

const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'app',
  'admin',
  'mail',
  'ftp',
  'blog',
  'dev',
  'staging',
  'preview',
  'docs',
  'help',
  'status',
  'cdn',
  'assets',
  'static',
  'p',
  'products',
  'forge',
  'staking',
  'rewards',
  'privacy',
  'demo',
  'me',
  'you',
  'solborn',
])

// Format mirrors the human-readable URL slug: lowercase alphanumerics + hyphens,
// must start and end with [a-z0-9], 3-32 chars. Strict to keep DNS-safe and
// avoid lookalike attacks (no underscores or capitals).
const SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/

export type SubdomainValidationError = 'too-short' | 'too-long' | 'invalid-format' | 'reserved'

export function validateSubdomain(slug: string): SubdomainValidationError | null {
  if (slug.length < 3) return 'too-short'
  if (slug.length > 32) return 'too-long'
  if (!SUBDOMAIN_RE.test(slug)) return 'invalid-format'
  if (RESERVED_SUBDOMAINS.has(slug)) return 'reserved'
  return null
}

/**
 * Public mirror — exactly what visitors of <slug>.solborn.xyz need to render
 * the product page without access to the original local store. Mirrors are
 * deliberately a SUBSET of the agent+project graph (no XP, no streaks, no
 * private trainer wallets) so we don't leak personal usage data.
 */
export interface ProductMirror {
  /** When this snapshot was pushed by the owner. */
  syncedAt: number
  /** Agent snapshot for header (name, emoji, stage, personality + traits). */
  agent: {
    id: string
    name: string
    emoji: string
    stage: ForgeAgent['stage']
    xp: number
    personality: string
    traits: ForgeAgent['traits']
    totalInteractions: number
    createdAt: number
    walletAddress?: string
  }
  /** Project snapshot — same shape as GeneratedProject minus owner-only bits. */
  project: GeneratedProject
}

let cached: Redis | null = null

/**
 * Lazy singleton. Throws if env vars are missing — callers should guard with
 * isRedisConfigured() and degrade gracefully (subdomain feature simply won't
 * work, but the rest of the app keeps running).
 */
export function getRedis(): Redis {
  if (cached) return cached
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    throw new Error('Upstash Redis env vars are missing')
  }
  cached = new Redis({ url, token })
  return cached
}

export function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

const ownerKey = (slug: string) => `subdomain:owner:${slug}`
const mirrorKey = (slug: string) => `subdomain:mirror:${slug}`

/**
 * Sorted set indexing every claimed slug by its claim timestamp.
 * Score = claimedAt ms, Member = slug.
 *
 * Used by /discover to list recently-claimed subdomains without scanning
 * every key. The score never changes after the initial claim, so the
 * order is "newest claims first" — not "newest edits first". That's
 * deliberate: a creator tweaking copy daily shouldn't keep monopolising
 * the top of the feed.
 */
export const SUBDOMAINS_INDEX_KEY = 'subdomains:index'

/**
 * Read the public mirror by subdomain. Returns null if no claim exists or
 * the mirror was deleted.
 */
export async function getProductMirror(slug: string): Promise<ProductMirror | null> {
  const redis = getRedis()
  const raw = await redis.get<ProductMirror | string>(mirrorKey(slug))
  if (!raw) return null
  // @upstash/redis auto-deserialises JSON when stored via .set(...) with an
  // object. But if someone writes a stringified payload manually we still want
  // to handle it gracefully.
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as ProductMirror
    } catch {
      return null
    }
  }
  return raw
}

/**
 * Atomically claim a subdomain for an owner wallet. Returns false if the
 * slug is already owned by someone else (caller surfaces "taken"). The
 * mirror itself is written separately by setProductMirror so the two
 * operations stay independent — a claim without a synced mirror still
 * resolves but renders an "in progress" placeholder.
 *
 * On successful claim we also ZADD the slug to the recency index so
 * /discover picks it up. The order of operations matters: SETNX first
 * (atomic claim), then ZADD (best-effort index update). If ZADD fails
 * the slug is still claimed, just won't show in /discover until an ops
 * script rebuilds the index.
 */
export async function claimSubdomain(slug: string, ownerWallet: string): Promise<boolean> {
  const redis = getRedis()
  // SET with NX = only set if key doesn't exist. Returns "OK" on success, null otherwise.
  const result = await redis.set(ownerKey(slug), ownerWallet, { nx: true })
  if (result !== 'OK') return false
  try {
    await redis.zadd(SUBDOMAINS_INDEX_KEY, { score: Date.now(), member: slug })
  } catch (e) {
    console.warn('[redis] zadd to subdomain index failed', e instanceof Error ? e.message : e)
  }
  return true
}

/**
 * Look up the owner of a slug. Used by /api/subdomain/sync to verify the
 * caller is the rightful claimer before overwriting their mirror.
 */
export async function getSubdomainOwner(slug: string): Promise<string | null> {
  const redis = getRedis()
  return redis.get<string>(ownerKey(slug))
}

/**
 * Write or overwrite a mirror. Caller MUST have verified ownership first.
 */
export async function setProductMirror(slug: string, mirror: ProductMirror): Promise<void> {
  const redis = getRedis()
  await redis.set(mirrorKey(slug), mirror)
}

/**
 * Release a subdomain — frees the slug for someone else to claim. Currently
 * unused in the UI but kept for ops scripts and tests.
 */
export async function releaseSubdomain(slug: string): Promise<void> {
  const redis = getRedis()
  await redis.del(ownerKey(slug), mirrorKey(slug))
  try {
    await redis.zrem(SUBDOMAINS_INDEX_KEY, slug)
  } catch (e) {
    console.warn('[redis] zrem from subdomain index failed', e instanceof Error ? e.message : e)
  }
}

/**
 * Return up to `limit` most-recently-claimed subdomain slugs starting at
 * `offset` (oldest of the page). Used by /discover for paginated listing.
 *
 * ZREVRANGE returns highest-score members first, so we get newest claims
 * at the top with no extra sorting work on the page side.
 */
export async function listRecentSubdomains(
  limit: number,
  offset = 0
): Promise<string[]> {
  const redis = getRedis()
  // upstash @1.x returns string[] for zrange with rev=true
  const items = await redis.zrange<string[]>(
    SUBDOMAINS_INDEX_KEY,
    offset,
    offset + limit - 1,
    { rev: true }
  )
  return Array.isArray(items) ? items : []
}

/**
 * Total number of claimed subdomains. Cached at the call site if needed —
 * we keep the helper itself simple (one Redis round-trip).
 */
export async function countSubdomains(): Promise<number> {
  const redis = getRedis()
  return redis.zcard(SUBDOMAINS_INDEX_KEY)
}

/**
 * Batch-fetch mirrors for a list of slugs. Used after listRecentSubdomains
 * to populate the /discover grid in a single round-trip.
 *
 * Returns mirrors aligned to the input order — missing entries (the slug
 * was released between index read and mirror read) map to null and the
 * caller filters them out.
 */
export async function getProductMirrorsBatch(
  slugs: string[]
): Promise<(ProductMirror | null)[]> {
  if (slugs.length === 0) return []
  const redis = getRedis()
  const pipeline = redis.pipeline()
  for (const slug of slugs) pipeline.get<ProductMirror | string>(mirrorKey(slug))
  const results = await pipeline.exec<(ProductMirror | string | null)[]>()
  return results.map((raw) => {
    if (!raw) return null
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as ProductMirror
      } catch {
        return null
      }
    }
    return raw
  })
}
