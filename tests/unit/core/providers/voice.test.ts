import { describe, expect, it } from 'vitest'
import { chromeAi } from '@/core/providers/defs/chrome-ai'
import { openai } from '@/core/providers/defs/openai'

describe('voice provider capabilities', () => {
  it('OpenAI exposes transcription + speech factories that build models', () => {
    expect(typeof openai.makeTranscription).toBe('function')
    expect(typeof openai.makeSpeech).toBe('function')
    expect(openai.makeTranscription?.('sk-test')).toBeTruthy()
    expect(openai.makeSpeech?.('sk-test')).toBeTruthy()
  })

  it('on-device Chrome AI has no cloud voice factories', () => {
    expect(chromeAi.makeTranscription).toBeUndefined()
    expect(chromeAi.makeSpeech).toBeUndefined()
  })
})
