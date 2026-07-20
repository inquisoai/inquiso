import type { EmbeddingModel, LanguageModel, SpeechModel, ToolSet, TranscriptionModel } from 'ai'
import type { ProviderInfo } from '@/shared/providers'

/** Provider-agnostic message and status contracts. Streaming itself goes
 * through the AI SDK (`streamText`) for every provider — on-device included
 * (via @browser-ai/core) — so there is no custom stream interface. */

/** A provider (local or cloud): serializable metadata plus AI SDK model
 * factories. Local providers ignore the apiKey argument. */
export interface ProviderDef extends ProviderInfo {
  /** May be async so heavy providers (e.g. WebLLM) can lazy-load their runtime
   * as a split chunk instead of bloating the background bundle. */
  makeModel: (apiKey: string, modelId: string) => LanguageModel | Promise<LanguageModel>
  /** Preflight (e.g. on-device download state); absent means always ready. */
  availability?: () => Promise<ProviderStatus>
  /** Embedding model id (for cache keys); absent if the provider has none. */
  embeddingModel?: string
  makeEmbedding?: (apiKey: string) => EmbeddingModel
  /** A cheap/fast sibling model for background extraction work (episode
   * summaries, fact mining) — never for the user-facing run itself. */
  fastModel?: string
  /** The provider's native web-search tool(s), merged into the tool set when
   * search is supported and enabled. Absent = provider has no native search. */
  makeSearchTool?: (apiKey: string) => ToolSet
  /** Speech-to-text model factory (voice input). Absent = no transcription. */
  makeTranscription?: (apiKey: string) => TranscriptionModel
  /** Text-to-speech model factory (read answers aloud). Absent = no speech. */
  makeSpeech?: (apiKey: string) => SpeechModel
  /** Chromium-only (e.g. the Prompt API). Dropped from the registry on Firefox,
   * which has no such API — so it never appears in the picker there. */
  chromiumOnly?: boolean
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type ProviderStatus =
  | { state: 'available' }
  | { state: 'downloadable' | 'downloading'; progress?: number }
  | { state: 'unavailable'; reason: string }
