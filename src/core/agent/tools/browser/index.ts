import type { ToolDef } from '../context'
import { activateTab } from './activate-tab'
import { arrangeTabs } from './arrange-tabs'
import { addBookmark, listBookmarks, searchBookmarks } from './bookmarks'
import { closeTab } from './close-tab'
import { closeWindow } from './close-window'
import { searchHistory } from './history'
import { listWindows } from './list-windows'
import { newWindow } from './new-window'
import { openTab } from './open-tab'
import { reopenClosedTab } from './sessions'
import { groupTabs, ungroupTabs } from './tab-groups'

/** Browser-level tools — run in the background via `browser.*` on tab/window
 * ids (no content script). Ones needing an optional permission check it and
 * fail gracefully until the user grants it in Settings (docs/adr/0003). */
export const browserTools: ToolDef[] = [
  openTab,
  closeTab,
  activateTab,
  arrangeTabs,
  newWindow,
  listWindows,
  closeWindow,
  addBookmark,
  listBookmarks,
  searchBookmarks,
  searchHistory,
  reopenClosedTab,
  groupTabs,
  ungroupTabs,
]
