// Core domain types for SolBorn

export type AgentStage = 'baby' | 'junior' | 'senior' | 'adult'

export interface AgentTraits {
  curiosity: number      // 0-100
  creativity: number     // 0-100
  technical: number      // 0-100
  hustle: number         // 0-100
  vision: number         // 0-100
}

export interface AgentMessage {
  id: string
  role: 'user' | 'agent' | 'system'
  content: string
  timestamp: number
  xpGained?: number
}

export interface GeneratedProject {
  id: string
  name: string
  description: string
  techStack: string[]
  codeSnippet: string      // key code snippet
  solanaProgram?: string   // mock program ID
  deployedAt?: number
  txHash?: string          // mock tx hash
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

export interface ForgeAgent {
  id: string
  name: string
  emoji: string
  stage: AgentStage
  xp: number
  xpToNext: number
  traits: AgentTraits
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
  // Energy (new)
  energy: number                   // current energy (0..maxEnergy)
  maxEnergy: number                // cap
  lastEnergyUpdate: number         // ms timestamp for regen calc
  // Wallet / on-chain (new)
  walletAddress?: string           // owning wallet (base58)
  birthTxSignature?: string        // 0.1 SOL birth payment tx
  chainHistory?: ChainCheckpoint[] // evolution checkpoints
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
