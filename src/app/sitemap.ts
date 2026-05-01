import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://solborn.xyz'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/forge', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/products', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/demo', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/staking', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/rewards', priority: 0.6, changeFrequency: 'monthly' as const },
  ]

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
