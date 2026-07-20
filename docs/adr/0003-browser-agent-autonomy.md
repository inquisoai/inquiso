# ADR 0003 — Browser-wide agent with aggressive-by-default autonomy

- **Status:** Accepted
- **Date:** 2026-07-06
- **Deciders:** Maintainers

## Context

Inquiso began as a page-scoped reader/actor: it could read the active tab (or a group/window),
navigate the current tab, and download. To be a genuine "OpenClaw for the web" — an agent that
can do essentially anything in the browser on the user's behalf — it needs to open/close tabs,
manage windows and tab groups, touch bookmarks/history, reopen closed tabs, and run longer
autonomous tasks across sites.

This tensions with four hard rules established earlier:

1. **Least-privilege `activeTab`, no `<all_urls>`** (docs/05).
2. **"All acting always confirms"** (docs/05) — every action surfaced a confirm prompt.
3. **Bounded, short agent loop** (originally a fixed 12-step cap).
4. **Secrets/enforcement only in the background** — unchanged, and we keep it.

A per-action confirm prompt makes a cross-site autonomous agent unusable. The maintainer chose
an **aggressive-by-default** posture: near hands-off on sites the user has granted, prompting
only for genuinely risky/irreversible actions.

## Decision

Ship a browser-wide agent with a three-level autonomy model, defaulting to the most hands-off
level, **while keeping the security spine intact through compensating controls**.

### Autonomy levels (default = `scope`)

| Level | none | low | medium | high |
|---|---|---|---|---|
| `ask` | run | confirm | confirm | confirm |
| `auto-low` | run | run | confirm | confirm |
| **`scope`** (default) | run | run | run | **always confirm** |

- Autonomy is set **once per run** from the Zod-validated `SendRequest`, never from model
  output. The model cannot change its own permission level.
- **HIGH-risk is an un-overridable floor**: `close-window`, `submit-form`, `download-file`, and
  any unknown/unregistered tool always confirm at every level. Enforced in the background in
  `riskGate()`, which the model's tokens cannot reach.
- `confirmWhen(args)` lets a tool force a confirm on specific inputs regardless of level —
  `navigate` uses it so **cross-origin** navigations always confirm.

### Least-privilege preserved by consent

- Install-time permissions stay minimal. New capabilities (`bookmarks`, `history`, `tabGroups`,
  `sessions`) are `optional_permissions`, granted only from a Settings gesture.
- A permission-gated tool called before its grant returns
  `{ ok: false, error: 'permission_needed', permission }` — a graceful message the model relays,
  never a silent failure or a crash.
- Broad access is an **off-by-default, revocable "all sites" toggle** (`optional_host_permissions`
  = `https://*/*` + `http://*/*`), so multi-site runs need not prompt per-origin. We **never**
  request `<all_urls>` and never grant it at install.

### Bounded autonomy

- The fixed 12-step cap is replaced by a configurable **budget** (steps + wall-clock, optional
  token cap; default ~30 steps / 5 min) fed by a per-step meter, plus the always-present
  emergency Stop (AbortSignal). Subagents get a scaled-down slice.

## Consequences

- ✅ A usable cross-site agent: low/medium actions flow without friction on granted sites.
- ✅ The confirm gate remains a single background choke point the model cannot bypass; risk is
  declarative per tool; HIGH-risk/irreversible actions always confirm.
- ✅ No new install-time permission; broad access is explicit, warned, and revocable.
- ⚠️ **Departs from the earlier "all acting always confirms" rule.** This is the deliberate
  trade recorded here. The floor + consent + budget are the compensating controls that keep the
  blast radius bounded.
- ⚠️ Aggressive default means a mis-instructed agent can take many low/medium actions before a
  human intervenes; mitigated by the budget, the Stop button, and per-run autonomy override.

## Alternatives rejected

- **Keep "always confirm."** Rejected: makes autonomous multi-step/multi-site tasks unusable —
  the whole point of the feature.
- **Autonomy inferred from the model / prompt.** Rejected: the model must never set its own
  permission level; that would make prompt injection an escalation path.
- **`<all_urls>` at install for convenience.** Rejected: violates least-privilege; broad access
  must be an explicit, revocable opt-in.
