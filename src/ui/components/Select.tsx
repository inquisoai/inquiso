import type { ReactNode } from 'react'
import { ChevronDownIcon } from './icons'

interface Props {
  value: string
  onChange: (value: string) => void
  /** Pill styling on the <select> itself (bg / border / hover / text). */
  className?: string
  /** Layout on the wrapper (e.g. `shrink-0`, `min-w-0`). */
  wrapClassName?: string
  'aria-label'?: string
  title?: string
  children: ReactNode
}

/**
 * Native <select> with our own chevron. Browsers pin the built-in arrow hard
 * against the edge and `padding-right` only spaces the text from it, so it
 * always looks cramped — `appearance-none` hides it and we place a
 * ChevronDownIcon with real breathing room. One consistent dropdown everywhere.
 */
export function Select({
  value,
  onChange,
  className = '',
  wrapClassName = '',
  children,
  ...rest
}: Props) {
  return (
    <span className={`relative inline-flex items-center ${wrapClassName}`}>
      <select
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full cursor-pointer appearance-none rounded-full py-1.5 pr-7 pl-2.5 text-xs outline-none ${className}`}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-ink-dim" />
    </span>
  )
}
