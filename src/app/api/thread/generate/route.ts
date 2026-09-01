/**
 * /api/thread/generate — AI-generated X/Twitter launch thread for a memecoin.
 *
 *   POST { agentId, projectId, agent, project }
 *   →    { tweets: string[], hashtags: string[], generatedAt: number }
 *   →    { error: ... }
 *
 * Rate-limited per agent (60s cooldown) like /api/landing/generate so
 * we don't burn LLM credits on button-mashing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { buildThreadPrompt } from '@/lib/ai/thread-prompt'
import type { ForgeAgent, GeneratedProject, LaunchTweetThread } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY ?? '' })
// Qwen 3.8-27b for the same reason as landing/generate: non-reasoning
// model that returns JSON within our 30s budget. gpt-oss-120b was
// timing out at 504 because reasoning ate the whole window.
const PRIMARY_MODEL = 'qwen/qwen3.8-27b'

const COOLDOWN_MS = 60_000
const lastRunAt = new Map<string, number>()
function rateLimit(agentId: string): { ok: true } | { ok: false; retryInMs: number } {
  const now = Date.now()
  const prev = lastRunAt.get(agentId)
  if (prev && now - prev < COOLDOWN_MS) {
    return { ok: false, retryInMs: COOLDOWN_MS - (now - prev) }
  }
  lastRunAt.set(agentId, now)
  if (lastRunAt.size > 5000) {
    const cutoff = now - COOLDOWN_MS
    for (const [k, t] of lastRunAt) if (t < cutoff) lastRunAt.delete(k)
  }
  return { ok: true }
}

interface Body {
  agentId: string
  projectId: string
  agent: ForgeAgent
  project: GeneratedProject
}

function bad(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, ...extra }, { status })
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return bad('invalid-json')
  }

  const { agentId, projectId, agent, project } = body
  if (!agentId || !projectId) return bad('missing-fields')
  if (!agent || !project) return bad('missing-context')

  if (!process.env.GROQ_API_KEY) return bad('missing-key', 503)

  const rl = rateLimit(agentId)
  if (!rl.ok) return bad('rate-limited', 429, { retryInMs: rl.retryInMs })

  const prompt = buildThreadPrompt(project, agent)

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
    console.error('[thread/generate] llm failed', e instanceof Error ? e.message : e)
    return bad('llm-failed', 502)
  }

  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/, '')
    .trim()

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(stripped)
  } catch {
    try {
      const retry = await runOnce(
        'Your previous answer was not valid JSON. Output ONLY a JSON object starting with { and ending with }. No prose. No code fence.'
      )
      parsedJson = JSON.parse(
        retry.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim()
      )
    } catch {
      return bad('llm-bad-json', 502)
    }
  }

  const thread = normaliseThread(parsedJson)
  if (!thread) return bad('shape-invalid', 502)
  return NextResponse.json(thread)
}

function normaliseThread(input: unknown): LaunchTweetThread | null {
  if (!input || typeof input !== 'object') return null
  const obj = input as Record<string, unknown>

  const tweetsRaw = Array.isArray(obj.tweets) ? obj.tweets : []
  const tweets = tweetsRaw
    .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    .map((t) => {
      // Hard-trim to 280 chars in case the model overshoots.
      const trimmed = t.trim().replace(/\s+/g, ' ')
      return trimmed.length > 280 ? trimmed.slice(0, 277) + '...' : trimmed
    })

  if (tweets.length === 0) return null

  // Pad to 7 if model gave fewer — duplicates last tweet to keep render stable.
  while (tweets.length < 7) tweets.push(tweets[tweets.length - 1])
  // Cap to 7 if model gave more.
  const tweetsOut = tweets.slice(0, 7)

  const hashtagsRaw = Array.isArray(obj.hashtags) ? obj.hashtags : []
  const hashtags = hashtagsRaw
    .filter((h): h is string => typeof h === 'string' && h.trim().length > 0)
    .map((h) => h.trim().replace(/^#/, '').toLowerCase())
    .slice(0, 3)

  return { tweets: tweetsOut, hashtags, generatedAt: Date.now() }
}
