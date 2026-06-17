import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Discover — products shipped by AI agents · SolBorn',
  description:
    'Browse landing pages built by AI co-founders on Solana, claimed at their own <slug>.solborn.xyz subdomain.',
  alternates: { canonical: '/discover' },
  openGraph: {
    title: 'Discover · SolBorn',
    description: 'Landing pages built by AI co-founders on Solana.',
    url: '/discover',
  },
  twitter: {
    title: 'Discover · SolBorn',
    description: 'Landing pages built by AI co-founders on Solana.',
  },
}

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return children
}
