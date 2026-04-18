'use client'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'
import { STAGE_CONFIG } from '@/lib/constants'
import { StageIndicator } from './StageIndicator'
import { timeAgo } from '@/lib/utils'
import type { ForgeAgent } from '@/lib/types'

interface AgentCardProps {
  agent: ForgeAgent
  active?: boolean
  onClick?: () => void
}

export function AgentCard({ agent, active, onClick }: AgentCardProps) {
  const config = STAGE_CONFIG[agent.stage]

  // 3D tilt via mouse position
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  // XP progress for the mini bar
  const xpRequired = config.xpRequired
  const xpToNext = config.xpToNext
  const progress = xpToNext === Infinity
    ? 100
    : Math.min(100, Math.round(((agent.xp - xpRequired) / (xpToNext - xpRequired)) * 100))

  const hasStreak = agent.streak > 0
  const achievementCount = agent.unlockedAchievements.length

  return (
    <motion.div
      layout
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      whileTap={{ scale: 0.97 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="group relative cursor-pointer"
    >
      {/* Animated gradient border — glows on hover */}
      <div
        className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `conic-gradient(from var(--angle), ${config.color}, transparent 30%, ${config.color}80 60%, transparent 80%, ${config.color})`,
          animation: 'spin-border 3s linear infinite',
        }}
      />
      {/* Always-on subtle border for active */}
      {active && (
        <div
          className="absolute -inset-[1px] rounded-2xl"
          style={{
            background: `conic-gradient(from var(--angle), ${config.color}, transparent 30%, ${config.color}80 60%, transparent 80%, ${config.color})`,
            animation: 'spin-border 3s linear infinite',
          }}
        />
      )}

      {/* Stage glow pulse */}
      <motion.div
        className="absolute -inset-3 rounded-3xl -z-10 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${config.color}20, transparent 70%)` }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Card body */}
      <div
        className={cn(
          'relative glass rounded-2xl p-4 overflow-hidden',
          active && 'bg-white/[0.06]'
        )}
        style={active ? { boxShadow: `0 0 32px ${config.color}25, inset 0 0 32px ${config.color}08` } : {}}
      >
        {/* Subtle inner shimmer stripe */}
        <div
          className="absolute top-0 left-0 w-full h-px opacity-40"
          style={{ background: `linear-gradient(90deg, transparent, ${config.color}60, transparent)` }}
        />

        <div className="flex items-start gap-3">
          {/* Emoji avatar with glowing ring */}
          <div className="relative flex-shrink-0">
            <motion.div
              className="w-13 h-13 w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-2xl"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${config.color}40, ${config.color}15)`,
                border: `1px solid ${config.color}40`,
                boxShadow: `0 0 16px ${config.color}30, inset 0 1px 0 ${config.color}20`,
              }}
              whileHover={{ scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {agent.emoji}
            </motion.div>
            {/* Streak badge */}
            {hasStreak && (
              <motion.div
                className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 bg-zinc-900 border border-orange-500/50 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-orange-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                style={{ boxShadow: '0 0 8px rgba(249,115,22,0.4)' }}
              >
                🔥{agent.streak}
              </motion.div>
            )}
          </div>

          {/* Info block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h3 className="font-bold text-zinc-100 truncate tracking-tight">{agent.name}</h3>
              <StageIndicator stage={agent.stage} xp={agent.xp} compact />
              {achievementCount > 0 && (
                <motion.span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/15 border border-yellow-500/30 text-yellow-400"
                  whileHover={{ scale: 1.1 }}
                >
                  🏆 {achievementCount}
                </motion.span>
              )}
            </div>
            <p className="text-xs text-zinc-500 italic truncate">{agent.personality}</p>
            <p className="text-[11px] text-zinc-700 mt-0.5">{timeAgo(agent.lastInteraction)}</p>
          </div>

          {/* XP block */}
          <div className="text-right flex-shrink-0 space-y-0.5">
            <motion.div
              className="text-sm font-black tabular-nums"
              style={{ color: config.color, textShadow: `0 0 12px ${config.color}60` }}
            >
              {agent.xp.toLocaleString()} XP
            </motion.div>
            <div className="text-[11px] text-zinc-600">{agent.totalInteractions} msgs</div>
          </div>
        </div>

        {/* Mini XP progress bar with shine sweep */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>Progress to next stage</span>
            <span style={{ color: config.color }}>{progress}%</span>
          </div>
          <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${config.color}90, ${config.color})`,
                boxShadow: `0 0 8px ${config.color}60`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
            />
            {/* Shine sweep */}
            <motion.div
              className="absolute inset-y-0 w-12 rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                left: '-48px',
              }}
              animate={{ left: ['−48px', '110%'] }}
              transition={{ duration: 1.8, delay: 0.9, ease: 'easeInOut', repeat: Infinity, repeatDelay: 4 }}
            />
          </div>
        </div>

        {/* Full stage indicator */}
        <div className="mt-3">
          <StageIndicator stage={agent.stage} xp={agent.xp} />
        </div>
      </div>

      {/* CSS for spinning conic gradient border */}
      <style jsx>{`
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes spin-border {
          to { --angle: 360deg; }
        }
      `}</style>
    </motion.div>
  )
}
