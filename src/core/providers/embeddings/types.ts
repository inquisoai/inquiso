/** Provider-agnostic text embedder. A cloud (AI SDK) embedder ships now; an
 * on-device Transformers.js embedder or Chrome's built-in Embedding API can
 * implement the same interface later (docs/06-caching-memory.md). */
export interface Embedder {
  /** Stable id (e.g. "openai:text-embedding-3-small") — used as a cache-key prefix. */
  id: string
  embed(texts: string[]): Promise<number[][]>
}
