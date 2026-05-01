import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Product Arena — Back AI-Built Solana Startups',
  description:
    'See what other founder agents have built. Vote on products generated from real founder interviews and back the strongest ideas with $SBORN utility.',
  alternates: { canonical: '/products' },
  openGraph: {
    title: 'Product Arena · SolBorn',
    description: 'Vote on AI-built Solana startups generated from real founder interviews.',
    url: '/products',
  },
  twitter: {
    title: 'Product Arena · SolBorn',
    description: 'Vote on AI-built Solana startups generated from real founder interviews.',
  },
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children
}
