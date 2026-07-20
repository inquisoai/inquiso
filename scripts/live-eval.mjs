// Live cross-session evaluation against the REAL extension (no simulator):
// session 1 runs the flagship task on an empty profile, the browser process
// is then fully restarted (fresh service worker, persisted IndexedDB), and
// session 2 repeats the task so memory retrieval/persistence is proven on
// the production turn path. Requires a dev build (pre-granted localhost) and
// a Qwen key:
//
//   INQUISO_QWEN_KEY=sk-... node scripts/live-eval.mjs
//
// Optional: INQUISO_EVAL_MODEL (default qwen-plus), INQUISO_EVAL_GOAL,
// --skip-build to reuse .output/chrome-mv3-dev. Without a key the harness still
// exercises the whole path and records the missing_api_key failure — useful
// for mechanics checks, never presented as an evaluation result.
import { execSync, spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runSession } from './live-eval-session.mjs'

const KEY = process.env.INQUISO_QWEN_KEY
const MODEL = process.env.INQUISO_EVAL_MODEL ?? 'qwen-plus'
const GOAL = process.env.INQUISO_EVAL_GOAL ?? 'Download the newest invoice from this page.'
const PORTAL = 'http://localhost:8788/invoice/'

const summarize = (r) => ({
  runId: r.run?.runId ?? null,
  status: r.run?.status ?? null,
  actions: r.run?.metrics?.actions ?? null,
  failed: r.run?.metrics?.failedActions ?? null,
  modelCalls: r.run?.metrics?.modelCalls ?? null,
  events: r.events.length,
  memories: r.memories.length,
  skills: r.skills,
  autoApproved: r.autoApproved,
  emitted: r.outbound.filter((m) => m.type === 'error').map((m) => m.error),
  error: r.error ?? null,
})

if (!process.argv.includes('--skip-build')) {
  console.log('building dev extension (live-eval hooks + localhost grant)…')
  execSync('pnpm exec wxt build --mode development', { stdio: 'inherit' })
}
const demo = spawn('node', ['scripts/serve-demo.mjs'], { stdio: 'ignore' })
await new Promise((resolve) => setTimeout(resolve, 800))

try {
  const profileDir = mkdtempSync(join(tmpdir(), 'inquiso-live-eval-'))
  console.log(`profile: ${profileDir}\nsession 1 (empty memory)…`)
  const first = await runSession({
    profileDir,
    portalUrl: PORTAL,
    goal: GOAL,
    key: KEY,
    model: MODEL,
  })
  console.log('session 1:', JSON.stringify(summarize(first)))

  console.log('restarting browser (fresh service worker, persisted stores)…')
  const second = await runSession({
    profileDir,
    portalUrl: PORTAL,
    goal: GOAL,
    key: KEY,
    model: MODEL,
  })
  console.log('session 2:', JSON.stringify(summarize(second)))

  const results = {
    recordedAt: new Date().toISOString(),
    goal: GOAL,
    model: KEY ? MODEL : 'NO KEY PROVIDED — mechanics check only, not an evaluation',
    portal: PORTAL,
    sessions: [first, second],
    summary: { first: summarize(first), second: summarize(second) },
  }
  if (KEY) {
    mkdirSync('artifacts/evaluation', { recursive: true })
    writeFileSync('artifacts/evaluation/live-results.json', JSON.stringify(results, null, 2))
    console.log('wrote artifacts/evaluation/live-results.json')
  } else {
    console.log('no INQUISO_QWEN_KEY — results NOT persisted (mechanics check only)')
  }
} finally {
  demo.kill()
}
