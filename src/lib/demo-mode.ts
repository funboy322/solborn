/**
 * Demo mode — activated by appending `?demo=1` to any URL.
 *
 * Purpose: let a judge / new visitor speed-run from Baby to Adult in ~2 minutes
 * without waiting for real teaching XP. Critical for hackathon demos and for
 * recording the 60-second marketing video.
 *
 * Persisted in sessionStorage so navigation between pages keeps the mode
 * active until the tab is closed. Never written to localStorage — we don't
 * want returning users to accidentally stay in demo.
 *
 * Safe-by-default: all real XP/energy logic works as before when this
 * returns `false`. The multipliers only kick in when explicitly enabled.
 */

'use client'
import { useEffect, useState } from 'react'

const KEY = 'solborn-demo-mode'

/** XP multiplier when demo mode is active. Chosen so a ~20-word message
 *  gives ~200–400 XP — enough to hit Adult (700 XP) in 3–4 messages. */
export const DEMO_XP_MULTIPLIER = 50

/** Energy cost override. 0 = infinite energy in demo. */
export const DEMO_ENERGY_COST = 0

function readInitial(): boolean {
  if (typeof window === 'undefined') return false
  try {
    // URL param wins over stored state, so a link like ?demo=1 always works.
    const url = new URL(window.location.href)
    const q = url.searchParams.get('demo')
    if (q === '1' || q === 'true') {
      sessionStorage.setItem(KEY, '1')
      return true
    }
    if (q === '0' || q === 'false') {
      sessionStorage.removeItem(KEY)
      return false
    }
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** Returns true when demo mode is active in this tab. SSR-safe. */
export function useDemoMode(): boolean {
  const [enabled, setEnabled] = useState<boolean>(false)

  useEffect(() => {
    setEnabled(readInitial())
    // React to URL changes (in-app navigation uses history API; listen for both)
    const onChange = () => setEnabled(readInitial())
    window.addEventListener('popstate', onChange)
    window.addEventListener('solborn-demo-mode-change', onChange)
    return () => {
      window.removeEventListener('popstate', onChange)
      window.removeEventListener('solborn-demo-mode-change', onChange)
    }
  }, [])

  return enabled
}

/** Imperatively toggle demo mode — used by the debug toggle in the footer. */
export function setDemoMode(on: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (on) sessionStorage.setItem(KEY, '1')
    else sessionStorage.removeItem(KEY)
    window.dispatchEvent(new Event('solborn-demo-mode-change'))
  } catch {
    /* noop */
  }
}
