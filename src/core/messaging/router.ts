import { createLogger } from '@/shared/util/logger'
import { type RequestMsg, RequestMsg as RequestSchema, type ResponseMsg } from './contract'

const log = createLogger('messaging')

/** Per-type handlers, each receiving its own narrowed message. Partial so a
 * surface can register only the handlers it needs. */
type Handlers = Partial<{
  [K in RequestMsg['type']]: (msg: Extract<RequestMsg, { type: K }>) => Promise<unknown>
}>

/**
 * Validates an incoming request against the contract and dispatches it to the
 * matching handler. Unknown or malformed messages are rejected, not trusted.
 */
export function createRouter(handlers: Handlers) {
  return async (raw: unknown): Promise<ResponseMsg> => {
    const parsed = RequestSchema.safeParse(raw)
    if (!parsed.success) {
      log.warn('rejected malformed message', parsed.error.issues)
      return { ok: false, error: 'invalid_message' }
    }
    const msg = parsed.data
    const handler = handlers[msg.type] as ((m: RequestMsg) => Promise<unknown>) | undefined
    if (!handler) return { ok: false, error: 'unhandled_message' }
    try {
      return { ok: true, data: await handler(msg) }
    } catch (err) {
      log.error('handler failed', msg.type, err)
      // Surface the handler's own message (e.g. 'gist_401', 'missing_api_key')
      // so the UI can explain the failure instead of a generic code.
      return { ok: false, error: err instanceof Error ? err.message : 'handler_error' }
    }
  }
}
