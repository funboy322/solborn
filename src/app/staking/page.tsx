'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Coins, ExternalLink, Lock, ShieldCheck, Trophy, Unlock, Vote } from 'lucide-react'
import { useSolanaSigner } from '@/lib/hooks/useSolanaSigner'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/wallet/WalletButton'
import { useForgeStore } from '@/lib/store'
import {
  estimateStakeUsd,
  formatSborn,
  getActiveStakeForWallet,
  getStakeVoteWeight,
  SBORN_TOKEN_ADDRESS,
  STAKING_MIN_SBORN,
  STAKING_MIN_USD,
} from '@/lib/staking'

const LOCK_DAYS = 7

function shortWallet(wallet: string): string {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
}

export default function StakingPage() {
  const router = useRouter()
  const { publicKey, connected } = useSolanaSigner()
  const walletAddress = publicKey?.toBase58() ?? null
  const agents = useForgeStore((s) => s.agents)
  const stakePositions = useForgeStore((s) => s.stakePositions)
  const [amount, setAmount] = useState(String(STAKING_MIN_SBORN))

  const numericAmount = Number(amount.replace(/,/g, ''))
  const activeStake = getActiveStakeForWallet(stakePositions, walletAddress)
  const activeStakeUsd = estimateStakeUsd(activeStake)
  const voteWeight = getStakeVoteWeight(activeStake)
  const ownedPassport = useMemo(() => {
    if (!walletAddress) return null
    return agents.find(
      (agent) =>
        agent.mintAddress &&
        (agent.walletAddress === walletAddress || agent.mintAddress === walletAddress),
    )
  }, [agents, walletAddress])
  const activePositions = walletAddress
    ? stakePositions.filter((position) => position.walletAddress === walletAddress && position.status === 'active')
    : []
  const hasAccess = Boolean(ownedPassport && activeStake >= STAKING_MIN_SBORN)

  return (
    <main className="min-h-screen px-6 py-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft size={16} />
          </Button>
          <img src="/logo.png" alt="SolBorn" className="w-8 h-8 rounded-xl cursor-pointer" onClick={() => router.push('/')} />
          <div className="flex-1 min-w-40">
            <h1 className="text-2xl font-bold text-zinc-100">$SBORN Staking</h1>
            <p className="text-sm text-zinc-500">Stake-to-unlock utility v1</p>
          </div>
          <WalletButton />
        </div>

        <section className="grid lg:grid-cols-[1.05fr_0.95fr] gap-5 items-stretch mb-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-7 border border-amber-300/15 relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-500/30 bg-zinc-500/10 text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              Soon
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-100 mb-4">
              Stake to unlock votes, boosts, and build access
            </h2>
            <p className="text-zinc-500 leading-relaxed max-w-2xl">
              The staking layer prepares the SolBorn voting economy. Passport holders will stake at
              least ${STAKING_MIN_USD} worth of $SBORN to join product votes, leaderboard seasons,
              and contributor reward rounds.
            </p>
            <p className="text-xs text-zinc-600 leading-relaxed mt-5 border-l border-zinc-500/30 pl-3">
              Live with mainnet launch. The real SPL lock program is being built and audited — this
              page is a preview of how access will work.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="glass p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-zinc-600 uppercase tracking-wider">Your access</p>
                <h3 className="text-xl font-bold text-zinc-100 mt-1">
                  {hasAccess ? 'Voting ready' : 'Locked'}
                </h3>
              </div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: hasAccess ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)' }}
              >
                {hasAccess ? <ShieldCheck size={22} className="text-emerald-300" /> : <Lock size={22} className="text-amber-300" />}
              </div>
            </div>

            <div className="space-y-3">
              <StatusRow done={connected} label="Wallet connected" detail={walletAddress ? shortWallet(walletAddress) : 'Connect wallet'} />
              <StatusRow done={Boolean(ownedPassport)} label="Agent Passport minted" detail={ownedPassport?.name ?? 'Mint Passport first'} />
              <StatusRow
                done={activeStake >= STAKING_MIN_SBORN}
                label={`Stake target $${STAKING_MIN_USD}+`}
                detail={`${formatSborn(activeStake)} SBORN active`}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Estimated stake" value={`$${activeStakeUsd.toFixed(2)}`} />
              <Metric label="Vote weight" value={voteWeight ? `${voteWeight}x` : '0x'} />
            </div>
          </motion.div>
        </section>

        <section className="grid lg:grid-cols-[0.95fr_1.05fr] gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="glass p-6 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-5">
              <Coins size={17} className="text-amber-300" />
              <h2 className="text-sm font-semibold text-zinc-100">Create stake intent</h2>
            </div>

            <label className="block text-xs text-zinc-600 mb-2">Amount</label>
            <div className="flex items-center gap-2 rounded-2xl px-4 py-3 border border-white/10 bg-white/[0.03]">
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))}
                className="min-w-0 flex-1 bg-transparent text-zinc-100 text-lg font-mono focus:outline-none"
                inputMode="decimal"
              />
              <span className="text-xs text-zinc-500 font-semibold">SBORN</span>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-zinc-600">
              <span>Minimum: {formatSborn(STAKING_MIN_SBORN)} SBORN</span>
              <span>~${estimateStakeUsd(numericAmount || 0).toFixed(2)}</span>
            </div>

            <Button
              disabled
              aria-disabled="true"
              className="w-full mt-5 bg-zinc-700 text-zinc-400 cursor-not-allowed opacity-70"
            >
              <Lock size={15} />
              Stake — available with mainnet
            </Button>

            <p className="text-xs text-zinc-600 mt-3">
              Real SPL token locks ship with mainnet launch. Numbers above are a preview of the parameters.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="glass p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Vote size={17} className="text-emerald-300" />
                <h2 className="text-sm font-semibold text-zinc-100">What staking unlocks</h2>
              </div>
              <a
                href={`https://pump.fun/coin/${SBORN_TOKEN_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-300 hover:text-amber-200 inline-flex items-center gap-1"
              >
                Token
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mb-5">
              <UnlockCard icon={<Vote size={16} />} title="Vote" body="Back the best trained agents and product ideas." />
              <UnlockCard icon={<Trophy size={16} />} title="Leaderboard" body="Qualify for build seasons and rankings." />
              <UnlockCard icon={<ShieldCheck size={16} />} title="Access" body="Open future boosts, roles, and reward rounds." />
            </div>

            <div className="space-y-2">
              {activePositions.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-500">
                  No active stake positions yet.
                </div>
              ) : (
                activePositions.map((position) => (
                  <div
                    key={position.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                      <Lock size={16} className="text-emerald-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-100">{formatSborn(position.amount)} SBORN</p>
                      <p className="text-xs text-zinc-600">
                        Unlocks {position.unlockAt ? new Date(position.unlockAt).toLocaleDateString() : 'soon'} · local v1
                      </p>
                    </div>
                    <button
                      disabled
                      aria-disabled="true"
                      className="text-xs text-zinc-700 inline-flex items-center gap-1 cursor-not-allowed"
                    >
                      <Unlock size={12} />
                      unstake — soon
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  )
}

function StatusRow({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/10 p-3">
      <span
        className="w-6 h-6 rounded-lg flex items-center justify-center"
        style={{ background: done ? 'rgba(52,211,153,0.12)' : 'rgba(113,113,122,0.1)' }}
      >
        {done ? <Check size={13} className="text-emerald-300" /> : <Lock size={13} className="text-zinc-500" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-200">{label}</p>
        <p className="text-xs text-zinc-600 truncate">{detail}</p>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3">
      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-zinc-100 mt-1">{value}</p>
    </div>
  )
}

function UnlockCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
      <div className="w-9 h-9 rounded-xl bg-emerald-400/10 text-emerald-300 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-zinc-100 mb-1">{title}</h3>
      <p className="text-xs text-zinc-600 leading-relaxed">{body}</p>
    </div>
  )
}
