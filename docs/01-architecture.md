# 01 — Architecture

Inquiso is a Manifest V3 web extension. It has four runtime surfaces plus a shared core. All
logic is local; the only outbound network calls are made directly to the AI provider the user
configured.

## Runtime surfaces

```
┌─────────────────────────────────────────────────────────────────────┐
│ Browser                                                               │
│                                                                       │
│  ┌───────────────┐   messages    ┌──────────────────────────────┐    │
│  │  Side Panel    │ ◀───────────▶ │  Background Service Worker    │    │
│  │  (React UI)    │               │  - Orchestrator / agent loop  │    │
│  │  - chat        │               │  - AI SDK provider router     │    │
│  │  - reasoning   │               │  - Auth & encrypted key store │    │
│  │    trace       │               │  - Cache + memory manager     │    │
│  │  - model/scope │               │  - Tab/context aggregator     │    │
│  └───────────────┘               └──────────────┬───────────────┘    │
│                                                  │ scripting /        │
│  ┌───────────────┐                               │ tabs / messages    │
│  │  Options page  │                               ▼                    │
│  │  (React UI)    │              ┌──────────────────────────────┐     │
│  │                │              │  Content Script (per tab)     │     │
│  └───────────────┘              │  - DOM/a11y-tree extraction    │     │
│                                 │  - action executor (click/type)│     │
│  ┌───────────────┐              │  - highlight/citation overlay  │     │
│  │  Offscreen doc │ ◀──────────▶ │  - mutation observer           │     │
│  │  (heavy parse) │              └──────────────────────────────┘     │
│  └───────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────┘
            │  HTTPS (only when a cloud provider is selected)
            ▼
   OpenAI / Anthropic / Google endpoints     (Chrome AI runs fully on-device)
```

## Responsibilities

### Background service worker (the brain)
The single source of truth. Owns the **agent loop**, the **provider router** (Vercel AI SDK),
**auth/token storage**, the **cache + memory manager**, and **context aggregation** across
tabs. It is the only surface allowed to hold secrets and make provider calls. MV3 service
workers are ephemeral, so all state is persisted to `chrome.storage` / IndexedDB and rehydrated
on wake; long agent runs use alarms/ports to survive worker suspension.

### Content script (the hands & eyes)
Injected on demand (via `activeTab` / user-granted host permission). Extracts readable content
(Mozilla Readability), builds a compact accessibility/DOM map for the agent, executes actions
(click, type, scroll, navigate), and renders citation highlights. It holds **no secrets** and
runs in an isolated world.

### Side panel (the face)
React UI using `chrome.sidePanel` (Chrome/Edge) and `sidebar_action` (Firefox). Renders the
chat, the live reasoning/action trace, scope selector (page / tab group / window), and the
model picker. Talks to the background via a long-lived `Port`.

### Options
Options = provider/key management, permissions, privacy, cache settings. There is no action
popup: clicking the toolbar icon opens the side panel directly (a popup would swallow the
click — Chrome never fires `action.onClicked` when one is set).

### Offscreen document
Chrome offscreen doc for CPU-heavy parsing (large-DOM Readability, HTML→Markdown, optional
local embeddings) so the service worker and page stay responsive.

## Message flow (a single question)

1. User types in the side panel → message sent over the `Port` to the background.
2. Background resolves **scope** → asks the relevant content script(s) for extracted content.
3. Cache manager returns cached content if the page hash is unchanged; otherwise extracts and
   caches it.
4. Background builds the prompt (system + untrusted-page-data envelope + history) and starts a
   **streaming** AI SDK call through the selected provider.
5. Reasoning tokens, tool calls, and answer chunks stream back to the side panel as they arrive.
6. If the agent calls an action tool, the background routes it to the content script (after a
   confirmation gate for sensitive actions) and feeds the result back into the loop.

## Cross-browser strategy

WXT produces per-browser builds from one codebase. A thin `src/platform/` adapter normalizes
the few APIs that differ (side panel vs sidebar action, `chrome.*` vs `browser.*` via
`webextension-polyfill`, MV3 background differences on Firefox). See
[Tech Stack](02-tech-stack.md) and [Project Structure](07-project-structure.md).
