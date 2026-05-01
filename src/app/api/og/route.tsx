/**
 * Social-share OG image for the SolBorn landing page (and any sub-page that
 * doesn't override its own openGraph.images). 1200x630 PNG matching Twitter/X
 * summary_large_image card spec and Discord/Telegram/Slack unfurls.
 *
 * Why generated, not static: the headline + accent stage emojis can be tuned
 * without re-exporting an asset, and Vercel caches the response on the CDN
 * so cost/latency is the same as a static file after first render.
 */
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-static'

const STAGE_DOTS: { emoji: string; color: string }[] = [
  { emoji: '👶', color: '#a78bfa' },
  { emoji: '🧒', color: '#34d399' },
  { emoji: '🧑‍💻', color: '#f59e0b' },
  { emoji: '🚀', color: '#f43f5e' },
]

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const headline = (q.get('t') ?? 'Your Solana startup, found in 5 minutes of chat.').slice(0, 96)
  const subline = (
    q.get('s') ?? 'AI co-founder interviews you. Mints a Passport NFT. Ships a Launch Certificate on devnet.'
  ).slice(0, 140)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background:
            'radial-gradient(circle at 18% 12%, rgba(139,92,246,0.35), transparent 55%), radial-gradient(circle at 82% 88%, rgba(244,63,94,0.22), transparent 50%), linear-gradient(135deg, #0a0a0f 0%, #1a0e2e 60%, #0a0a0f 100%)',
          color: '#fafafa',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Top row: brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #3b0764 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              boxShadow: '0 8px 24px rgba(124,58,237,0.45)',
            }}
          >
            ◎
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.3 }}>SolBorn</div>
            <div style={{ fontSize: 18, color: '#a78bfa', letterSpacing: 4, textTransform: 'uppercase', marginTop: 2 }}>
              AI co-founder · Solana
            </div>
          </div>
        </div>

        {/* Headline + subline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 980,
            }}
          >
            {headline}
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#d4d4d8',
              lineHeight: 1.35,
              maxWidth: 940,
              fontWeight: 400,
            }}
          >
            {subline}
          </div>
        </div>

        {/* Bottom: stages strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            {STAGE_DOTS.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${s.color}40`,
                  fontSize: 22,
                }}
              >
                <span style={{ fontSize: 22 }}>{s.emoji}</span>
                <span style={{ color: s.color, fontSize: 18, fontWeight: 600, letterSpacing: 0.5 }}>
                  {['BABY', 'TODDLER', 'TEEN', 'ADULT'][i]}
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 22, color: '#71717a', fontFamily: 'monospace' }}>solborn.xyz</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
