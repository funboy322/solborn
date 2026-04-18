// Smoke test for Upstash Vector memory layer.
// Run: node --env-file=.env.local scripts/test-memory.mjs

import { Index } from '@upstash/vector'

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
})

const info = await index.info()
console.log('Index info:', info)

const agentId = 'test-agent-1'
const now = Date.now()

await index.upsert([
  {
    id: `fact:${agentId}:${now}:0`,
    data: 'The teacher Ilya is building an AMM on Solana with constant product formula.',
    metadata: { kind: 'fact', agentId, topic: 'user_personal', text: 'Ilya builds AMM', createdAt: now },
  },
  {
    id: `fact:${agentId}:${now}:1`,
    data: 'Anchor is a Rust framework for Solana programs.',
    metadata: { kind: 'fact', agentId, topic: 'solana', text: 'Anchor = Rust framework', createdAt: now },
  },
])
console.log('Upserted 2 facts')

// Give the index a second to embed + index
await new Promise((r) => setTimeout(r, 2000))

const res = await index.query({
  data: 'What does the user build?',
  topK: 3,
  includeMetadata: true,
  filter: `kind = "fact" AND agentId = "${agentId}"`,
})
console.log('Query results:')
for (const r of res) {
  console.log(`  score=${r.score?.toFixed(3)} text="${r.metadata?.text}"`)
}

// Cleanup
await index.delete([`fact:${agentId}:${now}:0`, `fact:${agentId}:${now}:1`])
console.log('Cleaned up')
