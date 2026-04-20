/**
 * Reward nomination endpoint — simplified.
 * No external API checks. Just validates fields are filled, sends to Telegram.
 */
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface Body {
  wallet?: string
  twitter?: string
  tweetUrl?: string
  github?: string
  feedback?: string
}

async function sendToTelegram(payload: {
  wallet: string
  twitter: string
  tweetUrl: string
  github: string
  feedback: string
  ip: string
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.warn('[rewards/feedback] telegram env missing; skipping notify')
    return
  }

  const text = [
    '🎁 *New Reward Nomination*',
    '',
    `💰 *Wallet:* \`${payload.wallet}\``,
    `🐦 *Twitter:* [@${payload.twitter}](https://x.com/${payload.twitter})`,
    `📝 *Tweet:* ${payload.tweetUrl}`,
    `⭐ *GitHub:* [@${payload.github}](https://github.com/${payload.github})`,
    '',
    `💬 *Feedback:*`,
    payload.feedback,
    '',
    `🌐 IP: \`${payload.ip}\``,
    `⏰ ${new Date().toISOString()}`,
  ].join('\n')

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.warn('[rewards/feedback] telegram non-2xx:', res.status, body)
    }
  } catch (err) {
    console.warn('[rewards/feedback] telegram send failed:', err)
  }
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown'

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const wallet = body.wallet?.trim() ?? ''
  const twitter = body.twitter?.trim().replace(/^@/, '') ?? ''
  const tweetUrl = body.tweetUrl?.trim() ?? ''
  const github = body.github?.trim().replace(/^@/, '') ?? ''
  const feedback = body.feedback?.trim() ?? ''

  if (!wallet || !twitter || !tweetUrl || !github || !feedback) {
    return NextResponse.json({ ok: false, error: 'All fields are required.' }, { status: 400 })
  }

  if (feedback.length < 30) {
    return NextResponse.json({ ok: false, error: 'Feedback must be at least 30 characters.' }, { status: 400 })
  }

  console.log(JSON.stringify({
    type: 'solborn.nomination.v1',
    ts: new Date().toISOString(),
    wallet, twitter, tweetUrl, github, feedback,
    ip: ip.slice(0, 64),
  }))

  sendToTelegram({ wallet, twitter, tweetUrl, github, feedback, ip }).catch(() => {})

  return NextResponse.json({ ok: true, message: 'Nomination received! We review each one manually within 48h.' })
}
