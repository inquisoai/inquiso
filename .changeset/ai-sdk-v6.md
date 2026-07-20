---
"inquiso": minor
---

Chrome built-in AI now streams through the AI SDK like every other provider.
Upgraded ai v4 → v6 (with @ai-sdk/openai/anthropic/google v3) and adopted
@browser-ai/core, the community AI SDK provider for the Prompt API — deleting
the hand-rolled Chrome AI session/stream adapter and the cloud stream wrapper.
Every request now flows through one streamText path with smoothStream, tools
attached only when the provider supports them; a small availability preflight
remains for on-device download-state UX. Tool definitions and the stream
relay were migrated to the v6 shapes (inputSchema, stopWhen/stepCountIs,
text/input/output part fields).
