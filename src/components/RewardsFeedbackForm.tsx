'use client'
/**
 * Feedback form for manually rewarding contributors.
 *
 * Lets anyone recognize someone who helped them (trained their agent, gave
 * feedback, etc). We verify the wallet is real + has activity, then log to
 * Telegram for manual review + reward allocation.
 *
 * Rate-limited by IP: 1 submission per IP per hour. Prevents spam.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface FeedbackResponse {
  ok: boolean
  error?: string
  message?: string
}

export function RewardsFeedbackForm() {
  const [wallet, setWallet] = useState('')
  const [feedback, setFeedback] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!wallet.trim() || !feedback.trim()) return

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/rewards/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: wallet.trim(),
          feedback: feedback.trim(),
        }),
      })

      const data = (await res.json()) as FeedbackResponse

      if (!res.ok || !data.ok) {
        setStatus('error')
        setMessage(data.error || 'Something went wrong')
        return
      }

      setStatus('success')
      setMessage('Thank you! Your feedback has been sent to the team.')
      setWallet('')
      setFeedback('')

      // Auto-reset to idle after 3s
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Network error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
      <div className="space-y-4">
        {/* Wallet address input */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Wallet to reward (Solana address)
          </label>
          <input
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="e.g., 7xVs5Z..."
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500/40 text-sm"
            disabled={status === 'loading'}
          />
          <p className="text-[10px] text-zinc-500 mt-1">
            We'll verify they actually contributed before sending to our team.
          </p>
        </div>

        {/* Feedback textarea */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            What did they do? (why do they deserve this?)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g., Helped me train my agent to Adult stage in 30 min. Great explanations."
            maxLength={500}
            rows={4}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500/40 text-sm resize-none"
            disabled={status === 'loading'}
          />
          <p className="text-[10px] text-zinc-500 mt-1">
            {feedback.length}/500 · Be specific. This goes to our team for manual review.
          </p>
        </div>

        {/* Status messages */}
        <AnimatePresence>
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2"
            >
              <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-emerald-200">{message}</p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2"
            >
              <AlertCircle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-rose-200">{message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={status === 'loading' || !wallet.trim() || !feedback.trim()}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2.5 rounded-lg font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background:
              status === 'error'
                ? 'rgba(244,63,94,0.2)'
                : 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(245,158,11,0.3))',
            border:
              status === 'error'
                ? '1px solid rgba(244,63,94,0.4)'
                : '1px solid rgba(139,92,246,0.3)',
          }}
        >
          {status === 'loading' ? (
            <>
              <span className="animate-spin">⏳</span>
              Sending...
            </>
          ) : (
            <>
              <Send size={14} />
              Send to team
            </>
          )}
        </motion.button>

        <p className="text-[10px] text-zinc-600 text-center">
          Rate-limited to 1 per IP per hour. No spam, just genuine rewards.
        </p>
      </div>
    </form>
  )
}
