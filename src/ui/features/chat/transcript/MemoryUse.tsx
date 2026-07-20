import type { UsedMemory } from '@/shared/trace'
import { t } from '@/shared/util/i18n'

/** Compact "Using: …" line — what the run remembered and why, visible in the
 * moment instead of buried in a settings page (docs/memory-agent). */
export function MemoryUse({ memories }: { memories: UsedMemory[] }) {
  if (memories.length === 0) return null
  return (
    <div className="rounded-lg border border-line bg-surface-2/50 px-2.5 py-1.5 text-[12px] text-ink-dim">
      <span className="font-medium">{t('memUsing', 'Using memory:')}</span>
      <ul className="mt-0.5 list-inside list-disc">
        {memories.slice(0, 5).map((m) => (
          <li key={m.id}>{m.summary}</li>
        ))}
      </ul>
    </div>
  )
}
