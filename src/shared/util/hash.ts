/**
 * Fast, dependency-free FNV-1a 32-bit string hash. Used to key cached page
 * content so re-visits reuse the cache only when content is truly unchanged
 * (docs/06-caching-memory.md). Not cryptographic — never use for security.
 */
export function hashString(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}
