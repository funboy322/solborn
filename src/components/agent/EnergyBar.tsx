'use client'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

interface EnergyBarProps {
  energy: number
  maxEnergy: number
  compact?: boolean
}

export function EnergyBar({ energy, maxEnergy, compact }: EnergyBarProps) {
  const pct = Math.max(0, Math.min(100, (energy / maxEnergy) * 100))
  const low = pct < 25
  const color = low ? '#f43f5e' : pct < 50 ? '#f59e0b' : '#34d399'

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Zap size={11} style={{ color }} />
        <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
        <span className="text-[10px] font-mono tabular-nums text-zinc-400">
          {Math.round(energy)}
        </span>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={low ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 1.2, repeat: low ? Infinity : 0 }}
          >
            <Zap size={12} style={{ color }} />
          </motion.div>
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
            Energy
          </span>
        </div>
        <span className="text-xs font-mono tabular-nums text-zinc-300">
          {Math.round(energy)}<span className="text-zinc-600">/{maxEnergy}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden relative">
        <motion.div
          className="h-full rounded-full relative"
          style={{ background: color, boxShadow: `0 0 10px ${color}80` }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        >
          {/* Shine */}
          <motion.div
            className="absolute inset-0 opacity-40"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      </div>
      {low && (
        <motion.p
          className="text-[10px] text-rose-400 mt-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Low energy — rest or refill with 0.01 SOL
        </motion.p>
      )}
    </div>
  )
}
