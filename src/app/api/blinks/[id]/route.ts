/**
 * Solana Action (Blink) endpoint for SolBorn agents.
 *
 * Flow (Variant A — stateless, like /api/nft-metadata):
 *   - Agent state is snapshotted into query params at deploy time by the client
 *     (name, description, recipient wallet, cta, amounts).
 *   - GET  → Solana Actions metadata JSON (renders in dial.to)
 *   - POST → builds an unsigned Solana transfer + memo tx, returns base64.
 *     The user's wallet (via Blink client) signs + sends.
 *
 * Spec: https://solana.com/docs/advanced/actions
 * Test: https://dial.to/?action=solana-action:https://<host>/api/blinks/<id>?to=...
 *
 * CORS is open — required by Blink clients (dial.to, Phantom).
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RPC = process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.devnet.solana.com'
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

// Default fallback recipient if `to` is missing — SolBorn treasury (devnet).
// In practice the creator wallet is always passed in the URL.
const FALLBACK_RECIPIENT = 'F7QRP4aack2aYgRJa1Khxb7MmMtA1wEHRtP7Wex98BoL'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, Content-Encoding, Accept-Encoding',
  'Access-Control-Expose-Headers': 'X-Action-Version, X-Blockchain-Ids',
  'X-Action-Version': '2.4',
  'X-Blockchain-Ids': 'solana:devnet',
  'Content-Type': 'application/json',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

interface RouteCtx {
  params: Promise<{ id: string }>
}

function readParams(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const name = (q.get('name') ?? 'SolBorn Agent').slice(0, 60)
  const title = (q.get('title') ?? `Support ${name}`).slice(0, 60)
  const description = (
    q.get('desc') ?? `Tip ${name}, an AI founder raised on SolBorn.`
  ).slice(0, 280)
  const cta = (q.get('cta') ?? `Tip ${name}`).slice(0, 40)
  const to = q.get('to') ?? FALLBACK_RECIPIENT

  // amounts comma-separated: "0.01,0.05,0.1"
  const amountsRaw = q.get('amounts') ?? '0.01,0.05,0.1'
  const amounts = amountsRaw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0 && n < 100)
    .slice(0, 4)

  return { name, title, description, cta, to, amounts }
}

function iconUrl(req: NextRequest): string {
  return `${req.nextUrl.origin}/logo.png`
}

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params
  const p = readParams(req)

  // Preserve query string for action hrefs so each button carries context forward.
  const self = `${req.nextUrl.pathname}${req.nextUrl.search || ''}`
  const withAmount = (sol: number) => {
    const base = new URL(self, req.nextUrl.origin)
    base.searchParams.set('amount', String(sol))
    return base.pathname + base.search
  }
  const withCustom = () => {
    const base = new URL(self, req.nextUrl.origin)
    base.searchParams.set('amount', '{amount}')
    return base.pathname + base.search
  }

  const body = {
    type: 'action',
    icon: iconUrl(req),
    label: p.cta,
    title: p.title,
    description: `${p.description}\n\nAgent ID: ${id.slice(0, 8)} · Solana devnet`,
    links: {
      actions: [
        ...p.amounts.map((sol) => ({
          type: 'transaction',
          label: `${sol} SOL`,
          href: withAmount(sol),
        })),
        {
          type: 'transaction',
          label: 'Custom',
          href: withCustom(),
          parameters: [
            {
              name: 'amount',
              label: 'SOL amount',
              required: true,
              type: 'number',
            },
          ],
        },
      ],
    },
  }

  return new NextResponse(JSON.stringify(body), { status: 200, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params
  const p = readParams(req)
  const amountStr = req.nextUrl.searchParams.get('amount') ?? '0.01'
  const amount = Number(amountStr)
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400, headers: CORS_HEADERS })
  }

  let payer: PublicKey
  try {
    const body = (await req.json()) as { account?: string }
    if (!body.account) throw new Error('account missing')
    payer = new PublicKey(body.account)
  } catch {
    return NextResponse.json(
      { error: 'Invalid or missing account' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  let recipient: PublicKey
  try {
    recipient = new PublicKey(p.to)
  } catch {
    return NextResponse.json(
      { error: 'Invalid recipient wallet' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const connection = new Connection(RPC, 'confirmed')
  const { blockhash } = await connection.getLatestBlockhash('confirmed')

  const tx = new Transaction({ feePayer: payer, recentBlockhash: blockhash })

  tx.add(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: recipient,
      lamports: Math.round(amount * LAMPORTS_PER_SOL),
    }),
  )

  // Memo so the tip is attributable on-chain to this agent.
  const memo = JSON.stringify({
    protocol: 'SolBorn Blink v1',
    agentId: id,
    agent: p.name,
    amount,
    ts: Date.now(),
  })
  tx.add(
    new TransactionInstruction({
      keys: [{ pubkey: payer, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memo, 'utf-8'),
    }),
  )

  const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false })
  const base64 = Buffer.from(serialized).toString('base64')

  return new NextResponse(
    JSON.stringify({
      type: 'transaction',
      transaction: base64,
      message: `Tipping ${amount} SOL to ${p.name} — thanks for supporting a SolBorn founder ✨`,
    }),
    { status: 200, headers: CORS_HEADERS },
  )
}
