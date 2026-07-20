interface Entry<V> {
  value: V
  bytes: number
}

/**
 * Least-recently-used cache bounded by an approximate byte budget. The hot
 * (in-memory) layer from docs/06-caching-memory.md. Map insertion order tracks
 * recency: `get` bumps an entry to newest; eviction drops from the oldest end.
 */
export class ByteLru<V> {
  private readonly map = new Map<string, Entry<V>>()
  private used = 0

  constructor(private readonly maxBytes: number) {}

  get(key: string): V | undefined {
    const entry = this.map.get(key)
    if (!entry) return undefined
    this.map.delete(key)
    this.map.set(key, entry)
    return entry.value
  }

  set(key: string, value: V, bytes: number): void {
    const existing = this.map.get(key)
    if (existing) {
      this.used -= existing.bytes
      this.map.delete(key)
    }
    this.map.set(key, { value, bytes })
    this.used += bytes
    this.evict()
  }

  private evict(): void {
    for (const [key, entry] of this.map) {
      if (this.used <= this.maxBytes) break
      this.used -= entry.bytes
      this.map.delete(key)
    }
  }

  clear(): void {
    this.map.clear()
    this.used = 0
  }

  get size(): number {
    return this.map.size
  }

  get bytes(): number {
    return this.used
  }
}
