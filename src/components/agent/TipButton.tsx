'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, ExternalLink, Loader2, Check, AlertCircle } from 'lucide-react'
import { PublicKey } from '@solana/web3.js'
import { useSolanaSigner } from '@/lib/hooks/useSolanaSigner'
import { tipFounder, TIP_PRESETS_SOL, MIN_TIP_SOL } from '@/lib/solana/tip'
import { WalletButton } from '@/components/wallet/WalletButton'

/**
 * Inline tip jar for product pages. Renders a chip button that expands into
 * an amount picker. Hidden entirely when:
 *   - there's no recipient wallet on file (legacy agent without walletAddress)
 *   - the connected wallet IS the recipient (no self-tipping)
 *
 * Uses the unified useSolanaSigner so Phantom and Privy both work without
 * branching. Devnet only — see lib/solana/tip.ts for the actual send.
 */

interface TipButtonProps {
  recipientWallet: string | null | undefined
  projectId: string
  projectName: string
}

type Status =
  | { kind: 'idle' }
  | { kind: 'signing' }
  | { kind: 'success'; explorerUrl: string; amountSol: number }
  | { kind: 'error'; message: string }

export function TipButton({ recipientWallet, projectId, projectName }: TipButtonProps) {
  const { publicKey, signTransaction, connected, walletAddress } = useSolanaSigner()
  const [open, setOpen] = useState(false)
  const [amountSol, setAmountSol] = useState<number>(TIP_PRESETS_SOL[0])
  const [customInput, setCustomInput] = useState<string>('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const recipientPubkey = useMemo(() => {
    if (!recipientWallet) return null
    try {
      return new PublicKey(recipientWallet)
    } catch {
      return null
    }
  }, [recipientWallet])

  // Hide the entire button when there's no valid recipient or when the visitor
  // would be tipping themselves.
  if (!recipientPubkey) return null
  if (walletAddress && walletAddress === recipientWallet) return null

  const effectiveAmount = customInput.trim()
    ? Math.max(0, parseFloat(customInput))
    : amountSol

  const canSend =
    connected &&
    publicKey &&
    signTransaction &&
    Number.isFinite(effectiveAmount) &&
    effectiveAmount >= MIN_TIP_SOL &&
    status.kind !== 'signing'

  async function handleSend() {
    if (!publicKey || !signTransaction || !recipientPubkey) return
    setStatus({ kind: 'signing' })
    try {
      const result = await tipFounder({
        fromPubkey: publicKey,
        toPubkey: recipientPubkey,
        amountSol: effectiveAmount,
        projectId,
        projectName,
        signTransaction,
      })
      setStatus({
        kind: 'success',
        explorerUrl: result.explorerUrl,
        amountSol: effectiveAmount,
      })
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Tip failed',
      })
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
          open
            ? 'border-amber-300/50 bg-amber-300/15 text-amber-100'
            : 'border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]'
        }`}
        aria-expanded={open}
      >
        <Coffee size={14} />
        Tip founder
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 top-full z-30 mt-2 w-[min(92vw,360px)] rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
              Tip the founder · devnet
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              Sends SOL directly to the wallet that minted this agent.
              Records a memo on chain so the tip is auditable in Explorer.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {TIP_PRESETS_SOL.map((preset) => {
                const active = !customInput.trim() && amountSol === preset
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmountSol(preset)
                      setCustomInput('')
                      if (status.kind !== 'signing') setStatus({ kind: 'idle' })
                    }}
                    className={`rounded-lg border px-2 py-2 text-sm font-mono transition-colors ${
                      active
                        ? 'border-amber-300/50 bg-amber-300/15 text-amber-100'
                        : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    {preset} SOL
                  </button>
                )
              })}
            </div>

            <input
              type="number"
              inputMode="decimal"
              step="0.001"
              min={MIN_TIP_SOL}
              value={customInput}
              onChange={(e) => {
                setCustomInput(e.target.value)
                if (status.kind !== 'signing') setStatus({ kind: 'idle' })
              }}
              placeholder={`Custom (min ${MIN_TIP_SOL} SOL)`}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-700 focus:border-amber-300/50 focus:outline-none mb-3"
            />

            {!connected ? (
              <div className="space-y-2">
                <p className="text-[11px] text-zinc-500">
                  Connect a wallet to send a tip.
                </p>
                <WalletButton />
              </div>
            ) : (
              <button
                type="button"
                disabled={!canSend}
                onClick={handleSend}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status.kind === 'signing' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Signing…
                  </>
                ) : status.kind === 'success' ? (
                  <>
                    <Check size={14} />
                    Sent · tip again
                  </>
                ) : (
                  <>Send {Number.isFinite(effectiveAmount) ? effectiveAmount : '?'} SOL</>
                )}
              </button>
            )}

            {status.kind === 'success' && (
              <div className="mt-3 rounded-lg border border-emerald-300/30 bg-emerald-300/[0.08] p-3 text-xs text-emerald-100 leading-relaxed">
                Tipped {status.amountSol} SOL.
                <a
                  href={status.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 font-mono text-[11px] text-emerald-200 hover:text-emerald-100 transition-colors"
                >
                  <ExternalLink size={11} />
                  View on Explorer
                </a>
              </div>
            )}

            {status.kind === 'error' && (
              <div className="mt-3 rounded-lg border border-rose-300/30 bg-rose-300/[0.08] p-3 text-xs text-rose-100 leading-relaxed">
                <div className="flex items-start gap-2">
                  <AlertCircle size={12} className="mt-0.5 shrink-0" />
                  <span>{status.message}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
