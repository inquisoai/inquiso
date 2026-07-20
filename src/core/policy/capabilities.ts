/**
 * Capability taxonomy for the deterministic policy engine (docs/memory-agent).
 * Every tool maps to exactly one capability; unknown tools fall into
 * `unknown`, which always asks — fail-safe, like unknown risk.
 */
export const CAPABILITIES = [
  'read_page',
  'interact',
  'navigate',
  'fill_form',
  'submit_form',
  'download',
  'upload',
  'send_message',
  'delete',
  'purchase',
  'change_settings',
  'browser_control',
  'unknown',
] as const
export type Capability = (typeof CAPABILITIES)[number]

const TOOL_CAPABILITY: Record<string, Capability> = {
  readPage: 'read_page',
  queryElements: 'read_page',
  getSelection: 'read_page',
  listLinks: 'read_page',
  readTables: 'read_page',
  getMetadata: 'read_page',
  getTabs: 'read_page',
  readTab: 'read_page',
  screenshot: 'read_page',
  remember: 'read_page',
  recall: 'read_page',
  scrollTo: 'interact',
  highlight: 'interact',
  waitFor: 'interact',
  click: 'interact',
  type: 'fill_form',
  selectOption: 'fill_form',
  submitForm: 'submit_form',
  navigate: 'navigate',
  openTab: 'navigate',
  runSkill: 'interact',
  exportData: 'download',
  downloadFile: 'download',
  activateTab: 'browser_control',
  arrangeTabs: 'browser_control',
  closeTab: 'browser_control',
  closeWindow: 'browser_control',
  newWindow: 'browser_control',
  listWindows: 'read_page',
  bookmarks: 'browser_control',
  history: 'browser_control',
  sessions: 'browser_control',
  tabGroups: 'browser_control',
}

export const capabilityOf = (tool: string): Capability => TOOL_CAPABILITY[tool] ?? 'unknown'

/** Capabilities that always require a fresh confirmation: no standing grant —
 * from settings, memory, or a trusted skill — may silence them (docs/05,
 * docs/memory-agent §16). Deterministic and enforced in the background. */
export const ALWAYS_ASK: ReadonlySet<Capability> = new Set([
  'submit_form',
  'upload',
  'send_message',
  'delete',
  'purchase',
  'change_settings',
  'unknown',
])
