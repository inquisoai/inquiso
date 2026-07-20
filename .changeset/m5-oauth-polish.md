---
"inquiso": minor
---

M5 — Opt-in OAuth & polish. Adds an Authorization Code + PKCE OAuth scaffold
(WebCrypto PKCE, launchWebAuthFlow, encrypted token storage, sign-out) that is
disabled by default — providers are opt-in and must be ToS-compliant (never
Claude subscription OAuth). Adds an i18n helper + English locale, accessibility
labels and reduced-motion-aware scrolling, and a Playwright e2e harness that
loads the built extension in Chromium.
