import type { RunLedger } from '@/core/memory/ledger/run-ledger'
import { toPageRef } from '@/shared/memory/events'

/**
 * Deterministic stand-in for the demo invoice portal (demo/portals/invoice).
 * Mirrors its two navigation versions: v1 Settings → Billing, v2 Account →
 * Billing. The simulator only replaces the DOM; every action is logged to a
 * REAL RunLedger with the same event shapes the outcome verifier produces,
 * so learning/retrieval/skills run unmodified on top.
 */
export const ORIGIN = 'https://portal.sim'

export type NavVersion = 1 | 2

interface SimPage {
  title: string
  /** Clickable links/buttons by accessible name → destination path. */
  links: Record<string, string>
  download?: boolean
}

const pages = (v: NavVersion): Record<string, SimPage> => ({
  '/': {
    title: 'Acme Invoicing — Home',
    links:
      v === 1
        ? { Reports: '/reports', Settings: '/settings', Home: '/' }
        : { Reports: '/reports', Account: '/account', Home: '/' },
  },
  '/reports': { title: 'Reports', links: { Home: '/' } },
  '/settings':
    v === 1
      ? { title: 'Settings', links: { Billing: '/billing', Home: '/' } }
      : { title: 'Settings (empty)', links: { Home: '/' } },
  '/account':
    v === 2
      ? { title: 'Account', links: { Billing: '/billing', Home: '/' } }
      : { title: 'Missing', links: {} },
  '/billing': {
    title: 'Billing',
    links: { Home: '/' },
    download: true,
  },
})

export class SimBrowser {
  private site: Record<string, SimPage>
  path = '/'

  constructor(
    readonly version: NavVersion,
    private ledger: RunLedger,
  ) {
    this.site = pages(version)
    // v2 has no Settings entry in the nav at all.
    if (version === 2) delete this.site['/']?.links.Settings
  }

  get url(): string {
    return `${ORIGIN}${this.path}`
  }

  page(): SimPage {
    return this.site[this.path] ?? { title: 'Not found', links: {} }
  }

  /** Click an element by accessible name; logs verifier-shaped events. */
  click(name: string): boolean {
    const from = this.url
    const target = this.page().links[name]
    const isDownload = name === 'Download newest PDF' && this.page().download
    this.ledger.log('ActionStarted', { tool: 'click', name, role: isDownload ? 'button' : 'link' })
    if (isDownload) {
      this.ledger.log('ActionSucceeded', { tool: 'click' }, { page: toPageRef(this.url) })
      this.ledger.log(
        'OutcomeVerified',
        { tool: 'click', outcome: 'verified_success' },
        {
          evidence: [{ type: 'download_started', filename: 'INV-2026-023.pdf' }],
          page: toPageRef(this.url),
        },
      )
      return true
    }
    if (!target) {
      this.ledger.log('ActionFailed', { tool: 'click', error: 'element_not_found' })
      return false
    }
    this.path = target
    this.ledger.log('ActionSucceeded', { tool: 'click' }, { page: toPageRef(this.url) })
    this.ledger.log(
      'OutcomeVerified',
      { tool: 'click', outcome: 'verified_success' },
      { evidence: [{ type: 'url_changed', from, to: this.url }], page: toPageRef(this.url) },
    )
    return true
  }
}
