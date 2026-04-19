'use client'
/**
 * Tiny thumbs-up/down control shown under each assistant message.
 *
 * Sends to /api/feedback which logs structured JSON. Over time this gives
 * us a real dataset of (prompt, response, rating) triples — the starting
 * point for fine-tuning or at minimum a prompt-iteration feedback loop.
 *
 * UI is deliberately subtle so it doesn't compete with the XP particle —
 * grey icons that brighten on hover, selected state is coloured.
 */
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface Props {
  agentId: string
  agentStage: string
  messageId: string
  userMessage: string
  assistantMessage: string
  trainerWallet?: string | null
}

export function MessageFeedback({
  agentId,
  agentStage,
  messageId,
  userMessage,
  assistantMessage,
  trainerWallet,
}: Props) {
  const [rating, setRating] = useState<'up' | 'down' | null>(null)
  const [sending, setSending] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState('')
  const [commentSent, setCommentSent] = useState(false)

  async function submit(r: 'up' | 'down', withComment?: string) {
    if (sending) return
    setSending(true)
    setRating(r)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          agentStage,
          messageId,
          userMessage,
          assistantMessage,
          rating: r,
          comment: withComment,
          trainerWallet,
          source: 'chat',
        }),
      })
    } catch {
      /* best-effort; feedback loss isn't user-facing */
    } finally {
      setSending(false)
    }
    // Ask for a reason on a thumbs-down so we can actually fix the failure mode.
    if (r === 'down' && !withComment) setShowComment(true)
  }

  async function sendComment() {
    if (!comment.trim() || commentSent) return
    await submit('down', comment.trim())
    setCommentSent(true)
    setTimeout(() => setShowComment(false), 1400)
  }

  return (
    <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => submit('up')}
        disabled={rating !== null}
        aria-label="Good response"
        className={`p-1 rounded-md transition-colors ${
          rating === 'up'
            ? 'text-emerald-400 bg-emerald-500/10'
            : 'text-zinc-600 hover:text-emerald-400 hover:bg-white/5'
        }`}
      >
        <ThumbsUp size={11} />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => submit('down')}
        disabled={rating !== null}
        aria-label="Bad response"
        className={`p-1 rounded-md transition-colors ${
          rating === 'down'
            ? 'text-rose-400 bg-rose-500/10'
            : 'text-zinc-600 hover:text-rose-400 hover:bg-white/5'
        }`}
      >
        <ThumbsDown size={11} />
      </motion.button>

      {showComment && !commentSent && (
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1 ml-1"
        >
          <input
            autoFocus
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendComment()
              if (e.key === 'Escape') setShowComment(false)
            }}
            placeholder="what went wrong?"
            maxLength={500}
            className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-rose-500/40 w-40"
          />
          <button
            onClick={sendComment}
            className="text-[10px] px-2 py-0.5 rounded text-rose-300 hover:text-rose-200 hover:bg-rose-500/10"
          >
            send
          </button>
        </motion.div>
      )}

      {commentSent && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] text-emerald-400 ml-1"
        >
          thanks 💚
        </motion.span>
      )}
    </div>
  )
}
