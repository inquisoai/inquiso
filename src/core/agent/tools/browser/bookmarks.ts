import { z } from 'zod'
import { guardPermission } from '@/core/auth/api-permissions'
import { browser } from '@/platform'
import { defineTool } from '../context'

interface Node {
  title?: string
  url?: string
  children?: Node[]
}

/** Flattens the bookmark tree to a capped list of {title, url}. */
function flatten(nodes: Node[], out: { title: string; url: string }[], cap: number): void {
  for (const n of nodes) {
    if (out.length >= cap) return
    if (n.url) out.push({ title: n.title ?? '', url: n.url })
    if (n.children) flatten(n.children, out, cap)
  }
}

export const addBookmark = defineTool({
  name: 'addBookmark',
  description: 'Bookmark a URL (needs the bookmarks permission). Needs confirmation.',
  risk: 'medium',
  inputSchema: z.object({ url: z.string().url(), title: z.string().max(300) }),
  execute: async ({ url, title }) => {
    const denied = await guardPermission('bookmarks')
    if (denied) return denied
    const node = await browser.bookmarks.create({ url, title })
    return { ok: true, id: node.id }
  },
})

export const listBookmarks = defineTool({
  name: 'listBookmarks',
  description: 'List saved bookmarks (needs the bookmarks permission).',
  risk: 'none',
  inputSchema: z.object({ limit: z.number().int().positive().max(200).optional() }),
  execute: async ({ limit }) => {
    const denied = await guardPermission('bookmarks')
    if (denied) return denied
    const items: { title: string; url: string }[] = []
    flatten(await browser.bookmarks.getTree(), items, limit ?? 100)
    return { bookmarks: items }
  },
})

export const searchBookmarks = defineTool({
  name: 'searchBookmarks',
  description: 'Search bookmarks by text (needs the bookmarks permission).',
  risk: 'none',
  inputSchema: z.object({ query: z.string().min(1) }),
  execute: async ({ query }) => {
    const denied = await guardPermission('bookmarks')
    if (denied) return denied
    const found = await browser.bookmarks.search(query)
    return { bookmarks: found.filter((b) => b.url).map((b) => ({ title: b.title, url: b.url })) }
  },
})
