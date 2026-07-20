import type { BrowserSkill } from '@/shared/memory/skill'
import { slugify } from '@/shared/util/slug'
import { repairDiff } from './repair'

const section = (title: string, lines: string[]): string[] =>
  lines.length > 0 ? ['', `## ${title}`, ...lines] : []

/**
 * BrowserSkill → Agent-Skill-style markdown (AI SDK migration plan §8): a
 * generated, model/human-readable view for export, review, and sharing. The
 * typed, evidence-backed BrowserSkill remains the single source of truth —
 * this markdown is never parsed back into a skill.
 */
export function skillToAgentSkill(skill: BrowserSkill, previous?: BrowserSkill | null): string {
  const r = skill.reliability
  const verified = r.lastVerifiedAt ? new Date(r.lastVerifiedAt).toISOString().slice(0, 10) : '—'
  return [
    '---',
    `name: ${slugify(skill.name)}`,
    `description: ${skill.description}`,
    '---',
    '',
    `# ${skill.name} (v${skill.version})`,
    '',
    `State: **${skill.state}** — ${r.successCount}✓ / ${r.failureCount}✕ (last verified ${verified})`,
    `Origins: ${skill.origins.join(', ')}`,
    ...section('When to use', [`Goal pattern: "${skill.goalPattern}"`]),
    ...section(
      'Preconditions',
      skill.preconditions.map((p) => `- ${p}`),
    ),
    ...section(
      'Inputs',
      skill.inputs.map((i) => `- \`${i.name}\` — ${i.description}`),
    ),
    ...section(
      'Steps',
      skill.steps.map((s, n) => `${n + 1}. ${s.description}`),
    ),
    ...section(
      'Success criteria',
      skill.successCriteria.map((c) => `- ${c}`),
    ),
    ...(previous ? section('Changes in this version', repairDiff(previous, skill)) : []),
    '',
    `> Generated from Inquiso BrowserSkill \`${skill.id}\` (typed, versioned, evidence-backed).`,
    '> This markdown is a view, not the source — edits here are never written back.',
    '',
  ].join('\n')
}
