'use client'
import { PrivyProvider as Privy } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'
import { useMemo, type ReactNode } from 'react'

/**
 * Real PrivyProvider — only loaded if appId is configured.
 * Solana-focused: embedded wallet auto-created on first login, Phantom and
 * other external Solana wallets shown as connector options too.
 *
 * RPC for embedded wallet ops is taken from Privy's defaults — devnet is wired
 * server-side via the dashboard. We don't override that here.
 */
export function PrivyProvider({ appId, children }: { appId: string; children: ReactNode }) {
  const solanaConnectors = useMemo(() => toSolanaWalletConnectors(), [])

  return (
    <Privy
      appId={appId}
      config={{
        loginMethods: ['email', 'google', 'twitter', 'apple', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#8b5cf6',
          logo: 'https://solborn.xyz/logo.png',
          walletChainType: 'solana-only',
        },
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      {children}
    </Privy>
  )
}
