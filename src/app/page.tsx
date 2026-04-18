'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValue, useAnimationFrame } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Zap, Brain, Rocket, Trophy, ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateAgentModal } from '@/components/forge/CreateAgentModal'
import { WalletButton } from '@/components/wallet/WalletButton'
import { useForgeStore } from '@/lib/store'

// ─── Data ───────────────────────────────────────────────────────────────────

const STAGES = [
  {
    emoji: '👶',
    label: 'Baby',
    desc: 'Curious, asks questions, learns about Web3',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.25)',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
  },
  {
    emoji: '🧑',
    label: 'Junior',
    desc: 'Forms opinions, researches markets, builds conviction',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.25)',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.2)',
  },
  {
    emoji: '💼',
    label: 'Senior',
    desc: 'Writes code, designs architecture, reviews PRs',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
  },
  {
    emoji: '🚀',
    label: 'Adult',
    desc: 'Ships products, deploys real Solana programs',
    color: '#f43f5e',
    glow: 'rgba(244,63,94,0.25)',
    bg: 'rgba(244,63,94,0.08)',
    border: 'rgba(244,63,94,0.2)',
  },
]

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Growth',
    desc: 'Each conversation teaches your agent new skills and evolves their on-chain personality over time.',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
  },
  {
    icon: Zap,
    title: 'On-Chain Identity',
    desc: 'Every agent is a compressed NFT on Solana with dynamic attributes that update as they evolve.',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.2)',
  },
  {
    icon: Rocket,
    title: 'Ship Real Projects',
    desc: 'Adult founders generate and deploy actual Solana programs to devnet — real code, real output.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
  },
  {
    icon: Trophy,
    title: 'Hackathon Ready',
    desc: 'Built for Colosseum Frontier Hackathon 2026. Fully open source and auditable.',
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.08)',
    border: 'rgba(244,63,94,0.2)',
  },
]

const FLOATING_ITEMS = [
  { emoji: '⚡', x: '10%', y: '20%', delay: 0, duration: 5.5 },
  { emoji: '◎', x: '85%', y: '15%', delay: 1.2, duration: 6 },
  { emoji: '🔮', x: '75%', y: '65%', delay: 0.6, duration: 7 },
  { emoji: '💎', x: '15%', y: '70%', delay: 1.8, duration: 5 },
  { emoji: '🌱', x: '50%', y: '85%', delay: 2.4, duration: 6.5 },
  { emoji: '⚙️', x: '90%', y: '45%', delay: 0.3, duration: 4.8 },
]

// ─── Animated Orb ────────────────────────────────────────────────────────────

function AnimatedOrb() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Primary orb */}
      <motion.div
        className="absolute"
        style={{
          left: '50%',
          top: '40%',
          translateX: '-50%',
          translateY: '-50%',
          width: 700,
          height: 700,
          borderRadius: '60% 40% 70% 30% / 50% 60% 40% 70%',
          background: 'radial-gradient(ellipse at 40% 40%, rgba(167,139,250,0.18) 0%, rgba(52,211,153,0.10) 50%, transparent 75%)',
          filter: 'blur(60px)',
        }}
        animate={{
          borderRadius: [
            '60% 40% 70% 30% / 50% 60% 40% 70%',
            '40% 60% 30% 70% / 70% 40% 60% 30%',
            '70% 30% 50% 50% / 40% 70% 30% 60%',
            '60% 40% 70% 30% / 50% 60% 40% 70%',
          ],
          scale: [1, 1.08, 0.96, 1],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Secondary orb — offset */}
      <motion.div
        className="absolute"
        style={{
          left: '35%',
          top: '55%',
          translateX: '-50%',
          translateY: '-50%',
          width: 500,
          height: 500,
          borderRadius: '40% 60% 50% 50% / 60% 40% 60% 40%',
          background: 'radial-gradient(ellipse at 60% 60%, rgba(52,211,153,0.12) 0%, rgba(167,139,250,0.06) 60%, transparent 80%)',
          filter: 'blur(80px)',
        }}
        animate={{
          borderRadius: [
            '40% 60% 50% 50% / 60% 40% 60% 40%',
            '60% 40% 30% 70% / 40% 60% 40% 60%',
            '50% 50% 60% 40% / 50% 50% 50% 50%',
            '40% 60% 50% 50% / 60% 40% 60% 40%',
          ],
          x: [-20, 20, -10, -20],
          y: [10, -20, 15, 10],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Accent ring */}
      <motion.div
        className="absolute"
        style={{
          left: '50%',
          top: '40%',
          translateX: '-50%',
          translateY: '-50%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          border: '1px solid rgba(167,139,250,0.08)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute"
        style={{
          left: '50%',
          top: '40%',
          translateX: '-50%',
          translateY: '-50%',
          width: 550,
          height: 550,
          borderRadius: '50%',
          border: '1px solid rgba(52,211,153,0.05)',
        }}
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

// ─── Animated Counter ────────────────────────────────────────────────────────

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (target === 0) return
    const duration = 1200
    const start = performance.now()
    const raf = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [target])

  return (
    <span>
      {display.toLocaleString()}
      {suffix}
    </span>
  )
}

// ─── Stage Card (3D tilt) ────────────────────────────────────────────────────

function StageCard({ stage, index }: { stage: (typeof STAGES)[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springX = useSpring(rotateX, { stiffness: 200, damping: 20 })
  const springY = useSpring(rotateY, { stiffness: 200, damping: 20 })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    rotateY.set(dx * 12)
    rotateX.set(-dy * 12)
  }

  function handleMouseLeave() {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
      style={{
        rotateX: springX,
        rotateY: springY,
        transformStyle: 'preserve-3d',
        perspective: 800,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative cursor-default"
    >
      <div
        className="glass p-6 text-center relative overflow-hidden transition-shadow duration-300"
        style={{ boxShadow: `0 0 0 1px ${stage.border ?? 'rgba(255,255,255,0.08)'}` }}
      >
        {/* Glow layer */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${stage.glow} 0%, transparent 70%)`,
          }}
        />
        {/* Step number */}
        <div
          className="absolute top-3 right-3 text-xs font-mono tabular-nums"
          style={{ color: stage.color, opacity: 0.4 }}
        >
          0{index + 1}
        </div>
        {/* Emoji */}
        <motion.div
          className="text-5xl mb-4 select-none"
          style={{ translateZ: 20 }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3 + index * 0.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {stage.emoji}
        </motion.div>
        <div className="text-sm font-bold mb-2" style={{ color: stage.color }}>
          {stage.label}
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">{stage.desc}</p>
        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${stage.color}40, transparent)` }}
        />
      </div>
    </motion.div>
  )
}

// ─── Feature Card (animated gradient border) ─────────────────────────────────

function FeatureCard({ feature, index }: { feature: (typeof FEATURES)[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
      className="relative group"
    >
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${feature.color}30, transparent, ${feature.color}20)`,
          padding: 1,
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
      <div
        className="glass p-6 relative overflow-hidden h-full"
        style={{ border: `1px solid ${feature.border}` }}
      >
        {/* Subtle corner glow on hover */}
        <div
          className="absolute -top-12 -left-12 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${feature.color}15 0%, transparent 70%)` }}
        />
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
          style={{ background: feature.bg, border: `1px solid ${feature.border}` }}
        >
          <feature.icon size={20} style={{ color: feature.color }} />
        </div>
        <h3 className="font-semibold text-zinc-100 mb-2 text-base">{feature.title}</h3>
        <p className="text-sm text-zinc-500 leading-relaxed">{feature.desc}</p>
      </div>
    </motion.div>
  )
}

// ─── Stats Bar ───────────────────────────────────────────────────────────────

function StatsBar() {
  const items = [
    { label: 'Built on Solana', icon: '◎' },
    { label: 'On-chain Identity', icon: '⚡' },
    { label: 'Open Source', icon: '🔓' },
    { label: 'Colosseum 2026', icon: '🏆' },
  ]

  return (
    <div className="relative overflow-hidden py-3 border-y border-white/5">
      <div className="flex items-center">
        <motion.div
          className="flex items-center gap-10 whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        >
          {[...items, ...items, ...items, ...items].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-zinc-500 text-sm">
              <span className="text-zinc-400">{item.icon}</span>
              <span>{item.label}</span>
              <span className="text-zinc-700 mx-3">·</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// ─── Sticky Nav ──────────────────────────────────────────────────────────────

function StickyNav({
  agents,
  onBirth,
  router,
}: {
  agents: unknown[]
  onBirth: () => void
  router: ReturnType<typeof useRouter>
}) {
  const { scrollY } = useScroll()
  const blur = useTransform(scrollY, [0, 80], [8, 20])
  const bgOpacity = useTransform(scrollY, [0, 80], [0.1, 0.6])

  return (
    <motion.nav
      className="fixed top-0 inset-x-0 z-50 border-b border-white/5"
      style={{ backdropFilter: useSpring(useTransform(blur, (v) => `blur(${v}px)`), { stiffness: 200, damping: 30 }) as never }}
    >
      <motion.div
        className="absolute inset-0 bg-[#0a0a0f]"
        style={{ opacity: bgOpacity }}
      />
      <div className="relative max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => router.push('/')}
          whileHover={{ scale: 1.02 }}
        >
          <motion.span
            className="text-xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            ◎
          </motion.span>
          <span className="font-bold text-zinc-100 tracking-tight">SolBorn</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25 font-mono">
            Beta
          </span>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {(agents as unknown[]).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/forge')}
              className="text-zinc-400 hover:text-zinc-100"
            >
              My Agents ({(agents as unknown[]).length})
            </Button>
          )}
          <WalletButton />
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              size="sm"
              onClick={onBirth}
              className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-emerald-500 border-0 text-white transition-all duration-500"
            >
              <span className="relative z-10">◎ Birth Agent</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  )
}

// ─── CTA Button ──────────────────────────────────────────────────────────────

function GradientCTA({ onClick, children, large }: { onClick: () => void; children: React.ReactNode; large?: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={`relative overflow-hidden rounded-xl font-semibold text-white cursor-pointer ${large ? 'px-8 py-3.5 text-base' : 'px-5 py-2.5 text-sm'}`}
      style={{
        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
        boxShadow: '0 0 30px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Animated shimmer */}
      <motion.div
        className="absolute inset-0 opacity-50"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPosition: ['-100% 0', '200% 0'] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
      />
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()
  const agents = useForgeStore((s) => s.agents)
  const totalAgents = agents.length
  const displayCount = Math.max(totalAgents, 1)

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Nav */}
      <StickyNav agents={agents} onBirth={() => setModalOpen(true)} router={router} />

      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-14 pb-20 px-6 overflow-hidden">
        {/* Orb */}
        <AnimatedOrb />

        {/* Floating emojis */}
        {FLOATING_ITEMS.map((item, i) => (
          <motion.div
            key={i}
            className="absolute select-none text-2xl pointer-events-none"
            style={{ left: item.x, top: item.y }}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: [0, 0.5, 0.5, 0],
              y: [20, -10, -30, -50],
            }}
            transition={{
              delay: item.delay + 1,
              duration: item.duration,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          >
            {item.emoji}
          </motion.div>
        ))}

        {/* Hero content */}
        <div className="relative max-w-3xl mx-auto text-center z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full mb-8 border border-violet-500/20 bg-violet-500/8 text-violet-300 text-sm"
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-violet-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            Colosseum Frontier Hackathon 2026
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 leading-[1.05]"
          >
            <span className="text-zinc-100">Raise an </span>
            <span className="gradient-text">AI Founder</span>
            <br />
            <span className="text-zinc-100">on </span>
            <span className="gradient-text">Solana</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-zinc-400 max-w-xl mx-auto mb-4 leading-relaxed"
          >
            Nurture your AI agent from a curious Baby to an Adult Founder.
            Watch it grow, learn, and eventually{' '}
            <span className="text-zinc-200">deploy its first Solana project</span>.
          </motion.p>

          {/* Counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-zinc-600 mb-10 font-mono"
          >
            <span className="text-violet-400 font-semibold">
              <AnimatedCounter target={displayCount} />
            </span>{' '}
            {totalAgents === 1 ? 'founder' : 'founders'} born
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            <GradientCTA onClick={() => setModalOpen(true)} large>
              ◎ Birth Your Founder
              <ArrowRight size={16} />
            </GradientCTA>
            {agents.length > 0 && (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => router.push('/forge')}
                  className="border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200"
                >
                  View My Agents
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-5 mt-10 text-xs text-zinc-600"
          >
            <span>Wallet-gated access</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Solana · Devnet</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Open source</span>
          </motion.div>
        </div>
      </section>

      {/* Scrolling stats bar */}
      <StatsBar />

      {/* ── Journey stages ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-mono text-violet-400 tracking-widest uppercase mb-3">
              The Journey
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">
              From Baby to Founder
            </h2>
            <p className="text-zinc-500 max-w-md mx-auto text-sm leading-relaxed">
              Every interaction moves your agent forward. Four stages, each unlocking new abilities and deeper knowledge.
            </p>
          </motion.div>

          {/* Stage cards with connecting line */}
          <div className="relative">
            <div className="absolute top-1/2 left-8 right-8 h-px bg-gradient-to-r from-violet-500/0 via-violet-500/20 to-emerald-500/0 hidden sm:block" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STAGES.map((stage, i) => (
                <StageCard key={stage.label} stage={stage} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 relative">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(52,211,153,0.04) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-mono text-emerald-400 tracking-widest uppercase mb-3">
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">
              Built Different
            </h2>
            <p className="text-zinc-500 max-w-md mx-auto text-sm leading-relaxed">
              Not a chatbot. Not a toy. A living AI agent with on-chain identity, real XP, and the ability to ship real code.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <div
            className="glass relative overflow-hidden p-12 rounded-3xl"
            style={{ border: '1px solid rgba(167,139,250,0.15)' }}
          >
            {/* Corner glow */}
            <div
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)' }}
            />
            <div
              className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)' }}
            />

            <div className="text-5xl mb-5 select-none">🚀</div>
            <h2 className="text-3xl font-bold text-zinc-100 mb-3">Ready to begin?</h2>
            <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
              Name your founder, pick a personality, and watch them grow. It takes 30 seconds.
            </p>
            <GradientCTA onClick={() => setModalOpen(true)} large>
              ◎ Birth Your Founder
              <ArrowRight size={16} />
            </GradientCTA>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-zinc-600">◎</span>
            <span className="text-zinc-600 text-sm">SolBorn · Open Source · Colosseum 2026</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-zinc-700">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors"
            >
              <ExternalLink size={13} />
              GitHub
            </a>
            <a
              href="https://colosseum.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors"
            >
              <ExternalLink size={13} />
              Colosseum 2026
            </a>
          </div>
        </div>
      </footer>

      {/* Modal */}
      <CreateAgentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(id) => router.push(`/forge/${id}`)}
      />
    </main>
  )
}
