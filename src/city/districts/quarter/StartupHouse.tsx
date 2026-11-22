'use client'

import { PAL, UI } from '@/config/palette'
import { QUARTER_STARTUP } from './layout'
import { BASE } from '../units'
import { gable, rbox } from '../../render/geometry'
import { mat, texMat } from '../../render/materials'
import { repeated, roofTileTex } from '../../render/textures'
import { Box, Cyl, Door, Sign, Win } from '../../kit/primitives'
import { CompoundWall } from '../../kit/CompoundWall'
import { Bush } from '../../kit/Trees'

const G = 3.3
const U = 3.1
const W = 10
const PITCH = (28 * Math.PI) / 180

/**
 * Peepal Labs — an old city house turned startup office.
 * Mint walls, clay-tile gable roof, veranda with a balcony above.
 * Local +Z = front (faces Beacon Road after rotation).
 */
export function StartupHouse() {
  const { x, z, rot } = QUARTER_STARTUP
  const Hb = G + U
  const half = 3.6 // roof half-depth incl. overhang (body z -4..2, ridge at z=-1)
  const rise = half * Math.tan(PITCH)
  const slope = half / Math.cos(PITCH)
  const roof = texMat('roof-startup', () => repeated(roofTileTex(), (W + 1) / 2, slope / 2), { rough: 0.8 })

  return (
    <>
      <group position={[x, BASE, z]} rotation={[0, rot, 0]}>
        {/* body */}
        <Box s={[W, G, 6]} p={[0, G / 2, -1]} c={PAL.WALL_MINT} />
        <Box s={[W, U, 6]} p={[0, G + U / 2, -1]} c={PAL.WALL_MINT} />
        <Box s={[W + 0.24, 0.24, 6.24]} p={[0, G, -1]} c={PAL.WALL_WHITE} />
        <Box s={[W + 0.24, 0.2, 6.24]} p={[0, Hb, -1]} c={PAL.WALL_WHITE} />

        {/* veranda: plinth, pillars, balcony slab + parapet above */}
        <Box s={[8.4, 0.2, 2.1]} p={[0, 0.1, 3.0]} c={PAL.STONE} grade={false} />
        {[-3.8, 3.8].map((px) => (
          <Cyl key={px} rt={0.2} rb={0.24} h={G} p={[px, G / 2, 3.75]} c={PAL.WALL_WHITE} />
        ))}
        <Box s={[8.6, 0.22, 2.3]} p={[0, G, 2.95]} c={PAL.WALL_WHITE} />
        <Box s={[8.6, 0.85, 0.16]} p={[0, G + 0.53, 4.02]} c={PAL.WALL_WHITE} />
        {[-4.22, 4.22].map((px) => (
          <Box key={px} s={[0.16, 0.85, 2.1]} p={[px, G + 0.53, 3.0]} c={PAL.WALL_WHITE} />
        ))}
        {/* parapet cut-outs read as balusters */}
        {Array.from({ length: 9 }, (_, i) => (
          <Box key={i} s={[0.5, 0.42, 0.06]} p={[-3.6 + i * 0.9, G + 0.58, 4.11]} c={PAL.WALL_MINT} shadow={false} grade={false} />
        ))}

        {/* ground floor front */}
        <Door p={[1.6, 0.2, 2]} w={1.2} h={2.3} c={PAL.WOOD} />
        <Win p={[-2.4, 1.75, 2]} w={1.5} grille shade={false} curtain={PAL.WALL_BUTTER} />
        {/* upper floor front */}
        <Win p={[0, G + 1.35, 2]} w={1.2} h={2.2} door shade={false} curtain={PAL.TERRACOTTA} />
        {[-3.2, 3.2].map((wx) => (
          <Win key={wx} p={[wx, G + 1.65, 2]} w={1.2} shadeColor={PAL.TERRACOTTA} />
        ))}
        {/* sides + back */}
        {[0, G].map((fy) =>
          [-2.6, 0.6].map((wz) => (
            <group key={`${fy}${wz}`}>
              <Win p={[W / 2, fy + 1.65, wz]} r={[0, Math.PI / 2, 0]} w={1.1} shadeColor={PAL.TERRACOTTA} grille={fy === 0} />
              <Win p={[-W / 2, fy + 1.65, wz]} r={[0, -Math.PI / 2, 0]} w={1.1} shadeColor={PAL.TERRACOTTA} />
            </group>
          )),
        )}
        {[0, G].map((fy) =>
          [-2.5, 2.5].map((wx) => <Win key={`${fy}${wx}`} p={[wx, fy + 1.65, -4]} r={[0, Math.PI, 0]} w={1.2} shadeColor={PAL.TERRACOTTA} />),
        )}

        {/* clay-tile gable roof */}
        <mesh
          geometry={rbox(W + 1.0, 0.16, slope)}
          material={roof}
          position={[0, Hb + rise / 2 + 0.1, -1 + half / 2]}
          rotation={[PITCH, 0, 0]}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={rbox(W + 1.0, 0.16, slope)}
          material={roof}
          position={[0, Hb + rise / 2 + 0.1, -1 - half / 2]}
          rotation={[-PITCH, 0, 0]}
          castShadow
          receiveShadow
        />
        <Box s={[W + 1.1, 0.2, 0.34]} p={[0, Hb + rise + 0.16, -1]} c="#8E3F2B" rough={0.8} grade={false} />
        {[-W / 2 + 0.15, W / 2 - 0.15].map((gx) => (
          <mesh
            key={gx}
            geometry={gable(6.0, 3.0 * Math.tan(PITCH), 0.3)}
            material={mat(PAL.WALL_MINT, { grade: false })}
            position={[gx, Hb + 0.1, -1]}
            rotation={[0, Math.PI / 2, 0]}
            castShadow
            receiveShadow
          />
        ))}
      </group>

      {/* compound + garden */}
      <CompoundWall from={[-24, 8.4]} to={[-15.3, 8.4]} wall={PAL.WALL_WHITE} />
      <CompoundWall from={[-12.7, 8.4]} to={[-8.4, 8.4]} wall={PAL.WALL_WHITE} />
      <CompoundWall from={[-8.4, 8.4]} to={[-8.4, 24]} wall={PAL.WALL_WHITE} />
      {[-15.3, -12.7].map((gx) => (
        <group key={gx} position={[gx, BASE, 8.4]}>
          <Box s={[0.6, 1.9, 0.6]} p={[0, 0.95, 0]} c={PAL.WALL_WHITE} />
          <Box s={[0.75, 0.14, 0.75]} p={[0, 1.95, 0]} c={PAL.TERRACOTTA} />
        </group>
      ))}
      <Box s={[15.4, 0.06, 2.4]} p={[-16.2, BASE + 0.03, 9.8]} c={PAL.GRASS} grade={false} shadow={false} />
      <Sign
        p={[-10.6, BASE + 1.0, 8.24]}
        r={[0, Math.PI, 0]}
        w={3.2}
        h={0.95}
        spec={{ title: 'PEEPAL LABS', sub: 'DESIGN · AI · TOOLS — NOW HIRING', bg: UI.INK, fg: UI.SAFFRON }}
        frame={PAL.WOOD}
        depth={0.08}
      />
      {/* bougainvillea spilling over the wall */}
      <Bush p={[-19.5, BASE + 1.3, 8.7]} s={1.25} seed={61} flower={PAL.BOUGAIN} />
      <Bush p={[-17.2, BASE + 1.2, 8.75]} s={0.95} seed={62} flower={PAL.BOUGAIN} />
      <Bush p={[-9.4, BASE + 0.7, 10.5]} s={0.8} seed={63} />
    </>
  )
}
