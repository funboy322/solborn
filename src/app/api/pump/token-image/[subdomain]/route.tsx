/**
 * 500x500 PNG token image used by pump.fun to render the coin card. Rendered
 * from the mirror so every launched token gets a bespoke card: giant agent
 * emoji, ticker underneath, accent gradient background.
 *
 * pump.fun crawls this URL once and caches the image internally, so we cache
 * aggressively at the edge — a republish that changes emoji or ticker still
 * needs a new mint anyway, existing tokens are frozen at their moment.
 */
import { ImageResponse } from 'next/og'
import { getProductMirror, isRedisConfigured } from '@/lib/redis'
import { STAGE_CONFIG } from '@/lib/constants'

export const runtime = 'nodejs'
export const revalidate = 86400

interface RouteProps {
  params: Promise<{ subdomain: string }>
}

const FALLBACK = new ImageResponse(
  (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        color: '#71717a',
        fontSize: 40,
        fontFamily: 'sans-serif',
      }}
    >
      solborn
    </div>
  ),
  { width: 500, height: 500 },
)

export async function GET(_req: Request, { params }: RouteProps) {
  const { subdomain } = await params

  if (!isRedisConfigured()) return FALLBACK
  const mirror = await getProductMirror(subdomain).catch(() => null)
  if (!mirror) return FALLBACK

  const { agent, project } = mirror
  const accent = STAGE_CONFIG[agent.stage]?.color ?? '#8b5cf6'
  const ticker = project.memecoinBrief?.ticker?.toUpperCase()
  const hex = accent.replace('#', '')
  const rgb = `${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          background: `radial-gradient(circle at 50% 30%, rgba(${rgb}, 0.35) 0%, transparent 65%), linear-gradient(160deg, #0a0a0f 0%, #14101f 60%, #0a0a0f 100%)`,
          color: '#fafafa',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 260,
            marginBottom: 24,
            lineHeight: 1,
          }}
        >
          {agent.emoji}
        </div>
        {ticker && (
          <div
            style={{
              display: 'flex',
              fontSize: 72,
              fontWeight: 900,
              color: accent,
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            ${ticker}
          </div>
        )}
      </div>
    ),
    { width: 500, height: 500 },
  )
}
