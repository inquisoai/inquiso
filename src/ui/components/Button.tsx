import type { ButtonHTMLAttributes } from 'react'

const styles = {
  /** Brand-filled pill — the submit/confirm action. */
  primary:
    'rounded-full bg-brand py-2 text-surface text-xs transition-transform active:scale-95 disabled:bg-surface-3 disabled:text-ink-dim',
  /** Bordered pill — the quiet secondary action (remove, clear, cancel). */
  secondary:
    'shrink-0 rounded-full border border-line px-3 py-1.5 text-xs transition-colors hover:bg-surface-2',
} as const

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof styles
}

/** Pill button in the two house styles. `className` is for layout additions
 * only (e.g. flex-1) — the look lives here. */
export function Button({ variant = 'primary', className, type, ...rest }: Props) {
  return (
    <button
      type={type ?? 'button'}
      {...rest}
      className={`${styles[variant]}${className ? ` ${className}` : ''}`}
    />
  )
}
