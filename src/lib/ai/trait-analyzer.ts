/**
 * Анализирует сообщение и определяет какие трейты должны вырасти.
 * Простой keyword-based подход — без лишних API вызовов.
 */

import type { AgentTraits } from '../types'

interface TraitBoost {
  trait: keyof AgentTraits
  amount: number
}

const TRAIT_KEYWORDS: Record<keyof AgentTraits, string[]> = {
  curiosity: [
    'why', 'how', 'what if', 'curious', 'learn', 'explore', 'discover',
    'question', 'wonder', 'research', 'explain', 'teach', 'understand',
  ],
  creativity: [
    'idea', 'create', 'design', 'imagine', 'innovative', 'unique', 'art',
    'brand', 'story', 'creative', 'original', 'vision', 'concept', 'nft',
    'gamif', 'game', 'social', 'community', 'viral',
  ],
  technical: [
    'code', 'program', 'anchor', 'rust', 'solana', 'blockchain', 'smart contract',
    'api', 'deploy', 'token', 'pda', 'instruction', 'transaction', 'web3',
    'typescript', 'react', 'database', 'architecture', 'defi', 'protocol',
    'validator', 'rpc', 'devnet', 'mainnet', 'keypair', 'wallet',
  ],
  hustle: [
    'ship', 'launch', 'mvp', 'fast', 'market', 'user', 'growth', 'revenue',
    'customer', 'sell', 'pitch', 'funding', 'investor', 'startup', 'scale',
    'metrics', 'traction', 'product', 'compete', 'strategy', 'business',
  ],
  vision: [
    'future', 'mission', 'impact', 'change', 'world', 'big', 'long-term',
    'ecosystem', 'platform', 'revolution', 'transform', 'disrupt', 'roadmap',
    'goal', 'dream', 'million', 'billion', 'global', 'decentralize',
  ],
}

/**
 * Анализирует сообщение пользователя и возвращает буст-трейты.
 * Возвращает 1-2 трейта которые больше всего матчатся.
 */
export function analyzeMessageTraits(message: string): TraitBoost[] {
  const lower = message.toLowerCase()
  const scores: Record<keyof AgentTraits, number> = {
    curiosity: 0,
    creativity: 0,
    technical: 0,
    hustle: 0,
    vision: 0,
  }

  // Score each trait
  for (const [trait, keywords] of Object.entries(TRAIT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        scores[trait as keyof AgentTraits] += 1
      }
    }
  }

  // Sort by score, take top 1-2 with score > 0
  const sorted = (Object.entries(scores) as [keyof AgentTraits, number][])
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)

  if (sorted.length === 0) {
    // Default: small curiosity boost for any interaction
    return [{ trait: 'curiosity', amount: 1 }]
  }

  return sorted.map(([trait, score]) => ({
    trait,
    amount: Math.min(3, Math.max(1, score)), // 1-3 boost
  }))
}

/**
 * Применяет trait boosts к текущим трейтам агента.
 */
export function applyTraitBoosts(
  traits: AgentTraits,
  boosts: TraitBoost[]
): AgentTraits {
  const updated = { ...traits }
  for (const { trait, amount } of boosts) {
    updated[trait] = Math.min(100, updated[trait] + amount)
  }
  return updated
}
