/** Stable lowercase slug from a human label: runs of non-alphanumerics collapse
 * to single dashes, trimmed at both ends. Empty labels slug to ''. Shared by
 * custom-provider and MCP ids so the two can never drift. */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
