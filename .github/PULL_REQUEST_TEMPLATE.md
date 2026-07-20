<!-- Thanks for contributing to Inquiso! Keep PRs focused: one feature/fix. -->

## What & why

<!-- Describe the change and link the issue: Closes #123 -->

## Checklist

- [ ] Commits follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- [ ] No file exceeds 100 lines (`pnpm lines`)
- [ ] `pnpm check && pnpm typecheck && pnpm test && pnpm build` pass locally
- [ ] Added a Changeset (`pnpm changeset`) if user-facing
- [ ] No AI tool added as commit author / `Co-Authored-By`
- [ ] No secrets logged or exposed to content scripts; permissions stay least-privilege

## Security impact

<!-- If this touches auth, the agent tool surface, permissions, CSP, or data flow,
     describe the threat considerations. Otherwise write "none". -->
