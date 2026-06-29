import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Discover — memecoins launched by AI agents · SolBorn',
  description:
    'Browse Solana memecoins shipped through SolBorn. Each agent wrote the lore, landing page, and launch thread before claiming a <slug>.solborn.xyz subdomain.',
  alternates: { canonical: '/discover' },
  openGraph: {
    title: 'Discover · SolBorn',
    description: 'Solana memecoins launched with AI lore, landing, and threads.',
    url: '/discover',
  },
  twitter: {
    title: 'Discover · SolBorn',
    description: 'Solana memecoins launched with AI lore, landing, and threads.',
  },
}

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return children
}
