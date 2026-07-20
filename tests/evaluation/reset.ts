import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { dropRun, listRuns } from '@/core/memory/ledger/store'
import { clearSkills } from '@/core/memory/skills/store'
import { clearMemories } from '@/core/memory/store/records'

/** Wipes every memory store between evaluation configurations. */
export async function resetStores(): Promise<void> {
  await clearMemories()
  await clearSkills()
  for (const run of await listRuns()) await dropRun(run.runId)
}

/** Persists a suite's measured metrics for scripts/eval-report.mjs. */
export function writeMetrics(name: string, data: unknown): void {
  const dir = join(process.cwd(), '.eval-out')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${name}.json`), JSON.stringify(data, null, 2))
}

/** The reported subset of a session's measured metrics. */
export const sessionMetrics = (s: {
  meta: {
    metrics: { actions: number; failures: number; recoveries: number }
    outcome?: string | undefined
  }
  modelCalls: number
}) => ({
  actions: s.meta.metrics.actions,
  failures: s.meta.metrics.failures,
  recoveries: s.meta.metrics.recoveries,
  modelCalls: s.modelCalls,
  outcome: s.meta.outcome,
})
