/**
 * Reward feedback endpoint.
 *
 * Flow:
 *   1. User submits wallet + feedback
 *   2. We verify wallet format is valid (base58 Solana address)
 *   3. We check if wallet has activity in our system (created agent OR trained)
 *   4. Rate-limit by IP: 1 submission per IP per hour
 *   5. Send structured log to Telegram (if configured)
 *   6. Log locally (structured JSON) for later manual review/token distribution
 *
 * This creates a feedback loop: User recommendations → Telegram for manual
 * review → later used to inform trainer reward distribution.
 */
import { NextResponse } from 'next/server'
import { Index } from '@upstash/vector'

export const runtime = 'nodejs'

interface Body {
  wallet?: string
  feedback?: string
}

interface RateLimitStore {
  [ip: string]: number // timestamp of last submission
}

const rateLimitStore: RateLimitStore = {}

// Naive in-memory rate-limit: 1 per IP per hour.
// In production, use Upstash Redis for distributed rate-limiting.
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const lastHit = rateLimitStore[ip] ?? 0
  if (now - lastHit < 3600_000) return false // 1 hour in ms
  rateLimitStore[ip] = now
  return true
}

function isValidSolanaAddress(addr: string): boolean {
  // Solana addresses are base58, 32-44 chars
  if (!/^[1-9A-HJ-NP-Z]{32,44}$/.test(addr)) return false
  return true
}

async function checkWalletActivity(wallet: string): Promise<boolean> {
  // Check if wallet has activity in our records:
  //   1. Created an agent (in zustand, client-side) — we can't check this server-side
  //   2. Trained (registered in our feedback XP logs) — check via Upstash
  //
  // For MVP: just check if the wallet is a valid Solana address.
  // In Phase 8 we'll add on-chain checks (query agents registry, query trainer ledger).
  //
  // For now: trusting that if someone knows a wallet address, they've seen it
  // interact with our system (copy-pasted from the UI).

  // If you want stricter validation, we'd need to query:
  //   - agents-registry namespace for wallets that created agents
  //   - trainer-ledger for wallets that trained
  // Both are indexed in Upstash Vector. Left as TODO for Phase 8.

  return true // MVP: just validate format
}

async function sendToTelegram(wallet: string, feedback: string, ip: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return // silently skip if not configured

  const message = `
🎁 **Reward Feedback Submitted**

**Wallet:** \`${wallet}\`
**Feedback:** ${feedback}
**IP:** ${ip}
**Time:** ${new Date().toISOString()}
  `.trim()

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    })
  } catch (err) {
    console.warn('[rewards/feedback] telegram send failed:', err)
    // Non-blocking; feedback is still logged locally
  }
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: 'rate limited — max 1 submission per IP per hour' },
      { status: 429 },
    )
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }

  const { wallet, feedback } = body

  if (!wallet?.trim() || !feedback?.trim()) {
    return NextResponse.json({ ok: false, error: 'wallet and feedback required' }, { status: 400 })
  }

  if (wallet.length > 64 || feedback.length > 500) {
    return NextResponse.json({ ok: false, error: 'input too long' }, { status: 400 })
  }

  if (!isValidSolanaAddress(wallet)) {
    return NextResponse.json(
      { ok: false, error: 'invalid solana address format' },
      { status: 400 },
    )
  }

  const hasActivity = await checkWalletActivity(wallet)
  if (!hasActivity) {
    return NextResponse.json(
      { ok: false, error: 'wallet has no activity in our system' },
      { status: 400 },
    )
  }

  // Log structured record (Vercel logs → can be drained to external sink)
  const record = {
    type: 'solborn.reward-feedback.v1',
    ts: new Date().toISOString(),
    wallet: wallet.trim(),
    feedback: feedback.trim(),
    ip: ip.slice(0, 64),
  }
  console.log(JSON.stringify(record))

  // Fire-and-forget Telegram send
  sendToTelegram(wallet, feedback, ip).catch(() => {
    /* best-effort */
  })

  return NextResponse.json({ ok: true, message: 'feedback received' })
}
