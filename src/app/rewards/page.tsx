'use client'
import { motion } from 'framer-motion'
import { ShieldAlert, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { RewardsFeedbackForm } from '@/components/RewardsFeedbackForm'

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
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
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

        {/* SCAM WARNING */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 p-5 rounded-2xl"
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
                ⚠️ Only submit if you genuinely used the product
              </h3>
              <p className="text-rose-100/80 text-xs leading-relaxed">
                We verify every field manually. Fake wallets, burner Twitter accounts, and copy-paste feedback get
                rejected. One submission per IP. Official announcements only from{' '}
                <a
                  href="https://x.com/solborn_xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-200 font-semibold underline hover:text-rose-100"
                >
                  @solborn_xyz
                </a>
                .
              </p>
            </div>
          </div>
        </motion.div>

        {/* The form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <RewardsFeedbackForm />
        </motion.div>

        {/* Token link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex justify-center"
        >
          <a
            href="https://pump.fun/coin/3VNSmRLTvS54LWnynJNqEege21nzdjy1rEsPhsNxpump"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(245,158,11,0.15))',
              border: '1px solid rgba(245,158,11,0.35)',
              color: 'rgb(252,211,77)',
            }}
          >
            $SBORN is live — buy on pump.fun
          </a>
        </motion.div>

        {/* Back link */}
        <div className="mt-8 text-center">
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
