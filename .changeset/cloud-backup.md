---
"inquiso": minor
---

Cloud backup to your own storage (bring-your-own-cloud). A new Backup tab in
Settings lets you connect a provider and choose manual or automatic backup
(default manual); automatic pushes on a schedule, restore is always explicit.
Backup is push-only and import-merges (never overwrites local chats). The first
adapter is WebDAV (Nextcloud/ownCloud — no OAuth app needed); the provider
abstraction lets Google Drive/Dropbox slot in next. Credentials are stored
encrypted in the background, never synced or shown; there is no Inquiso
server — data goes straight to your storage (docs/adr/0004). Adds the `alarms`
permission for the auto-backup schedule.
