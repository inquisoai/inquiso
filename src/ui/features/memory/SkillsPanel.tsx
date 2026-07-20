import { skillToAgentSkill } from '@/core/memory/skills/agent-skill'
import type { BrowserSkill } from '@/shared/memory/skill'
import { t } from '@/shared/util/i18n'
import { slugify } from '@/shared/util/slug'

/** Downloads the generated Agent-Skill markdown view of a workflow. */
function exportSkill(skill: BrowserSkill, previous?: BrowserSkill): void {
  const blob = new Blob([skillToAgentSkill(skill, previous)], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slugify(skill.name)}-v${skill.version}.skill.md`
  a.click()
  URL.revokeObjectURL(url)
}

interface Props {
  skills: BrowserSkill[]
  onTrust: (id: string) => void
  onRetire: (id: string) => void
}

const STATE_TONE: Record<string, string> = {
  trusted: 'text-emerald-600',
  verified: 'text-emerald-600',
  shadow: 'text-amber-600',
  draft: 'text-amber-600',
  degraded: 'text-red-600',
  retired: 'text-ink-dim line-through',
}

/** Saved workflows: learned steps, reliability, version chain, and the user
 * controls that gate execution trust (Trust) or end a workflow (Retire). */
export function SkillsPanel({ skills, onTrust, onRetire }: Props) {
  if (skills.length === 0) {
    return (
      <p className="p-2 text-ink-dim text-sm">
        {t('memNoSkills', 'No learned workflows yet. Repeat a successful task to teach one.')}
      </p>
    )
  }
  const action =
    'rounded px-1.5 py-0.5 text-[11px] text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink'
  return (
    <div className="flex flex-col gap-1.5">
      {skills.map((s) => (
        <div key={s.id} className="rounded-lg border border-line bg-surface p-2">
          <p className="text-sm">
            {s.name} <span className="text-ink-dim">v{s.version}</span>{' '}
            <span className={STATE_TONE[s.state] ?? 'text-ink-dim'}>{s.state}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-ink-dim">
            {s.origins.join(', ')} · {s.reliability.successCount}✓ / {s.reliability.failureCount}✕
            {s.previousVersionId ? ` · ${t('memRepaired', 'repaired')}` : ''}
          </p>
          <ul className="mt-1 list-inside list-decimal text-[12px] text-ink-dim">
            {s.steps.map((step) => (
              <li key={step.description}>{step.description}</li>
            ))}
          </ul>
          <div className="mt-1 flex gap-1">
            {s.state !== 'trusted' && s.state !== 'retired' && s.state !== 'degraded' && (
              <button type="button" className={action} onClick={() => onTrust(s.id)}>
                {t('memTrust', 'Trust — run without re-verification')}
              </button>
            )}
            {s.state !== 'retired' && (
              <button type="button" className={action} onClick={() => onRetire(s.id)}>
                {t('memRetire', 'Retire')}
              </button>
            )}
            <button
              type="button"
              className={action}
              onClick={() =>
                exportSkill(
                  s,
                  skills.find((p) => p.id === s.previousVersionId),
                )
              }
            >
              {t('memExportSkill', 'Export .md')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
