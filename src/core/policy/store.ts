import { z } from 'zod'
import { appStore } from '@/core/data/storage/instance'
import { CAPABILITIES } from './capabilities'

/** A persistent, origin-scoped capability rule the *user* created. Grants are
 * never created by the model, page content, or memory — only through the
 * extension UI (docs/memory-agent §3.2: memory never authorizes). */
export const PolicyGrant = z.object({
  capability: z.enum(CAPABILITIES),
  origin: z.string(),
  decision: z.enum(['allow', 'deny']),
  createdAt: z.number(),
})
export type PolicyGrant = z.infer<typeof PolicyGrant>

const store = appStore('policies')
const key = (origin: string, capability: string): string => `${origin}|${capability}`

export async function setGrant(grant: PolicyGrant): Promise<void> {
  await store.setItem(key(grant.origin, grant.capability), grant)
}

export async function getGrant(origin: string, capability: string): Promise<PolicyGrant | null> {
  const parsed = PolicyGrant.safeParse(await store.getItem(key(origin, capability)))
  return parsed.success ? parsed.data : null
}

export async function removeGrant(origin: string, capability: string): Promise<void> {
  await store.removeItem(key(origin, capability))
}

export async function listGrants(): Promise<PolicyGrant[]> {
  const all: PolicyGrant[] = []
  await store.iterate((value) => {
    const parsed = PolicyGrant.safeParse(value)
    if (parsed.success) all.push(parsed.data)
  })
  return all.sort((a, b) => b.createdAt - a.createdAt)
}
