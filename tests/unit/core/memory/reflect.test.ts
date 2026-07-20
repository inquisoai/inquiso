import { describe, expect, it } from 'vitest'
import { buildReflections } from '@/core/memory/pipeline/reflect'
import { LedgerEvent, RunMeta } from '@/shared/memory/events'

const meta = (over: Record<string, unknown> = {}): RunMeta =>
  RunMeta.parse({
    taskId: 't1',
    runId: 'run_1',
    goal: 'download the newest invoice',
    startedAt: 1000,
    endedAt: 61_000,
    outcome: 'completed',
    metrics: { actions: 5, failures: 1, recoveries: 1, modelCalls: 6, tokens: 900 },
    origins: ['https://portal.test'],
    ...over,
  })

const evt = (seq: number, type: string, payload: Record<string, unknown> = {}): LedgerEvent =>
  LedgerEvent.parse({
    id: `evt_${seq}`,
    taskId: 't1',
    runId: 'run_1',
    seq,
    at: seq,
    actor: 'agent',
    type,
    payload,
    page: { url: 'https://portal.test/billing' },
  })

const events = [
  evt(1, 'ActionStarted', { tool: 'click' }),
  evt(2, 'ActionFailed', { tool: 'click', error: 'element_not_found' }),
  evt(3, 'ActionStarted', { tool: 'click' }),
  evt(4, 'OutcomeVerified', { tool: 'click', outcome: 'verified_success' }),
  evt(5, 'OutcomeVerified', { tool: 'navigate', outcome: 'verified_success' }),
]

describe('failure reflections', () => {
  it('turns a failure→recovery arc into a slot-keyed lesson', () => {
    const [r] = buildReflections(meta(), events)
    expect(r?.proposedKind).toBe('reflection')
    expect(r?.slotKey).toBe('reflect:click:element_not_found')
    expect(r?.summary).toContain('element_not_found')
    expect(r?.summary).toContain('recover')
    expect(r?.expectedValue).toBe('failure_avoidance')
  })

  it('an unrecovered failure warns about preconditions instead', () => {
    const [r] = buildReflections(meta({ outcome: 'error' }), events.slice(0, 2))
    expect(r?.summary).toContain('not recovered')
    expect(r?.provenance.source).toBe('failed_episode')
  })

  it('transient environment errors never become lessons', () => {
    const envFailures = [
      evt(10, 'ActionStarted', { tool: 'readPage' }),
      evt(11, 'ActionFailed', { tool: 'readPage', error: 'page_access_needed' }),
      evt(12, 'ActionStarted', { tool: 'click' }),
      evt(13, 'ActionFailed', { tool: 'click', error: 'user_rejected' }),
      evt(14, 'ActionStarted', { tool: 'readPage' }),
      evt(15, 'ActionFailed', {
        tool: 'readPage',
        error:
          'Cannot access contents of url "https://a.test". Extension manifest must request permission.',
      }),
    ]
    expect(buildReflections(meta(), envFailures)).toHaveLength(0)
  })
})
