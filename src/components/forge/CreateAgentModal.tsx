'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/wallet/WalletButton'
import { useForgeStore } from '@/lib/store'
import { PERSONALITIES } from '@/lib/constants'
import { SFX } from '@/lib/sounds'
import { useSolanaSigner } from '@/lib/hooks/useSolanaSigner'

const EMOJIS = ['🤖', '🦊', '🐉', '🦅', '🔥', '⚡', '🌟', '🎯', '💎', '🚀', '🧬', '🌊']

const PERSONALITY_META: Record<string, { icon: string; description: string }> = {
  'ambitious dreamer': { icon: '🌠', description: 'Shoots for the moon. Bold ideas, relentless optimism, never settles.' },
  'pragmatic builder': { icon: '🔧', description: 'Ships first, refines later. Execution over perfection, always.' },
  'creative disruptor': { icon: '🎨', description: 'Breaks the mold. Finds angles others miss and rewrites the rules.' },
  'data-driven analyst': { icon: '📊', description: 'In metrics we trust. Every decision backed by evidence and logic.' },
  'community builder': { icon: '🤝', description: 'People-first. Grows tribes, earns trust, turns users into believers.' },
  'stealth operator': { icon: '🥷', description: 'Moves quietly. Builds in silence, lets the results do the talking.' },
}

const STEP_LABELS = ['Avatar', 'Name', 'Personality', 'Preview']

interface CreateAgentModalProps {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
}

export function CreateAgentModal({ open, onClose, onCreated }: CreateAgentModalProps) {
  const createAgent = useForgeStore((s) => s.createAgent)
  const { publicKey, connected } = useSolanaSigner()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🤖')
  const [personality, setPersonality] = useState(PERSONALITIES[0])
  const [birthing, setBirthing] = useState(false)
  const [birthPhase, setBirthPhase] = useState<'crack' | 'burst' | 'done' | null>(null)

  function handleClose() {
    if (birthing) return
    onClose()
    setTimeout(() => {
      setStep(0)
      setName('')
      setEmoji('🤖')
      setPersonality(PERSONALITIES[0])
      setBirthing(false)
      setBirthPhase(null)
    }, 300)
  }

  function next() { SFX.click(); setStep((s) => Math.min(s + 1, 3)) }
  function back() { SFX.click(); setStep((s) => Math.max(s - 1, 0)) }

  async function handleCreate() {
    if (!name.trim() || birthing || !connected || !publicKey) return
    setBirthing(true)
    setBirthPhase('crack')
    await new Promise((r) => setTimeout(r, 500))
    setBirthPhase('burst')
    SFX.evolve()
    await new Promise((r) => setTimeout(r, 900))
    setBirthPhase('done')
    await new Promise((r) => setTimeout(r, 200))
    const agent = createAgent({
      name: name.trim(),
      emoji,
      personality,
      walletAddress: publicKey.toBase58(),
    })
    // Fire-and-forget register in the global birth registry so the landing
    // counter is shared across all visitors, not just the current browser.
    // We intentionally don't await — a network blip here must not block UX.
    fetch('/api/stats/birth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: agent.id,
        name: agent.name,
        emoji: agent.emoji,
        wallet: agent.walletAddress ?? null,
      }),
    }).catch(() => {
      /* best-effort; local agent still works */
    })
    onCreated(agent.id)
    handleClose()
  }

  const canAdvance = step === 0 || (step === 1 && name.trim().length > 0) || step === 2 || step === 3

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

          <AnimatePresence>
            {birthPhase === 'burst' && (
              <motion.div
                className="absolute inset-0 z-20 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.55) 0%, rgba(124,58,237,0.2) 40%, transparent 75%)' }}
              />
            )}
          </AnimatePresence>

          <motion.div
            className="relative w-full max-w-md z-10 overflow-hidden"
            style={{
              background: 'rgba(10, 8, 20, 0.92)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset, 0 24px 64px rgba(0,0,0,0.6)',
            }}
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={birthing && birthPhase === 'burst'
              ? { scale: [1, 1.04, 1.02, 1], filter: ['brightness(1)', 'brightness(2)', 'brightness(1.3)', 'brightness(1)'] }
              : { scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          >
            <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #a78bfa, #6366f1, #7c3aed)', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' }} />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-zinc-100">Birth Your SolBorn Founder</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Your AI agent starts as a Baby Founder</p>
                </div>
                <button onClick={handleClose} disabled={birthing} className="text-zinc-600 hover:text-zinc-400 transition-colors disabled:opacity-30">
                  <X size={18} />
                </button>
              </div>

              {/* Wallet required banner */}
              {!connected && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl flex items-center gap-3"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}
                >
                  <Wallet size={14} className="text-violet-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 font-medium">Wallet required</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Your agent&apos;s progress is bound to your wallet</p>
                  </div>
                  <WalletButton />
                </motion.div>
              )}

              {/* Step indicators */}
              <div className="flex items-center gap-1.5 mb-6">
                {STEP_LABELS.map((label, i) => (
                  <div key={label} className="flex items-center gap-1.5 flex-1 last:flex-none">
                    <div className="flex items-center gap-1.5">
                      <motion.div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                        animate={{
                          background: i < step ? 'rgba(139,92,246,1)' : i === step ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)',
                          border: i === step ? '1.5px solid rgba(139,92,246,0.8)' : '1.5px solid transparent',
                        }}
                        transition={{ duration: 0.25 }}
                      >
                        {i < step ? <span className="text-white text-[9px]">✓</span> : <span className={i === step ? 'text-violet-300' : 'text-zinc-600'}>{i + 1}</span>}
                      </motion.div>
                      <span className={`text-[10px] font-medium hidden sm:block ${i === step ? 'text-violet-300' : i < step ? 'text-zinc-400' : 'text-zinc-700'}`}>{label}</span>
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                      <div className="flex-1 h-px mx-1" style={{ background: i < step ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.06)' }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step content */}
              <div className="min-h-[220px]">
                <AnimatePresence mode="wait">
                  {/* Step 0 — Emoji */}
                  {step === 0 && (
                    <motion.div key="step-emoji" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
                      <p className="text-sm font-medium text-zinc-300 mb-3">Choose your avatar</p>
                      <div className="grid grid-cols-6 gap-2">
                        {EMOJIS.map((e, i) => (
                          <motion.button
                            key={e}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.2 }}
                            onClick={() => { setEmoji(e); SFX.click() }}
                            className="h-11 w-11 rounded-xl text-2xl flex items-center justify-center"
                            style={{
                              background: emoji === e ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                              border: emoji === e ? '1.5px solid rgba(139,92,246,0.6)' : '1.5px solid rgba(255,255,255,0.06)',
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {e}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 1 — Name */}
                  {step === 1 && (
                    <motion.div key="step-name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
                      <p className="text-sm font-medium text-zinc-300 mb-4">Name your founder</p>
                      <motion.div className="flex flex-col items-center mb-6">
                        <motion.div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-2"
                          style={{ background: 'rgba(139,92,246,0.15)', border: '1.5px solid rgba(139,92,246,0.3)' }}
                          key={emoji}
                          initial={{ scale: 0.8, rotate: -8 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                          {emoji}
                        </motion.div>
                        <motion.p key={name} className="text-sm font-semibold text-zinc-200" animate={{ opacity: [0, 1] }} transition={{ duration: 0.2 }}>
                          {name || 'Your Founder'}
                        </motion.p>
                        <p className="text-xs text-zinc-600 mt-0.5">Baby Founder · 0 XP</p>
                      </motion.div>
                      <div className="relative">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && name.trim() && next()}
                          placeholder="e.g. Axiom, Nova, Solux..."
                          maxLength={24}
                          autoFocus
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 font-mono">{name.length}/24</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2 — Personality */}
                  {step === 2 && (
                    <motion.div key="step-personality" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
                      <p className="text-sm font-medium text-zinc-300 mb-3">Choose a personality</p>
                      <div className="grid grid-cols-2 gap-2">
                        {PERSONALITIES.map((p, i) => {
                          const meta = PERSONALITY_META[p] ?? { icon: '✨', description: '' }
                          const selected = personality === p
                          return (
                            <motion.button
                              key={p}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05, duration: 0.2 }}
                              onClick={() => { setPersonality(p); SFX.click() }}
                              className="text-left p-3 rounded-xl relative overflow-hidden"
                              style={{
                                background: selected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                                border: selected ? '1.5px solid rgba(139,92,246,0.55)' : '1.5px solid rgba(255,255,255,0.06)',
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base">{meta.icon}</span>
                                <span className={`text-xs font-semibold capitalize ${selected ? 'text-violet-300' : 'text-zinc-400'}`}>{p}</span>
                              </div>
                              <p className="text-[10px] leading-relaxed text-zinc-600">{meta.description}</p>
                            </motion.button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3 — Preview */}
                  {step === 3 && (
                    <motion.div key="step-preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }} className="flex flex-col items-center">
                      <p className="text-sm font-medium text-zinc-300 mb-5 self-start">Your founder awaits</p>

                      <motion.div
                        className="w-full p-4 rounded-2xl mb-5 relative overflow-hidden"
                        style={{ background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.25)' }}
                        animate={{ boxShadow: birthing ? '0 0 40px rgba(139,92,246,0.4)' : '0 0 0px rgba(139,92,246,0)' }}
                      >
                        <div className="flex items-center gap-4">
                          <AnimatePresence mode="wait">
                            {birthing ? (
                              <motion.div
                                key="birthing"
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                                style={{ background: 'rgba(139,92,246,0.2)' }}
                                animate={birthPhase === 'crack'
                                  ? { rotate: [-4, 4, -4, 4, 0], scale: [1, 1.05, 1, 1.05, 1] }
                                  : birthPhase === 'burst'
                                  ? { scale: [1, 1.5, 0.8, 1.1, 1], filter: ['brightness(1)', 'brightness(3)', 'brightness(1.5)', 'brightness(1)'] }
                                  : { scale: 1 }}
                                transition={{ duration: birthPhase === 'crack' ? 0.5 : 0.7 }}
                              >
                                {birthPhase === 'crack' ? '🥚' : emoji}
                              </motion.div>
                            ) : (
                              <motion.div
                                key="avatar"
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                                style={{ background: 'rgba(139,92,246,0.2)' }}
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                              >
                                {emoji}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <div>
                            <p className="text-base font-bold text-zinc-100">{name}</p>
                            <p className="text-xs text-zinc-500 mt-0.5 capitalize">{personality}</p>
                            <p className="text-xs text-zinc-600 mt-0.5">Baby Founder · 0 XP</p>
                          </div>
                        </div>
                        <AnimatePresence>
                          {birthPhase === 'burst' && (
                            <motion.div
                              className="absolute inset-0 pointer-events-none"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 0.8 }}
                              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }}
                            />
                          )}
                        </AnimatePresence>
                      </motion.div>

                      {/* Wallet info */}
                      {connected && publicKey && (
                        <div className="w-full mb-4 px-3 py-2 rounded-xl flex items-center justify-between text-xs"
                          style={{ background: 'rgba(20,241,149,0.06)', border: '1px solid rgba(20,241,149,0.15)' }}>
                          <span className="text-zinc-500">Bound to</span>
                          <span className="font-mono text-emerald-400">
                            {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-6)}
                          </span>
                        </div>
                      )}

                      {connected ? (
                        <Button className="w-full" size="lg" loading={birthing} disabled={birthing} onClick={handleCreate}>
                          {birthing
                            ? (birthPhase === 'crack' ? '🥚 Cracking...' : '✨ Emerging...')
                            : '◎ Birth Your Founder'}
                        </Button>
                      ) : (
                        <div className="w-full text-center">
                          <p className="text-xs text-zinc-500 mb-3">Connect wallet to birth your founder</p>
                          <WalletButton />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation */}
              {step < 3 && (
                <div className="flex gap-2 mt-5">
                  {step > 0 && (
                    <Button variant="ghost" size="sm" onClick={back} disabled={birthing} className="flex-1">← Back</Button>
                  )}
                  <Button size="sm" onClick={next} disabled={!canAdvance || birthing} className="flex-1">
                    {step === 2 ? 'Preview →' : 'Continue →'}
                  </Button>
                </div>
              )}

              {step === 3 && !birthing && (
                <button onClick={back} className="w-full mt-3 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                  ← Go back
                </button>
              )}
            </div>
          </motion.div>

          <style>{`
            @keyframes shimmer {
              0% { background-position: 0% 50%; }
              100% { background-position: 200% 50%; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
