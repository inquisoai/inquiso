import { z } from 'zod'
import { slugify } from './util/slug'

/**
 * A user-configured MCP (Model Context Protocol) server. Only non-secret
 * metadata lives here; any auth token is stored encrypted in the background
 * secret store under `mcp:<id>`, never synced or sent to the UI. HTTP transport
 * only — the background worker has no EventSource for SSE.
 */
export const McpServer = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(60),
  url: z.string().url(),
  /** Whether the server needs a bearer token (stored separately, encrypted). */
  auth: z.boolean(),
})
export type McpServer = z.infer<typeof McpServer>

/** Stable id from a label (same slug as custom providers' slugId). */
export const mcpId = (label: string): string => slugify(label).slice(0, 64) || 'mcp'

/** Secret-store key holding a server's bearer token. */
export const mcpTokenKey = (id: string): string => `mcp:${id}`
