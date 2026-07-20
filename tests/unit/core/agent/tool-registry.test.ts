import { describe, expect, it } from 'vitest'
import { subagentDefs } from '@/core/agent/subagents/registry'
import { riskOf, toolDefs } from '@/core/agent/tools/registry'

describe('tool registry', () => {
  it('registers the built-in tools with unique names', () => {
    const names = toolDefs.map((d) => d.name)
    expect(new Set(names).size).toBe(names.length) // no dupes
    for (const expected of ['readPage', 'getTabs', 'readTab', 'click', 'navigate', 'submitForm']) {
      expect(names).toContain(expected)
    }
  })

  it('carries risk on each definition (single source of truth)', () => {
    expect(riskOf('readPage')).toBe('none')
    expect(riskOf('getTabs')).toBe('none')
    expect(riskOf('click')).toBe('medium')
    expect(riskOf('navigate')).toBe('medium')
    expect(riskOf('submitForm')).toBe('high')
    expect(riskOf('exportData')).toBe('high') // writes a file to disk
    expect(riskOf('unknown-tool')).toBe('high') // safe default
  })

  it('every tool has a description and a schema', () => {
    for (const d of toolDefs) {
      expect(d.description.length).toBeGreaterThan(0)
      expect(d.inputSchema).toBeDefined()
    }
  })
})

describe('subagent registry', () => {
  it('registers subagents that only reference real, read-only tools', () => {
    const names = new Set(toolDefs.map((d) => d.name))
    for (const sub of subagentDefs) {
      expect(sub.toolNames.length).toBeGreaterThan(0)
      for (const t of sub.toolNames) {
        expect(names.has(t)).toBe(true)
        expect(riskOf(t)).toBe('none')
      }
    }
  })
})
