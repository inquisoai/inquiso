/** The display host of a URL, falling back to the raw string for anything
 * unparseable (e.g. about:blank, chrome:// pages). */
export const host = (url: string): string => {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
