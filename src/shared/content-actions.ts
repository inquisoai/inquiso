import { z } from 'zod'

/** A stable, opaque reference to a page element. The model acts on handles,
 * never on raw selectors or coordinates (docs/04-agent-system.md). */
export const ElementHandle = z.object({
  id: z.string(),
  role: z.string(),
  name: z.string(),
  tag: z.string(),
})
export type ElementHandle = z.infer<typeof ElementHandle>

export const QueryArgs = z.object({
  role: z.string().optional(),
  text: z.string().optional(),
  selector: z.string().optional(),
  limit: z.number().int().positive().max(50).optional(),
})
export type QueryArgs = z.infer<typeof QueryArgs>

export const ActArgs = z.object({
  action: z.enum(['click', 'type', 'scrollTo', 'selectOption', 'submit', 'highlight']),
  handle: z.string(),
  /** Field text for `type`, or the option value/label for `selectOption`. */
  text: z.string().optional(),
})
export type ActArgs = z.infer<typeof ActArgs>

/** Observable element state — the outcome verifier compares before/after
 * snapshots to evidence what an action really changed. Password values are
 * never included (the content script withholds them at the source). */
export const ElementState = z.object({
  exists: z.boolean(),
  value: z.string().max(500).optional(),
  checked: z.boolean().optional(),
  disabled: z.boolean().optional(),
  text: z.string().max(200).optional(),
  /** Accessible-ish name + role — the raw material for semantic locators. */
  name: z.string().max(80).optional(),
  role: z.string().max(40).optional(),
})
export type ElementState = z.infer<typeof ElementState>

/** Messages the background sends to the injected content script. */
export const ContentMsg = z.discriminatedUnion('type', [
  z.object({ type: z.literal('extract') }),
  z.object({ type: z.literal('query'), args: QueryArgs }),
  z.object({ type: z.literal('act'), args: ActArgs }),
  z.object({ type: z.literal('state'), handle: z.string() }),
  z.object({ type: z.literal('getSelection') }),
  z.object({ type: z.literal('links'), limit: z.number().int().positive().max(200).optional() }),
  z.object({ type: z.literal('tables'), limit: z.number().int().positive().max(20).optional() }),
  z.object({ type: z.literal('metadata') }),
  z.object({
    type: z.literal('waitFor'),
    selector: z.string(),
    timeoutMs: z.number().int().positive().max(30_000).optional(),
  }),
])
export type ContentMsg = z.infer<typeof ContentMsg>

export const ActResult = z.object({ ok: z.boolean(), error: z.string().optional() })
export type ActResult = z.infer<typeof ActResult>
