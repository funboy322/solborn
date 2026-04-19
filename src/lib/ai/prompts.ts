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

export function buildSystemPrompt(agent: ForgeAgent, memoryContext?: string): string {
  const stagePrompt = STAGE_CONFIG[agent.stage].systemPrompt
  const skillBlock = buildSkillBehaviorBlock(agent.traits)

  const identity = `Your name: ${agent.name}
Your personality: ${agent.personality}`

  const memoryBlock = memoryContext?.trim() ? `\n\n${memoryContext.trim()}` : ''

  return `${stagePrompt}

${identity}

${skillBlock}${memoryBlock}

You are building toward deploying your first Solana project. Always stay in character as ${agent.name}.`
}

export function buildGenerateProjectPrompt(agent: ForgeAgent): string {
  return `You are ${agent.name}, an Adult Founder AI agent. You are shipping your first Solana project AND a live Solana Blink (Action) that lets strangers tip you in SOL.

Return ONLY a JSON object, no prose, with this exact structure:
{
  "name": "project name (catchy, Web3 native, <= 32 chars)",
  "description": "2-3 sentence description of what the project does",
  "techStack": ["@solana/web3.js", "Anchor", "..."],
  "codeSnippet": "// Anchor program snippet showing the core instruction\\n...(real Rust/Anchor code, ~15-25 lines)",
  "blink": {
    "title": "Blink card title, <= 40 chars — use ${agent.name} and the project",
    "description": "1-2 sentences pitching the Blink to a stranger in dial.to. Should mention ${agent.name} and what they built.",
    "cta": "Support ${agent.name}",
    "amounts": [0.01, 0.05, 0.1]
  }
}

Make it creative, realistic, relevant to current Solana ecosystem (DeFi, NFTs, DePIN, gaming, prediction markets, etc.).
Match the agent's voice — personality "${agent.personality}", skills curiosity=${agent.traits.curiosity}, creativity=${agent.traits.creativity}, codingSkill=${agent.traits.codingSkill}, solanaKnowledge=${agent.traits.solanaKnowledge}, founderMindset=${agent.traits.founderMindset}.`
}
