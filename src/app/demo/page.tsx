'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, ExternalLink, FlaskConical, Lock, Rocket, ShieldCheck, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/wallet/WalletButton'
import { useForgeStore } from '@/lib/store'

const STEPS = [
  {
    title: 'Open the Forge',
    time: '20 sec',
    body: 'Name your agent, connect Phantom or sign in with Privy, and start the memecoin interview.',
    action: 'Open Forge',
    href: '/forge?demo=1',
  },
  {
    title: 'Tell the agent your meme',
    time: '60 sec',
    body: 'Answer questions about your ticker, vibe, lore, and target community. The agent learns from each answer.',
    action: 'Talk to agent',
    href: '/forge?demo=1',
  },
  {
    title: 'Level up to Adult',
    time: '60 sec',
    body: 'In demo mode, XP scales fast. Reach Adult to unlock landing-page and launch-thread generation.',
    action: 'Train agent',
    href: '/forge?demo=1',
  },
  {
    title: 'Generate landing page',
    time: '30 sec',
    body: 'AI writes the full landing: lore, tokenomics, how-to-buy, FAQ. Renders on your product page.',
    action: 'Generate',
    href: '/forge?demo=1',
  },
  {
    title: 'Generate launch thread',
    time: '30 sec',
    body: 'AI writes 7 tweets in the agent\'s voice. Copy each, post as a thread on X.',
    action: 'Generate thread',
    href: '/forge?demo=1',
  },
  {
    title: 'Claim your subdomain',
    time: '30 sec',
    body: 'Pick yourticker.solborn.xyz, edit to publish. Server-rendered, mobile-fast, real public URL.',
    action: 'See Discover',
    href: '/discover',
  },
]

const PROOF = [
  {
    icon: ShieldCheck,
    title: 'Real public URL',
    body: 'Each launch lands on a {ticker}.solborn.xyz subdomain — server-rendered, SEO-indexed, mobile-fast.',
  },
  {
    icon: Trophy,
    title: 'AI does the writing',
    body: 'Lore, landing copy, and 7-tweet thread all generated from your brief. No blank-page paralysis.',
  },
  {
    icon: Lock,
    title: '$SBORN holder perks',
    body: 'Hold 1M $SBORN to unlock featured placement on /discover and a holder badge on every launch.',
  },
]

export default function DemoPage() {
  const router = useRouter()
  const seedDemoProduct = useForgeStore((s) => s.seedDemoProduct)

  function handleSeedDemo() {
    const agent = seedDemoProduct()
    router.push(`/products/${agent.generatedProject?.id ?? 'demo-product-signalforge'}`)
  }

  return (
    <main className="min-h-screen px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center gap-3 mb-8 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft size={16} />
          </Button>
          <img
            src="/logo.png"
            alt="SolBorn"
            className="w-8 h-8 rounded-xl cursor-pointer"
            onClick={() => router.push('/')}
          />
          <div className="flex-1 min-w-44">
            <h1 className="text-2xl font-bold text-zinc-100">Hackathon Demo Path</h1>
            <p className="text-sm text-zinc-500">A judge-friendly route through SolBorn in about 3 minutes</p>
          </div>
          <WalletButton />
        </header>

        <section className="grid lg:grid-cols-[1.05fr_0.95fr] gap-5 mb-6">
          <div className="glass p-7 border border-white/10 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/50 to-transparent" />
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-violet-300/25 bg-violet-300/10 text-[11px] font-semibold text-violet-200 mb-5">
              Judge mode
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-100 mb-4">
              Tell the agent your meme. Ship a Solana memecoin.
            </h2>
            <p className="text-zinc-500 leading-relaxed max-w-3xl">
              This path shows the full SolBorn loop: the AI agent interviews you about your meme,
              writes the lore, generates a landing page, and a 7-tweet launch thread for X — all
              with $SBORN holder perks unlockable at any time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button onClick={() => router.push('/forge?demo=1')} className="bg-violet-400 text-zinc-950 hover:bg-violet-300">
                <Rocket size={16} />
                Start 3-minute demo
              </Button>
              <Button variant="secondary" onClick={handleSeedDemo}>
                <FlaskConical size={16} />
                Load sample product
              </Button>
              <Button variant="secondary" onClick={() => router.push('/products')}>
                <Trophy size={16} />
                Open Arena
              </Button>
            </div>
          </div>

          <div className="glass p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-5">
              <FlaskConical size={17} className="text-amber-300" />
              <h3 className="text-sm font-semibold text-zinc-100">What to look for</h3>
            </div>
            <div className="space-y-3">
              {PROOF.map((item) => (
                <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2">
                    <item.icon size={16} className="text-emerald-300" />
                    <h4 className="text-sm font-semibold text-zinc-100">{item.title}</h4>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed mt-2">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {STEPS.map((step, index) => (
            <article key={step.title} className="glass p-5 border border-white/10 flex flex-col min-h-[250px]">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-violet-300 font-semibold">
                    Step {index + 1} / {step.time}
                  </p>
                  <h3 className="text-xl font-bold text-zinc-100 mt-1">{step.title}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-300/10 border border-violet-300/20 flex items-center justify-center text-violet-200">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">{step.body}</p>
              <a
                href={step.href}
                className="mt-auto flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-colors"
              >
                <ExternalLink size={12} />
                {step.action}
              </a>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
