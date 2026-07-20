import type { Autonomy } from './autonomy'
import type { McpServer } from './mcp'
import type { ProviderInfo } from './providers'
import type { SyncConfig } from './sync'

/** Everything the UI needs to render provider/model settings. Contains no
 * secrets — only whether a key is present, never the key itself. */
export interface AppConfig {
  providerId: string
  models: Record<string, string>
  providers: ProviderInfo[]
  keyStatus: Record<string, boolean>
  /** Whether to request the model's reasoning trace where supported. */
  reasoning: boolean
  /** Whether to allow provider-native web search where supported. */
  webSearch: boolean
  /** Default hands-off level for new runs. */
  autonomy: Autonomy
  /** Configured MCP servers (metadata only — tokens never leave the worker). */
  mcpServers: McpServer[]
  /** Cloud-backup config (non-secret; credentials stay in the worker). */
  sync: SyncConfig
}
