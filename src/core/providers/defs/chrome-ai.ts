import { browserAI } from '@browser-ai/core'
import { CHROME_AI_INFO } from '@/shared/providers'
import type { ProviderDef, ProviderStatus } from '../types'

/** Download/support preflight for the on-device model (Prompt API). Streaming
 * itself goes through the @browser-ai/core AI SDK provider — this only exists
 * because the AI SDK has no availability concept for user guidance. */
async function availability(): Promise<ProviderStatus> {
  if (typeof LanguageModel === 'undefined') {
    return { state: 'unavailable', reason: 'Built-in AI is not supported in this browser' }
  }
  const state = await LanguageModel.availability()
  if (state === 'available') return { state: 'available' }
  if (state === 'downloadable' || state === 'downloading') return { state }
  return { state: 'unavailable', reason: 'The on-device model is unavailable here' }
}

/** On-device default provider — same ProviderDef shape as the cloud ones.
 * Chromium-only: the Prompt API exists only in Chrome/Chromium, so the registry
 * drops this on Firefox. */
export const chromeAi: ProviderDef = {
  ...CHROME_AI_INFO,
  chromiumOnly: true,
  makeModel: () => browserAI(),
  availability,
}
