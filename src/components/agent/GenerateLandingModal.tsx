'use client'

/**
 * Generate Landing Page modal — free-tier version.
 *
 * Sends the agent + project to /api/landing/generate, waits ~10-15s for
 * Groq to return a structured LandingContent JSON, and hands it to the
 * parent on success.
 *
 * No payment step in this build — the prior 0.05 SOL Solana Pay flow is
 * disabled while we collect early-user signal. The server rate-limits
 * one generation per agent per 60 seconds. We'll switch back to paid
 * mode by re-introducing the GenerateLandingModal payment states + the
 * tx verification in /api/landing/generate (the helpers in
 * src/lib/solana-pay.ts are still exported, untouched).
 *
 * Parent is responsible for mounting only when open (so useState resets
 * cleanly on reopen — same pattern as EditProductModal).
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Loader2, Sparkles, X } from 'lucide-react'
import { useSolanaSigner } from '@/lib/hooks/useSolanaSigner'
import type { ForgeAgent, GeneratedProject, LandingContent } from '@/lib/types'

interface GenerateLandingModalProps {
  agent: ForgeAgent
  project: GeneratedProject
  onClose: () => void
  onSuccess: (landing: LandingContent) => void
  accentColor?: string
}

type FlowState =
  | { kind: 'idle' }
  | { kind: 'generating' }
  | { kind: 'done' }
  | { kind: 'error'; message: string }

const ERROR_MESSAGES: Record<string, string> = {
  'rate-limited':
    "We just generated a landing for this agent. Wait a minute and try again — we throttle to keep the LLM happy.",
  'missing-key': 'Server LLM is not configured. Try later.',
  'llm-failed': 'Generator could not finish. Try again in a moment.',
  'llm-bad-json': 'AI produced unparseable output twice. Try again.',
  'shape-invalid': 'AI returned an unusable shape. Try again.',
  'missing-fields': 'Internal: missing context. Reload page.',
  'missing-context': 'Internal: missing context. Reload page.',
  'invalid-json': 'Internal: request payload broken. Reload page.',
}

export function GenerateLandingModal({
  agent,
  project,
  onClose,
  onSuccess,
  accentColor = '#8b5cf6',
}: GenerateLandingModalProps) {
  const signer = useSolanaSigner()
  const [state, setState] = useState<FlowState>({ kind: 'idle' })

  const inFlight = state.kind === 'generating'

  const handleGenerate = async () => {
    setState({ kind: 'generating' })

    try {
      const res = await fetch('/api/landing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          projectId: project.id,
          walletAddress: signer.walletAddress,
          agent,
          project,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string; retryInMs?: number }
        const errorKey = data.error ?? `http-${res.status}`
        let message = ERROR_MESSAGES[errorKey] ?? `Generation failed (${errorKey}).`
        if (errorKey === 'rate-limited' && data.retryInMs) {
          const secs = Math.ceil(data.retryInMs / 1000)
          message = `Cooldown: wait ${secs}s before generating again.`
        }
        setState({ kind: 'error', message })
        return
      }
      const landing = (await res.json()) as LandingContent
      setState({ kind: 'done' })
      onSuccess(landing)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error.'
      setState({ kind: 'error', message: msg })
    }
  }

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
        className="relative w-full max-w-md rounded-2xl"
        style={{
          background: 'rgba(15,15,20,0.96)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${accentColor}40`,
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: accentColor }} />
            <h2 className="text-base font-semibold text-zinc-100">Generate landing page</h2>
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
          <p className="text-sm text-zinc-400 leading-relaxed">
            AI will write a full landing page from your brief — hero, four feature cards,
            how-it-works steps, FAQ, and a closing CTA. Free during early access. Takes about 15
            seconds.
          </p>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-zinc-300 space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Project</span>
              <span className="text-zinc-200 truncate ml-3">{project.name}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Brief depth</span>
              <span className="text-zinc-200">
                {project.brief && Object.values(project.brief).filter(Boolean).length >= 4
                  ? 'Detailed'
                  : 'Light — result will be more general'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Cost</span>
              <span className="text-emerald-300">Free (early access)</span>
            </div>
          </div>

          {/* Error */}
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
              disabled={inFlight}
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors disabled:opacity-40"
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
              {state.kind === 'generating' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-zinc-600 pt-1 flex items-start gap-1.5">
            <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>
              Free for early access. We&apos;ll switch to pay-per-generation (0.05 SOL) once the
              feature stabilises.
            </span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
