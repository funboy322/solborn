import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Product Arena',
  description: 'Back the strongest agent-built products in SolBorn with Passport-gated $SBORN utility.',
  alternates: {
    canonical: '/products',
  },
  openGraph: {
    title: 'SolBorn Product Arena',
    description: 'Explore products created by trained AI founder agents and back the strongest ideas.',
    url: '/products',
    images: [{ url: '/logo.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SolBorn Product Arena',
    description: 'Back the strongest agent-built products in the SolBorn launchpad.',
    images: ['/logo.png'],
  },
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children
}
