import { z } from 'zod'
import { slugify } from './util/slug'

/** A user-defined OpenAI-compatible provider (gateway, self-hosted, or local
 * server). Persisted in settings; the API key lives in the encrypted store,
 * keyed by id. `id` is slugified from the label at creation. */
export const CustomProvider = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(60),
  /** OpenAI-compatible base URL, e.g. https://openrouter.ai/api/v1. */
  baseURL: z.string().url(),
  /** Default model id typed by the user (free text — the endpoint validates). */
  model: z.string().min(1).max(120),
  /** Local servers (localhost) need no key. */
  requiresKey: z.boolean(),
})
export type CustomProvider = z.infer<typeof CustomProvider>

/** Origin pattern (`https://host/*`) for the runtime host-permission grant. */
export function originPattern(baseURL: string): string {
  return `${new URL(baseURL).origin}/*`
}

/** Stable id from a label: lowercase, non-alphanumerics to dashes. */
export function slugId(label: string): string {
  return `custom:${slugify(label) || 'provider'}`
}
