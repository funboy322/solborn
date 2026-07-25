import { readFileSync } from 'node:fs'
import { Redis } from '@upstash/redis'
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
}
const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
const mirror = await redis.get(`subdomain:mirror:${process.argv[2] || 'gigacat'}`)
const lc = mirror?.project?.landingContent
const lt = mirror?.project?.launchThread
console.log('=== HERO ===')
console.log(`  ${lc?.hero?.headline}`)
console.log(`  ${lc?.hero?.subhead}`)
console.log('\n=== LORE ===')
lc?.lore?.forEach((p, i) => {
  console.log(`[${i+1}] (${p.split(/\s+/).length}w)`)
  console.log(`    ${p}\n`)
})
console.log('=== TOKENOMICS ===')
lc?.tokenomics?.forEach(t => console.log(`  ${t.label}: ${t.value}`))
console.log('\n=== TWEETS ===')
lt?.tweets?.forEach((t, i) => console.log(`[${i+1}] (${t.length}c) ${t}`))
