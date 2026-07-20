import { executeAction } from '@/content/actions/execute'
import { queryElements } from '@/content/actions/query'
import { elementState } from '@/content/actions/state'
import {
  getMetadata,
  getSelectionText,
  listLinks,
  readTables,
  waitForSelector,
} from '@/content/extract/inspect'
import { extractPage } from '@/content/extract/readability'
import { browser } from '@/platform'
import { ContentMsg } from '@/shared/content-actions'

/**
 * The page's hands & eyes. Registered at runtime and injected on demand via
 * scripting.executeScript under activeTab — least privilege (T4). No
 * `matches`: WXT would copy it into manifest host_permissions, shipping
 * <all_urls> we never need. Holds no secrets. Handles read (extract/query)
 * and act (click/type/scroll) messages; action risk is gated in the
 * background before any 'act' arrives.
 */
export default defineContentScript({
  registration: 'runtime',
  main() {
    const w = window as unknown as { __inquisoExtractor?: boolean }
    if (w.__inquisoExtractor) return
    w.__inquisoExtractor = true

    browser.runtime.onMessage.addListener((raw) => {
      const parsed = ContentMsg.safeParse(raw)
      if (!parsed.success) return
      const msg = parsed.data
      switch (msg.type) {
        case 'extract':
          return Promise.resolve(extractPage(document))
        case 'query':
          return Promise.resolve(queryElements(msg.args))
        case 'state':
          return Promise.resolve(elementState(msg.handle))
        case 'getSelection':
          return Promise.resolve({ text: getSelectionText() })
        case 'links':
          return Promise.resolve({ links: listLinks(msg.limit) })
        case 'tables':
          return Promise.resolve({ tables: readTables(msg.limit) })
        case 'metadata':
          return Promise.resolve(getMetadata())
        case 'waitFor':
          return waitForSelector(msg.selector, msg.timeoutMs).then((found) => ({ found }))
        default:
          return Promise.resolve(executeAction(msg.args))
      }
    })
  },
})
