---
"inquiso": minor
---

Show real model reasoning in the Thoughts trace. Previously "Thinking…" was
only a loading label and the trace stayed empty, because we never asked models
to emit reasoning. streamText now passes per-provider reasoning options
(Anthropic thinking, OpenAI reasoningEffort/summary, Google thinkingConfig)
when the provider supports it, so the reasoning stream flows into the Thoughts
section. Gated by a new `reasoning` capability flag (Chrome AI and WebLLM
excluded) and a settings toggle — on by default, switchable off since
reasoning costs extra tokens. Reasoning effort/budget are kept modest.
