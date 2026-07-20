import type { SpeechModel, TranscriptionModel } from 'ai'
import { getKey } from '@/core/auth/secret-store'
import { providerDefs } from '@/core/providers/registry'
import type { ProviderDef } from '@/core/providers/types'

/**
 * Voice is BYOK-gated and independent of the selected chat model: it works
 * whenever the user has a key for a provider that supports it (e.g. OpenAI),
 * regardless of which model they chat with. Finds the first such provider.
 */
async function voiceProvider(
  kind: 'makeTranscription' | 'makeSpeech',
): Promise<ProviderDef | null> {
  for (const def of providerDefs) {
    if (def[kind] && (!def.requiresKey || (await getKey(def.id)))) return def
  }
  return null
}

const keyFor = async (def: ProviderDef): Promise<string> =>
  def.requiresKey ? ((await getKey(def.id)) ?? '') : ''

export async function transcriptionModel(): Promise<TranscriptionModel | null> {
  const def = await voiceProvider('makeTranscription')
  return def?.makeTranscription ? def.makeTranscription(await keyFor(def)) : null
}

export async function speechModel(): Promise<SpeechModel | null> {
  const def = await voiceProvider('makeSpeech')
  return def?.makeSpeech ? def.makeSpeech(await keyFor(def)) : null
}
