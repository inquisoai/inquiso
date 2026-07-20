const ATTR = 'data-inquiso-id'
let counter = 0

/** Tags an element with a stable opaque id (creating one if needed). */
export function tagElement(el: Element): string {
  const existing = el.getAttribute(ATTR)
  if (existing) return existing
  counter += 1
  const id = `iq-${counter}`
  el.setAttribute(ATTR, id)
  return id
}

/** Resolves a previously-issued handle back to its live element. */
export function findByHandle(id: string): Element | null {
  return document.querySelector(`[${ATTR}="${id}"]`)
}

/** A human/model-readable name for an element (for the action trace). */
export function nameOf(el: Element): string {
  const label =
    el.getAttribute('aria-label') ||
    el.getAttribute('placeholder') ||
    el.textContent?.trim() ||
    (el as HTMLInputElement).value ||
    ''
  return label.replace(/\s+/g, ' ').slice(0, 80)
}

/** The element's ARIA role, falling back to its tag name. */
export function roleOf(el: Element): string {
  return el.getAttribute('role') || el.tagName.toLowerCase()
}
