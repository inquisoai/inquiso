# Installed AI SDK Version Audit

Audited 2026-07-12 against `node_modules` (authoritative), commit `18777c2`.

## Versions

| Package | Version | State |
| --- | --- | --- |
| `ai` | **6.0.219** | current v6 stable line; ships `docs/`, `src/`, `test` export |
| `@ai-sdk/openai` | 3.0.80 | in use |
| `@ai-sdk/anthropic` | 3.0.93 | in use |
| `@ai-sdk/google` | 3.0.88 | in use |
| `@ai-sdk/openai-compatible` | 2.0.57 | in use — **Qwen/DashScope**, OpenRouter, Vercel gateway, custom endpoints |
| `@ai-sdk/mcp` | 2.0.8 | in use (MCP tools) |
| `@ai-sdk/react` | **not installed** | side panel uses a custom port protocol (see react-tool-flow.md) |
| `@ai-sdk/devtools` | **not installed** | candidate dev dependency |
| `@browser-ai/core` / `@browser-ai/web-llm` | 2.1.13 / 2.1.8 | third-party AI SDK providers for Chrome AI / WebLLM |

No version mismatches: all `@ai-sdk/*` packages resolve a single version each in `pnpm-lock.yaml`;
peer ranges satisfied. No workspace sub-manifests (single package).

## Migration residue check

- **No v4/v5 residue**: no `maxSteps`, `experimental_output`-style options in our code
  (`output`/`Output.object` used), tool inputs use v6 `inputSchema`/`input` naming.
- **v7 readiness notes** (from the bundled migration skill, informational only —
  no upgrade planned during this effort): `system` → `instructions` (our main loop already
  uses agent `instructions`; `subagents/registry.ts` and `pipeline/extract.ts` still pass
  `system`/plain prompts to `generateText` — a rename-level change), `stepCountIs` →
  `isStepCount`, telemetry moves to `@ai-sdk/otel`.
- Deprecated warnings in build output come from Vite/rolldown, not the AI SDK.

## Tooling

- Official coding skill installed: `npx skills add vercel/ai` → `.agents/skills/ai-sdk/`
  (+ v6→v7 migration skill). Untracked by design (`.gitignore`: `.agents/`,
  `skills-lock.json`); nothing user-specific committed.
- Test utilities available at `ai/test`: `MockLanguageModelV*`, `MockEmbeddingModelV*`,
  `MockRerankingModelV*`, `MockProviderV*`, `mockValues`, `simulateReadableStream`.

## Verdict

```text
AI SDK version health: HEALTHY
```

Current stable v6 line, consistent tree, no deprecated usage in our code, bundled docs/src
available for offline verification. v7 exists upstream but migrating mid-effort would be
churn without need; the residue notes above are the complete v7 exposure.
