# ADR 0005 — Persist chat attachments on-device

- **Status:** Accepted
- **Date:** 2026-07-08
- **Deciders:** Maintainers

## Context

Originally, user-attached files were held in memory only for the turn they were
sent with and **never persisted** (recorded in `shared/attachment.ts` and
docs/05). Reopening a past conversation showed only the filename; the preview
and the file itself were gone.

Research into how chat apps handle this was near-unanimous: **every** app —
ChatGPT, Claude, Gemini, Grok, and the local-first open-source ones (Jan,
Chatbox, Open WebUI, LibreChat) — persists attachments and shows them when you
revisit a chat. Crucially, **local-first ≠ non-persistent**: privacy-focused
apps still persist, they just keep the bytes *on the device*. Our
non-persistence was the outlier and surprised users.

## Decision

**Persist attachments on-device, by default**, reversing the never-persisted
rule. Storage/UX follow the researched best practices:

1. **Bytes stored as native `Blob`s**, not base64 — no ~33% inflation, no
   encode/decode through the JS heap.
2. **Dedicated IndexedDB store** (`attachments`), keyed by attachment id.
   Message turns persist only a **reference** (`{ id, name, mediaType }`), so
   reading a conversation stays cheap and doesn't drag megabytes around.
3. **Rendering** resolves each ref to a URL — the live turn's data URL, or an
   **object URL** from the blob on reload (`URL.createObjectURL`, revoked on
   unmount to avoid leaks).
4. **Garbage collection** by reference-count sweep: any blob not referenced by a
   live conversation turn is deleted — run after a conversation delete and on
   startup (localForage has no cross-store transactions).
5. **`unlimitedStorage` permission** so the blob store isn't subject to quota
   eviction (cross-browser); a **"Clear stored attachments"** control lets the
   user wipe it.

## Consequences

- ✅ Attachments (with previews) survive reload and appear in past chats — the
  behaviour users expect from every other chat app.
- ✅ Still **local-first and serverless**: bytes never leave the device except,
  as before, to the AI provider the user chose. Nothing is sent to Inquiso.
- ✅ Cheap history reads (refs, not bytes); efficient blob storage; no leaks.
- ⚠️ **Reverses the "never persisted" wording** in docs/05 — the deliberate
  trade recorded here. Persistence is *on-device*, not a data-egress change.
- ⚠️ New `unlimitedStorage` permission. Attachments now occupy disk until the
  user clears them or deletes the conversations that reference them.
- ⚠️ **Not included in export / cloud backup** for now — those stay small
  text-only JSON (a base64 blob would blow past the ~1 MB gist limit fast).
  Opt-in, size-gated attachment export can come later.

## Alternatives rejected

- **Keep never-persisted.** Rejected: the outlier behaviour; the preview we show
  at send time vanishes on reload, which reads as a bug.
- **Base64 inline in the turn record.** Rejected: 33% larger, bloats every
  history read, and is the documented cost trap.
- **Persist and also sync to cloud by default.** Rejected for now: blobs would
  bloat the backup file and hit provider limits; kept device-only.
