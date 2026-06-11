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
  /**
   * Public-facing product link the creator added (waitlist, repo, app URL).
   * Always validated via /api/scam-check before being saved.
   */
  productUrl?: string
  /** True only after Safe Browsing returned clean for productUrl. */
  productUrlVerified?: boolean
  /** Last successful productUrl check timestamp (re-checked on subsequent edits). */
  productUrlVerifiedAt?: number
  /** When the creator last edited the page through the customize modal. */
  customizedAt?: number
  /** Track which top-level fields the creator has overridden, for the "edited" badge. */
  customFields?: string[]
  /**
   * AI-generated full landing page (hero, features, how-it-works, FAQ, CTA).
   * Produced by /api/landing/generate after a 0.05 SOL mainnet payment
   * (one-shot, pay-per-generation — no subscription state). The
   * tx signature is embedded in landingContent.txSignature as proof.
   */
  landingContent?: LandingContent
  /**
   * Claimed subdomain slug, e.g. "harmonia" → harmonia.solborn.xyz.
   * Lowercase alphanumeric + hyphens, 3-32 chars, unique across all
   * projects (validated server-side via Upstash Redis SETNX).
   */
  subdomain?: string
  /** When the subdomain was first claimed. */
  subdomainClaimedAt?: number
  /** When the public Upstash mirror was last updated for this project. */
  subdomainLastSyncedAt?: number
}

/** Single feature card on the generated landing page. */
export interface LandingFeature {
  /** Optional lucide-react icon name (e.g. "Sparkles", "Zap"). */
  icon?: string
  title: string
  body: string
}

/** Single step in the how-it-works section. */
export interface LandingStep {
  stepNumber: number
  title: string
  body: string
}

/** Single Q+A in the FAQ section. */
export interface LandingFaqItem {
  question: string
  answer: string
}

/**
 * Full AI-generated landing page structure.
 * Renders as Hero → Features → How it works → FAQ → CTA via <RenderedLanding>.
 */
export interface LandingContent {
  hero: {
    headline: string
    subhead: string
    ctaText: string
    /** Optional CTA target; falls back to productUrl or scrollTo("request-access"). */
    ctaHref?: string
  }
  /** Exactly 4 cards. */
  features: LandingFeature[]
  /** Exactly 4 steps. */
  howItWorks: LandingStep[]
  /** Exactly 4 Q+A items. */
  faq: LandingFaqItem[]
  cta: {
    headline: string
    subhead?: string
    buttonText: string
    href?: string
  }
  /** When this generation was produced. */
  generatedAt: number
  /** Mainnet tx signature proving the 0.05 SOL payment for this generation. */
  txSignature: string
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
  // Preference choices captured via MC questions (phase 5)
  preferences?: AgentPreference[]
}

/**
 * One captured preference choice from an MC question.
 * Persisted on the agent so the Founder Profile can show "favorite stack" etc.,
 * and so memory ingestion can use it as structured context.
 */
export interface AgentPreference {
  /** Free-form key chosen by the LLM (e.g. "frustration", "weekend_style"). */
  key: string
  /** The label of the option the user tapped. */
  value: string
  /** Optional id from the MC option (for analytics / mapping). */
  optionId?: string
  /** Stage at which it was captured. */
  stage: AgentStage
  /** Captured timestamp. */
  timestamp: number
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
