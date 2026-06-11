/**
 * Subdomain → public mirror routing.
 *
 * When a request arrives on something other than the canonical apex/www,
 * we rewrite to /p/<subdomain> so a single Next.js page handles every
 * tenant URL. The user keeps seeing harmonia.solborn.xyz in their bar;
 * server logic just inspects the host header and forwards internally.
 *
 * What pass-through means here: the request reaches the normal route
 * tree. We use it for the canonical hosts (solborn.xyz, www.solborn.xyz,
 * and vercel-internal preview domains) plus reserved slugs that must
 * never collide with a tenant.
 *
 * Edge runtime so the host inspection is cheap on every request — we
 * don't import the Redis client here, just the small validateSubdomain
 * helper, to keep the bundle small.
 */

import { NextRequest, NextResponse } from 'next/server'

// Apex + canonical front-door names that must always reach the main app.
const CANONICAL_HOSTS = new Set(['solborn.xyz', 'www.solborn.xyz'])

// Subdomains that own a route in the main app or that we never want a tenant
// to take. Mirrors RESERVED_SUBDOMAINS in src/lib/redis.ts.
const RESERVED_SLUGS = new Set([
  'www',
  'api',
  'app',
  'admin',
  'mail',
  'ftp',
  'blog',
  'dev',
  'staging',
  'preview',
  'docs',
  'help',
  'status',
  'cdn',
  'assets',
  'static',
  'p',
  'products',
  'forge',
  'staking',
  'rewards',
  'privacy',
  'demo',
  'me',
  'you',
  'solborn',
])

const SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/

function extractSubdomain(host: string | null): string | null {
  if (!host) return null
  // Strip the port if present (development on localhost:3000 etc.).
  const cleanHost = host.split(':')[0].toLowerCase()

  if (CANONICAL_HOSTS.has(cleanHost)) return null

  // Local dev: skip everything that isn't an actual SolBorn host.
  if (cleanHost === 'localhost' || cleanHost.endsWith('.localhost')) return null

  // Vercel preview deployments use *.vercel.app — keep them on the main app
  // so we can still browse a preview without configuring per-subdomain DNS.
  if (cleanHost.endsWith('.vercel.app')) return null

  // Anything else under solborn.xyz: strip the apex and treat the leading
  // label as the tenant slug. Multi-level tenants aren't supported in v1.
  if (!cleanHost.endsWith('.solborn.xyz')) return null
  const head = cleanHost.slice(0, -'.solborn.xyz'.length)
  if (head.includes('.')) return null
  if (RESERVED_SLUGS.has(head)) return null
  if (!SUBDOMAIN_RE.test(head)) return null

  return head
}

export function middleware(req: NextRequest) {
  const subdomain = extractSubdomain(req.headers.get('host'))
  if (!subdomain) return NextResponse.next()

  // Already on the internal route — avoid the rewrite loop.
  if (req.nextUrl.pathname.startsWith(`/p/${subdomain}`)) return NextResponse.next()

  // Tenant lives at /p/<subdomain>. Preserve the rest of the original path
  // so future deep links (/p/harmonia/about) keep working when we add them.
  const url = req.nextUrl.clone()
  const trailing = req.nextUrl.pathname === '/' ? '' : req.nextUrl.pathname
  url.pathname = `/p/${subdomain}${trailing}`
  return NextResponse.rewrite(url)
}

/**
 * Run middleware on page navigation only. Static assets, API routes, the
 * Next image optimiser and the favicon stream don't need the host check
 * and we don't want to pay the cost on every chunk request.
 */
export const config = {
  matcher: [
    '/((?!api/|_next/|favicon\\.ico|logo\\.png|icon\\.png|apple-icon\\.png|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|sw\\.js|\\.well-known/).*)',
  ],
}
