// Core domain types for SolBorn

export type AgentStage = 'baby' | 'toddler' | 'teen' | 'adult'

/**
 * Agent skills (0-100). Rebranded from AgentTraits in v3.
 * These are the 5 dimensions that actually drive agent behaviour in prompts.
 */
export interface AgentSkills {
  curiosity: number        // asks follow-ups, wants to learn
  solanaKnowledge: number  // grasp of Solana/Web3 concepts
  codingSkill: number      // ability to reason about code
  creativity: number       // original connections, ideas
  founderMindset: number   // business, ship-it, strategy
}

/** Backwards-compatible alias — code written against AgentTraits keeps working. */
export type AgentTraits = AgentSkills

export interface AgentMessage {
  id: string
  role: 'user' | 'agent' | 'system'
  content: string
  timestamp: number
  xpGained?: number
}

export interface BlinkSpec {
  /** Short noun phrase, shown as Blink title */
  title: string
  /** 1-2 sentence description shown in dial.to card */
  description: string
  /** CTA label on the donate button */
  cta: string
  /** Suggested tip amounts in SOL, e.g. [0.01, 0.05, 0.1] */
  amounts: number[]
}

export interface ProductBrief {
  targetUser: string
  problem: string
  solution: string
  mvp: string
  solanaAngle: string
  pricing: string
  launchPlan: string[]
}

export interface MembershipOffer {
  title: string
  priceUsd: number
  durationDays: number
  benefits: string[]
}

export interface GeneratedProject {
  id: string
  name: string
  /** One-sentence marketing pitch for the landing page hero */
  tagline?: string
  description: string
  techStack: string[]
  codeSnippet: string      // key code snippet
  solanaProgram?: string   // mock program ID
  brief?: ProductBrief
  membership?: MembershipOffer
  deployedAt?: number
  txHash?: string          // real devnet memo tx from /deploy
  /** If set, agent has shipped a live Solana Action. */
  blink?: BlinkSpec
  /** Absolute Blink URL pointing to /api/blinks/[id]?... */
  blinkUrl?: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  xpBonus: number
  color: string
  condition: (agent: ForgeAgent) => boolean
}

/** On-chain checkpoint written at key moments (birth / evolution / mint) */
export interface ChainCheckpoint {
  kind: 'birth' | 'evolve' | 'mint'
  stage: AgentStage
  txSignature: string
  timestamp: number
}

/** A single trainer's contribution record on a shared agent. */
export interface Trainer {
  walletAddress: string
  xpContributed: number      // total XP this trainer has poured in
  messagesCount: number      // total messages sent
  firstSeenAt: number
  lastSeenAt: number
  displayName?: string       // future: X handle / ENS / shortened addr
}

export interface StakePosition {
  id: string
  walletAddress: string
  amount: number
  createdAt: number
  unlockAt?: number
  status: 'active' | 'unstaked'
  mode: 'simulation' | 'on-chain'
}

export interface ProductVote {
  id: string
  productId: string
  walletAddress: string
  weight: number
  createdAt: number
  updatedAt: number
  mode: 'simulation' | 'on-chain'
}

export interface ForgeAgent {
  id: string
  name: string
  emoji: string
  stage: AgentStage
  xp: number
  xpToNext: number
  traits: AgentSkills
  messages: AgentMessage[]
  mintAddress?: string       // mock cNFT address
  nftMetadata?: NFTMetadata
  generatedProject?: GeneratedProject
  createdAt: number
  lastInteraction: number
  totalInteractions: number
  personality: string
  // Gamification
  unlockedAchievements: string[]  // achievement IDs
  streak: number                   // consecutive days
  lastStreakDate?: string          // YYYY-MM-DD
  bestStreak: number
  longResponseCount: number        // messages > 200 chars from AI
  // Energy
  energy: number
  maxEnergy: number
  lastEnergyUpdate: number
  // Wallet / on-chain
  walletAddress?: string       // creator / original owner
  birthTxSignature?: string
  chainHistory?: ChainCheckpoint[]
  // Multi-trainer (phase 4)
  trainers?: Trainer[]         // contribution records, keyed by walletAddress
}

export interface NFTMetadata {
  name: string
  symbol: string
  uri: string
  attributes: Array<{ trait_type: string; value: string | number }>
  mintAddress: string
  network: 'devnet' | 'mainnet-beta'
}

export type CreateAgentInput = {
  name: string
  emoji: string
  personality: string
  walletAddress?: string
  birthTxSignature?: string
}
