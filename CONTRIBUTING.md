# Contributing to Inquiso

Thanks for helping build a transparent, privacy-respecting AI browser agent! Please read the
[design docs](docs/) before your first code contribution — especially
[Architecture](docs/01-architecture.md), [Security](docs/05-security.md), and
[Coding Standards](docs/08-coding-standards.md).

## Quick start

```bash
pnpm install
pnpm dev          # loads the extension with HMR (Chrome by default)
pnpm dev:firefox  # Firefox target
pnpm check        # Biome lint + format
pnpm test         # Vitest unit tests
pnpm build        # production build for all targets
```

## Ground rules

- **One feature/fix per PR**, focused and reviewable.
- **Conventional Commits** (`feat(agent): ...`) — enforced by commitlint. See coding standards.
- **≤ 100 lines per file.** Split by responsibility before you hit the limit.
- **TypeScript strict**, no `any`, validate boundaries with Zod.
- **Tests** for new logic; agent tools and the risk gate require tests.
- **No AI authorship.** Do not add Claude, Copilot, or any AI assistant as a commit author or
  `Co-Authored-By` trailer. Commits are attributed to you, the human contributor.
- **Security first.** If your change touches auth, the agent tool surface, permissions, CSP, or
  data flow, call it out in the PR and add a short threat note.

## Workflow

1. Open or claim an issue describing the change.
2. Branch: `type/short-description` (e.g. `feat/agent-risk-gate`).
3. Make the change; keep commits clean and conventional.
4. `pnpm check && pnpm test && pnpm build` locally.
5. Add a Changeset: `pnpm changeset`.
6. Open a PR using the template; link the issue; ensure CI is green.

## Reporting security issues

**Do not** open a public issue for vulnerabilities. Follow [SECURITY.md](SECURITY.md).

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be kind.
