'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StreakBadgeProps {
  streak: number
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak <= 0) return null

  const isMedium = streak > 3  // pulses
  const isHot    = streak > 7  // glows

  // Glow color escalates with streak
  const glowColor = isHot ? '#f59e0b' : isMedium ? '#f97316' : '#f43f5e'

  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold',
        'border select-none',
      )}
      style={{
        color: glowColor,
        background: `${glowColor}15`,
        borderColor: `${glowColor}35`,
        boxShadow: isHot
          ? `0 0 12px ${glowColor}50, 0 0 28px ${glowColor}25`
          : undefined,
      }}
      // Pulse animation for streak > 3
      animate={
        isMedium
          ? {
              scale: [1, 1.07, 1],
              boxShadow: isHot
                ? [
                    `0 0 8px ${glowColor}40, 0 0 20px ${glowColor}20`,
                    `0 0 18px ${glowColor}70, 0 0 36px ${glowColor}35`,
                    `0 0 8px ${glowColor}40, 0 0 20px ${glowColor}20`,
                  ]
                : [
                    `0 0 0px ${glowColor}00`,
                    `0 0 10px ${glowColor}50`,
                    `0 0 0px ${glowColor}00`,
                  ],
            }
          : {}
      }
      transition={
        isMedium
          ? {
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : {}
      }
      role="status"
      aria-label={`${streak} day streak`}
      title={`${streak}-day streak`}
    >
      {/* Flame emoji — spins slightly when hot */}
      <motion.span
        animate={
          isHot
            ? { rotate: [-6, 6, -6] }
            : isMedium
            ? { rotate: [-3, 3, -3] }
            : {}
        }
        transition={
          isHot || isMedium
            ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }
            : {}
        }
        className="text-sm leading-none"
        aria-hidden="true"
      >
        🔥
      </motion.span>

      {/* Streak number */}
      <span className="tabular-nums">{streak}</span>

      {/* Optional "day" label for streaks that are very large */}
      {streak >= 30 && (
        <span className="font-normal opacity-70">d</span>
      )}
    </motion.div>
  )
}
