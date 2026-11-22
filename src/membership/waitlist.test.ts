import { describe, expect, it } from 'vitest'
import { normalizeEmail, pauseBypassed, waitlistSource } from './waitlist'

describe('normalizeEmail', () => {
  it('trims and lower-cases, so one person is one row', () => {
    expect(normalizeEmail('  Priya@Studio.COM ')).toBe('priya@studio.com')
  })

  it('refuses what cannot be an email', () => {
    for (const bad of ['', 'priya', 'priya@', '@studio.com', 'priya@studio', 'pr iya@studio.com', 42, null, undefined]) {
      expect(normalizeEmail(bad)).toBeNull()
    }
  })

  it('refuses addresses longer than 254 characters', () => {
    expect(normalizeEmail(`${'a'.repeat(250)}@b.co`)).toBeNull()
  })
})

describe('waitlistSource', () => {
  it('keeps the known sources and treats anything else as a guest', () => {
    expect(waitlistSource('member')).toBe('member')
    expect(waitlistSource('invite')).toBe('invite')
    expect(waitlistSource('admin')).toBe('guest')
    expect(waitlistSource(undefined)).toBe('guest')
  })
})

describe('pauseBypassed', () => {
  it('lets ?unpause in off production only', () => {
    expect(pauseBypassed('?unpause', false)).toBe(true)
    expect(pauseBypassed('?time=19:30&unpause', false)).toBe(true)
    expect(pauseBypassed('?unpause', true)).toBe(false)
    expect(pauseBypassed('', false)).toBe(false)
  })
})