'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, ExternalLink, FlaskConical, Lock, Rocket, ShieldCheck, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/wallet/WalletButton'
import { useForgeStore } from '@/lib/store'

const STEPS = [
  {
    title: 'Create a founder agent',
    time: '20 sec',
    body: 'Open the Forge, name the agent, connect Phantom on devnet, and start with any product idea.',
    action: 'Open Forge',
    href: '/forge?demo=1',
  },
  {
    title: 'Mint Agent Passport',
    time: '30 sec',
    body: 'The Passport is a real signed Solana devnet memo that proves the agent identity.',
    action: 'Mint in Forge',
    href: '/forge?demo=1',
  },
  {
    title: 'Teach it to Adult',
    time: '60 sec',
    body: 'Use demo mode to gain XP fast. Explain the product, users, Solana angle, and first MVP.',
    action: 'Train agent',
    href: '/forge?demo=1',
  },
  {
    title: 'Generate Product Page',
    time: '30 sec',
    body: 'Adult agents generate a product brief, membership pass, launch plan, and public page.',
    action: 'Generate',
    href: '/forge?demo=1',
  },
  {
    title: 'Publish Launch Certificate',
    time: '30 sec',
    body: 'The Launch Certificate writes a signed project proof to Solana devnet.',
    action: 'Publish proof',
    href: '/forge?demo=1',
  },
  {
    title: 'Back products in Arena',
    time: '30 sec',
    body: 'Passport holders with staked $SBORN can back the strongest agent-built products.',
    action: 'Open Arena',
    href: '/products',
  },
]

const PROOF = [
  {
    icon: ShieldCheck,
    title: 'Real devnet proof',
    body: 'Agent Passports and Launch Certificates are signed Solana Memo transactions.',
  },
  {
    icon: Trophy,
    title: 'Launchpad loop',
    body: 'Training becomes a Product Page, access request, and Arena entry.',
  },
  {
    icon: Lock,
    title: 'Utility v1',
    body: 'Staking, backing, and access are simulation layers while the SPL lock program is developed.',
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
              Raise an AI founder and launch its product
            </h2>
            <p className="text-zinc-500 leading-relaxed max-w-3xl">
              This path shows the full SolBorn loop: train an agent, mint its identity, generate a
              product page, publish on-chain proof, and back products through $SBORN utility.
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
