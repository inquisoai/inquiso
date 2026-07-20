import localforage from 'localforage'

/** Every persistent store shares the one 'inquiso' IndexedDB database; each
 * module gets its own object store. One factory so the database name can never
 * drift between modules. */
export const appStore = (storeName: string, options?: LocalForageOptions): LocalForage =>
  localforage.createInstance({ name: 'inquiso', storeName, ...options })
