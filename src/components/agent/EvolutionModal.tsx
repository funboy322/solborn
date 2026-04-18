'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { STAGE_CONFIG } from '@/lib/constants'
import type { AgentStage } from '@/lib/types'

interface EvolutionModalProps {
  open: boolean
  fromStage: AgentStage
  toStage: AgentStage
  agentName: string
  agentEmoji: string
  onClose: () => void
}

// Particle burst effect
function Particles({ color }: { color: string }) {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    angle: (i / 24) * Math.PI * 2,
    distance: 80 + Math.random() * 60,
    size: 3 + Math.random() * 4,
    delay: Math.random() * 0.3,
  }))

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: color,
            left: '50%',
            top: '50%',
            boxShadow: `0 0 6px ${color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: 0,
            scale: 0,
          }}
          transition={{
            duration: 1.2,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </>
  )
}

// Ring pulse effect
function RingPulse({ color }: { color: string }) {
  return (
    <>
      {[0, 0.3, 0.6].map((delay) => (
        <motion.div
          key={delay}
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: color }}
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 1.5, delay, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}

export function EvolutionModal({
  open,
  fromStage,
  toStage,
  agentName,
  agentEmoji,
  onClose,
}: EvolutionModalProps) {
  const [phase, setPhase] = useState<'flash' | 'reveal' | 'done'>('flash')
  const fromConfig = STAGE_CONFIG[fromStage]
  const toConfig = STAGE_CONFIG[toStage]

  useEffect(() => {
    if (!open) return
    setPhase('flash')
    const t1 = setTimeout(() => setPhase('reveal'), 800)
    const t2 = setTimeout(() => setPhase('done'), 2000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          {/* Content */}
          <motion.div className="relative z-10 flex flex-col items-center text-center px-6">

            {/* Flash phase — white burst */}
            {phase === 'flash' && (
              <motion.div
                className="w-32 h-32 rounded-full relative flex items-center justify-center"
                initial={{ scale: 0.3 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 8, stiffness: 200 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: `radial-gradient(circle, ${toConfig.color}60, transparent)` }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 1 }}
                />
                <motion.div
                  className="text-6xl"
                  animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6 }}
                >
                  {agentEmoji}
                </motion.div>
              </motion.div>
            )}

            {/* Reveal phase — particles + new stage */}
            {(phase === 'reveal' || phase === 'done') && (
              <motion.div
                className="relative flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
              >
                {/* Emoji with effects */}
                <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                  <Particles color={toConfig.color} />
                  <RingPulse color={toConfig.color} />
                  <motion.div
                    className="text-6xl relative z-10"
                    initial={{ scale: 0.5, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 8 }}
                  >
                    {agentEmoji}
                  </motion.div>
                </div>

                {/* Evolution text */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-zinc-500 uppercase tracking-widest">Evolution</p>

                  <div className="flex items-center gap-3">
                    <span
                      className="text-sm font-medium px-3 py-1 rounded-full"
                      style={{
                        color: fromConfig.color,
                        background: `${fromConfig.color}20`,
                      }}
                    >
                      {fromConfig.label}
                    </span>
                    <motion.span
                      className="text-zinc-600"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                    <span
                      className="text-sm font-bold px-3 py-1 rounded-full"
                      style={{
                        color: toConfig.color,
                        background: `${toConfig.color}20`,
                        boxShadow: `0 0 20px ${toConfig.color}30`,
                      }}
                    >
                      {toConfig.label}
                    </span>
                  </div>

                  <motion.h2
                    className="text-2xl font-bold"
                    style={{ color: toConfig.color }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {agentName} evolved!
                  </motion.h2>

                  <motion.p
                    className="text-sm text-zinc-400 max-w-xs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    {toConfig.description}
                  </motion.p>

                  {/* New abilities */}
                  <motion.div
                    className="flex flex-wrap gap-2 justify-center mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {toConfig.abilities.map((ability) => (
                      <span
                        key={ability}
                        className="text-xs px-2.5 py-1 rounded-full border"
                        style={{
                          color: toConfig.color,
                          borderColor: `${toConfig.color}40`,
                          background: `${toConfig.color}10`,
                        }}
                      >
                        {ability}
                      </span>
                    ))}
                  </motion.div>

                  {/* Continue button */}
                  <motion.button
                    className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                    style={{
                      background: toConfig.color,
                      boxShadow: `0 0 30px ${toConfig.color}40`,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    onClick={onClose}
                  >
                    Continue Journey
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
