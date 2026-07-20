import { useState } from 'react'
import { t } from '@/shared/util/i18n'
import { SpeakerIcon } from '@/ui/components/icons'

interface Props {
  text: string
  speak: (t: string) => Promise<void>
}

/** Reads a completed answer aloud via the BYOK voice provider. Rendered only
 * when a provider can synthesize speech. */
export function SpeakButton({ text, speak }: Props) {
  const [busy, setBusy] = useState(false)
  const play = async (): Promise<void> => {
    setBusy(true)
    try {
      await speak(text)
    } catch {
      // Ignore playback/synthesis failures — reading aloud is best-effort.
    } finally {
      setBusy(false)
    }
  }
  return (
    <button
      type="button"
      onClick={() => void play()}
      disabled={busy}
      aria-label={t('readAloud', 'Read aloud')}
      title={t('readAloud', 'Read aloud')}
      className="self-start rounded-full p-1 text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-50"
    >
      <SpeakerIcon />
    </button>
  )
}
