import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How SolBorn handles your data — what stays on your device, what reaches the network, and what you control.',
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
}

const LAST_UPDATED = '2026-05-14'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Back to SolBorn
        </Link>

        <h1 className="text-3xl font-bold text-zinc-100 mb-2">Privacy Policy</h1>
        <p className="text-xs font-mono uppercase tracking-wider text-zinc-600 mb-10">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="space-y-8 text-sm text-zinc-300 leading-relaxed">
          <Section title="Short version">
            <p>
              SolBorn runs an AI agent that interviews you about your background and ships your
              startup as on-chain artifacts on Solana devnet. Your interview content lives in your
              browser. Your wallet address and the NFTs you mint are on Solana, which is public by
              design. Nothing is sold. Nothing is shared with advertisers. There are no
              advertisers.
            </p>
          </Section>

          <Section title="What stays on your device">
            <ul className="list-disc pl-5 space-y-2 marker:text-zinc-700">
              <li>
                Your agent's name, emoji, personality, stage, XP, traits, and every message of your
                interview. Stored in <code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs">localStorage</code> in
                your browser. Clearing browser data deletes all of it permanently.
              </li>
              <li>
                Your beta access form draft text until you submit.
              </li>
              <li>
                A demo-mode flag if you opened a URL with <code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs">?demo=1</code>.
                Cleared when you close the tab.
              </li>
            </ul>
          </Section>

          <Section title="What leaves your device">
            <p className="mb-3">
              Specific things, only when you explicitly take an action:
            </p>
            <ul className="list-disc pl-5 space-y-2 marker:text-zinc-700">
              <li>
                <strong className="text-zinc-200">Chat messages</strong> are sent to{' '}
                <a className="text-violet-300 hover:text-violet-200" href="https://groq.com" target="_blank" rel="noopener noreferrer">Groq</a>{' '}
                so the agent can reply. Groq processes and discards them per their own policy.
              </li>
              <li>
                <strong className="text-zinc-200">Extracted facts</strong> from your conversation
                are stored as vector embeddings in{' '}
                <a className="text-violet-300 hover:text-violet-200" href="https://upstash.com" target="_blank" rel="noopener noreferrer">Upstash Vector</a>{' '}
                so the agent can recall context across sessions. Indexed under a per-agent key, not
                your personal identifier.
              </li>
              <li>
                <strong className="text-zinc-200">Wallet address</strong> and{' '}
                <strong className="text-zinc-200">signed transactions</strong> reach the Solana
                devnet via{' '}
                <a className="text-violet-300 hover:text-violet-200" href="https://helius.xyz" target="_blank" rel="noopener noreferrer">Helius</a>{' '}
                RPC. Everything on Solana is public.
              </li>
              <li>
                <strong className="text-zinc-200">Beta access submissions</strong> (the form on a
                product page) are stored server-side so the founder can read them. Includes
                whatever contact info you put in the form.
              </li>
              <li>
                <strong className="text-zinc-200">Email</strong> if you sign in via Privy. Privy
                provisions an embedded Solana wallet from it. See{' '}
                <a className="text-violet-300 hover:text-violet-200" href="https://www.privy.io/privacy-policy" target="_blank" rel="noopener noreferrer">Privy's policy</a>.
              </li>
            </ul>
          </Section>

          <Section title="What third parties see">
            <ul className="list-disc pl-5 space-y-2 marker:text-zinc-700">
              <li>
                <strong className="text-zinc-200">Vercel</strong> hosts the site and sees standard
                request logs (IP address, user agent, timestamps). No custom analytics.
              </li>
              <li>
                <strong className="text-zinc-200">Phantom</strong> (when you connect with the
                browser extension) sees the same thing any dApp sees: your address, the
                transactions you sign.
              </li>
              <li>
                <strong className="text-zinc-200">Privy</strong> (when you sign in with email) sees
                your email and provisions a Solana wallet on your behalf.
              </li>
              <li>
                <strong className="text-zinc-200">Groq, Upstash, Helius, Solana RPC nodes</strong>{' '}
                see the data described above for their specific role.
              </li>
            </ul>
          </Section>

          <Section title="What we never do">
            <ul className="list-disc pl-5 space-y-2 marker:text-zinc-700">
              <li>Sell or rent your data.</li>
              <li>Run advertising trackers, pixels, or fingerprinting scripts.</li>
              <li>Train external models on your conversations beyond the live inference call.</li>
              <li>Touch your private keys. Phantom and Privy custody those, not SolBorn.</li>
            </ul>
          </Section>

          <Section title="Your controls">
            <ul className="list-disc pl-5 space-y-2 marker:text-zinc-700">
              <li>
                Delete everything client-side: clear your browser's localStorage for solborn.xyz.
              </li>
              <li>
                Disconnect your wallet at any time. Existing on-chain NFTs stay on Solana (public
                ledger), but no further actions can be signed.
              </li>
              <li>
                Request deletion of your beta access submission by emailing the address below.
              </li>
              <li>
                Privy account deletion: see Privy's user settings.
              </li>
            </ul>
          </Section>

          <Section title="On-chain data is public">
            <p>
              SolBorn mints Agent Passport and Launch Certificate NFTs on Solana. Anyone with the
              mint address can see your wallet, the metadata, and the linked OG artwork. This is
              how blockchains work. If you don't want any of this on a public ledger, don't mint.
            </p>
          </Section>

          <Section title="Children">
            <p>
              SolBorn is not designed for users under 18. Don't use it if you are under 18.
            </p>
          </Section>

          <Section title="Changes">
            <p>
              If this policy changes materially, the date at the top will update and a notice will
              appear on the site. Old versions live in the GitHub history at{' '}
              <a className="text-violet-300 hover:text-violet-200" href="https://github.com/funboy322/solborn" target="_blank" rel="noopener noreferrer">github.com/funboy322/solborn</a>.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              For privacy questions, deletion requests, or anything you want flagged: reach out on
              X at{' '}
              <a className="text-violet-300 hover:text-violet-200" href="https://x.com/solborn_xyz" target="_blank" rel="noopener noreferrer">@solborn_xyz</a>{' '}
              or the founder at{' '}
              <a className="text-violet-300 hover:text-violet-200" href="https://x.com/ungspirit" target="_blank" rel="noopener noreferrer">@ungspirit</a>.
            </p>
          </Section>
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-zinc-100 mb-3">{title}</h2>
      <div className="text-zinc-400">{children}</div>
    </section>
  )
}
