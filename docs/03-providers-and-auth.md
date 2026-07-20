# 03 — AI Providers & Authentication

This is the most consequential design area, because the popular framing of "just log in with
your ChatGPT/Claude/Gemini subscription" is **mostly not legal or safe in 2026**. Inquiso is
ToS-honest: we will not ship a default that risks getting users' accounts banned.

## The reality (researched June 2026)

| Provider | Consumer-subscription OAuth in a 3rd-party app? | Verdict for Inquiso |
| --- | --- | --- |
| **Anthropic (Claude Pro/Max)** | **Explicitly banned.** Anthropic's Feb 2026 policy restricts subscription OAuth to Claude Code & claude.ai; enforced Apr 2026. Using it elsewhere violates Consumer ToS and risks account bans. | **Do not use OAuth.** API key (BYOK) only. |
| **OpenAI (ChatGPT Plus/Pro)** | Subscription and API are separate products. Only the **Codex OAuth** flow charges a subscription from third-party tools; undocumented for general use and could change. | **BYOK by default.** Codex OAuth = opt-in, experimental, clearly risk-flagged. |
| **Google (Gemini)** | No consumer-subscription OAuth. AI Studio issues **API keys** (with a free tier); Vertex AI uses OAuth/service accounts but is enterprise/billing-heavy. | **BYOK (AI Studio key).** Vertex OAuth = advanced opt-in. |
| **Chrome Built-in AI (Gemini Nano)** | N/A — runs **on-device**, no account, no key. | **Default provider.** Free, private, offline. |

> **Decision:** Inquiso uses **BYOK + opt-in OAuth**. Local Chrome AI is the zero-config
> default; cloud providers use the user's own API key; OAuth flows are offered **only where
> the provider officially permits them**, behind an explicit "experimental / use at your own
> risk" toggle with a link to the relevant ToS.

Sources: Anthropic authentication docs & 2026 OAuth-ban coverage; OpenAI ToS / Codex OAuth
discussions; Google AI Studio API-key docs. (Linked from the project wiki.)

## Provider abstraction

All providers sit behind the **Vercel AI SDK**, exposed through one internal interface so the
agent loop is provider-agnostic:

```ts
// conceptual — see src/core/providers/
interface InquisoModel {
  id: string;                 // "chrome-ai", "openai:gpt-x", "anthropic:claude-x", ...
  capabilities: {
    streaming: boolean;
    toolCalls: boolean;
    reasoningStream: boolean; // can we surface "thinking"?
    vision: boolean;
  };
  resolve(): Promise<LanguageModel>; // returns an AI SDK LanguageModel
}
```

- **Chrome AI** goes through `@browser-ai/core`, the community AI SDK provider for the Prompt
  API (Chrome 148+) — same `streamText` path as everything else. We keep only a tiny
  availability preflight (`LanguageModel.availability()`) for download-state UX, which the AI
  SDK has no concept for.
- Cloud adapters are thin wrappers over `@ai-sdk/{openai,anthropic,google}`.
- **Model lists stay current** via the public [models.dev](https://models.dev) catalog:
  fetched in the background, cached 7 days, filtered to tool-capable text models (newest
  first). The built-in per-provider lists are the offline fallback, so the picker is never
  empty and never blocks on the network.
- **Bring any model.** Built-in gateways (OpenRouter, Vercel AI Gateway) and user-added
  OpenAI-compatible providers — gateways, self-hosted endpoints, and local servers (Ollama,
  LM Studio) — all resolve through one `@ai-sdk/openai-compatible` call, differing only by
  `baseURL`. Model ids are free text. Each custom host is reached only after an explicit
  per-host permission grant (**ADR-0002**, docs/05 T5); local (`localhost`) providers need no key.
- **Every provider drives the same tool loop with the same system prompt.** On-device models
  have no native function-calling, but their providers (`@browser-ai/core` for Gemini Nano,
  `@browser-ai/web-llm` for WebLLM) polyfill it via a JSON-schema system prompt — less
  reliably than a cloud model (the loop's tool-call repair and outcome verification absorb
  that), and with no separate reasoning stream. Genuinely unsupported features surface as AI
  SDK provider warnings/errors rather than being silently dropped by Inquiso.

## Authentication flows

### BYOK (default for cloud)
- User pastes an API key in Options. Keys are validated with a cheap test call, then stored
  **encrypted at rest** (WebCrypto AES-GCM) in `chrome.storage.local`.
- Keys are used **only** inside the background worker, sent **only** to that provider's
  official endpoint over HTTPS, and **never** logged, synced, or exposed to content scripts.

### Opt-in OAuth (PKCE)
- For providers that officially support it. **Authorization Code + PKCE**, no client secret
  (extensions can't keep secrets). Redirect via `chrome.identity.launchWebAuthFlow`.
- Tokens stored encrypted; refresh handled in the background; revocation/sign-out clears them.
- Each OAuth provider is behind a feature flag and an explicit risk acknowledgement.

### On-device (no auth)
- Chrome AI requires nothing. We detect availability and, if the model needs downloading,
  surface progress to the user.

## Privacy guarantees

- No Inquiso server exists, so nothing transits Inquiso infrastructure.
- The Options screen states, per provider, exactly where data goes and links each provider's
  data-use policy (notably: Gemini free tier may use data for training; Inquiso warns about
  this and recommends paid tier or Chrome AI for sensitive pages).
