'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ForgeAgent, CreateAgentInput, AgentMessage, AgentSkills, AgentStage, ChainCheckpoint, Trainer, StakePosition } from './types'
import { DEFAULT_SKILLS, STAGE_CONFIG, STAGE_ORDER, MAX_ENERGY, ENERGY_REGEN_PER_MIN } from './constants'
import { nanoid } from './utils'

interface ForgeStore {
  agents: ForgeAgent[]
  stakePositions: StakePosition[]
  activeAgentId: string | null

  createAgent: (input: CreateAgentInput) => ForgeAgent
  addMessage: (agentId: string, message: Omit<AgentMessage, 'id' | 'timestamp'>) => void
  evolveAgent: (agentId: string) => void
  gainXP: (agentId: string, amount: number) => { evolved: boolean; newStage: AgentStage }
  setActiveAgent: (id: string | null) => void
  updateAgentNFT: (agentId: string, mintAddress: string) => void
  setGeneratedProject: (agentId: string, project: ForgeAgent['generatedProject']) => void
  updateTraits: (agentId: string, traits: AgentSkills) => void
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
  // Multi-trainer
  registerTraining: (agentId: string, walletAddress: string, xpGained: number) => void
  // $SBORN utility staking v1
  createStakePosition: (input: { walletAddress: string; amount: number; unlockAt?: number }) => StakePosition
  closeStakePosition: (positionId: string) => void
  getActiveAgent: () => ForgeAgent | undefined
}

function evolveTraits(traits: AgentSkills, stage: AgentStage): AgentSkills {
  const boosts: Record<AgentStage, Partial<AgentSkills>> = {
    baby: {},
    toddler: { curiosity: 10, creativity: 10, solanaKnowledge: 10, codingSkill: 5 },
    teen: { codingSkill: 20, solanaKnowledge: 15, founderMindset: 10, creativity: 5 },
    adult: { founderMindset: 25, creativity: 10, solanaKnowledge: 15, codingSkill: 15 },
  }
  const boost = boosts[stage] ?? {}
  return {
    curiosity: Math.min(100, traits.curiosity + (boost.curiosity ?? 0)),
    creativity: Math.min(100, traits.creativity + (boost.creativity ?? 0)),
    codingSkill: Math.min(100, traits.codingSkill + (boost.codingSkill ?? 0)),
    solanaKnowledge: Math.min(100, traits.solanaKnowledge + (boost.solanaKnowledge ?? 0)),
    founderMindset: Math.min(100, traits.founderMindset + (boost.founderMindset ?? 0)),
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
      stakePositions: [],
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
          traits: { ...DEFAULT_SKILLS },
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
          // Multi-trainer: creator seeded as first trainer with 0 XP
          trainers: input.walletAddress
            ? [
                {
                  walletAddress: input.walletAddress,
                  xpContributed: 0,
                  messagesCount: 0,
                  firstSeenAt: now,
                  lastSeenAt: now,
                },
              ]
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

      registerTraining: (agentId, walletAddress, xpGained) => {
        const now = Date.now()
        set((state) => ({
          agents: state.agents.map((a) => {
            if (a.id !== agentId) return a
            const existing = (a.trainers ?? []).find(
              (t) => t.walletAddress === walletAddress,
            )
            let trainers: Trainer[]
            if (existing) {
              trainers = (a.trainers ?? []).map((t) =>
                t.walletAddress === walletAddress
                  ? {
                      ...t,
                      xpContributed: t.xpContributed + Math.max(0, xpGained),
                      messagesCount: t.messagesCount + 1,
                      lastSeenAt: now,
                    }
                  : t,
              )
            } else {
              trainers = [
                ...(a.trainers ?? []),
                {
                  walletAddress,
                  xpContributed: Math.max(0, xpGained),
                  messagesCount: 1,
                  firstSeenAt: now,
                  lastSeenAt: now,
                },
              ]
            }
            return { ...a, trainers }
          }),
        }))
      },

      createStakePosition: ({ walletAddress, amount, unlockAt }) => {
        const position: StakePosition = {
          id: nanoid(),
          walletAddress,
          amount,
          createdAt: Date.now(),
          unlockAt,
          status: 'active',
          mode: 'simulation',
        }
        set((state) => ({ stakePositions: [...state.stakePositions, position] }))
        return position
      },

      closeStakePosition: (positionId) => {
        set((state) => ({
          stakePositions: state.stakePositions.map((position) =>
            position.id === positionId ? { ...position, status: 'unstaked' } : position,
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
      version: 5,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { agents?: ForgeAgent[]; stakePositions?: StakePosition[] }
        if (!state?.agents) return state
        state.stakePositions = state.stakePositions ?? []

        // v1 → v2: energy fields
        if (version < 2) {
          state.agents = state.agents.map((a) => ({
            ...a,
            energy: a.energy ?? MAX_ENERGY,
            maxEnergy: a.maxEnergy ?? MAX_ENERGY,
            lastEnergyUpdate: a.lastEnergyUpdate ?? Date.now(),
            chainHistory: a.chainHistory ?? [],
          }))
        }

        // v2 → v3: rename stages + remap skills
        if (version < 3) {
          const stageMap: Record<string, AgentStage> = {
            baby: 'baby',
            junior: 'toddler',
            senior: 'teen',
            adult: 'adult',
          }
          const migrated = state.agents.map((a) => {
            const oldTraits = a.traits as unknown as {
              curiosity?: number
              creativity?: number
              technical?: number
              hustle?: number
              vision?: number
            }
            // Remap legacy (technical/hustle/vision) → new skills if still present.
            const curiosity = oldTraits.curiosity ?? 50
            const creativity = oldTraits.creativity ?? 25
            const codingSkill =
              (a.traits as Partial<AgentSkills>).codingSkill ?? oldTraits.technical ?? 10
            const solanaKnowledge =
              (a.traits as Partial<AgentSkills>).solanaKnowledge ??
              Math.round(((oldTraits.technical ?? 10) + (oldTraits.vision ?? 20)) * 0.35)
            const founderMindset =
              (a.traits as Partial<AgentSkills>).founderMindset ??
              Math.round(((oldTraits.hustle ?? 30) + (oldTraits.vision ?? 20)) / 2)

            return {
              ...a,
              stage: stageMap[a.stage] ?? a.stage,
              traits: {
                curiosity: Math.min(100, Math.max(0, curiosity)),
                creativity: Math.min(100, Math.max(0, creativity)),
                codingSkill: Math.min(100, Math.max(0, codingSkill)),
                solanaKnowledge: Math.min(100, Math.max(0, solanaKnowledge)),
                founderMindset: Math.min(100, Math.max(0, founderMindset)),
              },
            }
          })
          state.agents = migrated
        }

        // v3 → v4: seed trainers from existing walletAddress + total XP
        if (version < 4) {
          const now = Date.now()
          state.agents = state.agents.map((a) => {
            if (a.trainers && a.trainers.length > 0) return a
            if (!a.walletAddress) return { ...a, trainers: [] }
            return {
              ...a,
              trainers: [
                {
                  walletAddress: a.walletAddress,
                  xpContributed: a.xp ?? 0,
                  messagesCount: a.totalInteractions ?? 0,
                  firstSeenAt: a.createdAt ?? now,
                  lastSeenAt: a.lastInteraction ?? now,
                },
              ],
            }
          })
        }

        if (version < 5) {
          state.stakePositions = state.stakePositions ?? []
        }

        return state
      },
    }
  )
)

/** Agents created by this wallet (or unowned if no wallet). */
export function useAgentsForWallet(walletAddress: string | null | undefined): ForgeAgent[] {
  const agents = useForgeStore((s) => s.agents)
  if (!walletAddress) return agents.filter((a) => !a.walletAddress)
  return agents.filter((a) => a.walletAddress === walletAddress)
}

/** Agents this wallet is training but did NOT create. */
export function useAgentsTrainedBy(walletAddress: string | null | undefined): ForgeAgent[] {
  const agents = useForgeStore((s) => s.agents)
  if (!walletAddress) return []
  return agents.filter(
    (a) =>
      a.walletAddress !== walletAddress &&
      (a.trainers ?? []).some(
        (t) => t.walletAddress === walletAddress && t.xpContributed > 0,
      ),
  )
}

/** Top trainers of an agent sorted by XP contribution, with % shares. */
export function rankTrainers(agent: ForgeAgent): Array<Trainer & { share: number }> {
  const list = agent.trainers ?? []
  const total = list.reduce((sum, t) => sum + t.xpContributed, 0) || 1
  return [...list]
    .sort((a, b) => b.xpContributed - a.xpContributed)
    .map((t) => ({ ...t, share: t.xpContributed / total }))
}
