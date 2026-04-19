'use client'
/**
 * Rewards page.
 *
 * CURRENTLY IN "COMING SOON" STATE — the full form + verification pipeline is
 * built and tested (see RewardsFeedbackForm + /api/rewards/feedback), but the
 * entry point is gated until we're ready to process nominations + have the
 * $SBORN token actually launched.
 *
 * We still show the design preview so people understand what's coming, and
 * we prominently warn against scam tokens claiming to be $SBORN — this is
 * the #1 risk for a pre-launch token announcement.
 */
import { motion } from 'framer-motion'
import { ShieldAlert, Sparkles, Wallet, AtSign, Star, MessageSquare, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function RewardsPage() {
  return (
    <main className="relative min-h-screen pt-24 pb-20 px-6 overflow-hidden" style={{ background: '#0a0a0f' }}>
      {/* Animated background orb */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-[800px] h-[800px] rounded-full"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background:
              'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(245,158,11,0.15) 40%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Floating particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${(i * 83) % 100}%`,
            top: `${(i * 47) % 100}%`,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{
            opacity: [0, 0.4, 0],
            y: [-20, -60],
          }}
          transition={{
            delay: i * 0.8,
            duration: 5 + (i % 3),
            repeat: Infinity,
            repeatDelay: 2,
          }}
        >
          <Sparkles size={10 + (i % 3) * 4} className="text-violet-400/40" />
        </motion.div>
      ))}

      <div className="relative max-w-3xl mx-auto">
        {/* Coming Soon badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-6"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(236,72,153,0.15))',
              border: '1px solid rgba(245,158,11,0.5)',
              color: 'rgb(253, 230, 138)',
              boxShadow: '0 0 24px rgba(245,158,11,0.2)',
            }}
          >
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ◉
            </motion.span>
            Coming Soon
          </div>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-5 leading-[1.05]">
            <span className="text-zinc-100">Reward </span>
            <span
              style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #f59e0b 50%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Real Contributors
            </span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl mx-auto">
            Not airdrop farmers. Not burner wallets. Not bots.
            <br />
            <span className="text-zinc-200 font-medium">Real people who help the project grow.</span>
          </p>
        </motion.div>

        {/* SCAM WARNING — prominent, can't miss */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10 p-5 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(244,63,94,0.15) 0%, rgba(244,63,94,0.05) 100%)',
            border: '1px solid rgba(244,63,94,0.4)',
            boxShadow: '0 0 32px rgba(244,63,94,0.15)',
          }}
        >
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex-shrink-0"
            >
              <ShieldAlert size={24} className="text-rose-400" />
            </motion.div>
            <div>
              <h3 className="text-rose-200 font-bold text-sm mb-1.5">
                ⚠️ $SBORN token is NOT launched yet — don&apos;t fall for scams
              </h3>
              <p className="text-rose-100/80 text-xs leading-relaxed">
                Any token claiming to be <span className="font-mono font-bold">$SBORN</span> right now is a
                scam. We haven&apos;t launched. When we do, we&apos;ll announce it ONLY from
                <a
                  href="https://x.com/solborn_xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-200 font-semibold underline mx-1 hover:text-rose-100"
                >
                  @solborn_xyz
                </a>
                and this site. No private DMs. No Telegram groups. No presales. Nothing.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Steps preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <h2 className="text-xs font-bold text-zinc-500 tracking-widest uppercase text-center mb-6">
            How it will work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                num: '01',
                emoji: '💬',
                title: 'Submit nomination',
                desc: 'Wallet + Twitter + GitHub + feedback. We verify every field.',
                color: 'rgb(167, 139, 250)',
              },
              {
                num: '02',
                emoji: '🔍',
                title: 'We verify',
                desc: 'Real GitHub star, real tweet, real on-chain activity. No burners.',
                color: 'rgb(245, 158, 11)',
              },
              {
                num: '03',
                emoji: '🎁',
                title: 'Quarterly airdrop',
                desc: 'Top nominees get $SBORN from 30% of all trading fees.',
                color: 'rgb(236, 72, 153)',
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="relative p-5 rounded-xl overflow-hidden group"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                }}
                whileHover={{ y: -2, borderColor: step.color }}
              >
                <div
                  className="absolute top-3 right-4 text-xs font-mono font-bold opacity-30"
                  style={{ color: step.color }}
                >
                  {step.num}
                </div>
                <div className="text-3xl mb-3">{step.emoji}</div>
                <h3 className="font-semibold text-zinc-100 text-sm mb-1.5">{step.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Requirements preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-10 p-6 rounded-2xl relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(245,158,11,0.05) 100%)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          <h2 className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-5">
            ✓ Verification requirements
          </h2>
          <div className="space-y-3">
            {[
              {
                icon: <Wallet size={15} />,
                label: 'Valid Solana wallet',
                desc: 'Receives the $SBORN airdrop',
              },
              {
                icon: <AtSign size={15} />,
                label: 'Real Twitter account + tweet about SolBorn',
                desc: 'No burner accounts. We manually review.',
              },
              {
                icon: <Star size={15} />,
                label: 'Starred the GitHub repo',
                desc: 'Auto-verified via GitHub API',
              },
              {
                icon: <MessageSquare size={15} />,
                label: 'Specific feedback (30+ chars)',
                desc: 'Tell us what you actually did or noticed',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="flex items-start gap-3"
              >
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-violet-300"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
                >
                  {item.icon}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-200">{item.label}</span>
                    <CheckCircle2 size={12} className="text-emerald-400 opacity-60" />
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Disabled CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <button
            disabled
            className="relative w-full max-w-md mx-auto py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px dashed rgba(255,255,255,0.15)',
              color: 'rgb(113, 113, 122)',
            }}
          >
            <Clock size={15} />
            Nominations open after token launch
          </button>
          <p className="text-[11px] text-zinc-600 mt-3">
            Target: Q2 2026 · Follow{' '}
            <a
              href="https://x.com/solborn_xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 underline"
            >
              @solborn_xyz
            </a>
            {' '}for the announcement
          </p>
        </motion.div>

        {/* Back link */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            ← Back to SolBorn
          </Link>
        </div>
      </div>
    </main>
  )
}
