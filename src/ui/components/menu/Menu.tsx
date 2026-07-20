import type { ReactNode } from 'react'
import { t } from '@/shared/util/i18n'

interface Props {
  open: boolean
  onClose: () => void
  /** Panel placement relative to the trigger's wrapper. */
  side?: 'up' | 'down'
  /** Which edge the panel aligns to (which way it grows). */
  align?: 'left' | 'right'
  /** Stretch across the panel instead of hugging the trigger. */
  fullWidth?: boolean
  children: ReactNode
}

/**
 * Shared popover: backdrop click-away + animated panel, styled like the
 * bottom-sheet/dropdown menus in modern chat apps. Wrap the trigger and this
 * in a `relative` container. Rows/labels/dividers: MenuItem, MenuLabel,
 * MenuDivider.
 */
export function Menu({
  open,
  onClose,
  side = 'down',
  align = 'right',
  fullWidth = false,
  children,
}: Props) {
  if (!open) return null
  const pos = side === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
  const edge = align === 'left' ? 'left-0' : 'right-0'
  const width = fullWidth ? 'fixed right-3 left-3' : `absolute ${edge} w-60`
  return (
    <>
      <button
        type="button"
        aria-label={t('closeMenu', 'Close menu')}
        onClick={onClose}
        className="fixed inset-0 z-10 cursor-default"
      />
      <div
        className={`${width} ${fullWidth ? (side === 'up' ? 'bottom-20' : 'top-12') : pos} menu-pop z-20 max-h-96 overflow-auto rounded-2xl border border-line bg-surface p-1.5 shadow-xl`}
      >
        {children}
      </div>
    </>
  )
}
