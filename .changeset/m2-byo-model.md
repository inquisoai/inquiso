---
"inquiso": minor
---

M2 — Bring your own model. Adds encrypted (AES-GCM, non-extractable key in
IndexedDB) API-key storage and OpenAI / Anthropic / Google providers via the
Vercel AI SDK, behind the existing provider interface. The active provider and
per-provider model are user-selectable from the side panel and Options, switch
mid-conversation, and the manifest CSP locks outbound connections to the
selected providers' endpoints. Chrome AI remains the zero-config default.
