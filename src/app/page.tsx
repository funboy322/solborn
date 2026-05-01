'use client'
import { useState, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Zap, Brain, Rocket, Trophy, ArrowRight, ExternalLink, Coins, BarChart3, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateAgentModal } from '@/components/forge/CreateAgentModal'
import { WalletButton } from '@/components/wallet/WalletButton'
import { PrivyLoginButton } from '@/components/wallet/PrivyLoginButton'
import { useForgeStore } from '@/lib/store'

// ─── Data ───────────────────────────────────────────────────────────────────

const STAGES = [
  {
    emoji: '👶',
    label: 'Baby',
    desc: 'Asks who you are. Your background, your day-to-day, what frustrates you. One question at a time.',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.28)',
    bg: 'rgba(139,92,246,0.09)',
    border: 'rgba(139,92,246,0.22)',
  },
  {
    emoji: '🧒',
    label: 'Toddler',
    desc: 'Connects what you said to real opportunities. Probes your skills, your edge, what you\'ve tried before.',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.25)',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
  },
  {
    emoji: '🧑‍💻',
    label: 'Teen',
    desc: 'Proposes specific Solana ideas built around your background. Pushes back when you\'re vague.',
    color: '#c084fc',
    glow: 'rgba(192,132,252,0.25)',
    bg: 'rgba(192,132,252,0.08)',
    border: 'rgba(192,132,252,0.2)',
  },
  {
    emoji: '🚀',
    label: 'Adult',
    desc: 'Generates your full product brief and Product Page. Publishes a signed Launch Certificate on devnet.',
    color: '#e879f9',
    glow: 'rgba(232,121,249,0.24)',
    bg: 'rgba(232,121,249,0.075)',
    border: 'rgba(232,121,249,0.19)',
  },
]

const FEATURES = [
  {
    icon: Brain,
    title: 'Remembers You',
    desc: 'The agent stores what you share — your background, goals, and ideas — and recalls them weeks later. Semantic memory per wallet.',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
  },
  {
    icon: Zap,
    title: 'Agent Passports',
    desc: 'Mint your co-founder\'s identity to your wallet. A signed Memo transaction on Solana devnet — verifiable in Explorer.',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.22)',
  },
  {
    icon: Rocket,
    title: 'Launch Certificates',
    desc: 'When the agent reaches Adult, it publishes your product idea as a signed on-chain proof. Not a screenshot — a real devnet tx.',
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.08)',
    border: 'rgba(192,132,252,0.2)',
  },
  {
    icon: Trophy,
    title: 'Contributor Rewards',
    desc: 'XP earned through conversations is tracked per wallet. Early contributors build attribution for future $SBORN rewards.',
    color: '#e879f9',
    bg: 'rgba(232,121,249,0.075)',
    border: 'rgba(232,121,249,0.18)',
  },
  {
    icon: BarChart3,
    title: 'XP-Graded Chat',
    desc: 'Every message scores 0–25 XP on clarity, novelty, and depth. Spam earns nothing. The bar moves only when the conversation does.',
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.075)',
    border: 'rgba(34,211,238,0.18)',
  },
  {
    icon: Flame,
    title: 'Energy & Streaks',
    desc: 'Daily energy regenerates at 2/min. Streaks multiply XP. The loop is built to compound, not to grind.',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.07)',
    border: 'rgba(249,115,22,0.20)',
  },
]

const TOKEN_UTILITIES = [
  {
    badge: 'MINT',
    label: 'Passport seed',
    desc: '$SBORN will gate Agent Passport mints once the on-chain program is live. Today\'s passports are devnet Memo proofs.',
  },
  {
    badge: 'STAKE',
    label: 'Back launches',
    desc: 'Stake on Adult agents that ship strong product briefs. Stakers share access to early product drops.',
  },
  {
    badge: 'FUEL',
    label: 'Energy & boosts',
    desc: 'Buy energy refills, launch boosts, and cosmetic Passport upgrades. Heavy users pay $SBORN, not USD.',
  },
  {
    badge: 'EARN',
    label: 'Contributor rewards',
    desc: 'Streaks, top XP, and Arena performance distribute weekly contributor pools — paid in $SBORN.',
  },
]

const FLOW_STEPS = [
  {
    label: 'Interview',
    desc: 'Answer your co-founder\'s questions. It learns who you are.',
  },
  {
    label: 'Passport',
    desc: 'Mint a wallet-signed agent identity on Solana devnet.',
  },
  {
    label: 'Product Page',
    desc: 'Your personalized startup idea, built from the conversation.',
  },
  {
    label: 'Arena',
    desc: 'Community backs the strongest ideas with staked Passports.',
  },
]

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
    { label: 'Interviews you first', code: '01' },
    { label: 'Agent Passports on devnet', code: '02' },
    { label: 'Signed Launch Certificates', code: '03' },
    { label: 'Product Arena', code: '04' },
    { label: 'Semantic memory per wallet', code: '05' },
    { label: 'Open source on GitHub', code: '06' },
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
              <span className="text-[10px] font-mono text-zinc-700">{item.code}</span>
              <span>{item.label}</span>
              <span className="text-zinc-800 mx-3">/</span>
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
      className="fixed top-0 inset-x-0 z-50 border-b border-violet-300/10"
      style={{ backdropFilter: useSpring(useTransform(blur, (v) => `blur(${v}px)`), { stiffness: 200, damping: 30 }) as never }}
    >
      <motion.div
        className="absolute inset-0 bg-[#08040f]"
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
          <span className="font-bold text-zinc-100 tracking-normal">SolBorn</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25 font-mono">
            Beta
          </span>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center gap-2 [&>*]:whitespace-nowrap [&>*]:shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/demo')}
            className="hidden sm:flex text-zinc-400 hover:text-zinc-100 text-xs gap-1.5"
          >
            Demo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/products')}
            className="hidden sm:flex text-zinc-400 hover:text-zinc-100 text-xs gap-1.5"
          >
            Arena
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/staking')}
            className="hidden sm:flex text-zinc-400 hover:text-zinc-100 text-xs gap-1.5"
          >
            Stake
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/rewards')}
            className="text-zinc-400 hover:text-zinc-100 text-xs gap-1.5"
          >
            Rewards
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
            href="https://pump.fun/coin/3VNSmRLTvS54LWnynJNqEege21nzdjy1rEsPhsNxpump"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-violet-300/20 bg-violet-400/[0.05] px-3 py-1.5 text-xs font-semibold text-violet-100 transition-colors hover:bg-violet-400/[0.1]"
            title="Buy $SBORN on pump.fun"
          >
            Buy $SBORN
          </a>
          <a
            href="https://x.com/solborn_xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:text-violet-100 hover:bg-violet-400/[0.08] transition-all"
            title="Follow on X"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <PrivyLoginButton />
          <WalletButton />
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              size="sm"
              onClick={onBirth}
              className="relative overflow-hidden bg-violet-600 hover:bg-violet-500 border border-violet-300/20 text-white text-xs shadow-lg shadow-violet-950/30 transition-all duration-300 whitespace-nowrap"
            >
              <span className="relative z-10">Create Agent</span>
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
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className={`relative overflow-hidden rounded-xl border border-violet-300/25 font-semibold text-white cursor-pointer transition-colors ${large ? 'px-8 py-3.5 text-base' : 'px-5 py-2.5 text-sm'}`}
      style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 48%, #3b0764 100%)',
        boxShadow: '0 18px 50px rgba(88,28,135,0.38), inset 0 1px 0 rgba(255,255,255,0.16)',
      }}
    >
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  )
}

function ProductFlow() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative z-10 px-6 pb-14 sm:-mt-6 sm:pb-16"
    >
      <div className="mx-auto max-w-6xl border border-violet-300/12 bg-violet-400/[0.035] p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW_STEPS.map((step, index) => (
            <div
              key={step.label}
              className="relative min-h-[138px] overflow-hidden border border-violet-300/12 bg-violet-950/[0.16] p-5"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/35 to-transparent" />
              <p className="text-[10px] font-mono text-violet-300/45">0{index + 1}</p>
              <h3 className="mt-5 text-base font-semibold text-zinc-100">{step.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}

// ─── Hero Agent Preview (marketing showcase, static) ───────────────────────

function AgentPreviewCard() {
  return (
    <div
      className="relative rounded-3xl p-3.5 backdrop-blur-xl"
      style={{
        background: 'linear-gradient(180deg, rgba(124,58,237,0.10), rgba(255,255,255,0.025))',
        border: '1px solid rgba(167,139,250,0.20)',
        boxShadow: '0 30px 80px rgba(8,4,15,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Top hairline highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.5), transparent)' }}
      />

      {/* Header: avatar + name + stage chip + streak */}
      <div className="flex items-center gap-3.5 px-2 pt-2 pb-3.5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(167,139,250,0.40), rgba(167,139,250,0.10))',
            border: '1px solid rgba(167,139,250,0.40)',
            boxShadow: '0 0 28px rgba(167,139,250,0.20)',
          }}
        >
          🧒
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-[17px] font-bold text-zinc-100 tracking-tight">Athena</div>
          <span
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.10em] text-violet-300 px-2 py-0.5 rounded-full w-fit"
            style={{
              background: 'rgba(139,92,246,0.10)',
              border: '1px solid rgba(139,92,246,0.25)',
            }}
          >
            <span className="w-1 h-1 rounded-full bg-violet-300" />
            Teen · Stage 03
          </span>
        </div>
        <div className="ml-auto flex gap-2">
          <span
            className="font-mono text-[11px] px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(249,115,22,0.08)',
              color: '#fb923c',
              border: '1px solid rgba(249,115,22,0.30)',
            }}
          >
            🔥 12d
          </span>
          <span
            className="font-mono text-[11px] px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(245,158,11,0.08)',
              color: '#fbbf24',
              border: '1px solid rgba(245,158,11,0.30)',
            }}
          >
            🏆 8
          </span>
        </div>
      </div>

      {/* XP row */}
      <div className="flex items-center justify-between px-2 pb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">XP · Teen → Adult</span>
        <span className="font-mono text-[11px] text-violet-300 tabular-nums">312 / 500</span>
      </div>

      {/* XP bar with shimmer */}
      <div className="relative h-2 mx-2 mb-3.5 rounded-full overflow-hidden bg-white/5">
        <div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
          style={{
            width: '62%',
            background: 'linear-gradient(90deg, #8b5cf6, #a78bfa 60%, #22d3ee)',
            boxShadow: '0 0 12px rgba(167,139,250,0.5)',
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'agentShimmer 2.4s linear infinite',
            }}
          />
        </div>
      </div>

      {/* Chat */}
      <div
        className="rounded-2xl p-3.5 flex flex-col gap-2"
        style={{ background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <PreviewMessage who="agent">Tell me one frustrating thing about your day — the smaller, the better.</PreviewMessage>
        <PreviewMessage who="user">Customer support tools all assume one inbox. I run six.</PreviewMessage>
        <PreviewMessage who="agent">Six inboxes. Different tools per channel, or different brands?</PreviewMessage>
      </div>

      {/* Compose stub */}
      <div
        className="mt-2.5 px-3 py-2.5 rounded-2xl flex items-center gap-2.5"
        style={{ background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <span className="flex-1 text-[13px] text-zinc-600">Reply to Athena…</span>
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white">
          <ArrowRight size={13} />
        </div>
      </div>

      <style jsx>{`
        @keyframes agentShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

function PreviewMessage({ who, children }: { who: 'agent' | 'user'; children: React.ReactNode }) {
  const isAgent = who === 'agent'
  return (
    <div className={`flex gap-2.5 items-start ${isAgent ? '' : 'flex-row-reverse'}`}>
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] flex-shrink-0"
        style={{
          background: isAgent ? 'rgba(167,139,250,0.15)' : 'rgba(34,211,238,0.15)',
          border: isAgent ? '1px solid rgba(167,139,250,0.30)' : '1px solid rgba(34,211,238,0.30)',
          color: isAgent ? '#c4b5fd' : '#67e8f9',
          fontFamily: isAgent ? 'inherit' : 'var(--font-geist-mono, JetBrains Mono, monospace)',
          fontSize: isAgent ? '13px' : '10px',
        }}
      >
        {isAgent ? '🧒' : 'JD'}
      </div>
      <div
        className="px-3 py-2 text-[13px] leading-snug max-w-[78%]"
        style={{
          background: isAgent ? 'rgba(255,255,255,0.04)' : 'rgba(34,211,238,0.10)',
          border: isAgent ? '1px solid rgba(167,139,250,0.18)' : '1px solid rgba(34,211,238,0.22)',
          borderRadius: '12px',
          borderTopLeftRadius: isAgent ? '4px' : undefined,
          borderTopRightRadius: !isAgent ? '4px' : undefined,
          color: '#f4f4f5',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()
  const agents = useForgeStore((s) => s.agents)

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Nav */}
      <StickyNav agents={agents} onBirth={() => setModalOpen(true)} router={router} />

      {/* ── Hero ── */}
      <section className="relative flex min-h-[72vh] items-center overflow-hidden px-6 pb-10 pt-28 sm:min-h-[78vh] sm:pb-12">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-x-6 top-24 h-px bg-gradient-to-r from-transparent via-violet-300/16 to-transparent" />
          <div
            className="absolute inset-0 opacity-[0.045]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(167,139,250,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.16) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
              maskImage: 'linear-gradient(to bottom, black, transparent 75%)',
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto z-10 w-full grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-14 items-center">
          <div className="text-center lg:text-left">
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="text-xs font-mono text-zinc-500 tracking-[0.22em] uppercase mb-5"
            >
              Solana founder agents
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6 text-4xl font-bold leading-[1.06] tracking-normal text-zinc-100 sm:text-6xl lg:text-7xl"
            >
              Your Solana startup,
              <br />
              found in 5 minutes of chat.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 mb-9 leading-relaxed"
            >
              Your AI co-founder asks you about your background, your skills, what you&apos;d build. Then it ships your idea — with proof on Solana devnet.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex items-center justify-center lg:justify-start gap-3 flex-wrap"
            >
              <GradientCTA onClick={() => setModalOpen(true)} large>
                Create Agent
                <ArrowRight size={16} />
              </GradientCTA>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => router.push('/demo')}
                className="border border-violet-300/15 bg-violet-400/[0.045] hover:bg-violet-400/[0.09] text-violet-50"
              >
                View Demo
              </Button>
              {agents.length > 0 && (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => router.push('/forge')}
                  className="border border-violet-300/15 bg-violet-400/[0.045] hover:bg-violet-400/[0.09] text-violet-50"
                >
                  My Agents
                </Button>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-center lg:justify-start gap-5 mt-10 text-xs text-zinc-600 flex-wrap"
            >
              <span>Real devnet transactions</span>
              <span className="text-zinc-800">/</span>
              <span>Open source</span>
              <span className="text-zinc-800">/</span>
              <span>No teaching required</span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="hidden md:block"
          >
            <AgentPreviewCard />
          </motion.div>

        </div>
      </section>

      <ProductFlow />

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
              Four stages. Real progression.
            </h2>
            <p className="text-zinc-500 max-w-md mx-auto text-sm leading-relaxed">
              Each stage changes how your co-founder thinks, what it asks, and what it can do on-chain. This isn&apos;t a level bar — it&apos;s a different agent.
            </p>
          </motion.div>

          {/* Stage cards with connecting line */}
          <div className="relative">
            <div className="absolute top-1/2 left-8 right-8 h-px bg-gradient-to-r from-violet-500/0 via-violet-400/24 to-fuchsia-400/0 hidden sm:block" />
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
              background: 'radial-gradient(ellipse, rgba(124,58,237,0.075) 0%, transparent 70%)',
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
            <p className="text-xs font-mono text-violet-300 tracking-widest uppercase mb-3">
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">
              Not a prompt box
            </h2>
            <p className="text-zinc-500 max-w-md mx-auto text-sm leading-relaxed">
              It interviews you, remembers you across sessions, and ships verifiable proof to Solana devnet. The whole loop — from conversation to Launch Certificate — is real.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Token Utility ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center"
          >
            <div>
              <p className="text-xs font-mono text-violet-300 tracking-widest uppercase mb-3">
                $SBORN
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full border border-violet-300/25 bg-violet-400/10 text-[11px] font-semibold text-violet-100 mb-4">
                Utility layer in development
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">
                The token grows with the product
              </h2>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                $SBORN isn&apos;t detached from what SolBorn does. Conversations create XP, XP creates
                attribution, and $SBORN is planned as the reward and access layer around all of it.
                The more the product gets used, the more the token has to anchor to.
              </p>
              <p className="text-xs text-zinc-600 leading-relaxed mb-6 border-l border-violet-300/25 pl-3">
                Building in public. Utility is being rolled out step by step as the product matures.
                Early holders are early in the right place.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => router.push('/staking')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-violet-300/25 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-950/30 transition-colors"
                >
                  <Coins size={15} />
                  Open staking
                </button>
                <a
                  href="https://pump.fun/coin/3VNSmRLTvS54LWnynJNqEege21nzdjy1rEsPhsNxpump"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-violet-100 border border-violet-300/20 bg-violet-400/[0.06] hover:bg-violet-400/[0.1] transition-colors"
                >
                  View $SBORN
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
            <div className="grid gap-3">
              {TOKEN_UTILITIES.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="glass p-4 border border-violet-300/12 bg-violet-400/[0.025]"
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-md min-w-[58px] text-center flex-shrink-0"
                      style={{
                        background: 'rgba(167,139,250,0.12)',
                        color: '#c4b5fd',
                        border: '1px solid rgba(167,139,250,0.25)',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {item.badge}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-zinc-100 mb-1">{item.label}</h3>
                      <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
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
            style={{
              border: '1px solid rgba(167,139,250,0.18)',
              background: 'linear-gradient(180deg, rgba(124,58,237,0.06), rgba(255,255,255,0.025))',
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/35 to-transparent" />
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-violet-300/70 mb-5">
              Your turn
            </p>
            <h2 className="text-3xl font-bold text-zinc-100 mb-3">What&apos;s your idea?</h2>
            <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
              Connect your wallet, name your co-founder, and answer its first question. It does the rest — idea, brief, Launch Certificate on devnet.
            </p>
            <GradientCTA onClick={() => setModalOpen(true)} large>
              Create Agent
              <ArrowRight size={16} />
            </GradientCTA>
          </div>
        </motion.div>
      </section>

      {/* ── DexScreener chart ── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <p className="text-xs font-mono text-violet-400 tracking-widest uppercase mb-2">Live Chart</p>
            <h2 className="text-2xl font-bold text-zinc-100">$SBORN on Solana</h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden border border-violet-300/10"
            style={{ height: 500 }}
          >
            <iframe
              src="https://dexscreener.com/solana/8pudb4dhwxebktpgp3jrgzbcqrqodglc4d17w7dbvjqi?embed=1&theme=dark&trades=0&info=0"
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="$SBORN DexScreener Chart"
              loading="lazy"
            />
          </motion.div>
          <div className="mt-4 flex justify-center">
            <a
              href="https://dexscreener.com/solana/8pudb4dhwxebktpgp3jrgzbcqrqodglc4d17w7dbvjqi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink size={11} />
              View full chart on DexScreener
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t border-violet-300/10">
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
