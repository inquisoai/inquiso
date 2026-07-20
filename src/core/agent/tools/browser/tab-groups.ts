import { z } from 'zod'
import { guardPermission } from '@/core/auth/api-permissions'
import { browser } from '@/platform'
import { defineTool } from '../context'

// Chromium-only; Firefox has no tab groups. Feature-detected at call time.
// biome-ignore lint/suspicious/noExplicitAny: tabs.group/ungroup + tabGroups are untyped/optional.
const api = browser as any

export const groupTabs = defineTool({
  name: 'groupTabs',
  description:
    'Group tabs into a named tab group (Chromium; needs the tabGroups permission). Needs confirmation.',
  risk: 'medium',
  inputSchema: z.object({
    tabIds: z.array(z.number().int()).min(1).max(50),
    title: z.string().max(60).optional(),
    color: z.string().max(20).optional(),
  }),
  execute: async ({ tabIds, title, color }) => {
    if (typeof api.tabs?.group !== 'function') return { ok: false, error: 'unsupported' }
    const denied = await guardPermission('tabGroups')
    if (denied) return denied
    const groupId = await api.tabs.group({ tabIds })
    if (title || color)
      await api.tabGroups.update(groupId, { ...(title && { title }), ...(color && { color }) })
    return { ok: true, groupId }
  },
})

export const ungroupTabs = defineTool({
  name: 'ungroupTabs',
  description: 'Remove tabs from their group (Chromium; needs the tabGroups permission).',
  risk: 'low',
  inputSchema: z.object({ tabIds: z.array(z.number().int()).min(1).max(50) }),
  execute: async ({ tabIds }) => {
    if (typeof api.tabs?.ungroup !== 'function') return { ok: false, error: 'unsupported' }
    const denied = await guardPermission('tabGroups')
    if (denied) return denied
    await api.tabs.ungroup(tabIds)
    return { ok: true }
  },
})
