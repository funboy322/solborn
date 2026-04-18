import { STAGE_CONFIG } from '../constants'
import type { ForgeAgent } from '../types'

export function buildSystemPrompt(agent: ForgeAgent): string {
  const stagePrompt = STAGE_CONFIG[agent.stage].systemPrompt
  const traitSummary = `
Your current traits:
- Curiosity: ${agent.traits.curiosity}/100
- Creativity: ${agent.traits.creativity}/100
- Technical skill: ${agent.traits.technical}/100
- Hustle: ${agent.traits.hustle}/100
- Vision: ${agent.traits.vision}/100

Your personality: ${agent.personality}
Your name: ${agent.name}
  `.trim()

  return `${stagePrompt}\n\n${traitSummary}\n\nYou are building toward deploying your first Solana project. Always stay in character as ${agent.name}.`
}

export function buildGenerateProjectPrompt(agent: ForgeAgent): string {
  return `You are ${agent.name}, an Adult Founder AI agent. Generate a complete Solana project idea.

Return a JSON object with this exact structure:
{
  "name": "project name (catchy, Web3 native)",
  "description": "2-3 sentence description of what it does",
  "techStack": ["@solana/web3.js", "Anchor", "...other tech"],
  "codeSnippet": "// Key Anchor program snippet showing the core instruction\n...(real Rust/Anchor code, ~20 lines)",
  "solanaProgram": "mock_program_id_${Date.now()}"
}

Make it creative, realistic, and relevant to the current Solana ecosystem (DeFi, NFTs, DePIN, gaming, etc.).
Base it on your personality: ${agent.personality} and traits: curiosity=${agent.traits.curiosity}, creativity=${agent.traits.creativity}, technical=${agent.traits.technical}.`
}
