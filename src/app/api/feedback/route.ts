/**
 * Feedback collection endpoint.
 *
 * Right now this writes structured JSON to stdout — Vercel's log drains can
 * ship it to any data sink (Logtail, Axiom, Datadog, a Supabase table, etc.)
 * without us having to commit to one provider in week 1.
 *
 * Later (Phase 8+) we'll wire this to Upstash Redis or Supabase so we can:
 *   - build a private "training set" of (prompt, response, rating) triples
 *   - quarterly review downvoted answers to find systematic failure modes
 *   - reward the top trainers (highest-quality feedback volume) in the
 *     trainer royalty airdrop
 *
 * Safety:
 *   - wallet is optional; a user can submit feedback without connecting
 *   - no PII beyond the optional comment string (we never ask for email)
 *   - rate-limited per IP at the edge (1 req/s) to discourage spam
 */
import { NextResponse } from 'next/server'

export const runtime = 'edge'

interface FeedbackBody {
  agentId?: string
  agentStage?: string
  messageId?: string
  userMessage?: string
  assistantMessage?: string
  rating: 'up' | 'down'
  comment?: string
  trainerWallet?: string | null
  source?: string // 'chat' | 'support-banner' | 'blink' | ...
}

// Naive in-memory rate limit (edge runtime: per-region, good enough for MVP).
const lastHit = new Map<string, number>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const prev = lastHit.get(ip) ?? 0
  if (now - prev < 1000) return true
  lastHit.set(ip, now)
  return false
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown'

    if (rateLimited(ip)) {
      return NextResponse.json({ ok: false, error: 'rate-limited' }, { status: 429 })
    }

    const body = (await req.json()) as FeedbackBody
    if (!body || (body.rating !== 'up' && body.rating !== 'down')) {
      return NextResponse.json({ ok: false, error: 'invalid rating' }, { status: 400 })
    }

    // Truncate long fields defensively (a malicious client could send megabytes).
    const trim = (s?: string, n = 2000) =>
      typeof s === 'string' ? s.slice(0, n) : undefined

    const record = {
      type: 'solborn.feedback.v1',
      ts: new Date().toISOString(),
      ip: ip.slice(0, 64),
      agentId: trim(body.agentId, 64),
      agentStage: trim(body.agentStage, 16),
      messageId: trim(body.messageId, 64),
      rating: body.rating,
      comment: trim(body.comment, 500),
      userMessage: trim(body.userMessage, 500),
      assistantMessage: trim(body.assistantMessage, 2000),
      trainerWallet: trim(body.trainerWallet ?? undefined, 64),
      source: trim(body.source, 32) ?? 'chat',
    }

    // Structured single-line JSON = parseable by any log drain.
    console.log(JSON.stringify(record))

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
