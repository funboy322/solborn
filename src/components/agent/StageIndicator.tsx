'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { STAGE_CONFIG, STAGE_ORDER } from '@/lib/constants'
import type { AgentStage } from '@/lib/types'

interface StageIndicatorProps {
  stage: AgentStage
  xp: number
  compact?: boolean
}

export function StageIndicator({ stage, xp, compact }: StageIndicatorProps) {
  const config = STAGE_CONFIG[stage]
  const stageIdx = STAGE_ORDER.indexOf(stage)

  const xpRequired = config.xpRequired
  const xpToNext = config.xpToNext
  const progress = xpToNext === Infinity
    ? 100
    : Math.min(100, Math.round(((xp - xpRequired) / (xpToNext - xpRequired)) * 100))

  const xpDisplay = xpToNext === Infinity
    ? `${xp} XP — MAX`
    : `${xp} / ${xpToNext} XP`

  // ── Compact pill ──────────────────────────────────────────────────────────
  if (compact) {
    return (
      <motion.span
        className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border overflow-hidden"
        style={{
          color: config.color,
          borderColor: `${config.color}45`,
          background: `${config.color}18`,
          boxShadow: `0 0 10px ${config.color}20`,
        }}
        animate={{ boxShadow: [`0 0 6px ${config.color}20`, `0 0 14px ${config.color}40`, `0 0 6px ${config.color}20`] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* tiny animated dot */}
        <motion.span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: config.color }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {config.label}
        {/* Subtle shimmer */}
        <motion.span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: `linear-gradient(105deg, transparent 40%, ${config.color}25 50%, transparent 60%)` }}
          animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
      </motion.span>
    )
  }

  // ── Full indicator ────────────────────────────────────────────────────────
  return (
    <div className="space-y-2.5">

      {/* Stage pipeline dots */}
      <div className="flex items-center gap-1.5">
        {STAGE_ORDER.map((s, i) => {
          const stageConf = STAGE_CONFIG[s]
          const isActive = i === stageIdx
          const isPast = i < stageIdx
          const isFuture = i > stageIdx

          return (
            <div key={s} className="flex items-center gap-1.5 flex-1">
              {/* Dot */}
              <div className="relative flex-shrink-0">
                <motion.div
                  className={cn(
                    'w-2.5 h-2.5 rounded-full border transition-all duration-500',
                  )}
                  style={{
                    background: isPast || isActive ? stageConf.color : 'transparent',
                    borderColor: isFuture ? 'rgba(255,255,255,0.12)' : stageConf.color,
                    boxShadow: isActive ? `0 0 10px ${stageConf.color}, 0 0 20px ${stageConf.color}60` : isPast ? `0 0 6px ${stageConf.color}50` : 'none',
                  }}
                  animate={isActive ? {
                    scale: [1, 1.25, 1],
                    boxShadow: [
                      `0 0 8px ${stageConf.color}80`,
                      `0 0 18px ${stageConf.color}`,
                      `0 0 8px ${stageConf.color}80`,
                    ],
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              {/* Connector bar (between dots) */}
              {i < STAGE_ORDER.length - 1 && (
                <div className="flex-1 h-0.5 bg-white/6 rounded-full overflow-hidden relative">
                  {isPast && (
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${stageConf.color}, ${STAGE_CONFIG[STAGE_ORDER[i + 1]].color})`,
                        boxShadow: `0 0 4px ${stageConf.color}`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.6, delay: i * 0.15, ease: 'easeOut' }}
                    />
                  )}
                  {isActive && (
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${stageConf.color}, ${stageConf.color}40)`,
                        boxShadow: `0 0 4px ${stageConf.color}60`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Stage label badge + XP numeric */}
      <div className="flex items-center justify-between">
        <div
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold"
          style={{
            color: config.color,
            background: `${config.color}18`,
            border: `1px solid ${config.color}35`,
          }}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: config.color }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          {config.label}
        </div>
        <span className="text-[11px] font-mono font-medium" style={{ color: `${config.color}cc` }}>
          {xpDisplay}
        </span>
      </div>

      {/* Segmented XP bar */}
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        {/* Fill */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${config.color}80, ${config.color})`,
            boxShadow: `0 0 8px ${config.color}70`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
        {/* Shimmer sweep over fill */}
        <motion.div
          className="absolute inset-y-0 w-16 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          }}
          animate={{ left: ['-64px', '110%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
        />
        {/* Segment ticks */}
        {[25, 50, 75].map((pct) => (
          <div
            key={pct}
            className="absolute inset-y-0 w-px bg-black/30"
            style={{ left: `${pct}%` }}
          />
        ))}
      </div>
    </div>
  )
}
