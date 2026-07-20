import type { ReactNode } from 'react'

interface Props {
  /** `label` when the row wraps a single control (whole row clickable). */
  as?: 'div' | 'label' | 'section'
  children: ReactNode
}

/** The bordered settings row: content left, control right. One home for the
 * row class shared by toggles, selects, and connected-item rows. */
export function SettingRow({ as: Tag = 'div', children }: Props) {
  return (
    <Tag className="flex items-center justify-between gap-3 rounded-2xl border border-line p-3.5">
      {children}
    </Tag>
  )
}
