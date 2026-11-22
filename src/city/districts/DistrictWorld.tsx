'use client'

import type { ComponentType } from 'react'
import { useGame } from '../core/store'
import { World as QuarterWorld } from './quarter/World'
import { MakersWorld } from './makers/World'
import { ShoreWorld } from './shore/World'
import { DEFAULT_DISTRICT, type DistrictId } from './registry'

/** The scene of every built district. A new district adds its World here. */
const WORLDS: Partial<Record<DistrictId, ComponentType>> = {
  shore: ShoreWorld,
  quarter: QuarterWorld,
  makers: MakersWorld,
}

/** Only the active district is mounted — travelling unmounts the old one. */
export function DistrictWorld() {
  const district = useGame((s) => s.district)
  const id = WORLDS[district] ? district : DEFAULT_DISTRICT
  const World = WORLDS[id]!
  return <World key={id} />
}
