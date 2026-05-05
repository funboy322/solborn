'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ChevronDown, LogOut, Copy, Check, Droplets } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { useWallets as usePrivySolanaWallets } from '@privy-io/react-auth/solana'
import { useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'

const PRIVY_ENABLED = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID)

function truncate(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

function safePubkey(addr: string): PublicKey | null {
  try {
    return new PublicKey(addr)
  } catch {
    return null
  }
}

/**
 * Email / social login button. Opens Privy's modal which includes Google / Apple
 * / Twitter etc. — Privy provisions a Solana embedded wallet on first login.
 *
 * After authentication this button morphs into a wallet pill showing the
 * embedded wallet address + devnet balance, with a dropdown for copy / airdrop
 * / sign-out. Phantom users see this UI only if they ALSO logged in via Privy
 * (uncommon — Phantom path uses WalletButton).
 *
 * Renders nothing if Privy isn't configured (NEXT_PUBLIC_PRIVY_APP_ID unset).
 */
export function PrivyLoginButton() {
  if (!PRIVY_ENABLED) return null
  return <PrivyLoginButtonInner />
}

function PrivyLoginButtonInner() {
  const { login, authenticated, logout, ready } = usePrivy()
  const { wallets } = usePrivySolanaWallets()
  const wallet = wallets[0]
  const address = wallet?.address ?? null
  const pubkey = address ? safePubkey(address) : null

  const { connection } = useConnection()
  const [balance, setBalance] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [airdropping, setAirdropping] = useState(false)

  // Live balance — read on mount, subscribe to account changes
  useEffect(() => {
    if (!pubkey) {
      setBalance(null)
      return
    }
    let cancelled = false
    connection
      .getBalance(pubkey)
      .then((b) => {
        if (!cancelled) setBalance(b / LAMPORTS_PER_SOL)
      })
      .catch(() => {
        /* RPC hiccup — ignore, will retry on next mount */
      })
    const id = connection.onAccountChange(pubkey, (info) => {
      if (!cancelled) setBalance(info.lamports / LAMPORTS_PER_SOL)
    })
    return () => {
      cancelled = true
      connection.removeAccountChangeListener(id)
    }
  }, [pubkey, connection])

  const handleCopy = useCallback(() => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [address])

  const handleAirdrop = useCallback(async () => {
    if (!pubkey || !address || airdropping) return
    setAirdropping(true)
    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      const data = (await res.json().catch(() => ({}))) as { signature?: string; error?: string }
      if (!res.ok) {
        console.warn('[faucet]', data.error ?? `HTTP ${res.status}`)
      }
      // refresh balance regardless — onAccountChange may already have fired
      const b = await connection.getBalance(pubkey)
      setBalance(b / LAMPORTS_PER_SOL)
    } catch (e) {
      console.warn('[faucet] request failed:', e)
    } finally {
      setAirdropping(false)
    }
  }, [pubkey, address, connection, airdropping])

  // Loading — Privy SDK still initializing
  if (!ready) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-zinc-500 whitespace-nowrap"
      >
        <Mail size={12} />
        Loading…
      </button>
    )
  }

  // Authenticated but wallet still being provisioned by Privy
  if (authenticated && !address) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-cyan-300/20 text-cyan-300/70 whitespace-nowrap opacity-70"
      >
        <Mail size={12} />
        Provisioning wallet…
      </button>
    )
  }

  // Authenticated + wallet ready → wallet pill with dropdown
  if (authenticated && address) {
    return (
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap"
          style={{
            background: 'rgba(34,211,238,0.06)',
            borderColor: 'rgba(34,211,238,0.22)',
            color: '#67e8f9',
          }}
          title="Embedded wallet"
        >
          <Mail size={12} />
          <span className="font-mono">{truncate(address)}</span>
          {balance !== null && (
            <span className="text-zinc-400 hidden sm:inline">{balance.toFixed(2)} ◎</span>
          )}
          <ChevronDown size={12} className="text-zinc-500" />
        </motion.button>

        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="absolute right-0 top-full mt-2 w-64 z-50 rounded-2xl border p-3 space-y-1"
                style={{
                  background: 'rgba(14,14,20,0.95)',
                  backdropFilter: 'blur(20px)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                }}
              >
                {/* Address row */}
                <div className="px-2 py-2 rounded-xl bg-white/[0.03]">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Embedded wallet</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-zinc-300 truncate">{address}</span>
                    <button
                      onClick={handleCopy}
                      className="flex-shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                {/* Balance */}
                <div className="px-2 py-2 rounded-xl bg-white/[0.03] flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Balance</p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {balance !== null ? `${balance.toFixed(4)} SOL` : '—'}
                    </p>
                  </div>
                  <span className="text-xs text-cyan-200 px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-300/20">
                    Devnet
                  </span>
                </div>

                {/* Airdrop — only when balance is low */}
                {(balance === null || balance < 0.1) && (
                  <button
                    onClick={handleAirdrop}
                    disabled={airdropping}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-medium text-cyan-300 hover:bg-cyan-500/10 transition-colors disabled:opacity-50"
                  >
                    <Droplets size={13} />
                    {airdropping ? 'Requesting...' : 'Request 0.5 SOL (devnet)'}
                  </button>
                )}

                {/* Sign out */}
                <button
                  onClick={() => {
                    logout()
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-medium text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Not authenticated → Sign in (entry point to Privy modal)
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => login()}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap"
      style={{
        background: 'rgba(34,211,238,0.06)',
        borderColor: 'rgba(34,211,238,0.22)',
        color: '#67e8f9',
      }}
    >
      <Mail size={12} />
      Sign in
    </motion.button>
  )
}
