'use client'
import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import { rankTrainers } from '@/lib/store'
import type { ForgeAgent } from '@/lib/types'

interface TrainersPanelProps {
  agent: ForgeAgent
  currentWallet: string | null
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

export function TrainersPanel({ agent, currentWallet }: TrainersPanelProps) {
  const ranked = rankTrainers(agent)
  const top = ranked.slice(0, 5)
  const creator = agent.walletAddress

  if (ranked.length === 0) {
    return (
      <div className="glass p-4">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Trainers
        </h2>
        <p className="text-xs text-zinc-600">
          No trainers yet. Connect a wallet and start teaching.
        </p>
      </div>
    )
  }

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Trainers
        </h2>
        <span className="text-[10px] text-zinc-600">
          {ranked.length} {ranked.length === 1 ? 'person' : 'people'}
        </span>
      </div>

      <div className="space-y-2">
        {top.map((t, i) => {
          const isCreator = t.walletAddress === creator
          const isYou = t.walletAddress === currentWallet
          const pct = Math.round(t.share * 100)
          return (
            <motion.div
              key={t.walletAddress}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  {isCreator && <Crown size={10} className="text-amber-400 flex-shrink-0" />}
                  <span
                    className={`font-mono truncate ${
                      isYou ? 'text-emerald-300 font-semibold' : 'text-zinc-300'
                    }`}
                  >
                    {shortAddr(t.walletAddress)}
                  </span>
                  {isYou && (
                    <span className="text-[9px] text-emerald-500 font-semibold uppercase tracking-wider">
                      you
                    </span>
                  )}
                </div>
                <span className="text-zinc-500 font-mono tabular-nums flex-shrink-0">
                  {t.xpContributed} XP · {pct}%
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: isYou
                      ? 'linear-gradient(90deg, #34d399, #10b981)'
                      : isCreator
                      ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                      : 'linear-gradient(90deg, #a78bfa, #8b5cf6)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, pct)}%` }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {ranked.length > 5 && (
        <p className="mt-3 text-[10px] text-zinc-600 text-center">
          +{ranked.length - 5} more
        </p>
      )}

      <p className="mt-3 pt-3 border-t border-white/5 text-[10px] text-zinc-600 leading-relaxed">
        XP splits royalties when the agent ships its first project.
      </p>
    </div>
  )
}
