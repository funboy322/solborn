/**
 * Semantic memory layer for SolBorn agents.
 *
 * Two stores in one Upstash Vector index, separated by metadata:
 *  - kind: "fact"    → something the user taught the agent
 *  - kind: "profile" → condensed profile line about the teacher (per wallet)
 *
 * Upstash handles embeddings server-side (MXBAI_EMBED_LARGE_V1), so we
 * send plain text — no OpenAI embedding call, no cost.
 *
 * Safe-by-default: if env vars are missing, all ops become no-ops and
 * retrieveMemories() returns []. Existing chat keeps working unchanged.
 */
import { Index } from '@upstash/vector'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

// ─────────────────────────── Client ───────────────────────────

let _index: Index | null = null

function getIndex(): Index | null {
  if (_index) return _index
  const url = process.env.UPSTASH_VECTOR_REST_URL
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN
  if (!url || !token) return null
  _index = new Index({ url, token })
  return _index
}

export function isMemoryEnabled(): boolean {
  return getIndex() !== null
}

// ─────────────────────────── Types ────────────────────────────

export interface FactMemory {
  id: string
  agentId: string
  walletAddress: string | null // who taught it
  text: string                 // the fact, one sentence
  topic: string                // e.g. "solana", "defi", "user_personal"
  score?: number               // similarity at retrieval time
  createdAt: number
}

export interface UserProfile {
  walletAddress: string
  summary: string // condensed multi-line profile
  updatedAt: number
}

type StoredMeta = {
  kind: 'fact' | 'profile'
  agentId?: string
  walletAddress?: string
  topic?: string
  text: string
  createdAt: number
}

// ─────────────────────── Fact extraction ──────────────────────

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY ?? '',
})

const EXTRACTION_MODEL = 'llama-3.1-8b-instant' // fast + cheap

const EXTRACTOR_PROMPT = `You extract durable facts from a conversation turn between a human TEACHER and an AI agent being trained.

Output ONLY a compact JSON array. Each item:
  { "text": "<one-sentence fact in English>", "topic": "<short tag>" }

Rules:
- Extract at most 3 facts per turn. Usually 0-1.
- A "fact" is something the agent should remember long-term:
  • what the teacher taught about a concept (Solana, DeFi, coding, startups, etc.)
  • personal info the teacher revealed about themselves ("I'm building a DEX", "I love Rust")
  • a stated preference or goal
- SKIP greetings, filler, repetition, meta-chat, or anything trivially forgettable.
- If nothing is worth remembering, output []
- "topic" tag examples: "solana", "defi", "rust", "user_personal", "startup", "nft", "ai"

Example input:
  USER: "Hey! I'm Alex, building an AMM on Solana. Constant product means x*y=k."
  AGENT: "Oh cool! So x and y are token reserves?"

Example output:
[
  {"text":"The teacher's name is Alex and they are building an AMM on Solana.","topic":"user_personal"},
  {"text":"Constant product AMM formula is x*y=k, where x and y are token reserves.","topic":"defi"}
]

Now extract from the next turn. Output ONLY the JSON array, no prose.`

export async function extractFacts(
  userText: string,
  agentReply: string,
): Promise<Array<{ text: string; topic: string }>> {
  if (!process.env.GROQ_API_KEY) return []
  try {
    const { text } = await generateText({
      model: groq(EXTRACTION_MODEL),
      system: EXTRACTOR_PROMPT,
      prompt: `USER: ${userText.slice(0, 1500)}\nAGENT: ${agentReply.slice(0, 1500)}`,
      temperature: 0.1,
      maxOutputTokens: 400,
    })
    // Sometimes the model wraps JSON in ```json ... ``` — strip.
    const cleaned = text
      .replace(/```(?:json)?/g, '')
      .replace(/```/g, '')
      .trim()
    const start = cleaned.indexOf('[')
    const end = cleaned.lastIndexOf(']')
    if (start === -1 || end === -1) return []
    const parsed = JSON.parse(cleaned.slice(start, end + 1))
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((f) => f && typeof f.text === 'string' && f.text.length > 10 && f.text.length < 500)
      .slice(0, 3)
      .map((f) => ({ text: String(f.text), topic: String(f.topic ?? 'misc').slice(0, 32) }))
  } catch (e) {
    console.warn('[memory] extractFacts failed:', e instanceof Error ? e.message : e)
    return []
  }
}

// ─────────────────────────── Store ────────────────────────────

export async function storeFacts(params: {
  agentId: string
  walletAddress: string | null
  facts: Array<{ text: string; topic: string }>
}): Promise<void> {
  const index = getIndex()
  if (!index || params.facts.length === 0) return
  const now = Date.now()
  const points = params.facts.map((f, i) => ({
    id: `fact:${params.agentId}:${now}:${i}`,
    data: f.text, // Upstash embeds server-side
    metadata: {
      kind: 'fact' as const,
      agentId: params.agentId,
      walletAddress: params.walletAddress ?? '',
      topic: f.topic,
      text: f.text,
      createdAt: now,
    } satisfies StoredMeta,
  }))
  try {
    await index.upsert(points)
  } catch (e) {
    console.warn('[memory] storeFacts failed:', e instanceof Error ? e.message : e)
  }
}

// ─────────────────────────── Retrieve ─────────────────────────

export async function retrieveMemories(params: {
  agentId: string
  query: string
  topK?: number
}): Promise<FactMemory[]> {
  const index = getIndex()
  if (!index || !params.query.trim()) return []
  const topK = params.topK ?? 5
  try {
    const results = await index.query({
      data: params.query.slice(0, 1500),
      topK,
      includeMetadata: true,
      filter: `kind = "fact" AND agentId = "${params.agentId}"`,
    })
    return (results ?? [])
      .map((r) => {
        const meta = (r.metadata ?? {}) as Partial<StoredMeta>
        if (meta.kind !== 'fact' || !meta.text) return null
        const mem: FactMemory = {
          id: String(r.id),
          agentId: String(meta.agentId ?? params.agentId),
          walletAddress: meta.walletAddress ? String(meta.walletAddress) : null,
          text: String(meta.text),
          topic: String(meta.topic ?? 'misc'),
          score: typeof r.score === 'number' ? r.score : undefined,
          createdAt: Number(meta.createdAt ?? 0),
        }
        return mem
      })
      .filter((m): m is FactMemory => m !== null)
  } catch (e) {
    console.warn('[memory] retrieveMemories failed:', e instanceof Error ? e.message : e)
    return []
  }
}

// ───────────────────── User profile (per wallet) ──────────────
// Stored as a single vector per (agentId, wallet) pair — we overwrite on update.

function profileId(agentId: string, wallet: string): string {
  return `profile:${agentId}:${wallet}`
}

export async function getUserProfile(
  agentId: string,
  walletAddress: string,
): Promise<UserProfile | null> {
  const index = getIndex()
  if (!index) return null
  try {
    const res = await index.fetch([profileId(agentId, walletAddress)], {
      includeMetadata: true,
    })
    const hit = res?.[0]
    if (!hit) return null
    const meta = (hit.metadata ?? {}) as Partial<StoredMeta>
    if (meta.kind !== 'profile' || !meta.text) return null
    return {
      walletAddress,
      summary: meta.text,
      updatedAt: Number(meta.createdAt ?? 0),
    }
  } catch (e) {
    console.warn('[memory] getUserProfile failed:', e instanceof Error ? e.message : e)
    return null
  }
}

export async function upsertUserProfile(params: {
  agentId: string
  walletAddress: string
  summary: string
}): Promise<void> {
  const index = getIndex()
  if (!index) return
  const now = Date.now()
  try {
    await index.upsert([
      {
        id: profileId(params.agentId, params.walletAddress),
        data: params.summary,
        metadata: {
          kind: 'profile' as const,
          agentId: params.agentId,
          walletAddress: params.walletAddress,
          text: params.summary,
          createdAt: now,
        } satisfies StoredMeta,
      },
    ])
  } catch (e) {
    console.warn('[memory] upsertUserProfile failed:', e instanceof Error ? e.message : e)
  }
}

/**
 * Merge new facts into an existing profile line.
 * Called in the background after each turn — cheap LLM call that keeps
 * the profile <= ~400 chars so it fits in every system prompt.
 */
export async function refreshUserProfile(params: {
  agentId: string
  walletAddress: string
  newFacts: Array<{ text: string; topic: string }>
}): Promise<void> {
  if (params.newFacts.length === 0) return
  const personalFacts = params.newFacts.filter(
    (f) => f.topic === 'user_personal' || f.topic === 'startup',
  )
  if (personalFacts.length === 0) return

  const existing = await getUserProfile(params.agentId, params.walletAddress)
  const prev = existing?.summary ?? ''

  try {
    const { text } = await generateText({
      model: groq(EXTRACTION_MODEL),
      system:
        'You maintain a concise profile of a person who is training an AI agent. Given the current profile and new facts learned, output an UPDATED profile under 400 characters. Write 2-4 short lines, third person, factual. Output ONLY the profile text, no preamble.',
      prompt: `CURRENT PROFILE:\n${prev || '(empty)'}\n\nNEW FACTS:\n${personalFacts.map((f) => `- ${f.text}`).join('\n')}\n\nUPDATED PROFILE:`,
      temperature: 0.2,
      maxOutputTokens: 200,
    })
    const summary = text.trim().slice(0, 500)
    if (summary.length < 5) return
    await upsertUserProfile({
      agentId: params.agentId,
      walletAddress: params.walletAddress,
      summary,
    })
  } catch (e) {
    console.warn('[memory] refreshUserProfile failed:', e instanceof Error ? e.message : e)
  }
}

// ──────────────── Prompt injection helper ────────────────

export function formatMemoryContext(
  memories: FactMemory[],
  profile: UserProfile | null,
): string {
  const parts: string[] = []
  if (profile?.summary) {
    parts.push(`What you know about the human talking to you:\n${profile.summary}`)
  }
  if (memories.length > 0) {
    const lines = memories.map((m) => `- [${m.topic}] ${m.text}`).join('\n')
    parts.push(`Things you remember from past conversations (use naturally, don't list them back):\n${lines}`)
  }
  return parts.join('\n\n')
}
