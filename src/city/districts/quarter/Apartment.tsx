'use client'

import { PAL } from '@/config/palette'
import { QUARTER_APARTMENT } from './layout'
import { BASE } from '../units'
import { Building } from '../../kit/Building'
import { Box, Sign } from '../../kit/primitives'
import { CompoundWall } from '../../kit/CompoundWall'

/** Parkview Residency — stilt-parking apartment block with a compound wall. */
export function Apartment() {
  return (
    <>
      <Building {...QUARTER_APARTMENT} />
      <CompoundWall from={[-24, -8.4]} to={[-18.2, -8.4]} />
      <CompoundWall from={[-14.8, -8.4]} to={[-8.4, -8.4]} />
      <CompoundWall from={[-8.4, -8.4]} to={[-8.4, -24]} />
      {/* gate pillars */}
      {[-18.2, -14.8].map((x) => (
        <group key={x} position={[x, BASE, -8.4]}>
          <Box s={[0.6, 1.9, 0.6]} p={[0, 0.95, 0]} c={PAL.WALL_WHITE} />
          <Box s={[0.75, 0.14, 0.75]} p={[0, 1.95, 0]} c={PAL.TERRACOTTA} />
        </group>
      ))}
      <Sign
        p={[-19.7, BASE + 0.95, -8.24]}
        w={2.2}
        h={0.82}
        spec={{ title: 'PARKVIEW RESIDENCY', bg: PAL.WALL_WHITE, fg: PAL.SIGN_RED }}
        frame={PAL.TERRACOTTA}
        depth={0.08}
      />
    </>
  )
}
