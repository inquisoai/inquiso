# ADR 0004 — Bring-your-own-cloud backup (not an Inquiso server)

- **Status:** Accepted
- **Date:** 2026-07-08
- **Deciders:** Maintainers

## Context

Users want their chat history to move between browsers, profiles, and machines,
and to be backed up. The hard rules say **serverless & local-first — never
introduce an Inquiso-hosted server, telemetry, or sync.** That rule exists to
protect two things: (1) we never run infrastructure that sees user data, and
(2) no data leaves the device to *us*. A naive "sync" feature would violate both.

But "the user backs their own data up to their own cloud" is a different shape:
the data goes **extension → the user's chosen storage**, and Inquiso never sees
it, stores it, or operates any server. That preserves the intent of the rule
while giving users portability.

## Decision

Ship **opt-in, bring-your-own-cloud backup**, explicitly distinct from an
Inquiso sync service:

1. **File export/import first** (already shipped): the whole conversation store
   serialises to a Zod-validated JSON file the user can move anywhere. Fully
   local, no network. This is the baseline and the payload cloud backup reuses.
2. **Cloud backup to the user's own account**, behind a provider abstraction the
   user picks and connects in Settings. Data flow is direct extension→provider;
   there is no Inquiso backend, relay, or telemetry.
   - **Manual by default**; an opt-in **automatic** mode pushes on a schedule
     (`chrome.alarms`, ~30 min). **Restore is always explicit** — never
     automatic — so a bad remote copy can't silently replace local history.
   - Backup is **push-only** and **import-merges** (each conversation lands with
     a fresh id); it never deletes or overwrites local chats.
3. **Credentials stay in the background, encrypted** (secret store), exactly like
   API keys — never in `storage.sync`, logs, or the UI. Non-secret config
   (mode, provider, endpoint URL) lives in settings.
4. **Adapters are credential-paste, zero OAuth-app registration.** Shipped:
   **WebDAV** (Nextcloud/ownCloud/… — app password) and **GitHub Gist** (a
   personal access token with the `gist` scope; a private gist holds the
   backup). Both need nothing registered by the maintainer and nothing beyond a
   pasted credential from the user.
   - **Google Drive is deliberately excluded**: `drive.appdata` is a Google
     "sensitive" scope requiring an OAuth verification review for anyone but the
     developer — the opposite of low-friction. Dropbox/OneDrive (a one-time app
     registration, no verification) could be added later behind the same
     `SyncProvider` interface if a one-click consumer cloud is wanted.

## Consequences

- ✅ Portability and backup without Inquiso ever running a server or seeing data.
- ✅ Least-surprise: manual default, explicit restore, no destructive overwrite.
- ✅ Extensible: new providers are drop-in adapters.
- ⚠️ **Softens the literal "no sync" wording.** This ADR is the record that the
   trade is *BYO-cloud, not Inquiso-cloud*. The distinction is load-bearing —
   any future change that routes data through infrastructure we operate is out
   of scope and would need its own ADR (and almost certainly a "no").
- ⚠️ New permission: `alarms` (for the auto-backup schedule). No host access at
   install; the backup endpoint's origin is granted per-connect.

## Alternatives rejected

- **An Inquiso-hosted sync service.** Rejected: violates serverless/privacy —
  the whole point of the project.
- **`chrome.storage.sync`.** Rejected: ~100 KB quota, far too small for chat
  history, and ties data to one browser vendor's account.
- **No cloud, export/import only.** Viable and shipped as the baseline, but
  doesn't meet the "keep it backed up / synced across machines" need on its own.
