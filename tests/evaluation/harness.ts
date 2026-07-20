import { learnFromRun } from '@/core/memory/learn'
import { createRunLedger } from '@/core/memory/ledger/run-ledger'
import { getRun } from '@/core/memory/ledger/store'
import { admitCandidate } from '@/core/memory/pipeline/admit'
import { type MemoryBundle, retrieveBundle } from '@/core/memory/retrieval/bundle'
import { renderBundle } from '@/core/memory/retrieval/inject'
import type { RunMeta } from '@/shared/memory/events'
import { newId } from '@/shared/memory/ids'
import { runInvoiceTask } from './planner'
import { type NavVersion, ORIGIN, SimBrowser } from './portal-sim'

export const GOAL = 'download the newest invoice from the billing portal'

/** Ablation configurations (docs/memory-agent/evaluation.md). */
export type EvalConfig = 'no-memory' | 'facts' | 'facts+episodes' | 'full'

function ablate(bundle: MemoryBundle, config: EvalConfig): MemoryBundle {
  if (config === 'facts') return { ...bundle, episodes: [], warnings: [], skills: [] }
  if (config === 'facts+episodes') return { ...bundle, skills: [] }
  return bundle
}

export interface SessionResult {
  meta: RunMeta
  modelCalls: number
  /** Characters of memory context injected — the context-efficiency metric. */
  contextChars: number
}

/**
 * One complete task session through the real subsystem: retrieval → scripted
 * planner on the portal simulator (real ledger events) → finalize → post-run
 * learning from the persisted ledger. Only the DOM is simulated.
 */
export async function runSession(
  taskId: string,
  version: NavVersion,
  config: EvalConfig,
): Promise<SessionResult> {
  const runId = newId('run')
  const ledger = createRunLedger(taskId, runId, GOAL)
  ledger.log('TaskCreated', {}, { actor: 'user' })

  const bundle = config === 'no-memory' ? null : ablate(await retrieveBundle(GOAL, ORIGIN), config)
  const contextChars = bundle ? (renderBundle(bundle)?.length ?? 0) : 0

  const browser = new SimBrowser(version, ledger)
  const { completed, modelCalls } = await runInvoiceTask(browser, bundle)
  ledger.metrics.modelCalls = modelCalls

  // What extraction would mine from this run, built deterministically here:
  // the observed billing location as a slot-keyed site fact.
  if (completed && config !== 'no-memory') {
    const via = version === 1 ? 'Settings' : 'Account'
    await admitCandidate({
      proposedKind: 'site_knowledge',
      summary: `Billing is under the ${via} menu.`,
      structuredContent: {},
      slotKey: 'billing-location',
      scope: { level: 'site', origin: ORIGIN },
      provenance: { source: 'successful_episode', eventIds: [], runIds: [runId] },
      confidence: 0.8,
      sensitivity: 'internal',
      websiteSupplied: false,
      expectedValue: 'site_navigation',
      recommendedDecision: 'store',
    })
  }

  await ledger.finalize(completed ? 'completed' : 'error')
  if (config !== 'no-memory') await learnFromRun(runId)

  const meta = await getRun(runId)
  if (!meta) throw new Error('run meta missing')
  return { meta, modelCalls, contextChars }
}
