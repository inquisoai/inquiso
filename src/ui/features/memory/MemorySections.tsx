import type { MemoryRecord } from '@/shared/memory/record'
import { t } from '@/shared/util/i18n'
import { MemoryCard } from './MemoryCard'

export interface SectionProps {
  memories: MemoryRecord[]
  onForget: (id: string) => void
  onConfirm: (id: string) => void
  onIncorrect: (id: string) => void
  onEdit: (id: string, summary: string) => void
}

function Section({
  title,
  items,
  ...actions
}: SectionProps & { title: string; items: MemoryRecord[] }) {
  if (items.length === 0) return null
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="font-medium text-ink-dim text-xs uppercase tracking-wide">{title}</h3>
      {items.map((m) => (
        <MemoryCard key={m.id} memory={m} {...actions} />
      ))}
    </section>
  )
}

const visible = (m: MemoryRecord): boolean => m.status !== 'deleted'

/** "What Inquiso knows": pending reviews first, then profile knowledge,
 * per-site knowledge, and superseded history. */
export function MemorySections({ memories, ...actions }: SectionProps) {
  const live = memories.filter(visible)
  const pending = live.filter((m) => m.status === 'candidate' || m.status === 'quarantined')
  const me = live.filter(
    (m) => m.status === 'active' && !m.scope.origin && m.kind !== 'episode' && m.kind !== 'skill',
  )
  const sites = live.filter((m) => m.status === 'active' && m.scope.origin)
  const history = live.filter((m) => m.status === 'superseded' || m.status === 'expired')

  if (live.length === 0) {
    return (
      <p className="p-2 text-ink-dim text-sm">
        {t('memEmpty', 'Nothing learned yet. Memories appear here as Inquiso works for you.')}
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <Section
        title={t('memPending', 'Waiting for your review')}
        items={pending}
        memories={memories}
        {...actions}
      />
      <Section
        title={t('memAboutMe', 'What Inquiso knows about me')}
        items={me}
        memories={memories}
        {...actions}
      />
      <Section
        title={t('memSites', 'Website knowledge')}
        items={sites}
        memories={memories}
        {...actions}
      />
      <Section
        title={t('memHistory', 'Superseded & outdated')}
        items={history}
        memories={memories}
        {...actions}
      />
    </div>
  )
}
