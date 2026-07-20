import { useState } from 'react'
import type { MemoryRecord } from '@/shared/memory/record'
import { t } from '@/shared/util/i18n'

interface Props {
  memory: MemoryRecord
  onForget: (id: string) => void
  onConfirm: (id: string) => void
  onIncorrect: (id: string) => void
  onEdit: (id: string, summary: string) => void
}

const STATUS_TONE: Record<string, string> = {
  active: 'text-ink-dim',
  candidate: 'text-amber-600',
  quarantined: 'text-amber-600',
  superseded: 'text-ink-dim line-through',
  expired: 'text-ink-dim line-through',
}

/** One memory: content, trust/provenance line, and curation actions. */
export function MemoryCard({ memory: m, onForget, onConfirm, onIncorrect, onEdit }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(m.summary)
  const meta = [
    m.kind.replace('_', ' '),
    m.scope.origin ?? m.scope.level,
    m.trust.userConfirmed ? t('memConfirmed', 'confirmed by you') : t('memInferred', 'inferred'),
    `${Math.round(m.trust.confidence * 100)}%`,
    m.status !== 'active' ? m.status : '',
    new Date(m.temporal.observedAt).toLocaleDateString(),
    m.metrics.retrievalCount > 0
      ? `${t('memUsed', 'used')} ${m.metrics.retrievalCount}× · ${
          m.temporal.lastUsedAt ? new Date(m.temporal.lastUsedAt).toLocaleDateString() : ''
        }`
      : '',
  ].filter(Boolean)

  const action =
    'rounded px-1.5 py-0.5 text-[11px] text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink'
  return (
    <div className="rounded-lg border border-line bg-surface p-2">
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onEdit(m.id, draft)
            setEditing(false)
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded border border-line bg-surface-2 px-2 py-1 text-sm"
          />
        </form>
      ) : (
        <p className={`text-sm ${STATUS_TONE[m.status] ?? ''}`}>{m.summary}</p>
      )}
      <p className="mt-1 text-[11px] text-ink-dim">{meta.join(' · ')}</p>
      <p className="text-[11px] text-ink-dim">{t('memLocal', 'Stays on this device')}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {(m.status === 'candidate' || m.status === 'quarantined' || !m.trust.userConfirmed) && (
          <button type="button" className={action} onClick={() => onConfirm(m.id)}>
            {t('memConfirm', 'Confirm')}
          </button>
        )}
        <button type="button" className={action} onClick={() => setEditing((v) => !v)}>
          {t('memEdit', 'Edit')}
        </button>
        <button type="button" className={action} onClick={() => onIncorrect(m.id)}>
          {t('memIncorrect', 'Mark incorrect')}
        </button>
        <button type="button" className={action} onClick={() => onForget(m.id)}>
          {t('memForget', 'Forget')}
        </button>
      </div>
    </div>
  )
}
