import type { ActionEvidence } from '@/shared/memory/evidence'
import type { ActionSnapshot } from './snapshot'

const cap = (s: string): string => s.slice(0, 200)

function pageEvidence(before: ActionSnapshot, after: ActionSnapshot): ActionEvidence | null {
  if (!before.page || !after.page) return null
  if (before.page.url !== after.page.url) {
    return { type: 'url_changed', from: before.page.url, to: after.page.url }
  }
  if (before.page.title !== after.page.title) {
    return { type: 'title_changed', from: before.page.title, to: after.page.title }
  }
  return null
}

function elementEvidence(before: ActionSnapshot, after: ActionSnapshot): ActionEvidence | null {
  const b = before.element
  const a = after.element
  if (b?.exists && a && !a.exists) {
    return { type: 'element_state_changed', before: 'present', after: 'absent' }
  }
  if (b && a && (b.value !== a.value || b.checked !== a.checked || b.disabled !== a.disabled)) {
    return {
      type: 'element_state_changed',
      ...(b.value !== undefined ? { before: cap(b.value) } : {}),
      ...(a.value !== undefined ? { after: cap(a.value) } : {}),
    }
  }
  return null
}

/** Observable state deltas between two snapshots, as typed evidence. */
export function changeEvidence(before: ActionSnapshot, after: ActionSnapshot): ActionEvidence[] {
  return [pageEvidence(before, after), elementEvidence(before, after)].filter(
    (e): e is ActionEvidence => e !== null,
  )
}
