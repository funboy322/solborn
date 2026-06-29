import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hold $SBORN — Unlock SolBorn perks',
  description:
    'Hold 1M $SBORN in your wallet to unlock featured placement on /discover and a holder badge on every memecoin you launch. No lock, no staking — just hold.',
  alternates: { canonical: '/staking' },
  openGraph: {
    title: 'Hold $SBORN · SolBorn',
    description: 'Hold $SBORN to unlock featured placement and holder badges across SolBorn.',
    url: '/staking',
  },
  twitter: {
    title: 'Hold $SBORN · SolBorn',
    description: 'Hold $SBORN to unlock featured placement and holder badges across SolBorn.',
  },
}

export default function StakingLayout({ children }: { children: React.ReactNode }) {
  return children
}
