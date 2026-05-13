import type { MetadataRoute } from 'next'

/**
 * PWA manifest for SolBorn.
 *
 * Makes the site installable on Android and iOS as a standalone app.
 * Required for two things:
 *   1. Chrome's "Install app" prompt on mobile and desktop
 *   2. Solana dApp Store publishing via the PWA path
 *      (https://docs.solanamobile.com/dapp-publishing/publishing-a-pwa)
 *
 * The TWA (Trusted Web Activity) build that goes on the dApp Store
 * reads this manifest to derive its Android-side identity, so anything
 * that affects branding (name, icons, colors) should be set here.
 *
 * Service worker registration lives in src/components/PWARegister.tsx
 * and src/public/sw.js — both required for Chrome to surface the
 * install prompt.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SolBorn — AI Co-Founder on Solana',
    short_name: 'SolBorn',
    description:
      'Your AI co-founder interviews you, finds your startup idea, and ships it on Solana devnet.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: '#0a0a0f',
    orientation: 'portrait',
    lang: 'en',
    dir: 'ltr',
    categories: ['productivity', 'finance', 'developer'],
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
