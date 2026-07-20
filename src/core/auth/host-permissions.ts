import { browser } from '@/platform'
import { originPattern } from '@/shared/custom-provider'
import { containsSafe, setGrant } from './permission-common'

/**
 * Runtime host-permission grants for custom provider endpoints. The CSP allows
 * https at the network layer, but each custom host still needs an explicit
 * user-granted origin permission — least privilege by consent (docs/05).
 * Requesting a grant needs a UI gesture; checking one works anywhere.
 */
export async function hasHostPermission(baseURL: string): Promise<boolean> {
  try {
    return await containsSafe({ origins: [originPattern(baseURL)] })
  } catch {
    return false // unparseable URL
  }
}

/** Background-side gate before fetching a user-configured endpoint: the UI
 * requests grants, but the background verifies them — consent is enforced
 * where the fetch happens, not where the form is (docs/05 T5). */
export async function requireHostPermission(baseURL: string): Promise<void> {
  if (!(await hasHostPermission(baseURL))) throw new Error('host_permission_needed')
}

/** Revokes an origin grant unless another configured endpoint still uses the
 * same origin. Best-effort: a failed revoke leaves an unused grant behind,
 * never a broken flow. */
export async function revokeHostPermission(baseURL: string, stillUsed: string[]): Promise<void> {
  try {
    const origin = originPattern(baseURL)
    if (stillUsed.some((u) => originPattern(u) === origin)) return
    await browser.permissions.remove({ origins: [origin] })
  } catch {
    // Unparseable URL or API failure — nothing to revoke.
  }
}

/** Prompts the user to grant access to the endpoint's origin. Returns whether
 * it was granted. */
export async function requestHostPermission(baseURL: string): Promise<boolean> {
  try {
    return await browser.permissions.request({ origins: [originPattern(baseURL)] })
  } catch {
    return false
  }
}

/** Broad "all sites" access so multi-site agent runs don't prompt per-origin.
 * Off by default, never requested at install, revocable — the opt-in escape
 * hatch to least-privilege (docs/adr/0003). Never uses `<all_urls>`. */
const ALL_SITES = ['https://*/*', 'http://*/*']

export const hasAllSites = (): Promise<boolean> => containsSafe({ origins: ALL_SITES })

/** Must be called from a UI gesture. `grant=false` revokes. */
export const setAllSites = (grant: boolean): Promise<boolean> =>
  setGrant({ origins: ALL_SITES }, grant)
