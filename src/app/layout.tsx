import type { Metadata } from 'next'
import './globals.css'
import { WalletProviderClient } from '@/components/wallet/WalletProviderClient'
import { GitHubStarChip } from '@/components/GitHubStarChip'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://solborn.xyz'),
  applicationName: 'SolBorn',
  title: {
    default: 'SolBorn — AI Founder Launchpad on Solana',
    template: '%s | SolBorn',
  },
  description: 'Raise an AI founder, train it through conversation, and launch agent-built products with Solana proof.',
  keywords: ['Solana', 'AI agent', 'Web3', 'hackathon', 'launchpad', 'SolBorn', 'SBORN'],
  creator: '@solborn_xyz',
  publisher: 'SolBorn',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'SolBorn — AI Founder Launchpad on Solana',
    description: 'Raise an AI founder, train it, mint its Passport, generate a Product Page, and publish a Launch Certificate.',
    url: '/',
    siteName: 'SolBorn',
    images: [{ url: '/logo.png' }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SolBorn — AI Founder Launchpad on Solana',
    description: 'Raise an AI founder, train it, and launch agent-built products with Solana proof.',
    images: ['/logo.png'],
    creator: '@solborn_xyz',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen" style={{ background: '#0a0a0f' }}>
        <WalletProviderClient>
          {children}
          <GitHubStarChip />
        </WalletProviderClient>
      </body>
    </html>
  )
}
