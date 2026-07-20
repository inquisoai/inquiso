import { tool } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { buildBrowserAgent } from '@/core/agent/loop/agent'
import { createMeter } from '@/core/agent/loop/budget'
import type { ActiveModel } from '@/core/providers/resolve'

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
}
const finishReason = (unified: 'stop' | 'tool-calls') => ({ unified, raw: undefined })

const textReply = async () => ({
  content: [{ type: 'text' as const, text: 'ok' }],
  finishReason: finishReason('stop'),
  usage,
  warnings: [],
})

const toolCallReply = async () => ({
  content: [
    { type: 'tool-call' as const, toolCallId: 'call-1', toolName: 'ping', input: '{"n":1}' },
  ],
  finishReason: finishReason('tool-calls'),
  usage,
  warnings: [],
})

const active = (model: MockLanguageModelV3): ActiveModel => ({
  model,
  providerId: 'mock',
  vision: false,
})

const ping = tool({
  description: 'test tool',
  inputSchema: z.object({ n: z.number() }),
  execute: async () => ({ ok: true }),
})

describe('buildBrowserAgent (ToolLoopAgent integration, mock model)', () => {
  it('injects the memory call option as a second system message', async () => {
    const model = new MockLanguageModelV3({ doGenerate: textReply })
    const agent = buildBrowserAgent(active(model), { ping }, createMeter(0))
    await agent.generate({
      prompt: 'hello',
      options: { taskId: 't1', runId: 'r1', memory: '<memories>prefers PDF</memories>' },
    })
    const sent = model.doGenerateCalls[0]?.prompt ?? []
    const systems = sent.filter((m) => m.role === 'system').map((m) => String(m.content))
    expect(systems.length).toBeGreaterThanOrEqual(2)
    expect(systems.some((s) => s.includes('<memories>prefers PDF</memories>'))).toBe(true)
    // The base instructions stay first (stable cacheable prefix).
    expect(systems[0]).not.toContain('prefers PDF')
  })

  it('rejects invalid call options before any model call (SDK validateTypes)', async () => {
    const model = new MockLanguageModelV3({ doGenerate: textReply })
    const agent = buildBrowserAgent(active(model), { ping }, createMeter(0))
    await expect(
      // biome-ignore lint/suspicious/noExplicitAny: deliberately malformed options.
      agent.generate({ prompt: 'hello', options: { runId: 'r1' } as any }),
    ).rejects.toThrow()
    expect(model.doGenerateCalls).toHaveLength(0)
  })

  it('stops a stuck loop: identical tool call repeated three times', async () => {
    const model = new MockLanguageModelV3({ doGenerate: toolCallReply })
    const agent = buildBrowserAgent(active(model), { ping }, createMeter(Date.now()))
    await agent.generate({ prompt: 'go', options: { taskId: 't1', runId: 'r1' } })
    // repeatedActionIs(3): exactly three model steps, not the 30-step budget.
    expect(model.doGenerateCalls).toHaveLength(3)
  })
})
