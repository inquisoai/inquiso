/** Shared fetch guards for sync providers — one place pins the error-token
 * formats the UI's error mapping relies on: `not_configured` and
 * `<providerId>_<httpStatus>`. */

/** Returns the required config value or throws the standard token. */
export function requireCfg<T>(value: T | undefined): T {
  if (!value) throw new Error('not_configured')
  return value
}

/** Throws the standard `<id>_<status>` token for a failed response. */
export function assertOk(res: Response, id: string): void {
  if (!res.ok) throw new Error(`${id}_${res.status}`)
}
