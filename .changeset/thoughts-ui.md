---
"inquiso": patch
---

Smoother streaming and a Grok-style Thoughts timeline. Agent text now flows
through the AI SDK's smoothStream transform (word-chunked delivery instead of
provider-sized bursts), plan text streamed before a tool call is folded into
the trace as reasoning rather than polluting the answer or history, and the
live trace renders as a collapsible "Thoughts" section with humanized tool
cards ("Read the page", "Looked for …") — open by default, per the
transparency principle.
