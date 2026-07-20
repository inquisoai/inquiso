import type { ToolSet } from 'ai'
import { openMcpTools } from '../mcp/tools'
import type { ToolContext } from './context'
import { buildTools } from './registry'

export interface RunTools {
  tools: ToolSet
  close: () => Promise<void>
}

/**
 * The complete tool set for a run: built-in registry tools + subagents, the
 * provider's native tools (e.g. web search), and the user's MCP-server tools
 * (gated + namespaced). `close()` tears down the MCP connections when the run
 * ends. Kept out of run-agent so the loop stays small.
 */
export async function buildRunTools(ctx: ToolContext, nativeTools?: ToolSet): Promise<RunTools> {
  const mcp = await openMcpTools(ctx)
  return {
    tools: { ...buildTools(ctx), ...nativeTools, ...mcp.tools },
    close: mcp.close,
  }
}
