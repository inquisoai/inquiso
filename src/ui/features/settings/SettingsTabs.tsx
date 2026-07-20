import { useEffect, useRef } from 'react'
import { t } from '@/shared/util/i18n'

export type SettingsTab = 'models' | 'agent' | 'memory' | 'permissions' | 'mcp' | 'sync'

const TABS: [SettingsTab, string, string][] = [
  ['models', 'tabModels', 'Models'],
  ['agent', 'tabAgent', 'Agent'],
  ['memory', 'tabMemory', 'Memory'],
  ['permissions', 'tabPermissions', 'Access'],
  ['mcp', 'tabMcp', 'MCP'],
  ['sync', 'tabSync', 'Backup'],
]

interface Props {
  value: SettingsTab
  onChange: (tab: SettingsTab) => void
}

/**
 * Segmented tab bar for the settings surface. When the panel is narrower than
 * the labels it scrolls horizontally on a single row (the standard scrollable-
 * tabs pattern: never wrap, never shrink labels) — the scrollbar is hidden,
 * a half-visible tab is the affordance, and the active tab keeps itself in
 * view. The wrapper needs shrink-0: a scroll container forfeits
 * min-height:auto, so as a flex item in the often-overflowing settings column
 * it would otherwise be crushed to zero height.
 */
export function SettingsTabs({ value, onChange }: Props) {
  const active = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    active.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [])

  return (
    <div className="shrink-0 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div
        role="tablist"
        className="flex w-max min-w-full gap-1 rounded-full border border-line bg-surface-2 p-1 text-xs"
      >
        {TABS.map(([id, key, label]) => (
          <button
            key={id}
            ref={value === id ? active : null}
            type="button"
            role="tab"
            aria-selected={value === id}
            onClick={(e) => {
              onChange(id)
              e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })
            }}
            className={`grow whitespace-nowrap rounded-full px-2.5 py-1.5 font-medium transition-colors ${
              value === id ? 'bg-surface text-ink shadow-sm' : 'text-ink-dim hover:text-ink'
            }`}
          >
            {t(key, label)}
          </button>
        ))}
      </div>
    </div>
  )
}
