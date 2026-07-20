/**
 * Deterministic quality guard for model-extracted memory candidates. The fast
 * model sometimes emits process narration ("the task completed successfully")
 * instead of site knowledge — statements about the *run*, not the *site*,
 * which are worthless in every future run. The model proposes; this disposes.
 */

/** Narration about the run/task itself rather than the site. */
const PROCESS_NOISE =
  /\b(task|request|run|goal|user('s)? (request|question|ask))\b.*\b(complet|success|creat|finish|perform|execut|answer)/i

/** Words that anchor a fact to something concrete on the site. */
const CONCRETE =
  /\b(menu|page|button|link|tab|nav|under|table|form|field|login|section|scroll|dropdown|banner|modal|footer|header|search|list|pagination|download|upload|url|path|account|settings?)\b/i

/**
 * True when a model-proposed site fact carries no reusable site knowledge:
 * it narrates the run, or names nothing concrete about the site at all.
 */
export function isVacuousFact(summary: string): boolean {
  if (PROCESS_NOISE.test(summary)) return true
  return !CONCRETE.test(summary)
}
