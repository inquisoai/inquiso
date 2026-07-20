# ADR 0002 — Dynamic OpenAI-compatible providers (bring any model)

- **Status:** Accepted
- **Date:** 2026-07-07
- **Deciders:** Maintainers
- **Relates to:** ADR-0001 (auth), docs/05 (T5, CSP)

## Context

The built-in providers (OpenAI, Anthropic, Google, Chrome AI) were hard-coded. Users asked to
run *any* model the AI SDK can reach — hosted gateways, self-hosted endpoints, and local
servers (Ollama, LM Studio) — using their own keys. The AI SDK makes this cheap: one
`@ai-sdk/openai-compatible` adapter speaks to any OpenAI-compatible endpoint, differing only
by `baseURL`.

The blocker was our security posture: `connect-src` was locked to three hosts, and MV3's
static CSP cannot be edited at runtime. A truly arbitrary user endpoint is otherwise blocked
at the network layer.

## Decision

Support **dynamic, user-added OpenAI-compatible providers**, plus two built-in gateways
(OpenRouter, Vercel AI Gateway) that front hundreds of models through one host each.

1. **Data-driven registry.** A provider is a serializable `ProviderDef`; the `compatible`
   kind carries a `baseURL` + free-text model id and resolves through one
   `createOpenAICompatible` call. Adding a provider is data, not code.
2. **Network layer opens, consent layer tightens.** `connect-src` allows `https:` +
   `localhost`. Each custom host is reachable only after an explicit
   `permissions.request({origins})` grant (from `optional_host_permissions`), triggered by a
   user gesture in the settings UI. Least privilege moves from a static allowlist to
   **per-host user consent**.
3. **Keys unchanged.** BYOK, encrypted at rest, keyed by provider id; local (localhost)
   providers need none.
4. **`script-src`/`object-src` stay `'self'`.** The no-RCE guarantee is untouched.

## Consequences

- ✅ Any AI-SDK-reachable model works with the user's own key — the requested capability.
- ✅ Aligns with the privacy promise: the user explicitly chooses and consents to each
   destination. Nothing is silently reachable.
- ✅ Local-first story strengthened (Ollama/LM Studio = free, private, no key).
- ⚠️ `connect-src` is broader than before. Mitigated by per-host consent, unchanged tool
   surface, and `script-src` staying locked. A compromised *config* can only reach hosts the
   user has personally granted.
- ⚠️ Model tool-calling support varies; `compatible` providers default to `toolCalls: true`
   and a non-tool model may error — acceptable, revisit with a per-provider toggle if needed.

## Alternatives rejected

- **Curated allowlist only** — rejected: doesn't satisfy "any model"; gateways alone can't
  cover self-hosted/local endpoints.
- **Keep CSP locked, proxy through a gateway host only** — rejected: excludes local and
  self-hosted models, which are core to the local-first thesis.
