/**
 * Dynamic NFT artwork generator. Returns a 1024×1024 PNG with the agent's
 * stage emoji, name, personality, and XP rendered as a poster-style card.
 *
 * Used as the `image` URI inside Metaplex Core NFT metadata so each Passport
 * has its own visual identity in Phantom / Magic Eden, not just the SolBorn
 * logo for everyone.
 *
 * Query params (passed by buildMetadataUri in core-mint.ts):
 *   id, n (name), s (stage), p (personality), xp, i (interactions), c, sk, cd, cr, fm
 */
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

type StageKey = 'baby' | 'toddler' | 'teen' | 'adult'

const STAGE_META: Record<StageKey, { emoji: string; label: string; color: string; gradient: string }> = {
  baby: {
    emoji: '👶',
    label: 'Baby Founder',
    color: '#a78bfa',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #1e1b4b 100%)',
  },
  toddler: {
    emoji: '🧒',
    label: 'Toddler Founder',
    color: '#34d399',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #064e3b 100%)',
  },
  teen: {
    emoji: '🧑‍💻',
    label: 'Teen Founder',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #451a03 100%)',
  },
  adult: {
    emoji: '🚀',
    label: 'Adult Founder',
    color: '#f43f5e',
    gradient: 'linear-gradient(135deg, #500724 0%, #881337 50%, #500724 100%)',
  },
}

function num(v: string | null, d = 0): number {
  const n = Number(v ?? d)
  return Number.isFinite(n) ? n : d
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const id = q.get('id') ?? 'unknown'
  const name = (q.get('n') ?? 'Agent').slice(0, 24)
  const stageRaw = (q.get('s') ?? 'baby') as StageKey
  const stage: StageKey = (stageRaw in STAGE_META ? stageRaw : 'baby') as StageKey
  const personality = (q.get('p') ?? 'curious').slice(0, 32)
  const xp = num(q.get('xp'))
  const kind = q.get('kind') === 'launch' ? 'launch' : 'passport'
  const projectName = (q.get('proj') ?? '').slice(0, 28)

  // For launch certificates, use Adult color theme + 🚀 emoji and overlay
  // the project name as the primary subject. Passport uses agent stage.
  const meta = kind === 'launch' ? STAGE_META.adult : STAGE_META[stage]
  const shortId = id.slice(0, 4).toUpperCase()
  const headline = kind === 'launch' && projectName ? projectName : name
  const sublabel = kind === 'launch' ? `Launch Certificate · ${name}` : meta.label
  const emoji = kind === 'launch' ? '🚀' : meta.emoji
  const brandLabel = kind === 'launch' ? 'SOLBORN · LAUNCH CERT' : 'SOLBORN'

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
          background: meta.gradient,
          fontFamily: 'system-ui, sans-serif',
          color: '#fff',
          padding: 64,
          position: 'relative',
        }}
      >
        {/* Top-left brand */}
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 56,
            display: 'flex',
            alignItems: 'center',
            fontSize: 22,
            color: 'rgba(255,255,255,0.55)',
            fontWeight: 600,
            letterSpacing: 4,
          }}
        >
          {brandLabel}
        </div>

        {/* Top-right id chip */}
        <div
          style={{
            position: 'absolute',
            top: 48,
            right: 56,
            display: 'flex',
            alignItems: 'center',
            fontSize: 20,
            color: 'rgba(255,255,255,0.55)',
            fontFamily: 'monospace',
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid rgba(255,255,255,0.14)`,
            padding: '8px 16px',
            borderRadius: 9999,
          }}
        >
          #{shortId}
        </div>

        {/* Glow ring + emoji */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${meta.color}40, transparent 70%)`,
            border: `2px solid ${meta.color}aa`,
            boxShadow: `0 0 80px ${meta.color}80, inset 0 0 60px ${meta.color}30`,
            marginBottom: 36,
            fontSize: 220,
          }}
        >
          {emoji}
        </div>

        {/* Headline (project name for launch, agent name for passport) */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: -2,
            display: 'flex',
            marginBottom: 12,
            textShadow: `0 4px 20px ${meta.color}60`,
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          {headline}
        </div>

        {/* Sublabel */}
        <div
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: meta.color,
            display: 'flex',
            marginBottom: 8,
            letterSpacing: 1,
            textAlign: 'center',
          }}
        >
          {sublabel}
        </div>

        {/* Personality */}
        <div
          style={{
            fontSize: 22,
            color: 'rgba(255,255,255,0.55)',
            display: 'flex',
            marginBottom: 36,
            fontStyle: 'italic',
          }}
        >
          {personality}
        </div>

        {/* XP pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 22,
            fontWeight: 700,
            background: 'rgba(0,0,0,0.4)',
            border: `1px solid ${meta.color}80`,
            padding: '14px 28px',
            borderRadius: 9999,
            fontFamily: 'monospace',
          }}
        >
          {xp.toLocaleString()} XP
        </div>

        {/* Bottom mark */}
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            display: 'flex',
            fontSize: 18,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: 2,
          }}
        >
          solborn.xyz · devnet
        </div>
      </div>
    ),
    {
      width: 1024,
      height: 1024,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=600',
      },
    },
  )
}
