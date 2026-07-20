import { useState } from 'react'
import { SCOPE_LABELS, SCOPES, type Scope } from '@/shared/constants'
import type { TabInfo } from '@/shared/page'
import { t } from '@/shared/util/i18n'
import { host } from '@/shared/util/url'
import { PlusIcon } from '@/ui/components/icons'
import { Menu, MenuDivider, MenuItem, MenuLabel } from '@/ui/components/menu'

interface Props {
  scope: Scope
  tabs: TabInfo[]
  canAttach: boolean
  onScope: (scope: Scope) => void
  onAttach: () => void
}

const label = (scope: Scope): string =>
  t(`scope${scope[0]?.toUpperCase()}${scope.slice(1)}`, SCOPE_LABELS[scope])

/** Gemini-style "+" menu in the composer: pick what context is shared (page /
 * tab group / all tabs) and see exactly which page(s) go to the model. */
export function PlusMenu({ scope, tabs, canAttach, onScope, onAttach }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('addContext', 'Add context or attachments')}
        aria-expanded={open}
        className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full py-1.5 pr-3 pl-2 text-ink-dim text-xs transition-colors hover:bg-surface-3 hover:text-ink"
      >
        <PlusIcon />
        {label(scope)}
      </button>
      <Menu open={open} onClose={() => setOpen(false)} side="up" align="left">
        <MenuLabel>{t('shareLabel', 'Share with AI')}</MenuLabel>
        {SCOPES.map((s) => (
          <MenuItem
            key={s}
            onClick={() => {
              onScope(s)
              setOpen(false)
            }}
            selected={s === scope}
          >
            {label(s)}
          </MenuItem>
        ))}
        <MenuDivider />
        <MenuLabel>
          {tabs.length === 1
            ? t('sharingOne', 'Sharing this page')
            : `${t('sharingMany', 'Sharing')} ${tabs.length} ${t('pagesWord', 'pages')}`}
        </MenuLabel>
        {tabs.length === 0 && (
          <p className="px-3 pb-2 text-ink-dim text-xs">{t('noReadable', 'No readable page.')}</p>
        )}
        {tabs.slice(0, 6).map((tab) => (
          <div key={tab.url} className="px-3 py-1">
            <p className="truncate text-xs">{tab.title || host(tab.url)}</p>
            <p className="truncate text-ink-dim text-xs">{host(tab.url)}</p>
          </div>
        ))}
        {tabs.length > 6 && (
          <p className="px-3 py-1 text-ink-dim text-xs">
            +{tabs.length - 6} {t('moreWord', 'more')}
          </p>
        )}
        <MenuDivider />
        {canAttach ? (
          <MenuItem
            onClick={() => {
              onAttach()
              setOpen(false)
            }}
          >
            {t('attachFiles', 'Attach files')}
          </MenuItem>
        ) : (
          <MenuItem disabled>
            {t('attachUnsupported', 'Attach files (needs a vision model)')}
          </MenuItem>
        )}
      </Menu>
    </div>
  )
}
