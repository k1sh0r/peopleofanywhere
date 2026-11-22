'use client'

import * as THREE from 'three'
import { useMemo } from 'react'
import { PAL } from '@/config/palette'
import { QUARTER_COCONUT_CART, QUARTER_CRATES, QUARTER_DUSTBIN, QUARTER_MANHOLES, QUARTER_POSTERS, QUARTER_RANGOLI, QUARTER_ROAD, QUARTER_SCOOTERS, QUARTER_STREET_SIGNS, QUARTER_TREES } from './layout'
import { BASE } from '../units'
import { plane, rbox, sphere } from '../../render/geometry'
import { mat } from '../../render/materials'
import { grimeTex, petalsTex, rangoliTex, repeated, rng, signTexture, stripeTex, useFontsReady, type SignSpec } from '../../render/textures'
import { Box, Cyl, Sign, type V3 } from '../../kit/primitives'
import { DARK, Scooter } from '../../kit/Scooter'

// Street life (design.md §6.2): the small things that make it unmistakably this city.

/** Tender-coconut cart under a striped umbrella. Local +Z = handle side. */
function CoconutCart() {
  const { x, z, rot } = QUARTER_COCONUT_CART
  const umbrella = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ map: repeated(stripeTex(PAL.WALL_WHITE, PAL.BUS_BLUE), 6, 1), roughness: 0.85, side: THREE.DoubleSide })
    const g = new THREE.CylinderGeometry(0.06, 1.3, 0.5, 24, 1, true)
    return { m, g }
  }, [])
  const nuts = useMemo(() => {
    const r = rng(55)
    const out: { p: V3; c: string }[] = []
    const cols = ['#8DB04A', '#9DBF55', '#76A03F']
    const layers: [number, number, number][] = [
      [5, 9, 0],
      [3, 7, 1],
      [1, 5, 2],
    ]
    for (const [nx, nz, l] of layers)
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < nz; j++)
          out.push({
            p: [(i - (nx - 1) / 2) * 0.27 + (r() - 0.5) * 0.04, 0.95 + l * 0.22, (j - (nz - 1) / 2) * 0.2 + (r() - 0.5) * 0.04],
            c: cols[Math.floor(r() * cols.length)],
          })
    return out
  }, [])
  return (
    <group position={[x, BASE, z]} rotation={[0, rot, 0]}>
      <Box s={[1.4, 0.1, 2.0]} p={[0, 0.8, 0]} c={PAL.WOOD} rough={0.8} />
      {[-0.68, 0.68].map((sx) => (
        <Box key={sx} s={[0.06, 0.18, 2.0]} p={[sx, 0.92, 0]} c={PAL.WOOD} rough={0.8} />
      ))}
      {[-0.6, 0.6].map((sx) => (
        <group key={sx}>
          <Cyl rt={0.34} h={0.08} p={[sx, 0.34, -0.55]} r={[0, 0, Math.PI / 2]} c={DARK} rough={0.7} grade={false} />
          <Cyl rt={0.1} h={0.1} p={[sx, 0.34, -0.55]} r={[0, 0, Math.PI / 2]} c={PAL.STEEL} metal={0.5} rough={0.4} grade={false} />
          <Box s={[0.08, 0.76, 0.08]} p={[sx, 0.38, 0.85]} c={PAL.WOOD} rough={0.8} />
          <Box s={[0.06, 0.06, 0.9]} p={[sx * 0.7, 0.84, 1.4]} c={PAL.WOOD} rough={0.8} />
        </group>
      ))}
      {nuts.map((n, i) => (
        <mesh key={i} geometry={sphere(0.13, 12, 9)} material={mat(n.c, { rough: 0.6, grade: false })} position={n.p} scale={[1, 0.9, 1.1]} castShadow />
      ))}
      <Cyl rt={0.03} h={2.3} p={[0.5, 1.95, -0.7]} c={PAL.GRILLE} metal={0.4} rough={0.5} grade={false} />
      <mesh geometry={umbrella.g} material={umbrella.m} position={[0.5, 3.05, -0.7]} castShadow receiveShadow />
      {/* a few on the ground, one opened */}
      {[
        [-0.95, 0.12, 0.5],
        [-1.1, 0.12, 0.2],
        [-0.85, 0.12, 0.0],
      ].map((p, i) => (
        <mesh key={i} geometry={sphere(0.13, 12, 9)} material={mat('#8DB04A', { rough: 0.6, grade: false })} position={p as V3} castShadow />
      ))}
    </group>
  )
}

function StreetSign({ x, z, rot, spec }: { x: number; z: number; rot: number; spec: SignSpec }) {
  return (
    <group position={[x, BASE, z]} rotation={[0, rot, 0]}>
      <Cyl rt={0.05} h={2.9} p={[0, 1.45, 0]} c={PAL.GRILLE} metal={0.4} rough={0.5} grade={false} />
      <Sign p={[0, 2.55, 0.06]} w={1.9} h={0.78} spec={spec} frame={PAL.WALL_WHITE} depth={0.06} />
    </group>
  )
}

/** Hand-pasted paper poster, slightly crooked. */
function Poster({ x, z, rot, spec, i }: { x: number; z: number; rot: number; spec: SignSpec; i: number }) {
  useFontsReady()
  const m = useMemo(() => new THREE.MeshStandardMaterial({ map: signTexture(spec, 0.86, 1.08), roughness: 0.9 }), [spec])
  const n = new THREE.Vector3(Math.sin(rot), 0, Math.cos(rot)).multiplyScalar(0.01)
  return (
    <mesh
      geometry={plane(0.86, 1.08)}
      material={m}
      position={[x + n.x, BASE + 0.8, z + n.z]}
      rotation={[0, rot, (i % 2 ? 1 : -1) * 0.035]}
      receiveShadow
    />
  )
}

function Decal({ p, size, tex, rot = 0 }: { p: V3; size: number; tex: THREE.Texture; rot?: number }) {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.45, roughness: 0.95 }), [tex])
  return <mesh geometry={plane(size, size)} material={m} position={p} rotation={[-Math.PI / 2, 0, rot]} receiveShadow />
}

function Manhole({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl rt={0.56} h={0.02} p={[0, 0.01, 0]} c="#8A8B8F" rough={0.6} metal={0.3} grade={false} shadow={false} />
      <Cyl rt={0.47} h={0.03} p={[0, 0.015, 0]} c="#6E6F74" rough={0.45} metal={0.45} grade={false} shadow={false} />
      {[-0.24, 0, 0.24].map((o) => (
        <Box key={o} s={[0.07, 0.02, 0.78 - Math.abs(o) * 0.9]} p={[o, 0.035, 0]} c="#5E5F64" metal={0.45} rough={0.45} grade={false} shadow={false} />
      ))}
    </group>
  )
}

/** Slab-covered storm drain running just inside every kerb. */
function DrainCovers() {
  const slabs: { p: V3; r: number; c: string }[] = []
  const r = rng(303)
  for (const sx of [1, -1])
    for (const sz of [1, -1])
      for (let k = 0; k < 52; k++) {
        const along = QUARTER_ROAD + 0.55 + k * 1.0
        const c = r() < 0.5 ? PAL.CONCRETE_AGED : '#C4B49A'
        slabs.push({ p: [sx * along, BASE + 0.012, sz * (QUARTER_ROAD + 0.4)], r: 0, c })
        slabs.push({ p: [sx * (QUARTER_ROAD + 0.4), BASE + 0.012, sz * along], r: Math.PI / 2, c })
      }
  return (
    <>
      {slabs.map((s, i) => (
        <mesh key={i} geometry={rbox(0.94, 0.05, 0.56, 0.02)} material={mat(s.c, { rough: 0.9, grade: false })} position={s.p} rotation={[0, s.r, 0]} receiveShadow />
      ))}
    </>
  )
}

/** Dust and tyre grime collecting against the kerb. */
function KerbGrime() {
  const len = 60 - QUARTER_ROAD
  const mid = (QUARTER_ROAD + 60) / 2
  const m = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: repeated(grimeTex(), len / 4, 1),
        transparent: true,
        depthWrite: false,
        roughness: 1,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    [len],
  )
  const strips: { p: V3; t: number }[] = []
  for (const sx of [1, -1])
    for (const sz of [1, -1]) {
      strips.push({ p: [sx * mid, 0.008, sz * (QUARTER_ROAD - 0.45)], t: Math.atan2(0, -sz) })
      strips.push({ p: [sx * (QUARTER_ROAD - 0.45), 0.008, sz * mid], t: Math.atan2(-sx, 0) })
    }
  return (
    <>
      {strips.map((s, i) => (
        <mesh key={i} geometry={plane(len, 0.9)} material={m} position={s.p} rotation={[-Math.PI / 2, 0, s.t]} renderOrder={1} userData={{ noMerge: true }} />
      ))}
    </>
  )
}

function Crates({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, BASE, z]}>
      {[
        [0, 0.15, 0, PAL.SIGN_RED],
        [0, 0.45, 0, PAL.BUS_BLUE],
        [0.04, 0.75, 0.02, PAL.SIGN_RED],
      ].map(([cx, cy, cz, c], i) => (
        <group key={i} position={[cx as number, cy as number, cz as number]} rotation={[0, i * 0.08, 0]}>
          <Box s={[0.5, 0.3, 0.38]} c={c as string} rough={0.5} grade={false} />
          <Box s={[0.42, 0.04, 0.3]} p={[0, 0.14, 0]} c="#3B2A22" rough={0.8} grade={false} shadow={false} />
        </group>
      ))}
    </group>
  )
}

function Dustbin({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, BASE, z]}>
      <Cyl rt={0.3} rb={0.26} h={0.82} p={[0, 0.41, 0]} c={PAL.RAIL_GREEN} rough={0.5} grade={false} />
      <Cyl rt={0.33} h={0.07} p={[0, 0.85, 0]} c="#2F5E3A" rough={0.5} grade={false} />
      <Box s={[0.34, 0.16, 0.02]} p={[0, 0.55, 0.285]} c={PAL.WALL_WHITE} grade={false} shadow={false} />
    </group>
  )
}

export function StreetLife() {
  return (
    <>
      <CoconutCart />
      {QUARTER_SCOOTERS.map((s, i) => (
        <Scooter key={i} {...s} />
      ))}
      {QUARTER_STREET_SIGNS.map((s, i) => (
        <StreetSign key={i} {...s} />
      ))}
      {QUARTER_POSTERS.map((p, i) => (
        <Poster key={i} i={i} {...p} />
      ))}
      {QUARTER_RANGOLI.map((r) => (
        <Decal key={r.seed} p={[r.x, BASE + 0.008, r.z]} size={r.s} tex={rangoliTex(r.seed)} />
      ))}
      {QUARTER_TREES.filter((t) => t.kind === 'gulmohar').map((t) => (
        <Decal key={t.seed} p={[t.x, BASE + 0.075, t.z]} size={4.2 * t.s} tex={petalsTex()} rot={t.seed} />
      ))}
      {QUARTER_MANHOLES.map(([x, z], i) => (
        <Manhole key={i} x={x} z={z} />
      ))}
      <DrainCovers />
      <KerbGrime />
      <Crates {...QUARTER_CRATES} />
      <Dustbin {...QUARTER_DUSTBIN} />
    </>
  )
}
