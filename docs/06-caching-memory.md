# 06 — Caching & Memory Management

Speed is a feature. The cache makes repeat questions and multi-tab context near-instant, while
a memory budget keeps the extension well-behaved inside the browser's limits.

## What we cache

| Item | Key | Store | TTL / policy |
| --- | --- | --- | --- |
| Extracted page content (readable text + DOM/a11y map) | `url + contentHash` | IndexedDB | LRU, invalidated on content hash change |
| HTML→Markdown conversion | `contentHash` | IndexedDB | LRU |
| Embeddings (optional, for multi-tab retrieval) | `chunkHash + modelId` | IndexedDB | LRU |
| Chat history per conversation | `conversationId` | IndexedDB | user-controlled retention |
| In-flight extraction promises | `tabId` | memory (worker) | request de-duplication |
| Provider capability probes | `providerId` | `storage.session` | per session |

- **Content hashing**: extraction is keyed by a hash of the meaningful DOM, so navigation
  within an SPA or a re-visit reuses cache only when content is genuinely unchanged.
- **Stale-while-revalidate**: serve cached content immediately, re-extract in the background if
  the DOM changed, and update the trace if the answer materially shifts.
- **Request coalescing**: concurrent requests for the same tab share one extraction promise.

## Why IndexedDB (not just `storage.local`)

- Large, structured values (page corpora, embeddings) exceed `storage.local` comfort zones.
- IndexedDB gives us indexes, cursors, and quota introspection (`navigator.storage.estimate()`).
- `storage.session` is used for small, ephemeral, sensitive-ish state (never secrets).

## Memory budget & pressure handling

The service worker is ephemeral and the browser caps extension memory. We stay inside a budget:

1. **Budget** — derive a target from `navigator.deviceMemory` (e.g. cap in-memory caches at a
   small fraction; default ceiling like 64–128 MB of decoded content in memory).
2. **Measure** — track approximate bytes per cached entry; periodically read
   `navigator.storage.estimate()` for persistent usage.
3. **Evict** — strict **LRU** eviction when over budget; in-memory layer is small and backed by
   IndexedDB, so eviction just drops the hot copy, not the persisted one.
4. **React to pressure** — on tab close, low-memory signals, or worker suspension, flush the
   in-memory layer; trim IndexedDB to the configured persistent cap.
5. **User control** — Options exposes cache size, "clear cache now," and a per-site opt-out.

```
Hot (memory, small, LRU)  ──miss──▶  Warm (IndexedDB, larger, LRU)  ──miss──▶  Re-extract
        ▲ evict under pressure                ▲ trim to persistent cap
```

## Token-budget management (orthogonal but related)

Multi-tab/window scope can blow past a model's context window. Before a call we:
- Rank chunks by relevance to the query (lexical first; embeddings when enabled).
- Trim to the model's context budget, keeping citations resolvable.
- Prefer Chrome AI's smaller window awareness; degrade gracefully (summarize-then-answer).

## Correctness & privacy of the cache

- Cache is **local only**; never synced, never sent anywhere.
- Secrets are never cached.
- Clearing chat history and "clear cache" are real deletes (IndexedDB record removal), not soft
  hides.
