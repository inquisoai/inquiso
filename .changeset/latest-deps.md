---
"inquiso": patch
---

Upgrade all dependencies to latest: zod 4, Biome 2 (config migrated, Tailwind
CSS directives parsing enabled, logger exempted from noConsole), TypeScript 6,
Vitest 4, commitlint 21, lint-staged 17, Readability 0.6, plus patch bumps.
The AI SDK line stays at v6 (latest supported by @browser-ai/core, whose peer
range rejects ai v7 and whose provider spec differs) — bump to v7 when the
browser provider ships support.
