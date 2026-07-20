import {
  experimental_generateSpeech as generateSpeech,
  experimental_transcribe as transcribe,
} from 'ai'
import { speechModel, transcriptionModel } from './resolve'

/** Whether any configured provider can do voice (drives the mic button's UI). */
export async function voiceReady(): Promise<{ transcribe: boolean; speak: boolean }> {
  return { transcribe: !!(await transcriptionModel()), speak: !!(await speechModel()) }
}

/** Transcribes recorded audio (base64) to text via a BYOK voice provider. */
export async function transcribeAudio(audio: string): Promise<{ text: string }> {
  const model = await transcriptionModel()
  if (!model) throw new Error('voice_unsupported')
  const { text } = await transcribe({ model, audio })
  return { text }
}

/** Synthesizes speech (base64 audio) from text for reading answers aloud. */
export async function synthesizeSpeech(
  text: string,
): Promise<{ audio: string; mediaType: string }> {
  const model = await speechModel()
  if (!model) throw new Error('voice_unsupported')
  const { audio } = await generateSpeech({ model, text })
  return { audio: audio.base64, mediaType: audio.mediaType }
}
