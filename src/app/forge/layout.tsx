import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Forge — Launch your memecoin',
  description:
    'Open the Forge to chat with your SolBorn agent. Answer its questions about your meme, watch it shape the lore, then ship a landing page and a 7-tweet launch thread.',
  alternates: { canonical: '/forge' },
  openGraph: {
    title: 'The Forge · SolBorn',
    description: 'Chat with the agent. Ship a memecoin: lore, landing page, launch thread.',
    url: '/forge',
  },
  twitter: {
    title: 'The Forge · SolBorn',
    description: 'Chat with the agent. Ship a memecoin: lore, landing page, launch thread.',
  },
}

export default function ForgeLayout({ children }: { children: React.ReactNode }) {
  return children
}
