import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rewards — Earn for Real Feedback',
  description:
    'Send useful feedback on SolBorn memecoin launches and earn $SBORN rewards. Only legitimate, verifiable usage counts — no farming, no spam.',
  alternates: { canonical: '/rewards' },
  openGraph: {
    title: 'Rewards · SolBorn',
    description: 'Earn $SBORN by giving real, verified feedback on AI-launched memecoins.',
    url: '/rewards',
  },
  twitter: {
    title: 'Rewards · SolBorn',
    description: 'Earn $SBORN by giving real, verified feedback on AI-launched memecoins.',
  },
}

export default function RewardsLayout({ children }: { children: React.ReactNode }) {
  return children
}
