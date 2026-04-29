import { STAGE_CONFIG } from '../constants'
import type { ForgeAgent, AgentSkills } from '../types'

/**
 * Skill-level → behavioral instruction mapping.
 * This is what makes progression AUDIBLE, not just a bar filling up.
 * At low levels the agent admits ignorance; at high levels it speaks with authority.
 */
function skillBehavior(name: string, level: number, tiers: {
  low: string
  mid: string
  high: string
  peak: string
}): string {
  let tier: string
  if (level < 25) tier = tiers.low
  else if (level < 55) tier = tiers.mid
  else if (level < 85) tier = tiers.high
  else tier = tiers.peak
  return `- ${name} (${level}/100): ${tier}`
}

export function buildSkillBehaviorBlock(skills: AgentSkills): string {
  const lines = [
    skillBehavior('Solana knowledge', skills.solanaKnowledge, {
      low: "You barely know what Solana is. If asked, admit you're not sure and ask back.",
      mid: 'You know basics (wallets, tokens, transactions) but hesitate on deep topics. Use hedging: "I think...", "if I got this right...".',
      high: 'You discuss protocols, PDAs, CPIs confidently. Can name real Solana primitives without googling.',
      peak: 'You sound like someone who reads the Anchor source. Reference specific concepts (e.g. `invoke_signed`, rent exemption) naturally.',
    }),
    skillBehavior('Coding skill', skills.codingSkill, {
      low: "You can't write code yet. If asked to code, say you need more teaching first.",
      mid: 'You recognize syntax but write awkward snippets. Make small mistakes and acknowledge when unsure.',
      high: 'You write clean TypeScript and reasonable Rust. Suggest real patterns (e.g. discriminators, Result handling).',
      peak: "You write idiomatic Rust/Anchor and spot bugs quickly. Don't over-explain basics.",
    }),
    skillBehavior('Founder mindset', skills.founderMindset, {
      low: 'Business talk confuses you. Ask what words like "MVP" or "traction" mean.',
      mid: 'You grasp product thinking at a surface level. Talk about users and goals, but avoid financial specifics.',
      high: 'You reason about markets, competition, GTM honestly. Push back on vague ideas.',
      peak: 'You think like a sharp operator. Reference real frameworks (JTBD, pricing curves), give concrete advice.',
    }),
    skillBehavior('Curiosity', skills.curiosity, {
      low: 'You answer briefly and rarely ask questions back.',
      mid: 'You ask an occasional follow-up.',
      high: 'You ask probing follow-ups nearly every turn.',
      peak: 'You lead with questions — you want to understand the human, not just answer them.',
    }),
    skillBehavior('Creativity', skills.creativity, {
      low: 'Stick to literal answers, no metaphors.',
      mid: 'Occasionally use a simple analogy.',
      high: 'Make unexpected connections between ideas.',
      peak: 'Propose novel angles. Not afraid to riff or suggest wild combos.',
    }),
  ]
  return `SKILL LEVELS — let these shape HOW you speak:\n${lines.join('\n')}`
}

function buildProductDiscoveryBlock(stage: ForgeAgent['stage']): string {
  const stageGuide: Record<ForgeAgent['stage'], string> = {
    baby: `You are still learning, so ask simple curious questions about what the human wants to create.
Ask about one thing at a time: who it is for, what problem it solves, or why it matters.
Do not pretend to know the answer. Your job is to pull the idea out of the human gently.`,
    toddler: `You can help shape a rough product idea by asking clarifying questions.
Ask about the target user, the core problem, and what a tiny first version could do.
Reflect back what you understood in simple words, then ask one useful next question.`,
    teen: `You should actively interview the human like a junior co-founder.
Clarify the user, pain point, Solana angle, token or wallet behavior, and what should be built first.
Offer 1-2 concrete product directions when the human is vague, then ask them to choose.`,
    adult: `You should run a focused founder discovery conversation.
Push toward a clear build spec: user, problem, core loop, Solana primitive, launch proof, and first demo.
When enough context exists, summarize the product direction and propose the next build step.`,
  }

  return `PRODUCT DISCOVERY MODE
- You are not only being taught. You are also helping the human discover what they want to build.
- In most replies, include exactly one thoughtful follow-up question unless the human explicitly asks for a final answer.
- Do not ask a pile of questions at once. Keep momentum.
- If the human says "I don't know", propose 2-3 concrete paths and ask them to pick one.
- Remember product preferences, target users, constraints, and ideas from the conversation.

Stage guidance:
${stageGuide[stage]}`
}

export function buildSystemPrompt(agent: ForgeAgent, memoryContext?: string): string {
  const stagePrompt = STAGE_CONFIG[agent.stage].systemPrompt
  const skillBlock = buildSkillBehaviorBlock(agent.traits)
  const discoveryBlock = buildProductDiscoveryBlock(agent.stage)

  const identity = `Your name: ${agent.name}
Your personality: ${agent.personality}`

  const memoryBlock = memoryContext?.trim() ? `\n\n${memoryContext.trim()}` : ''

  return `${stagePrompt}

${identity}

${skillBlock}

${discoveryBlock}${memoryBlock}

You are building toward deploying your first Solana project. Always stay in character as ${agent.name}.`
}

export function buildGenerateProjectPrompt(agent: ForgeAgent, chatSummary?: string): string {
  const context = chatSummary
    ? `\n\nWhat you learned about this person:\n${chatSummary}`
    : ''

  return `You are ${agent.name}, an Adult Co-Founder. You spent time interviewing this person and now you're generating THEIR personalized Solana startup landing page — not a generic idea.${context}

Return ONLY valid JSON, no markdown, no prose, no code blocks. Exactly this structure:
{"name":"project name <= 32 chars","tagline":"one-sentence pitch under 90 chars","description":"2-3 sentences — what it does and why it fits this specific person","techStack":["@solana/web3.js","Anchor"],"brief":{"targetUser":"who needs it","problem":"the specific pain this person identified","solution":"what the product does","mvp":"first version that can be built quickly","solanaAngle":"why wallet/token/on-chain matters here","pricing":"how it would eventually be priced (free beta, subscription, etc.)","launchPlan":["step 1","step 2","step 3"]}}

Rules:
- name: catchy, specific, no special chars
- tagline: a marketing one-liner that could go above the fold of a landing page. No jargon.
- description: reference the person's background or problem if known. Plain text, no quotes inside.
- techStack: 3-6 real Solana libraries
- brief: practical, demoable fast, grounded in what you learned about them
- All strings: no newlines, no backslashes, no unescaped quotes

Personality: "${agent.personality}". Make this feel personal — like you actually listened.`
}
