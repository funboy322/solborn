import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Demo Path — A 3-Minute Walkthrough',
  description:
    'See SolBorn end-to-end in three minutes: chat with the AI agent about your meme, watch it write the lore, the landing page, and a 7-tweet launch thread.',
  alternates: { canonical: '/demo' },
  openGraph: {
    title: 'Demo Path · SolBorn',
    description: '3-minute walkthrough of the SolBorn memecoin launch loop on Solana.',
    url: '/demo',
  },
  twitter: {
    title: 'Demo Path · SolBorn',
    description: '3-minute walkthrough of the SolBorn memecoin launch loop on Solana.',
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
