import type { StepResult, ToolSet } from 'ai'
import { describe, expect, it } from 'vitest'
import { guardedStep, OBSERVATION_TOOLS } from '@/core/agent/loop/phases'

const base = ({ stepNumber }: { stepNumber: number }) => (stepNumber === 0 ? {} : { messages: [] })

const step = (outcomes: string[]): StepResult<ToolSet> =>
  ({
    toolCalls: [],
    toolResults: outcomes.map((o, i) => ({
      toolCallId: `c${i}`,
      output: { ok: true, verification: { outcome: o } },
    })),
  }) as unknown as StepResult<ToolSet>

const bare = (): StepResult<ToolSet> =>
  ({ toolCalls: [], toolResults: [] }) as unknown as StepResult<ToolSet>

const OBS = ['readPage', 'queryElements']

describe('guardedStep (forced re-observation)', () => {
  it('restricts to observation tools after an all-uncertain step', () => {
    const patch = guardedStep(
      base,
      OBS,
    )({
      stepNumber: 2,
      messages: [],
      steps: [step(['verified_success']), step(['uncertain', 'uncertain'])],
    })
    expect(patch.activeTools).toEqual(OBS)
    expect(patch.messages).toEqual([]) // base compaction still applied
  })

  it('leaves tools unrestricted after verified or mixed outcomes', () => {
    for (const last of [step(['verified_success']), step(['uncertain', 'verified_success'])]) {
      const patch = guardedStep(base, OBS)({ stepNumber: 2, messages: [], steps: [last] })
      expect(patch.activeTools).toBeUndefined()
    }
  })

  it('text-only steps (no tool results) never trigger the restriction', () => {
    const patch = guardedStep(base, OBS)({ stepNumber: 1, messages: [], steps: [bare()] })
    expect(patch.activeTools).toBeUndefined()
  })

  it('the observation set includes completion so a restricted step can still end the run', () => {
    expect(OBSERVATION_TOOLS).toContain('completeTask')
    expect(OBSERVATION_TOOLS).toContain('readPage')
  })
})
