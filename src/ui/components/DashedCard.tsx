import type { ReactNode } from 'react'

/** Dashed "set something up here" container used by the connect/add forms. */
export function DashedCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line border-dashed p-3.5">
      {children}
    </div>
  )
}
