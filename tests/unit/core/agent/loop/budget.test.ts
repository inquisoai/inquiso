import { describe, expect, it } from 'vitest'
import { buildStopConditions, createMeter } from '@/core/agent/loop/budget'

type Conds = ReturnType<typeof buildStopConditions>
const at = (cs: Conds, i: number): Conds[number] => {
  const c = cs[i]
  if (!c) throw new Error(`no stop condition at ${i}`)
  return c
}
const run = (c: Conds[number]): boolean =>
  c({ steps: [] } as unknown as Parameters<typeof c>[0]) as boolean

describe('loop budget', () => {
  it('includes the step cap first', () => {
    const conds = buildStopConditions({ maxSteps: 3, deadlineMs: 60_000 }, createMeter(Date.now()))
    expect(at(conds, 0)).toBeDefined()
    expect(conds.length).toBe(2) // no token cap when maxTokens omitted
  })

  it('stops when the wall-clock deadline passes, not before', () => {
    const past = buildStopConditions(
      { maxSteps: 99, deadlineMs: 5_000 },
      createMeter(Date.now() - 10_000),
    )
    expect(run(at(past, 1))).toBe(true)
    const fresh = buildStopConditions({ maxSteps: 99, deadlineMs: 60_000 }, createMeter(Date.now()))
    expect(run(at(fresh, 1))).toBe(false)
  })

  it('stops when the token cap is exceeded', () => {
    const meter = createMeter(Date.now())
    meter.tokens = 5000
    const conds = buildStopConditions({ maxSteps: 99, deadlineMs: 60_000, maxTokens: 4000 }, meter)
    expect(run(at(conds, 2))).toBe(true)
  })
})
