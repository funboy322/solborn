'use client'
import { PrivyProvider as Privy } from '@privy-io/react-auth'
import { toSolanaWalletConnectors, defaultSolanaRpcsPlugin } from '@privy-io/react-auth/solana'
import { useMemo, type ReactNode } from 'react'

/**
 * Real PrivyProvider — only loaded if appId is configured.
 * Solana-focused: embedded wallet auto-created on first login, Phantom and
 * other external Solana wallets shown as connector options too.
 *
 * The defaultSolanaRpcsPlugin registers Privy's hosted RPC endpoints for
 * solana:mainnet and solana:devnet. Without it, useSignTransaction throws
 * "No RPC configuration found for chain solana:devnet" because the SDK has
 * no default chain → RPC mapping built in.
 */
export function PrivyProvider({ appId, children }: { appId: string; children: ReactNode }) {
  const solanaConnectors = useMemo(() => toSolanaWalletConnectors(), [])
  const solanaRpcs = useMemo(() => defaultSolanaRpcsPlugin(), [])

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
        plugins: [solanaRpcs],
      }}
    >
      {children}
    </Privy>
  )
}
