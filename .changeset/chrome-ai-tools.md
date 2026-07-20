---
"inquiso": patch
---

Enable tool-calling for Chrome Built-in AI. Gemini Nano has no native
function-calling, but `@browser-ai/core` polyfills it via a JSON-schema system
prompt, so Chrome AI now drives the same page-tool loop as the cloud providers
(read/query/act) and its tool calls surface in the Thoughts trace — previously
the `toolCalls: false` flag left it as plain chat with an empty trace. Nano
emits no separate reasoning stream, and emulated tool-calling on a small
on-device model is less reliable than cloud models.
