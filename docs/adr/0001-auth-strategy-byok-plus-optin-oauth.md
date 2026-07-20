# ADR 0001 — Authentication: BYOK + opt-in OAuth (no subscription-OAuth default)

- **Status:** Accepted
- **Date:** 2026-06-22
- **Deciders:** Maintainers

## Context

Inquiso's premise is to let users query pages with "their existing ChatGPT/Claude/Gemini." A
naive reading is "log in with the subscription and use it." Research (June 2026) shows this is
largely not permitted:

- **Anthropic** explicitly bans third-party subscription OAuth (enforced Apr 2026); use risks
  account bans.
- **OpenAI** keeps subscription and API separate; only Codex OAuth charges a subscription from
  third-party tools, and it's undocumented/unstable for general use.
- **Google** offers no consumer-subscription OAuth; AI Studio issues API keys (free tier);
  Vertex uses OAuth but is enterprise-oriented.
- **Chrome Built-in AI** (Gemini Nano) runs on-device with no account or key.

## Decision

Adopt **BYOK + opt-in OAuth**:

1. **Default provider = Chrome Built-in AI** (free, private, zero-config).
2. **Cloud providers = user's own API key (BYOK)**, encrypted at rest, used only in the
   background worker, sent only to the official endpoint.
3. **OAuth flows are opt-in, experimental, and offered only where the provider officially
   permits them** (e.g. OpenAI Codex), behind a risk acknowledgement linking the provider ToS.
4. **No subscription-OAuth that violates a provider's terms** ships as a feature or default.

## Consequences

- ✅ ToS-compliant; no account-ban risk imposed on users by default.
- ✅ Serverless and private; aligns with project principles.
- ✅ Provider-agnostic via the Vercel AI SDK; easy to add providers.
- ⚠️ Users must obtain an API key for cloud models (mitigated by the free Chrome AI default).
- ⚠️ OAuth surfaces may break when providers change policy; isolated behind flags so removal is
  low-impact.

## Alternatives rejected

- **Subscription-OAuth-first** — rejected: ToS violations, ban risk, fragility.
- **Hosted proxy/relay** — rejected: violates serverless/local-first/privacy principles and
  shifts liability/cost to a backend we refuse to run.
