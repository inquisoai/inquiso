import { z } from 'zod'

export const MEMORY_KINDS = [
  'preference',
  'fact',
  'site_knowledge',
  'episode',
  'reflection',
  'skill',
] as const
export const MemoryKind = z.enum(MEMORY_KINDS)
export type MemoryKind = z.infer<typeof MemoryKind>

export const SCOPE_LEVELS = [
  'task',
  'tab',
  'origin',
  'site',
  'workspace',
  'user',
  'global',
] as const
export const ScopeLevel = z.enum(SCOPE_LEVELS)
export type ScopeLevel = z.infer<typeof ScopeLevel>

export const SENSITIVITIES = [
  'public',
  'internal',
  'personal',
  'confidential',
  'authentication',
  'financial',
] as const
export const Sensitivity = z.enum(SENSITIVITIES)
export type Sensitivity = z.infer<typeof Sensitivity>

export const MEMORY_SOURCES = [
  'explicit_user',
  'browser_observation',
  'successful_episode',
  'failed_episode',
  'consolidation',
] as const
export const MemorySource = z.enum(MEMORY_SOURCES)
export type MemorySource = z.infer<typeof MemorySource>

export const MEMORY_STATUSES = [
  'candidate',
  'active',
  'quarantined',
  'superseded',
  'expired',
  'deleted',
] as const
export const MemoryStatus = z.enum(MEMORY_STATUSES)
export type MemoryStatus = z.infer<typeof MemoryStatus>
