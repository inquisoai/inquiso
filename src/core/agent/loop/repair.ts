import {
  generateText,
  type LanguageModel,
  NoSuchToolError,
  Output,
  type ToolCallRepairFunction,
  type ToolSet,
} from 'ai'

/**
 * Recovers from a malformed tool call instead of failing the step. Weak or
 * on-device models (Chrome AI, some OpenAI-compatible) often emit arguments
 * that miss the schema; here we re-ask the same model for corrected arguments
 * that satisfy the tool's schema. An unknown tool can't be repaired (null).
 * Returns null on any failure so the SDK surfaces the original error cleanly.
 */
export function makeRepair(model: LanguageModel): ToolCallRepairFunction<ToolSet> {
  return async ({ toolCall, tools, error }) => {
    if (NoSuchToolError.isInstance(error)) return null
    const tool = tools[toolCall.toolName]
    if (!tool) return null
    try {
      const { output } = await generateText({
        model,
        // biome-ignore lint/suspicious/noExplicitAny: bridge the tool's FlexibleSchema to Output.
        output: Output.object({ schema: tool.inputSchema as any }),
        prompt: [
          `A call to the "${toolCall.toolName}" tool failed schema validation.`,
          `Arguments: ${JSON.stringify(toolCall.input)}`,
          `Error: ${error.message}`,
          'Return corrected arguments that satisfy the tool schema.',
        ].join('\n'),
      })
      return { ...toolCall, input: JSON.stringify(output) }
    } catch {
      return null
    }
  }
}
