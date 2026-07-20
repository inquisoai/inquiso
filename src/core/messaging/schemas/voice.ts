import { z } from 'zod'
import { PROTOCOL_VERSION } from '@/shared/constants'

// Voice messages, split out of contract.ts to keep files within the line cap.
const base = z.object({ v: z.literal(PROTOCOL_VERSION) })

export const VoiceReadyMsg = base.extend({ type: z.literal('voiceReady') })
export const TranscribeMsg = base.extend({
  type: z.literal('transcribe'),
  audio: z.string().min(1),
})
export const SpeakMsg = base.extend({ type: z.literal('speak'), text: z.string().min(1).max(4000) })
