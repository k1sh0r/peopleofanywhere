import { describe, expect, it } from 'vitest'
import { count, firstName, plural, stamp } from './helpers'

describe('connections helpers', () => {
  it('plural picks one vs many', () => {
    expect(plural(1, 'REQUEST', 'REQUESTS')).toBe('1 REQUEST')
    expect(plural(3, 'REQUEST', 'REQUESTS')).toBe('3 REQUESTS')
  })

  it('firstName uppercases the first token', () => {
    expect(firstName('Priya Sharma')).toBe('PRIYA')
  })

  it('count caps at 99+', () => {
    expect(count(12)).toBe('12')
    expect(count(100)).toBe('99+')
  })

  it('stamp returns YESTERDAY for prior calendar day', () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    d.setHours(12, 0, 0, 0)
    expect(stamp(d.toISOString())).toBe('YESTERDAY')
  })
})