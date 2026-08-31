/**
 * pump.fun-compatible metadata JSON, served from the Redis mirror.
 *
 * pump.fun's create instruction takes a URI that must resolve to a public
 * JSON object shaped like:
 *   { name, symbol, description, image, showName?, twitter?, telegram?, website? }
 *
 * We host that JSON ourselves at solborn.xyz/api/pump/metadata/<slug>. That
 * saves us from touching IPFS/Arweave and keeps everything visible for as
 * long as the domain is up. The token contract stores this URL on-chain, so
 * pump.fun's UI reads name/symbol/image from us at render time.
 */
import { NextResponse } from 'next/server'
import { getProductMirror, isRedisConfigured } from '@/lib/redis'

export const runtime = 'nodejs'
export const revalidate = 3600

interface Props {
  params: Promise<{ subdomain: string }>
}

export async function GET(_req: Request, { params }: Props) {
  const { subdomain } = await params
  if (!isRedisConfigured()) {
    return NextResponse.json({ error: 'redis-not-configured' }, { status: 503 })
  }
  const mirror = await getProductMirror(subdomain).catch(() => null)
  if (!mirror) return NextResponse.json({ error: 'not-found' }, { status: 404 })

  const { project } = mirror
  const ticker = project.memecoinBrief?.ticker?.toUpperCase() ?? project.name.slice(0, 10)
  // Description: prefer the first lore paragraph, fall back to tagline/description.
  const description =
    project.landingContent?.lore?.[0]?.slice(0, 500) ??
    project.tagline ??
    project.description.slice(0, 500)

  const metadata = {
    name: project.name.slice(0, 32),
    symbol: ticker.slice(0, 10),
    description,
    image: `https://solborn.xyz/api/pump/token-image/${subdomain}`,
    showName: true,
    website: `https://${subdomain}.solborn.xyz/`,
    twitter: 'https://x.com/solborn_xyz',
    // createdOn identifies the launchpad in pump.fun's UI. Keeping our
    // domain here makes the "launched via solborn.xyz" attribution stick.
    createdOn: 'https://solborn.xyz',
  }

  return NextResponse.json(metadata, {
    headers: {
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
