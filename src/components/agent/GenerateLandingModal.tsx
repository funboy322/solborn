'use client'

/**
 * Generate Landing Page modal — Pro feature payment + LLM call UI.
 *
 * Flow:
 *   1. User opens modal → state 'idle'. Shows price + recipient + Pay button.
 *   2. Click Pay → 'signing' (wallet approval) → 'confirming' (network) →
 *      'generating' (server LLM) → 'done' (call onSuccess + close).
 *   3. Any failure → 'error' with a precise reason and Retry.
 *
 * The mainnet tx is sent client-side using the existing useSolanaSigner +
 * useConnection — same plumbing as the rest of the app's signing flows.
 * After confirmation, /api/landing/generate re-verifies on-chain before
 * spending LLM tokens, so client trust is contained.
 *
 * Parent is responsible for mounting only when open (so useState resets
 * cleanly on reopen — same pattern as EditProductModal).
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, ExternalLink, Loader2, Sparkles, X } from 'lucide-react'
import { Connection } from '@solana/web3.js'
import { useSolanaSigner } from '@/lib/hooks/useSolanaSigner'
import {
  LANDING_PRICE_LAMPORTS,
  LANDING_RECIPIENT,
  buildPayTx,
  getMainnetConnection,
  waitForConfirmation,
} from '@/lib/solana-pay'
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
  | { kind: 'signing' }
  | { kind: 'confirming'; signature: string }
  | { kind: 'generating'; signature: string }
  | { kind: 'done' }
  | { kind: 'error'; message: string; signature?: string }

const ERROR_MESSAGES: Record<string, string> = {
  replay: 'This payment was already used for a generation. Pay again to retry.',
  'tx-not-found': "We couldn't find your transaction on mainnet. Wait a few seconds and retry.",
  'tx-stale': 'Payment is older than 24 hours. Pay a fresh 0.05 SOL to generate.',
  'tx-mismatch': 'Payment did not match the expected recipient/amount. Retry.',
  'tx-failed': 'On-chain transaction reverted. No charge — try again.',
  'rpc-error': 'Mainnet RPC was busy. Try again in a moment.',
  'missing-key': 'Server LLM is not configured. Try later.',
  'llm-failed': 'Generator could not finish. Server cached your payment — retry without paying again.',
  'llm-bad-json': 'AI produced unparseable output twice. Retry once more.',
  'shape-invalid': 'AI returned an unusable shape. Retry once more.',
  'invalid-tx-sig': 'Internal: invalid signature format. Reload and try again.',
  'invalid-wallet': 'Internal: invalid wallet. Reconnect and try again.',
  'missing-fields': 'Internal: missing context. Reload page.',
  'missing-context': 'Internal: missing context. Reload page.',
  'invalid-json': 'Internal: request payload broken. Reload page.',
  'confirmation-timeout':
    'Network did not confirm in 60s. Your tx may still go through — check Explorer, then retry.',
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
  const [copied, setCopied] = useState(false)

  const inFlight =
    state.kind === 'signing' ||
    state.kind === 'confirming' ||
    state.kind === 'generating'

  const handlePay = async () => {
    if (!signer.publicKey || !signer.signTransaction || !signer.walletAddress) {
      setState({ kind: 'error', message: 'Connect a Solana wallet first.' })
      return
    }

    const connection: Connection = getMainnetConnection()
    setState({ kind: 'signing' })

    let signature: string
    try {
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      const tx = buildPayTx({
        sender: signer.publicKey,
        recipient: LANDING_RECIPIENT,
        lamports: LANDING_PRICE_LAMPORTS,
        recentBlockhash: blockhash,
      })
      const signed = await signer.signTransaction(tx)
      signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not send transaction.'
      setState({ kind: 'error', message: msg })
      return
    }

    setState({ kind: 'confirming', signature })

    const confirm = await waitForConfirmation(connection, signature, { timeoutMs: 60_000 })
    if (!confirm.ok) {
      setState({
        kind: 'error',
        message:
          ERROR_MESSAGES[confirm.error ?? ''] ??
          confirm.error ??
          'Confirmation failed.',
        signature,
      })
      return
    }

    setState({ kind: 'generating', signature })

    try {
      const res = await fetch('/api/landing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          projectId: project.id,
          txSignature: signature,
          walletAddress: signer.walletAddress,
          agent,
          project,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        const errorKey = data.error ?? `http-${res.status}`
        setState({
          kind: 'error',
          message: ERROR_MESSAGES[errorKey] ?? `Generation failed (${errorKey}).`,
          signature,
        })
        return
      }
      const landing = (await res.json()) as LandingContent
      setState({ kind: 'done' })
      onSuccess(landing)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error.'
      setState({ kind: 'error', message: msg, signature })
    }
  }

  const handleCopyRecipient = async () => {
    try {
      await navigator.clipboard.writeText(LANDING_RECIPIENT.toBase58())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // No-op — clipboard may be unavailable in some browsers
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
            Pay <span className="text-zinc-100 font-semibold">0.05 SOL</span> on Solana mainnet.
            One payment = one fresh landing page (hero, features, how-it-works, FAQ, CTA) generated
            by the AI from your brief. Pay again later to regenerate.
          </p>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-zinc-300 space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Network</span>
              <span className="text-zinc-200">Solana mainnet</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Amount</span>
              <span className="text-zinc-200">0.05 SOL (~$7)</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Recipient</span>
              <button
                onClick={handleCopyRecipient}
                className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-200 hover:text-zinc-50 transition-colors"
                title="Copy address"
              >
                {LANDING_RECIPIENT.toBase58().slice(0, 6)}…
                {LANDING_RECIPIENT.toBase58().slice(-6)}
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Progress */}
          {state.kind !== 'idle' && state.kind !== 'error' && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-zinc-300 space-y-1.5">
              <StepRow
                done={
                  state.kind === 'confirming' ||
                  state.kind === 'generating' ||
                  state.kind === 'done'
                }
                active={state.kind === 'signing'}
                label="Sign transaction in wallet"
              />
              <StepRow
                done={state.kind === 'generating' || state.kind === 'done'}
                active={state.kind === 'confirming'}
                label="Wait for mainnet confirmation"
              />
              <StepRow
                done={state.kind === 'done'}
                active={state.kind === 'generating'}
                label="AI generates landing page"
              />
              {'signature' in state && state.signature && (
                <a
                  href={`https://explorer.solana.com/tx/${state.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors pt-1"
                >
                  view tx on explorer
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}

          {/* Error */}
          {state.kind === 'error' && (
            <div
              role="alert"
              className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2 space-y-1"
            >
              <div>{state.message}</div>
              {state.signature && (
                <a
                  href={`https://explorer.solana.com/tx/${state.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-rose-200/80 hover:text-rose-100 transition-colors"
                >
                  view tx
                  <ExternalLink size={10} />
                </a>
              )}
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
              onClick={handlePay}
              disabled={inFlight || !signer.connected}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-zinc-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: inFlight
                  ? 'rgba(139,92,246,0.6)'
                  : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
              }}
            >
              {state.kind === 'signing' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sign in wallet…
                </>
              )}
              {state.kind === 'confirming' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Confirming…
                </>
              )}
              {state.kind === 'generating' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating…
                </>
              )}
              {(state.kind === 'idle' || state.kind === 'error' || state.kind === 'done') && (
                <>
                  <Sparkles className="w-4 h-4" />
                  Pay 0.05 SOL & generate
                </>
              )}
            </button>
          </div>

          {!signer.connected && (
            <p className="text-[11px] text-zinc-500 text-right">
              connect a wallet first
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function StepRow({
  done,
  active,
  label,
}: {
  done: boolean
  active: boolean
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : active ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
      ) : (
        <span className="w-3.5 h-3.5 rounded-full border border-white/15 inline-block" />
      )}
      <span className={done ? 'text-zinc-200' : active ? 'text-zinc-100' : 'text-zinc-500'}>
        {label}
      </span>
    </div>
  )
}
