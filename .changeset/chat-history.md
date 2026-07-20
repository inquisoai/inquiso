---
"inquiso": minor
---

Conversation history and sessions, like every chat app. Turns are persisted
per conversation in IndexedDB (local only, Zod-validated on read, real
deletes, LRU retention cap — docs/06), the model now sees prior turns of the
conversation (recency-trimmed so history never crowds out page context), and
the side panel gains a transcript with chat bubbles plus "New chat" and a
History menu to reopen or delete stored conversations. Aborted partial
answers are kept, so what the user saw is what the model remembers.
