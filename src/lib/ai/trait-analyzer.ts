/**
 * Keyword-based fallback skill analyzer.
 * Used when xp-calculator hasn't already produced boosts (legacy path).
 */

import type { AgentSkills } from '../types'

interface TraitBoost {
  trait: keyof AgentSkills
  amount: number
}

const SKILL_KEYWORDS: Record<keyof AgentSkills, string[]> = {
  curiosity: [
    'why', 'how', 'what if', 'curious', 'learn', 'explore', 'discover',
    'question', 'wonder', 'research', 'explain', 'teach', 'understand',
  ],
  creativity: [
    'idea', 'create', 'design', 'imagine', 'innovative', 'unique', 'art',
    'brand', 'story', 'creative', 'original', 'concept',
    'gamif', 'game', 'social', 'community', 'viral',
  ],
  codingSkill: [
    'code', 'program', 'function', 'variable', 'compile', 'debug', 'rust',
    'anchor', 'typescript', 'javascript', 'react', 'framework', 'library',
    'api', 'architecture', 'struct', 'trait', 'async', 'schema',
  ],
  solanaKnowledge: [
    'solana', 'blockchain', 'smart contract', 'token', 'nft', 'cnft',
    'pda', 'instruction', 'transaction', 'web3', 'defi', 'protocol',
    'validator', 'rpc', 'devnet', 'mainnet', 'keypair', 'wallet',
    'bubblegum', 'blink', 'spl', 'metaplex', 'jupiter', 'raydium',
  ],
  founderMindset: [
    'ship', 'launch', 'mvp', 'fast', 'market', 'user', 'growth', 'revenue',
    'customer', 'sell', 'pitch', 'funding', 'investor', 'startup', 'scale',
    'metrics', 'traction', 'product', 'compete', 'strategy', 'business',
    'vision', 'mission', 'impact', 'future', 'roadmap', 'goal',
    'ecosystem', 'platform', 'distribution', 'moat',
  ],
}

/**
 * Analyzes user message and returns 1-2 skill boosts.
 */
export function analyzeMessageTraits(message: string): TraitBoost[] {
  const lower = message.toLowerCase()
  const scores: Record<keyof AgentSkills, number> = {
    curiosity: 0,
    creativity: 0,
    codingSkill: 0,
    solanaKnowledge: 0,
    founderMindset: 0,
  }

  for (const [trait, keywords] of Object.entries(SKILL_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        scores[trait as keyof AgentSkills] += 1
      }
    }
  }

  const sorted = (Object.entries(scores) as [keyof AgentSkills, number][])
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)

  if (sorted.length === 0) {
    return [{ trait: 'curiosity', amount: 1 }]
  }

  return sorted.map(([trait, score]) => ({
    trait,
    amount: Math.min(3, Math.max(1, score)),
  }))
}

/**
 * Applies skill boosts to current agent skills.
 */
export function applyTraitBoosts(
  traits: AgentSkills,
  boosts: TraitBoost[]
): AgentSkills {
  const updated = { ...traits }
  for (const { trait, amount } of boosts) {
    updated[trait] = Math.min(100, updated[trait] + amount)
  }
  return updated
}
