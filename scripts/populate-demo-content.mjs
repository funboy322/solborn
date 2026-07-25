#!/usr/bin/env node
/**
 * One-shot script: fill in landingContent + launchThread for the 5 demo
 * subdomains that were claimed with only a brief. Hits the local Next dev
 * server's /api/landing/generate and /api/thread/generate (which run the
 * tightened memecoin prompts), then patches the Redis mirror in place so
 * visitors of <slug>.solborn.xyz see a full launch page instead of a stub.
 *
 * Run:  node scripts/populate-demo-content.mjs
 * Requires: dev server on localhost:3000 + .env.local with UPSTASH_REDIS_*
 */
import { readFileSync } from 'node:fs'
import { Redis } from '@upstash/redis'

// Load .env.local manually — no dotenv dependency needed.
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const SLUGS = ['gigacat', 'purpl', 'morn', 'devkek', 'rockbot']

async function fetchWithRetry(url, body, attempts = 2) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) return res.json()
      const err = await res.json().catch(() => ({}))
      console.log(`    HTTP ${res.status}: ${JSON.stringify(err)}`)
      if (err.error === 'rate-limited' && err.retryInMs) {
        console.log(`    cooldown, waiting ${Math.ceil(err.retryInMs / 1000)}s`)
        await new Promise((r) => setTimeout(r, err.retryInMs + 500))
        continue
      }
      throw new Error(`http ${res.status}`)
    } catch (e) {
      console.log(`    attempt ${i + 1} failed: ${e.message}`)
      if (i === attempts - 1) throw e
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
}

for (const slug of SLUGS) {
  console.log(`\n=== ${slug} ===`)
  const mirror = await redis.get(`subdomain:mirror:${slug}`)
  if (!mirror) {
    console.log('  mirror missing, skipping')
    continue
  }
  const { agent, project } = mirror

  // Unique agentId per attempt so per-agent cooldown doesn't collide across
  // rapid re-runs of this script; the mirror still uses the real agent.id.
  const stamped = `${agent.id}-populate-${Date.now()}`

  const body = {
    agentId: stamped,
    projectId: project.id,
    agent: { ...agent, id: stamped },
    project,
  }

  console.log('  landing...')
  const landing = await fetchWithRetry('http://localhost:3000/api/landing/generate', body)
  console.log(`    ok. lore paragraphs: ${landing.lore?.length ?? 0}`)

  // Fresh stamp for thread endpoint's own per-agent rate limit.
  body.agentId = `${agent.id}-thread-${Date.now()}`
  body.agent.id = body.agentId

  console.log('  thread...')
  const thread = await fetchWithRetry('http://localhost:3000/api/thread/generate', body)
  console.log(`    ok. tweets: ${thread.tweets?.length ?? 0}`)

  // Restore real agent.id in the mirror we write back.
  const updated = {
    ...mirror,
    syncedAt: Date.now(),
    project: {
      ...project,
      landingContent: landing,
      launchThread: thread,
    },
  }
  await redis.set(`subdomain:mirror:${slug}`, updated)
  console.log(`  mirror updated (syncedAt=${updated.syncedAt})`)
}

console.log('\ndone. visit any <slug>.solborn.xyz after ISR window (60s).')
