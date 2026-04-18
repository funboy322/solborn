'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import type { AgentSkills } from '@/lib/types'

// Per-skill color gradients — each gets its own distinct identity
const TRAIT_CONFIG: Record<keyof AgentSkills, {
  label: string
  emoji: string
  gradient: [string, string]
  glow: string
}> = {
  curiosity: {
    label: 'Curiosity',
    emoji: '🔍',
    gradient: ['#a78bfa', '#7c3aed'],
    glow: '#a78bfa',
  },
  solanaKnowledge: {
    label: 'Solana',
    emoji: '◎',
    gradient: ['#14f195', '#9945ff'],
    glow: '#14f195',
  },
  codingSkill: {
    label: 'Coding',
    emoji: '⚡',
    gradient: ['#38bdf8', '#0ea5e9'],
    glow: '#38bdf8',
  },
  creativity: {
    label: 'Creativity',
    emoji: '✨',
    gradient: ['#f472b6', '#ec4899'],
    glow: '#f472b6',
  },
  founderMindset: {
    label: 'Founder',
    emoji: '🚀',
    gradient: ['#fb923c', '#ea580c'],
    glow: '#fb923c',
  },
}

interface TraitBarProps {
  traitKey: keyof AgentSkills
  value: number
  isHighest: boolean
  delay: number
}

function TraitBar({ traitKey, value, isHighest, delay }: TraitBarProps) {
  const [hovered, setHovered] = useState(false)
  const cfg = TRAIT_CONFIG[traitKey]
  const [colorStart, colorEnd] = cfg.gradient

  return (
    <motion.div
      className="space-y-1.5 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.08, duration: 0.4, ease: 'easeOut' }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
          <motion.span
            animate={isHighest ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {cfg.emoji}
          </motion.span>
          <span className="group-hover:text-zinc-200 transition-colors duration-150">
            {cfg.label}
          </span>
          {isHighest && (
            <motion.span
              className="text-[9px] font-bold px-1 py-0.5 rounded"
              style={{ color: colorStart, background: `${colorStart}20` }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              PEAK
            </motion.span>
          )}
        </span>
        <motion.span
          className="font-mono font-bold tabular-nums transition-all duration-200"
          style={{ color: hovered ? colorStart : 'rgba(228,228,231,0.7)' }}
        >
          {value}
        </motion.span>
      </div>

      {/* Bar track */}
      <div className="relative h-2 bg-white/5 rounded-full overflow-visible">
        {/* Track inner shadow for depth */}
        <div className="absolute inset-0 rounded-full shadow-inner ring-1 ring-inset ring-white/5" />

        {/* Filled portion */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${colorStart}, ${colorEnd})`,
            boxShadow: hovered
              ? `0 0 16px ${cfg.glow}90, 0 0 4px ${cfg.glow}`
              : isHighest
                ? `0 0 10px ${cfg.glow}60`
                : `0 0 4px ${cfg.glow}30`,
          }}
          initial={{ width: 0 }}
          animate={{
            width: `${value}%`,
            boxShadow: isHighest && !hovered
              ? [
                  `0 0 6px ${cfg.glow}50`,
                  `0 0 14px ${cfg.glow}80`,
                  `0 0 6px ${cfg.glow}50`,
                ]
              : undefined,
          }}
          transition={{
            width: { duration: 0.7, delay: delay * 0.08 + 0.15, ease: [0.22, 1, 0.36, 1] },
            boxShadow: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-y-0 w-8 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
              right: 0,
            }}
            animate={{ right: ['-32px', '100%'] }}
            transition={{
              duration: 1.5,
              delay: delay * 0.08 + 0.8,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 5 + delay * 0.3,
            }}
          />
        </motion.div>

        {/* Hover tooltip-like percent label */}
        <motion.div
          className="absolute -top-6 text-[10px] font-bold px-1.5 py-0.5 rounded pointer-events-none"
          style={{
            left: `${Math.min(value, 90)}%`,
            color: colorStart,
            background: `${colorStart}20`,
            border: `1px solid ${colorStart}40`,
            transform: 'translateX(-50%)',
          }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 4 }}
          transition={{ duration: 0.15 }}
        >
          {value}%
        </motion.div>
      </div>
    </motion.div>
  )
}

interface TraitRadarProps {
  traits: AgentSkills
  color: string
}

export function TraitRadar({ traits, color: _color }: TraitRadarProps) {
  const traitKeys = Object.keys(traits) as (keyof AgentSkills)[]
  const maxValue = Math.max(...traitKeys.map((k) => traits[k]))
  const highestKey = traitKeys.find((k) => traits[k] === maxValue) ?? traitKeys[0]

  return (
    <div className="space-y-3">
      {traitKeys.map((key, idx) => (
        <TraitBar
          key={key}
          traitKey={key}
          value={traits[key]}
          isHighest={key === highestKey}
          delay={idx}
        />
      ))}
    </div>
  )
}
