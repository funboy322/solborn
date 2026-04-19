'use client'
/**
 * SupportBanner — a soft ask shown ONCE per browser after the user sends
 * their first message and sees a real response.
 *
 * Why the delay?
 *   - Asking for a star before they've experienced anything = ignored.
 *   - After one full turn they've seen the agent actually work, the XP
 *     particle, the streaming — that's when "help us grow" resonates.
 *
 * Dismissal is persisted to localStorage so returning users never see it
 * twice. Clicking "Star on GitHub" also marks it dismissed (success path).
 *
 * The component does NOT block the chat — it's a floating non-modal card
 * anchored to the bottom of the chat pane. Users can keep typing while
 * it's visible.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, BookOpen } from 'lucide-react'
import { useEffect, useState } from 'react'

const KEY = 'solborn-support-banner-dismissed'
const REPO = 'https://github.com/funboy322/solborn'

interface Props {
  /** Flip to true after the first successful agent response. */
  trigger: boolean
}

export function SupportBanner({ trigger }: Props) {
  const [visible, setVisible] = useState(false)
  const [stared, setStared] = useState(false)

  useEffect(() => {
    if (!trigger) return
    try {
      if (localStorage.getItem(KEY) === '1') return
    } catch {
      /* storage blocked — just show it */
    }
    // Small delay so it doesn't collide with the XP particle animation.
    const t = setTimeout(() => setVisible(true), 1400)
    return () => clearTimeout(t)
  }, [trigger])

  function dismiss() {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* noop */
    }
    setVisible(false)
  }

  function handleStar() {
    setStared(true)
    // Let the success state show for a beat before hiding.
    setTimeout(dismiss, 1800)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 w-[min(92%,440px)]"
        >
          <div
            className="relative rounded-2xl p-4 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(245,158,11,0.12) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(245,158,11,0.35)',
              boxShadow: '0 20px 60px -10px rgba(139,92,246,0.35), 0 0 0 1px rgba(255,255,255,0.05) inset',
            }}
          >
            {/* Close button */}
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="absolute top-2 right-2 p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
            >
              <X size={14} />
            </button>

            {!stared ? (
              <>
                <div className="flex items-start gap-3 pr-6">
                  <motion.div
                    animate={{ rotate: [0, -8, 8, -4, 4, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                      boxShadow: '0 0 20px rgba(245,158,11,0.5)',
                    }}
                  >
                    <Star size={18} className="text-white fill-white" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-zinc-100">
                      Enjoying SolBorn? Give us a star ⭐
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      One star on GitHub helps other builders find us and powers the{' '}
                      <span className="text-amber-300 font-medium">trainer royalty</span> thesis.
                      Takes 3 seconds. Costs nothing.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pl-12">
                  <a
                    href={REPO}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleStar}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-transform active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                      boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                    }}
                  >
                    <Star size={12} className="fill-white" />
                    Star on GitHub
                  </a>
                  <a
                    href={REPO + '#-the-pitch-in-one-paragraph'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <BookOpen size={12} />
                    Learn more
                  </a>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 py-1 pr-6"
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1], rotate: [0, 20, 0] }}
                  transition={{ duration: 0.7 }}
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #34d399, #10b981)' }}
                >
                  <Star size={18} className="text-white fill-white" />
                </motion.div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-300">You&apos;re a legend 💚</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Thank you. Now go raise that agent to Adult.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
