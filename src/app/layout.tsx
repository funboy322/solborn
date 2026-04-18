import type { Metadata } from 'next'
import './globals.css'
import { WalletProviderClient } from '@/components/wallet/WalletProviderClient'

export const metadata: Metadata = {
  title: 'SolBorn — Born on Solana. Built to Found.',
  description: 'Raise an AI agent from Baby to Adult Founder. Watch it grow and deploy its first Solana project.',
  keywords: ['Solana', 'AI agent', 'Web3', 'hackathon', 'NFT', 'SolBorn'],
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'SolBorn — Raise an AI Founder on Solana',
    description: 'Raise an AI agent from Baby to Adult Founder. Watch it grow, learn, and deploy its first Solana project.',
    images: [{ url: '/logo.svg' }],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'SolBorn',
    description: 'Raise an AI Founder on Solana',
    images: ['/logo.svg'],
    creator: '@ungspirit',
  },
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
