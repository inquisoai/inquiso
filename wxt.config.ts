import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

// WXT config: one codebase, per-browser builds. See docs/01-architecture.md.
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  // Generate the manifest icon set (16/32/48/128) from the logo tile. Keep the
  // dev icon full-colour (no grayscale dev indicator) so it matches production.
  autoIcons: { baseIconPath: 'assets/logo.svg', developmentIndicator: false },
  // Tailwind v4 via its first-party Vite plugin (zero-runtime, fast).
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: ({ browser, command, mode }) => {
    const isFirefox = browser === 'firefox'
    // Dev server (HMR + auto-reload) needs localhost; never shipped in builds.
    const devSources = command === 'serve' ? ' ws://localhost:3000' : ''
    return {
      name: 'Inquiso',
      description:
        'Chat with and act on any web page using your own AI keys or built-in browser AI.',
      default_locale: 'en',
      // No default_popup: a popup swallows the click and action.onClicked
      // (which opens the side panel) would never fire. auto-icons fills the
      // top-level `icons`; the toolbar button needs its own default_icon,
      // pointing at those same generated files.
      action: {
        default_title: 'Inquiso',
        default_icon: { 16: 'icons/16.png', 32: 'icons/32.png', 48: 'icons/48.png' },
      },
      // Least privilege: activeTab + user-granted host permissions. No <all_urls>.
      permissions: [
        'activeTab',
        'storage',
        'scripting',
        'tabs',
        'downloads',
        'alarms',
        'unlimitedStorage',
        ...(isFirefox ? [] : ['sidePanel']),
      ],
      optional_host_permissions: ['https://*/*', 'http://*/*'],
      // Dev builds pre-grant localhost so the live-eval harness can read the
      // demo portals without a permission gesture. Never in production.
      ...(mode === 'development' ? { host_permissions: ['http://localhost/*'] } : {}),
      // Browser-management APIs the agent uses only after the user grants each
      // (requested at first use / in Settings) — never at install (docs/adr/0003).
      optional_permissions: ['bookmarks', 'history', 'tabGroups', 'sessions'],
      // Network layer: allow HTTPS (any provider/gateway the user configures)
      // plus localhost for on-device model servers (Ollama/LM Studio). Each
      // custom host still requires an explicit user-granted host permission —
      // least privilege by consent, not by a static allowlist (see ADR-0002,
      // docs/05 T5). Chrome AI is on-device and needs none.
      content_security_policy: {
        extension_pages: `script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src 'self' https: http://localhost:* ws://localhost:*${devSources}`,
      },
      // Firefox uses sidebar_action; Chromium uses the native side_panel entrypoint.
      ...(isFirefox
        ? {
            sidebar_action: { default_panel: 'sidepanel.html', default_title: 'Inquiso' },
            // We collect no user data — declare it explicitly for Firefox review.
            browser_specific_settings: {
              gecko: { data_collection_permissions: { required: ['none'] } },
            },
          }
        : {}),
    }
  },
})
