import {
  type EventType,
  LedgerEvent,
  type PageRef,
  RunMeta,
  type RunMetrics,
  type RunOutcome,
} from '@/shared/memory/events'
import type { ActionEvidence } from '@/shared/memory/evidence'
import { newId } from '@/shared/memory/ids'
import { createLogger } from '@/shared/util/logger'
import { putEvent, saveRun } from './store'

const log = createLogger('ledger')

export interface LogExtra {
  evidence?: ActionEvidence[]
  page?: PageRef
  actor?: 'user' | 'agent' | 'system' | 'skill'
}

/** Typed append-only recorder for one run. `log` is fire-and-forget but writes
 * are chained, so on-disk order always matches emission order. */
export interface RunLedger {
  taskId: string
  runId: string
  metrics: RunMetrics
  seq: () => number
  log: (type: EventType, payload?: Record<string, unknown>, extra?: LogExtra) => void
  finalize: (outcome: RunOutcome) => Promise<void>
}

export function createRunLedger(taskId: string, runId: string, goal: string): RunLedger {
  let seq = 0
  let failedSinceSuccess = false
  let chain: Promise<unknown> = Promise.resolve()
  const startedAt = Date.now()
  const origins: string[] = []
  const metrics: RunMetrics = { actions: 0, failures: 0, recoveries: 0, modelCalls: 0, tokens: 0 }

  const meter = (type: EventType): void => {
    if (type === 'ActionStarted') metrics.actions += 1
    if (type === 'ActionFailed') {
      metrics.failures += 1
      failedSinceSuccess = true
    }
    // A success after an earlier failure in the same run counts as a recovery.
    if (type === 'ActionSucceeded' && failedSinceSuccess) {
      metrics.recoveries += 1
      failedSinceSuccess = false
    }
  }

  const ledger: RunLedger = {
    taskId,
    runId,
    metrics,
    seq: () => seq,
    log(type, payload = {}, extra = {}) {
      seq += 1
      meter(type)
      if (extra.page?.origin && !origins.includes(extra.page.origin))
        origins.push(extra.page.origin)
      const event = LedgerEvent.parse({
        id: newId('evt'),
        taskId,
        runId,
        seq,
        at: Date.now(),
        actor: extra.actor ?? 'agent',
        type,
        payload,
        ...(extra.page ? { page: extra.page } : {}),
        ...(extra.evidence ? { evidence: extra.evidence } : {}),
      })
      chain = chain.then(() => putEvent(event)).catch((e) => log.warn('event write failed', e))
    },
    async finalize(outcome) {
      ledger.log(outcome === 'completed' ? 'TaskCompleted' : 'TaskAborted', { outcome })
      await chain
      await saveRun(
        RunMeta.parse({
          taskId,
          runId,
          goal,
          startedAt,
          endedAt: Date.now(),
          outcome,
          metrics,
          origins,
        }),
      )
    },
  }
  return ledger
}
