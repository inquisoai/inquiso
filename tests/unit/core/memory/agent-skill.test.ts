import { describe, expect, it } from 'vitest'
import { skillToAgentSkill } from '@/core/memory/skills/agent-skill'
import { testSkill } from '../../helpers/skill-fixtures'

describe('BrowserSkill → Agent Skill markdown adapter', () => {
  it('renders frontmatter, reliability, steps, and the source-of-truth notice', () => {
    const md = skillToAgentSkill(testSkill({ id: 'skill_x' }))
    expect(md).toContain('name: download-newest-invoice')
    expect(md).toContain('# Download newest invoice (v1)')
    expect(md).toContain('State: **shadow** — 0✓ / 0✕')
    expect(md).toContain('Origins: https://portal.test')
    expect(md).toContain('1. Navigate to https://portal.test/billing')
    expect(md).toContain('2. Click the "Download" button')
    expect(md).toContain('Goal pattern: "download the newest invoice"')
    expect(md).toContain('BrowserSkill `skill_x`')
    expect(md).toContain('never written back')
  })

  it('shows the repair diff against the previous version', () => {
    const old = testSkill({
      id: 'skill_old',
      steps: [
        {
          action: 'click',
          description: 'Click the "Settings" link',
          locator: { accessibleName: 'Settings', semanticDescription: 'the "Settings" link' },
        },
      ],
    })
    const next = testSkill({ id: 'skill_new', version: 2, previousVersionId: 'skill_old' })
    const md = skillToAgentSkill(next, old)
    expect(md).toContain('## Changes in this version')
    expect(md).toContain('+ Navigate to https://portal.test/billing')
    expect(md).toContain('- Click the "Settings" link')
  })

  it('omits empty sections instead of rendering headers with nothing under them', () => {
    const md = skillToAgentSkill(testSkill({ successCriteria: [], preconditions: [], inputs: [] }))
    expect(md).not.toContain('## Success criteria')
    expect(md).not.toContain('## Preconditions')
    expect(md).not.toContain('## Inputs')
  })
})
