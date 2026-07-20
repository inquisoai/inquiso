import { useState } from 'react'
import { t } from '@/shared/util/i18n'
import { Toggle } from '@/ui/features/settings/Toggle'
import { useMemoryCenter } from '@/ui/hooks/use-memory'
import { BlockedList } from './BlockedList'
import { MemorySections } from './MemorySections'
import { RunHistory } from './RunHistory'
import { SkillsPanel } from './SkillsPanel'

type View = 'knows' | 'skills' | 'tasks' | 'blocked'

const VIEWS: [View, string, string][] = [
  ['knows', 'memViewKnows', 'Knowledge'],
  ['skills', 'memViewSkills', 'Workflows'],
  ['tasks', 'memViewTasks', 'Tasks'],
  ['blocked', 'memViewBlocked', 'Blocked'],
]

/** The Memory Center: inspect, correct, and delete everything Inquiso has
 * learned — all of it local to this device. */
export function MemoryPanel() {
  const mem = useMemoryCenter()
  const [view, setView] = useState<View>('knows')

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full px-2.5 py-1 text-xs transition-colors ${
      active ? 'bg-surface text-ink shadow-sm' : 'text-ink-dim hover:text-ink'
    }`
  return (
    <div className="flex flex-col gap-3">
      <div className="max-w-full shrink-0 self-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-1 rounded-full border border-line bg-surface-2 p-1">
          {VIEWS.map(([id, key, label]) => (
            <button
              key={id}
              type="button"
              className={chip(view === id)}
              onClick={() => setView(id)}
            >
              {t(key, label)}
            </button>
          ))}
        </div>
      </div>

      {view === 'knows' && (
        <MemorySections
          memories={mem.memories}
          onForget={(id) => void mem.forget(id)}
          onConfirm={(id) => void mem.confirm(id)}
          onIncorrect={(id) => void mem.markIncorrect(id)}
          onEdit={(id, s) => void mem.edit(id, s)}
        />
      )}
      {view === 'skills' && (
        <SkillsPanel
          skills={mem.skills}
          onTrust={(id) => void mem.trustSkill(id)}
          onRetire={(id) => void mem.retireSkill(id)}
        />
      )}
      {view === 'tasks' && <RunHistory runs={mem.runs} />}
      {view === 'blocked' && <BlockedList blocked={mem.blocked} />}

      <Toggle
        label={t('memAutoLearn', 'Learn automatically from completed tasks')}
        checked={mem.autoLearn}
        onChange={(v) => void mem.setLearning(v)}
      />
      <div className="flex gap-1 border-line border-t pt-2">
        <button
          type="button"
          className="flex-1 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-surface-2"
          onClick={() => void mem.exportAll()}
        >
          {t('memExport', 'Export memory')}
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg px-3 py-2 text-red-600 text-xs transition-colors hover:bg-surface-2"
          onClick={() => void mem.clear()}
        >
          {t('memDeleteAll', 'Delete all memory')}
        </button>
      </div>
      <p className="text-[11px] text-ink-dim">
        {t('memLocalNote', 'All memory is stored locally in your browser and never synced.')}
      </p>
    </div>
  )
}
