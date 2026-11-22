'use client'

import { PAL } from '@/config/palette'
import { BASE } from '../districts/units'
import { Box, Cyl } from './primitives'

export const DARK = '#25272C'

// ---------------------------------------------------------------------------
/** Gearless scooter — the vehicle of the city. Local +Z = front. */
export function Scooter({ x, z, rot, color }: { x: number; z: number; rot: number; color: string }) {
  const body = { c: color, rough: 0.35, metal: 0.15, grade: false }
  return (
    <group position={[x, BASE, z]} rotation={[0, rot, 0]}>
      {[0.62, -0.58].map((wz) => (
        <group key={wz}>
          <Cyl rt={0.25} h={0.11} p={[0, 0.25, wz]} r={[0, 0, Math.PI / 2]} c={DARK} rough={0.75} grade={false} />
          <Cyl rt={0.12} h={0.13} p={[0, 0.25, wz]} r={[0, 0, Math.PI / 2]} c={PAL.STEEL} metal={0.6} rough={0.35} grade={false} />
        </group>
      ))}
      <Box s={[0.42, 0.08, 0.62]} p={[0, 0.33, 0.04]} c="#4A4D55" rough={0.6} grade={false} />
      <Box s={[0.5, 0.44, 0.88]} p={[0, 0.6, -0.36]} radius={0.17} {...body} />
      <Box s={[0.4, 0.13, 0.72]} p={[0, 0.88, -0.32]} radius={0.06} c="#2B2D33" rough={0.7} grade={false} />
      <Box s={[0.48, 0.78, 0.16]} p={[0, 0.66, 0.4]} r={[-0.22, 0, 0]} radius={0.07} {...body} />
      <Box s={[0.24, 0.1, 0.42]} p={[0, 0.53, 0.64]} radius={0.04} {...body} />
      <Cyl rt={0.035} h={0.55} p={[0, 1.02, 0.47]} r={[-0.25, 0, 0]} c="#4A4D55" metal={0.4} rough={0.5} grade={false} />
      <Box s={[0.72, 0.06, 0.06]} p={[0, 1.24, 0.42]} c={DARK} rough={0.6} grade={false} />
      <Box s={[0.3, 0.2, 0.2]} p={[0, 1.2, 0.5]} radius={0.07} {...body} />
      <Cyl rt={0.075} h={0.04} p={[0, 1.2, 0.61]} r={[Math.PI / 2, 0, 0]} c="#FFF6E5" rough={0.2} grade={false} shadow={false} />
    </group>
  )
}
