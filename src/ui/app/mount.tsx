import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { wireInvalidation } from '@/ui/lib/invalidate'
import { createUiQueryClient } from '@/ui/lib/query'
import '@/styles/main.css'

/** Mounts a React app into #root with the context-wide QueryClient. Shared
 * by every UI entrypoint (side panel, options), one client per context. */
export function mount(app: React.ReactNode): void {
  const el = document.getElementById('root')
  if (!el) throw new Error('missing #root')
  const client = createUiQueryClient()
  wireInvalidation(client)
  createRoot(el).render(
    <StrictMode>
      <QueryClientProvider client={client}>{app}</QueryClientProvider>
    </StrictMode>,
  )
}
