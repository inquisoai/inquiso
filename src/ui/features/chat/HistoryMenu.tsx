import { useState } from 'react'
import type { Conversation } from '@/shared/history'
import { t } from '@/shared/util/i18n'
import { IconButton } from '@/ui/components/IconButton'
import { ClockIcon, TrashIcon } from '@/ui/components/icons'
import { Menu, MenuDivider, MenuLabel } from '@/ui/components/menu'
import { useHistory } from '@/ui/hooks/use-history'
import { HistoryTransfer } from './HistoryTransfer'

interface Props {
  currentId: string | null
  onSelect: (convo: Conversation) => void
}

/** Dropdown of stored conversations: open one, or delete it (a real delete —
 * docs/06). The list query only runs while the menu is open. */
export function HistoryMenu({ currentId, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const { items, get, remove } = useHistory(open)

  const pick = async (id: string): Promise<void> => {
    const convo = await get(id)
    if (convo) onSelect(convo)
    setOpen(false)
  }

  return (
    <div className="relative">
      <IconButton
        label={t('history', 'History')}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <ClockIcon />
      </IconButton>
      <Menu open={open} onClose={() => setOpen(false)} fullWidth>
        <MenuLabel>{t('history', 'History')}</MenuLabel>
        {items.length === 0 && (
          <p className="px-3 py-2 text-ink-dim text-sm">
            {t('historyEmpty', 'No conversations yet.')}
          </p>
        )}
        {items.map((m) => (
          <div key={m.id} className="group flex items-center">
            <button
              type="button"
              onClick={() => void pick(m.id)}
              className={`min-w-0 flex-1 truncate rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-2 ${
                m.id === currentId ? 'font-medium text-brand' : ''
              }`}
            >
              {m.title || '…'}
            </button>
            <button
              type="button"
              onClick={() => void remove(m.id)}
              aria-label={t('deleteConversation', 'Delete conversation')}
              className="rounded-lg p-2 text-ink-dim opacity-0 transition-opacity hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
        <MenuDivider />
        <HistoryTransfer />
      </Menu>
    </div>
  )
}
