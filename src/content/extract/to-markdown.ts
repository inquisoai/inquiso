import TurndownService from 'turndown'

let service: TurndownService | null = null

/** Converts (already Readability-cleaned) HTML to compact, token-efficient Markdown. */
export function htmlToMarkdown(html: string): string {
  if (!service) {
    service = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })
    service.remove(['script', 'style', 'noscript', 'iframe'])
  }
  return service.turndown(html).trim()
}
