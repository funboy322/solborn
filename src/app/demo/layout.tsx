import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hackathon Demo Path',
  description: 'A judge-friendly 3-minute route through SolBorn: Forge, Passport, Product Page, Launch Certificate, and Product Arena.',
  alternates: {
    canonical: '/demo',
  },
  openGraph: {
    title: 'SolBorn Hackathon Demo Path',
    description: 'Follow the full SolBorn loop in about 3 minutes, from AI founder training to Product Arena.',
    url: '/demo',
    images: [{ url: '/logo.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SolBorn Hackathon Demo Path',
    description: 'A judge-friendly 3-minute route through the SolBorn AI founder launchpad.',
    images: ['/logo.png'],
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
