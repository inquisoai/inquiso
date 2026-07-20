import type { ElementHandle, QueryArgs } from '@/shared/content-actions'
import { nameOf, roleOf, tagElement } from './handles'

const INTERACTIVE = 'a,button,input,textarea,select,[role=button],[role=link],[role=checkbox]'

function matches(el: Element, args: QueryArgs): boolean {
  if (args.role && roleOf(el) !== args.role) return false
  if (args.text) {
    const haystack = `${nameOf(el)} ${el.textContent ?? ''}`.toLowerCase()
    if (!haystack.includes(args.text.toLowerCase())) return false
  }
  return true
}

/** Finds candidate elements matching the query and returns opaque handles. */
export function queryElements(args: QueryArgs): ElementHandle[] {
  const root = args.selector
    ? document.querySelectorAll(args.selector)
    : document.querySelectorAll(INTERACTIVE)
  const limit = args.limit ?? 20
  const out: ElementHandle[] = []
  for (const el of root) {
    if (out.length >= limit) break
    if (!matches(el, args)) continue
    out.push({
      id: tagElement(el),
      role: roleOf(el),
      name: nameOf(el),
      tag: el.tagName.toLowerCase(),
    })
  }
  return out
}
