import type { ToolDef } from '../context'
import { completeTask } from './complete-task'
import { getMetadata } from './get-metadata'
import { getSelection } from './get-selection'
import { getTabs } from './get-tabs'
import { listLinks } from './list-links'
import { listBrowserSkills } from './list-skills'
import { loadBrowserSkill } from './load-skill'
import { recall, remember } from './memory'
import { markMemoryMisleading, markMemoryUseful } from './memory-feedback'
import { queryElements } from './query-elements'
import { readPage } from './read-page'
import { readTab } from './read-tab'
import { readTables } from './read-tables'
import { screenshot } from './screenshot'

/** Observation + memory tools — read-only, never gated. Add read-only tools
 * here (memory writes only to local on-device storage, so no risk gate). */
export const readTools: ToolDef[] = [
  readPage,
  queryElements,
  getSelection,
  listLinks,
  readTables,
  getMetadata,
  getTabs,
  readTab,
  screenshot,
  remember,
  recall,
  loadBrowserSkill,
  listBrowserSkills,
  markMemoryUseful,
  markMemoryMisleading,
  completeTask,
]
