import { describe, expect, it } from 'vitest'
import { buildEpisode } from '@/core/memory/pipeline/episode'
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

describe('episode compression', () => {
  it('builds a site-scoped episode with strategy, failures, and provenance', () => {
    const c = buildEpisode(meta(), events)
    expect(c?.proposedKind).toBe('episode')
    expect(c?.scope).toEqual({ level: 'site', origin: 'https://portal.test' })
    expect(c?.provenance.source).toBe('successful_episode')
    expect(c?.provenance.runIds).toEqual(['run_1'])
    const content = c?.structuredContent as { strategy: string[]; failures: string[] }
    expect(content.strategy).toHaveLength(2)
    expect(content.failures).toEqual(['click: element_not_found'])
  })

  it('a failed run yields a failed_episode with lower confidence', () => {
    const c = buildEpisode(meta({ outcome: 'error' }), events)
    expect(c?.provenance.source).toBe('failed_episode')
    expect(c?.confidence).toBeLessThan(0.8)
  })

  it('trivial runs (no actions) produce no episode', () => {
    expect(
      buildEpisode(
        meta({ metrics: { actions: 0, failures: 0, recoveries: 0, modelCalls: 1, tokens: 10 } }),
        [],
      ),
    ).toBeNull()
  })

  it('read-only runs (summarize/Q&A) produce no episode', () => {
    const readOnly = [
      evt(1, 'ActionStarted', { tool: 'readPage' }),
      evt(2, 'ActionSucceeded', { tool: 'readPage' }),
    ]
    expect(
      buildEpisode(
        meta({ metrics: { actions: 1, failures: 0, recoveries: 0, modelCalls: 2, tokens: 50 } }),
        readOnly,
      ),
    ).toBeNull()
  })
})
