import { InvalidToolInputError, NoSuchToolError, tool } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { makeRepair } from '@/core/agent/loop/repair'

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
}

const modelReplying = (text: string) =>
  new MockLanguageModelV3({
    doGenerate: async () => ({
      content: [{ type: 'text' as const, text }],
      finishReason: { unified: 'stop' as const, raw: undefined },
      usage,
      warnings: [],
    }),
  })

const tools = {
  navigate: tool({
    description: 'go to a url',
    inputSchema: z.object({ url: z.string() }),
    execute: async () => ({ ok: true }),
  }),
}

const badCall = {
  type: 'tool-call' as const,
  toolCallId: 'c1',
  toolName: 'navigate',
  input: '{"url":123}',
}

const invalidInput = new InvalidToolInputError({
  toolName: 'navigate',
  toolInput: badCall.input,
  cause: new Error('expected string'),
})

const inputSchema = async () => ({})

describe('makeRepair (experimental_repairToolCall)', () => {
  it('re-asks the model and returns corrected arguments as the same call', async () => {
    const repair = makeRepair(modelReplying('{"url":"https://example.com"}'))
    const fixed = await repair({
      system: undefined,
      messages: [],
      toolCall: badCall,
      tools,
      inputSchema,
      error: invalidInput,
    })
    expect(fixed).toMatchObject({ toolCallId: 'c1', toolName: 'navigate' })
    expect(JSON.parse(fixed?.input ?? '')).toEqual({ url: 'https://example.com' })
  })

  it('cannot repair a call to a tool that does not exist', async () => {
    const repair = makeRepair(modelReplying('{"url":"https://example.com"}'))
    const error = new NoSuchToolError({ toolName: 'teleport', availableTools: ['navigate'] })
    const call = { ...badCall, toolName: 'teleport' }
    expect(
      await repair({ system: undefined, messages: [], toolCall: call, tools, inputSchema, error }),
    ).toBeNull()
    // Same when the error is generic but the tool is missing from the set.
    expect(
      await repair({
        system: undefined,
        messages: [],
        toolCall: call,
        tools,
        inputSchema,
        error: invalidInput,
      }),
    ).toBeNull()
  })

  it('returns null when the repair attempt itself fails, surfacing the original error', async () => {
    const broken = new MockLanguageModelV3({
      doGenerate: async () => {
        throw new Error('model unavailable')
      },
    })
    const repair = makeRepair(broken)
    const fixed = await repair({
      system: undefined,
      messages: [],
      toolCall: badCall,
      tools,
      inputSchema,
      error: invalidInput,
    })
    expect(fixed).toBeNull()
  })
})
