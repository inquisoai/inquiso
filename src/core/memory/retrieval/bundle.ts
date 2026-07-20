import type { MemoryKind } from '@/shared/memory/enums'
import type { MemoryRecord } from '@/shared/memory/record'
import { type BrowserSkill, SUGGESTIBLE_STATES } from '@/shared/memory/skill'
import { matchSkills } from '../skills/match'
import { applyFilter } from '../store/query'
import { allMemories } from '../store/records'
import { semanticScores } from './embed'
import { rankMemories } from './score'

/** Typed, per-kind budgeted retrieval result — never one flat blob. Skills
 * come from the skill store (versioned, reliability-scored), not records. */
export interface MemoryBundle {
  preferences: MemoryRecord[]
  siteFacts: MemoryRecord[]
  episodes: MemoryRecord[]
  warnings: MemoryRecord[]
  skills: BrowserSkill[]
}

/** Retrieval budget per kind — keeps the injected context compact. */
const BUDGET = { preferences: 3, siteFacts: 5, episodes: 3, warnings: 3, skills: 3 }

export const bundleAll = (b: MemoryBundle): MemoryRecord[] => [
  ...b.preferences,
  ...b.siteFacts,
  ...b.episodes,
  ...b.warnings,
]

/**
 * Retrieve separately by type: hard scope/temporal filters first (an
 * out-of-scope memory can never rank its way in), then hybrid scoring per
 * kind, then a fixed per-kind budget.
 */
export async function retrieveBundle(query: string, origin?: string): Promise<MemoryBundle> {
  const now = Date.now()
  const pool = applyFilter(
    await allMemories(),
    { currentOnly: true, ...(origin !== undefined ? { origin } : {}) },
    now,
  )
  const semantics = await semanticScores(query, pool)
  const pick = (kinds: MemoryKind[], n: number, requireRelevance = true): MemoryRecord[] =>
    rankMemories(
      pool.filter((m) => kinds.includes(m.kind)),
      query,
      now,
      semantics,
      requireRelevance,
    ).slice(0, n)

  return {
    preferences: pick(['preference'], BUDGET.preferences, false),
    siteFacts: pick(['fact', 'site_knowledge'], BUDGET.siteFacts),
    episodes: pick(['episode'], BUDGET.episodes),
    warnings: pick(['reflection'], BUDGET.warnings),
    skills: (await matchSkills(query, origin, SUGGESTIBLE_STATES)).slice(0, BUDGET.skills),
  }
}
