# 09 — Roadmap

Milestones are ordered to ship something usable early, then deepen. Each milestone is a set of
focused, conventionally-committed PRs.

**Status:** M0–M5 implemented (see commit history). Remaining before v1.0.0: real-browser
verification of the agent + cloud providers, on-device embedding retrieval, i18n for the
remaining dynamic status/error strings (UI labels are externalized), and stabilizing the e2e
suite across browsers.

## M0 — Foundation (scaffold)
- WXT + React + TypeScript + Tailwind + Biome + pnpm scaffold.
- Cross-browser build targets (Chrome, Edge, Firefox) producing loadable artifacts.
- Typed messaging contract, platform adapter, CI (lint/typecheck/test/build), git hooks,
  commitlint, Changesets, repo health files.
- **Exit:** `pnpm dev` loads a blank-but-wired extension in Chrome and Firefox.

## M1 — Read & answer (single page)
- Content extraction (Readability + a11y/DOM map + Turndown) with caching.
- Chrome Built-in AI adapter (default) + side-panel chat with streaming.
- Summarize / ask / trustworthiness flows grounded in page content, with citations.
- **Exit:** ask a question about the current page and get a streamed, cited answer locally.

## M2 — Bring your own model
- BYOK key management (encrypted storage) for OpenAI / Anthropic / Google via AI SDK.
- Model picker + capability gating; per-provider data-use disclosures.
- **Exit:** switch between Chrome AI and a cloud model mid-conversation.

## M3 — The agent
- Tool registry, multi-step loop, element handles, live reasoning/action trace UI.
- Risk gate + confirmation UI + observe-only mode + emergency stop.
- Action tools: click, type, scroll, navigate, waitFor, extractStructured, highlight.
- Prompt-injection defenses wired and tested.
- **Exit:** agent completes a simple multi-step task on a page with visible reasoning and
  confirmations.

## M4 — Multi-scope context
- Tab group / window scope, lazy multi-tab extraction, de-dup, relevance ranking.
- Optional on-device embeddings (offscreen doc) for retrieval over large corpora.
- Memory budget + pressure-driven eviction fully enforced.
- **Exit:** "summarize all my open tabs about X" works within memory limits.

## M5 — Opt-in OAuth & polish
- OAuth-PKCE flows where officially permitted (clearly risk-flagged), refresh + sign-out.
- i18n coverage, a11y pass, performance budget verification.
- E2E coverage across browsers; security review; first tagged release.
- **Exit:** v1.0.0 published to extension stores (and self-host instructions).

## Later (post-v1)
- Additional providers / local runtimes; per-site agent recipes; export of reasoning traces;
  optional encrypted local history search; Firefox/Chrome store automation.

## Non-goals reminder
No Inquiso server, no subscription-OAuth that violates ToS, no unconfirmed sensitive actions.
See [Vision](00-vision.md) and [Providers & Auth](03-providers-and-auth.md).
