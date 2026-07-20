import { describe, expect, it } from 'vitest'
import { RunCallOptions, runContextInstructions } from '@/core/agent/loop/call-options'

describe('RunCallOptions (agent callOptionsSchema)', () => {
  it('validates and defaults the execution mode', () => {
    const parsed = RunCallOptions.parse({ taskId: 't1', runId: 'r1' })
    expect(parsed.executionMode).toBe('normal')
  })

  it('rejects missing ids and unknown modes (SDK validates on every call)', () => {
    expect(RunCallOptions.safeParse({ runId: 'r1' }).success).toBe(false)
    expect(
      RunCallOptions.safeParse({ taskId: 't1', runId: 'r1', executionMode: 'yolo' }).success,
    ).toBe(false)
  })

  it('caps the injected memory block — never the whole database', () => {
    const big = 'x'.repeat(9000)
    expect(RunCallOptions.safeParse({ taskId: 't', runId: 'r', memory: big }).success).toBe(false)
  })
})

describe('runContextInstructions (prepareCall injection)', () => {
  it('composes memory, resume, and mode notes in order', () => {
    const text = runContextInstructions(
      RunCallOptions.parse({
        taskId: 't',
        runId: 'r',
        memory: '<memories>facts</memories>',
        resume: '[task-resume] continue',
        executionMode: 'recovery',
      }),
    )
    expect(text).toContain('<memories>facts</memories>')
    expect(text).toContain('[task-resume] continue')
    expect(text).toContain('recovery')
    expect(text?.indexOf('<memories>')).toBeLessThan(text?.indexOf('[task-resume]') ?? -1)
  })

  it('returns undefined when there is nothing to inject', () => {
    expect(
      runContextInstructions(RunCallOptions.parse({ taskId: 't', runId: 'r' })),
    ).toBeUndefined()
  })
})
