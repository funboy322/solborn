'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  xpBonus: number
  color: string // hex
}

interface AchievementToastProps {
  achievement: Achievement
  onDismiss: () => void
}

// Single toast unit
export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const { title, description, emoji, xpBonus, color } = achievement

  // Auto-dismiss after 3 seconds of hold
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3800) // 0.4s slide-in + 3s hold + starts slide-out
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, y: 0, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.92 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className={cn('glass pointer-events-auto w-80 p-4 cursor-pointer select-none')}
      style={{
        boxShadow: `0 0 0 1px ${color}30, 0 0 32px ${color}25, 0 8px 32px rgba(0,0,0,0.4)`,
        borderColor: `${color}30`,
      }}
      onClick={onDismiss}
      role="alert"
      aria-live="polite"
      aria-label={`Achievement unlocked: ${title}`}
    >
      {/* Neon top accent line */}
      <motion.div
        className="absolute top-0 left-4 right-4 h-px rounded-full"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.18, duration: 0.5 }}
      />

      <div className="flex items-start gap-3">
        {/* Emoji icon */}
        <motion.div
          className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
          style={{
            background: `${color}18`,
            border: `1px solid ${color}30`,
            boxShadow: `0 0 14px ${color}30`,
          }}
          initial={{ scale: 0.5, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 300, delay: 0.08 }}
        >
          {emoji}
        </motion.div>

        {/* Text block */}
        <div className="flex-1 min-w-0 pt-0.5">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: `${color}cc` }}>
              Achievement Unlocked
            </p>
            {/* XP badge */}
            <motion.span
              className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                color,
                background: `${color}20`,
                border: `1px solid ${color}40`,
                boxShadow: `0 0 8px ${color}30`,
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 14, delay: 0.25 }}
            >
              +{xpBonus} XP
            </motion.span>
          </div>

          <p className="text-sm font-semibold text-zinc-100 leading-snug truncate">{title}</p>
          <p className="text-xs text-zinc-400 mt-0.5 leading-snug line-clamp-2">{description}</p>
        </div>
      </div>

      {/* Auto-dismiss progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px] rounded-b-2xl"
        style={{ background: `linear-gradient(90deg, ${color}90, ${color}40)` }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 3.4, delay: 0.4, ease: 'linear' }}
      />
    </motion.div>
  )
}

// Stack container — place fixed bottom-right, renders multiple toasts
interface AchievementToastStackProps {
  achievements: Achievement[]
  onDismiss: (id: string) => void
}

export function AchievementToastStack({ achievements, onDismiss }: AchievementToastStackProps) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3 pointer-events-none"
      aria-label="Achievement notifications"
    >
      <AnimatePresence mode="sync">
        {achievements.map((achievement) => (
          <AchievementToast
            key={achievement.id}
            achievement={achievement}
            onDismiss={() => onDismiss(achievement.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
