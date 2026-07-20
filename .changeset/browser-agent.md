---
"inquiso": minor
---

Inquiso is now a browser-wide agent, not just a page reader. New background
`browser/` tool group lets the agent open/close/activate/arrange tabs, manage
windows and (Chromium) tab groups, and — behind opt-in optional permissions —
add/search bookmarks, search history, and reopen closed tabs. Each new tool
carries a declared risk and, when it needs a permission, fails gracefully with
`permission_needed` until the user grants it in Settings.

Adds a three-level **autonomy** model (`ask` / `auto-low` / `scope`, default
`scope`) set once per run from the validated request, with an un-overridable
HIGH-risk floor (submit, download, close-window, cross-origin navigate, unknown
tools always confirm) enforced in the background — the model can never raise its
own autonomy. The fixed 12-step cap becomes a configurable budget (steps +
wall-clock + optional tokens) with a per-run meter and emergency Stop; subagent
tools now route through the same confirm gate. New Settings section grants the
optional permissions and an off-by-default, revocable "all sites" toggle (never
`<all_urls>`, never at install). Rationale and compensating controls: ADR-0003.
