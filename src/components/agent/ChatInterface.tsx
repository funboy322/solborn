'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AchievementToastStack } from '@/components/agent/AchievementToast'
import { EnergyBar } from '@/components/agent/EnergyBar'
import { SupportBanner } from '@/components/agent/SupportBanner'
import { MessageFeedback } from '@/components/agent/MessageFeedback'
import { useForgeStore } from '@/lib/store'
import { useWallet } from '@solana/wallet-adapter-react'
import { STAGE_CONFIG, ENERGY_PER_MESSAGE, MAX_ENERGY, ENERGY_REGEN_PER_MIN } from '@/lib/constants'
import { nanoid } from '@/lib/utils'
import { applyTraitBoosts } from '@/lib/ai/trait-analyzer'
import { calculateTeachingXP, isRepetitive } from '@/lib/ai/xp-calculator'
import { checkNewAchievements, calculateStreak, getStreakBonus } from '@/lib/achievements'
import { SFX } from '@/lib/sounds'
import { useDemoMode, DEMO_XP_MULTIPLIER, DEMO_ENERGY_COST } from '@/lib/demo-mode'
import type { ForgeAgent, Achievement } from '@/lib/types'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  xpGained?: number
}

interface XPEvent {
  id: string
  xp: number
  streakBonus: number
  quality: string
}

interface ChatInterfaceProps {
  agent: ForgeAgent
}

const SUGGESTED_PROMPTS: Record<ForgeAgent['stage'], string[]> = {
  baby: [
    'What is Solana? Let me teach you!',
    "I'll explain what a startup is",
    'Do you know what blockchain means?',
  ],
  toddler: [
    'Let me explain how DeFi works',
    'What do you think about product-market fit?',
    'Here is how Solana programs work...',
  ],
  teen: [
    'Design a token staking program',
    'Review my go-to-market strategy',
    'Write a Solana program in Rust',
  ],
  adult: [
    'Publish your Launch Certificate',
    "What's your vision for this project?",
    "Let's deploy to Solana!",
  ],
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  return `${Math.floor(diff / 3_600_000)}h ago`
}

function XPParticle({ xp, streakBonus, quality, onDone }: { xp: number; streakBonus: number; quality: string; onDone: () => void }) {
  const color = quality === 'great' ? '#34d399' : quality === 'good' ? '#a78bfa' : quality === 'decent' ? '#f59e0b' : '#71717a'
  const emoji = quality === 'great' ? '🔥' : quality === 'good' ? '✨' : quality === 'decent' ? '⭐' : '+'
  return (
    <motion.div
      className="pointer-events-none absolute bottom-20 right-6 z-50 flex flex-col items-end gap-1"
      initial={{ opacity: 0, y: 0, scale: 0.6 }}
      animate={{ opacity: [0, 1, 1, 0], y: [0, -8, -40, -72], scale: [0.6, 1.2, 1, 0.8] }}
      transition={{ duration: 1.6, times: [0, 0.15, 0.7, 1], ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      <span className="text-base font-black drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" style={{ color }}>
        {emoji} +{xp} XP
      </span>
      {streakBonus > 0 && (
        <motion.span
          className="text-xs font-bold text-amber-400"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          🔥 +{streakBonus} streak!
        </motion.span>
      )}
    </motion.div>
  )
}

/** Show XP=0 "spam" feedback */
function SpamWarning({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      className="pointer-events-none absolute bottom-20 right-6 z-50"
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: [0, 1, 1, 0], y: [0, -8, -30, -50] }}
      transition={{ duration: 1.8, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      <span className="text-sm font-bold text-zinc-500">Teach me something! 🥺</span>
    </motion.div>
  )
}

export function ChatInterface({ agent }: ChatInterfaceProps) {
  const gainXP = useForgeStore((s) => s.gainXP)
  const updateTraits = useForgeStore((s) => s.updateTraits)
  const unlockAchievement = useForgeStore((s) => s.unlockAchievement)
  const updateStreak = useForgeStore((s) => s.updateStreak)
  const incrementLongResponses = useForgeStore((s) => s.incrementLongResponses)
  const consumeEnergy = useForgeStore((s) => s.consumeEnergy)
  const regenEnergy = useForgeStore((s) => s.regenEnergy)
  const registerTraining = useForgeStore((s) => s.registerTraining)
  const { publicKey } = useWallet()
  const trainerWallet = publicKey?.toBase58() ?? null
  const demo = useDemoMode()
  const stageConfig = STAGE_CONFIG[agent.stage]
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [xpEvents, setXpEvents] = useState<XPEvent[]>([])
  const [spamWarnings, setSpamWarnings] = useState<string[]>([])
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [toastAchievements, setToastAchievements] = useState<Achievement[]>([])
  const [screenShake, setScreenShake] = useState(false)
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null)
  const [inputFocused, setInputFocused] = useState(false)
  // Flips true after the first assistant reply finishes streaming. Drives SupportBanner.
  const [firstReplyDone, setFirstReplyDone] = useState(false)

  // Live energy (regens over time without forcing store updates constantly)
  const [displayEnergy, setDisplayEnergy] = useState(agent.energy ?? MAX_ENERGY)
  useEffect(() => {
    // Compute regen locally for display
    const interval = setInterval(() => {
      const elapsed = (Date.now() - (agent.lastEnergyUpdate ?? Date.now())) / 60_000
      const regen = Math.min(agent.maxEnergy ?? MAX_ENERGY, (agent.energy ?? MAX_ENERGY) + elapsed * ENERGY_REGEN_PER_MIN)
      setDisplayEnergy(Math.round(regen))
    }, 10_000)
    setDisplayEnergy(Math.round(agent.energy ?? MAX_ENERGY))
    return () => clearInterval(interval)
  }, [agent.energy, agent.lastEnergyUpdate, agent.maxEnergy])

  // Trigger regen sync on mount
  useEffect(() => {
    regenEnergy(agent.id)
  }, [agent.id, regenEnergy])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  const triggerScreenShake = useCallback(() => {
    setScreenShake(true)
    setTimeout(() => setScreenShake(false), 600)
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    // Energy gate (bypassed in demo mode — cost is 0, always passes)
    const energyCost = demo ? DEMO_ENERGY_COST : ENERGY_PER_MESSAGE
    if (energyCost > 0) {
      const hasEnergy = consumeEnergy(agent.id, energyCost)
      if (!hasEnergy) {
        setSpamWarnings((prev) => [...prev, nanoid()])
        return
      }
      setDisplayEnergy((e) => Math.max(0, e - energyCost))
    }

    // Spam / repetition gate
    const recentUserMsgs = messages.filter((m) => m.role === 'user').map((m) => m.content)
    const isSpam = isRepetitive(text, recentUserMsgs)

    const userMsg: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    }
    const allMessages = [...messages, userMsg]
    setMessages(allMessages)
    setInput('')
    setIsLoading(true)

    const assistantId = nanoid()
    setStreamingId(assistantId)
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() },
    ])

    let accumulated = ''

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent,
          trainerWallet,
          // Send only non-empty messages, exclude empty streaming placeholder
          messages: allMessages
            .filter((m) => m.content.trim().length > 0)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error')
        throw new Error(errText || `HTTP ${res.status}`)
      }
      if (!res.body) throw new Error('No stream body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const snapshot = accumulated
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: snapshot } : m))
        )
      }

      SFX.message()
      setFirstReplyDone(true)

      if (accumulated.length > 200) incrementLongResponses(agent.id)

      const { streak, bestStreak } = calculateStreak(agent)
      updateStreak(agent.id, streak, bestStreak)
      const streakBonus = getStreakBonus(streak)

      // ── Teaching XP (replaces flat XP_PER_MESSAGE) ──
      const breakdown = isSpam
        ? { total: 0, quality: 'spam' as const, traitBoosts: {} }
        : calculateTeachingXP(text.trim(), accumulated, agent.stage)

      const baseXP = breakdown.total + streakBonus
      // Demo mode: multiply XP so judges can hit Adult in 3–4 messages for the 60s video
      const totalXP = demo ? baseXP * DEMO_XP_MULTIPLIER : baseXP
      if (totalXP > 0) {
        gainXP(agent.id, totalXP)
        SFX.xpGain()
        setXpEvents((prev) => [...prev, { id: nanoid(), xp: totalXP, streakBonus, quality: breakdown.quality }])
      } else {
        setSpamWarnings((prev) => [...prev, nanoid()])
      }

      // Register training contribution under the connected wallet.
      // Credits the teacher, not the agent's creator.
      if (trainerWallet) {
        registerTraining(agent.id, trainerWallet, totalXP)
      }

      // Trait boosts from xp-calculator (Partial<AgentTraits> → TraitBoost[])
      if (breakdown.traitBoosts && Object.keys(breakdown.traitBoosts).length > 0) {
        const boostArray = Object.entries(breakdown.traitBoosts).map(([trait, amount]) => ({
          trait: trait as keyof import('@/lib/types').AgentTraits,
          amount: amount ?? 1,
        }))
        const boosted = applyTraitBoosts(agent.traits, boostArray)
        updateTraits(agent.id, boosted)
      }

      // Achievements
      const freshAgent = useForgeStore.getState().agents.find((a) => a.id === agent.id)
      if (freshAgent) {
        const newAchievements = checkNewAchievements(freshAgent)
        if (newAchievements.length > 0) {
          newAchievements.forEach((ach) => {
            unlockAchievement(agent.id, ach.id)
            gainXP(agent.id, ach.xpBonus)
          })
          setToastAchievements((prev) => [...prev, ...newAchievements])
          triggerScreenShake()
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[ChatInterface] stream error:', errMsg)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `⚠️ ${errMsg.includes('503') ? 'AI is busy — try again in a second.' : 'Something went wrong. Try again.'}` }
            : m
        )
      )
      // Refund energy on error
      regenEnergy(agent.id)
    } finally {
      setIsLoading(false)
      setStreamingId(null)
    }
  }, [messages, isLoading, agent, gainXP, updateTraits, unlockAchievement, updateStreak, incrementLongResponses, consumeEnergy, regenEnergy, triggerScreenShake, registerTraining, trainerWallet, demo])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const noEnergy = !demo && displayEnergy < ENERGY_PER_MESSAGE
  const suggested = SUGGESTED_PROMPTS[agent.stage]
  const hasInput = input.trim().length > 0

  return (
    <motion.div
      className="flex flex-col h-full relative"
      animate={screenShake ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      {/* Energy bar at top */}
      <div className="px-4 pt-3 pb-2 border-b border-white/5 flex items-center gap-3">
        <div className="flex-1">
          <EnergyBar energy={displayEnergy} maxEnergy={agent.maxEnergy ?? MAX_ENERGY} compact />
        </div>
        {demo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider text-amber-300"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(236,72,153,0.2))',
              border: '1px solid rgba(245,158,11,0.5)',
              boxShadow: '0 0 12px rgba(245,158,11,0.3)',
            }}
            title="Demo mode: ×50 XP, infinite energy. Remove ?demo=1 to return to normal play."
          >
            DEMO ×{DEMO_XP_MULTIPLIER}
          </motion.div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 p-4 min-h-0 scroll-smooth">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-8"
          >
            <motion.div
              className="text-5xl mb-4 inline-block"
              animate={{
                scale: [1, 1.06, 1],
                filter: [
                  `drop-shadow(0 0 8px ${stageConfig.color}40)`,
                  `drop-shadow(0 0 20px ${stageConfig.color}80)`,
                  `drop-shadow(0 0 8px ${stageConfig.color}40)`,
                ],
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              {agent.emoji}
            </motion.div>
            <p className="text-zinc-300 text-sm font-medium">
              {agent.stage === 'baby'
                ? `${agent.name} knows nothing yet — start teaching!`
                : `Say something to ${agent.name}`}
            </p>
            <p className="text-zinc-600 text-xs mt-1">{stageConfig.description}</p>
            <p className="text-zinc-700 text-xs mt-2">
              💡 Better explanations = more XP
            </p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`flex gap-3 group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              onMouseEnter={() => setHoveredMsgId(msg.id)}
              onMouseLeave={() => setHoveredMsgId(null)}
            >
              {msg.role === 'assistant' && (
                <motion.div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5 relative"
                  style={{ background: `${stageConfig.color}18` }}
                  animate={{
                    boxShadow:
                      msg.id === streamingId
                        ? [`0 0 0px ${stageConfig.color}00`, `0 0 12px ${stageConfig.color}60`, `0 0 0px ${stageConfig.color}00`]
                        : `0 0 0px ${stageConfig.color}00`,
                  }}
                  transition={msg.id === streamingId ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : {}}
                >
                  {agent.emoji}
                </motion.div>
              )}

              <div className="max-w-[80%] relative">
                {msg.role === 'user' ? (
                  <div
                    className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed whitespace-pre-wrap text-violet-100"
                    style={{
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(139,92,246,0.25) 100%)',
                      border: '1px solid rgba(139,92,246,0.35)',
                    }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div
                    className="px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed whitespace-pre-wrap text-zinc-200"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      backdropFilter: 'blur(12px)',
                      border: `1px solid ${stageConfig.color}28`,
                    }}
                  >
                    {msg.content}
                    {msg.id === streamingId && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="inline-block w-0.5 h-3.5 bg-zinc-400 ml-0.5 align-middle"
                      />
                    )}
                  </div>
                )}

                {/* Feedback (only on completed assistant messages) */}
                {msg.role === 'assistant' && msg.id !== streamingId && msg.content.length > 0 && (
                  <MessageFeedback
                    agentId={agent.id}
                    agentStage={agent.stage}
                    messageId={msg.id}
                    userMessage={messages[idx - 1]?.role === 'user' ? messages[idx - 1].content : ''}
                    assistantMessage={msg.content}
                    trainerWallet={trainerWallet}
                  />
                )}

                <AnimatePresence>
                  {hoveredMsgId === msg.id && (
                    <motion.span
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 2 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute -bottom-5 text-[10px] text-zinc-600 whitespace-nowrap ${msg.role === 'user' ? 'right-0' : 'left-0'}`}
                    >
                      {formatRelativeTime(msg.timestamp)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && !streamingId && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${stageConfig.color}18` }}>
              {agent.emoji}
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${stageConfig.color}28` }}>
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: stageConfig.color }}
                    animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.2, 0.8], y: [0, -3, 0] }}
                    transition={{ duration: 0.9, delay: i * 0.18, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Suggested prompts */}
      {messages.length === 0 && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap">
          {suggested.map((prompt, i) => (
            <motion.button
              key={prompt}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
              onClick={() => sendMessage(prompt)}
              disabled={noEnergy || isLoading}
              className="text-xs px-3 py-1.5 rounded-full text-zinc-400 hover:text-zinc-100 transition-colors relative disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      )}

      {/* Floating XP particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <AnimatePresence>
          {xpEvents.map((ev) => (
            <XPParticle
              key={ev.id}
              xp={ev.xp}
              streakBonus={ev.streakBonus}
              quality={ev.quality}
              onDone={() => setXpEvents((prev) => prev.filter((e) => e.id !== ev.id))}
            />
          ))}
          {spamWarnings.map((id) => (
            <SpamWarning key={id} onDone={() => setSpamWarnings((prev) => prev.filter((s) => s !== id))} />
          ))}
        </AnimatePresence>
      </div>

      {/* No-energy banner */}
      <AnimatePresence>
        {noEnergy && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mx-4 mb-2 px-3 py-2 rounded-xl text-xs text-rose-300 flex items-center gap-2"
            style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}
          >
            <Zap size={12} />
            <span>No energy — regen 2/min or connect wallet to refill</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 pt-2">
        <motion.div
          className="flex gap-2 items-center rounded-2xl px-4 py-2 relative"
          animate={{
            boxShadow: inputFocused
              ? `0 0 0 1px rgba(139,92,246,0.6), 0 0 20px rgba(139,92,246,0.2)`
              : noEnergy
              ? `0 0 0 1px rgba(244,63,94,0.3)`
              : `0 0 0 1px rgba(255,255,255,0.08)`,
          }}
          transition={{ duration: 0.2 }}
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)' }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={noEnergy ? 'Recharging energy...' : `Teach ${agent.name}...`}
            disabled={isLoading || noEnergy}
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none disabled:opacity-50 py-0.5"
          />
          <motion.div
            animate={hasInput && !isLoading && !noEnergy ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 1.2, repeat: hasInput && !isLoading && !noEnergy ? Infinity : 0, ease: 'easeInOut' }}
          >
            <Button type="submit" size="sm" disabled={isLoading || !hasInput || noEnergy} className="rounded-xl">
              <Send size={14} />
            </Button>
          </motion.div>
        </motion.div>
      </form>

      <SupportBanner trigger={firstReplyDone} />

      <AchievementToastStack
        achievements={toastAchievements}
        onDismiss={(id) => setToastAchievements((prev) => prev.filter((a) => a.id !== id))}
      />
    </motion.div>
  )
}
