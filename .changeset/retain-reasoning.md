---
"inquiso": patch
---

Keep the reasoning after the answer lands. The reducer discarded the trace on
`done`, so the Thoughts section vanished the moment a response completed. The
reasoning and tool-call trace now stay attached to the completed assistant
turn and render as a collapsed Thoughts above it, so you can reopen the
model's thinking for any answer in the current conversation (not just while
it streams).
