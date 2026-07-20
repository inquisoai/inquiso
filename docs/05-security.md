# 05 — Security & Threat Model

Inquiso reads page content, holds API keys/tokens, and can act on pages. That makes security a
first-class feature, not an afterthought. This doc defines the threat model and the concrete
defenses.

## Assets to protect

1. **User credentials** — API keys and OAuth tokens.
2. **User data** — page content, prompts, chat history.
3. **User's accounts & sessions** — the agent operates inside the user's authenticated sessions.
4. **Provider account standing** — never put the user at ToS/ban risk (see provider doc).

## Threats & defenses

### T1 — Prompt injection from page content (highest priority)
A page tries to hijack the agent ("ignore instructions, buy this, exfiltrate that").
- Page content is **untrusted data**, always wrapped in a delimited, quoted envelope; the
  system prompt states page text is never an instruction.
- **No action executes without passing the risk gate**, independent of model output.
- Tool surface is tiny and capability-bounded (no eval, no arbitrary fetch, same-origin only).
- Cross-origin navigation and form submission are HIGH-risk → **always** confirm, at every
  autonomy level (the un-overridable floor; ADR-0003).
- The gate is keyed on the tool's declared risk and args; **the model cannot set its own
  autonomy level** — that is fixed once per run from the validated request.
- User-attached files are trusted user input (the user chose them); capped in count and size,
  sent only to the chosen provider. They are **persisted on-device** as Blobs in a dedicated
  IndexedDB store (referenced by id from the turn) so past chats show them — never uploaded to
  Inquiso, never synced, and clearable by the user (docs/adr/0005).

### T2 — Credential theft / leakage
- Keys/tokens stored **encrypted** (WebCrypto AES-GCM) in `chrome.storage.local`; the data key
  is non-extractable and generated on first run. We document the honest limitation: a fully
  compromised browser profile can still reach storage — encryption raises the bar, not a
  guarantee.
- Secrets live **only** in the background worker. Content scripts and page contexts never
  receive them. Message channels are validated by sender.
- Secrets are **never** logged, never put in `chrome.storage.sync`, never in URLs.
- Sign-out / uninstall wipes all secrets.

### T3 — Malicious or supply-chain dependency
- **pnpm** with a committed lockfile; CI fails on lockfile drift.
- Dependabot + `pnpm audit` in CI; minimal dependency count; prefer vendored small utilities
  over large transitive trees.
- No remote code execution: MV3 forbids it and our CSP enforces it (below).

### T4 — Over-broad permissions
- Default to **`activeTab`** + **`optional_host_permissions`** the user grants per-site.
- No `<all_urls>` by default, and never at install. Request the minimum; explain each
  permission in Settings.
- Capabilities beyond tabs/windows (`bookmarks`, `history`, `tabGroups`, `sessions`) ship as
  **`optional_permissions`**, granted only from a Settings gesture. A tool called before its
  grant returns `{ ok: false, error: 'permission_needed', permission }` — never a silent failure.
- Broad cross-site access is an **off-by-default, revocable "all sites" toggle**
  (`optional_host_permissions` = `https://*/*` + `http://*/*`), so multi-site runs need not
  prompt per-origin. Clearly warned; still never `<all_urls>` (ADR-0003).
- `chrome.scripting` injection is on-demand, scoped to the active/permitted tab.

### T5 — Data exfiltration via the network
- Built-in providers (OpenAI/Anthropic/Google) and gateways (OpenRouter, Vercel AI
  Gateway) reach only their official HTTPS endpoints; Chrome AI needs none.
- To support **user-added OpenAI-compatible providers** (any model with a key — see
  ADR-0002), `connect-src` allows `https:` + `localhost` at the network layer. The real
  gate is **per-host consent**: each custom endpoint requires an explicit
  `permissions.request` grant (from `optional_host_permissions`) before it can be reached —
  least privilege by user consent, not by a static allowlist. The user always chooses
  exactly where their data goes, which is the privacy promise, not a hole in it.
- The tool surface stays bounded: no eval, no arbitrary-fetch tool. `downloadFile` fetches a
  user-approved URL to disk (no page data sent). Web search is **provider-native** (the model's
  own search tool), never a raw fetch — the query egresses to the chosen provider, so it's a
  user toggle, default on, flagged in Settings.

### T6 — UI redress / message spoofing
- Background validates `sender` on every message; ports are origin/extension-checked.
- Side panel ↔ background uses a typed, versioned message contract (Zod-validated).

## Content Security Policy (MV3)

```jsonc
// manifest content_security_policy (object form, MV3)
{
  "extension_pages":
    "script-src 'self'; object-src 'self'; connect-src 'self' https: http://localhost:* ws://localhost:*;"
}
```
- No `'unsafe-inline'`, no `'unsafe-eval'`, no remote scripts. All code is bundled and shipped.
- `connect-src` permits HTTPS + localhost so users can bring any OpenAI-compatible model,
  but reachability is gated per-host by an explicit runtime permission grant (ADR-0002).
  `script-src`/`object-src` stay locked to `'self'` — the RCE surface is unchanged.

## Risk gate (autonomy-aware action confirmation)

Each tool declares a **risk**; each run has an **autonomy** level (set once from the validated
request, default `scope`). The gate combines them. HIGH-risk is an un-overridable floor.

| Risk | Examples | `ask` | `auto-low` | `scope` (default) |
| --- | --- | --- | --- | --- |
| none | read, query, list windows/history | run | run | run |
| low | scroll, highlight, open/activate tab, reopen closed tab | confirm | run | run |
| medium | click, type, same-origin navigate, close tab, add bookmark, group tabs | confirm | confirm | run |
| high | submit form, download, close window, **cross-origin navigate**, unknown tool | **always confirm** | **always confirm** | **always confirm** |

- The gate is enforced in the background **before** dispatching, keyed on the tool's declared
  risk and its args (`confirmWhen`, e.g. cross-origin navigate) — never on model output.
- The model cannot raise its own autonomy; the HIGH floor holds at every level.
- An unknown/unregistered tool defaults to HIGH → always confirms.
- Rationale for the aggressive `scope` default and its compensating controls: **ADR-0003**.

## Process & disclosure

- All changes pass `biome` lint, typecheck, tests, and a build for every target in CI.
- Security-sensitive PRs get extra review and a threat-model note.
- Responsible disclosure policy and contact are in [SECURITY.md](../SECURITY.md).
- We run periodic dependency and static analysis (e.g. CodeQL, `pnpm audit`).
