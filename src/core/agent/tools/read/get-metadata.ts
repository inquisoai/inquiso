import { z } from 'zod'
import { sendToTab } from '@/core/context/tab'
import { defineTool } from '../context'

export const getMetadata = defineTool({
  name: 'getMetadata',
  description: 'Read page metadata (title, description, author, OpenGraph) — useful for trust.',
  risk: 'none',
  inputSchema: z.object({}),
  execute: (_args, ctx) => sendToTab(ctx.tabId, { type: 'metadata' }),
})
