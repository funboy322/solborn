'use client'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'

/**
 * PrivyProvider lets users sign in with email / Google / Apple and get an
 * automatically-provisioned embedded Solana wallet — no Phantom install required.
 *
 * Sits ALONGSIDE the wallet-adapter Phantom flow. Useful for non-crypto users
 * who want to try the product without browser-extension friction.
 *
 * Gracefully no-ops if NEXT_PUBLIC_PRIVY_APP_ID is unset, so the rest of the
 * app still works. The Phantom flow remains fully functional in that case.
 */

const PrivyShim = dynamic(
  () => import('./PrivyProvider').then((m) => m.PrivyProvider),
  { ssr: false }
)

export function PrivyClientProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  if (!appId) {
    // No Privy configured — pass-through. Phantom-only mode.
    return <>{children}</>
  }
  return <PrivyShim appId={appId}>{children}</PrivyShim>
}
