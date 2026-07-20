import { z } from 'zod'
import { tabOrigin } from '@/core/context/tab'
import { admitCandidate } from '@/core/memory/pipeline/admit'
import { lexicalScore, listMemories } from '@/core/memory/store/query'
import { defineTool } from '../context'

/** Explicit memory writes route through the deterministic pipeline: secrets
 * are refused, duplicates reinforce, conflicting slots supersede. Local-only.
 * Always confirms: the `explicit_user` provenance (which fast-paths the write
 * gate) is only honest because the user approves the exact summary here —
 * otherwise injected page text could plant "user-confirmed" memories. */
export const remember = defineTool({
  name: 'remember',
  description:
    'Save a memory the user asked to keep (preference, fact, or site knowledge). ' +
    'Stored locally on this device; secrets and credentials are refused.',
  risk: 'none',
  confirmWhen: () => true,
  inputSchema: z.object({
    summary: z.string().min(1).max(500),
    kind: z.enum(['preference', 'fact', 'site_knowledge']).default('fact'),
    /** Scope to the current website instead of the whole user profile. */
    siteSpecific: z.boolean().default(false),
    /** Conflict key when this replaces an older fact (e.g. billing-location). */
    slotKey: z.string().max(120).optional(),
  }),
  execute: async ({ summary, kind, siteSpecific, slotKey }, ctx) => {
    const origin = siteSpecific ? await tabOrigin(ctx.tabId) : undefined
    const result = await admitCandidate(
      {
        proposedKind: kind,
        summary,
        structuredContent: {},
        ...(slotKey ? { slotKey } : {}),
        scope: origin ? { level: 'site', origin } : { level: 'user' },
        provenance: { source: 'explicit_user', eventIds: [], runIds: [] },
        confidence: 0.95,
        sensitivity: 'personal',
        websiteSupplied: false,
        expectedValue: 'personalization',
        recommendedDecision: 'store',
      },
      ctx.ledger,
    )
    return { ok: result.decision !== 'discarded', decision: result.decision, reason: result.reason }
  },
})

export const recall = defineTool({
  name: 'recall',
  description:
    'Search stored memories (preferences, facts, site knowledge) relevant to a query. ' +
    'Returns current, non-superseded memories scoped to this user and site.',
  risk: 'none',
  inputSchema: z.object({ query: z.string().max(200).optional() }),
  execute: async ({ query }, ctx) => {
    const origin = await tabOrigin(ctx.tabId)
    const all = await listMemories({ currentOnly: true, ...(origin ? { origin } : {}) })
    const ranked = query
      ? all
          .map((m) => ({ m, s: lexicalScore(m, query) }))
          .filter(({ s }) => s > 0)
          .sort((a, b) => b.s - a.s)
          .map(({ m }) => m)
      : all
    return {
      memories: ranked.slice(0, 10).map((m) => ({
        id: m.id,
        kind: m.kind,
        summary: m.summary,
        userConfirmed: m.trust.userConfirmed,
        ...(m.scope.origin ? { origin: m.scope.origin } : {}),
      })),
    }
  },
})
