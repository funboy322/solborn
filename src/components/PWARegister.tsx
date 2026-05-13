'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker that makes SolBorn installable.
 *
 * Mounted once in src/app/layout.tsx. Renders nothing visible; the
 * useEffect fires on first client render and registers /sw.js.
 *
 * Re-registration is idempotent — the browser keeps one SW per scope,
 * so navigating between routes won't pile up registrations.
 *
 * Errors are logged to console but swallowed so a broken SW never
 * crashes the rest of the page (Privy, wallet adapter, store hydration).
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV === 'development') return

    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[PWA] Service worker registration failed:', err)
    })
  }, [])

  return null
}
