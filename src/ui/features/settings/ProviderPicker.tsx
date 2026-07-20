import { useState } from 'react'
import type { AppConfig } from '@/shared/config'
import { t } from '@/shared/util/i18n'
import { ChevronDownIcon } from '@/ui/components/icons'
import { Menu, MenuDivider, MenuItem, MenuLabel } from '@/ui/components/menu'

interface Props {
  config: AppConfig | null
  onProvider: (id: string) => void
  onModel: (provider: string, modelId: string) => void
  /** Opens the in-panel settings (key management) view. */
  onAddKey: () => void
}

/** Model picker, chat-app style: a compact pill opening a tiered menu —
 * providers first, then the active provider's models. Switching takes effect
 * on the next message (the background re-resolves each request). */
export function ProviderPicker({ config, onProvider, onModel, onAddKey }: Props) {
  const [open, setOpen] = useState(false)
  if (!config) return null
  const active = config.providers.find((p) => p.id === config.providerId)
  const needsKey = active?.requiresKey && !config.keyStatus[active.id]
  const activeModel = active ? (config.models[active.id] ?? active.defaultModel) : ''

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={t('activeProvider', 'Active provider')}
        className="flex min-w-0 max-w-44 items-center gap-1 rounded-full bg-surface-2 px-3 py-1.5 text-xs transition-colors hover:bg-surface-3"
      >
        <span className="truncate">{active?.kind === 'local' ? active.label : activeModel}</span>
        {needsKey && <span className="text-warn">•</span>}
        <ChevronDownIcon className="shrink-0 text-ink-dim" />
      </button>
      <Menu open={open} onClose={() => setOpen(false)} fullWidth>
        <MenuLabel>{t('activeProvider', 'Active provider')}</MenuLabel>
        {config.providers.map((p) => (
          <MenuItem
            key={p.id}
            onClick={() => {
              onProvider(p.id)
              if (p.id !== config.providerId) setOpen(false)
            }}
            selected={p.id === config.providerId}
          >
            {p.label}
          </MenuItem>
        ))}
        {active && active.models.length > 1 && (
          <>
            <MenuDivider />
            <MenuLabel>{t('modelLabel', 'Model')}</MenuLabel>
            {active.models.map((m) => (
              <MenuItem
                key={m}
                onClick={() => {
                  onModel(active.id, m)
                  setOpen(false)
                }}
                selected={m === activeModel}
              >
                {m}
              </MenuItem>
            ))}
          </>
        )}
        {needsKey && (
          <>
            <MenuDivider />
            <MenuItem
              onClick={() => {
                setOpen(false)
                onAddKey()
              }}
            >
              <span className="text-warn">{t('addKey', 'Add key')} →</span>
            </MenuItem>
          </>
        )}
      </Menu>
    </div>
  )
}
