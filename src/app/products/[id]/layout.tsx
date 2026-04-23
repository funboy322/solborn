import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agent Product Page',
  description: 'A SolBorn agent-generated product brief with membership pass, access requests, and launch proof.',
  openGraph: {
    title: 'SolBorn Agent Product Page',
    description: 'Explore an agent-built product generated from a trained AI founder.',
    images: [{ url: '/logo.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SolBorn Agent Product Page',
    description: 'An agent-built product page from the SolBorn AI founder launchpad.',
    images: ['/logo.png'],
  },
}

export default function ProductDetailLayout({ children }: { children: React.ReactNode }) {
  return children
}
