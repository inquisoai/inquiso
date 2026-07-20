# 02 — Tech Stack

Every dependency is chosen for **speed** (build + runtime), **cross-browser support**, and a
**healthy open-source footprint**. We favor small, fast, well-maintained tools.

## Core

| Concern | Choice | Why |
| --- | --- | --- |
| Extension framework | **[WXT](https://wxt.dev)** | Vite-based, framework-agnostic, best-in-class cross-browser (Chrome/Firefox/Edge) builds, file-based entrypoints, HMR for extensions, smaller bundles than Plasmo. |
| Bundler/dev server | **Vite** (via WXT) | Fast cold start, instant HMR, modern ESM output. |
| Language | **TypeScript** (strict) | Type safety end-to-end; shared types across surfaces. |
| UI | **React 19** | Largest contributor pool, richest AI-SDK examples (`useChat`), mature a11y tooling. |
| UI async state | **TanStack Query v5** | Cache + invalidation for background-owned data over runtime messaging (`queryFn` is transport-agnostic); ~13 kB gz, zero transitive deps, CSP-clean. Tuned in `ui/lib/query.ts`: `networkMode 'always'` (no HTTP online-detection), `retry 0` (a failed message is a bug, not weather). Router/Store/DB/Form evaluated and skipped: no URL to route, pre-1.0/beta, forms are trivial. |
| UI local state | **React `useState`** | Screen switch + composer drafts are a handful of local states; no store library warranted (Zustand was planned, never needed). |
| Styling | **Tailwind CSS v4** | Zero-runtime, fast new engine; tree-shaken utility CSS keeps the bundle small. |
| Schema/validation | **Zod** | Runtime validation + doubles as AI SDK tool-call schemas. |

## AI layer

| Concern | Choice | Why |
| --- | --- | --- |
| Multi-provider abstraction | **[Vercel AI SDK](https://ai-sdk.dev)** (`ai`) | One unified, streaming-first API across providers; tool-calling, structured output, reasoning streams. |
| OpenAI | `@ai-sdk/openai` | GPT models via user API key (or opt-in Codex OAuth). |
| Anthropic | `@ai-sdk/anthropic` | Claude models via user API key. |
| Google | `@ai-sdk/google` | Gemini models via AI Studio API key. |
| On-device | **Chrome Built-in AI** (Prompt/Summarizer APIs, Gemini Nano) | Free, private, offline default. Streams through `@browser-ai/core`, the AI SDK provider for browser built-in models. |
| Content extraction | **@mozilla/readability** + **Turndown** | Robust article extraction; HTML→Markdown for compact, token-efficient context. |

See [Providers & Auth](03-providers-and-auth.md) for the full provider/auth matrix.

## Quality & tooling (the "really fast tools")

| Concern | Choice | Why |
| --- | --- | --- |
| Lint + format | **[Biome](https://biomejs.dev)** | Rust-based; lints **and** formats in one pass, ~10–100× faster than ESLint+Prettier. Enforces our file-size and import rules. |
| Package manager | **pnpm** | Fast, disk-efficient, strict dependency resolution (supply-chain safety). |
| Unit/integration tests | **Vitest** | Vite-native, instant watch mode; WXT testing helpers. |
| E2E (extension) | **Playwright** | Loads the built extension in real Chromium/Firefox and drives the UI + agent. |
| Git hooks | **Husky** + **lint-staged** | Run Biome + commitlint pre-commit/pre-push, fast and incremental. |
| Commit lint | **commitlint** (conventional) | Enforces [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). |
| Versioning/changelog | **Changesets** | Per-PR changelog entries; automated release notes. |
| CI | **GitHub Actions** | Lint, typecheck, test, build all targets, upload artifacts. |

## Cross-browser compatibility

- **[webextension-polyfill](https://github.com/mozilla/webextension-polyfill)** for a unified
  promise-based `browser.*` API; WXT wires this in automatically.
- A `src/platform/` adapter isolates the handful of genuinely divergent APIs (side panel vs
  sidebar action, offscreen documents which are Chromium-only, etc.).

## Explicitly considered & rejected

- **Plasmo** — Parcel-based, React-locked, larger bundles, slower builds than WXT.
- **ESLint + Prettier** — works, but Biome is dramatically faster and one tool instead of two.
- **A hosted backend / proxy** — rejected on principle (serverless, local-first, privacy).
- **Subscription-OAuth-first auth** — rejected on ToS/ban risk; see provider doc.
