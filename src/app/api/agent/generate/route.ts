import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { buildGenerateProjectPrompt } from '@/lib/ai/prompts'
import type { ForgeAgent, GeneratedProject, BlinkSpec } from '@/lib/types'
import { nanoid } from '@/lib/utils'

export const maxDuration = 60
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY ?? '' })

const PRIMARY = 'llama-3.3-70b-versatile'
const FALLBACK = 'llama-3.1-8b-instant'

function safeBlink(raw: unknown, agentName: string): BlinkSpec {
  const r = (raw ?? {}) as Partial<BlinkSpec>
  const amounts = Array.isArray(r.amounts)
    ? r.amounts
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n > 0 && n < 100)
        .slice(0, 4)
    : []
  return {
    title: String(r.title ?? `Support ${agentName}`).slice(0, 60),
    description: String(
      r.description ?? `Tip ${agentName}, a SolBorn AI founder who shipped their first project.`,
    ).slice(0, 280),
    cta: String(r.cta ?? `Tip ${agentName}`).slice(0, 40),
    amounts: amounts.length ? amounts : [0.01, 0.05, 0.1],
  }
}

async function runGenerate(modelId: string, prompt: string) {
  return generateText({
    model: groq(modelId),
    prompt,
    temperature: 0.9,
    maxOutputTokens: 1200,
  })
}

export async function POST(req: NextRequest) {
  let agent: ForgeAgent
  try {
    const body = (await req.json()) as { agent: ForgeAgent }
    agent = body.agent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!agent || agent.stage !== 'adult') {
    return NextResponse.json({ error: 'Agent must be Adult stage' }, { status: 400 })
  }
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
  }

  const prompt = buildGenerateProjectPrompt(agent)

  let text: string
  try {
    const res = await runGenerate(PRIMARY, prompt)
    text = res.text
  } catch (e) {
    console.warn('[generate] primary failed:', e instanceof Error ? e.message : e)
    try {
      const res = await runGenerate(FALLBACK, prompt)
      text = res.text
    } catch (e2) {
      console.error('[generate] fallback failed:', e2)
      return NextResponse.json({ error: 'Generation failed' }, { status: 503 })
    }
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return NextResponse.json({ error: 'No JSON in model output' }, { status: 502 })
  }

  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from model' }, { status: 502 })
  }

  const project: GeneratedProject = {
    id: nanoid(),
    name: String(raw.name ?? `${agent.name}'s Project`).slice(0, 60),
    description: String(raw.description ?? '').slice(0, 500),
    techStack: Array.isArray(raw.techStack)
      ? raw.techStack.map(String).slice(0, 10)
      : ['@solana/web3.js', 'Anchor'],
    codeSnippet: '',
    solanaProgram: typeof raw.solanaProgram === 'string' ? raw.solanaProgram : undefined,
    blink: safeBlink(raw.blink, agent.name),
  }

  return NextResponse.json({ project })
}
