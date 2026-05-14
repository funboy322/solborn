/**
 * Solana dApp Store banner image.
 *
 * Exact 1200x600 dimensions per dApp Store submission requirements
 * (https://docs.solanamobile.com/dapp-publishing/prepare). Used as the
 * featured graphic on the SolBorn listing — should read at a glance,
 * less copy than the social-share OG card at /api/og.
 *
 * Pull the asset once before a dApp Store submission:
 *   curl https://solborn.xyz/api/og/banner -o dapp-store/assets/banner.png
 */
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const dynamic = 'force-static'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 96px',
          background:
            'radial-gradient(circle at 14% 32%, rgba(139,92,246,0.40), transparent 50%), radial-gradient(circle at 86% 76%, rgba(244,63,94,0.28), transparent 50%), linear-gradient(135deg, #0a0a0f 0%, #1a0e2e 60%, #0a0a0f 100%)',
          color: '#fafafa',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Left: brand + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 700 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                letterSpacing: -2,
                lineHeight: 1,
                color: '#fafafa',
                display: 'flex',
              }}
            >
              SolBorn
            </div>
            <div
              style={{
                fontSize: 18,
                color: '#a78bfa',
                letterSpacing: 4,
                textTransform: 'uppercase',
                marginTop: 10,
                fontWeight: 600,
                display: 'flex',
              }}
            >
              AI co-founder · Solana
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{
                fontSize: 40,
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: -0.8,
                color: '#fafafa',
                display: 'flex',
              }}
            >
              The agent interviews you.
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: -0.8,
                color: '#fafafa',
                display: 'flex',
              }}
            >
              Then ships your startup on-chain.
            </div>
          </div>

          <div
            style={{
              fontSize: 20,
              color: '#d4d4d8',
              lineHeight: 1.4,
              fontWeight: 400,
              display: 'flex',
            }}
          >
            Passport NFT · Product brief · Launch Certificate
          </div>
        </div>

        {/* Right: stage journey */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
          }}
        >
          {[
            { emoji: '👶', color: '#a78bfa', label: 'Baby' },
            { emoji: '🧒', color: '#34d399', label: 'Toddler' },
            { emoji: '🧑‍💻', color: '#f59e0b', label: 'Teen' },
            { emoji: '🚀', color: '#f43f5e', label: 'Adult' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 22px',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${s.color}55`,
                minWidth: 220,
              }}
            >
              <span style={{ fontSize: 32 }}>{s.emoji}</span>
              <span
                style={{
                  color: s.color,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 600,
    },
  )
}
