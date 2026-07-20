import { describe, expect, it } from 'vitest'
import { ByteLru } from '@/core/data/cache/lru'

describe('ByteLru', () => {
  it('stores and retrieves values', () => {
    const lru = new ByteLru<string>(100)
    lru.set('a', 'hello', 5)
    expect(lru.get('a')).toBe('hello')
    expect(lru.bytes).toBe(5)
  })

  it('evicts the least-recently-used entry when over budget', () => {
    const lru = new ByteLru<string>(10)
    lru.set('a', 'a', 5)
    lru.set('b', 'b', 5)
    lru.set('c', 'c', 5) // pushes over budget → 'a' evicted
    expect(lru.get('a')).toBeUndefined()
    expect(lru.get('b')).toBe('b')
    expect(lru.get('c')).toBe('c')
  })

  it('treats a read as recent use', () => {
    const lru = new ByteLru<string>(10)
    lru.set('a', 'a', 5)
    lru.set('b', 'b', 5)
    lru.get('a') // 'a' is now most recent
    lru.set('c', 'c', 5) // 'b' should be evicted instead of 'a'
    expect(lru.get('a')).toBe('a')
    expect(lru.get('b')).toBeUndefined()
  })

  it('replaces an existing key without double-counting bytes', () => {
    const lru = new ByteLru<string>(100)
    lru.set('a', 'one', 3)
    lru.set('a', 'two', 3)
    expect(lru.bytes).toBe(3)
    expect(lru.size).toBe(1)
  })

  it('clears all entries', () => {
    const lru = new ByteLru<string>(100)
    lru.set('a', 'a', 5)
    lru.clear()
    expect(lru.size).toBe(0)
    expect(lru.bytes).toBe(0)
  })
})
