'use client'
/**
 * Reward nomination form.
 *
 * Multi-field verification to prevent abuse:
 *   1. Solana wallet (base58 format + length check)
 *   2. Twitter handle (@user, 3-15 chars)
 *   3. Link to their tweet about SolBorn (must be twitter/x.com URL)
 *   4. GitHub username (must exist + must have starred the repo)
 *   5. Feedback description (why they deserve it)
 *
 * All fields validated client-side + server-side. Rate-limited by IP.
 * Only submissions passing ALL checks go to Telegram for manual review.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, CheckCircle, AlertCircle, Shield, AtSign, Star, Wallet, MessageSquare, Link as LinkIcon } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'
type FieldValid = 'idle' | 'valid' | 'invalid'

interface FieldState {
  wallet: FieldValid
  twitter: FieldValid
  tweetUrl: FieldValid
  github: FieldValid
  feedback: FieldValid
}

function validateWallet(v: string): boolean {
  return /^[1-9A-HJ-NP-Z]{32,44}$/.test(v.trim())
}
function validateTwitter(v: string): boolean {
  const clean = v.trim().replace(/^@/, '')
  return /^[A-Za-z0-9_]{3,15}$/.test(clean)
}
function validateTweetUrl(v: string): boolean {
  return /^https?:\/\/(x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/\d+/i.test(v.trim())
}
function validateGithub(v: string): boolean {
  return /^[A-Za-z0-9-]{1,39}$/.test(v.trim().replace(/^@/, ''))
}
function validateFeedback(v: string): boolean {
  return v.trim().length >= 30 && v.trim().length <= 500
}

export function RewardsFeedbackForm() {
  const [wallet, setWallet] = useState('')
  const [twitter, setTwitter] = useState('')
  const [tweetUrl, setTweetUrl] = useState('')
  const [github, setGithub] = useState('')
  const [feedback, setFeedback] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const fields: FieldState = {
    wallet: wallet ? (validateWallet(wallet) ? 'valid' : 'invalid') : 'idle',
    twitter: twitter ? (validateTwitter(twitter) ? 'valid' : 'invalid') : 'idle',
    tweetUrl: tweetUrl ? (validateTweetUrl(tweetUrl) ? 'valid' : 'invalid') : 'idle',
    github: github ? (validateGithub(github) ? 'valid' : 'invalid') : 'idle',
    feedback: feedback ? (validateFeedback(feedback) ? 'valid' : 'invalid') : 'idle',
  }

  const allValid =
    fields.wallet === 'valid' &&
    fields.twitter === 'valid' &&
    fields.tweetUrl === 'valid' &&
    fields.github === 'valid' &&
    fields.feedback === 'valid'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allValid) return

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/rewards/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: wallet.trim(),
          twitter: twitter.trim().replace(/^@/, ''),
          tweetUrl: tweetUrl.trim(),
          github: github.trim().replace(/^@/, ''),
          feedback: feedback.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        setStatus('error')
        setMessage(data.error || 'Something went wrong')
        return
      }

      setStatus('success')
      setMessage('Nomination sent! We review each one manually within 48h.')
      setWallet('')
      setTwitter('')
      setTweetUrl('')
      setGithub('')
      setFeedback('')
      setTimeout(() => setStatus('idle'), 5000)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Network error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Wallet */}
      <Field
        icon={<Wallet size={14} />}
        label="Solana wallet"
        hint="The wallet that will receive $SBORN rewards"
        state={fields.wallet}
      >
        <input
          type="text"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="7xVs5Z..."
          className="form-input"
          disabled={status === 'loading'}
        />
      </Field>

      {/* Twitter handle */}
      <Field
        icon={<AtSign size={14} />}
        label="Twitter/X handle"
        hint="Real account, not a 1-day-old bot. We check."
        state={fields.twitter}
      >
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">@</span>
          <input
            type="text"
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            placeholder="username"
            className="form-input pl-7"
            disabled={status === 'loading'}
          />
        </div>
      </Field>

      {/* Tweet URL */}
      <Field
        icon={<LinkIcon size={14} />}
        label="Link to your tweet about SolBorn"
        hint="Post something real about the project first (even one tweet works). Paste the link here."
        state={fields.tweetUrl}
      >
        <input
          type="url"
          value={tweetUrl}
          onChange={(e) => setTweetUrl(e.target.value)}
          placeholder="https://x.com/username/status/..."
          className="form-input"
          disabled={status === 'loading'}
        />
      </Field>

      {/* GitHub username */}
      <Field
        icon={<Star size={14} />}
        label="GitHub username"
        hint="We verify you actually starred github.com/funboy322/solborn"
        state={fields.github}
      >
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">@</span>
          <input
            type="text"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            placeholder="your-github-username"
            className="form-input pl-7"
            disabled={status === 'loading'}
          />
        </div>
      </Field>

      {/* Feedback */}
      <Field
        icon={<MessageSquare size={14} />}
        label="Your contribution / feedback"
        hint={`${feedback.length}/500 · min 30 chars · be specific`}
        state={fields.feedback}
      >
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="e.g., Trained 3 agents to Adult stage, found a memory-recall bug, wrote a guide on how XP grading works..."
          maxLength={500}
          rows={4}
          className="form-input resize-none"
          disabled={status === 'loading'}
        />
      </Field>

      {/* Anti-abuse notice */}
      <div
        className="flex items-start gap-2 p-3 rounded-lg text-xs text-zinc-400"
        style={{
          background: 'rgba(139,92,246,0.06)',
          border: '1px solid rgba(139,92,246,0.2)',
        }}
      >
        <Shield size={14} className="text-violet-300 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-violet-200 font-semibold mb-1">Why so many fields?</p>
          <p className="leading-relaxed">
            We verify every nomination. This is to reward <span className="text-zinc-200">real contributors</span>,
            not airdrop-farmers with burner wallets. If you skip any check, your submission is ignored.
          </p>
        </div>
      </div>

      {/* Status messages */}
      <AnimatePresence>
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2"
          >
            <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-emerald-200">{message}</p>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2"
          >
            <AlertCircle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-rose-200">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={status === 'loading' || !allValid}
        whileTap={{ scale: 0.98 }}
        whileHover={allValid && status !== 'loading' ? { scale: 1.01 } : {}}
        className="relative w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden"
        style={{
          background: allValid
            ? 'linear-gradient(135deg, #8b5cf6 0%, #f59e0b 100%)'
            : 'rgba(255,255,255,0.05)',
          border: allValid ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: allValid ? '0 8px 24px -6px rgba(139,92,246,0.5)' : 'none',
        }}
      >
        {allValid && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              background: [
                'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0) 100%)',
                'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)',
                'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0) 100%)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        {status === 'loading' ? (
          <>
            <span className="animate-spin text-lg">◎</span>
            <span>Verifying on GitHub & sending...</span>
          </>
        ) : (
          <>
            <Send size={15} />
            <span>Submit nomination</span>
          </>
        )}
      </motion.button>

      <p className="text-[10px] text-zinc-600 text-center">
        1 submission per IP per hour. All fields are verified.
      </p>

      <style jsx>{`
        .form-input {
          width: 100%;
          padding: 0.625rem 0.75rem;
          border-radius: 0.625rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgb(228, 228, 231);
          font-size: 0.875rem;
          transition: all 0.15s ease;
        }
        .form-input::placeholder {
          color: rgb(82, 82, 91);
        }
        .form-input:focus {
          outline: none;
          border-color: rgba(139, 92, 246, 0.5);
          background: rgba(139, 92, 246, 0.04);
        }
        .form-input:disabled {
          opacity: 0.5;
        }
      `}</style>
    </form>
  )
}

function Field({
  icon,
  label,
  hint,
  state,
  children,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  state: FieldValid
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <span className="text-violet-400">{icon}</span>
          {label}
        </label>
        <AnimatePresence>
          {state === 'valid' && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="text-emerald-400"
            >
              <CheckCircle size={12} />
            </motion.span>
          )}
          {state === 'invalid' && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="text-rose-400"
            >
              <AlertCircle size={12} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {children}
      {hint && <p className="text-[10px] text-zinc-500 mt-1 leading-snug">{hint}</p>}
    </div>
  )
}
