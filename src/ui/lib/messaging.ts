import type { RequestMsg, ResponseMsg } from '@/core/messaging/contract'
import { browser } from '@/platform'
import { PROTOCOL_VERSION } from '@/shared/constants'

/** Distributive omit so each union member keeps its own fields (e.g. `scope`). */
type ClientRequest = RequestMsg extends infer T
  ? T extends RequestMsg
    ? Omit<T, 'v'>
    : never
  : never

/**
 * UI → background request helper. The UI only ever talks to core through this
 * typed channel (docs/07-project-structure.md boundary rule).
 */
export async function sendToBackground<T = unknown>(msg: ClientRequest): Promise<T> {
  const res: ResponseMsg = await browser.runtime.sendMessage({ ...msg, v: PROTOCOL_VERSION })
  if (!res.ok) throw new Error(res.error ?? 'request_failed')
  return res.data as T
}
