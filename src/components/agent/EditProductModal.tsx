'use client'

/**
 * Customize-launch-page modal.
 *
 * Lets the agent creator override the AI-generated product fields with their
 * own copy and (optionally) attach a real product URL. The URL is verified
 * through /api/scam-check before being saved — if Safe Browsing flags it the
 * save is blocked and the error surfaces inline.
 *
 * Fields the AI fully owns (techStack, launchPlan, on-chain truth) are not
 * editable here on purpose: the agent's brief and the launch plan are part of
 * the "this was shipped by an AI" narrative; the creator personalises the
 * marketing copy and points the CTA at a real link.
 */

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Check, ExternalLink, Globe, Loader2, ShieldCheck, X } from 'lucide-react'
import { useForgeStore } from '@/lib/store'
import { useSolanaSigner } from '@/lib/hooks/useSolanaSigner'
import type { ForgeAgent, GeneratedProject, ProductBrief } from '@/lib/types'

interface EditProductModalProps {
  project: GeneratedProject
  agent: ForgeAgent
  agentId: string
  onClose: () => void
  /** Hex/rgb accent for borders + buttons — matches the page's stage colour. */
  accentColor?: string
}

const SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/

const SUBDOMAIN_ERROR_MESSAGES: Record<string, string> = {
  taken: 'That subdomain is already taken. Pick another.',
  'invalid-format':
    'Use lowercase letters, numbers, and hyphens only. Must start and end with a letter or number.',
  'too-short': 'Subdomain must be at least 3 characters.',
  'too-long': 'Subdomain must be at most 32 characters.',
  reserved: 'That word is reserved. Pick another.',
  'missing-fields': 'Internal: missing required fields.',
  'invalid-wallet': 'Connect a wallet to claim a subdomain.',
  'invalid-mirror': 'Internal: invalid project data.',
  'mirror-write-failed': 'Subdomain claimed but mirror could not be saved. Try Republish.',
  'redis-unavailable': 'Subdomains are not configured yet on the server.',
  'redis-error': 'Storage error. Try again in a moment.',
  'not-found': 'Subdomain not found on the server. Re-claim it.',
  'not-owner': 'You are not the owner of this subdomain.',
}

interface FormState {
  name: string
  tagline: string
  description: string
  productUrl: string
  targetUser: string
  problem: string
  solution: string
  mvp: string
}

function toForm(project: GeneratedProject): FormState {
  return {
    name: project.name ?? '',
    tagline: project.tagline ?? '',
    description: project.description ?? '',
    productUrl: project.productUrl ?? '',
    targetUser: project.brief?.targetUser ?? '',
    problem: project.brief?.problem ?? '',
    solution: project.brief?.solution ?? '',
    mvp: project.brief?.mvp ?? '',
  }
}

const NAME_MAX = 32
const TAGLINE_MAX = 90
const DESCRIPTION_MAX = 500
const BRIEF_FIELD_MAX = 280

export function EditProductModal({
  project,
  agent,
  agentId,
  onClose,
  accentColor = '#8b5cf6',
}: EditProductModalProps) {
  const updateGeneratedProject = useForgeStore((s) => s.updateGeneratedProject)
  const signer = useSolanaSigner()

  // Component is mounted only while the dialog is open (parent guards with
  // `{open && <EditProductModal ... />}`), so useState initialises fresh each
  // time the user opens the dialog — no reset-via-effect needed.
  const [form, setForm] = useState<FormState>(() => toForm(project))
  const [error, setError] = useState<string | null>(null)
  const [scamErrorDetails, setScamErrorDetails] = useState<string[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [urlChecking, setUrlChecking] = useState(false)

  // ── Subdomain publishing (independent of the field-edit save flow) ───────
  const [subdomainInput, setSubdomainInput] = useState(project.subdomain ?? '')
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishMessage, setPublishMessage] = useState<string | null>(null)

  const buildMirror = () => ({
    syncedAt: Date.now(),
    agent: {
      id: agent.id,
      name: agent.name,
      emoji: agent.emoji,
      stage: agent.stage,
      xp: agent.xp,
      personality: agent.personality,
      traits: agent.traits,
      totalInteractions: agent.totalInteractions,
      createdAt: agent.createdAt,
      walletAddress: agent.walletAddress,
    },
    project,
  })

  const handleClaim = async () => {
    setPublishError(null)
    setPublishMessage(null)
    const slug = subdomainInput.trim().toLowerCase()
    if (!slug) {
      setPublishError('Enter a subdomain.')
      return
    }
    if (!SUBDOMAIN_RE.test(slug) || slug.length < 3 || slug.length > 32) {
      setPublishError(SUBDOMAIN_ERROR_MESSAGES['invalid-format'])
      return
    }
    if (!signer.walletAddress) {
      setPublishError(SUBDOMAIN_ERROR_MESSAGES['invalid-wallet'])
      return
    }
    setPublishing(true)
    try {
      const res = await fetch('/api/subdomain/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain: slug,
          ownerWallet: signer.walletAddress,
          mirror: buildMirror(),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!data.ok) {
        const key = data.error ?? `http-${res.status}`
        setPublishError(SUBDOMAIN_ERROR_MESSAGES[key] ?? `Claim failed (${key}).`)
        setPublishing(false)
        return
      }
      const now = Date.now()
      updateGeneratedProject(agentId, {
        subdomain: slug,
        subdomainClaimedAt: now,
        subdomainLastSyncedAt: now,
      })
      setPublishMessage(`Live at ${slug}.solborn.xyz`)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Network error.')
    } finally {
      setPublishing(false)
    }
  }

  const handleSync = async () => {
    setPublishError(null)
    setPublishMessage(null)
    const slug = project.subdomain
    if (!slug) {
      setPublishError('No subdomain claimed yet.')
      return
    }
    if (!signer.walletAddress) {
      setPublishError(SUBDOMAIN_ERROR_MESSAGES['invalid-wallet'])
      return
    }
    setPublishing(true)
    try {
      const res = await fetch('/api/subdomain/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain: slug,
          ownerWallet: signer.walletAddress,
          mirror: buildMirror(),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!data.ok) {
        const key = data.error ?? `http-${res.status}`
        setPublishError(SUBDOMAIN_ERROR_MESSAGES[key] ?? `Republish failed (${key}).`)
        setPublishing(false)
        return
      }
      updateGeneratedProject(agentId, { subdomainLastSyncedAt: Date.now() })
      setPublishMessage(`Refreshed ${slug}.solborn.xyz`)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Network error.')
    } finally {
      setPublishing(false)
    }
  }

  // Lock body scroll while the modal is mounted (mobile UX).
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const change =
    (key: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value
      setForm((prev) => ({ ...prev, [key]: value }))
    }

  const isValidUrl = (raw: string): boolean => {
    try {
      const u = new URL(raw.trim())
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    setError(null)
    setScamErrorDetails(null)

    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }

    const productUrlRaw = form.productUrl.trim()
    const productUrlChanged = productUrlRaw !== (project.productUrl ?? '')

    if (productUrlRaw && !isValidUrl(productUrlRaw)) {
      setError('Product URL must start with http:// or https://')
      return
    }

    setSaving(true)
    let verified = project.productUrlVerified ?? false
    let verifiedAt = project.productUrlVerifiedAt

    try {
      // Only re-check when the URL actually changed and is non-empty.
      if (productUrlRaw && productUrlChanged) {
        setUrlChecking(true)
        const res = await fetch('/api/scam-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: productUrlRaw }),
        })
        const data = (await res.json().catch(() => ({}))) as {
          safe?: boolean
          threats?: string[]
          error?: string
        }
        setUrlChecking(false)

        if (!data.safe) {
          if (data.threats && data.threats.length > 0) {
            setError('This link was flagged by Safe Browsing — save blocked.')
            setScamErrorDetails(data.threats)
          } else if (data.error === 'check-disabled') {
            setError(
              'Scam-check is not configured on the server yet. Ask the operator to set GOOGLE_SAFE_BROWSING_API_KEY.'
            )
          } else if (data.error === 'timeout') {
            setError('Safe Browsing check timed out. Try again in a moment.')
          } else {
            setError('We could not verify this link — save blocked. Try a different URL.')
          }
          setSaving(false)
          return
        }
        verified = true
        verifiedAt = Date.now()
      } else if (!productUrlRaw) {
        // URL cleared — reset verification state.
        verified = false
        verifiedAt = undefined
      }

      const briefPatch: Partial<ProductBrief> = {
        ...(project.brief ?? {}),
        targetUser: form.targetUser.trim() || project.brief?.targetUser || '',
        problem: form.problem.trim() || project.brief?.problem || '',
        solution: form.solution.trim() || project.brief?.solution || '',
        mvp: form.mvp.trim() || project.brief?.mvp || '',
        pricing: project.brief?.pricing ?? '',
        solanaAngle: project.brief?.solanaAngle ?? '',
        launchPlan: project.brief?.launchPlan ?? [],
      }

      updateGeneratedProject(agentId, {
        name: form.name.trim().slice(0, NAME_MAX),
        tagline: form.tagline.trim().slice(0, TAGLINE_MAX) || undefined,
        description: form.description.trim().slice(0, DESCRIPTION_MAX),
        productUrl: productUrlRaw || undefined,
        productUrlVerified: productUrlRaw ? verified : false,
        productUrlVerifiedAt: productUrlRaw ? verifiedAt : undefined,
        brief: briefPatch as ProductBrief,
      })

      setSaving(false)
      onClose()
    } catch (err) {
      console.error('[EditProductModal] save failed', err)
      setError('Save failed. Try again.')
      setSaving(false)
      setUrlChecking(false)
    }
  }

  // Parent guards mounting via {editOpen && <EditProductModal ... />}, so this
  // component only exists while the dialog is meant to be visible. No exit
  // animation — instant close is fine for the v1 modal.
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3 sm:px-6 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      aria-modal="true"
      role="dialog"
    >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl"
            initial={{ y: 20, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              background: 'rgba(15,15,20,0.96)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${accentColor}40`,
            }}
          >
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5"
              style={{
                background: 'rgba(15,15,20,0.96)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <h2 className="text-base font-semibold text-zinc-100">Edit launch page</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-5 space-y-5">
              <Field
                label="Name"
                value={form.name}
                onChange={change('name')}
                placeholder={project.name}
                maxLength={NAME_MAX}
                required
              />

              <Field
                label="Tagline"
                value={form.tagline}
                onChange={change('tagline')}
                placeholder={project.tagline}
                maxLength={TAGLINE_MAX}
                hint="One-sentence pitch for the hero."
              />

              <Field
                label="Description"
                value={form.description}
                onChange={change('description')}
                placeholder={project.description}
                maxLength={DESCRIPTION_MAX}
                multiline
                hint="2-3 sentences. What does it do and why does it fit you."
              />

              <Field
                label="Product URL"
                value={form.productUrl}
                onChange={change('productUrl')}
                placeholder="https://yourdomain.com  (waitlist, repo, or app)"
                type="url"
                hint="Scam-checked via Google Safe Browsing before saving."
                trailing={
                  project.productUrlVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      verified
                    </span>
                  ) : null
                }
              />

              <fieldset className="space-y-3 pt-2 border-t border-white/5">
                <legend className="text-xs uppercase tracking-wider text-zinc-500 pt-3">
                  Brief
                </legend>
                <Field
                  label="Target user"
                  value={form.targetUser}
                  onChange={change('targetUser')}
                  placeholder={project.brief?.targetUser}
                  maxLength={BRIEF_FIELD_MAX}
                  multiline
                />
                <Field
                  label="Problem"
                  value={form.problem}
                  onChange={change('problem')}
                  placeholder={project.brief?.problem}
                  maxLength={BRIEF_FIELD_MAX}
                  multiline
                />
                <Field
                  label="Solution"
                  value={form.solution}
                  onChange={change('solution')}
                  placeholder={project.brief?.solution}
                  maxLength={BRIEF_FIELD_MAX}
                  multiline
                />
                <Field
                  label="MVP"
                  value={form.mvp}
                  onChange={change('mvp')}
                  placeholder={project.brief?.mvp}
                  maxLength={BRIEF_FIELD_MAX}
                  multiline
                />
              </fieldset>

              {/* Subdomain publishing — independent of the field save. */}
              <fieldset className="space-y-3 pt-2 border-t border-white/5">
                <legend className="text-xs uppercase tracking-wider text-zinc-500 pt-3 flex items-center gap-1.5">
                  <Globe className="w-3 h-3" />
                  Publish to a subdomain
                </legend>
                {project.subdomain ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                          Live at
                        </div>
                        <a
                          href={`https://${project.subdomain}.solborn.xyz/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-zinc-100 hover:text-violet-300 transition-colors inline-flex items-center gap-1.5 truncate"
                        >
                          {project.subdomain}.solborn.xyz
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={handleSync}
                        disabled={publishing}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                        }}
                      >
                        {publishing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Republishing…
                          </>
                        ) : (
                          <>Republish</>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-600">
                      Republish pushes the latest fields above to the public mirror. Visitors see
                      the new copy within a minute.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={subdomainInput}
                        onChange={(e) =>
                          setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                        }
                        placeholder="harmonia"
                        maxLength={32}
                        autoComplete="off"
                        spellCheck={false}
                        className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      />
                      <span className="text-sm text-zinc-500 whitespace-nowrap">.solborn.xyz</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClaim}
                      disabled={publishing || !subdomainInput.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                      }}
                    >
                      {publishing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Claiming…
                        </>
                      ) : (
                        <>Claim subdomain</>
                      )}
                    </button>
                    <p className="text-[11px] text-zinc-600">
                      Your product page will be reachable at{' '}
                      <span className="text-zinc-400">
                        {subdomainInput.trim() || 'yourname'}.solborn.xyz
                      </span>
                      . Lowercase letters, numbers, and hyphens. 3-32 chars.
                    </p>
                  </div>
                )}
                {publishError && (
                  <div
                    role="alert"
                    className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-2.5 py-1.5"
                  >
                    {publishError}
                  </div>
                )}
                {publishMessage && (
                  <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2.5 py-1.5">
                    {publishMessage}
                  </div>
                )}
              </fieldset>

              {error && (
                <div
                  className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2"
                  role="alert"
                >
                  {error}
                  {scamErrorDetails && scamErrorDetails.length > 0 && (
                    <div className="mt-1 text-xs text-rose-200/80">
                      Flagged for: {scamErrorDetails.join(', ').toLowerCase()}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-zinc-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: saving
                      ? 'rgba(139,92,246,0.6)'
                      : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                  }}
                >
                  {urlChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking link…
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-zinc-600 pt-1 flex items-start gap-1.5">
                <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>
                  Tech stack, launch plan and on-chain history stay agent-owned — only
                  the marketing copy and your product link are editable here.
                </span>
              </p>
            </form>
          </motion.div>
    </motion.div>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  placeholder?: string
  hint?: string
  maxLength?: number
  multiline?: boolean
  required?: boolean
  type?: string
  trailing?: React.ReactNode
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  maxLength,
  multiline = false,
  required = false,
  type = 'text',
  trailing,
}: FieldProps) {
  const baseClass =
    'w-full rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-shadow'
  const baseStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  }

  return (
    <label className="block space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-zinc-300">
          {label}
          {required && <span className="text-rose-400 ml-0.5">*</span>}
        </span>
        <div className="flex items-center gap-3">
          {trailing}
          {maxLength && (
            <span className="text-[10px] text-zinc-600 tabular-nums">
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      </div>

      {multiline ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          rows={2}
          className={`${baseClass} resize-y min-h-[60px]`}
          style={baseStyle}
        />
      ) : (
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          type={type}
          className={baseClass}
          style={baseStyle}
        />
      )}

      {hint && <p className="text-[11px] text-zinc-600">{hint}</p>}
    </label>
  )
}
