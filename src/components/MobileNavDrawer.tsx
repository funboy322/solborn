'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { X, Play, Trophy, Lock, Gift, Hammer, ShoppingBag, ExternalLink, Plus } from 'lucide-react'
import { PrivyLoginButton } from '@/components/wallet/PrivyLoginButton'

/**
 * Slide-in mobile navigation drawer.
 *
 * The landing navbar hides all secondary links (Demo, Arena, Stake, Rewards,
 * My Agents, Buy $SBORN, X icon) on viewports below `lg` to fit Connect +
 * Create Agent on one line. The drawer is how mobile and tablet users reach
 * those routes.
 *
 * Also surfaces the Privy email-login button which was previously hidden
 * on mobile entirely — meaning crypto-curious users without Phantom had no
 * way to sign in from the landing page.
 *
 * Closes on:
 *   - X icon tap
 *   - Backdrop tap
 *   - Escape key
 *   - Link click (router pushes to the destination)
 */

interface MobileNavDrawerProps {
  open: boolean
  onClose: () => void
  agentCount: number
  /** Triggers the Create Agent modal (hoisted from the landing navbar
   *  so the drawer's primary CTA stays in sync with the top-bar one). */
  onCreateAgent: () => void
}

interface NavItem {
  label: string
  href: string
  icon: typeof Play
  description: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Demo', href: '/demo', icon: Play, description: 'Speed-run the full loop' },
  { label: 'Arena', href: '/products', icon: Trophy, description: 'Browse agent-built products' },
  { label: 'Forge', href: '/forge', icon: Hammer, description: 'Your agents' },
  { label: 'Stake', href: '/staking', icon: Lock, description: '$SBORN access tiers' },
  { label: 'Rewards', href: '/rewards', icon: Gift, description: 'Contributor pool' },
]

export function MobileNavDrawer({ open, onClose, agentCount, onCreateAgent }: MobileNavDrawerProps) {
  const router = useRouter()

  // Esc to close.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  function go(href: string) {
    onClose()
    router.push(href)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm lg:hidden"
            aria-hidden
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 z-[61] h-full w-[min(86vw,360px)] overflow-y-auto border-l border-violet-300/15 bg-zinc-950 shadow-[0_0_60px_-10px_rgba(0,0,0,0.9)] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="SolBorn" className="h-7 w-7 rounded-lg" />
                <span className="font-bold text-zinc-100">SolBorn</span>
                <span className="rounded-full border border-violet-500/25 bg-violet-500/15 px-2 py-0.5 font-mono text-[10px] text-violet-300">
                  Beta
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-zinc-100"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Primary CTA — moved here from the top bar on mobile so the
                Create Agent button always has somewhere to live regardless of
                viewport width. */}
            <div className="border-b border-white/[0.06] p-4">
              <button
                onClick={() => {
                  onClose()
                  onCreateAgent()
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition-colors hover:bg-violet-500"
              >
                <Plus size={16} />
                Create Agent
              </button>
            </div>

            {/* Sign in (Privy) — the previously hidden mobile email flow */}
            <div className="border-b border-white/[0.06] p-4">
              <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-600">
                Sign in
              </p>
              <PrivyLoginButton />
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
                Email login provisions an embedded Solana wallet. No seed phrase.
              </p>
            </div>

            {/* Nav */}
            <nav className="p-2">
              <p className="px-2 pb-2 pt-1 text-[10px] font-mono uppercase tracking-wider text-zinc-600">
                Explore
              </p>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isForge = item.label === 'Forge'
                return (
                  <button
                    key={item.label}
                    onClick={() => go(item.href)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                      <Icon size={15} className="text-violet-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-100">{item.label}</span>
                        {isForge && agentCount > 0 && (
                          <span className="rounded-md bg-emerald-300/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                            {agentCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">{item.description}</p>
                    </div>
                  </button>
                )
              })}
            </nav>

            {/* External */}
            <div className="border-t border-white/[0.06] p-2">
              <p className="px-2 pb-2 pt-1 text-[10px] font-mono uppercase tracking-wider text-zinc-600">
                $SBORN
              </p>
              <a
                href="https://pump.fun/coin/3VNSmRLTvS54LWnynJNqEege21nzdjy1rEsPhsNxpump"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-300/25 bg-violet-400/[0.08]">
                  <ShoppingBag size={15} className="text-violet-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-100">Buy $SBORN</span>
                    <ExternalLink size={11} className="text-zinc-600" />
                  </div>
                  <p className="text-xs text-zinc-500">pump.fun</p>
                </div>
              </a>
            </div>

            {/* Social */}
            <div className="border-t border-white/[0.06] p-2 pb-6">
              <p className="px-2 pb-2 pt-1 text-[10px] font-mono uppercase tracking-wider text-zinc-600">
                Follow
              </p>
              <a
                href="https://x.com/solborn_xyz"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-300">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-zinc-100">@solborn_xyz</span>
                  <p className="text-xs text-zinc-500">Project updates</p>
                </div>
              </a>
              <a
                href="https://github.com/funboy322/solborn"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                  <ExternalLink size={14} className="text-zinc-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-zinc-100">GitHub</span>
                  <p className="text-xs text-zinc-500">Open source on github.com</p>
                </div>
              </a>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
