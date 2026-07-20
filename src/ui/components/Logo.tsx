interface Props {
  className?: string
}

/**
 * The Inquiso mark: a ring + focus dot (an aperture that "reads" the page) with
 * a short tail that turns it into a Q — for query / inquiry. Monoline, uses
 * currentColor so it takes the brand accent in the UI and knocks out to white
 * on the app tile. Legible down to 16px.
 */
export function Logo({ className }: Props) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="3.4" />
      <circle cx="14" cy="14" r="2.6" fill="currentColor" />
      <path d="M20.4 20.4 27 27" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  )
}
