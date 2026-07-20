import { describe, expect, it } from 'vitest'
import { toolDefs } from '@/core/agent/tools/registry'
import { API_PERMISSIONS, type ApiPermission } from '@/core/auth/api-permissions'

/** Which optional permission each gated browser tool guards on (mirrors the
 * guardPermission calls in the tool handlers) — the invariant under test. */
const TOOL_PERMISSION: Record<string, ApiPermission> = {
  addBookmark: 'bookmarks',
  listBookmarks: 'bookmarks',
  searchBookmarks: 'bookmarks',
  searchHistory: 'history',
  reopenClosedTab: 'sessions',
  groupTabs: 'tabGroups',
  ungroupTabs: 'tabGroups',
}

describe('api-permission map', () => {
  const names = new Set(toolDefs.map((d) => d.name))

  it('maps only real registered tools', () => {
    for (const tool of Object.keys(TOOL_PERMISSION)) {
      expect(names.has(tool)).toBe(true)
    }
  })

  it('every mapped permission is a known optional permission', () => {
    for (const perm of Object.values(TOOL_PERMISSION)) {
      expect(API_PERMISSIONS).toContain(perm)
    }
  })

  it('covers each permission-gated browser tool', () => {
    for (const tool of [
      'addBookmark',
      'listBookmarks',
      'searchBookmarks',
      'searchHistory',
      'reopenClosedTab',
      'groupTabs',
      'ungroupTabs',
    ]) {
      expect(names.has(tool)).toBe(true)
      expect(TOOL_PERMISSION[tool]).toBeDefined()
    }
  })

  it('permission-free browser tools are NOT in the map', () => {
    for (const tool of ['openTab', 'closeTab', 'newWindow', 'listWindows', 'closeWindow']) {
      expect(TOOL_PERMISSION[tool]).toBeUndefined()
    }
  })
})
