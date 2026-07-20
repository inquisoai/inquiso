import { useState } from 'react'
import { t } from '@/shared/util/i18n'
import { MicIcon } from '@/ui/components/icons'
import { useRecorder } from '@/ui/hooks/use-recorder'
import { sendToBackground } from '@/ui/lib/messaging'

interface Props {
  enabled: boolean
  onText: (text: string) => void
}

/**
 * Push-to-talk: records a clip, transcribes it in the background (BYOK voice
 * provider), and drops the text into the composer. Shown disabled with a hint
 * until a transcription-capable key exists, so the feature is discoverable.
 */
export function MicButton({ enabled, onText }: Props) {
  const [busy, setBusy] = useState(false)
  const { recording, toggle } = useRecorder(async (audio) => {
    setBusy(true)
    try {
      const { text } = await sendToBackground<{ text: string }>({ type: 'transcribe', audio })
      if (text.trim()) onText(text.trim())
    } catch {
      // A failed transcription just leaves the composer untouched.
    } finally {
      setBusy(false)
    }
  })

  if (!enabled) {
    const hint = t('micNeedsKey', 'Add an OpenAI API key in Settings to enable voice')
    return (
      <button
        type="button"
        aria-disabled="true"
        aria-label={hint}
        title={hint}
        className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full text-ink-dim/70"
      >
        <MicIcon />
      </button>
    )
  }
  const label = recording ? t('micStop', 'Stop recording') : t('mic', 'Voice input')
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
        recording ? 'bg-danger text-surface' : 'text-ink-dim hover:bg-surface-3 hover:text-ink'
      }`}
    >
      <MicIcon />
    </button>
  )
}
