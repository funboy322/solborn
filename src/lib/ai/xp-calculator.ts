/**
 * Teaching-quality XP calculator.
 *
 * The premise: you are raising a baby from zero. What YOU type matters.
 * Lazy inputs ("hi", "ok", "k") → near-zero XP.
 * Rich teaching (explanations, examples, domain vocabulary, questions that prompt learning)
 * → big XP rewards.
 */

import type { AgentStage, AgentTraits } from '../types'

export interface XPBreakdown {
  total: number
  reasons: string[]
  quality: 'spam' | 'low' | 'decent' | 'good' | 'great'
  traitBoosts: Partial<AgentTraits>
}

const WEB3_TERMS = [
  'solana', 'blockchain', 'wallet', 'token', 'nft', 'cnft', 'compressed',
  'smart contract', 'program', 'anchor', 'rust', 'pda', 'mint', 'airdrop',
  'staking', 'validator', 'consensus', 'proof', 'defi', 'dex', 'amm',
  'liquidity', 'yield', 'lending', 'borrowing', 'oracle', 'bridge',
  'dao', 'governance', 'treasury', 'vault', 'escrow', 'ledger',
  'spl', 'metaplex', 'jito', 'helius', 'phantom', 'devnet', 'mainnet',
]

const STARTUP_TERMS = [
  'startup', 'founder', 'mvp', 'pivot', 'runway', 'burn', 'revenue',
  'product', 'market', 'customer', 'user', 'problem', 'solution',
  'competitive', 'moat', 'traction', 'growth', 'retention', 'churn',
  'ltv', 'cac', 'funnel', 'conversion', 'pitch',
  'seed', 'series a', 'vc', 'angel', 'cap table', 'valuation',
  'go-to-market', 'gtm', 'roadmap', 'sprint', 'iteration', 'ship',
]

const TECHNICAL_TERMS = [
  'function', 'variable', 'class', 'array', 'object', 'api', 'database',
  'server', 'client', 'frontend', 'backend', 'framework', 'library',
  'typescript', 'javascript', 'python', 'react', 'next', 'node',
  'compile', 'deploy', 'test', 'debug', 'cache', 'async', 'promise',
  'state', 'hook', 'component', 'query', 'mutation', 'schema',
]

const TEACHING_PATTERNS = [
  /\b(because|since|so that|the reason)\b/i,
  /\b(for example|e\.g\.|like when|such as|imagine)\b/i,
  /\b(first|second|third|next|then|finally)\b/i,
  /\b(let me explain|here's how|think of it)\b/i,
  /\b(is when|means that|is basically|is like)\b/i,
]

const QUESTION_PATTERNS = [
  /\?$/,
  /\b(what|why|how|when|where|who|which)\b/i,
  /\b(do you know|have you heard|can you)\b/i,
]

const LAZY_PATTERNS = [
  /^(hi|hey|yo|sup|hello|ok|okay|k|nice|cool|lol|lmao|wtf)$/i,
  /^.{1,3}$/,
  /^(.)\1{3,}$/,
]

function uniqueTokens(text: string): number {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-zа-я0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2)
  ).size
}

function matchCount(text: string, terms: readonly string[]): number {
  const lower = text.toLowerCase()
  let n = 0
  for (const term of terms) if (lower.includes(term)) n++
  return n
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text))
}

export function calculateTeachingXP(
  userMessage: string,
  aiResponse: string,
  stage: AgentStage
): XPBreakdown {
  const text = userMessage.trim()
  const reasons: string[] = []
  const traitBoosts: Partial<AgentTraits> = {}
  let xp = 0

  if (text.length === 0 || hasAny(text, LAZY_PATTERNS)) {
    return {
      total: 0,
      reasons: ['Too short — teach me something real!'],
      quality: 'spam',
      traitBoosts: {},
    }
  }

  const wordCount = text.split(/\s+/).length
  if (wordCount < 4) {
    xp += 2
    reasons.push(`+2 tiny message`)
  } else if (wordCount < 12) {
    xp += 5
    reasons.push(`+5 short message`)
  } else if (wordCount < 30) {
    xp += 12
    reasons.push(`+12 thoughtful message`)
  } else if (wordCount < 80) {
    xp += 20
    reasons.push(`+20 detailed explanation`)
  } else {
    xp += 25
    reasons.push(`+25 deep teaching`)
  }

  const unique = uniqueTokens(text)
  const richness = wordCount > 0 ? unique / wordCount : 0
  if (richness > 0.7 && wordCount >= 8) {
    xp += 5
    reasons.push(`+5 rich vocabulary`)
  }

  const web3 = matchCount(text, WEB3_TERMS)
  const startup = matchCount(text, STARTUP_TERMS)
  const technical = matchCount(text, TECHNICAL_TERMS)

  if (web3 > 0) {
    const bonus = Math.min(15, web3 * 4)
    xp += bonus
    reasons.push(`+${bonus} Web3/Solana concepts`)
    traitBoosts.vision = (traitBoosts.vision ?? 0) + Math.min(3, web3)
    traitBoosts.technical = (traitBoosts.technical ?? 0) + Math.min(2, web3)
  }
  if (startup > 0) {
    const bonus = Math.min(10, startup * 3)
    xp += bonus
    reasons.push(`+${bonus} startup concepts`)
    traitBoosts.hustle = (traitBoosts.hustle ?? 0) + Math.min(3, startup)
  }
  if (technical > 0) {
    const bonus = Math.min(10, technical * 3)
    xp += bonus
    reasons.push(`+${bonus} technical concepts`)
    traitBoosts.technical = (traitBoosts.technical ?? 0) + Math.min(3, technical)
  }

  if (hasAny(text, TEACHING_PATTERNS)) {
    xp += 8
    reasons.push(`+8 explanation`)
    traitBoosts.creativity = (traitBoosts.creativity ?? 0) + 1
  }

  if (hasAny(text, QUESTION_PATTERNS)) {
    xp += 4
    reasons.push(`+4 question`)
    traitBoosts.curiosity = (traitBoosts.curiosity ?? 0) + 2
  }

  if (/```|\bfunction\s*\(|\bconst\s+\w+\s*=/.test(text)) {
    xp += 15
    reasons.push(`+15 code example!`)
    traitBoosts.technical = (traitBoosts.technical ?? 0) + 5
  }

  const stageMultiplier: Record<AgentStage, number> = {
    baby: 1.8,
    junior: 1.2,
    senior: 0.9,
    adult: 0.6,
  }
  const mult = stageMultiplier[stage]
  xp = Math.round(xp * mult)
  if (mult !== 1) {
    reasons.push(`×${mult.toFixed(1)} ${stage}`)
  }

  if ((stage === 'senior' || stage === 'adult') && web3 + technical >= 3) {
    xp += 10
    reasons.push(`+10 advanced`)
  }

  if (aiResponse.length > 200) {
    xp += 3
    reasons.push(`+3 sparked reply`)
  }

  let quality: XPBreakdown['quality'] = 'low'
  if (xp === 0) quality = 'spam'
  else if (xp < 10) quality = 'low'
  else if (xp < 25) quality = 'decent'
  else if (xp < 50) quality = 'good'
  else quality = 'great'

  return { total: Math.max(0, xp), reasons, quality, traitBoosts }
}

export function isRepetitive(current: string, recent: string[]): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
  const cur = norm(current)
  if (cur.length < 5) return false
  return recent.slice(-3).some((r) => {
    const rr = norm(r)
    if (rr === cur) return true
    if (cur.length > 20 && rr.length > 20) {
      const overlap = cur.split(' ').filter((w) => rr.includes(w)).length
      return overlap / Math.max(cur.split(' ').length, 1) > 0.85
    }
    return false
  })
}
