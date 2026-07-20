/** Id prefixes used across the memory system, one per record family. */
export type IdPrefix = 'task' | 'run' | 'evt' | 'mem' | 'cand' | 'skill' | 'pol'

/** Unique, time-prefixed id (sortable by creation within a session). */
export const newId = (prefix: IdPrefix): string =>
  `${prefix}_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`
