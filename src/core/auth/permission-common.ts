import { browser } from '@/platform'

type PermissionDesc = Parameters<typeof browser.permissions.contains>[0]

/** `permissions.contains` that can't throw (an absent API reads as ungranted). */
export async function containsSafe(desc: PermissionDesc): Promise<boolean> {
  try {
    return await browser.permissions.contains(desc)
  } catch {
    return false
  }
}

/** The one grant/revoke flow: request on grant (needs a UI gesture), remove on
 * revoke, and on any failure fall back to re-checking so callers always get
 * the real resulting state. Shared by API and host permissions so the catch
 * semantics can't drift. */
export async function setGrant(desc: PermissionDesc, grant: boolean): Promise<boolean> {
  try {
    if (grant) return await browser.permissions.request(desc)
    await browser.permissions.remove(desc)
    return false
  } catch {
    return containsSafe(desc)
  }
}
