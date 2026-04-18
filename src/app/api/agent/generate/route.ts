import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { buildGenerateProjectPrompt } from '@/lib/ai/prompts'
import type { ForgeAgent, GeneratedProject } from '@/lib/types'
import { nanoid } from '@/lib/utils'

export const maxDuration = 60

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY ?? '',
})

export async function POST(req: NextRequest) {
  const { agent } = await req.json() as { agent: ForgeAgent }

  if (agent.stage !== 'adult') {
    return NextResponse.json({ error: 'Agent must be Adult stage' }, { status: 400 })
  }

  const prompt = buildGenerateProjectPrompt(agent)

  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
      temperature: 0.9,
      maxOutputTokens: 1000,
    })

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const projectData = JSON.parse(jsonMatch[0])
    const project: GeneratedProject = {
      id: nanoid(),
      name: projectData.name,
      description: projectData.description,
      techStack: projectData.techStack ?? [],
      codeSnippet: projectData.codeSnippet ?? '',
      solanaProgram: projectData.solanaProgram,
    }

    return NextResponse.json({ project })
  } catch {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
