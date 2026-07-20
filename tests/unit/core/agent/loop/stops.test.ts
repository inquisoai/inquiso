import type { StepResult, ToolSet } from 'ai'
import { describe, expect, it } from 'vitest'
import { repeatedActionIs, uncertainStreakIs } from '@/core/agent/loop/stops'

const step = (
  calls: Array<{ name: string; input: unknown }>,
  results: Array<{ outcome?: string }> = [],
): StepResult<ToolSet> =>
  ({
    toolCalls: calls.map((c, i) => ({ toolCallId: `c${i}`, toolName: c.name, input: c.input })),
    toolResults: results.map((r, i) => ({
      toolCallId: `c${i}`,
      output: r.outcome ? { ok: true, verification: { outcome: r.outcome } } : { ok: true },
    })),
  }) as unknown as StepResult<ToolSet>

const click = (handle: string) => ({ name: 'click', input: { handle } })

describe('repeatedActionIs', () => {
  it('stops when the same call repeats n times', async () => {
    const steps = [step([click('iq-1')]), step([click('iq-1')]), step([click('iq-1')])]
    expect(await repeatedActionIs(3)({ steps })).toBe(true)
  })

  it('does not stop on differing calls or short histories', async () => {
    expect(
      await repeatedActionIs(3)({
        steps: [step([click('iq-1')]), step([click('iq-2')]), step([click('iq-1')])],
      }),
    ).toBe(false)
    expect(
      await repeatedActionIs(3)({ steps: [step([click('iq-1')]), step([click('iq-1')])] }),
    ).toBe(false)
  })

  it('ignores steps without tool calls (text-only steps)', async () => {
    const steps = [step([]), step([]), step([])]
    expect(await repeatedActionIs(3)({ steps })).toBe(false)
  })
})

describe('uncertainStreakIs', () => {
  it('stops after n consecutive all-uncertain steps', async () => {
    const u = step([click('iq-1')], [{ outcome: 'uncertain' }])
    expect(await uncertainStreakIs(3)({ steps: [u, u, u] })).toBe(true)
  })

  it('a verified success breaks the streak', async () => {
    const u = step([click('iq-1')], [{ outcome: 'uncertain' }])
    const ok = step([click('iq-2')], [{ outcome: 'verified_success' }])
    expect(await uncertainStreakIs(3)({ steps: [u, u, ok] })).toBe(false)
  })

  it('steps without results never count toward the streak', async () => {
    const bare = step([click('iq-1')])
    expect(await uncertainStreakIs(2)({ steps: [bare, bare] })).toBe(false)
  })
})
