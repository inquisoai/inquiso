import { z } from 'zod'
import { guardPermission } from '@/core/auth/api-permissions'
import { browser } from '@/platform'
import { defineTool } from '../context'

/** Reopens the most recently closed tab/window, or a specific one by session
 * id (needs the sessions permission). Low risk — additive. */
export const reopenClosedTab = defineTool({
  name: 'reopenClosedTab',
  description: 'Reopen a recently closed tab/window (needs the sessions permission).',
  risk: 'low',
  inputSchema: z.object({ sessionId: z.string().optional() }),
  execute: async ({ sessionId }) => {
    const denied = await guardPermission('sessions')
    if (denied) return denied
    await browser.sessions.restore(sessionId)
    return { ok: true }
  },
})
