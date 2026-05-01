import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Demo Path — A 3-Minute Walkthrough',
  description:
    'See SolBorn end-to-end in three minutes: an AI agent interviews you, mints a Passport NFT, generates a product page, and publishes a Launch Certificate on Solana devnet.',
  alternates: { canonical: '/demo' },
  openGraph: {
    title: 'Demo Path · SolBorn',
    description: '3-minute walkthrough of the SolBorn co-founder loop on Solana devnet.',
    url: '/demo',
  },
  twitter: {
    title: 'Demo Path · SolBorn',
    description: '3-minute walkthrough of the SolBorn co-founder loop on Solana devnet.',
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
