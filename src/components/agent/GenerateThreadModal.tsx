'use client'

/**
 * Generate launch-thread modal — free-tier flow.
 *
 * Calls /api/thread/generate, displays the 7 tweets with copy-per-tweet
 * buttons, plus a "Post tweet 1 on X" intent link to kick off the
 * thread the moment it lands. The user posts the rest manually as
 * replies (X API doesn't expose threading without OAuth).
 *
 * Parent is responsible for mounting only when open — same pattern as
 * EditProductModal and GenerateLandingModal.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, ExternalLink, Loader2, Sparkles, X } from 'lucide-react'
import type { ForgeAgent, GeneratedProject, LaunchTweetThread } from '@/lib/types'

interface GenerateThreadModalProps {
  agent: ForgeAgent
  project: GeneratedProject
  onClose: () => void
  onSuccess: (thread: LaunchTweetThread) => void
  accentColor?: string
}

type FlowState =
  | { kind: 'idle' }
  | { kind: 'generating' }
  | { kind: 'done'; thread: LaunchTweetThread }
  | { kind: 'error'; message: string }

const ERROR_MESSAGES: Record<string, string> = {
  'rate-limited':
    'We just generated a thread for this agent. Wait a minute and try again.',
  'missing-key': 'Server LLM is not configured. Try later.',
  'llm-failed': 'Generator could not finish. Try again in a moment.',
  'llm-bad-json': 'AI produced unparseable output twice. Try again.',
  'shape-invalid': 'AI returned an unusable shape. Try again.',
  'missing-fields': 'Internal: missing context. Reload page.',
  'missing-context': 'Internal: missing context. Reload page.',
  'invalid-json': 'Internal: request payload broken. Reload page.',
}

export function GenerateThreadModal({
  agent,
  project,
  onClose,
  onSuccess,
  accentColor = '#8b5cf6',
}: GenerateThreadModalProps) {
  const initial: FlowState = project.launchThread
    ? { kind: 'done', thread: project.launchThread }
    : { kind: 'idle' }
  const [state, setState] = useState<FlowState>(initial)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const inFlight = state.kind === 'generating'
  const thread = state.kind === 'done' ? state.thread : null

  const handleGenerate = async () => {
    setState({ kind: 'generating' })
    try {
      const res = await fetch('/api/thread/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          projectId: project.id,
          agent,
          project,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string
          retryInMs?: number
        }
        const errorKey = data.error ?? `http-${res.status}`
        let message = ERROR_MESSAGES[errorKey] ?? `Generation failed (${errorKey}).`
        if (errorKey === 'rate-limited' && data.retryInMs) {
          const secs = Math.ceil(data.retryInMs / 1000)
          message = `Cooldown: wait ${secs}s before generating again.`
        }
        setState({ kind: 'error', message })
        return
      }
      const newThread = (await res.json()) as LaunchTweetThread
      setState({ kind: 'done', thread: newThread })
      onSuccess(newThread)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error.'
      setState({ kind: 'error', message: msg })
    }
  }

  const handleCopyTweet = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 1500)
    } catch {
      // No-op
    }
  }

  const handleCopyAll = async () => {
    if (!thread) return
    const text = thread.tweets.map((t, i) => `${i + 1}/${thread.tweets.length}\n${t}`).join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 1500)
    } catch {
      // No-op
    }
  }

  const xIntentUrl = (text: string) =>
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3 sm:px-6 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      aria-modal="true"
      role="dialog"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => (inFlight ? null : onClose())}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl"
        style={{
          background: 'rgba(15,15,20,0.96)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${accentColor}40`,
        }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5"
          style={{
            background: 'rgba(15,15,20,0.96)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: accentColor }} />
            <h2 className="text-base font-semibold text-zinc-100">Launch thread</h2>
          </div>
          <button
            onClick={() => (inFlight ? null : onClose())}
            disabled={inFlight}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors disabled:opacity-30"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!thread && (
            <>
              <p className="text-sm text-zinc-400 leading-relaxed">
                AI writes a 7-tweet launch thread for{' '}
                <span className="text-zinc-100 font-semibold">{project.name}</span> from your
                brief. You copy each tweet and post them as a thread on X. Free during early
                access.
              </p>

              {state.kind === 'error' && (
                <div
                  role="alert"
                  className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2"
                >
                  {state.message}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={inFlight}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-zinc-50 transition-colors disabled:cursor-not-allowed"
                  style={{
                    background: inFlight
                      ? 'rgba(139,92,246,0.6)'
                      : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                  }}
                >
                  {inFlight ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Writing thread…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate thread
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {thread && (
            <>
              {/* Action row */}
              <div className="flex items-center justify-between gap-3 flex-wrap pb-1">
                <p className="text-xs text-zinc-500">
                  {thread.tweets.length} tweets · {thread.hashtags.length > 0
                    ? thread.hashtags.map((h) => `#${h}`).join(' ')
                    : 'no hashtags'}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-200 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                  >
                    {copiedAll ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy all
                      </>
                    )}
                  </button>
                  <a
                    href={xIntentUrl(thread.tweets[0])}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-50"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                    }}
                  >
                    Post 1/7 on X
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Tweets list */}
              <ol className="space-y-2.5">
                {thread.tweets.map((tweet, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                        {idx + 1} / {thread.tweets.length}
                      </span>
                      <span className="text-[10px] text-zinc-600 tabular-nums">
                        {tweet.length}/280
                      </span>
                    </div>
                    <p className="text-sm text-zinc-100 leading-relaxed whitespace-pre-wrap">
                      {tweet}
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <a
                        href={xIntentUrl(tweet)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-200 transition-colors"
                      >
                        Open in X
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyTweet(tweet, idx)}
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-200 transition-colors"
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                <p className="text-[11px] text-zinc-600">
                  Post tweet 1 first, then reply with the rest in order. X doesn&apos;t expose
                  threading without OAuth, so this stays manual for now.
                </p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={inFlight}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors whitespace-nowrap"
                >
                  {inFlight ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Regenerating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Regenerate
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
