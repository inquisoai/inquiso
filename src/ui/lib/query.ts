import { QueryClient } from '@tanstack/react-query'

/**
 * One QueryClient per UI context (side panel, options). Defaults are tuned
 * for a serverless extension where the "backend" is the background worker
 * over runtime messaging, backed by local IndexedDB:
 * - networkMode 'always': online/offline detection is meaningless for a
 *   runtime-message transport and would pause queries on offline machines.
 * - retry 0: a failed background message is a bug, not network weather.
 * - staleTime 30s: screen switches within the panel reuse the cache;
 *   mutations and browser events invalidate explicitly (see invalidate.ts).
 */
export function createUiQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { networkMode: 'always', retry: 0, staleTime: 30_000 },
      mutations: { networkMode: 'always', retry: 0 },
    },
  })
}
