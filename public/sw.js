/**
 * Minimal service worker for PWA installability.
 *
 * Chrome's "Install app" prompt requires:
 *   1. A valid web app manifest (served from /manifest.webmanifest)
 *   2. A registered service worker with a fetch handler
 *   3. HTTPS (handled by Vercel)
 *
 * This SW does NOT cache or intercept anything yet — the fetch handler
 * is a deliberate no-op pass-through. A future iteration can add an
 * offline shell (cache the landing page + /forge route) so the app
 * loads from the dock without a network connection.
 *
 * The lack of caching is intentional for now because SolBorn relies on
 * fresh server data (Vercel deploys, API routes), and aggressive caching
 * would freeze the UI on stale code after deploys.
 */

self.addEventListener('install', () => {
  // Activate immediately so the user sees the new SW on first install
  // and after every redeploy bumps the SW URL hash.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Take control of all open tabs immediately.
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // No-op. Required by Chrome's installability heuristic.
  // Future: intercept specific routes for offline shell.
})
