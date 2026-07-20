import { z } from 'zod'
import { defaultDef } from '@/core/providers/registry'
import { AUTONOMY_LEVELS, DEFAULT_AUTONOMY } from '@/shared/autonomy'
import { CustomProvider } from '@/shared/custom-provider'
import { McpServer } from '@/shared/mcp'
import { DEFAULT_SYNC, SyncConfig } from '@/shared/sync'

/** Keeps the valid entries of a stored array, dropping corrupt ones — a bad
 * record loses itself, never its siblings. */
const salvageArray = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess(
    (v) => (Array.isArray(v) ? v.filter((x) => item.safeParse(x).success) : []),
    z.array(item),
  )

/**
 * Non-secret user settings (API keys live in the encrypted secret store).
 * A Zod schema so `storage.local` reads are validated like every other
 * boundary: each corrupt field falls back to its default individually.
 */
export const Settings = z.object({
  /** Selected provider id; defaults to the platform's first provider
   * (Chrome AI on Chromium, WebLLM on Firefox). */
  providerId: z.string().catch(defaultDef.id),
  /** Chosen model id per provider. */
  models: z.record(z.string(), z.string()).catch({}),
  /** User-added OpenAI-compatible providers. */
  customProviders: salvageArray(CustomProvider).catch([]),
  /** Request the model's reasoning trace where supported (costs tokens). */
  reasoning: z.boolean().catch(true),
  /** Allow the provider's native web search where supported (sends the query
   * to the provider — a data-egress choice). */
  webSearch: z.boolean().catch(true),
  /** Default hands-off level for new runs (docs/adr/0003). */
  autonomy: z.enum(AUTONOMY_LEVELS).catch(DEFAULT_AUTONOMY),
  /** User-configured MCP servers whose tools the agent may call. */
  mcpServers: salvageArray(McpServer).catch([]),
  /** Cloud-backup config (BYO cloud; docs/adr/0004). */
  sync: SyncConfig.catch(DEFAULT_SYNC),
  /** Memory-agent controls (docs/memory-agent): automatic learning on/off and
   * per-site opt-outs. Memory itself always stays local. */
  memory: z
    .object({
      autoLearn: z.boolean().catch(true),
      disabledOrigins: z.array(z.string()).catch([]),
    })
    .catch({ autoLearn: true, disabledOrigins: [] }),
})
export type Settings = z.infer<typeof Settings>

/** Every field's catch default — what a fresh (or unreadable) install gets. */
export const DEFAULTS: Settings = Settings.parse({})
