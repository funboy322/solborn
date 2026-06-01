/**
 * /api/landing/generate — Pro "generate landing page" endpoint.
 *
 *   POST { agentId, projectId, txSignature, walletAddress }
 *   →    LandingContent JSON on success
 *   →    { error: 'replay' | 'tx-not-found' | 'tx-recipient' | 'tx-amount'
 *                | 'tx-sender' | 'tx-stale' | 'llm-failed' | 'shape-invalid'
 *                | 'rpc-error' | 'missing-key' | ... }
 *
 * Flow:
 *   1. Validate body shape + addresses.
 *   2. Anti-replay: in-memory LRU of used signatures (1000 cap). Marks the
 *      signature USED immediately to prevent races; on any subsequent
 *      verification failure we remove it so the user isn't punished for
 *      a flake (they can retry that same sig).
 *   3. Verify the tx on mainnet via @solana/web3.js getParsedTransaction:
 *      - confirmed/finalized status
 *      - recipient = LANDING_RECIPIENT (publisher wallet)
 *      - lamports transferred >= 0.05 SOL
 *      - sender = walletAddress
 *      - block timestamp within last 24h
 *   4. Build LLM prompt + call Groq llama-3.3-70b. One retry on JSON parse
 *      failure with a stricter reminder. After two failed parses → 502.
 *   5. Shape-validate (exactly 4 features / 4 steps / 4 FAQ; if model
 *      returned 3 or 5, slice/pad with neutral placeholders rather than
 *      throwing the user's 0.05 SOL away).
 *   6. Stamp generatedAt + txSignature, return.
 *
 * Anti-replay is in-memory only (resets on Lambda cold start). For v1 that
 * is acceptable: worst case an attacker re-uses one tx during a single
 * cold-start window, getting one extra generation. Durable replay
 * protection is a future Upstash Redis sprint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { buildLandingPrompt } from '@/lib/ai/landing-prompt'
import type {
  ForgeAgent,
  GeneratedProject,
  LandingContent,
  LandingFaqItem,
  LandingFeature,
  LandingStep,
} from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const LANDING_RECIPIENT = new PublicKey('AKpZ68kWBf6htCBE8Vz1WVJN1Kg5adXtuUwsoVidMDoj')
const LANDING_PRICE_LAMPORTS = Math.floor(0.05 * LAMPORTS_PER_SOL)
const MAX_TX_AGE_MS = 24 * 60 * 60 * 1000 // 24h

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY ?? '' })
const PRIMARY_MODEL = 'llama-3.3-70b-versatile'

// ── in-memory anti-replay (per Lambda instance) ─────────────────────────────
const REPLAY_CAP = 1000
const usedSignatures = new Set<string>()
function markUsed(sig: string) {
  if (usedSignatures.size >= REPLAY_CAP) {
    // Drop oldest insertion (Set preserves insertion order).
    const first = usedSignatures.values().next().value
    if (typeof first === 'string') usedSignatures.delete(first)
  }
  usedSignatures.add(sig)
}

function getMainnetConnection(): Connection {
  // NEXT_PUBLIC_HELIUS_RPC_MAINNET overrides the public endpoint when set.
  const rpc = process.env.NEXT_PUBLIC_HELIUS_RPC_MAINNET || clusterApiUrl('mainnet-beta')
  return new Connection(rpc, 'confirmed')
}

interface Body {
  agentId: string
  projectId: string
  txSignature: string
  walletAddress: string
  agent: ForgeAgent
  project: GeneratedProject
}

function badRequest(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

function isBase58Signature(s: string): boolean {
  // Solana signatures are 64 bytes base58 → 86-88 chars typically.
  return /^[1-9A-HJ-NP-Za-km-z]{80,100}$/.test(s)
}

function isBase58Pubkey(s: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return badRequest('invalid-json')
  }

  const { agentId, projectId, txSignature, walletAddress, agent, project } = body
  if (!agentId || !projectId || !txSignature || !walletAddress) return badRequest('missing-fields')
  if (!isBase58Signature(txSignature)) return badRequest('invalid-tx-sig')
  if (!isBase58Pubkey(walletAddress)) return badRequest('invalid-wallet')
  if (!agent || !project) return badRequest('missing-context')

  if (!process.env.GROQ_API_KEY) {
    return badRequest('missing-key', 503)
  }

  // ── Anti-replay (mark eagerly, free on later failure) ────────────────────
  if (usedSignatures.has(txSignature)) {
    return badRequest('replay', 409)
  }
  markUsed(txSignature)

  // Helper to roll back the replay mark if we end up rejecting the tx — the
  // user shouldn't lose retry capacity over a transient issue.
  const release = () => {
    usedSignatures.delete(txSignature)
  }

  // ── On-chain verification ────────────────────────────────────────────────
  const conn = getMainnetConnection()
  let parsed
  try {
    parsed = await conn.getParsedTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    })
  } catch (e) {
    release()
    console.error('[landing/generate] rpc error', e instanceof Error ? e.message : e)
    return badRequest('rpc-error', 502)
  }

  if (!parsed) {
    release()
    return badRequest('tx-not-found', 404)
  }
  if (parsed.meta?.err) {
    release()
    return badRequest('tx-failed', 400)
  }

  // Block timestamp sanity
  const ts = parsed.blockTime ? parsed.blockTime * 1000 : null
  if (ts === null || Date.now() - ts > MAX_TX_AGE_MS) {
    release()
    return badRequest('tx-stale', 400)
  }

  // Inspect SystemProgram.transfer instructions for matching recipient/amount.
  const instructions = parsed.transaction.message.instructions
  let matched = false
  for (const ix of instructions) {
    if (!('parsed' in ix)) continue
    const p = ix.parsed
    if (!p || typeof p !== 'object') continue
    const info = (p as { type?: string; info?: Record<string, unknown> })
    if (info.type !== 'transfer') continue
    const dest = info.info?.destination as string | undefined
    const src = info.info?.source as string | undefined
    const lamports = info.info?.lamports as number | undefined
    if (
      dest === LANDING_RECIPIENT.toBase58() &&
      src === walletAddress &&
      typeof lamports === 'number' &&
      lamports >= LANDING_PRICE_LAMPORTS
    ) {
      matched = true
      break
    }
  }
  if (!matched) {
    release()
    return badRequest('tx-mismatch', 400)
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
    release()
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
      release()
      return badRequest('llm-bad-json', 502)
    }
  }

  const landing = normaliseLanding(parsedJson, txSignature)
  if (!landing) {
    release()
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

  const featuresRaw = Array.isArray(obj.features) ? obj.features : []
  const features: LandingFeature[] = featuresRaw
    .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object')
    .map((f) => ({
      ...(typeof f.icon === 'string' ? { icon: f.icon } : {}),
      title: asString(f.title, 'Feature'),
      body: asString(f.body, 'Details coming soon.'),
    }))
  const featuresOut = clampArray(features, { title: 'Feature', body: 'Details coming soon.' })

  const stepsRaw = Array.isArray(obj.howItWorks) ? obj.howItWorks : []
  const steps: LandingStep[] = stepsRaw
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
    .map((s, i) => ({
      stepNumber: typeof s.stepNumber === 'number' ? s.stepNumber : i + 1,
      title: asString(s.title, `Step ${i + 1}`),
      body: asString(s.body, ''),
    }))
  const stepsOut = clampArray(steps, { stepNumber: 0, title: 'Step', body: '' }).map((s, i) => ({
    ...s,
    stepNumber: i + 1,
  }))

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

  return {
    hero: heroOut,
    features: featuresOut,
    howItWorks: stepsOut,
    faq: faqOut,
    cta: ctaOut,
    generatedAt: Date.now(),
    txSignature,
  }
}
