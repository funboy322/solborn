import type { Metadata, Viewport } from 'next'
import './globals.css'
import { WalletProviderClient } from '@/components/wallet/WalletProviderClient'
import { PrivyClientProvider } from '@/components/wallet/PrivyClientProvider'
import { GitHubStarChip } from '@/components/GitHubStarChip'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://solborn.xyz'
const TITLE = 'SolBorn — AI Co-Founder on Solana'
const DESCRIPTION =
  'Tell SolBorn’s AI agent who you are. It interviews you, generates a personal Solana startup idea, and ships an on-chain Launch Certificate as a real Metaplex Core NFT on devnet.'
const SHORT_DESCRIPTION =
  'Your AI co-founder interviews you, finds your startup idea, and ships it on Solana devnet.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'SolBorn',
  title: {
    default: TITLE,
    template: '%s · SolBorn',
  },
  description: DESCRIPTION,
  keywords: [
    'Solana',
    'AI co-founder',
    'AI agent',
    'startup idea generator',
    'Solana startup',
    'Metaplex Core',
    'NFT passport',
    'Phantom',
    'Privy',
    'devnet',
    'hackathon',
    'Colosseum Frontier',
    'SolBorn',
    '$SBORN',
  ],
  creator: '@solborn_xyz',
  publisher: 'SolBorn',
  authors: [{ name: 'SolBorn', url: SITE_URL }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: TITLE,
    description: SHORT_DESCRIPTION,
    url: '/',
    siteName: 'SolBorn',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'SolBorn — AI co-founder on Solana',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: SHORT_DESCRIPTION,
    images: ['/api/og'],
    creator: '@solborn_xyz',
    site: '@solborn_xyz',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'technology',
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}#organization`,
      name: 'SolBorn',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      sameAs: [
        'https://x.com/solborn_xyz',
        'https://github.com/funboy322/solborn',
        'https://pump.fun/coin/3VNSmRLTvS54LWnynJNqEege21nzdjy1rEsPhsNxpump',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}#website`,
      url: SITE_URL,
      name: 'SolBorn',
      description: SHORT_DESCRIPTION,
      publisher: { '@id': `${SITE_URL}#organization` },
      inLanguage: 'en-US',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}#app`,
      name: 'SolBorn',
      url: SITE_URL,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: DESCRIPTION,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      author: { '@id': `${SITE_URL}#organization` },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen" style={{ background: '#0a0a0f' }}>
        <PrivyClientProvider>
          <WalletProviderClient>
            {children}
            <GitHubStarChip />
          </WalletProviderClient>
        </PrivyClientProvider>
      </body>
    </html>
  )
}
