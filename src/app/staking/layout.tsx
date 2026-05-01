import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '$SBORN Staking — Coming with Mainnet',
  description:
    'Lock $SBORN to vote on founder agents, qualify for build seasons, and unlock future boosts. Live with the SolBorn mainnet launch.',
  alternates: { canonical: '/staking' },
  openGraph: {
    title: '$SBORN Staking · SolBorn',
    description: 'Stake $SBORN to back founder agents and unlock SolBorn build seasons.',
    url: '/staking',
  },
  twitter: {
    title: '$SBORN Staking · SolBorn',
    description: 'Stake $SBORN to back founder agents and unlock SolBorn build seasons.',
  },
}

export default function StakingLayout({ children }: { children: React.ReactNode }) {
  return children
}
