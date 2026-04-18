import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { NextRequest } from 'next/server'
import { after } from 'next/server'
import { buildSystemPrompt } from '@/lib/ai/prompts'
import {
  retrieveMemories,
  getUserProfile,
  formatMemoryContext,
  extractFacts,
  storeFacts,
  refreshUserProfile,
  isMemoryEnabled,
} from '@/lib/ai/memory'
import type { ForgeAgent } from '@/lib/types'

export const maxDuration = 30
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY ?? '',
})

const PRIMARY_MODEL = 'llama-3.3-70b-versatile'
const FALLBACK_MODEL = 'llama-3.1-8b-instant'

type ChatMsg = { role: 'user' | 'assistant'; content: string }

function sanitizeMessages(messages: ChatMsg[]): ChatMsg[] {
  const cleaned = messages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: m.content.slice(0, 4000),
    }))

  // Collapse consecutive same-role (Groq requires alternating)
  const collapsed: ChatMsg[] = []
  for (const m of cleaned) {
    const last = collapsed[collapsed.length - 1]
    if (last && last.role === m.role) {
      last.content = `${last.content}\n\n${m.content}`
    } else {
      collapsed.push({ ...m })
    }
  }

  return collapsed.slice(-20)
}

export async function POST(req: NextRequest) {
  let agent: ForgeAgent
  let rawMessages: ChatMsg[]
  try {
    const body = (await req.json()) as { agent: ForgeAgent; messages: ChatMsg[] }
    agent = body.agent
    rawMessages = body.messages ?? []
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!process.env.GROQ_API_KEY) {
    console.error('[chat] GROQ_API_KEY missing')
    return new Response('AI not configured', { status: 500 })
  }

  const messages = sanitizeMessages(rawMessages)

  if (messages.length === 0) {
    return new Response('No messages', { status: 400 })
  }
  if (messages[messages.length - 1].role !== 'user') {
    return new Response('Last message must be from user', { status: 400 })
  }

  const lastUserMessage = messages[messages.length - 1].content
  const walletAddress = agent.walletAddress ?? null

  // ── Memory retrieval (non-blocking fallback if disabled) ──
  let memoryContext = ''
  if (isMemoryEnabled()) {
    try {
      const [memories, profile] = await Promise.all([
        retrieveMemories({ agentId: agent.id, query: lastUserMessage, topK: 5 }),
        walletAddress
          ? getUserProfile(agent.id, walletAddress)
          : Promise.resolve(null),
      ])
      memoryContext = formatMemoryContext(memories, profile)
    } catch (e) {
      console.warn('[chat] memory retrieve failed:', e instanceof Error ? e.message : e)
    }
  }

  const systemPrompt = buildSystemPrompt(agent, memoryContext)

  async function runStream(modelId: string) {
    return streamText({
      model: groq(modelId),
      system: systemPrompt,
      messages,
      temperature: 0.85,
      maxOutputTokens: 500,
      abortSignal: req.signal,
      onFinish: ({ text }) => {
        // ── Background: extract & store facts after stream completes ──
        // `after()` lets this run on Vercel past the response being sent.
        if (!isMemoryEnabled() || !text || text.length < 20) return
        after(async () => {
          try {
            const facts = await extractFacts(lastUserMessage, text)
            if (facts.length === 0) return
            await storeFacts({
              agentId: agent.id,
              walletAddress,
              facts,
            })
            if (walletAddress) {
              await refreshUserProfile({
                agentId: agent.id,
                walletAddress,
                newFacts: facts,
              })
            }
          } catch (e) {
            console.warn('[chat] background memory write failed:', e instanceof Error ? e.message : e)
          }
        })
      },
    })
  }

  try {
    const result = await runStream(PRIMARY_MODEL)
    return result.toTextStreamResponse({
      headers: { 'X-Model': PRIMARY_MODEL, 'X-Memory': isMemoryEnabled() ? '1' : '0' },
    })
  } catch (e) {
    console.error('[chat] primary failed, fallback:', e)
    try {
      const result = await runStream(FALLBACK_MODEL)
      return result.toTextStreamResponse({
        headers: { 'X-Model': FALLBACK_MODEL, 'X-Fallback': '1' },
      })
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : 'Unknown AI error'
      console.error('[chat] fallback failed:', msg)
      return new Response(`AI unavailable: ${msg}`, { status: 503 })
    }
  }
}
