import { containsSafe, setGrant } from './permission-common'

/** Optional API permissions the agent asks for only when a tool needs them.
 * Kept out of install-time `permissions` — least privilege by consent
 * (docs/adr/0003), mirroring the host-permission flow in host-permissions.ts. */
export type ApiPermission = 'bookmarks' | 'history' | 'tabGroups' | 'sessions'

export const hasApiPermission = (perm: ApiPermission): Promise<boolean> =>
  containsSafe({ permissions: [perm] })

/** All optional API permissions, for the Settings grant list. */
export const API_PERMISSIONS: ApiPermission[] = ['bookmarks', 'history', 'tabGroups', 'sessions']

/** Grants (`grant=true`) or revokes a permission. MUST be called from a UI
 * gesture (Settings), not the background worker. Returns the resulting state. */
export const setApiPermission = (perm: ApiPermission, grant: boolean): Promise<boolean> =>
  setGrant({ permissions: [perm] }, grant)

/** Tool-side guard: returns a graceful "needs permission" result the model can
 * relay to the user (who grants it in Settings), or null if already granted. */
export async function guardPermission(
  perm: ApiPermission,
): Promise<{ ok: false; error: 'permission_needed'; permission: ApiPermission } | null> {
  return (await hasApiPermission(perm))
    ? null
    : { ok: false, error: 'permission_needed', permission: perm }
}
