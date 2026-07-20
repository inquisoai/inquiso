import { z } from 'zod'

/**
 * Layered semantic element locator (docs/memory-agent/browser-skills.md).
 * Resolution prefers meaning over markup: role + accessible name first, then
 * visible text and nearby labels, with CSS only as a last-resort fallback —
 * so a learned skill survives cosmetic DOM churn.
 */
export const ElementLocator = z.object({
  role: z.string().optional(),
  accessibleName: z.string().optional(),
  visibleText: z.string().optional(),
  placeholder: z.string().optional(),
  nearbyText: z.array(z.string()).optional(),
  /** Human/model-readable description, e.g. `the "Export" button`. */
  semanticDescription: z.string().max(200),
  cssFallback: z.string().optional(),
})
export type ElementLocator = z.infer<typeof ElementLocator>
