import { useState } from 'react'
import { t } from '@/shared/util/i18n'

interface Props {
  label: string
  hasKey: boolean
  onSave: (apiKey: string) => void
  onRemove: () => void
}

/** API-key row for one provider: shows saved state + remove, or a paste field. */
export function KeyInput({ label, hasKey, onSave, onRemove }: Props) {
  const [draft, setDraft] = useState('')

  if (hasKey) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <span className="text-green-600">{t('keySaved', '✓ Key saved')}</span>
        <button type="button" onClick={onRemove} className="text-danger hover:underline">
          {t('remove', 'Remove')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <input
        type="password"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={t('pasteKey', 'Paste API key')}
        aria-label={`${label} ${t('pasteKey', 'Paste API key')}`}
        className="min-w-0 flex-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs outline-none transition-colors placeholder:text-ink-dim focus:border-brand/50"
      />
      <button
        type="button"
        disabled={!draft}
        onClick={() => {
          onSave(draft)
          setDraft('')
        }}
        className="rounded-full bg-brand px-3.5 py-1.5 text-surface text-xs transition-transform active:scale-95 disabled:bg-surface-3 disabled:text-ink-dim"
      >
        {t('save', 'Save')}
      </button>
    </div>
  )
}
