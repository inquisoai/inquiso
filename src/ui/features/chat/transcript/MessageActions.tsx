import { useState } from 'react'
import { t } from '@/shared/util/i18n'
import { CheckIcon, CopyIcon } from '@/ui/components/icons'
import { SpeakButton } from './SpeakButton'

interface Props {
  text: string
  canSpeak: boolean
  speak: (text: string) => Promise<void>
}

/** Action row under a completed answer: copy to clipboard, and (when a voice
 * provider is configured) read aloud. */
export function MessageActions({ text, canSpeak, speak }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked; nothing else to do.
    }
  }

  return (
    <div className="flex items-center gap-0.5 text-ink-dim">
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={t('copy', 'Copy')}
        title={copied ? t('copied', 'Copied') : t('copy', 'Copy')}
        className="rounded-full p-1.5 transition-colors hover:bg-surface-2 hover:text-ink"
      >
        {copied ? <CheckIcon className="text-brand" /> : <CopyIcon />}
      </button>
      {canSpeak && <SpeakButton text={text} speak={speak} />}
    </div>
  )
}
