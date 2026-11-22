import { describe, expect, it } from 'vitest'
import { matches, pasted, safeUrl } from './helpers'
import type { App } from './types'

const app = (over: Partial<App> = {}): App => ({
  id: '00000000-0000-4000-8000-000000000001',
  user_id: 'u1',
  email: 'anya@studio.com',
  why: 'Because',
  profile: { name: 'Ananya Rao', role: 'Designer', company: 'Acme', location: 'Design Quarter' },
  status: 'under_review',
  payment_id: null,
  amount: null,
  currency: null,
  reason: null,
  paid_at: null,
  decided_at: null,
  created_at: '2026-01-01T00:00:00Z',
  ...over,
})

describe('admin search helpers', () => {
  it('safeUrl allows http(s) only', () => {
    expect(safeUrl('https://example.com/x')).toBe('https://example.com/x')
    expect(safeUrl('javascript:alert(1)')).toBeNull()
  })

  it('pasted treats one email as a list', () => {
    expect(pasted('anya@studio.com').listed).toEqual(['anya@studio.com'])
  })

  it('matches finds by email token', () => {
    expect(matches(app(), 'anya')).toBe(true)
    expect(matches(app(), 'nope')).toBe(false)
  })
})