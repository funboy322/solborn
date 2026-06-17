'use client'

/**
 * Reads the connected wallet's $SBORN balance via /api/sborn/balance
 * and derives holder status.
 *
 * Ephemeral state (per session) — we don't persist to zustand because
 * the balance can change at any moment on-chain and we'd rather refetch
 * cheaply than show stale data. The server endpoint caches 60s, so the
 * effective RPC pressure is one call per wallet per minute.
 */

import { useCallback, useEffect, useState } from 'react'
import { useSolanaSigner } from './useSolanaSigner'
import { SBORN_HOLDER_MIN_TOKENS } from '../staking'

export interface SbornHolderState {
  balance: number
  isHolder: boolean
  tier: 'none' | 'holder'
  loading: boolean
  /** Re-fetch on demand (e.g. after a buy completes in another tab). */
  refresh: () => void
}

const REFRESH_INTERVAL_MS = 60_000

export function useSbornHolder(): SbornHolderState {
  const signer = useSolanaSigner()
  const wallet = signer.walletAddress ?? null

  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [tick, setTick] = useState(0)

  const fetchBalance = useCallback(
    async (signal?: AbortSignal) => {
      if (!wallet) {
        setBalance(0)
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`/api/sborn/balance?wallet=${encodeURIComponent(wallet)}`, {
          signal,
        })
        if (!res.ok) {
          setBalance(0)
          return
        }
        const data = (await res.json()) as { balance?: number }
        setBalance(typeof data.balance === 'number' ? data.balance : 0)
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return
        setBalance(0)
      } finally {
        setLoading(false)
      }
    },
    [wallet]
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchBalance(controller.signal)
    const id = setInterval(() => fetchBalance(controller.signal), REFRESH_INTERVAL_MS)
    return () => {
      controller.abort()
      clearInterval(id)
    }
    // tick is part of refresh contract — re-runs fetchBalance when bumped.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBalance, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])

  const isHolder = balance >= SBORN_HOLDER_MIN_TOKENS
  return {
    balance,
    isHolder,
    tier: isHolder ? 'holder' : 'none',
    loading,
    refresh,
  }
}
