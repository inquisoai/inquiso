import type { ToolDef } from '../context'
import { click } from './click'
import { downloadFile } from './download-file'
import { exportData } from './export-data'
import { highlight } from './highlight'
import { navigate } from './navigate'
import { runSkill } from './run-skill'
import { scrollTo } from './scroll-to'
import { selectOption } from './select-option'
import { submitForm } from './submit-form'
import { typeText } from './type'
import { waitFor } from './wait-for'

/** Interaction tools — change page/tab state or write files. medium/high risk
 * is confirmation-gated by the registry. Add page-acting tools here. */
export const actTools: ToolDef[] = [
  scrollTo,
  highlight,
  waitFor,
  click,
  typeText,
  selectOption,
  submitForm,
  navigate,
  runSkill,
  exportData,
  downloadFile,
]
