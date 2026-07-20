/** Deterministic, structured readers of the live DOM — complements the
 * Readability text extraction with links, tables, metadata, and the user's
 * selection. All read-only. */

export interface LinkInfo {
  text: string
  href: string
}

export function getSelectionText(): string {
  return (window.getSelection()?.toString() ?? '').trim().slice(0, 4000)
}

export function listLinks(limit = 100): LinkInfo[] {
  const out: LinkInfo[] = []
  for (const a of document.querySelectorAll('a[href]')) {
    if (out.length >= limit) break
    const href = (a as HTMLAnchorElement).href
    const text = (a.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120)
    if (href && !href.startsWith('javascript:')) out.push({ text, href })
  }
  return out
}

export function readTables(limit = 10): string[][][] {
  const tables: string[][][] = []
  for (const table of document.querySelectorAll('table')) {
    if (tables.length >= limit) break
    const rows: string[][] = []
    for (const tr of table.querySelectorAll('tr')) {
      const cells = [...tr.querySelectorAll('th,td')].map((c) =>
        (c.textContent ?? '').replace(/\s+/g, ' ').trim(),
      )
      if (cells.length) rows.push(cells)
    }
    if (rows.length) tables.push(rows)
  }
  return tables
}

export function getMetadata(): Record<string, string> {
  const meta: Record<string, string> = { title: document.title, url: location.href }
  for (const el of document.querySelectorAll('meta[name],meta[property]')) {
    const key = el.getAttribute('name') || el.getAttribute('property') || ''
    const content = el.getAttribute('content') || ''
    if (key && content && /^(description|author|og:|article:)/.test(key)) meta[key] = content
  }
  return meta
}

/** Resolves once the selector appears, or false on timeout. */
export function waitForSelector(selector: string, timeoutMs = 10_000): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) return resolve(true)
    const obs = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        obs.disconnect()
        resolve(true)
      }
    })
    obs.observe(document.documentElement, { childList: true, subtree: true })
    setTimeout(() => {
      obs.disconnect()
      resolve(!!document.querySelector(selector))
    }, timeoutMs)
  })
}
