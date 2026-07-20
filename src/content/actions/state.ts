import type { ElementState } from '@/shared/content-actions'
import { findByHandle, nameOf, roleOf } from './handles'

/**
 * Read-only snapshot of an element's observable state. Used by the outcome
 * verifier (before/after comparison). Never reads password fields — sensitive
 * values must not reach the ledger or the model (docs/05).
 */
export function elementState(handle: string): ElementState {
  const el = findByHandle(handle)
  if (!el) return { exists: false }
  const input = el as HTMLInputElement
  const state: ElementState = { exists: true }
  if (typeof input.value === 'string' && input.type !== 'password') {
    state.value = input.value.slice(0, 500)
  }
  if (typeof input.checked === 'boolean') state.checked = input.checked
  if (typeof input.disabled === 'boolean') state.disabled = input.disabled
  const text = el.textContent?.replace(/\s+/g, ' ').trim()
  if (text) state.text = text.slice(0, 200)
  const name = nameOf(el)
  if (name && input.type !== 'password') state.name = name
  state.role = roleOf(el)
  return state
}
