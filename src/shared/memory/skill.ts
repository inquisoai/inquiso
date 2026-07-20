import { z } from 'zod'
import { ElementLocator } from './locator'

/** Lifecycle: learned skills start in draft/shadow and must *earn* execution
 * trust through verified successes; failures degrade, repair re-versions. */
export const SKILL_STATES = [
  'draft',
  'shadow',
  'verified',
  'trusted',
  'degraded',
  'retired',
] as const
export const SkillState = z.enum(SKILL_STATES)
export type SkillState = z.infer<typeof SkillState>

export const SkillStep = z.object({
  action: z.enum(['navigate', 'click', 'type', 'selectOption', 'submitForm', 'waitFor']),
  /** Normalized semantic step, e.g. `Fill the report-name field with {{reportName}}`. */
  description: z.string().max(300),
  locator: ElementLocator.optional(),
  /** navigate target; may contain `{{input}}` placeholders. */
  url: z.string().optional(),
  /** type/selectOption value; variable values are `{{input}}` placeholders. */
  value: z.string().optional(),
})
export type SkillStep = z.infer<typeof SkillStep>

export const SkillInput = z.object({
  name: z.string().max(60),
  description: z.string().max(200),
})

export const SkillReliability = z.object({
  successCount: z.number().int().default(0),
  failureCount: z.number().int().default(0),
  consecutiveFailures: z.number().int().default(0),
  lastVerifiedAt: z.number().optional(),
  lastFailureAt: z.number().optional(),
})
export type SkillReliability = z.infer<typeof SkillReliability>

/** A learned, versioned, executable browser workflow. Data, not code: steps
 * carry semantic locators and typed parameters; execution still routes every
 * action through the risk gate — a trusted skill never bypasses confirmation. */
export const BrowserSkill = z.object({
  id: z.string(),
  name: z.string().max(120),
  description: z.string().max(500),
  version: z.number().int().positive(),
  origins: z.array(z.string()).min(1),
  urlPatterns: z.array(z.string()).default([]),
  /** Lexical trigger — matched against the task goal at retrieval time. */
  goalPattern: z.string().max(300),
  preconditions: z.array(z.string()).default([]),
  inputs: z.array(SkillInput).default([]),
  steps: z.array(SkillStep).min(1),
  successCriteria: z.array(z.string()).default([]),
  /** Capabilities the steps exercise (policy engine requirements). */
  capabilities: z.array(z.string()).default([]),
  state: SkillState,
  reliability: SkillReliability,
  learnedFrom: z.object({
    runIds: z.array(z.string()).default([]),
    episodeIds: z.array(z.string()).default([]),
  }),
  /** Chain to the version this one replaced (repair history). */
  previousVersionId: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})
export type BrowserSkill = z.infer<typeof BrowserSkill>

/** States whose steps may be offered for direct execution via run_skill. */
export const EXECUTABLE_STATES: readonly SkillState[] = ['verified', 'trusted']

/** States surfaced to the planner as suggestions (shadow = advisory only). */
export const SUGGESTIBLE_STATES: readonly SkillState[] = ['shadow', 'verified', 'trusted']
