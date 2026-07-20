---
"inquiso": minor
---

Bring any model the AI SDK can reach. Two built-in gateways (OpenRouter,
Vercel AI Gateway) front hundreds of hosted models through one key each, and
users can add any OpenAI-compatible provider — a gateway, a self-hosted
endpoint, or a local server (Ollama/LM Studio) — from an in-panel "Add a
provider" form (name, base URL, free-text model id). All resolve through one
`@ai-sdk/openai-compatible` path, so the whole pipeline (streaming, tools,
Thoughts, history) works unchanged. To reach custom hosts, `connect-src` now
allows https + localhost, gated per-host by an explicit runtime permission
grant — least privilege by user consent (see ADR-0002). Local providers need
no key. The provider registry is fully data-driven; adding a provider is
config, not code.
