import type { MemoryCandidate } from '@/shared/memory/candidate'
import type { LedgerEvent, RunMeta } from '@/shared/memory/events'

/** Verified steps in order — the episode's reusable strategy skeleton. */
export function verifiedStrategy(events: LedgerEvent[]): string[] {
  return events
    .filter((e) => e.type === 'OutcomeVerified' && e.payload.outcome === 'verified_success')
    .map((e) => `${String(e.payload.tool)} on ${e.page?.url ?? 'page'}`)
}

const failuresOf = (events: LedgerEvent[]): string[] =>
  events
    .filter((e) => e.type === 'ActionFailed')
    .map((e) => `${String(e.payload.tool)}: ${String(e.payload.error ?? 'failed')}`)

/** Tools that actually drive the browser — the substance a reusable episode
 * is made of. Pure-read runs (summarize, Q&A) never mint episodes. */
const ACT_TOOLS = new Set([
  'click',
  'type',
  'navigate',
  'selectOption',
  'submitForm',
  'runSkill',
  'downloadFile',
  'exportData',
])

const hasBrowserActivity = (events: LedgerEvent[]): boolean =>
  events.some((e) => e.type === 'ActionStarted' && ACT_TOOLS.has(String(e.payload.tool)))

/**
 * Compresses one run into an episode candidate — deterministically, straight
 * from typed ledger events (no model in the loop, so it works even without an
 * extraction model and never hallucinates provenance). Trivial runs (no
 * actions, or read-only ones) produce nothing: not every interaction deserves
 * an episode.
 */
export function buildEpisode(meta: RunMeta, events: LedgerEvent[]): MemoryCandidate | null {
  if (meta.metrics.actions === 0 || !hasBrowserActivity(events)) return null
  const success = meta.outcome === 'completed'
  const origin = meta.origins[0]
  const summary =
    `${success ? 'Completed' : 'Did not complete'}: ${meta.goal} ` +
    `(${meta.metrics.actions} actions, ${meta.metrics.failures} failures, ` +
    `${meta.metrics.recoveries} recoveries)`
  return {
    proposedKind: 'episode',
    summary: summary.slice(0, 500),
    structuredContent: {
      goal: meta.goal,
      outcome: meta.outcome ?? 'interrupted',
      strategy: verifiedStrategy(events).slice(0, 30),
      failures: failuresOf(events).slice(0, 10),
      metrics: meta.metrics,
      origins: meta.origins,
      durationMs: (meta.endedAt ?? meta.startedAt) - meta.startedAt,
    },
    scope: origin ? { level: 'site', origin } : { level: 'user' },
    provenance: {
      source: success ? 'successful_episode' : 'failed_episode',
      eventIds: events.slice(0, 50).map((e) => e.id),
      runIds: [meta.runId],
    },
    confidence: success ? 0.8 : 0.6,
    sensitivity: 'internal',
    websiteSupplied: false,
    expectedValue: 'workflow_reuse',
    recommendedDecision: 'store',
  }
}
