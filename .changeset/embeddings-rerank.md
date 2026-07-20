---
"inquiso": minor
---

Cached semantic reranking for multi-tab context. Adds an embedder-agnostic
interface with a cloud embedder (OpenAI/Google via the AI SDK) and a
localForage-backed vector cache (keyed by model + content hash, LRU-capped), so
each page is embedded once. Multi-page scopes are now ordered by cosine
similarity to the question, falling back to lexical ranking when no embedding
key is available. On-device (Transformers.js) and Chrome's built-in Embedding
API can implement the same interface later.
