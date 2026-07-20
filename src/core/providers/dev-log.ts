import { type LanguageModel, type LanguageModelMiddleware, wrapLanguageModel } from 'ai'
import { createLogger } from '@/shared/util/logger'

const log = createLogger('model')

/** AI SDK language-model middleware: latency + usage per model call. Prompt
 * and response bodies are deliberately NOT logged (they contain page content
 * and user text — docs/05); this is diagnostics, never authorization. */
const devLogging: LanguageModelMiddleware = {
  specificationVersion: 'v3',
  wrapGenerate: async ({ doGenerate, model }) => {
    const t0 = Date.now()
    const result = await doGenerate()
    log.debug(`${model.modelId} generate ${Date.now() - t0}ms`, result.usage)
    return result
  },
  wrapStream: async ({ doStream, model }) => {
    const t0 = Date.now()
    const result = await doStream()
    log.debug(`${model.modelId} stream first-byte ${Date.now() - t0}ms`)
    return result
  },
}

/** Wraps a model with dev-only call logging (AI SDK migration plan §7/§1.3).
 * No-op in production builds and for gateway-id string models. */
export function withDevLogging(model: LanguageModel): LanguageModel {
  if (typeof model === 'string') return model
  if (!import.meta.env?.DEV) return model
  // Legacy v2-spec models (e.g. some on-device providers) are passed through.
  if (model.specificationVersion !== 'v3') return model
  return wrapLanguageModel({ model, middleware: devLogging })
}
