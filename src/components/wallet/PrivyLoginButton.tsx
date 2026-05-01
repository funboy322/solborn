'use client'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'

const PRIVY_ENABLED = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID)

/**
 * Email / social login button. Opens Privy's modal which includes Google / Apple
 * / Twitter / Phantom etc. — Privy takes care of provisioning a Solana embedded
 * wallet automatically on first login.
 *
 * Renders nothing if Privy isn't configured.
 */
export function PrivyLoginButton() {
  if (!PRIVY_ENABLED) return null
  return <PrivyLoginButtonInner />
}

function PrivyLoginButtonInner() {
  const { login, authenticated, logout, ready, user } = usePrivy()

  if (!ready) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-zinc-500 whitespace-nowrap"
      >
        <Mail size={12} />
        Loading…
      </button>
    )
  }

  if (authenticated) {
    const label = user?.email?.address ?? 'Signed in'
    return (
      <button
        onClick={() => logout()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-zinc-400 hover:text-rose-300 hover:border-rose-300/30 transition-colors whitespace-nowrap"
        title="Sign out"
      >
        <Mail size={12} />
        <span className="max-w-[120px] truncate">{label}</span>
      </button>
    )
  }

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => login()}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap"
      style={{
        background: 'rgba(34,211,238,0.06)',
        borderColor: 'rgba(34,211,238,0.22)',
        color: '#67e8f9',
      }}
    >
      <Mail size={12} />
      Sign in
    </motion.button>
  )
}
