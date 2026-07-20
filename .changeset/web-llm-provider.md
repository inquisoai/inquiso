---
"inquiso": minor
---

Add In-browser (WebLLM) as a second on-device provider — so Chrome isn't
limited to the single native Gemini Nano model. WebLLM runs open models
(Llama 3.2, Qwen 2.5, Phi 3.5, Gemma 2) fully in the browser via WebGPU
through the same AI SDK path — no key, no server, weights downloaded once
from a public CDN. A WebGPU preflight gates availability, and `script-src`
gains `'wasm-unsafe-eval'` for the runtime.

The multi-MB WebLLM runtime is lazy-loaded: the background service worker is
now an ES module, so the runtime is emitted as a split chunk that loads only
when a WebLLM model is selected — the background bundle stays ~670KB and
startup is unaffected for everyone else.
