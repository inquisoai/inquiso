import { appStore } from '@/core/data/storage/instance'
import { BrowserSkill } from '@/shared/memory/skill'

/**
 * Skill repository (IndexedDB via localForage). Every version is its own
 * record — repair never overwrites history, it chains `previousVersionId`.
 * Local only; deletes are real.
 */
const store = appStore('skills')
const MAX_SKILLS = 200

export async function getSkill(id: string): Promise<BrowserSkill | null> {
  const parsed = BrowserSkill.safeParse(await store.getItem(id))
  return parsed.success ? parsed.data : null
}

export async function saveSkill(skill: BrowserSkill): Promise<void> {
  await store.setItem(skill.id, skill)
  await trim()
}

export async function deleteSkill(id: string): Promise<void> {
  await store.removeItem(id)
}

/** Every validated skill (all states/versions), newest first. */
export async function allSkills(): Promise<BrowserSkill[]> {
  const all: BrowserSkill[] = []
  await store.iterate((value) => {
    const parsed = BrowserSkill.safeParse(value)
    if (parsed.success) all.push(parsed.data)
  })
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function clearSkills(origin?: string): Promise<number> {
  const doomed = (await allSkills()).filter((s) => !origin || s.origins.includes(origin))
  await Promise.all(doomed.map((s) => store.removeItem(s.id)))
  return doomed.length
}

/** Superseded (non-latest) versions and retired skills are trimmed first. */
async function trim(): Promise<void> {
  const all = await allSkills()
  if (all.length <= MAX_SKILLS) return
  const latest = new Set(all.map((s) => s.id))
  for (const s of all) if (s.previousVersionId) latest.delete(s.previousVersionId)
  const score = (s: BrowserSkill): number =>
    (latest.has(s.id) ? 2 : 0) + (s.state === 'retired' ? 0 : 1)
  const doomed = all
    .sort((a, b) => score(a) - score(b) || a.updatedAt - b.updatedAt)
    .slice(0, all.length - MAX_SKILLS)
  await Promise.all(doomed.map((s) => store.removeItem(s.id)))
}
