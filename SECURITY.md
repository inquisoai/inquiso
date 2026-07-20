# Security Policy

Inquiso handles API keys, OAuth tokens, page content, and can act on web pages inside your
authenticated sessions. We take security seriously. The full threat model lives in
[docs/05-security.md](docs/05-security.md).

## Supported versions

During pre-1.0 development, only the latest `main` is supported. After 1.0, the latest minor
release receives security fixes.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security problems.**

- Use **GitHub Security Advisories** ("Report a vulnerability") on this repository, or
- Email the maintainers (see repository profile) with details and reproduction steps.

We aim to acknowledge within **72 hours** and to provide a remediation timeline after triage.
Coordinated disclosure is appreciated; we'll credit reporters who wish to be named.

## What to report

- Credential leakage (keys/tokens reaching content scripts, logs, sync storage, URLs, network).
- Prompt-injection bypasses that let a page trigger sensitive actions without confirmation.
- Permission escalation, CSP bypass, or remote-code-execution vectors.
- Cache or storage flaws that expose user data across sites/sessions.

## Our commitments

- No Inquiso server: your data and secrets never transit our infrastructure.
- Least-privilege permissions; encrypted secret storage; locked CSP; small audited tool surface.
- Dependencies pinned via lockfile, scanned (Dependabot / `pnpm audit` / CodeQL) in CI.
- Security-relevant changes get extra review and a threat note in the PR.
