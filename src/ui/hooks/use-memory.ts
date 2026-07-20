import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BlockedAttempt } from '@/shared/memory/candidate'
import type { RunMeta } from '@/shared/memory/events'
import type { MemoryRecord } from '@/shared/memory/record'
import type { BrowserSkill } from '@/shared/memory/skill'
import { sendToBackground } from '@/ui/lib/messaging'

type Msg = Parameters<typeof sendToBackground>[0]

/** Data + actions for the Memory Center (list, curate, clear, export). The
 * five lists load as parallel cached queries under the ['memory'] prefix;
 * every curation invalidates the whole prefix. */
export function useMemoryCenter() {
  const client = useQueryClient()
  const memories = useQuery({
    queryKey: ['memory', 'list'],
    queryFn: () => sendToBackground<MemoryRecord[]>({ type: 'memoryList' }),
  })
  const blocked = useQuery({
    queryKey: ['memory', 'blocked'],
    queryFn: () => sendToBackground<BlockedAttempt[]>({ type: 'memoryBlocked' }),
  })
  const runs = useQuery({
    queryKey: ['memory', 'runs'],
    queryFn: () => sendToBackground<RunMeta[]>({ type: 'memoryRuns' }),
  })
  const skills = useQuery({
    queryKey: ['memory', 'skills'],
    queryFn: () => sendToBackground<BrowserSkill[]>({ type: 'memorySkills' }),
  })
  const state = useQuery({
    queryKey: ['memory', 'state'],
    queryFn: () => sendToBackground<{ autoLearn: boolean }>({ type: 'memoryState' }),
  })
  const { mutateAsync } = useMutation({
    mutationFn: (msg: Msg) => sendToBackground(msg),
    onSettled: () => client.invalidateQueries({ queryKey: ['memory'] }),
  })
  const curate = async (msg: Msg): Promise<void> => {
    await mutateAsync(msg)
  }

  /** Optimistic: the toggle reflects immediately, the background persists. */
  const setLearning = async (enabled: boolean): Promise<void> => {
    client.setQueryData(['memory', 'state'], { autoLearn: enabled })
    await sendToBackground({ type: 'memorySetLearning', enabled })
  }

  const exportAll = async (): Promise<void> => {
    const data = await sendToBackground<{ exportedAt: number }>({ type: 'memoryExport' })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inquiso-memory-${new Date(data.exportedAt).toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    memories: memories.data ?? [],
    blocked: blocked.data ?? [],
    runs: runs.data ?? [],
    skills: skills.data ?? [],
    autoLearn: state.data?.autoLearn ?? true,
    setLearning,
    refresh: async (): Promise<void> => {
      await client.invalidateQueries({ queryKey: ['memory'] })
    },
    forget: (id: string) => curate({ type: 'memoryForget', id }),
    confirm: (id: string) => curate({ type: 'memoryConfirm', id }),
    markIncorrect: (id: string) => curate({ type: 'memoryIncorrect', id }),
    edit: (id: string, summary: string) => curate({ type: 'memoryEdit', id, summary }),
    trustSkill: (id: string) => curate({ type: 'memoryTrustSkill', id }),
    retireSkill: (id: string) => curate({ type: 'memoryRetireSkill', id }),
    clear: (origin?: string) => curate({ type: 'memoryClear', ...(origin ? { origin } : {}) }),
    exportAll,
  }
}
