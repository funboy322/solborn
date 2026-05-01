/**
 * Serves Metaplex-format JSON for SolBorn cNFTs.
 * The bubblegum mint bakes current agent state into query params at mint time,
 * so every stage evolution produces a new cNFT with its own snapshot metadata.
 *
 * Query params (set by src/lib/solana/bubblegum.ts):
 *   id, n (name), s (stage), p (personality), xp, i (interactions),
 *   c, sk, cd, cr, fm (skill values)
 */
import { NextRequest } from 'next/server'
import { STAGE_CONFIG } from '@/lib/constants'
import type { AgentStage } from '@/lib/types'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function num(v: string | null, d = 0): number {
  const n = Number(v ?? d)
  return Number.isFinite(n) ? n : d
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const id = q.get('id') ?? 'unknown'
  const name = (q.get('n') ?? 'Agent').slice(0, 40)
  const stageRaw = (q.get('s') ?? 'baby') as AgentStage
  const stage: AgentStage = (stageRaw in STAGE_CONFIG ? stageRaw : 'baby') as AgentStage
  const personality = (q.get('p') ?? 'curious').slice(0, 40)
  const xp = num(q.get('xp'))
  const interactions = num(q.get('i'))
  const curiosity = num(q.get('c'))
  const solanaKnowledge = num(q.get('sk'))
  const codingSkill = num(q.get('cd'))
  const creativity = num(q.get('cr'))
  const founderMindset = num(q.get('fm'))

  const cfg = STAGE_CONFIG[stage]
  const origin = req.nextUrl.origin
  // Dynamic stage-specific artwork generated on-demand. Each agent gets a
  // unique poster with their emoji, name, and XP — distinct in Phantom / ME.
  const image = `${origin}/api/nft-metadata/og?${q.toString()}`

  const body = {
    name: `${name} #${id.slice(0, 4).toUpperCase()}`,
    symbol: 'SOLBORN',
    description: `${cfg.label} raised on SolBorn — ${cfg.description}`,
    image,
    external_url: `${origin}/forge/${id}`,
    attributes: [
      { trait_type: 'Stage', value: cfg.label },
      { trait_type: 'Personality', value: personality },
      { trait_type: 'XP', value: xp },
      { trait_type: 'Interactions', value: interactions },
      { trait_type: 'Curiosity', value: curiosity },
      { trait_type: 'Solana Knowledge', value: solanaKnowledge },
      { trait_type: 'Coding Skill', value: codingSkill },
      { trait_type: 'Creativity', value: creativity },
      { trait_type: 'Founder Mindset', value: founderMindset },
    ],
    properties: {
      category: 'image',
      files: [{ uri: image, type: 'image/png' }],
    },
  }

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, s-maxage=60',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
