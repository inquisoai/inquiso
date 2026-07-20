import { getSettings } from '@/core/data/settings/store'
import { createLogger } from '@/shared/util/logger'
import { eventsForRun, getRun } from './ledger/store'
import { admitCandidate } from './pipeline/admit'
import { buildEpisode } from './pipeline/episode'
import { extractWithModel } from './pipeline/extract'
import { buildReflections } from './pipeline/reflect'
import { updateSkills } from './skills/lifecycle'

const log = createLogger('memory-learn')

/**
 * Post-run learning: episode + failure reflections (deterministic, from the
 * persisted ledger) and model-assisted facts/preferences (optional). Reads
 * only persisted state, so it is idempotent and safe to re-run after a
 * service-worker restart — duplicates reinforce rather than multiply.
 */
export async function learnFromRun(runId: string): Promise<void> {
  const { memory } = await getSettings()
  if (!memory.autoLearn) return
  const meta = await getRun(runId)
  if (!meta) return
  if (meta.origins.some((o) => memory.disabledOrigins.includes(o))) return

  const events = await eventsForRun(runId)
  const episode = buildEpisode(meta, events)
  let episodeRepeated = false
  if (episode) {
    // 'reinforced' = a similar episode already existed: this goal now has
    // repeated verified successes — the trigger for workflow learning.
    episodeRepeated = (await admit(episode)) === 'reinforced'
  }
  for (const c of [...buildReflections(meta, events), ...(await extractWithModel(meta, events))]) {
    await admit(c)
  }
  await updateSkills({ meta, events, episodeRepeated })
}

async function admit(c: Parameters<typeof admitCandidate>[0]): Promise<string | null> {
  try {
    return (await admitCandidate(c)).decision
  } catch (e) {
    log.warn('candidate admission failed', e)
    return null
  }
}
