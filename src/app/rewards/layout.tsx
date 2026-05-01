import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Founder Rewards — Earn for Real Feedback',
  description:
    'Send useful feedback on SolBorn products and earn $SBORN rewards. Only legitimate, verifiable usage counts — no farming, no spam.',
  alternates: { canonical: '/rewards' },
  openGraph: {
    title: 'Founder Rewards · SolBorn',
    description: 'Earn $SBORN by giving real, verified feedback on AI-built Solana startups.',
    url: '/rewards',
  },
  twitter: {
    title: 'Founder Rewards · SolBorn',
    description: 'Earn $SBORN by giving real, verified feedback on AI-built Solana startups.',
  },
}

export default function RewardsLayout({ children }: { children: React.ReactNode }) {
  return children
}
