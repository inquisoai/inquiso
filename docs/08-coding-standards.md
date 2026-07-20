# 08 — Coding Standards

These are enforced automatically where possible (Biome, commitlint, CI) so reviews focus on
design, not formatting.

## File & function size

- **≤ 100 lines per file** — a hard rule. Enforced via Biome's `noExcessiveLinesPerFunction`
  / a `max-lines` check in CI. Split by responsibility when approaching the limit.
- Functions stay small and single-purpose; prefer composition over long bodies.
- One primary export per file.

## TypeScript

- `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- No `any` (use `unknown` + narrowing); no non-null `!` without justification.
- Validate all external/boundary data (messages, storage, provider responses) with **Zod**.
- Shared types live in `src/shared`; never duplicate a type across surfaces.

## Style & lint

- **Biome** is the single source of truth for formatting and linting (`pnpm check`).
- No disabled rules without an inline reason comment.
- No `console.log` in committed code (use the scoped logger, stripped in production builds).

## Comments

- Match the density of the surrounding code. Explain **why**, not **what**.
- Public/core APIs get a short TSDoc block; security-relevant code gets a `// SECURITY:` note.
- Comments must not read as AI-generated: no narrating the next line, no restating the diff or
  prompt, no reviewer-directed notes ("added X to fix Y"), no filler ("Note that…", "It's
  important to…"). A comment speaks to the next reader of the code, not to whoever reviews the
  change that introduced it.

## Testing

- New logic ships with **Vitest** unit tests; agent tools and the risk gate require tests.
- User-facing flows get a **Playwright** e2e test where practical.
- CI must be green (lint, typecheck, unit, e2e-smoke, build×targets) before merge.

## Git & commits

- **[Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)**, enforced
  by commitlint. Format: `type(scope): subject`.
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.
  - Example scopes: `agent`, `providers`, `auth`, `cache`, `ui`, `content`, `security`.
  - Examples:
    - `feat(agent): add risk gate for sensitive actions`
    - `fix(cache): evict hot layer on low-memory signal`
    - `docs(providers): clarify Claude OAuth ToS stance`
- **One feature/fix per commit**; keep commits focused and reviewable. Reference issues.
- **Authorship is the human contributor only.** Do **not** add Claude, Copilot, or any AI tool
  as a commit author or `Co-Authored-By`. No AI attribution trailers.
- Branch naming: `type/short-description` (e.g. `feat/agent-risk-gate`).
- PRs use the template, include a Changeset entry, and link the issue.

## Accessibility & i18n

- UI is keyboard-navigable, screen-reader labeled, and respects reduced-motion.
- User-facing strings go through an i18n layer (`_locales`) from day one.

## Performance budget

- Side panel bundle target kept small (code-split heavy/optional paths).
- Stream everything; never block the UI thread on extraction or model calls.
- Respect the memory budget in [Caching & Memory](06-caching-memory.md).

## Open-source hygiene

- MIT license headers are not required per-file, but `LICENSE` is authoritative.
- `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, issue/PR templates, and `CODEOWNERS`
  are kept current.
- Changelog via **Changesets**; semver. No breaking change without a major bump + migration note.
