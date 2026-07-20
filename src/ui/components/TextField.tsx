import type { InputHTMLAttributes } from 'react'

/** The one text input for settings forms — owns the field styling so the
 * class string can't drift between forms. */
export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none focus:border-brand/50"
    />
  )
}
