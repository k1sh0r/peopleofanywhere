'use client'

import * as THREE from 'three'
import { PAL } from '@/config/palette'
import { BASE } from '../units'
import { lampMat, mat, texMat } from '../../render/materials'
import { plane, rbox } from '../../render/geometry'
import { asphaltTex, paverTex, repeated, sandTex } from '../../render/textures'
import { Box } from '../../kit/primitives'
import { Background, FarBlock } from '../../kit/Background'
import { Building } from '../../kit/Building'
import { CompoundWall } from '../../kit/CompoundWall'
import { KerbLines } from '../../kit/KerbLines'
import { Bench } from '../../kit/ParkFurniture'
import { Portal } from '../../portal/Portal'
import { Scooter } from '../../kit/Scooter'
import { StaticMerge } from '../../kit/StaticMerge'
import { LampsOn, poolGeo, poolMat } from '../../kit/Lamps'
import { Bush, Gulmohar, RainTree } from '../../kit/Trees'
import {
  BENCHES_X,
  BOATS,
  CARTS,
  COMPOUND,
  COMPOUND_Z,
  HERITAGE,
  LAMPS_X,
  LAMP_Z,
  SHORE_FILLERS,
  SHORE_PORTAL,
  SHORE_TREES,
  MEDIAN_GAP,
  MEDIAN_W,
  MEDIAN_Z,
  PALMS,
  PROM_EDGE,
  ROAD_N,
  ROAD_S,
  SAND_Y,
  STEP_GAPS,
} from './layout'
import { Boat, BusShelter, Heritage, KiteStand, Lighthouse, CitySign, Palm, Ships, SnackCart } from './props'
import { Kites, LighthouseBeam, Sea } from './Sea'

const EXT = 120

function slab(x0: number, x1: number, z0: number, z1: number, m: ReturnType<typeof mat>, y = BASE) {
  return <mesh geometry={rbox(x1 - x0, y, z1 - z0, 0.03)} material={m} position={[(x0 + x1) / 2, y / 2, (z0 + z1) / 2]} receiveShadow />
}

// --- ground: Shore Road, the pavements, the promenade, the sand ----------------------

function ShoreGround() {
  const road = texMat('asphalt', () => repeated(asphaltTex(), (EXT * 2) / 10, (ROAD_N - ROAD_S) / 10), { rough: 0.92, vary: true })
  const walk = texMat('shore-pavers', () => repeated(paverTex(), EXT, 40), { rough: 0.9 })
  const prom = texMat('shore-prom', () => repeated(paverTex(), EXT, (ROAD_S - PROM_EDGE) / 2), { rough: 0.88 }) as THREE.MeshStandardMaterial
  prom.color.set('#E2CDB0') // warm sandstone pavers, a step darker than the town's
  const sand = texMat('shore-sand', () => repeated(sandTex(), (EXT * 2) / 8, 90 / 8), { rough: 0.96, vary: true })
  const paint = mat(PAL.ROAD_PAINT, { rough: 0.9, grade: false })
  const marks: [number, number, number, number][] = [] // x, z, w, l
  for (let x = -EXT; x < EXT; x += 6) {
    if (Math.abs(x) < 4) continue
    marks.push([x, (ROAD_S + MEDIAN_Z - MEDIAN_W) / 2, 3, 0.16], [x, (MEDIAN_Z + MEDIAN_W + ROAD_N) / 2, 3, 0.16])
  }
  // a zebra from the promenade steps to the bus shelter, through the median gap
  for (let i = 0; i < 11; i++) marks.push([-1.5, ROAD_S + 0.9 + i * 1.25, 3.2, 0.6])
  return (
    <>
      <mesh geometry={plane(1400, 1400)} material={mat('#C9B48C', { grade: false })} position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={plane(EXT * 2, ROAD_N - ROAD_S)} material={road} position={[0, 0, (ROAD_N + ROAD_S) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      {slab(-EXT, EXT, ROAD_N, EXT, walk)}
      {slab(-EXT, EXT, PROM_EDGE, ROAD_S, prom)}
      {/* terracotta bands across the promenade every 6 m */}
      {Array.from({ length: 40 }, (_, i) => -EXT + 3 + i * 6).map((x) => (
        <mesh key={x} geometry={plane(0.4, ROAD_S - PROM_EDGE - 0.4)} material={mat(PAL.PATH, { rough: 0.8, grade: false })} position={[x, BASE + 0.004, (PROM_EDGE + ROAD_S) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      ))}
      <mesh geometry={plane(EXT * 2, 90)} material={sand} position={[0, SAND_Y, PROM_EDGE - 45]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      {/* median: a kerbed concrete strip with the U-turn gap */}
      {slab(-EXT, -MEDIAN_GAP, MEDIAN_Z - MEDIAN_W, MEDIAN_Z + MEDIAN_W, mat(PAL.CONCRETE_WARM), BASE + 0.05)}
      {slab(MEDIAN_GAP, EXT, MEDIAN_Z - MEDIAN_W, MEDIAN_Z + MEDIAN_W, mat(PAL.CONCRETE_WARM), BASE + 0.05)}
      {marks.map(([x, z, w, l], i) => (
        <mesh key={i} geometry={plane(w, l)} material={paint} position={[x, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      ))}
    </>
  )
}

const KERBS: [number, number, number, number][] = [
  [-60, ROAD_S + 0.13, 60, ROAD_S + 0.13],
  [-60, ROAD_N - 0.13, 60, ROAD_N - 0.13],
  [-60, MEDIAN_Z - MEDIAN_W - 0.13, -MEDIAN_GAP, MEDIAN_Z - MEDIAN_W - 0.13],
  [-60, MEDIAN_Z + MEDIAN_W + 0.13, -MEDIAN_GAP, MEDIAN_Z + MEDIAN_W + 0.13],
  [MEDIAN_GAP, MEDIAN_Z - MEDIAN_W - 0.13, 60, MEDIAN_Z - MEDIAN_W - 0.13],
  [MEDIAN_GAP, MEDIAN_Z + MEDIAN_W + 0.13, 60, MEDIAN_Z + MEDIAN_W + 0.13],
]

// --- the promenade's sea edge: a low seat wall with steps down to the sand -------------------

function SeatWall() {
  const runs: [number, number][] = []
  let from = -EXT
  for (const [a, b] of STEP_GAPS) {
    runs.push([from, a])
    from = b
  }
  runs.push([from, EXT])
  return (
    <>
      {runs.map(([a, b]) => (
        <group key={a}>
          <Box s={[b - a, 0.5, 0.7]} p={[(a + b) / 2, 0.25, PROM_EDGE]} c={PAL.CONCRETE_WARM} />
          <Box s={[b - a + 0.04, 0.1, 0.84]} p={[(a + b) / 2, 0.53, PROM_EDGE]} c={PAL.STONE} rough={0.7} />
        </group>
      ))}
      {STEP_GAPS.map(([a, b]) => (
        <group key={a}>
          <Box s={[b - a, 0.1, 0.6]} p={[(a + b) / 2, 0.1, PROM_EDGE - 0.3]} c={PAL.STONE} rough={0.7} />
          <Box s={[b - a, 0.1, 0.6]} p={[(a + b) / 2, 0.05, PROM_EDGE - 0.9]} c={PAL.STONE} rough={0.7} />
        </group>
      ))}
    </>
  )
}

/** Tall promenade lamp: cream steel pole, a double arm, warm lamps over the walk and the road. */
function PromenadeLamp({ x }: { x: number }) {
  return (
    <group position={[x, BASE, LAMP_Z]}>
      <Box s={[0.6, 0.5, 0.6]} p={[0, 0.25, 0]} c={PAL.CONCRETE_AGED} />
      <Box s={[0.22, 8.4, 0.22]} p={[0, 4.4, 0]} c={PAL.WALL_WHITE} rough={0.6} />
      <Box s={[0.12, 0.12, 3.4]} p={[0, 8.3, 0]} c={PAL.GRILLE} metal={0.4} rough={0.5} grade={false} />
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 8.15, s * 1.7]}>
          <Box s={[0.42, 0.18, 0.7]} material={lampMat()} />
          <mesh geometry={poolGeo} material={poolMat} position={[0, 0.02 - 8.15 - BASE + (s < 0 ? BASE : 0), s * 0.3]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noMerge: true }} />
        </group>
      ))}
    </group>
  )
}

/** Inland city beyond the heritage row: kept off the sea side entirely. */
const keepInland = (_x: number, z: number) => z > 34

export function ShoreWorld() {
  return (
    <>
      <StaticMerge>
        <ShoreGround />
        <SeatWall />
        {LAMPS_X.map((x) => (
          <PromenadeLamp key={x} x={x} />
        ))}
        {BENCHES_X.map((x) => (
          <Bench key={x} p={[x, PROM_EDGE + 0.95]} rot={Math.PI} />
        ))}
        <CitySign />
        <Lighthouse />
        <Heritage />
        <CompoundWall from={[COMPOUND.x0, COMPOUND_Z]} to={[COMPOUND.gate[0], COMPOUND_Z]} wall={PAL.WALL_WHITE} cap={PAL.TERRACOTTA} />
        <CompoundWall from={[COMPOUND.gate[1], COMPOUND_Z]} to={[COMPOUND.x1, COMPOUND_Z]} wall={PAL.WALL_WHITE} cap={PAL.TERRACOTTA} />
        <CompoundWall from={[COMPOUND.x0, COMPOUND_Z]} to={[COMPOUND.x0, HERITAGE.z]} wall={PAL.WALL_WHITE} cap={PAL.TERRACOTTA} />
        {COMPOUND.gate.map((gx) => (
          <group key={gx} position={[gx, BASE, COMPOUND_Z]}>
            <Box s={[0.7, 2.6, 0.7]} p={[0, 1.3, 0]} c={PAL.WALL_WHITE} />
            <Box s={[0.85, 0.16, 0.85]} p={[0, 2.68, 0]} c={PAL.TERRACOTTA} />
          </group>
        ))}
        <BusShelter />
        {CARTS.map((c) => (
          <SnackCart key={c.seed} {...c} />
        ))}
        {BOATS.map(([x, z, yaw, hull, band], i) => (
          <Boat key={i} x={x} z={z} yaw={yaw} hull={hull} band={band} seed={900 + i} />
        ))}
        <KiteStand />
        {PALMS.map((p) => (
          <Palm key={p.seed} {...p} />
        ))}
        {SHORE_TREES.map((t) =>
          t.kind === 'rain' ? <RainTree key={t.seed} p={[t.x, BASE, t.z]} s={t.s} seed={t.seed} /> : <Gulmohar key={t.seed} p={[t.x, BASE, t.z]} s={t.s} seed={t.seed} />,
        )}
        {SHORE_FILLERS.map((b) => (
          <Building key={b.seed} {...b} />
        ))}
        <Bush p={[-17, BASE + 0.2, 36]} s={1.2} seed={861} flower={PAL.BOUGAIN} />
        <Bush p={[-44, BASE + 0.2, 36]} s={1.0} seed={862} />
        <Scooter x={-20} z={24.2} rot={-Math.PI / 2} color={PAL.WALL_POWDER} />
        <Scooter x={20} z={24.2} rot={-Math.PI / 2 + 0.15} color={PAL.FLAME} />
        {/* the frontage continues beyond the play area */}
        {[-104, -88, -72, -56, 56, 72, 88, 104].map((x, i) => (
          <FarBlock key={x} b={[x, 34, 13, 10, 6.4 + (i % 3) * 3.2, [PAL.WALL_BUTTER, PAL.WALL_POWDER, PAL.WALL_SALMON, PAL.WALL_WHITE][i % 4]]} />
        ))}
        <Background seed={151} metro={null} keep={keepInland} skyline={1} />
        <Ships />
      </StaticMerge>
      <KerbLines runs={KERBS} />
      <Sea />
      <LighthouseBeam />
      <Kites />
      <LampsOn />
      <Portal pose={SHORE_PORTAL} />
    </>
  )
}
