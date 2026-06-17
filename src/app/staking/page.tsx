'use client'

/**
 * /staking — Hold $SBORN to unlock perks.
 *
 * Pivot from the older "stake amount with 7-day lock" simulation to a
 * token-gated holder tier. No actual locks anywhere — we just read the
 * connected wallet's $SBORN balance live and surface what's unlocked.
 *
 * The legacy createStakePosition / closeStakePosition zustand actions
 * are still in the store for now (no breaking change to other code) but
 * are deliberately not called from this page anymore.
 */

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Compass,
  Crown,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/wallet/WalletButton'
import { useSbornHolder } from '@/lib/hooks/useSbornHolder'
import {
  SBORN_HOLDER_MIN_TOKENS,
  SBORN_TOKEN_ADDRESS,
  estimateStakeUsd,
  formatSbornCompact,
} from '@/lib/staking'

const HOLDER_GOLD = '#f5c54f'

export default function StakingPage() {
  const router = useRouter()
  const { balance, isHolder, loading } = useSbornHolder()

  const progressPct = useMemo(() => {
    if (isHolder) return 100
    return Math.min(100, Math.round((balance / SBORN_HOLDER_MIN_TOKENS) * 100))
  }, [balance, isHolder])

  const thresholdUsd = estimateStakeUsd(SBORN_HOLDER_MIN_TOKENS)
  const balanceUsd = estimateStakeUsd(balance)

  return (
    <main className="min-h-screen px-6 py-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 leading-tight">
            Hold $SBORN
          </h1>
          <div className="flex-1" />
          <WalletButton />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/discover')}
            className="hidden sm:inline-flex"
          >
            <Compass size={14} />
            Discover
          </Button>
        </div>

        {/* Hero */}
        <section
          className="glass relative overflow-hidden rounded-2xl p-7 sm:p-9 border border-white/10 mb-5"
          style={{
            background: `radial-gradient(ellipse at top, ${HOLDER_GOLD}14 0%, rgba(15,15,20,0) 60%), rgba(15,15,20,0.45)`,
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${HOLDER_GOLD}66, transparent)`,
            }}
          />
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-5 border text-[11px] font-semibold"
            style={{
              background: `${HOLDER_GOLD}14`,
              borderColor: `${HOLDER_GOLD}50`,
              color: HOLDER_GOLD,
            }}
          >
            <Crown size={11} />
            Token-gated, no lock
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 mb-3 leading-tight">
            Hold {formatSbornCompact(SBORN_HOLDER_MIN_TOKENS)} $SBORN
            <br />
            to unlock SolBorn perks
          </h2>
          <p className="text-base text-zinc-300 leading-relaxed max-w-2xl">
            No staking contract, no lock-up. Buy {formatSbornCompact(SBORN_HOLDER_MIN_TOKENS)} $SBORN
            (≈ ${thresholdUsd.toFixed(2)} at current estimate) and keep it in your wallet — we
            check the balance live and unlock perks across the product.
          </p>

          {/* Live status */}
          <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs uppercase tracking-wider text-zinc-500">Your wallet</span>
                {loading && <Loader2 size={11} className="animate-spin text-zinc-500" />}
              </div>
              <div
                className="text-[10px] uppercase tracking-wider font-semibold"
                style={{ color: isHolder ? HOLDER_GOLD : 'rgb(113,113,122)' }}
              >
                {isHolder ? 'Holder ✓' : 'Not yet'}
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <div>
                <span className="text-2xl font-bold text-zinc-50 tabular-nums">
                  {formatSbornCompact(balance)}
                </span>
                <span className="text-sm text-zinc-500 ml-1.5">$SBORN</span>
              </div>
              <div className="text-sm text-zinc-400 tabular-nums">
                ≈ ${balanceUsd.toFixed(2)}
              </div>
            </div>

            <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="h-full"
                style={{
                  background: isHolder
                    ? HOLDER_GOLD
                    : `linear-gradient(90deg, rgba(245,197,79,0.35), ${HOLDER_GOLD})`,
                }}
              />
            </div>
            {!isHolder && (
              <p className="mt-2 text-[11px] text-zinc-600">
                {formatSbornCompact(SBORN_HOLDER_MIN_TOKENS - balance)} $SBORN to go
              </p>
            )}
          </div>

          {/* Buy / get tokens */}
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`https://pump.fun/coin/${SBORN_TOKEN_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-zinc-900 transition-transform hover:scale-[1.02]"
              style={{ background: HOLDER_GOLD }}
            >
              Buy on pump.fun
              <ExternalLink size={14} />
            </a>
            <a
              href={`https://jup.ag/swap/SOL-${SBORN_TOKEN_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/[0.06] transition-colors"
            >
              Trade on Jupiter
              <ExternalLink size={14} />
            </a>
            <a
              href={`https://solscan.io/token/${SBORN_TOKEN_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400 hover:bg-white/[0.06] transition-colors"
            >
              token info
              <ExternalLink size={12} />
            </a>
          </div>
        </section>

        {/* Perks */}
        <section className="space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Perks unlocked</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <PerkCard
              icon={<Crown size={14} />}
              title="Featured on /discover"
              body="Your products appear in the holder section at the top of the marketplace. Live now."
              active={isHolder}
            />
            <PerkCard
              icon={<Sparkles size={14} />}
              title="$SBORN holder badge"
              body="A golden holder pill on every product card you publish. Visible to anyone browsing."
              active={isHolder}
            />
            <PerkCard
              icon={<Sparkles size={14} />}
              title="Free landing regens"
              body="When the AI landing generator returns to paid mode, holders keep regenerating free."
              active={false}
              comingSoon
            />
            <PerkCard
              icon={<Sparkles size={14} />}
              title="Premium subdomain slugs"
              body="3-letter and dictionary slugs reserved for holders. Coming next sprint."
              active={false}
              comingSoon
            />
          </div>
        </section>

        <p className="text-[11px] text-zinc-600 text-center mt-8 leading-relaxed max-w-md mx-auto">
          USD estimate based on visible pump.fun reference price. Treat it as ballpark — actual
          buy price depends on liquidity at the moment you trade.
        </p>
      </div>
    </main>
  )
}

function PerkCard({
  icon,
  title,
  body,
  active,
  comingSoon = false,
}: {
  icon: React.ReactNode
  title: string
  body: string
  active: boolean
  comingSoon?: boolean
}) {
  const goldBorder = active ? `${HOLDER_GOLD}55` : 'rgba(255,255,255,0.08)'
  return (
    <div
      className="rounded-xl border p-4 transition-colors"
      style={{
        background: active
          ? `linear-gradient(135deg, ${HOLDER_GOLD}10 0%, rgba(255,255,255,0.02) 60%)`
          : 'rgba(255,255,255,0.02)',
        borderColor: goldBorder,
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div
          className="flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: active ? HOLDER_GOLD : '#e4e4e7' }}
        >
          {icon}
          {title}
        </div>
        {comingSoon ? (
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">soon</span>
        ) : (
          <span
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: active ? HOLDER_GOLD : '#71717a' }}
          >
            {active ? 'active' : 'locked'}
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed">{body}</p>
    </div>
  )
}
