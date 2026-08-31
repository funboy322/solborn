'use client'

/**
 * DeployTokenModal — mints a pump.fun token from the current project brief.
 *
 * Flow:
 *   1. Confirmation card. Explains: real mainnet tx, ~0.02 SOL, no reversal.
 *   2. Prepare: POST /api/pump/prepare-create with an ephemeral mint pubkey.
 *      Server returns the createV2 tx serialized (no signatures yet).
 *   3. Sign:
 *        - client partial-signs with the ephemeral mint keypair
 *        - user wallet signs (fee payer) via useSolanaSigner
 *   4. Broadcast + confirm on mainnet.
 *   5. On success:
 *        - patch the local zustand project with contractAddress + pumpFunUrl
 *        - sync to Redis mirror so <slug>.solborn.xyz updates
 *        - show link to pump.fun/coin/<mint>
 *
 * Mint keypair NEVER leaves the browser. Server only sees the pubkey.
 * If the tx fails after signing, no state changes anywhere.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Check, ExternalLink, Loader2, Rocket, X } from 'lucide-react'
import {
  Connection,
  Keypair,
  Transaction,
  clusterApiUrl,
} from '@solana/web3.js'
import { useSolanaSigner } from '@/lib/hooks/useSolanaSigner'
import { useForgeStore } from '@/lib/store'
import type { ForgeAgent, GeneratedProject } from '@/lib/types'

interface DeployTokenModalProps {
  agent: ForgeAgent
  project: GeneratedProject
  subdomain: string
  onClose: () => void
  onSuccess: (mintAddress: string, pumpFunUrl: string) => void
  accentColor?: string
}

type FlowState =
  | { kind: 'confirm' }
  | { kind: 'preparing' }
  | { kind: 'signing' }
  | { kind: 'broadcasting' }
  | { kind: 'confirming'; signature: string }
  | { kind: 'done'; mintAddress: string; signature: string; pumpFunUrl: string }
  | { kind: 'error'; message: string }

const CLIENT_RPC =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_HELIUS_RPC_MAINNET) ||
  clusterApiUrl('mainnet-beta')

export function DeployTokenModal({
  agent,
  project,
  subdomain,
  onClose,
  onSuccess,
  accentColor = '#8b5cf6',
}: DeployTokenModalProps) {
  const [state, setState] = useState<FlowState>({ kind: 'confirm' })
  const signer = useSolanaSigner()
  const ticker = project.memecoinBrief?.ticker?.toUpperCase() ?? ''

  const inFlight = ['preparing', 'signing', 'broadcasting', 'confirming'].includes(state.kind)

  async function handleDeploy() {
    if (!signer.connected || !signer.publicKey || !signer.signTransaction) {
      setState({ kind: 'error', message: 'Connect a wallet first (Phantom or Privy).' })
      return
    }

    setState({ kind: 'preparing' })

    // Ephemeral mint keypair — used once, never persisted.
    const mintKeypair = Keypair.generate()

    let prepared: {
      txBase64: string
      mintPubkey: string
      blockhash: string
      lastValidBlockHeight: number
    }
    try {
      const res = await fetch('/api/pump/prepare-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain,
          mintPubkey: mintKeypair.publicKey.toBase58(),
          userPubkey: signer.publicKey.toBase58(),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setState({ kind: 'error', message: `Preparation failed: ${err.error ?? res.status}` })
        return
      }
      prepared = await res.json()
    } catch (e) {
      setState({
        kind: 'error',
        message: `Network error preparing tx: ${e instanceof Error ? e.message : 'unknown'}`,
      })
      return
    }

    setState({ kind: 'signing' })

    let signedTx: Transaction
    try {
      const raw = Uint8Array.from(atob(prepared.txBase64), (c) => c.charCodeAt(0))
      const tx = Transaction.from(raw)
      tx.partialSign(mintKeypair)
      signedTx = await signer.signTransaction(tx)
    } catch (e) {
      setState({
        kind: 'error',
        message: `Signing cancelled or failed: ${e instanceof Error ? e.message : 'unknown'}`,
      })
      return
    }

    setState({ kind: 'broadcasting' })

    const connection = new Connection(CLIENT_RPC, 'confirmed')
    let signature: string
    try {
      signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      })
    } catch (e) {
      setState({
        kind: 'error',
        message: `Broadcast failed: ${e instanceof Error ? e.message : 'unknown'}`,
      })
      return
    }

    setState({ kind: 'confirming', signature })

    try {
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: prepared.blockhash,
          lastValidBlockHeight: prepared.lastValidBlockHeight,
        },
        'confirmed',
      )
      if (confirmation.value.err) {
        setState({
          kind: 'error',
          message: `Transaction failed on-chain: ${JSON.stringify(confirmation.value.err)}`,
        })
        return
      }
    } catch (e) {
      setState({
        kind: 'error',
        message: `Confirmation timed out: ${e instanceof Error ? e.message : 'unknown'}`,
      })
      return
    }

    const mintAddress = prepared.mintPubkey
    const pumpFunUrl = `https://pump.fun/coin/${mintAddress}`

    // Patch local store first so UI updates immediately, then sync to mirror.
    useForgeStore.getState().updateGeneratedProject(agent.id, {
      memecoinBrief: {
        ...(project.memecoinBrief ?? {
          ticker: ticker || project.name.slice(0, 6),
          vibe: '',
          targetCommunity: '',
          lore: '',
          edge: '',
        }),
        contractAddress: mintAddress,
        pumpFunUrl,
      },
    })

    // Best-effort mirror sync. If it fails, local state is still correct;
    // the owner can Republish from the Edit modal later.
    try {
      const updatedProject = {
        ...project,
        memecoinBrief: {
          ...(project.memecoinBrief ?? {
            ticker: ticker || project.name.slice(0, 6),
            vibe: '',
            targetCommunity: '',
            lore: '',
            edge: '',
          }),
          contractAddress: mintAddress,
          pumpFunUrl,
        },
      }
      await fetch('/api/subdomain/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain,
          walletAddress: signer.walletAddress,
          agent,
          project: updatedProject,
        }),
      })
    } catch (e) {
      console.warn('[deploy] mirror sync failed', e)
    }

    setState({ kind: 'done', mintAddress, signature, pumpFunUrl })
    onSuccess(mintAddress, pumpFunUrl)
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
        className="relative w-full max-w-lg rounded-2xl"
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
            <Rocket size={16} style={{ color: accentColor }} />
            <h2 className="text-base font-semibold text-zinc-100">
              Deploy ${ticker} on pump.fun
            </h2>
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

        <div className="p-6 space-y-4">
          {state.kind === 'confirm' && (
            <>
              <div
                className="flex gap-3 p-4 rounded-xl"
                style={{
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.25)',
                }}
              >
                <AlertTriangle size={18} className="text-amber-300 flex-shrink-0 mt-0.5" />
                <div className="text-[13px] text-amber-100 leading-relaxed">
                  Real Solana mainnet transaction. Fee is roughly 0.02 SOL. Once confirmed the
                  mint is permanent, cannot be renamed, and you become the coin creator.
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
                <Row label="Name" value={project.name} />
                <Row label="Ticker" value={`$${ticker}`} accent={accentColor} />
                <Row label="Metadata" value={`solborn.xyz/api/pump/metadata/${subdomain}`} mono />
                <Row label="Wallet" value={signer.walletAddress ?? '(not connected)'} mono />
              </div>

              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Your wallet signs once. We do not touch your keys. The mint keypair is generated
                in your browser, used once, and discarded.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeploy}
                  disabled={!signer.connected}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-transform disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                  }}
                >
                  <Rocket className="w-4 h-4" />
                  {signer.connected ? `Deploy $${ticker}` : 'Connect wallet first'}
                </button>
              </div>
            </>
          )}

          {inFlight && (
            <ProgressBlock state={state} accentColor={accentColor} />
          )}

          {state.kind === 'error' && (
            <>
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-sm text-rose-200 leading-relaxed">
                {state.message}
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setState({ kind: 'confirm' })}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-100 border border-white/10 bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                >
                  Try again
                </button>
              </div>
            </>
          )}

          {state.kind === 'done' && (
            <>
              <div
                className="rounded-xl p-4 flex items-start gap-3"
                style={{
                  background: `${accentColor}10`,
                  border: `1px solid ${accentColor}55`,
                }}
              >
                <Check size={20} style={{ color: accentColor }} className="flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-100 mb-1">
                    ${ticker} is live on pump.fun
                  </p>
                  <p className="text-[11px] font-mono text-zinc-400 truncate">
                    {state.mintAddress}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={state.pumpFunUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                  }}
                >
                  Open on pump.fun
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={`https://solscan.io/tx/${state.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-200 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                >
                  View tx
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function Row({
  label,
  value,
  accent,
  mono,
}: {
  label: string
  value: string
  accent?: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</span>
      <span
        className={`text-sm font-semibold truncate ${mono ? 'font-mono text-[12px]' : ''}`}
        style={{ color: accent ?? '#fafafa', maxWidth: '65%' }}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}

const STEP_LABELS: Record<string, string> = {
  preparing: 'Preparing transaction',
  signing: 'Waiting for wallet signature',
  broadcasting: 'Broadcasting to mainnet',
  confirming: 'Waiting for confirmation',
}

function ProgressBlock({ state, accentColor }: { state: FlowState; accentColor: string }) {
  const label = STEP_LABELS[state.kind] ?? 'Working'
  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: accentColor }} />
        <p className="text-sm text-zinc-100">{label}...</p>
      </div>
      {state.kind === 'confirming' && (
        <p className="text-[11px] font-mono text-zinc-500 truncate">tx: {state.signature}</p>
      )}
      <p className="text-[11px] text-zinc-600 leading-relaxed">
        Do not close this window. Confirmation usually takes 10-20 seconds on mainnet.
      </p>
    </div>
  )
}
