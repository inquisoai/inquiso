import type { PortOutbound } from '@/core/chat/protocol'
import type { RunLedger } from '@/core/memory/ledger/run-ledger'
import type { PageContext } from '@/shared/page'
import { touchRetrieved } from '../store/mutate'
import { bundleAll, retrieveBundle } from './bundle'
import { renderBundle } from './inject'

const originOf = (url: string | undefined): string | undefined => {
  if (!url) return undefined
  try {
    return new URL(url).origin
  } catch {
    return undefined
  }
}

/**
 * Run-start retrieval: scope to the primary page's origin, log what was
 * retrieved (ledger + live "Using: …" event), update retrieval metrics, and
 * return the compact labeled prompt block — or undefined when nothing
 * relevant is stored (a fresh profile adds zero context overhead).
 */
export async function prepareMemory(
  query: string,
  pages: PageContext[],
  ledger: RunLedger,
  emit: (msg: PortOutbound) => void,
): Promise<string | undefined> {
  const bundle = await retrieveBundle(query, originOf(pages[0]?.url))
  const used = bundleAll(bundle)
  if (used.length === 0 && bundle.skills.length === 0) return undefined
  ledger.log('MemoryRetrieved', {
    ids: [...used.map((m) => m.id), ...bundle.skills.map((s) => s.id)],
    kinds: [...used.map((m) => m.kind), ...bundle.skills.map(() => 'skill')],
  })
  void touchRetrieved(used.map((m) => m.id))
  emit({
    type: 'memory',
    items: [
      ...used.map((m) => ({ id: m.id, kind: m.kind, summary: m.summary })),
      ...bundle.skills.map((s) => ({
        id: s.id,
        kind: 'skill',
        summary: `${s.name} (${s.state} workflow)`,
      })),
    ],
  })
  return renderBundle(bundle)
}
