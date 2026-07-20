import { describe, expect, it } from 'vitest'
import { McpServer, mcpId, mcpTokenKey } from '@/shared/mcp'

describe('mcp config', () => {
  it('slugifies a label into a stable id', () => {
    expect(mcpId('GitHub MCP!')).toBe('github-mcp')
    expect(mcpId('   ')).toBe('mcp')
  })

  it('namespaces the token key under mcp:', () => {
    expect(mcpTokenKey('github-mcp')).toBe('mcp:github-mcp')
  })

  it('validates server metadata and rejects bad URLs', () => {
    expect(
      McpServer.safeParse({ id: 'x', label: 'X', url: 'https://mcp.example.com', auth: true })
        .success,
    ).toBe(true)
    expect(
      McpServer.safeParse({ id: 'x', label: 'X', url: 'not-a-url', auth: false }).success,
    ).toBe(false)
  })
})
