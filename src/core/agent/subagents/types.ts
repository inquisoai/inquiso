/** A specialist the main agent can delegate to. Exposed to the model as a
 * single tool (`ask_<id>`): calling it runs a focused, nested model turn with
 * this system prompt and only the listed tools, returning the result text.
 * Declarative — add one to the registry and it's available; no wiring. */
export interface SubagentDef {
  /** Slug used for the tool name `ask_<id>` (e.g. 'researcher'). */
  id: string
  /** Shown to the parent model as the delegation tool's description. */
  description: string
  /** The subagent's own system prompt. */
  system: string
  /** Names of registry tools this subagent may use (read-only by convention).
   * Cannot include other subagents — delegation is one level deep. */
  toolNames: string[]
}
