import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  recordSkillFailure,
  recordSkillSuccess,
  trustSkill,
} from '@/core/memory/skills/reliability'
import { repairSkill } from '@/core/memory/skills/repair'
import { evaluateShadow } from '@/core/memory/skills/shadow'
import { allSkills, clearSkills, getSkill, saveSkill } from '@/core/memory/skills/store'
import { testEvent, testMeta, testSkill, verifiedTrajectory } from '../../helpers/skill-fixtures'

vi.mock('localforage', async () => (await import('../../helpers/memdb')).localforageMock())

describe('skill reliability state machine', () => {
  beforeEach(() => clearSkills())

  it('promotes shadow → verified after enough verified successes', async () => {
    const s = testSkill()
    await saveSkill(s)
    await recordSkillSuccess(s.id)
    expect((await getSkill(s.id))?.state).toBe('shadow')
    await recordSkillSuccess(s.id)
    await recordSkillSuccess(s.id)
    const after = await recordSkillSuccess(s.id)
    expect(after?.state).toBe('verified')
    expect(after?.reliability.successCount).toBe(4)
  })

  it('degrades after consecutive failures and a success resets the streak', async () => {
    const s = testSkill({ state: 'verified' })
    await saveSkill(s)
    await recordSkillFailure(s.id, 'element_not_found')
    expect((await getSkill(s.id))?.state).toBe('verified')
    await recordSkillSuccess(s.id)
    await recordSkillFailure(s.id, 'element_not_found')
    await recordSkillFailure(s.id, 'element_not_found')
    expect((await getSkill(s.id))?.state).toBe('degraded')
  })

  it('only the user grants trusted', async () => {
    const s = testSkill()
    await saveSkill(s)
    expect((await trustSkill(s.id))?.state).toBe('trusted')
  })
})

describe('shadow evaluation and repair', () => {
  beforeEach(() => clearSkills())

  it('agrees when the skill steps appear in order in the real trajectory', () => {
    expect(evaluateShadow(testSkill(), verifiedTrajectory()).agreed).toBe(true)
  })

  it('reports mismatches when the page changed and steps no longer appear', () => {
    const events = [
      testEvent('ActionStarted', { tool: 'click', name: 'Account', role: 'link' }),
      testEvent('OutcomeVerified', { tool: 'click', outcome: 'verified_success' }),
    ]
    const verdict = evaluateShadow(testSkill(), events)
    expect(verdict.agreed).toBe(false)
    expect(verdict.mismatches.length).toBeGreaterThan(0)
  })

  it('repair creates a shadow next version preserving the degraded original', async () => {
    const degraded = testSkill({ state: 'degraded' })
    await saveSkill(degraded)
    const events = [
      testEvent('ActionStarted', { tool: 'click', name: 'Account', role: 'link' }),
      testEvent('OutcomeVerified', { tool: 'click', outcome: 'verified_success' }),
      testEvent('ActionStarted', { tool: 'click', name: 'Download', role: 'button' }),
      testEvent('OutcomeVerified', { tool: 'click', outcome: 'verified_success' }),
    ]
    const repaired = await repairSkill(degraded, testMeta({ runId: 'r2' }), events)
    expect(repaired?.version).toBe(2)
    expect(repaired?.state).toBe('shadow')
    expect(repaired?.previousVersionId).toBe(degraded.id)
    expect(repaired?.name).toBe(degraded.name)
    // Both versions exist: history preserved.
    expect((await allSkills()).map((s) => s.id)).toContain(degraded.id)
  })
})
