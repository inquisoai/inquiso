import type { MemoryCandidate } from '@/shared/memory/candidate'
import type { LedgerEvent, RunMeta } from '@/shared/memory/events'

const MAX_REFLECTIONS = 3

/** Transient environment states — permissions, rejected confirms, missing
 * keys — are never lessons about the site; memorizing them just pollutes
 * every later run (they change the moment the user grants/does something). */
const ENV_ERRORS =
  /page_access_needed|host_permission_needed|permission|user_rejected|missing_api_key|no_active_tab|tab_unreadable|cannot access/i

interface Failure {
  tool: string
  error: string
  recoveredBy?: string
}

/** Failure → later-verified-success pairs, straight from the event order. */
function failureArcs(events: LedgerEvent[]): Failure[] {
  const arcs: Failure[] = []
  events.forEach((e, i) => {
    if (e.type !== 'ActionFailed') return
    if (ENV_ERRORS.test(String(e.payload.error ?? ''))) return
    const recovery = events
      .slice(i + 1)
      .find((n) => n.type === 'OutcomeVerified' && n.payload.outcome === 'verified_success')
    arcs.push({
      tool: String(e.payload.tool ?? 'action'),
      error: String(e.payload.error ?? 'failed'),
      ...(recovery ? { recoveredBy: String(recovery.payload.tool) } : {}),
    })
  })
  return arcs
}

/**
 * Generalized lessons from this run's failures — deterministic, evidence-
 * linked, and slot-keyed so a repeat of the same failure supersedes the old
 * lesson instead of piling up duplicates.
 */
export function buildReflections(meta: RunMeta, events: LedgerEvent[]): MemoryCandidate[] {
  const origin = meta.origins[0]
  const site = origin ? `On ${origin}, ` : ''
  return failureArcs(events)
    .slice(0, MAX_REFLECTIONS)
    .map((f) => ({
      proposedKind: 'reflection' as const,
      summary: (f.recoveredBy
        ? `${site}${f.tool} failed with ${f.error}; a follow-up ${f.recoveredBy} recovered — expect the first attempt to need this fallback.`
        : `${site}${f.tool} failed with ${f.error} and was not recovered — verify preconditions before relying on it.`
      ).slice(0, 500),
      structuredContent: {
        tool: f.tool,
        error: f.error,
        ...(f.recoveredBy ? { recoveredBy: f.recoveredBy } : {}),
      },
      slotKey: `reflect:${f.tool}:${f.error}`.slice(0, 120),
      scope: origin ? { level: 'site' as const, origin } : { level: 'user' as const },
      provenance: {
        source: (meta.outcome === 'completed' ? 'successful_episode' : 'failed_episode') as
          | 'successful_episode'
          | 'failed_episode',
        eventIds: [],
        runIds: [meta.runId],
      },
      confidence: 0.6,
      sensitivity: 'internal' as const,
      websiteSupplied: false,
      expectedValue: 'failure_avoidance' as const,
      recommendedDecision: 'store' as const,
    }))
}
