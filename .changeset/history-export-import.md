---
"inquiso": minor
---

Export and import your chat history. From the History menu you can now export
all conversations to a JSON file and import one back — the serverless way to
move chats to another browser, profile, or machine. Import never overwrites
existing chats (each comes in with a fresh id) and the file is Zod-validated, so
a corrupt or foreign file is rejected rather than trusted. No account or Inquiso
backend involved; this is also the payload cloud sync will build on.
