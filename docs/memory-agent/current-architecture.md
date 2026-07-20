# Current Architecture Audit (pre–MemoryAgent)

Snapshot taken 2026-07-11 at commit `34430b3`, before any MemoryAgent work. This documents what
exists so the MemoryAgent additions in [implementation-plan.md](implementation-plan.md) are
distinguishable from pre-existing Inquiso functionality.

## Baseline health (measured before changes)

| Check | Command | Result |
| --- | --- | --- |
| Types | `pnpm typecheck` | ✅ clean |
| Unit tests | `pnpm test` | ✅ 26 files, 102 tests pass |
| Lint/format | `pnpm check` | ⚠️ 4 pre-existing complexity warnings (function complexity 17 > 15), no errors |
| Build | `pnpm build` | ✅ chrome-mv3 + firefox-mv2, 7.61 MB total |
| File-size rule | `pnpm lines` | ✅ all ≤ 100 lines |

The 4 Biome warnings pre-date this work and are not silenced or fixed here.

## Stack

- **Extension framework**: WXT 0.20 → Manifest V3 (Chrome/Chromium) and MV2 (Firefox).
  Entrypoints: `src/entrypoints/background.ts`, `extractor.content.ts`, `sidepanel/`, `options/`.
- **Frontend**: React 19 + Tailwind v4, side panel + options pages.
- **Backend**: **none** — serverless and local-first by hard rule (CLAUDE.md §Hard rules 5).
  Only outbound calls are direct to the user's chosen AI provider.
- **LLM layer**: Vercel AI SDK v6 (`ai` + `@ai-sdk/openai|anthropic|google|openai-compatible`),
  Chrome Built-in AI (`@browser-ai/core`), WebLLM. Zod 4 at every boundary.
- **Persistence**: localforage over one IndexedDB database `inquiso` (one object store per
  module) via the single factory `appStore()` in `src/core/data/storage/instance.ts`;
  `browser.storage.local` for settings + AES-GCM-encrypted API keys; raw IndexedDB
  (`inquiso-secure`) for the non-extractable master `CryptoKey`.
- **Tests**: Vitest (`tests/unit/**`, mirrors `src/`), Playwright e2e (`tests/e2e/`).
- **CI/deploy**: GitHub Actions (`.github/workflows/ci.yml`, `e2e.yml`). No cloud deployment —
  the extension ships as store/zip artifacts (`pnpm zip`).

## Agent loop (`src/core/agent/`)

- `loop/run-agent.ts` — one streaming loop for all providers via `streamText`. Inputs:
  `ActiveModel`, user text, `PageContext[]`, attachments, history, `AbortSignal`, `emit`
  (stream to UI), `confirm` (human gate), `autonomy`. Budget: `DEFAULT_BUDGET = { maxSteps: 30,
  deadlineMs: 5min }` (`loop/budget.ts`), context compaction via `prepareStep`
  (`loop/steps.ts`, keeps last 2 messages verbatim, prunes old tool output), tool-call repair
  for weak models (`loop/repair.ts`), Anthropic prompt caching (`loop/cache.ts`).
- **Tools** are a custom abstraction (`tools/context.ts`): `defineTool({ name, description,
  risk, inputSchema, execute, confirmWhen?, available?, toModelOutput? })`, wrapped into AI SDK
  `tool()` by `tools/registry.ts`, which enforces the confirmation gate *before* the handler
  runs. `ToolContext = { tabId, confirm, model, autonomy, vision }`.
- **Tool groups**: `read/` (readPage, queryElements, getTabs, readTab, screenshot, tables,
  links, metadata, selection, **memory**), `act/` (click, type, navigate, scrollTo,
  selectOption, submitForm, waitFor, highlight, downloadFile, exportData), `browser/` (tabs,
  windows, groups, bookmarks, history, sessions). Subagents (`subagents/`) expose researcher /
  trust-auditor / comparer as `ask_*` tools with a 6-step budget. MCP tools are gated as
  high-risk.
- **Risk gate**: `riskOf(name)` (unknown → `high`, fail-safe) × autonomy level (`ask` /
  `auto-low` / `scope`) in `src/shared/autonomy.ts`; per-args `confirmWhen` floors that
  autonomy can never lower. Confirmations round-trip over the chat port; ports from tabs are
  rejected so pages cannot self-approve.

## Browser action model & element targeting

- Background → content messages are the Zod union `ContentMsg` in
  `src/shared/content-actions.ts` (`extract | query | act | getSelection | links | tables |
  metadata | waitFor`), sent by `sendToTab` (`src/core/context/tab.ts`) which injects the
  content script on demand (`registration: 'runtime'` — no `<all_urls>`).
- Element targeting is **handle-based** (`src/content/actions/handles.ts`): matched elements
  get `data-inquiso-id="iq-N"`; queries filter an interactive-element candidate set by ARIA
  role and accessible-ish name (aria-label → placeholder → text → value). Handles are
  ephemeral per page load. There is **no layered semantic locator model** and no record of why
  an element was chosen.
- Action results are structural only: `{ ok, error? }` with codes like `element_not_found`.
  **There is no outcome verification** — a click that dispatched is reported as success; the
  relay layer even defaults missing `ok` to success.

## Existing "memory"

`src/core/agent/tools/read/memory.ts`: two `risk: 'none'` tools, `remember(key, value)` /
`recall(key?)`, over an untyped localforage store `memory`. Flat string KV — no scoping,
provenance, confidence, temporal validity, retrieval, GC, or UI. It is not auto-injected into
context; the model must call `recall`. This is the seed the MemoryAgent build replaces.

## What exists that the MemoryAgent build reuses

| Capability | Where | Reused for |
| --- | --- | --- |
| Turn trace + usage persistence | `src/shared/trace.ts`, `src/core/chat/record.ts` | run metrics, episode evidence |
| Embeddings + hybrid rerank | `src/core/providers/embeddings/*` (`Embedder`, cosine, LRU cache), `src/core/context/rank.ts` (lexical) | semantic memory retrieval |
| Provider registry + OpenAI-compatible defs | `src/core/providers/registry.ts`, `defs/compatible.ts` | first-class Qwen/DashScope def |
| Typed UI↔background messaging | `src/core/messaging/` (`contract.ts` + `schemas/*` + `handlers.ts`) | Memory Center API |
| Streaming port protocol | `src/core/chat/protocol.ts`, `port.ts` | "using memory X" run events |
| Risk gate + confirm flow | `tools/registry.ts`, `src/shared/autonomy.ts` | deterministic policy engine base |
| Untrusted-page envelope | `src/core/context/envelope.ts`, system prompt | memory-poisoning quarantine |
| Encrypted secret store | `src/core/auth/secret-store.ts` | DashScope API key |
| Storage factory + GC patterns | `src/core/data/storage/instance.ts`, `attachments/gc.ts`, `history/store.ts` | memory/ledger/skill stores |

## Gaps the MemoryAgent build must fill

1. No event ledger — the turn trace is UI-oriented, not an append-only typed execution record.
2. No outcome verification — success is assumed from dispatch, never evidenced.
3. No checkpoints or task resume across service-worker termination / browser restart.
4. No typed memory (semantic/episodic/procedural), no provenance/confidence/temporal model.
5. No memory retrieval into context — nothing is recalled unless the model asks.
6. No skills: nothing is learned, versioned, shadow-tested, degraded, or repaired.
7. No Memory Center UI; users cannot inspect/edit/forget what the agent stored.
8. No capability-scoped persistent permission grants (only per-run autonomy + per-call confirm).
9. No Qwen provider def (reachable today only as a user-added custom endpoint).
10. No evaluation harness measuring first-run vs repeated-run improvement.

## Binding constraints (enforced by CI)

- ≤100 lines per file under `src/`, `scripts/`, `tests/` (`scripts/check-file-size.mjs`);
  docs and `demo/` are exempt.
- `core/` no DOM, never imports `ui/`/`content/`; `content/` no secrets; `ui/`↔`core/` only via
  `core/messaging`; `shared/` imports nothing from other top-level dirs.
- TypeScript strict, no `any`; Zod on all boundary data. Conventional Commits, no AI authorship
  trailers. Serverless: no Inquiso-hosted backend (shapes the Alibaba deployment: it hosts the
  **demo portals**, not an Inquiso server).
