'use client'
import { motion } from 'framer-motion'
import { RewardsFeedbackForm } from '@/components/RewardsFeedbackForm'

export default function RewardsPage() {
  return (
    <main className="min-h-screen pt-20 pb-20 px-6" style={{ background: '#0a0a0f' }}>
      <div className="max-w-2xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-zinc-100 mb-4">
            Reward Great Trainers
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Know someone who helped you level up your agent? Or trained an amazing agent?
            <br />
            <span className="text-violet-300 font-semibold">Nominate them here.</span>
          </p>
        </motion.div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            {
              emoji: '💬',
              title: 'Submit feedback',
              desc: 'Tell us who helped and why they deserve a reward.',
            },
            {
              emoji: '✅',
              title: 'We verify',
              desc: 'We check their wallet has real activity in SolBorn.',
            },
            {
              emoji: '🎁',
              title: 'Token rewards',
              desc: 'Top nominees are rewarded with $BORN during quarterly airdrops.',
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-lg"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="text-3xl mb-2">{item.emoji}</div>
              <h3 className="font-semibold text-zinc-100 text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-zinc-500">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Form section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(245,158,11,0.05) 100%)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          <h2 className="text-xl font-bold text-zinc-100 mb-6">Nominate a Trainer</h2>
          <RewardsFeedbackForm />
        </motion.div>

        {/* FAQ */}
        <div className="mt-16 space-y-6 max-w-xl">
          <h3 className="text-lg font-semibold text-zinc-100">FAQ</h3>

          {[
            {
              q: "Can I nominate myself?",
              a: "Technically yes, but we'll review for authenticity. Self-nominations have lower weight unless they include real proof of work.",
            },
            {
              q: "How many times can I nominate?",
              a: "Once per hour per IP address. This prevents spam while letting genuine fans recognize people.",
            },
            {
              q: "When do rewards happen?",
              a: "We review nominations monthly and distribute during quarterly $BORN airdrops. Top nominees get extra weight.",
            },
            {
              q: "Is there a limit to how much one person can get?",
              a: "No hard limit, but rewards are capped by overall trainer pool size (~30% of $BORN fees).",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
            >
              <h4 className="font-semibold text-zinc-200 text-sm mb-2">{item.q}</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  )
}
