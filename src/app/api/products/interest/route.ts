import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface Body {
  productId?: string
  productName?: string
  agentName?: string
  contact?: string
  useCase?: string
  note?: string
  wallet?: string | null
}

const lastHit = new Map<string, number>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const prev = lastHit.get(ip) ?? 0
  if (now - prev < 60_000) return true
  lastHit.set(ip, now)
  return false
}

function trim(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

async function sendToTelegram(payload: {
  productId: string
  productName: string
  agentName: string
  contact: string
  useCase: string
  wallet: string
  ip: string
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.warn('[products/interest] telegram env missing; skipping notify')
    return
  }

  const text = [
    'New SolBorn product access request',
    '',
    `Product: ${payload.productName}`,
    `Agent: ${payload.agentName}`,
    `Contact: ${payload.contact}`,
    payload.wallet ? `Wallet: ${payload.wallet}` : '',
    '',
    `Use case: ${payload.useCase}`,
    '',
    `Product ID: ${payload.productId}`,
    `IP: ${payload.ip}`,
    `Time: ${new Date().toISOString()}`,
  ].filter(Boolean).join('\n')

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    })
    if (!res.ok) {
      console.warn('[products/interest] telegram non-2xx:', res.status, await res.text())
    }
  } catch (error) {
    console.warn('[products/interest] telegram send failed:', error)
  }
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown'

  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: 'Please wait a minute before sending another request.' }, { status: 429 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const productId = trim(body.productId, 80)
  const productName = trim(body.productName, 80)
  const agentName = trim(body.agentName, 60)
  const contact = trim(body.contact, 120)
  const useCase = trim(body.useCase ?? body.note, 700)
  const wallet = trim(body.wallet ?? '', 64)

  if (!productId || !productName || !agentName || !contact) {
    return NextResponse.json({ ok: false, error: 'Contact is required.' }, { status: 400 })
  }

  if (contact.length < 3) {
    return NextResponse.json({ ok: false, error: 'Please add a valid contact.' }, { status: 400 })
  }

  if (useCase.length < 20) {
    return NextResponse.json({ ok: false, error: 'Please tell us how you would use the product.' }, { status: 400 })
  }

  const record = {
    type: 'solborn.product_interest.v1',
    ts: new Date().toISOString(),
    productId,
    productName,
    agentName,
    contact,
    useCase,
    wallet,
    ip: ip.slice(0, 64),
  }

  console.log(JSON.stringify(record))
  sendToTelegram(record).catch(() => {})

  return NextResponse.json({
    ok: true,
    message: 'Beta request received. The founder will review it manually and reach out if there is a fit.',
  })
}
