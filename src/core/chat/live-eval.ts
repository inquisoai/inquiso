import { setKey } from '@/core/auth/secret-store'
import { setSettings } from '@/core/data/settings/store'
import { eventsForRun, listRuns } from '@/core/memory/ledger/store'
import { allSkills } from '@/core/memory/skills/store'
import { listMemories } from '@/core/memory/store/query'
import { newId } from '@/shared/memory/ids'
import type { PortOutbound } from './protocol'
import { runSend } from './run-chat'

/**
 * DEV-only live-evaluation hooks (never registered in production builds —
 * see background.ts). Drives the exact production turn path (runSend →
 * ToolLoopAgent → gated tools → verifier → ledger → learn) headlessly from
 * a Playwright-controlled service worker. The confirm gate is auto-approved
 * and every approval is recorded in the result, so the evidence shows which
 * sensitive actions a human would have confirmed.
 */
export async function liveEvalRun(goal: string, taskId?: string) {
  const t = taskId ?? newId('task')
  const outbound: PortOutbound[] = []
  const approved: string[] = []
  let error: string | undefined
  const started = Date.now()
  try {
    await runSend(
      t,
      goal,
      'page',
      [],
      [],
      new AbortController().signal,
      (msg) => outbound.push(msg),
      async (tool) => {
        approved.push(tool)
        return true
      },
      'scope',
    )
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
  }
  const run = (await listRuns()).find((r) => r.taskId === t)
  return {
    taskId: t,
    durationMs: Date.now() - started,
    run: run ?? null,
    events: run ? await eventsForRun(run.runId) : [],
    outbound,
    autoApproved: approved,
    memories: (await listMemories({ currentOnly: true })).map((m) => ({
      id: m.id,
      kind: m.kind,
      summary: m.summary,
      origin: m.scope.origin ?? null,
    })),
    skills: (await allSkills()).map((s) => ({ id: s.id, state: s.state, name: s.name })),
    ...(error ? { error } : {}),
  }
}

/** Stores a provider key and selects the provider/model for the eval run. */
export async function liveEvalConfigure(
  providerId: string,
  apiKey: string,
  modelId?: string,
): Promise<void> {
  await setKey(providerId, apiKey)
  await setSettings({
    providerId,
    ...(modelId ? { models: { [providerId]: modelId } } : {}),
  })
}

/** Exposes the hooks on the service-worker global for Playwright evaluate. */
export function registerLiveEval(): void {
  Object.assign(globalThis, {
    __inquisoLiveEval: liveEvalRun,
    __inquisoLiveEvalConfigure: liveEvalConfigure,
  })
}
