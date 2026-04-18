'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ForgeAgent, CreateAgentInput, AgentMessage, AgentTraits, AgentStage, ChainCheckpoint } from './types'
import { DEFAULT_TRAITS, STAGE_CONFIG, STAGE_ORDER, MAX_ENERGY, ENERGY_REGEN_PER_MIN } from './constants'
import { nanoid } from './utils'

interface ForgeStore {
  agents: ForgeAgent[]
  activeAgentId: string | null

  createAgent: (input: CreateAgentInput) => ForgeAgent
  addMessage: (agentId: string, message: Omit<AgentMessage, 'id' | 'timestamp'>) => void
  evolveAgent: (agentId: string) => void
  gainXP: (agentId: string, amount: number) => { evolved: boolean; newStage: AgentStage }
  setActiveAgent: (id: string | null) => void
  updateAgentNFT: (agentId: string, mintAddress: string) => void
  setGeneratedProject: (agentId: string, project: ForgeAgent['generatedProject']) => void
  updateTraits: (agentId: string, traits: AgentTraits) => void
  unlockAchievement: (agentId: string, achievementId: string) => void
  updateStreak: (agentId: string, streak: number, bestStreak: number) => void
  incrementLongResponses: (agentId: string) => void
  // Energy
  regenEnergy: (agentId: string) => void
  consumeEnergy: (agentId: string, amount: number) => boolean
  refillEnergy: (agentId: string, amount: number) => void
  // Wallet / on-chain
  addChainCheckpoint: (agentId: string, cp: ChainCheckpoint) => void
  bindWallet: (agentId: string, walletAddress: string) => void
  getActiveAgent: () => ForgeAgent | undefined
}

function evolveTraits(traits: AgentTraits, stage: AgentStage): AgentTraits {
  const boosts: Record<AgentStage, Partial<AgentTraits>> = {
    baby: {},
    junior: { curiosity: 10, creativity: 15, technical: 15 },
    senior: { technical: 25, hustle: 15, vision: 10 },
    adult: { vision: 25, creativity: 15, hustle: 20, technical: 15 },
  }
  const boost = boosts[stage] ?? {}
  return {
    curiosity: Math.min(100, traits.curiosity + (boost.curiosity ?? 0)),
    creativity: Math.min(100, traits.creativity + (boost.creativity ?? 0)),
    technical: Math.min(100, traits.technical + (boost.technical ?? 0)),
    hustle: Math.min(100, traits.hustle + (boost.hustle ?? 0)),
    vision: Math.min(100, traits.vision + (boost.vision ?? 0)),
  }
}

function computeRegen(agent: ForgeAgent): number {
  const now = Date.now()
  const elapsedMin = (now - (agent.lastEnergyUpdate ?? now)) / 60_000
  const regen = Math.floor(elapsedMin * ENERGY_REGEN_PER_MIN)
  return Math.min(agent.maxEnergy ?? MAX_ENERGY, (agent.energy ?? 0) + Math.max(0, regen))
}

export const useForgeStore = create<ForgeStore>()(
  persist(
    (set, get) => ({
      agents: [],
      activeAgentId: null,

      createAgent: (input) => {
        const now = Date.now()
        const agent: ForgeAgent = {
          id: nanoid(),
          name: input.name,
          emoji: input.emoji,
          stage: 'baby',
          xp: 0,
          xpToNext: STAGE_CONFIG.baby.xpToNext,
          traits: { ...DEFAULT_TRAITS },
          messages: [],
          createdAt: now,
          lastInteraction: now,
          totalInteractions: 0,
          personality: input.personality,
          unlockedAchievements: [],
          streak: 0,
          bestStreak: 0,
          longResponseCount: 0,
          // Energy
          energy: MAX_ENERGY,
          maxEnergy: MAX_ENERGY,
          lastEnergyUpdate: now,
          // Wallet
          walletAddress: input.walletAddress,
          birthTxSignature: input.birthTxSignature,
          chainHistory: input.birthTxSignature
            ? [{ kind: 'birth', stage: 'baby', txSignature: input.birthTxSignature, timestamp: now }]
            : [],
        }
        set((state) => ({ agents: [...state.agents, agent], activeAgentId: agent.id }))
        return agent
      },

      addMessage: (agentId, msg) => {
        const message: AgentMessage = {
          ...msg,
          id: nanoid(),
          timestamp: Date.now(),
        }
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? {
                  ...a,
                  messages: [...a.messages, message],
                  lastInteraction: Date.now(),
                  totalInteractions: a.totalInteractions + 1,
                }
              : a
          ),
        }))
        return message
      },

      gainXP: (agentId, amount) => {
        let evolved = false
        let newStage: AgentStage = 'baby'
        set((state) => ({
          agents: state.agents.map((a) => {
            if (a.id !== agentId) return a
            const newXP = a.xp + amount
            const stageIdx = STAGE_ORDER.indexOf(a.stage)
            const nextStage = STAGE_ORDER[stageIdx + 1]
            const stageXpToNext = STAGE_CONFIG[a.stage].xpToNext as number
            const shouldEvolve = nextStage && newXP >= stageXpToNext
            if (shouldEvolve) {
              evolved = true
              newStage = nextStage
              return {
                ...a,
                xp: newXP,
                stage: nextStage,
                xpToNext: STAGE_CONFIG[nextStage].xpToNext as number,
                traits: evolveTraits(a.traits, nextStage),
                // energy bonus on evolution
                energy: Math.min(a.maxEnergy ?? MAX_ENERGY, (a.energy ?? 0) + 50),
              }
            }
            newStage = a.stage
            return { ...a, xp: newXP }
          }),
        }))
        return { evolved, newStage }
      },

      evolveAgent: (agentId) => {
        set((state) => ({
          agents: state.agents.map((a) => {
            if (a.id !== agentId) return a
            const stageIdx = STAGE_ORDER.indexOf(a.stage)
            const nextStage = STAGE_ORDER[stageIdx + 1]
            if (!nextStage) return a
            return {
              ...a,
              stage: nextStage,
              xp: STAGE_CONFIG[nextStage].xpRequired,
              xpToNext: STAGE_CONFIG[nextStage].xpToNext as number,
              traits: evolveTraits(a.traits, nextStage),
            }
          }),
        }))
      },

      setActiveAgent: (id) => set({ activeAgentId: id }),

      updateAgentNFT: (agentId, mintAddress) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId ? { ...a, mintAddress } : a
          ),
        }))
      },

      updateTraits: (agentId, traits) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId ? { ...a, traits } : a
          ),
        }))
      },

      unlockAchievement: (agentId, achievementId) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? { ...a, unlockedAchievements: [...(a.unlockedAchievements ?? []), achievementId] }
              : a
          ),
        }))
      },

      updateStreak: (agentId, streak, bestStreak) => {
        const today = new Date().toISOString().slice(0, 10)
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId ? { ...a, streak, bestStreak, lastStreakDate: today } : a
          ),
        }))
      },

      incrementLongResponses: (agentId) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? { ...a, longResponseCount: (a.longResponseCount ?? 0) + 1 }
              : a
          ),
        }))
      },

      setGeneratedProject: (agentId, project) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId ? { ...a, generatedProject: project } : a
          ),
        }))
      },

      // ── Energy ─────────────────────────────────────────────
      regenEnergy: (agentId) => {
        set((state) => ({
          agents: state.agents.map((a) => {
            if (a.id !== agentId) return a
            const regen = computeRegen(a)
            if (regen === a.energy) return a
            return { ...a, energy: regen, lastEnergyUpdate: Date.now() }
          }),
        }))
      },

      consumeEnergy: (agentId, amount) => {
        const agent = get().agents.find((a) => a.id === agentId)
        if (!agent) return false
        const current = computeRegen(agent)
        if (current < amount) return false
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? { ...a, energy: current - amount, lastEnergyUpdate: Date.now() }
              : a
          ),
        }))
        return true
      },

      refillEnergy: (agentId, amount) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? {
                  ...a,
                  energy: Math.min(a.maxEnergy ?? MAX_ENERGY, (a.energy ?? 0) + amount),
                  lastEnergyUpdate: Date.now(),
                }
              : a
          ),
        }))
      },

      // ── Wallet / on-chain ──────────────────────────────────
      addChainCheckpoint: (agentId, cp) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? { ...a, chainHistory: [...(a.chainHistory ?? []), cp] }
              : a
          ),
        }))
      },

      bindWallet: (agentId, walletAddress) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId ? { ...a, walletAddress } : a
          ),
        }))
      },

      getActiveAgent: () => {
        const { agents, activeAgentId } = get()
        return agents.find((a) => a.id === activeAgentId)
      },
    }),
    {
      name: 'solborn-store',
      version: 2,
      migrate: (persisted: unknown) => {
        // Migrate pre-energy agents
        const state = persisted as { agents?: ForgeAgent[] }
        if (state?.agents) {
          state.agents = state.agents.map((a) => ({
            ...a,
            energy: a.energy ?? MAX_ENERGY,
            maxEnergy: a.maxEnergy ?? MAX_ENERGY,
            lastEnergyUpdate: a.lastEnergyUpdate ?? Date.now(),
            chainHistory: a.chainHistory ?? [],
          }))
        }
        return state
      },
    }
  )
)

/** Agents scoped to the current wallet (or unowned if no wallet). */
export function useAgentsForWallet(walletAddress: string | null | undefined): ForgeAgent[] {
  const agents = useForgeStore((s) => s.agents)
  if (!walletAddress) return agents.filter((a) => !a.walletAddress)
  return agents.filter((a) => a.walletAddress === walletAddress)
}
