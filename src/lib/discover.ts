/**
 * Shared types + server-side helper for the /discover feature.
 *
 * The /discover page imports `getDiscoverPage` directly during SSR so we
 * skip the extra HTTP hop in production. The /api/discover/list route is
 * for client-side pagination / external consumers.
 */

import {
  countSubdomains,
  getProductMirrorsBatch,
  isRedisConfigured,
  listRecentSubdomains,
} from './redis'

export const DEFAULT_PAGE_SIZE = 24
export const MAX_PAGE_SIZE = 48

export interface DiscoverCard {
  subdomain: string
  projectName: string
  tagline: string | null
  description: string
  agentName: string
  agentEmoji: string
  agentStage: 'baby' | 'toddler' | 'teen' | 'adult'
  productUrl?: string
  productUrlVerified?: boolean
  /** True if the AI landing-page generator has been run on this product. */
  hasLanding: boolean
  /** First three tech-stack entries — kept short to fit cards. */
  techStack: string[]
  /** Owner held ≥ SBORN_HOLDER_MIN_TOKENS at last sync time. */
  ownerIsHolder: boolean
}

export interface DiscoverPage {
  /** All items on this page, holders first, then non-holders, then by recency. */
  items: DiscoverCard[]
  /** Subset of items where ownerIsHolder=true. Convenience for "Featured" row. */
  featured: DiscoverCard[]
  /** Subset of items where ownerIsHolder=false. */
  regular: DiscoverCard[]
  nextCursor: number | null
  total: number
  /** True iff Redis isn't configured — caller renders a graceful placeholder. */
  unavailable?: true
}

/**
 * Page-fetcher used by both the SSR page and the API route. Returns an
 * empty page (with unavailable=true) when Redis is not configured so
 * callers can render a friendly "discover is paused" message instead of
 * throwing 5xx errors at unrelated routes that just happen to bundle this.
 */
export async function getDiscoverPage(
  cursor = 0,
  limit = DEFAULT_PAGE_SIZE
): Promise<DiscoverPage> {
  if (!isRedisConfigured()) {
    return { items: [], featured: [], regular: [], nextCursor: null, total: 0, unavailable: true }
  }
  const safeLimit = Math.max(1, Math.min(MAX_PAGE_SIZE, Math.floor(limit)))
  const safeCursor = Math.max(0, Math.floor(cursor))

  // Fetch one extra slug so we can compute nextCursor without a second count call.
  const slugs = await listRecentSubdomains(safeLimit + 1, safeCursor)
  const hasMore = slugs.length > safeLimit
  const visibleSlugs = hasMore ? slugs.slice(0, safeLimit) : slugs

  const total = await countSubdomains()

  const mirrors = await getProductMirrorsBatch(visibleSlugs)

  const rawItems: DiscoverCard[] = []
  for (let i = 0; i < visibleSlugs.length; i++) {
    const slug = visibleSlugs[i]
    const mirror = mirrors[i]
    if (!mirror) continue
    const { agent, project } = mirror
    rawItems.push({
      subdomain: slug,
      projectName: project.name,
      tagline: project.tagline ?? null,
      description: project.description,
      agentName: agent.name,
      agentEmoji: agent.emoji,
      agentStage: agent.stage,
      productUrl: project.productUrl,
      productUrlVerified: project.productUrlVerified,
      hasLanding: Boolean(project.landingContent),
      techStack: project.techStack.slice(0, 3),
      ownerIsHolder: Boolean(mirror.ownerIsHolder),
    })
  }

  // Holders bubble to the top while preserving the underlying recency order
  // within each group. Recency comes from listRecentSubdomains (ZREVRANGE),
  // so we don't need an explicit secondary sort.
  const featured = rawItems.filter((it) => it.ownerIsHolder)
  const regular = rawItems.filter((it) => !it.ownerIsHolder)
  const items = [...featured, ...regular]

  return {
    items,
    featured,
    regular,
    nextCursor: hasMore ? safeCursor + safeLimit : null,
    total,
  }
}
