'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Wallet, ChevronDown, LogOut, Copy, Check, Droplets } from 'lucide-react'

function truncateAddress(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

export function WalletButton() {
  const { publicKey, connected, connecting, disconnect, select, connect, wallets, wallet } = useWallet()
  const { connection } = useConnection()

  const [balance, setBalance] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [airdropping, setAirdropping] = useState(false)

  // Fetch SOL balance
  useEffect(() => {
    if (!publicKey) { setBalance(null); return }
    connection.getBalance(publicKey).then((b) => setBalance(b / LAMPORTS_PER_SOL))
    const id = connection.onAccountChange(publicKey, (info) =>
      setBalance(info.lamports / LAMPORTS_PER_SOL)
    )
    return () => { connection.removeAccountChangeListener(id) }
  }, [publicKey, connection])

  const handleCopy = useCallback(() => {
    if (!publicKey) return
    navigator.clipboard.writeText(publicKey.toBase58())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [publicKey])

  const handleAirdrop = useCallback(async () => {
    if (!publicKey || airdropping) return
    setAirdropping(true)
    try {
      const sig = await connection.requestAirdrop(publicKey, 0.5 * LAMPORTS_PER_SOL)
      await connection.confirmTransaction(sig, 'confirmed')
      const b = await connection.getBalance(publicKey)
      setBalance(b / LAMPORTS_PER_SOL)
    } catch (e) {
      console.warn('Airdrop failed (rate limited):', e)
    } finally {
      setAirdropping(false)
    }
  }, [publicKey, connection, airdropping])

  const handleConnect = useCallback(async () => {
    try {
      const phantom = wallets.find((entry) => entry.adapter.name === 'Phantom')
      const preferred =
        phantom ??
        wallets.find((entry) => entry.readyState === WalletReadyState.Installed) ??
        wallets.find((entry) => entry.readyState === WalletReadyState.Loadable) ??
        wallets[0]

      if (!preferred) return

      if (wallet?.adapter.name !== preferred.adapter.name) {
        select(preferred.adapter.name)
        await new Promise((resolve) => setTimeout(resolve, 0))
      }

      await connect()
    } catch (error) {
      console.warn('Wallet connect failed:', error)
    }
  }, [wallet, wallets, select, connect])

  // Not connected
  if (!connected) {
    return (
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => void handleConnect()}
        disabled={connecting}
        className="relative inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white overflow-hidden border border-violet-300/20 whitespace-nowrap"
        style={{
          background: 'linear-gradient(135deg, #8b5cf6, #6d28d9 55%, #3b0764)',
          boxShadow: '0 16px 38px rgba(88,28,135,0.35), inset 0 1px 0 rgba(255,255,255,0.16)',
        }}
      >
        {/* Shine sweep */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
        <Wallet size={14} />
        {connecting ? (
          <>Connecting<span className="hidden sm:inline">...</span></>
        ) : (
          <>Connect<span className="hidden sm:inline"> Wallet</span></>
        )}
      </motion.button>
    )
  }

  return (
    <div className="relative">
      {/* Connected button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border"
        style={{
          background: 'rgba(124,58,237,0.12)',
          borderColor: 'rgba(167,139,250,0.26)',
          color: '#ddd6fe',
          boxShadow: '0 0 18px rgba(124,58,237,0.18)',
        }}
      >
        <span className="font-mono">{truncateAddress(publicKey!.toBase58())}</span>
        {balance !== null && (
          <span className="text-xs text-zinc-400 hidden sm:inline">
            {balance.toFixed(2)} ◎
          </span>
        )}
        <ChevronDown size={12} className="text-zinc-500" />
      </motion.button>

      {/* Dropdown */}
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
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Wallet</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-zinc-300 truncate">
                    {publicKey!.toBase58()}
                  </span>
                  <button onClick={handleCopy} className="flex-shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors">
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
                <span className="text-xs text-violet-200 px-2 py-0.5 rounded-full bg-violet-400/10 border border-violet-300/20">
                  Solana
                </span>
              </div>

              {/* Airdrop */}
              {(balance === null || balance < 0.1) && (
                <button
                  onClick={handleAirdrop}
                  disabled={airdropping}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-medium text-violet-300 hover:bg-violet-500/10 transition-colors disabled:opacity-50"
                >
                  <Droplets size={13} />
                  {airdropping ? 'Requesting...' : 'Request 0.5 SOL (devnet)'}
                </button>
              )}

              {/* Disconnect */}
              <button
                onClick={() => { disconnect(); setOpen(false) }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-medium text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut size={13} />
                Disconnect
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
