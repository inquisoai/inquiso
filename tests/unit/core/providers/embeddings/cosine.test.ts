import { describe, expect, it } from 'vitest'
import { cosineSimilarity } from '@/core/providers/embeddings/cosine'

describe('cosineSimilarity', () => {
  it('is 1 for identical direction', () => {
    expect(cosineSimilarity([1, 2, 3], [2, 4, 6])).toBeCloseTo(1)
  })

  it('is 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0)
  })

  it('is -1 for opposite direction', () => {
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1)
  })

  it('returns 0 when a vector is all zeros', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0)
  })

  it('ranks a closer vector higher', () => {
    const query = [1, 0, 0]
    const near = cosineSimilarity(query, [0.9, 0.1, 0])
    const far = cosineSimilarity(query, [0.1, 0.9, 0])
    expect(near).toBeGreaterThan(far)
  })
})
