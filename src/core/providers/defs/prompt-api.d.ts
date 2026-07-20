/**
 * Minimal ambient types for Chrome's Built-in AI Prompt API (Gemini Nano),
 * stable since Chrome 148. Not yet in TS lib DOM.
 * https://developer.chrome.com/docs/ai/prompt-api
 */
type LanguageModelAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available'

interface LanguageModelMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface LanguageModelCreateOptions {
  initialPrompts?: LanguageModelMessage[]
  temperature?: number
  topK?: number
  signal?: AbortSignal
  monitor?: (monitor: EventTarget) => void
}

interface LanguageModelSession {
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>
  promptStreaming(input: string, options?: { signal?: AbortSignal }): ReadableStream<string>
  destroy(): void
}

declare const LanguageModel: {
  availability(): Promise<LanguageModelAvailability>
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>
}
