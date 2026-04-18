'use client'
// Dynamic import wrapper so wallet-adapter doesn't break SSR
import dynamic from 'next/dynamic'

const WalletProvider = dynamic(
  () => import('./WalletProvider').then((m) => m.WalletProvider),
  { ssr: false }
)

export function WalletProviderClient({ children }: { children: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>
}
