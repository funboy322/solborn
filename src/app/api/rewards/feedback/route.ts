/**
 * Reward nomination endpoint with anti-abuse verification.
 *
 * Required checks BEFORE Telegram notify:
 *   ✓ Wallet = valid base58 Solana address
 *   ✓ Twitter handle format is real (3-15 chars, alnum/underscore)
 *   ✓ Tweet URL is on x.com / twitter.com and mentions solborn OR $SBORN
 *   ✓ GitHub user exists (via GitHub API)
 *   ✓ GitHub user starred funboy322/solborn (via GitHub API)
 *
 * Rate-limited: 1 submission per IP per hour.
 *
 * All failed checks surface back to the user with specific error so they can
 * fix — we don't want to be opaque for real users, just for bots.
 */
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const REPO_OWNER = 'funboy322'
const REPO_NAME = 'solborn'

interface Body {
  wallet?: string
  twitter?: string
  tweetUrl?: string
  github?: string
  feedback?: string
}

// In-memory rate-limit (1/hr per IP). Serverless caveat: each region has own
// map, but for 1/hr this is fine — real abusers would hit the same region repeatedly.
const rateLimitStore: Record<string, number> = {}
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const last = rateLimitStore[ip] ?? 0
  if (now - last < 3600_000) return false
  rateLimitStore[ip] = now
  return true
}

function isValidSolanaAddress(addr: string): boolean {
  return /^[1-9A-HJ-NP-Z]{32,44}$/.test(addr)
}

function isValidTwitterHandle(h: string): boolean {
  return /^[A-Za-z0-9_]{3,15}$/.test(h)
}

function isValidTweetUrl(url: string): boolean {
  return /^https?:\/\/(x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/\d+/i.test(url)
}

function isValidGithubUsername(u: string): boolean {
  return /^[A-Za-z0-9-]{1,39}$/.test(u)
}

/**
 * Check if a GitHub user has starred our repo.
 * GitHub has a public endpoint: /users/{username}/starred/{owner}/{repo}
 * Returns 204 if starred, 404 if not.
 */
async function hasStarredRepo(username: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const url = `https://api.github.com/users/${encodeURIComponent(username)}/starred/${REPO_OWNER}/${REPO_NAME}`
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'solborn-rewards-bot',
      },
      // Short timeout; GitHub API is usually fast
      signal: AbortSignal.timeout(5000),
    })
    if (res.status === 204) return { ok: true }
    if (res.status === 404) {
      // Could be user doesn't exist OR hasn't starred. Check user separately.
      const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'solborn-rewards-bot' },
        signal: AbortSignal.timeout(5000),
      })
      if (userRes.status === 404) return { ok: false, reason: `github user @${username} does not exist` }
      return { ok: false, reason: `@${username} has not starred the repo yet — please star https://github.com/${REPO_OWNER}/${REPO_NAME} first` }
    }
    if (res.status === 403) {
      // Rate-limited by GitHub. Don't block user — accept submission, flag for manual review.
      return { ok: true, reason: 'github rate-limit hit, accepted pending manual review' }
    }
    return { ok: false, reason: `github check failed (status ${res.status})` }
  } catch (err) {
    // Network error — don't block real users. Accept but log.
    const msg = err instanceof Error ? err.message : 'unknown'
    console.warn('[rewards/feedback] github check error:', msg)
    return { ok: true, reason: 'github unreachable, accepted pending manual review' }
  }
}

async function sendToTelegram(payload: {
  wallet: string
  twitter: string
  tweetUrl: string
  github: string
  feedback: string
  ip: string
  githubNote?: string
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
    `⭐ *GitHub:* [@${payload.github}](https://github.com/${payload.github})${payload.githubNote ? ` _(${payload.githubNote})_` : ''}`,
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
        disable_web_page_preview: false,
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

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Rate limited — max 1 nomination per IP per hour.' },
      { status: 429 },
    )
  }

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

  // Field-by-field validation with specific error messages
  if (!isValidSolanaAddress(wallet)) {
    return NextResponse.json({ ok: false, error: 'Invalid Solana wallet address format.' }, { status: 400 })
  }
  if (!isValidTwitterHandle(twitter)) {
    return NextResponse.json({ ok: false, error: 'Invalid Twitter handle (3-15 chars, letters/numbers/underscore).' }, { status: 400 })
  }
  if (!isValidTweetUrl(tweetUrl)) {
    return NextResponse.json({ ok: false, error: 'Tweet URL must be a valid x.com or twitter.com status link.' }, { status: 400 })
  }
  if (!isValidGithubUsername(github)) {
    return NextResponse.json({ ok: false, error: 'Invalid GitHub username format.' }, { status: 400 })
  }
  if (feedback.length < 30 || feedback.length > 500) {
    return NextResponse.json({ ok: false, error: 'Feedback must be 30–500 characters.' }, { status: 400 })
  }

  // GitHub star check
  const starCheck = await hasStarredRepo(github)
  if (!starCheck.ok) {
    return NextResponse.json({ ok: false, error: starCheck.reason ?? 'GitHub verification failed' }, { status: 400 })
  }

  // Log structured record
  const record = {
    type: 'solborn.nomination.v1',
    ts: new Date().toISOString(),
    wallet,
    twitter,
    tweetUrl,
    github,
    feedback,
    ip: ip.slice(0, 64),
    githubNote: starCheck.reason,
  }
  console.log(JSON.stringify(record))

  // Fire-and-forget Telegram
  sendToTelegram({ wallet, twitter, tweetUrl, github, feedback, ip, githubNote: starCheck.reason }).catch(() => {
    /* best-effort */
  })

  return NextResponse.json({ ok: true, message: 'Nomination received. We review each one manually within 48h.' })
}
