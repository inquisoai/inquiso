/** Serializable provider metadata, shared between background and UI (no
 * functions — safe to send over the message channel). */
export type ProviderKind = 'local' | 'cloud' | 'compatible'

export interface ProviderInfo {
  id: string
  label: string
  kind: ProviderKind
  requiresKey: boolean
  defaultModel: string
  /** Fixed model list; empty for compatible providers (free-text model id). */
  models: string[]
  /** Whether the provider supports tool-calling (required for agent mode). */
  toolCalls: boolean
  /** Whether the provider accepts file/image attachments (vision-capable). */
  files: boolean
  /** Whether the provider can stream a reasoning ("thinking") trace. */
  reasoning: boolean
  /** Whether the provider offers native web search (server-side). */
  search: boolean
  /** Plain-language note about where data goes (shown in the UI). */
  dataUse: string
  keyUrl?: string
  /** OpenAI-compatible base URL (gateways + custom providers only). */
  baseURL?: string
  /** True for user-added providers (removable in the UI). */
  custom?: boolean
}

export const CHROME_AI_INFO: ProviderInfo = {
  id: 'chrome-ai',
  label: 'Chrome Built-in AI (Gemini Nano)',
  kind: 'local',
  requiresKey: false,
  defaultModel: 'gemini-nano',
  models: ['gemini-nano'],
  // Tool-calling is polyfilled by @browser-ai/core (JSON-schema system prompt),
  // so Nano can read/act on the page — less reliable than cloud models.
  toolCalls: true,
  files: false,
  reasoning: false,
  search: false,
  dataUse: 'Runs entirely on your device. Nothing leaves the browser.',
}
