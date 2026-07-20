---
'inquiso': patch
---

Security hardening and cleanup from a full codebase audit:

- The background now rejects messages and chat-port connections from content-script senders, closing a path where a compromised page context could reach the control API or self-approve agent confirmations.
- Page envelope delimiters (`<page`/`</page`) appearing inside page content, titles, or URLs are neutralized so untrusted text can never escape the envelope.
- `exportData` and MCP tools now always require confirmation; `openTab` with a URL confirms like `navigate`.
- Origin grants for custom providers, MCP servers, and cloud backup are verified in the background before every fetch, and released when the endpoint is removed.
- Removed the unshipped OAuth scaffolding and the unused install-time `identity` permission, dead code, and the unused `zustand`/`webextension-polyfill` dependencies.
- Scheduled-backup, MCP-connect, and model-catalog failures are now logged instead of silently swallowed.
