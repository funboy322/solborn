import type { Achievement, ForgeAgent } from './types'

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_words',
    title: 'First Words',
    description: 'Send your first message',
    emoji: '💬',
    xpBonus: 25,
    color: '#a78bfa',
    condition: (a: ForgeAgent) => a.totalInteractions >= 1,
  },
  {
    id: 'deep_thinker',
    title: 'Deep Thinker',
    description: 'Get 5 detailed AI responses',
    emoji: '🧠',
    xpBonus: 40,
    color: '#8b5cf6',
    condition: (a: ForgeAgent) => (a.longResponseCount ?? 0) >= 5,
  },
  {
    id: 'grinder',
    title: 'Grinder',
    description: '3-day conversation streak',
    emoji: '🔥',
    xpBonus: 50,
    color: '#f59e0b',
    condition: (a: ForgeAgent) => (a.streak ?? 0) >= 3,
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: '7-day conversation streak',
    emoji: '⚔️',
    xpBonus: 100,
    color: '#ef4444',
    condition: (a: ForgeAgent) => (a.streak ?? 0) >= 7,
  },
  {
    id: 'chatterbox',
    title: 'Chatterbox',
    description: 'Send 50 messages total',
    emoji: '🗣️',
    xpBonus: 60,
    color: '#34d399',
    condition: (a: ForgeAgent) => a.totalInteractions >= 50,
  },
  {
    id: 'junior_promoted',
    title: 'First Steps',
    description: 'Evolve to Toddler Founder',
    emoji: '📈',
    xpBonus: 30,
    color: '#34d399',
    condition: (a: ForgeAgent) => a.stage !== 'baby',
  },
  {
    id: 'senior_promoted',
    title: 'Teen Years',
    description: 'Evolve to Teen Founder',
    emoji: '💼',
    xpBonus: 50,
    color: '#f59e0b',
    condition: (a: ForgeAgent) => a.stage === 'teen' || a.stage === 'adult',
  },
  {
    id: 'visionary',
    title: 'Visionary',
    description: 'Reach Adult Founder stage',
    emoji: '🚀',
    xpBonus: 100,
    color: '#f43f5e',
    condition: (a: ForgeAgent) => a.stage === 'adult',
  },
]

/**
 * Check which new achievements the agent has unlocked.
 * Returns only NEWLY unlocked achievements (not already in unlockedAchievements).
 */
export function checkNewAchievements(agent: ForgeAgent): Achievement[] {
  const unlocked = agent.unlockedAchievements ?? []
  return ACHIEVEMENTS.filter(
    (a) => !unlocked.includes(a.id) && a.condition(agent)
  )
}

/**
 * Update streak based on current date vs last interaction date.
 */
export function calculateStreak(agent: ForgeAgent): { streak: number; bestStreak: number } {
  const today = new Date().toISOString().slice(0, 10)
  const lastDate = agent.lastStreakDate

  if (!lastDate) {
    return { streak: 1, bestStreak: Math.max(1, agent.bestStreak ?? 0) }
  }

  if (lastDate === today) {
    // Same day — no change
    return { streak: agent.streak ?? 1, bestStreak: agent.bestStreak ?? 1 }
  }

  // Check if yesterday
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (lastDate === yesterday) {
    const newStreak = (agent.streak ?? 0) + 1
    return { streak: newStreak, bestStreak: Math.max(newStreak, agent.bestStreak ?? 0) }
  }

  // Streak broken
  return { streak: 1, bestStreak: agent.bestStreak ?? 0 }
}

/**
 * Get streak XP bonus.
 */
export function getStreakBonus(streak: number): number {
  if (streak >= 7) return 20
  if (streak >= 3) return 10
  if (streak >= 2) return 5
  return 0
}
