import { describe, expect, it } from 'vitest'
import { isVacuousFact } from '@/core/memory/pipeline/fact-filter'

describe('vacuous-fact filter (model extraction guard)', () => {
  it.each([
    'The task was created and completed successfully.',
    'The user’s request was performed without issues.',
    'The run finished and the goal was answered.',
  ])('rejects run narration: %s', (s) => {
    expect(isVacuousFact(s)).toBe(true)
  })

  it.each([
    'Billing is under the Account menu.',
    'The invoice table paginates eight rows at a time.',
    'The Next button loads the following page of recordings without a URL change.',
    'Search lives in the header and filters the list as you type.',
  ])('keeps concrete site knowledge: %s', (s) => {
    expect(isVacuousFact(s)).toBe(false)
  })

  it('rejects statements that name nothing concrete about the site', () => {
    expect(isVacuousFact('Everything worked as expected.')).toBe(true)
    expect(isVacuousFact('This site is nice and fast.')).toBe(true)
  })
})
