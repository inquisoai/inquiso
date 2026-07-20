// One live-eval browser session: launch Chromium with the dev-built
// extension, open the demo portal as the active tab, and drive the real
// service-worker turn path via the DEV-only hooks (src/core/chat/live-eval.ts).
import { chromium } from '@playwright/test'

const EXT = '.output/chrome-mv3-dev'

async function serviceWorker(context) {
  const existing = context.serviceWorkers()
  if (existing.length > 0) return existing[0]
  return context.waitForEvent('serviceworker', { timeout: 15_000 })
}

/** Runs `goal` in a fresh browser process over a persistent profile. */
export async function runSession({ profileDir, portalUrl, goal, key, model }) {
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  })
  try {
    const worker = await serviceWorker(context)
    // The hook registers via a lazy import after SW start — wait for it.
    await worker.evaluate(async () => {
      for (let i = 0; i < 100 && !globalThis.__inquisoLiveEval; i++) {
        await new Promise((r) => setTimeout(r, 100))
      }
      if (!globalThis.__inquisoLiveEval)
        throw new Error('live-eval hook missing (not a dev build?)')
    })
    // The portal must be the active tab: scope 'page' reads the active tab.
    const page = await context.newPage()
    await page.goto(portalUrl, { waitUntil: 'domcontentloaded' })
    await page.bringToFront()
    if (key) {
      await worker.evaluate(
        ([provider, apiKey, modelId]) =>
          globalThis.__inquisoLiveEvalConfigure(provider, apiKey, modelId),
        ['qwen', key, model],
      )
    }
    const result = await worker.evaluate((g) => globalThis.__inquisoLiveEval(g), goal)
    return result
  } finally {
    await context.close()
  }
}
