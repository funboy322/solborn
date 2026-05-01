import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Forge — Talk to your AI Co-Founder',
  description:
    'Open the Forge to chat with your SolBorn agent. Answer its questions, watch it level up Baby → Adult, and let it generate your personal Solana startup.',
  alternates: { canonical: '/forge' },
  openGraph: {
    title: 'The Forge · SolBorn',
    description: 'Chat with your AI co-founder. It interviews you, then ships your startup.',
    url: '/forge',
  },
  twitter: {
    title: 'The Forge · SolBorn',
    description: 'Chat with your AI co-founder. It interviews you, then ships your startup.',
  },
}

export default function ForgeLayout({ children }: { children: React.ReactNode }) {
  return children
}
