import { resolve } from 'node:path'
import { chromium, expect, test } from '@playwright/test'

const EXTENSION = resolve('.output/chrome-mv3')

/** Smoke test: load the built extension and confirm the sidepanel renders. */
test('sidepanel renders the Inquiso UI', async () => {
  const context = await chromium.launchPersistentContext('', {
    // Extensions never load in the default headless shell; the chromium
    // channel's new headless mode supports them.
    channel: 'chromium',
    args: [`--disable-extensions-except=${EXTENSION}`, `--load-extension=${EXTENSION}`],
  })
  try {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'))
    const extensionId = worker.url().split('/')[2]
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/sidepanel.html`)
    await expect(page.getByRole('heading', { name: /Ask anything/ })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /Ask about this page/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'New chat' })).toBeVisible()
  } finally {
    await context.close()
  }
})
