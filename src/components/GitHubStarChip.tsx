'use client'
/**
 * Floating "Star on GitHub" chip shown site-wide.
 *
 * Design choices:
 *   - Lives bottom-left so it doesn't fight with the wallet/connect button
 *     (which is usually top-right) or the wave of XP particles in the forge.
 *   - Live star count pulled from GitHub REST API — makes the ask concrete
 *     ("join 37 others") instead of abstract ("please star us").
 *   - Appears after a 2s delay + only once per session (sessionStorage);
 *     hitting "Star" or the X dismisses it for the current tab.
 *   - Keeps a minimized pill-mode after dismissal so power users still have
 *     one-click access without re-seeing the pitch every visit.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const REPO = 'funboy322/solborn'
const REPO_URL = `https://github.com/${REPO}`
const DISMISS_KEY = 'solborn-star-chip-dismissed'

async function fetchStars(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { Accept: 'application/vnd.github+json' },
      // GitHub rate-limits unauthenticated requests — it's fine, it just
      // falls back to "star" instead of a count.
      cache: 'no-store',
    })
    if (!res.ok) return null
    const json = (await res.json()) as { stargazers_count?: number }
    return typeof json.stargazers_count === 'number' ? json.stargazers_count : null
  } catch {
    return null
  }
}

export function GitHubStarChip() {
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    // 2s delay gives the landing animation breathing room
    const t = setTimeout(() => setMounted(true), 2000)
    fetchStars().then(setStars)
    // If not dismissed this session, auto-expand once
    try {
      if (sessionStorage.getItem(DISMISS_KEY) !== '1') {
        setTimeout(() => setExpanded(true), 2400)
      }
    } catch {
      setTimeout(() => setExpanded(true), 2400)
    }
    return () => clearTimeout(t)
  }, [])

  function collapse() {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* noop */
    }
    setExpanded(false)
  }

  function handleStar() {
    // Don't await — just let the browser open GitHub
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* noop */
    }
    setTimeout(() => setExpanded(false), 400)
  }

  if (!mounted) return null

  return (
    <div className="fixed bottom-4 left-4 z-40 pointer-events-none">
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="pointer-events-auto w-[min(92vw,340px)]"
          >
            <div
              className="relative rounded-2xl p-3.5 pr-8 overflow-hidden"
              style={{
                background:
                  'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(245,158,11,0.14) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(245,158,11,0.35)',
                boxShadow:
                  '0 16px 48px -12px rgba(139,92,246,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset',
              }}
            >
              <button
                onClick={collapse}
                aria-label="Minimize"
                className="absolute top-2 right-2 p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
              >
                <X size={13} />
              </button>

              <div className="flex items-start gap-3">
                <motion.div
                  animate={{
                    rotate: [0, -10, 10, -4, 4, 0],
                    scale: [1, 1.08, 1],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
                  className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                    boxShadow: '0 0 16px rgba(245,158,11,0.5)',
                  }}
                >
                  <Star size={15} className="text-white fill-white" />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-zinc-100 leading-tight">
                    Like SolBorn? Star us ⭐
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                    One click. Helps the repo surface for other Solana devs and
                    keeps this solo-built project visible.
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <a
                      href={REPO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleStar}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-transform active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                        boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                      }}
                    >
                      <Star size={11} className="fill-white" />
                      Star
                      {stars !== null && (
                        <span className="opacity-90 font-mono">
                          ({stars.toLocaleString()})
                        </span>
                      )}
                    </a>
                    <button
                      onClick={collapse}
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 px-1 transition-colors"
                    >
                      later
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.a
            key="pill"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onMouseEnter={() => setExpanded(true)}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-200 hover:text-white transition-colors"
            style={{
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 24px -8px rgba(0,0,0,0.4)',
            }}
            aria-label="Star on GitHub"
          >
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span>Star</span>
            {stars !== null && (
              <span className="font-mono text-zinc-500">{stars.toLocaleString()}</span>
            )}
          </motion.a>
        )}
      </AnimatePresence>
    </div>
  )
}
