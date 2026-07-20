/**
 * Derives the hot-cache byte budget from the device's memory so Inquiso stays
 * well-behaved inside the browser's limits (docs/06-caching-memory.md).
 */
export function memoryBudgetBytes(): number {
  const nav = navigator as Navigator & { deviceMemory?: number }
  const deviceGb = nav.deviceMemory ?? 4
  // A small slice of RAM, clamped to [32, 128] MB.
  const mb = Math.min(128, Math.max(32, deviceGb * 16))
  return mb * 1024 * 1024
}
