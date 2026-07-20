import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { sendToBackground } from '@/ui/lib/messaging'

interface Ready {
  transcribe: boolean
  speak: boolean
}

const NOT_READY: Ready = { transcribe: false, speak: false }

/** Voice capability + the speak() action. Capability is BYOK-driven (a provider
 * that supports transcription/speech with a stored key); permission changes
 * invalidate ['voiceReady'] (ui/lib/invalidate) so it stays current. Audio
 * synthesis runs in the background; playback happens here. */
export function useVoice() {
  // Voice is optional — a failure just means "not available", never a crash.
  const { data } = useQuery({
    queryKey: ['voiceReady'],
    queryFn: (): Promise<Ready> =>
      sendToBackground<Ready>({ type: 'voiceReady' }).catch(() => NOT_READY),
  })
  const ready = data ?? NOT_READY

  const speak = useCallback(async (text: string) => {
    const { audio, mediaType } = await sendToBackground<{ audio: string; mediaType: string }>({
      type: 'speak',
      text: text.slice(0, 4000),
    })
    await new Audio(`data:${mediaType};base64,${audio}`).play()
  }, [])

  return { ready, speak }
}
