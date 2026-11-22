import { describe, expect, it } from 'vitest'
import type { Profile } from './profiles'
import { hasJoined, residentsToShow, siteKey, xHandle } from './residents'

const person = (over: Partial<Profile>): Profile => ({
  id: 'x',
  name: 'SOMEONE',
  role: 'Developer',
  company: '',
  location: 'Design Quarter',
  openToWork: false,
  skills: [],
  links: {},
  character: 'developer',
  ...over,
})

const kavya = person({ id: 'resident-kavya', name: 'KAVYA R', links: { x: 'https://x.com/kavyar' } })
const mani = person({ id: 'resident-mani', name: 'MANI G' })

describe('xHandle', () => {
  it('reads a handle however it was typed', () => {
    expect(xHandle('https://x.com/Kavyar/')).toBe('kavyar')
    expect(xHandle('twitter.com/kavyar?s=20')).toBe('kavyar')
    expect(xHandle('@KavyaR')).toBe('kavyar')
    expect(xHandle(' kavyar ')).toBe('kavyar')
    expect(xHandle(undefined)).toBe('')
  })
})

describe('siteKey', () => {
  it('ignores protocol, www, query and trailing slash', () => {
    expect(siteKey('https://www.Nila.design/')).toBe('nila.design')
    expect(siteKey('nila.design?ref=x')).toBe('nila.design')
    expect(siteKey('https://github.com/example-dev/')).toBe('github.com/example-dev')
    expect(siteKey(undefined)).toBe('')
  })
})

describe('hasJoined', () => {
  it('matches the same site under a shorter name and no X handle', () => {
    const nila = person({ id: 'resident-nila', name: 'NILA SURESH', links: { portfolio: 'https://nila.design', x: 'https://x.com/nilasuresh' } })
    expect(hasJoined(nila, [person({ id: 'u1', name: 'ARUN', links: { portfolio: 'https://nila.design/' } })])).toBe(true)
    expect(hasJoined(nila, [person({ id: 'u1', name: 'ARUN', links: { portfolio: 'https://nila.dev' } })])).toBe(false)
  })
  it('is false while nobody matches', () => {
    expect(hasJoined(kavya, [])).toBe(false)
    expect(hasJoined(kavya, [person({ id: 'u1', name: 'PRIYA', links: { x: '@priya' } })])).toBe(false)
  })
  it('matches the same X handle under a different name', () => {
    expect(hasJoined(kavya, [person({ id: 'u1', name: 'KAVYA', links: { x: '@kavyar' } })])).toBe(true)
  })
  it('matches the same name, ignoring case and spacing', () => {
    expect(hasJoined(mani, [person({ id: 'u1', name: 'Mani  G' })])).toBe(true)
  })
  it('two people without an X handle are not the same person', () => {
    expect(hasJoined(mani, [person({ id: 'u1', name: 'ARUN' })])).toBe(false)
  })
})

describe('residentsToShow', () => {
  it('drops the ones who joined and marks the rest as residents', () => {
    const shown = residentsToShow([kavya, mani], [person({ id: 'u1', name: 'Kavya R' })])
    expect(shown.map((p) => p.id)).toEqual(['resident-mani'])
    expect(shown[0].resident).toBe(true)
    expect(shown[0].sample).toBeUndefined()
  })
})
