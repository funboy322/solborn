/**
 * Global SolBorn stats.
 *
 *   GET  /api/stats         → { total }   — how many agents ever created
 *   POST /api/stats/birth   → { total }   — register a new agent (idempotent)
 *
 * Storage: Upstash Vector (already configured for memory). We keep a
 * dedicated namespace "agents-registry" where each agent is a single vector
 * keyed by agent id. Vector.info() gives us the namespace count for free.
 *
 * Why not add Upstash Redis / KV? Because we already have one backing store
 * and the registry is tiny (one small vector per agent, never queried
 * semantically — just counted). Zero new env vars.
 *
 * Idempotency: upsert with the same id is a no-op on the counter, so a
 * user double-clicking "Birth" can't inflate the number.
 */
import { NextResponse } from 'next/server'
import { Index } from '@upstash/vector'

export const runtime = 'nodejs'

const REGISTRY_NAMESPACE = 'agents-registry'

function getIndex(): Index | null {
  const url = process.env.UPSTASH_VECTOR_REST_URL
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN
  if (!url || !token) return null
  return new Index({ url, token })
}

async function readTotal(): Promise<number> {
  const index = getIndex()
  if (!index) return 0
  try {
    const info = await index.info()
    // Upstash SDK exposes per-namespace counts on .namespaces
    const ns = (info as unknown as { namespaces?: Record<string, { vectorCount?: number }> })
      .namespaces
    const count = ns?.[REGISTRY_NAMESPACE]?.vectorCount ?? 0
    return Math.max(0, count)
  } catch (err) {
    console.warn('[stats] info() failed:', err)
    return 0
  }
}

export async function GET() {
  const total = await readTotal()
  return NextResponse.json(
    { total },
    {
      headers: {
        // Cache at the edge for 30s to shield Upstash from traffic bursts
        // while still feeling live on the landing page.
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    },
  )
}
