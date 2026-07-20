---
"inquiso": minor
---

Attachments now persist on-device, so past chats show their files. Previously an
attachment vanished on reload (only its filename survived); now the file is
stored as a Blob in a dedicated IndexedDB store, referenced by id from the turn,
and its preview reappears when you reopen the conversation. Bytes are stored raw
(not base64), rendered via object URLs (revoked to avoid leaks), and
garbage-collected when their conversation is deleted; a "Clear stored
attachments" control wipes them. Still fully local — nothing is uploaded to
Inquiso or synced (attachments aren't in export/cloud backup for now). Adds the
`unlimitedStorage` permission. Reverses the old never-persisted rule; see
docs/adr/0005.
