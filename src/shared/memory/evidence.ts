import { z } from 'zod'

/**
 * Evidence that an action really did (or did not) change browser state.
 * Collected by the outcome verifier (docs/memory-agent/overview.md); only
 * evidence-backed success may reinforce a memory or skill.
 */
export const ActionEvidence = z.discriminatedUnion('type', [
  z.object({ type: z.literal('url_changed'), from: z.string(), to: z.string() }),
  z.object({ type: z.literal('title_changed'), from: z.string(), to: z.string() }),
  z.object({
    type: z.literal('element_state_changed'),
    handle: z.string().optional(),
    before: z.string().max(200).optional(),
    after: z.string().max(200).optional(),
  }),
  z.object({ type: z.literal('text_appeared'), text: z.string().max(500) }),
  z.object({
    type: z.literal('download_started'),
    filename: z.string().optional(),
    mimeType: z.string().optional(),
  }),
  z.object({ type: z.literal('network_response'), urlPattern: z.string(), status: z.number() }),
  z.object({
    type: z.literal('record_appeared'),
    entityType: z.string(),
    identifier: z.string(),
  }),
  z.object({ type: z.literal('user_confirmed'), confirmationId: z.string() }),
  z.object({ type: z.literal('tool_error'), error: z.string().max(500) }),
  z.object({
    type: z.literal('custom_validator'),
    validatorId: z.string(),
    result: z.boolean(),
  }),
])
export type ActionEvidence = z.infer<typeof ActionEvidence>

/** Verifier classification. `uncertain` must never be treated as success. */
export const OUTCOMES = ['verified_success', 'verified_failure', 'uncertain'] as const
export const Outcome = z.enum(OUTCOMES)
export type Outcome = z.infer<typeof Outcome>
