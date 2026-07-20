import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateSkills } from '@/core/memory/skills/lifecycle'
import { allSkills, clearSkills, getSkill, saveSkill } from '@/core/memory/skills/store'
import { testMeta, testSkill, verifiedTrajectory } from '../../helpers/skill-fixtures'

vi.mock('localforage', async () => (await import('../../helpers/memdb')).localforageMock())

describe('skill lifecycle after a run', () => {
  beforeEach(() => clearSkills())

  it('creates a shadow candidate once a goal repeats successfully', async () => {
    await updateSkills({ meta: testMeta(), events: verifiedTrajectory(), episodeRepeated: false })
    expect(await allSkills()).toHaveLength(0)

    await updateSkills({ meta: testMeta(), events: verifiedTrajectory(), episodeRepeated: true })
    const [created] = await allSkills()
    expect(created?.state).toBe('shadow')
    expect(created?.steps.length).toBeGreaterThanOrEqual(2)
    expect(created?.origins).toEqual(['https://portal.test'])
  })

  it('a matching shadow skill earns a success when the run agrees with it', async () => {
    await updateSkills({ meta: testMeta(), events: verifiedTrajectory(), episodeRepeated: true })
    const [created] = await allSkills()

    await updateSkills({
      meta: testMeta({ runId: 'r10' }),
      events: verifiedTrajectory(),
      episodeRepeated: true,
    })
    const after = await getSkill(created?.id ?? '')
    expect(after?.reliability.successCount).toBe(1)
  })

  it('a degraded skill gets repaired into a new shadow version after recovery', async () => {
    const degraded = testSkill({
      id: 'skill_old',
      state: 'degraded',
      steps: [
        {
          action: 'click',
          description: 'Click the "Settings" link',
          locator: { accessibleName: 'Settings', semanticDescription: 'the "Settings" link' },
        },
      ],
      reliability: { successCount: 3, failureCount: 2, consecutiveFailures: 2 },
    })
    await saveSkill(degraded)
    await updateSkills({
      meta: testMeta({ runId: 'r11' }),
      events: verifiedTrajectory(),
      episodeRepeated: false,
    })
    const repaired = (await allSkills()).find((s) => s.previousVersionId === 'skill_old')
    expect(repaired?.version).toBe(2)
    expect(repaired?.state).toBe('shadow')
    expect((await getSkill('skill_old'))?.state).toBe('degraded')
  })

  it('failed runs reinforce nothing', async () => {
    await updateSkills({
      meta: testMeta({ outcome: 'error' }),
      events: verifiedTrajectory(),
      episodeRepeated: true,
    })
    expect(await allSkills()).toHaveLength(0)
  })
})
