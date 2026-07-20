import type { ReactNode } from 'react'

export interface IconProps {
  className?: string
}

/** Inline icon set (stroke = currentColor), decorative — surrounding buttons
 * carry the aria-labels. */
export const Icon = ({ className, children }: IconProps & { children: ReactNode }) => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {children}
  </svg>
)
