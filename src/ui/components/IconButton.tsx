import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'title'> {
  /** Accessible name — feeds both aria-label and the hover title. */
  label: string
  children: ReactNode
}

/** The 8×8 round icon-only button (header/menu actions). */
export function IconButton({ label, className, type, ...rest }: Props) {
  return (
    <button
      type={type ?? 'button'}
      aria-label={label}
      title={label}
      {...rest}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink${className ? ` ${className}` : ''}`}
    />
  )
}
