import { describe, expect, it } from 'vitest'
import { ROOM_DISTRICTS } from '../../../shared/net/config'
import { DEFAULT_DISTRICT, DISTRICTS, crossOverTo, districtInfo, districtOfLocation, homeDistrict, placeKind } from './registry'

describe('district registry', () => {
  it('has unique ids and names', () => {
    expect(new Set(DISTRICTS.map((d) => d.id)).size).toBe(DISTRICTS.length)
    expect(new Set(DISTRICTS.map((d) => d.name.toLowerCase())).size).toBe(DISTRICTS.length)
  })

  it('defaults to a built district, which is also the room server fallback', () => {
    expect(districtInfo(DEFAULT_DISTRICT).built).toBe(true)
    expect(ROOM_DISTRICTS[0]).toBe(DEFAULT_DISTRICT)
  })

  it('gives every built district a live room (shared/net/config.ts ROOM_DISTRICTS)', () => {
    for (const d of DISTRICTS.filter((d) => d.built)) expect(ROOM_DISTRICTS).toContain(d.id)
  })

  it('offers the Shore first in onboarding, then the built and top-four districts only', () => {
    expect(DISTRICTS.filter((d) => d.onboarding).map((d) => d.id)).toEqual(['shore', 'quarter', 'makers', 'techpark', 'coast', 'business'])
  })

  it('matches district names and areas, any case', () => {
    expect(districtOfLocation('makers row').id).toBe('makers')
    expect(districtOfLocation(' Studio Lane ').id).toBe('quarter')
    expect(districtOfLocation('the beach').id).toBe('shore')
    expect(districtOfLocation('Second Avenue').id).toBe('makers')
    expect(districtOfLocation('Somewhere else').id).toBe(DEFAULT_DISTRICT)
    expect(districtOfLocation('@Lisbon').id).toBe(DEFAULT_DISTRICT)
  })

  it('counts only exact district names as districts in onboarding', () => {
    expect(placeKind('Tech Park')).toBe('district')
    expect(placeKind('Studio Lane')).toBe('area')
    expect(placeKind('@Lisbon')).toBe('city')
  })

  it('lets people from unbuilt districts visit the default district', () => {
    expect(homeDistrict('Makers Row')).toBe('makers')
    expect(homeDistrict('Lakeside')).toBe(DEFAULT_DISTRICT)
    expect(homeDistrict('Tech Park')).toBe(districtInfo('techpark').built ? 'techpark' : DEFAULT_DISTRICT)
  })

  it('sends CROSS OVER to another built district', () => {
    for (const d of DISTRICTS.filter((d) => d.built)) {
      const to = crossOverTo(d.id)
      expect(to.built).toBe(true)
      expect(to.id).not.toBe(d.id)
    }
  })
})
