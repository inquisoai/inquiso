---
"inquiso": patch
---

Fix the cramped dropdown arrow. Native `<select>` pins the browser's arrow hard
against the edge (padding-right only spaces the text, not the arrow), so every
dropdown looked tight. New shared `Select` component uses `appearance-none` plus
our own chevron with real spacing, applied to all dropdowns (autonomy, model,
backup mode/provider) for a consistent look.
