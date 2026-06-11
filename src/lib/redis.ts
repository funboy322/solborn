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
 */
export async function claimSubdomain(slug: string, ownerWallet: string): Promise<boolean> {
  const redis = getRedis()
  // SET with NX = only set if key doesn't exist. Returns "OK" on success, null otherwise.
  const result = await redis.set(ownerKey(slug), ownerWallet, { nx: true })
  return result === 'OK'
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
}
