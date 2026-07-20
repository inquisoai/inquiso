import { generateText, Output } from 'ai'
import { z } from 'zod'
import { resolveExtractionModel } from '@/core/providers/extraction'
import type { MemoryCandidate } from '@/shared/memory/candidate'
import type { LedgerEvent, RunMeta } from '@/shared/memory/events'
import { createLogger } from '@/shared/util/logger'
import { isVacuousFact } from './fact-filter'

const log = createLogger('memory-extract')

/** Structured output the fast model must satisfy — never trusted raw. */
const Extraction = z.object({
  siteFacts: z
    .array(z.object({ summary: z.string().max(300), slotKey: z.string().max(80).optional() }))
    .max(5),
  preferences: z.array(z.object({ summary: z.string().max(300) })).max(3),
})

const digest = (events: LedgerEvent[]): string =>
  events
    .slice(0, 80)
    .map((e) => `${e.seq} ${e.type} ${JSON.stringify(e.payload).slice(0, 120)}`)
    .join('\n')

/**
 * Model-assisted extraction with the cheap model (e.g. qwen-flash): site
 * facts and inferred user preferences the deterministic pass can't word.
 * Everything still passes the write gate — preferences will *ask the user*,
 * and any secret-shaped content is discarded there. Returns [] without a
 * usable extraction model (deterministic-only mode).
 */
export async function extractWithModel(
  meta: RunMeta,
  events: LedgerEvent[],
): Promise<MemoryCandidate[]> {
  const model = await resolveExtractionModel()
  if (!model) return []
  const origin = meta.origins[0]
  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema: Extraction }),
      prompt: [
        'From this browser-task event log, extract only durable knowledge worth reusing:',
        'siteFacts: navigation/affordance facts about the site that verified actions support.',
        'preferences: user preferences explicitly evident from the goal or confirmations.',
        'Give a slotKey (kebab-case topic, e.g. billing-location) for facts that could change.',
        'Facts must describe the SITE (where things are, how elements behave) — never the run.',
        'Statements like "the task completed successfully" are noise; omit them.',
        'No secrets, no personal identifiers, no speculation. Empty arrays are fine.',
        `Goal: ${meta.goal}`,
        `Outcome: ${meta.outcome ?? 'unknown'}`,
        `Events:\n${digest(events)}`,
      ].join('\n'),
    })
    const parsed = Extraction.parse(output)
    const shared = {
      provenance: { source: 'successful_episode' as const, eventIds: [], runIds: [meta.runId] },
      sensitivity: 'internal' as const,
      websiteSupplied: false,
      recommendedDecision: 'store' as const,
    }
    return [
      ...parsed.siteFacts
        .filter((f) => !isVacuousFact(f.summary))
        .map((f) => ({
          ...shared,
          proposedKind: 'site_knowledge' as const,
          summary: f.summary,
          structuredContent: {},
          ...(f.slotKey ? { slotKey: f.slotKey } : {}),
          scope: origin ? { level: 'site' as const, origin } : { level: 'user' as const },
          confidence: 0.6,
          expectedValue: 'site_navigation' as const,
        })),
      ...parsed.preferences.map((p) => ({
        ...shared,
        proposedKind: 'preference' as const,
        summary: p.summary,
        structuredContent: {},
        scope: { level: 'user' as const },
        confidence: 0.55,
        expectedValue: 'personalization' as const,
      })),
    ]
  } catch (e) {
    log.warn('model extraction skipped', e)
    return []
  }
}
