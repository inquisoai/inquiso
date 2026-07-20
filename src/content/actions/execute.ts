import type { ActArgs, ActResult } from '@/shared/content-actions'
import { findByHandle } from './handles'

function typeInto(el: Element, text: string): void {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.focus()
    el.value = text
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  } else if (el instanceof HTMLElement && el.isContentEditable) {
    el.focus()
    el.textContent = text
  }
}

/** Selects an option by value, then by visible label. */
function selectOption(el: Element, value: string): boolean {
  if (!(el instanceof HTMLSelectElement)) return false
  const opt = [...el.options].find((o) => o.value === value || o.text.trim() === value)
  if (!opt) return false
  el.value = opt.value
  el.dispatchEvent(new Event('change', { bubbles: true }))
  return true
}

function highlight(el: Element): void {
  const h = el as HTMLElement
  h.style.outline = '3px solid oklch(0.62 0.19 265)'
  h.style.outlineOffset = '2px'
  el.scrollIntoView({ block: 'center' })
}

function submit(el: Element): void {
  const form = el.closest('form')
  if (form) form.requestSubmit()
  else (el as HTMLElement).click()
}

function scrollTo(el: Element): void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
}

/** One handler per action — keeps the dispatcher flat. Return an error code
 * or undefined for success. */
const HANDLERS: Record<ActArgs['action'], (el: Element, text: string) => string | undefined> = {
  click: (el) => void (el as HTMLElement).click(),
  type: (el, text) => void typeInto(el, text),
  selectOption: (el, text) => (selectOption(el, text) ? undefined : 'option_not_found'),
  submit: (el) => void submit(el),
  highlight: (el) => void highlight(el),
  scrollTo: (el) => void scrollTo(el),
}

/** Performs a single action on a handle. Risk gating happens in the background
 * BEFORE this runs (docs/05-security.md) — the content script just executes. */
export function executeAction({ action, handle, text }: ActArgs): ActResult {
  const el = findByHandle(handle)
  if (!el) return { ok: false, error: 'element_not_found' }
  const error = HANDLERS[action](el, text ?? '')
  return error ? { ok: false, error } : { ok: true }
}
