import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ALWAYS_ASK, capabilityOf } from '@/core/policy/capabilities'
import { decidePolicy } from '@/core/policy/engine'
import { listGrants, PolicyGrant, removeGrant, setGrant } from '@/core/policy/store'

vi.mock('localforage', async () => (await import('../../helpers/memdb')).localforageMock())

const ORIGIN = 'https://portal.test'
const grant = (capability: PolicyGrant['capability'], decision: 'allow' | 'deny'): PolicyGrant =>
  PolicyGrant.parse({ capability, origin: ORIGIN, decision, createdAt: 1 })

describe('capability mapping', () => {
  it('maps tools to capabilities and unknown tools fail safe', () => {
    expect(capabilityOf('readPage')).toBe('read_page')
    expect(capabilityOf('type')).toBe('fill_form')
    expect(capabilityOf('submitForm')).toBe('submit_form')
    expect(capabilityOf('downloadFile')).toBe('download')
    expect(capabilityOf('someFutureTool')).toBe('unknown')
    expect(ALWAYS_ASK.has(capabilityOf('someFutureTool'))).toBe(true)
  })
})

describe('deterministic policy decisions', () => {
  beforeEach(async () => {
    for (const g of await listGrants()) await removeGrant(g.origin, g.capability)
  })

  it('reads are always allowed; ungoverned writes defer to the risk gate', async () => {
    expect(await decidePolicy({ tool: 'readPage', origin: ORIGIN })).toBe('allow')
    expect(await decidePolicy({ tool: 'click', origin: ORIGIN })).toBe('defer')
  })

  it('an explicit deny wins over everything', async () => {
    await setGrant(grant('download', 'deny'))
    expect(await decidePolicy({ tool: 'downloadFile', origin: ORIGIN })).toBe('deny')
  })

  it('an origin allow skips the prompt for reversible capabilities only', async () => {
    await setGrant(grant('download', 'allow'))
    expect(await decidePolicy({ tool: 'downloadFile', origin: ORIGIN })).toBe('allow')
    // A different origin gets no benefit from the grant.
    expect(await decidePolicy({ tool: 'downloadFile', origin: 'https://other.test' })).toBe('defer')
  })

  it('irreversible capabilities always ask — even with a standing allow', async () => {
    await setGrant(grant('submit_form', 'allow'))
    expect(await decidePolicy({ tool: 'submitForm', origin: ORIGIN })).toBe('ask')
    await setGrant(grant('unknown', 'allow'))
    expect(await decidePolicy({ tool: 'someFutureTool', origin: ORIGIN })).toBe('ask')
  })

  it('an irreversible deny still denies', async () => {
    await setGrant(grant('submit_form', 'deny'))
    expect(await decidePolicy({ tool: 'submitForm', origin: ORIGIN })).toBe('deny')
  })

  it('no origin means no grant applies (defer/ask by capability)', async () => {
    await setGrant(grant('download', 'allow'))
    expect(await decidePolicy({ tool: 'downloadFile' })).toBe('defer')
    expect(await decidePolicy({ tool: 'submitForm' })).toBe('ask')
  })
})
