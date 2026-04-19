/**
 * Register a newly-born agent in the global registry.
 * Idempotent: calling twice with the same id does not inflate the counter.
 */
import { NextResponse } from 'next/server'
import { Index } from '@upstash/vector'

export const runtime = 'nodejs'
const REGISTRY_NAMESPACE = 'agents-registry'

interface Body {
  agentId?: string
  name?: string
  emoji?: string
  wallet?: string | null
}

export async function POST(req: Request) {
  const url = process.env.UPSTASH_VECTOR_REST_URL
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN
  if (!url || !token) {
    return NextResponse.json({ ok: false, error: 'storage unavailable' }, { status: 503 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }

  if (!body.agentId || body.agentId.length > 64) {
    return NextResponse.json({ ok: false, error: 'invalid agentId' }, { status: 400 })
  }

  const index = new Index({ url, token })
  try {
    await index.upsert(
      {
        id: body.agentId,
        // Auto-embeds via BGE-M3 — cheap; we only need a vector to exist.
        // We include name + emoji so the registry is also a human-readable
        // roll call if we ever want to list-all agents later.
        data: `${body.emoji ?? '🤖'} ${body.name ?? 'unnamed'}`,
        metadata: {
          name: (body.name ?? '').slice(0, 64),
          emoji: (body.emoji ?? '').slice(0, 16),
          wallet: (body.wallet ?? '').slice(0, 64),
          createdAt: Date.now(),
        },
      },
      { namespace: REGISTRY_NAMESPACE },
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    console.warn('[stats/birth] upsert failed:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
