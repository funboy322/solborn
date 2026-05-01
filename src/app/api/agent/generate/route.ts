import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { buildGenerateProjectPrompt } from '@/lib/ai/prompts'
import type { ForgeAgent, GeneratedProject, BlinkSpec, ProductBrief, MembershipOffer } from '@/lib/types'
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

function cleanText(value: unknown, fallback: string, max = 220): string {
  const text = typeof value === 'string' && value.trim() ? value.trim() : fallback
  return text.replace(/\s+/g, ' ').slice(0, max)
}

function cleanList(value: unknown, fallback: string[], max = 4): string[] {
  const items = Array.isArray(value)
    ? value.map((item) => cleanText(item, '', 120)).filter(Boolean)
    : []
  return (items.length ? items : fallback).slice(0, max)
}

function safeBrief(raw: unknown, projectName: string): ProductBrief {
  const r = (raw ?? {}) as Partial<ProductBrief>
  return {
    targetUser: cleanText(r.targetUser, 'Solana builders who need a faster way to turn rough ideas into launchable product pages.'),
    problem: cleanText(r.problem, 'Most early projects cannot explain who they serve, what they build first, or why the wallet layer matters.'),
    solution: cleanText(r.solution, `${projectName} turns the founder's interview answers into a focused product brief and launch page.`),
    mvp: cleanText(r.mvp, 'A public product page, access pass, and launch proof that can be shown to early users.'),
    solanaAngle: cleanText(r.solanaAngle, 'Wallet identity, token access, and signed launch proofs make each project verifiable from day one.'),
    pricing: cleanText(r.pricing, 'A simple monthly access pass for early supporters and beta users.'),
    launchPlan: cleanList(r.launchPlan, [
      'Create the product page from the founder interview',
      'Publish a signed launch certificate',
      'Invite early users to request access',
    ]),
  }
}

function safeMembership(raw: unknown, projectName: string): MembershipOffer {
  const r = (raw ?? {}) as Partial<MembershipOffer>
  const priceUsd = Number(r.priceUsd)
  const durationDays = Number(r.durationDays)
  return {
    title: cleanText(r.title, `${projectName} Access Pass`, 60),
    priceUsd: Number.isFinite(priceUsd) && priceUsd > 0 && priceUsd < 1000 ? Math.round(priceUsd) : 9,
    durationDays: Number.isFinite(durationDays) && durationDays > 0 && durationDays <= 365 ? Math.round(durationDays) : 30,
    benefits: cleanList(r.benefits, [
      'Early product access',
      'Founder updates',
      'Priority feedback loop',
    ]),
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

  // Build a readable conversation summary from stored messages (last 30 exchanges)
  const storedMessages = Array.isArray(agent.messages) ? agent.messages : []
  const chatSummary = storedMessages.length > 0
    ? storedMessages
        .slice(-30)
        .map((m) => `${m.role === 'user' ? 'Human' : 'Agent'}: ${m.content}`)
        .join('\n')
    : undefined

  const prompt = buildGenerateProjectPrompt(agent, chatSummary)

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
    tagline: typeof raw.tagline === 'string' && raw.tagline.trim()
      ? raw.tagline.trim().replace(/\s+/g, ' ').slice(0, 120)
      : undefined,
    description: String(raw.description ?? '').slice(0, 500),
    techStack: Array.isArray(raw.techStack)
      ? raw.techStack.map(String).slice(0, 10)
      : ['@solana/web3.js', 'Anchor'],
    codeSnippet: '',
    solanaProgram: typeof raw.solanaProgram === 'string' ? raw.solanaProgram : undefined,
    brief: safeBrief(raw.brief, String(raw.name ?? `${agent.name}'s Project`).slice(0, 60)),
    membership: safeMembership(raw.membership, String(raw.name ?? `${agent.name}'s Project`).slice(0, 60)),
    blink: safeBlink(raw.blink, agent.name),
  }

  return NextResponse.json({ project })
}
