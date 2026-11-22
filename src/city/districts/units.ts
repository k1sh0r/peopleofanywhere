import type { SignSpec } from '../render/textures'

// Units and shapes every district shares: lot height, floor height, the district square,
// collision boxes and the specs the kit builds from. A district's own placements live in its layout.ts.

export const BASE = 0.15 // sidewalk / lot height
export const FH = 3.2 // floor height
export { BOUNDS } from '@shared/net/config'

export type AABB = { min: [number, number, number]; max: [number, number, number] }

export type ShopSpec = {
  x: number
  floors: number
  wall: string
  sign: SignSpec
  shutter: 'open' | 'half' | 'closed'
  goods: string[]
  balcony: boolean
  seed: number
}

export type BuildingSpec = {
  x: number
  z: number
  rot: number
  w: number
  d: number
  floors: number
  wall: string
  trim?: string
  accent?: string
  stilt?: boolean
  balconies?: 'alt' | 'all' | 'none'
  tanks?: number
  mumty?: boolean
  seed: number
}

export type TreeSpec = { x: number; z: number; s: number; seed: number; kind: 'rain' | 'gulmohar' }

/** The portal ring's two side pillars block; walk through the middle. */
export function portalColliders(px: number, pz: number, face: number): AABB[] {
  const ax = Math.abs(Math.sin(face)) > 0.5 // ring faces ±X → pillars spread along Z
  const out: AABB[] = []
  for (const s of [-1, 1]) {
    const cx = px + (ax ? 0 : s * 2.45)
    const cz = pz + (ax ? s * 2.45 : 0)
    out.push({ min: [cx - 0.5, 0, cz - 0.5], max: [cx + 0.5, 6, cz + 0.5] })
  }
  return out
}
