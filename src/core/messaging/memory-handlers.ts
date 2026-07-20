import { getSettings, setSettings } from '@/core/data/settings/store'
import { listRuns } from '@/core/memory/ledger/store'
import { listBlocked } from '@/core/memory/pipeline/blocked'
import { retireSkill, trustSkill } from '@/core/memory/skills/reliability'
import { allSkills } from '@/core/memory/skills/store'
import {
  changeScope,
  confirmMemory,
  editSummary,
  forgetMemory,
  markIncorrect,
} from '@/core/memory/store/mutate'
import { allMemories, clearMemories } from '@/core/memory/store/records'
import type { Capability } from '@/core/policy/capabilities'
import { listGrants, PolicyGrant, removeGrant, setGrant } from '@/core/policy/store'

/** Memory Center handlers, spread into the main router (handlers.ts). */
export const memoryHandlers = {
  memoryList: () => allMemories(),
  memoryForget: (m: { id: string }) => forgetMemory(m.id).then(() => true),
  memoryConfirm: (m: { id: string }) => confirmMemory(m.id),
  memoryIncorrect: (m: { id: string }) => markIncorrect(m.id),
  memoryEdit: (m: { id: string; summary: string }) => editSummary(m.id, m.summary),
  memoryScope: (m: { id: string; level: Parameters<typeof changeScope>[1] }) =>
    changeScope(m.id, m.level),
  memoryClear: (m: { origin?: string | undefined }) => clearMemories(m.origin),
  memoryBlocked: () => listBlocked(),
  memoryRuns: () => listRuns(),
  memoryExport: async () => ({
    v: 1,
    exportedAt: Date.now(),
    memories: await allMemories(),
  }),
  memorySkills: () => allSkills(),
  memoryTrustSkill: (m: { id: string }) => trustSkill(m.id),
  memoryRetireSkill: (m: { id: string }) => retireSkill(m.id).then(() => true),
  memoryState: async () => (await getSettings()).memory,
  memorySetLearning: async (m: { enabled: boolean }) => {
    const current = (await getSettings()).memory
    await setSettings({ memory: { ...current, autoLearn: m.enabled } })
    return true
  },
  policyList: () => listGrants(),
  policySet: (m: { origin: string; capability: Capability; decision: 'allow' | 'deny' }) =>
    setGrant(
      PolicyGrant.parse({
        origin: m.origin,
        capability: m.capability,
        decision: m.decision,
        createdAt: Date.now(),
      }),
    ).then(() => true),
  policyRemove: (m: { origin: string; capability: Capability }) =>
    removeGrant(m.origin, m.capability).then(() => true),
}
