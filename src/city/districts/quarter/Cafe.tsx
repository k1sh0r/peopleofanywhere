'use client'

import { PAL, UI } from '@/config/palette'
import { QUARTER_CAFE_HOUSE } from './layout'
import { BASE } from '../units'
import { mat, texMat } from '../../render/materials'
import { gable, rbox } from '../../render/geometry'
import { repeated, roofTileTex } from '../../render/textures'
import { Box, Cyl, Door, Pot, Sign, Win } from '../../kit/primitives'
import { Bush } from '../../kit/Trees'

// Filter & Frame — a specialty café and design-book shop in a converted Design Quarter bungalow on Beacon Road.
// The design district's second social spot (after the mess): whitewashed walls, a clay-tile
// roof, a deep veranda turned glass shopfront, bistro tables out on the pavement. Fictional name.

const INK = '#2B2F45'
const PITCH = 0.5
const G = 3.6

export function Cafe() {
  const { x, z, w, d } = QUARTER_CAFE_HOUSE
  const half = d / 2 + 0.6
  const rise = half * Math.tan(PITCH)
  const slope = half / Math.cos(PITCH)
  const roof = texMat('roof-cafe', () => repeated(roofTileTex(), (w + 1) / 2, slope / 2), { rough: 0.8 })
  return (
    <>
      {/* local +Z faces Beacon Road (−Z world) */}
      <group position={[x, BASE, z]} rotation={[0, Math.PI, 0]}>
        <Box s={[w, G, d]} p={[0, G / 2, 0]} c={PAL.WALL_WHITE} />
        <Box s={[w + 0.2, 0.9, d + 0.2]} p={[0, 0.45, 0]} c={PAL.TERRACOTTA} />
        <Box s={[w + 0.24, 0.22, d + 0.24]} p={[0, G, 0]} c={PAL.WALL_BUTTER} />
        {/* veranda: kota floor, slim ink columns, the old front wall opened up into glass */}
        <Box s={[w, 0.18, 2.2]} p={[0, 0.09, d / 2 + 1.1]} c={PAL.STONE} grade={false} />
        {[-w / 2 + 0.4, -1.6, 1.6, w / 2 - 0.4].map((cx) => (
          <Cyl key={cx} rt={0.13} h={G} p={[cx, G / 2, d / 2 + 2.0]} c={INK} rough={0.5} grade={false} />
        ))}
        <Box s={[w + 0.4, 0.24, 2.6]} p={[0, G - 0.05, d / 2 + 1.2]} c={PAL.WALL_BUTTER} />
        {[-3.4, 0, 3.4].map((wx) => (
          <Win key={wx} p={[wx, 1.85, d / 2]} w={2.9} h={2.5} frame={INK} shade={false} />
        ))}
        <Door p={[-w / 2 + 1.0, 0.18, d / 2]} w={1.1} h={2.4} c={INK} frame={INK} />
        <Sign
          p={[0, G + 0.62, d / 2 + 2.4]}
          w={6.2}
          h={1.0}
          spec={{ title: 'FILTER & FRAME', sub: 'SPECIALTY COFFEE · DESIGN BOOKS', bg: INK, fg: PAL.WALL_BUTTER }}
          frame={PAL.WALL_BUTTER}
        />
        {/* clay-tile gable roof, ridge along X */}
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            geometry={rbox(w + 1.0, 0.16, slope)}
            material={roof}
            position={[0, G + rise / 2 + 0.1, (s * half) / 2]}
            rotation={[s * PITCH, 0, 0]}
            castShadow
            receiveShadow
          />
        ))}
        <Box s={[w + 1.1, 0.2, 0.34]} p={[0, G + rise + 0.16, 0]} c="#8E3F2B" rough={0.8} grade={false} />
        {[-w / 2 + 0.15, w / 2 - 0.15].map((gx) => (
          <mesh key={gx} geometry={gable(d, (d / 2) * Math.tan(PITCH), 0.3)} material={mat(PAL.WALL_WHITE, { grade: false })} position={[gx, G + 0.1, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow />
        ))}
        {/* a chalkboard by the door */}
        <group position={[-w / 2 + 2.3, 0.2, d / 2 + 2.3]} rotation={[-0.15, 0.2, 0]}>
          <Sign p={[0, 0.65, 0]} w={0.75} h={0.95} spec={{ title: 'TODAY', sub: 'COLD BREW · PORTFOLIO CRITS 5 PM', bg: '#2F4A3A', fg: UI.CREAM }} frame={PAL.WOOD} depth={0.05} />
        </group>
        <Pot p={[w / 2 - 0.5, 0.18, d / 2 + 2.3]} s={1.3} />
      </group>
      {/* bistro tables out on the pavement */}
      {QUARTER_CAFE_HOUSE.tables.map(([tx, tz]) => (
        <group key={tx} position={[tx, BASE, tz]}>
          <Cyl rt={0.4} h={0.05} p={[0, 0.76, 0]} c={PAL.WALL_WHITE} rough={0.5} grade={false} />
          <Cyl rt={0.05} h={0.74} p={[0, 0.37, 0]} c={INK} metal={0.4} rough={0.5} grade={false} />
          {[0.6, 3.7].map((a) => (
            <Cyl key={a} rt={0.17} h={0.45} p={[Math.sin(a) * 0.72, 0.225, Math.cos(a) * 0.72]} c={PAL.WOOD} rough={0.7} />
          ))}
        </group>
      ))}
      <Bush p={[x - w / 2 - 0.8, BASE + 0.9, z - 2]} s={1.2} seed={951} flower={PAL.BOUGAIN} />
    </>
  )
}
