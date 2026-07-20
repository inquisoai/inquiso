import type { BlockedAttempt } from '@/shared/memory/candidate'
import { t } from '@/shared/util/i18n'

/** Write attempts the deterministic gate rejected or quarantined — visible so
 * memory-poisoning attempts are auditable, never silent (docs/05). */
export function BlockedList({ blocked }: { blocked: BlockedAttempt[] }) {
  if (blocked.length === 0) {
    return <p className="p-2 text-ink-dim text-sm">{t('memNoBlocked', 'No blocked attempts.')}</p>
  }
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="font-medium text-ink-dim text-xs uppercase tracking-wide">
        {t('memBlocked', 'Blocked memory attempts')}
      </h3>
      {blocked.map((b) => (
        <div key={`${b.at}-${b.reason}`} className="rounded-lg border border-line bg-surface p-2">
          <p className="text-sm">{b.summary}</p>
          <p className="mt-0.5 text-[11px] text-ink-dim">
            {b.decision === 'discard'
              ? t('memDiscarded', 'Discarded')
              : t('memQuarantined', 'Quarantined')}
            {' · '}
            {b.reason}
            {b.origin ? ` · ${b.origin}` : ''}
            {' · '}
            {new Date(b.at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}
