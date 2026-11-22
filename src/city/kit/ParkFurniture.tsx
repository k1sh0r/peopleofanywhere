'use client'

import type { ReactElement } from 'react'
import { PAL } from '@/config/palette'
import { BASE } from '../districts/units'
import { Box } from './primitives'

const RAIL = { c: PAL.RAIL_GREEN, rough: 0.5, metal: 0.25, grade: false }

/** Green-painted municipal railing between concrete posts. */
export function Railing({ from, to }: { from: [number, number]; to: [number, number] }) {
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]
  const len = Math.hypot(dx, dz)
  const ang = Math.atan2(dx, dz)
  const posts = Math.max(1, Math.round(len / 2.6))
  const pickets = Math.floor(len / 0.28)
  const els: ReactElement[] = []
  for (let i = 0; i <= posts; i++) {
    const z = -len / 2 + (i * len) / posts
    els.push(<Box key={`p${i}`} s={[0.26, 1.15, 0.26]} p={[0, 0.575, z]} c={PAL.WALL_WHITE} />)
    els.push(<Box key={`c${i}`} s={[0.32, 0.08, 0.32]} p={[0, 1.19, z]} c={PAL.WALL_WHITE} />)
  }
  for (let i = 0; i < pickets; i++) {
    els.push(<Box key={`k${i}`} s={[0.045, 0.85, 0.045]} p={[0, 0.55, -len / 2 + 0.14 + i * 0.28]} {...RAIL} shadow={false} />)
  }
  els.push(<Box key="t" s={[0.08, 0.08, len]} p={[0, 0.98, 0]} {...RAIL} />)
  els.push(<Box key="b" s={[0.08, 0.08, len]} p={[0, 0.18, 0]} {...RAIL} />)
  return (
    <group position={[(from[0] + to[0]) / 2, BASE, (from[1] + to[1]) / 2]} rotation={[0, ang, 0]}>
      {els}
    </group>
  )
}

export function Bench({ p, rot = 0 }: { p: [number, number]; rot?: number }) {
  return (
    <group position={[p[0], BASE + 0.08, p[1]]} rotation={[0, rot, 0]}>
      {[-0.75, 0.75].map((x) => (
        <Box key={x} s={[0.18, 0.42, 0.5]} p={[x, 0.21, 0]} c={PAL.CONCRETE_AGED} />
      ))}
      <Box s={[2.1, 0.12, 0.6]} p={[0, 0.48, 0]} c="#8F8E8A" rough={0.5} />
    </group>
  )
}
