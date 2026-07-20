import { type Tool, type ToolSet, tool } from 'ai'
import { hasHostPermission } from '@/core/auth/host-permissions'
import { getKey } from '@/core/auth/secret-store'
import { getSettings } from '@/core/data/settings/store'
import { mcpTokenKey } from '@/shared/mcp'
import { createLogger } from '@/shared/util/logger'
import { riskGate } from '../autonomy'
import type { ToolContext } from '../tools/context'

const log = createLogger('mcp')

export interface McpBundle {
  tools: ToolSet
  close: () => Promise<void>
}
const EMPTY: McpBundle = { tools: {}, close: async () => {} }

/** The slice of an MCP tool we re-wrap (its schema is only known at runtime). */
interface McpTool {
  description?: string
  inputSchema: unknown
  execute?: (args: unknown, opts: unknown) => unknown
}

/** Wraps one MCP tool so external, opaque actions flow through the SAME confirm
 * gate as native tools. MCP tools are unknown and potentially irreversible
 * (send email, write data), so they take the unknown-tool default: high —
 * always confirm, regardless of autonomy (docs/05). */
function gate(label: string, mcpTool: McpTool, ctx: ToolContext): Tool {
  return tool({
    description: mcpTool.description ?? label,
    // biome-ignore lint/suspicious/noExplicitAny: MCP tools carry a runtime (dynamic) schema.
    inputSchema: mcpTool.inputSchema as any,
    execute: async (args: unknown, opts: unknown) => {
      if (riskGate('high', ctx.autonomy) && !(await ctx.confirm(`mcp:${label}`, args))) {
        return { ok: false, error: 'user_rejected' }
      }
      return mcpTool.execute?.(args, opts)
    },
  })
}

/**
 * Connects to the user's configured MCP servers over HTTP, exposes their tools
 * to the agent (gated + namespaced by server), and returns a close() to tear
 * the connections down when the run ends. Tokens stay in the background. An
 * unreachable server is skipped so the rest of the run still works.
 */
export async function openMcpTools(ctx: ToolContext): Promise<McpBundle> {
  const { mcpServers } = await getSettings()
  if (!mcpServers.length) return EMPTY
  const { createMCPClient } = await import('@ai-sdk/mcp')
  const clients: { close: () => Promise<void> }[] = []
  const tools: ToolSet = {}
  for (const s of mcpServers) {
    // The origin grant is verified per run, not just at add time — a revoked
    // grant means the server's tools simply don't join the run (docs/05 T5).
    if (!(await hasHostPermission(s.url))) {
      log.warn(`skipping ${s.label}: origin permission not granted`)
      continue
    }
    try {
      const token = s.auth ? await getKey(mcpTokenKey(s.id)) : ''
      const client = await createMCPClient({
        transport: {
          type: 'http',
          url: s.url,
          ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
        },
      })
      clients.push(client)
      for (const [name, t] of Object.entries(await client.tools())) {
        tools[`mcp_${s.id}_${name}`] = gate(`${s.label}/${name}`, t as unknown as McpTool, ctx)
      }
    } catch (e) {
      // Skip a server we can't reach or that fails to list tools — but say so,
      // or the user never learns why a configured server's tools are missing.
      log.warn(`skipping ${s.label}: ${String(e)}`)
    }
  }
  return {
    tools,
    close: async () => {
      for (const c of clients) await c.close().catch(() => {})
    },
  }
}
