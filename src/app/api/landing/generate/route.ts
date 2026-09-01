/**
 * /api/landing/generate — "generate landing page" endpoint.
 *
 *   POST { agentId, projectId, agent, project, walletAddress? }
 *   →    LandingContent JSON on success
 *   →    { error: 'rate-limited' | 'llm-failed' | 'llm-bad-json'
 *                | 'shape-invalid' | 'missing-key' | ... }
 *
 * Free mode (v2): no on-chain payment required, no tx verification.
 * Abuse is limited only by a simple per-agent rate limit (1 generation
 * per 60 seconds). When we add paid generations back, the route will
 * accept an optional txSignature and re-introduce the on-chain checks.
 *
 * Flow:
 *   1. Validate body.
 *   2. Per-agent rate limit (in-memory Map, 60s cooldown).
 *   3. Call Groq llama-3.3-70b. One retry on JSON parse failure with a
 *      stricter reminder. After two failed parses → 502.
 *   4. Shape-validate (exactly 4 features / 4 steps / 4 FAQ; if model
 *      returned 3 or 5, slice/pad rather than throwing the request away).
 *   5. Stamp generatedAt + an empty txSignature, return.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { buildLandingPrompt } from '@/lib/ai/landing-prompt'
import type {
  ForgeAgent,
  GeneratedProject,
  LandingContent,
  LandingFaqItem,
  LandingStep,
  TokenomicsRow,
} from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY ?? '' })
// Groq deprecated llama-3.3-70b-versatile in 2026. gpt-oss-120b is the
// direct replacement for high-quality JSON generation on this tier.
const PRIMARY_MODEL = 'openai/gpt-oss-120b'

// ── in-memory per-agent rate limit (cooldown 60s) ──────────────────────────
const COOLDOWN_MS = 60_000
const lastGenerateAt = new Map<string, number>()
function checkAndStampRateLimit(agentId: string): { ok: true } | { ok: false; retryInMs: number } {
  const now = Date.now()
  const previous = lastGenerateAt.get(agentId)
  if (previous && now - previous < COOLDOWN_MS) {
    return { ok: false, retryInMs: COOLDOWN_MS - (now - previous) }
  }
  lastGenerateAt.set(agentId, now)
  // Lightweight pruning so the map doesn't grow forever.
  if (lastGenerateAt.size > 5000) {
    const cutoff = now - COOLDOWN_MS
    for (const [k, t] of lastGenerateAt) {
      if (t < cutoff) lastGenerateAt.delete(k)
    }
  }
  return { ok: true }
}

interface Body {
  agentId: string
  projectId: string
  agent: ForgeAgent
  project: GeneratedProject
  walletAddress?: string | null
}

function badRequest(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, ...extra }, { status })
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return badRequest('invalid-json')
  }

  const { agentId, projectId, agent, project } = body
  if (!agentId || !projectId) return badRequest('missing-fields')
  if (!agent || !project) return badRequest('missing-context')

  if (!process.env.GROQ_API_KEY) {
    return badRequest('missing-key', 503)
  }

  // ── Rate limit (per agent, 60s cooldown) ─────────────────────────────────
  const limit = checkAndStampRateLimit(agentId)
  if (!limit.ok) {
    return badRequest('rate-limited', 429, { retryInMs: limit.retryInMs })
  }

  // ── LLM call ─────────────────────────────────────────────────────────────
  const prompt = buildLandingPrompt(project, agent)

  async function runOnce(extra = ''): Promise<string> {
    const { text } = await generateText({
      model: groq(PRIMARY_MODEL),
      prompt: extra ? `${prompt}\n\n${extra}` : prompt,
      temperature: 0.85,
      maxOutputTokens: 1400,
    })
    return text
  }

  let raw: string
  try {
    raw = await runOnce()
  } catch (e) {
    console.error('[landing/generate] llm failed', e instanceof Error ? e.message : e)
    return badRequest('llm-failed', 502)
  }

  // Strip a code fence if the model wrapped the JSON despite instructions.
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/, '')
    .trim()

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(stripped)
  } catch {
    // One retry with stricter reminder.
    try {
      const retryRaw = await runOnce(
        'Your previous answer was not valid JSON. Output ONLY a JSON object starting with { and ending with }. No prose. No code fence.'
      )
      const retryStripped = retryRaw
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/, '')
        .trim()
      parsedJson = JSON.parse(retryStripped)
    } catch {
      return badRequest('llm-bad-json', 502)
    }
  }

  // Free mode: no tx signature, use an empty marker so the type stays happy.
  const landing = normaliseLanding(parsedJson, '')
  if (!landing) {
    return badRequest('shape-invalid', 502)
  }

  return NextResponse.json(landing)
}

// ── Shape validation + best-effort repair ───────────────────────────────────
function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v.trim() : fallback
}

function clampArray<T>(arr: T[], pad: T, target = 4): T[] {
  if (arr.length === target) return arr
  if (arr.length > target) return arr.slice(0, target)
  return [...arr, ...Array<T>(target - arr.length).fill(pad)]
}

function normaliseLanding(input: unknown, txSignature: string): LandingContent | null {
  if (!input || typeof input !== 'object') return null
  const obj = input as Record<string, unknown>

  const hero = (obj.hero ?? {}) as Record<string, unknown>
  const heroOut = {
    headline: asString(hero.headline),
    subhead: asString(hero.subhead),
    ctaText: asString(hero.ctaText, 'Get started'),
    ...(typeof hero.ctaHref === 'string' && hero.ctaHref.trim()
      ? { ctaHref: hero.ctaHref.trim() }
      : {}),
  }
  if (!heroOut.headline) return null

  // Memecoin pivot blocks — generated by the new prompt.
  const loreRaw = Array.isArray(obj.lore) ? obj.lore : []
  const lore = loreRaw
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .map((p) => p.trim())
  const loreOut = lore.length > 0 ? clampArray(lore, '...', 3) : undefined

  const tokenomicsRaw = Array.isArray(obj.tokenomics) ? obj.tokenomics : []
  const tokenomics: TokenomicsRow[] = tokenomicsRaw
    .filter((t): t is Record<string, unknown> => !!t && typeof t === 'object')
    .map((t) => ({
      label: asString(t.label, 'Spec'),
      value: asString(t.value, '—'),
    }))
  const tokenomicsOut =
    tokenomics.length > 0
      ? clampArray(tokenomics, { label: 'Spec', value: '—' })
      : undefined

  const howToBuyRaw = Array.isArray(obj.howToBuy) ? obj.howToBuy : []
  const howToBuySteps: LandingStep[] = howToBuyRaw
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
    .map((s, i) => ({
      stepNumber: typeof s.stepNumber === 'number' ? s.stepNumber : i + 1,
      title: asString(s.title, `Step ${i + 1}`),
      body: asString(s.body, ''),
    }))
  const howToBuyOut =
    howToBuySteps.length > 0
      ? clampArray(howToBuySteps, { stepNumber: 0, title: 'Step', body: '' }).map(
          (s, i) => ({ ...s, stepNumber: i + 1 })
        )
      : undefined

  const faqRaw = Array.isArray(obj.faq) ? obj.faq : []
  const faq: LandingFaqItem[] = faqRaw
    .filter((q): q is Record<string, unknown> => !!q && typeof q === 'object')
    .map((q) => ({
      question: asString(q.question, 'Question'),
      answer: asString(q.answer, ''),
    }))
  const faqOut = clampArray(faq, { question: 'Question', answer: '' })

  const cta = (obj.cta ?? {}) as Record<string, unknown>
  const ctaOut = {
    headline: asString(cta.headline, 'Ready when you are'),
    ...(typeof cta.subhead === 'string' && cta.subhead.trim()
      ? { subhead: cta.subhead.trim() }
      : {}),
    buttonText: asString(cta.buttonText, 'Get started'),
    ...(typeof cta.href === 'string' && cta.href.trim()
      ? { href: cta.href.trim() }
      : {}),
  }

  const riskDisclosure =
    typeof obj.riskDisclosure === 'string' && obj.riskDisclosure.trim()
      ? obj.riskDisclosure.trim()
      : 'Memecoin. Not financial advice. Only trade what you can afford to lose.'

  return {
    hero: heroOut,
    ...(loreOut ? { lore: loreOut } : {}),
    ...(tokenomicsOut ? { tokenomics: tokenomicsOut } : {}),
    ...(howToBuyOut ? { howToBuy: howToBuyOut } : {}),
    faq: faqOut,
    cta: ctaOut,
    riskDisclosure,
    generatedAt: Date.now(),
    txSignature,
  }
}
