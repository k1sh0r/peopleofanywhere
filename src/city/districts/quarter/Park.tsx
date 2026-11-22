'use client'

import { PAL } from '@/config/palette'
import { QUARTER_PARK } from './layout'
import { BASE } from '../units'
import { texMat } from '../../render/materials'
import { grassTex, repeated } from '../../render/textures'
import { Box } from '../../kit/primitives'
import { Bush } from '../../kit/Trees'
import { Railing, Bench } from '../../kit/ParkFurniture'

/** Studio Lane Park — railings, lawn, terracotta walking loop, benches, hedges. */
export function Park() {
  const { x0, x1, z0, z1, gate } = QUARTER_PARK
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const sx = x1 - x0
  const sz = z1 - z0
  const lawn = texMat('lawn', () => repeated(grassTex(), sx / 4, sz / 4), { rough: 0.95 })
  const L = 7 // walking loop half-size around (20,20)
  const pw = 1.6
  const path = { c: PAL.PATH, rough: 0.9, grade: false, shadow: false }
  return (
    <>
      <Box s={[sx - 0.3, 0.06, sz - 0.3]} p={[cx, BASE + 0.03, cz]} material={lawn} shadow={false} />
      <Box s={[2 * L + pw, 0.05, pw]} p={[20, BASE + 0.07, 20 - L]} {...path} />
      <Box s={[2 * L + pw, 0.05, pw]} p={[20, BASE + 0.07, 20 + L]} {...path} />
      <Box s={[pw, 0.05, 2 * L - pw]} p={[20 - L, BASE + 0.07, 20]} {...path} />
      <Box s={[pw, 0.05, 2 * L - pw]} p={[20 + L, BASE + 0.07, 20]} {...path} />
      {/* entry path from the corner gate */}
      <Box s={[pw, 0.05, 4.6]} p={[10.6, BASE + 0.07, 11.0]} {...path} />
      <Box s={[2.8, 0.05, pw]} p={[11.6, BASE + 0.07, 13.0]} {...path} />

      <Railing from={[gate[1], z0]} to={[x1, z0]} />
      <Railing from={[x0, z0 + 0.6]} to={[x0, z1]} />
      <Railing from={[x0, z1]} to={[x1, z1]} />
      <Railing from={[x1, z0]} to={[x1, z1]} />
      {/* gate posts */}
      {[
        [x0, z0],
        [gate[1], z0],
      ].map(([gx, gz]) => (
        <group key={gx} position={[gx, BASE, gz]}>
          <Box s={[0.5, 1.7, 0.5]} p={[0, 0.85, 0]} c={PAL.WALL_WHITE} />
          <Box s={[0.62, 0.12, 0.62]} p={[0, 1.76, 0]} c={PAL.RAIL_GREEN} />
        </group>
      ))}

      <Bench p={[16, 14.5]} />
      <Bench p={[25, 20]} rot={Math.PI / 2} />
      <Bench p={[16, 26]} rot={Math.PI} />

      <Bush p={[10.5, BASE + 0.2, 30]} s={1.4} seed={71} />
      <Bush p={[12.4, BASE + 0.2, 30.4]} s={1.1} seed={72} />
      <Bush p={[30.3, BASE + 0.2, 30.2]} s={1.3} seed={73} />
      <Bush p={[30.4, BASE + 0.2, 23]} s={1.0} seed={74} />
      <Bush p={[14.2, BASE + 0.2, 10.4]} s={1.0} seed={75} flower={PAL.BOUGAIN} />
    </>
  )
}
