import type { ReactNode } from 'react'

/** Non-interactive section label inside a Menu. */
export function MenuLabel({ children }: { children: ReactNode }) {
  return <p className="px-3 pt-2 pb-1 font-medium text-ink-dim text-sm">{children}</p>
}
