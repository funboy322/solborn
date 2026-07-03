/**
 * Per-launch OG card. Rendered from the Redis mirror so every
 * `<slug>.solborn.xyz` unfurls with a bespoke card on X / Telegram / Discord
 * instead of the generic homepage OG.
 *
 * Cached at the edge for 1 hour. That's a compromise: the ticker/name/tagline
 * only change when the owner Republishes, which is rare — but if we cached
 * indefinitely the card would go stale on the first edit. 1h keeps the CDN
 * warm for viral posts, worst-case one hour of drift after a republish.
 */
import { ImageResponse } from 'next/og'
import { getProductMirror, isRedisConfigured } from '@/lib/redis'
import { STAGE_CONFIG } from '@/lib/constants'

export const runtime = 'nodejs'
export const revalidate = 3600

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
      solborn.xyz
    </div>
  ),
  { width: 1200, height: 630 },
)

export async function GET(_req: Request, { params }: RouteProps) {
  const { subdomain } = await params

  if (!isRedisConfigured()) return FALLBACK
  const mirror = await getProductMirror(subdomain).catch(() => null)
  if (!mirror) return FALLBACK

  const { agent, project } = mirror
  const stageConfig = STAGE_CONFIG[agent.stage]
  const accent = stageConfig?.color ?? '#8b5cf6'
  const ticker = project.memecoinBrief?.ticker
    ? `$${project.memecoinBrief.ticker.toUpperCase()}`
    : ''
  const coinName = (project.name ?? subdomain).slice(0, 40)
  const tagline = (project.tagline ?? project.description ?? '').slice(0, 160)
  const domain = `${subdomain}.solborn.xyz`

  // Convert accent hex → RGB for alpha overlays without hardcoding a color map.
  const hex = accent.replace('#', '')
  const rInt = parseInt(hex.slice(0, 2), 16)
  const gInt = parseInt(hex.slice(2, 4), 16)
  const bInt = parseInt(hex.slice(4, 6), 16)
  const rgb = `${rInt}, ${gInt}, ${bInt}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: `radial-gradient(circle at 82% 15%, rgba(${rgb},0.32), transparent 55%), radial-gradient(circle at 12% 88%, rgba(${rgb},0.18), transparent 55%), linear-gradient(135deg, #0a0a0f 0%, #14101f 55%, #0a0a0f 100%)`,
          color: '#fafafa',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Top strip: brand + stage badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
              }}
            >
              ◎
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.2 }}>SolBorn</div>
              <div
                style={{
                  fontSize: 14,
                  color: '#a1a1aa',
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  marginTop: 2,
                  fontWeight: 600,
                }}
              >
                AI memecoin launch
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 18px',
              borderRadius: 999,
              background: `rgba(${rgb}, 0.14)`,
              border: `1px solid rgba(${rgb}, 0.45)`,
            }}
          >
            <span style={{ fontSize: 22 }}>{agent.emoji}</span>
            <span
              style={{
                fontSize: 16,
                color: accent,
                letterSpacing: 2,
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              {agent.stage} agent
            </span>
          </div>
        </div>

        {/* Center: emoji + ticker + coin name + tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 44, marginTop: -32 }}>
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 140,
              background: `rgba(${rgb}, 0.12)`,
              border: `1.5px solid rgba(${rgb}, 0.35)`,
              boxShadow: `0 24px 48px rgba(${rgb}, 0.25)`,
              flexShrink: 0,
            }}
          >
            {agent.emoji}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            {ticker && (
              <div
                style={{
                  fontSize: 88,
                  fontWeight: 900,
                  color: accent,
                  letterSpacing: -3,
                  lineHeight: 1,
                }}
              >
                {ticker}
              </div>
            )}
            <div
              style={{
                fontSize: 40,
                fontWeight: 700,
                color: '#fafafa',
                letterSpacing: -0.8,
                lineHeight: 1.1,
              }}
            >
              {coinName}
            </div>
            {tagline && (
              <div
                style={{
                  fontSize: 24,
                  color: '#d4d4d8',
                  lineHeight: 1.35,
                  fontWeight: 400,
                  maxWidth: 720,
                  marginTop: 4,
                }}
              >
                {tagline}
              </div>
            )}
          </div>
        </div>

        {/* Bottom: domain + pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              fontSize: 28,
              color: '#e4e4e7',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: accent,
                boxShadow: `0 0 12px ${accent}`,
              }}
            />
            {domain}
          </div>
          <div
            style={{
              fontSize: 16,
              color: '#71717a',
              letterSpacing: 3,
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            solborn.xyz
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
