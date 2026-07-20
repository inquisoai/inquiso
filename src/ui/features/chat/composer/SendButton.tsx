import { t } from '@/shared/util/i18n'
import { ArrowUpIcon, StopIcon } from '@/ui/components/icons'

interface Props {
  busy: boolean
  disabled: boolean
  onSend: () => void
  onStop: () => void
}

/** The circular send button that becomes a stop control while streaming. */
export function SendButton({ busy, disabled, onSend, onStop }: Props) {
  if (busy) {
    return (
      <button
        type="button"
        onClick={onStop}
        aria-label={t('stop', 'Stop')}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-surface transition-transform active:scale-95"
      >
        <StopIcon />
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onSend}
      disabled={disabled}
      aria-label={t('send', 'Send')}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-surface transition-all active:scale-95 disabled:bg-surface-3 disabled:text-ink-dim"
    >
      <ArrowUpIcon />
    </button>
  )
}
