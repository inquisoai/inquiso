import { useRef, useState } from 'react'
import type { Attachment } from '@/shared/attachment'
import type { Autonomy } from '@/shared/autonomy'
import type { Scope } from '@/shared/constants'
import type { TabInfo } from '@/shared/page'
import { t } from '@/shared/util/i18n'
import { usePendingAttachments } from '@/ui/hooks/use-pending-attachments'
import { useVoice } from '@/ui/hooks/use-voice'
import { AttachmentChips } from './AttachmentChips'
import { ComposerBar } from './ComposerBar'

interface Props {
  busy: boolean
  scope: Scope
  tabs: TabInfo[]
  canAttach: boolean
  autonomy: Autonomy
  onScope: (scope: Scope) => void
  onAutonomy: (a: Autonomy) => void
  onSend: (text: string, attachments: Attachment[]) => void
  onStop: () => void
}

/** The single composer: an auto-growing pill (ChatGPT/Gemini mobile style).
 * Enter sends, Shift+Enter breaks; the bottom bar holds context/autonomy/voice. */
export function Composer(p: Props) {
  const { busy, scope, tabs, canAttach, autonomy, onScope, onAutonomy, onSend, onStop } = p
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const att = usePendingAttachments(canAttach)
  const { ready } = useVoice()

  const autogrow = (): void => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const appendVoice = (spoken: string): void => {
    setText((cur) => (cur ? `${cur} ${spoken}` : spoken))
    requestAnimationFrame(autogrow)
  }

  const send = (): void => {
    const trimmed = text.trim()
    if ((!trimmed && att.files.length === 0) || busy) return
    onSend(trimmed, att.files)
    setText('')
    att.clear()
    requestAnimationFrame(autogrow)
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-3xl border border-line bg-surface-2 px-3 pt-3 pb-2 shadow-sm transition-colors focus-within:border-brand/40">
      <AttachmentChips files={att.files} onRemove={att.remove} />
      <input ref={fileRef} type="file" multiple hidden onChange={att.onFile} />
      <textarea
        ref={ref}
        value={text}
        rows={1}
        onChange={(e) => {
          setText(e.target.value)
          autogrow()
        }}
        onPaste={att.onPaste}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send()
          }
        }}
        placeholder={t('askPlaceholder', 'Ask about this page…')}
        aria-label={t('askPlaceholder', 'Ask about this page…')}
        className="max-h-40 resize-none border-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-ink-dim"
      />
      <ComposerBar
        busy={busy}
        scope={scope}
        tabs={tabs}
        canAttach={canAttach}
        autonomy={autonomy}
        canSend={!!text.trim() || att.files.length > 0}
        micEnabled={ready.transcribe}
        onScope={onScope}
        onAutonomy={onAutonomy}
        onAttach={() => fileRef.current?.click()}
        onVoice={appendVoice}
        onSend={send}
        onStop={onStop}
      />
    </div>
  )
}
