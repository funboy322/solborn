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
    desc: 'Knows nothing. Asks "what is a wallet?" in babble.',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.25)',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
  },
  {
    emoji: '🧒',
    label: 'Toddler',
    desc: 'Repeats what you taught. Gets it adorably wrong sometimes.',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.25)',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.2)',
  },
  {
    emoji: '🧑‍💻',
    label: 'Teen',
    desc: 'Opinionated. Writes Anchor. Pushes back on bad ideas.',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
  },
  {
    emoji: '🚀',
    label: 'Adult',
    desc: 'Ships a live Solana Blink. Real devnet tx, real tips.',
    color: '#f43f5e',
    glow: 'rgba(244,63,94,0.25)',
    bg: 'rgba(244,63,94,0.08)',
    border: 'rgba(244,63,94,0.2)',
  },
]

const FEATURES = [
  {
    icon: Brain,
    title: 'Persistent Memory',
    desc: 'Your agent remembers you across sessions — what you taught, who you are, what you\'re building. Semantic recall per wallet.',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
  },
  {
    icon: Zap,
    title: 'Compressed NFTs',
    desc: 'Each evolution mints a real cNFT to your Phantom via Metaplex Bubblegum. Four stages, four collectibles.',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.2)',
  },
  {
    icon: Rocket,
    title: 'Ships a Real Blink',
    desc: 'Adult agents publish a live Solana Action. Strangers can tip them in one click — renders in Phantom and dial.to.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
  },
  {
    icon: Trophy,
    title: 'Trainer Royalties',
    desc: 'Anyone can train anyone\'s agent. XP you contribute splits future royalties — teaching is upside, not charity.',
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
    { label: 'Compressed NFTs', icon: '⚡' },
    { label: 'Live Blinks', icon: '✦' },
    { label: 'Trainer Royalties', icon: '🪙' },
    { label: 'Persistent Memory', icon: '🧠' },
    { label: 'Open Source', icon: '🔓' },
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
          <motion.img
            src="/logo.png"
            alt="SolBorn"
            className="w-8 h-8 rounded-xl"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="font-bold text-zinc-100 tracking-tight">SolBorn</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25 font-mono">
            Beta
          </span>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/rewards')}
            className="text-zinc-400 hover:text-zinc-100 text-xs gap-1.5"
            title="Reward program — coming soon"
          >
            🎁 Rewards
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
              style={{
                background: 'rgba(245,158,11,0.15)',
                color: 'rgb(252, 211, 77)',
                border: '1px solid rgba(245,158,11,0.3)',
              }}
            >
              SOON
            </span>
          </Button>
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
          <a
            href="https://x.com/solborn_xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all"
            title="Follow on X"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
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
  // Global "founders born" count from /api/stats (shared across all visitors).
  // Falls back to the user's local count if the endpoint is unreachable.
  const [globalTotal, setGlobalTotal] = useState<number | null>(null)
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' })
        if (!res.ok) return
        const json = (await res.json()) as { total?: number }
        if (!cancelled && typeof json.total === 'number') setGlobalTotal(json.total)
      } catch {
        /* fall back to local */
      }
    }
    load()
    // Re-poll every 30s so the number ticks up as other visitors birth agents
    const id = setInterval(load, 30_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])
  const localTotal = agents.length
  const totalAgents = globalTotal ?? localTotal
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
            Teach an AI agent from babbling Baby to shipping Adult.
            Every conversation grows it. When it graduates, it{' '}
            <span className="text-zinc-200">publishes a live Solana Blink</span> you can share.
          </motion.p>

          {/* Counter removed — global registry is still warming up.
              Will re-enable once the number feels trustworthy. */}
          <div className="mb-10" />

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
            className="flex items-center justify-center gap-5 mt-10 text-xs text-zinc-600 flex-wrap"
          >
            <span>Free to create</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Solana · Devnet</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>No hidden costs</span>
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
              Four stages. Each one changes how your agent actually talks, what it knows, and what it can do on-chain.
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
              Not a chatbot. A tamagotchi with memory, a cNFT for every stage, a Blink to ship, and royalty splits for the trainers.
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
              Connect your wallet. Name your founder. Start teaching. First cNFT lands after stage two — 30 seconds in.
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
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="SolBorn" className="w-6 h-6 rounded-lg" />
            <span className="text-zinc-600 text-sm">SolBorn · Open Source · Solana</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-zinc-700">
            <a
              href="https://x.com/ungspirit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors"
            >
              built by{' '}
              <span className="text-violet-400 hover:text-violet-300">@ungspirit</span>
            </a>
            <a
              href="https://x.com/solborn_xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              @solborn_xyz
            </a>
            <a
              href="https://github.com/funboy322/solborn"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors"
            >
              <ExternalLink size={13} />
              GitHub
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
