import type { ReactNode } from 'react'
import { CheckIcon } from '@/ui/components/icons'

interface Props {
  onClick?: () => void
  icon?: ReactNode
  trailing?: ReactNode
  /** Marks the currently-selected option with the house checkmark. */
  selected?: boolean
  disabled?: boolean
  children: ReactNode
}

/** One row in a Menu: hover tint, optional leading icon and trailing accessory. */
export function MenuItem({
  onClick,
  icon,
  trailing,
  selected = false,
  disabled = false,
  children,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors enabled:hover:bg-surface-2 disabled:text-ink-dim"
    >
      {icon && <span className="text-ink-dim">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing ?? (selected ? <CheckIcon className="text-brand" /> : undefined)}
    </button>
  )
}
