---
"inquiso": patch
---

Fix: the model couldn't "see" an attached image on later turns — it received
the filename as text instead. Two causes, both fixed: (1) an attachment-only
message was persisted with the filename as its text content (so history fed the
model "photo.jpg"); now the real text is stored (empty for attachment-only) and
the filename is used only as the conversation title. (2) history was text-only;
now prior turns' images are re-attached from the on-device blob store when
building the model context, so follow-up questions about an image work. This
also stops the filename showing as a text bubble when reopening a chat.
