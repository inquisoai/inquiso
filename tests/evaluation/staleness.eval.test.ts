import { afterAll, describe, expect, it, vi } from 'vitest'
import { retrieveBundle } from '@/core/memory/retrieval/bundle'
import { trustSkill } from '@/core/memory/skills/reliability'
import { allSkills } from '@/core/memory/skills/store'
import { listMemories } from '@/core/memory/store/query'
import { runSession, type SessionResult } from './harness'
import { ORIGIN } from './portal-sim'
import { resetStores, sessionMetrics, writeMetrics } from './reset'

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

const sessions: Record<string, SessionResult> = {}

describe('stale memory detection, degradation, and repair (the site changed)', () => {
  it('learns the workflow on v1 and the user trusts it', async () => {
    await resetStores()
    sessions.v1a = await runSession('task-stale', 1, 'full')
    sessions.v1b = await runSession('task-stale', 1, 'full')
    sessions.v1c = await runSession('task-stale', 1, 'full')
    const [skill] = await allSkills()
    expect(skill?.state).toBe('shadow')
    await trustSkill(skill?.id ?? '')
  }, 30_000)

  it('v2 breaks the workflow; the run still completes via recovery', async () => {
    sessions.v2a = await runSession('task-stale', 2, 'full')
    expect(sessions.v2a?.meta.outcome).toBe('completed')
    expect(sessions.v2a?.meta.metrics.failures).toBeGreaterThan(0)
    expect(sessions.v2a?.meta.metrics.recoveries).toBeGreaterThan(0)
  }, 30_000)

  it('the outdated navigation fact is superseded, not deleted', async () => {
    const current = await listMemories({
      kind: 'site_knowledge',
      currentOnly: true,
      origin: ORIGIN,
    })
    const billing = current.filter((m) => m.slotKey === 'billing-location')
    expect(billing).toHaveLength(1)
    expect(billing[0]?.summary).toContain('Account')
    const all = await listMemories({ kind: 'site_knowledge', origin: ORIGIN })
    const superseded = all.find(
      (m) => m.status === 'superseded' && m.slotKey === 'billing-location',
    )
    expect(superseded?.summary).toContain('Settings')
    expect(superseded?.temporal.validUntil).toBeDefined()
    expect(superseded?.relations.contradictedById).toBe(billing[0]?.id)
  })

  it('a second broken run degrades the skill and repair mints a shadow v2', async () => {
    sessions.v2b = await runSession('task-stale', 2, 'full')
    const all = await allSkills()
    const degraded = all.find((s) => s.state === 'degraded')
    const repaired = all.find((s) => s.previousVersionId === degraded?.id)
    expect(degraded).toBeDefined()
    expect(repaired?.state).toBe('shadow')
    expect(repaired?.version).toBe((degraded?.version ?? 0) + 1)
  }, 30_000)

  it('the repaired workflow restores second-run efficiency on v2', async () => {
    sessions.v2c = await runSession('task-stale', 2, 'full')
    expect(sessions.v2c?.meta.metrics.failures).toBe(0)
    expect(sessions.v2c?.modelCalls).toBeLessThan(sessions.v2a?.modelCalls ?? 0)
    expect(sessions.v2c?.meta.metrics.actions).toBeLessThan(sessions.v2a?.meta.metrics.actions ?? 0)
  }, 30_000)

  it('retrieval never suggests the superseded fact or the retired path', async () => {
    const bundle = await retrieveBundle(
      'download the newest invoice from the billing portal',
      ORIGIN,
    )
    expect(bundle.siteFacts.every((m) => !m.summary.includes('Settings'))).toBe(true)
    expect(bundle.skills.every((s) => s.state !== 'degraded')).toBe(true)
  })
})

afterAll(() => {
  writeMetrics('staleness', {
    story: 'v1 learned+trusted → v2 breaks → recover+supersede → degrade+repair → efficient again',
    sessions: Object.fromEntries(Object.entries(sessions).map(([k, s]) => [k, sessionMetrics(s)])),
  })
})
