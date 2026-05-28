'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Pencil } from 'lucide-react'
import type { McOption, McQuestion } from '@/lib/ai/mc-parser'

interface McQuestionCardProps {
  question: McQuestion
  preText?: string
  /** Stage colour for accent borders / icons (matches surrounding bubble). */
  accentColor: string
  /** Has the user already answered? Controls disabled state across reloads. */
  alreadyAnswered?: boolean
  /** Pre-recorded selection (option id) when re-rendered from history. */
  selectedOptionId?: string
  /**
   * Fires when the user picks one of the 4 options.
   * The caller is expected to: (1) push a user message with `option.label`,
   * (2) bump `option.trait` by `option.delta` if present,
   * (3) record the preference under `question.saveAs` if present.
   */
  onSelect: (option: McOption) => void
  /**
   * Fires when the user clicks the "type my own" escape. The caller should
   * dismiss the card (mark it answered with no selection) and focus the
   * regular text input.
   */
  onEscape: () => void
}

export function McQuestionCard({
  question,
  preText,
  accentColor,
  alreadyAnswered = false,
  selectedOptionId,
  onSelect,
  onEscape,
}: McQuestionCardProps) {
  const [picked, setPicked] = useState<string | null>(selectedOptionId ?? null)
  const locked = alreadyAnswered || picked !== null

  const handleClick = (opt: McOption) => {
    if (locked) return
    setPicked(opt.id)
    // Tiny delay so the user sees the highlight before the chat scrolls.
    setTimeout(() => onSelect(opt), 180)
  }

  return (
    <div
      className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed text-zinc-200 space-y-3"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${accentColor}38`,
      }}
    >
      {preText && (
        <p className="whitespace-pre-wrap text-zinc-300">{preText}</p>
      )}

      <p className="whitespace-pre-wrap text-zinc-100 font-medium">{question.text}</p>

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {question.options.map((opt, idx) => {
            const isPicked = picked === opt.id
            const dimmed = locked && !isPicked
            return (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{
                  opacity: dimmed ? 0.35 : 1,
                  x: 0,
                  scale: isPicked ? 0.98 : 1,
                }}
                transition={{ duration: 0.18, delay: idx * 0.04 }}
                whileHover={locked ? undefined : { scale: 1.01, x: 2 }}
                whileTap={locked ? undefined : { scale: 0.97 }}
                disabled={locked}
                onClick={() => handleClick(opt)}
                className={`flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                  locked ? 'cursor-default' : 'cursor-pointer hover:bg-white/[0.04]'
                }`}
                style={{
                  background: isPicked
                    ? `${accentColor}22`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isPicked ? accentColor : 'rgba(255,255,255,0.08)'}`,
                  color: isPicked ? '#fafafa' : '#d4d4d8',
                }}
              >
                <span className="flex-1 pr-3">{opt.label}</span>
                {isPicked && (
                  <Check className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                )}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {!locked && (
        <button
          onClick={onEscape}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-1"
        >
          <Pencil className="w-3 h-3" />
          <span>type my own answer</span>
        </button>
      )}
    </div>
  )
}
