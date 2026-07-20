---
"inquiso": patch
---

Friendlier, typed error messages. Provider/SDK failures are now mapped through
the AI SDK error classes (APICallError, RetryError, NoSuchToolError,
InvalidToolInputError) to short, honest, user-facing text — rejected keys, rate
limits, and server errors read clearly instead of dumping a raw stack. The raw
message is preserved as the fallback so nothing is silently swallowed.
