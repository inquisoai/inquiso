/**
 * In-memory stand-in for localforage so store logic is unit-testable in node.
 * Use from a test file as:
 *   vi.mock('localforage', async () => (await import('../../helpers/memdb')).localforageMock())
 */
export function localforageMock() {
  const dbs = new Map<string, Map<string, unknown>>()
  const instance = (storeName: string) => {
    const db = dbs.get(storeName) ?? new Map<string, unknown>()
    dbs.set(storeName, db)
    return {
      getItem: async (k: string) => db.get(k) ?? null,
      setItem: async (k: string, v: unknown) => {
        db.set(k, v)
        return v
      },
      removeItem: async (k: string) => {
        db.delete(k)
      },
      keys: async () => [...db.keys()],
      iterate: async (fn: (v: unknown, k: string, i: number) => unknown) => {
        let i = 0
        for (const [k, v] of db) {
          i += 1
          const r = fn(v, k, i)
          if (r !== undefined) return r
        }
        return undefined
      },
      clear: async () => db.clear(),
      length: async () => db.size,
    }
  }
  return {
    default: {
      createInstance: ({ storeName }: { storeName: string }) => instance(storeName),
      INDEXEDDB: 'asyncStorage',
    },
  }
}
