import { tool } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { buildBrowserAgent } from '@/core/agent/loop/agent'
import { createMeter } from '@/core/agent/loop/budget'
import type { ActiveModel } from '@/core/providers/resolve'

describe('deterministic completion (hasToolCall stop)', () => {
  it('completeTask ends the loop after one step instead of burning the budget', async () => {
    const model = new MockLanguageModelV3({
      doGenerate: async () => ({
        content: [
          {
            type: 'tool-call' as const,
            toolCallId: 'call-9',
            toolName: 'completeTask',
            input: '{"summary":"downloaded the invoice","outcome":"success"}',
          },
        ],
        finishReason: { unified: 'tool-calls' as const, raw: undefined },
        usage: {
          inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
          outputTokens: { total: 5, text: 5, reasoning: undefined },
        },
        warnings: [],
      }),
    })
    const completeTask = tool({
      description: 'done',
      inputSchema: z.object({ summary: z.string(), outcome: z.string() }),
      execute: async () => ({ ok: true, done: true }),
    })
    const agent = buildBrowserAgent(
      { model, providerId: 'mock', vision: false } as ActiveModel,
      { completeTask },
      createMeter(Date.now()),
    )
    await agent.generate({ prompt: 'go', options: { taskId: 't1', runId: 'r1' } })
    expect(model.doGenerateCalls).toHaveLength(1)
  })
})
