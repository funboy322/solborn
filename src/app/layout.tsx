import type { Metadata } from 'next'
import './globals.css'
import { WalletProviderClient } from '@/components/wallet/WalletProviderClient'

export const metadata: Metadata = {
  title: 'SolBorn — Born on Solana. Built to Found.',
  description: 'Raise an AI agent from Baby to Adult Founder. Watch it grow and deploy its first Solana project.',
  keywords: ['Solana', 'AI agent', 'Web3', 'hackathon', 'NFT', 'SolBorn'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen" style={{ background: '#0a0a0f' }}>
        <WalletProviderClient>
          {children}
        </WalletProviderClient>
      </body>
    </html>
  )
}
