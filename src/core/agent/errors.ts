import { APICallError, InvalidToolInputError, NoSuchToolError, RetryError } from 'ai'

/**
 * Turns an AI SDK / provider error into a short, honest, user-facing message.
 * Uses each error class's `isInstance` guard (safe across bundles) and falls
 * back to the raw message so nothing is silently swallowed.
 */
export function friendlyError(e: unknown): string {
  if (APICallError.isInstance(e)) {
    const s = e.statusCode
    if (s === 401 || s === 403) return 'The provider rejected your API key. Check it in Settings.'
    if (s === 429) return 'The provider rate-limited this request. Wait a moment and try again.'
    if (s && s >= 500) return 'The provider had a server error. Try again shortly.'
    return 'Could not reach the provider. Check your connection and the endpoint URL.'
  }
  if (RetryError.isInstance(e)) return 'The provider was unreachable after several retries.'
  if (NoSuchToolError.isInstance(e)) return 'The model tried to use a tool that does not exist.'
  if (InvalidToolInputError.isInstance(e)) return 'The model produced invalid tool arguments.'
  const m = e instanceof Error ? e.message : String(e)
  if (m === 'missing_api_key') return 'No API key set for this provider. Add one in Settings.'
  if (m === 'host_permission_needed')
    return "Inquiso doesn't have permission for this endpoint's origin. Re-add it in Settings to grant access."
  if (m === 'page_access_needed')
    return 'Inquiso can’t read this site yet. Use the “Grant access” button above the composer, then ask again.'
  // Firefox's WebGPU exposes fewer resources than Chrome (the spec minimum of 8
  // storage buffers per shader stage vs Chrome's 10), so WebLLM's models can't
  // initialize there. Not our bug and not fixable in-app — point at a cloud model.
  if (m.includes('maxStorageBuffersPerShaderStage') || m.includes('WebLLM'))
    return 'This browser’s WebGPU is too limited to run the in-browser model (Firefox allows fewer GPU resources than Chrome). Use a cloud provider, or run it in Chrome.'
  return m
}
