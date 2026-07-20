import { describe, expect, it } from 'vitest'
import { compatibleDef, customDef } from '@/core/providers/defs/compatible'
import { getDef, providerInfos } from '@/core/providers/registry'
import { originPattern, slugId } from '@/shared/custom-provider'

describe('custom-provider helpers', () => {
  it('slugifies a label into a custom id', () => {
    expect(slugId('Groq Cloud')).toBe('custom:groq-cloud')
    expect(slugId('  My!!Server  ')).toBe('custom:my-server')
    expect(slugId('***')).toBe('custom:provider')
  })

  it('derives an origin pattern for the host permission', () => {
    expect(originPattern('https://openrouter.ai/api/v1')).toBe('https://openrouter.ai/*')
    expect(originPattern('http://localhost:11434/v1')).toBe('http://localhost:11434/*')
  })
})

describe('compatible provider defs', () => {
  it('builds a tool-capable, free-text-model provider from a spec', () => {
    const def = compatibleDef({
      id: 'x',
      label: 'X',
      baseURL: 'https://x.example/v1',
      defaultModel: 'm',
      dataUse: 'note',
    })
    expect(def.kind).toBe('compatible')
    expect(def.models).toEqual([])
    expect(def.toolCalls).toBe(true)
    expect(def.baseURL).toBe('https://x.example/v1')
    expect(def.makeModel('sk-test', 'some-model')).toBeDefined()
  })

  it('maps a stored custom provider to a def, keeping its requiresKey', () => {
    const def = customDef({
      id: 'custom:local',
      label: 'Local',
      baseURL: 'http://localhost:11434/v1',
      model: 'llama3.2',
      requiresKey: false,
    })
    expect(def.requiresKey).toBe(false)
    expect(def.custom).toBe(true)
    expect(def.defaultModel).toBe('llama3.2')
  })
})

describe('registry with gateways', () => {
  it('exposes the built-in gateways as selectable providers', () => {
    expect(getDef('openrouter')?.kind).toBe('compatible')
    expect(getDef('vercel-gateway')?.baseURL).toContain('ai-gateway.vercel.sh')
    const ids = providerInfos.map((p) => p.id)
    expect(ids).toEqual([
      'chrome-ai',
      'web-llm',
      'openai',
      'anthropic',
      'google',
      'qwen',
      'kimi',
      'openrouter',
      'vercel-gateway',
    ])
  })

  it('exposes Qwen (DashScope) with tool calls, a fast model, and embeddings', () => {
    const def = getDef('qwen')
    expect(def?.baseURL).toContain('dashscope-intl.aliyuncs.com')
    expect(def?.toolCalls).toBe(true)
    expect(def?.fastModel).toBe('qwen-flash')
    expect(def?.embeddingModel).toBe('text-embedding-v4')
    expect(def?.models).toContain('qwen-plus')
  })

  it('exposes Kimi (Moonshot AI) as an OpenAI-compatible cloud provider', () => {
    const def = getDef('kimi')
    expect(def?.baseURL).toContain('api.moonshot.ai')
    expect(def?.toolCalls).toBe(true)
    expect(def?.models).toContain('kimi-latest')
  })

  it('offers multiple in-browser WebLLM models with a WebGPU preflight', () => {
    const def = getDef('web-llm')
    expect(def?.kind).toBe('local')
    expect(def?.requiresKey).toBe(false)
    expect((def?.models.length ?? 0) > 1).toBe(true)
    expect(def?.availability).toBeDefined()
  })
})
