import { afterAll, describe, expect, it, vi } from 'vitest'
import { type EvalConfig, runSession, type SessionResult } from './harness'
import { resetStores, writeMetrics } from './reset'

vi.mock('localforage', async () => (await import('../unit/helpers/memdb')).localforageMock())
vi.mock('@/core/data/settings/store', () => ({
  getSettings: async () => ({
    providerId: 'none',
    models: {},
    customProviders: [],
    memory: { autoLearn: true, disabledOrigins: [] },
  }),
  getCustomProviders: async () => [],
}))
vi.mock('@/core/memory/retrieval/embed', () => ({
  semanticScores: async () => new Map<string, number>(),
}))

const CONFIGS: EvalConfig[] = ['no-memory', 'facts', 'facts+episodes', 'full']
const SESSIONS = 3
const results: Record<string, SessionResult[]> = {}

describe('repeated-task improvement across memory configurations', () => {
  it('measures three sessions per configuration on portal v1', async () => {
    for (const config of CONFIGS) {
      await resetStores()
      const sessions: SessionResult[] = []
      for (let i = 0; i < SESSIONS; i += 1) {
        sessions.push(await runSession(`task-${config}`, 1, config))
      }
      results[config] = sessions
      expect(sessions.every((s) => s.meta.outcome === 'completed')).toBe(true)
    }
  }, 30_000)

  it('without memory, every session pays the full exploration cost', () => {
    const [a, b, c] = results['no-memory'] ?? []
    expect(a?.meta.metrics.actions).toBe(b?.meta.metrics.actions)
    expect(b?.meta.metrics.actions).toBe(c?.meta.metrics.actions)
    expect(a?.contextChars).toBe(0)
  })

  it('site facts cut actions and failures from the second session on', () => {
    const facts = results.facts ?? []
    expect(facts[1]?.meta.metrics.actions).toBeLessThan(facts[0]?.meta.metrics.actions ?? 0)
    expect(facts[1]?.meta.metrics.failures).toBe(0)
  })

  it('a learned workflow cuts planning calls below the facts-only config', () => {
    const full = results.full ?? []
    expect(full[2]?.modelCalls).toBeLessThan(full[0]?.modelCalls ?? 0)
    expect(full[2]?.modelCalls).toBeLessThanOrEqual(results.facts?.[2]?.modelCalls ?? 0)
    expect(full[2]?.meta.metrics.failures).toBe(0)
  })

  it('memory context stays compact (< 2000 chars injected)', () => {
    for (const sessions of Object.values(results)) {
      for (const s of sessions) expect(s.contextChars).toBeLessThan(2000)
    }
  })
})

afterAll(() => {
  writeMetrics('improvement', {
    goal: 'download the newest invoice from the billing portal (portal v1)',
    sessionsPerConfig: SESSIONS,
    configs: Object.fromEntries(
      Object.entries(results).map(([config, sessions]) => [
        config,
        sessions.map((s) => ({
          actions: s.meta.metrics.actions,
          failures: s.meta.metrics.failures,
          recoveries: s.meta.metrics.recoveries,
          modelCalls: s.modelCalls,
          contextChars: s.contextChars,
          outcome: s.meta.outcome,
        })),
      ]),
    ),
  })
})
