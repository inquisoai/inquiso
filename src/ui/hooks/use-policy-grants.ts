import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PolicyGrant } from '@/core/policy/store'
import { sendToBackground } from '@/ui/lib/messaging'

/** Standing capability rules, cached under the ['policy'] prefix. Removal
 * invalidates the prefix so every consumer refetches. */
export function usePolicyGrants() {
  const client = useQueryClient()
  const { data: grants = [] } = useQuery({
    queryKey: ['policy', 'grants'],
    queryFn: () => sendToBackground<PolicyGrant[]>({ type: 'policyList' }),
  })
  const { mutateAsync } = useMutation({
    mutationFn: (g: PolicyGrant) =>
      sendToBackground({ type: 'policyRemove', origin: g.origin, capability: g.capability }),
    onSettled: () => client.invalidateQueries({ queryKey: ['policy'] }),
  })
  const remove = async (g: PolicyGrant): Promise<void> => {
    await mutateAsync(g)
  }
  return { grants, remove }
}
