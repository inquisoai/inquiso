---
"inquiso": minor
---

Add GitHub Gist as a cloud-backup provider — zero setup for the project (no
OAuth app, no verification) and easy for users: paste a personal access token
with the `gist` scope and a private gist holds your backup. The Backup tab now
has a provider picker (GitHub Gist or WebDAV), both credential-paste. Google
Drive is intentionally not included (its `drive.appdata` scope needs an OAuth
verification review). See docs/adr/0004.
