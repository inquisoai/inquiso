import type { PageContext } from '@/shared/page'
import { memoryBudgetBytes } from './budget'
import { ByteLru } from './lru'

const cache = new ByteLru<PageContext>(memoryBudgetBytes())
const inflight = new Map<string, Promise<PageContext>>()

/** Approximate retained bytes (UTF-16) for budgeting. */
const bytesOf = (p: PageContext): number => p.text.length * 2

/**
 * Returns cached page context for `key`, or runs `load` once — coalescing
 * concurrent requests for the same key into a single extraction.
 */
export async function getCached(
  key: string,
  load: () => Promise<PageContext>,
): Promise<PageContext> {
  const hit = cache.get(key)
  if (hit) return hit

  const pending = inflight.get(key)
  if (pending) return pending

  const promise = load()
    .then((page) => {
      cache.set(key, page, bytesOf(page))
      return page
    })
    .finally(() => inflight.delete(key))

  inflight.set(key, promise)
  return promise
}

export const clearPageCache = (): void => cache.clear()
