'use client'

import * as THREE from 'three'
import { useMemo } from 'react'
import { PAL, UI } from '@/config/palette'
import { BASE } from '../units'
import { lampMat, mat } from '../../render/materials'
import { cyl, sphere } from '../../render/geometry'
import { fontVar, repeated, rng, stripeTex, useFontsReady } from '../../render/textures'
import { Box, Cyl, Sign, Win } from '../../kit/primitives'
import { CITY_NAME } from '@/config/site'
import { BOAT, BUS_SHELTER, CART, HERITAGE, KITES, LIGHTHOUSE, CITY_SIGN, SAND_Y, type Cart } from './layout'

// The Shore's hero pieces, all from the kit (design.md §6.1): chunky, bevelled, palette only.

const INK = '#2B2F45'
const BRONZE = '#8A5A3C'

// --- the lighthouse ---------------------------------------------------------------------

/**
 * Stylized from a classic city lighthouse: a tall cream tower with red bands near the top, a railed
 * gallery and a glass lantern room. The lantern itself (it turns at night) is in Sea.tsx.
 */
export function Lighthouse() {
  const { x, z, r, h } = LIGHTHOUSE
  const bands = [0.62, 0.72, 0.82]
  return (
    <group position={[x, SAND_Y, z]}>
      {/* stepped plinth */}
      <Cyl rt={r + 0.9} h={0.5} p={[0, 0.25, 0]} c={PAL.CONCRETE_AGED} rough={0.85} seg={32} />
      <Cyl rt={r + 0.45} h={0.4} p={[0, 0.7, 0]} c={PAL.CONCRETE_WARM} seg={32} />
      {/* the shaft tapers gently */}
      <Cyl rt={r * 0.72} rb={r} h={h} p={[0, 0.9 + h / 2, 0]} c={PAL.WALL_WHITE} rough={0.8} seg={32} />
      {bands.map((t) => {
        const rr = r - (r - r * 0.72) * t + 0.04
        return <Cyl key={t} rt={rr - 0.03} rb={rr + 0.03} h={h * 0.06} p={[0, 0.9 + h * t, 0]} c={PAL.SIGN_RED} rough={0.75} seg={32} />
      })}
      {/* small windows climbing the shaft */}
      {[0.18, 0.36, 0.54].map((t, i) => (
        <group key={t} rotation={[0, i * 1.9 + 0.4, 0]}>
          <Box s={[0.5, 0.9, 0.2]} p={[0, 0.9 + h * t, r - (r - r * 0.72) * t - 0.02]} c={INK} rough={0.4} grade={false} />
        </group>
      ))}
      {/* gallery: deck, railing posts and rail */}
      <Cyl rt={r * 0.72 + 1.0} h={0.35} p={[0, 0.9 + h + 0.18, 0]} c={PAL.CONCRETE_WARM} seg={32} />
      <mesh position={[0, 0.9 + h + 1.25, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[r * 0.72 + 0.9, 0.06, 6, 40]} />
        <meshStandardMaterial color={PAL.SIGN_RED} roughness={0.6} />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2
        const rr = r * 0.72 + 0.9
        return <Box key={i} s={[0.07, 0.9, 0.07]} p={[Math.cos(a) * rr, 0.9 + h + 0.8, Math.sin(a) * rr]} c={PAL.SIGN_RED} radius={0.02} grade={false} />
      })}
      {/* lantern room: ink frame around glass, red dome cap */}
      <Cyl rt={1.1} h={0.4} p={[0, 0.9 + h + 0.55, 0]} c={INK} rough={0.5} seg={24} />
      {/* the lamp room: cream glass by day, the light itself at night (shared lamp material) */}
      <mesh geometry={cyl(1.0, 1.0, 2.1, 12)} position={[0, 0.9 + h + 1.8, 0]} material={lampMat()} />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2
        return <Box key={i} s={[0.1, 2.1, 0.1]} p={[Math.cos(a) * 1.02, 0.9 + h + 1.8, Math.sin(a) * 1.02]} c={INK} radius={0.02} grade={false} />
      })}
      <mesh geometry={sphere(1.15, 20, 10)} position={[0, 0.9 + h + 2.85, 0]} scale={[1, 0.7, 1]} castShadow>
        <meshStandardMaterial color={PAL.SIGN_RED} roughness={0.6} />
      </mesh>
      <Cyl rt={0.08} h={0.9} p={[0, 0.9 + h + 3.9, 0]} c={INK} grade={false} />
      {/* keeper's lodge at the foot, door facing the promenade */}
      <group position={[-4.6, 0, 0]}>
        <Box s={[3.8, 3, 3.6]} p={[0, 1.5, 0]} c={PAL.WALL_WHITE} />
        <Box s={[4.1, 0.25, 3.9]} p={[0, 3.1, 0]} c={PAL.SIGN_RED} />
        <Box s={[1.1, 2.1, 0.12]} p={[0, 1.05, 1.82]} c={INK} rough={0.5} />
        <Sign p={[0, 2.55, 1.88]} w={2.6} h={0.5} spec={{ title: 'LIGHTHOUSE', bg: INK, fg: PAL.WALL_BUTTER }} frame={PAL.SIGN_RED} depth={0.06} />
      </group>
    </group>
  )
}

// --- heritage row: an Indo-Saracenic college front ---------------------------------------

const BRICK = PAL.TERRACOTTA
const TRIM = PAL.WALL_WHITE

/** A semicircular arch head: a half ring in the trim colour. */
function ArchHead({ p, r, tube = 0.14 }: { p: [number, number, number]; r: number; tube?: number }) {
  return (
    <mesh position={p} castShadow receiveShadow material={mat(TRIM)}>
      <torusGeometry args={[r, tube, 8, 20, Math.PI]} />
    </mesh>
  )
}

/** Half disc filling an arch (dark recess or glass). */
function ArchFill({ p, r, c }: { p: [number, number, number]; r: number; c: string }) {
  return (
    <mesh position={p} rotation={[Math.PI / 2, 0, 0]} material={mat(c, { rough: 0.6, grade: false })}>
      <cylinderGeometry args={[r, r, 0.1, 20, 1, false, -Math.PI / 2, Math.PI]} />
    </mesh>
  )
}

function Dome({ p, r, c = TRIM }: { p: [number, number, number]; r: number; c?: string }) {
  return (
    <group position={p}>
      <Cyl rt={r * 0.92} h={r * 0.35} p={[0, r * 0.17, 0]} c={c} seg={24} />
      <mesh geometry={sphere(r, 24, 14)} position={[0, r * 0.35, 0]} scale={[1, 1.25, 1]} material={mat(c)} castShadow />
      <Cyl rt={r * 0.08} rb={r * 0.16} h={r * 0.7} p={[0, r * 1.85, 0]} c={PAL.KERB_YELLOW} grade={false} />
    </group>
  )
}

/** Small domed kiosk (chhatri) on the parapet. */
function Chhatri({ p }: { p: [number, number, number] }) {
  return (
    <group position={p}>
      {[-0.55, 0.55].flatMap((a) => [-0.55, 0.55].map((b) => <Box key={`${a}${b}`} s={[0.2, 1.3, 0.2]} p={[a, 0.65, b]} c={TRIM} radius={0.04} />))}
      <Box s={[1.5, 0.18, 1.5]} p={[0, 1.38, 0]} c={TRIM} />
      <Dome p={[0, 1.45, 0]} r={0.62} />
    </group>
  )
}

export function Heritage() {
  const { x, z, w, d } = HERITAGE
  const F = 4.4
  const bays = 10
  const bay = (w - 4) / bays
  const tower = 5.4
  return (
    // local +Z is the front, facing Shore Road (−Z world)
    <group position={[x, BASE, z]} rotation={[0, Math.PI, 0]}>
      <Box s={[w, F * 2, d]} p={[0, F, 0]} c={BRICK} />
      {/* plinth, floor band, cornice */}
      <Box s={[w + 0.3, 0.7, d + 0.3]} p={[0, 0.35, 0]} c={PAL.CONCRETE_WARM} />
      <Box s={[w + 0.25, 0.32, d + 0.25]} p={[0, F, 0]} c={TRIM} />
      <Box s={[w + 0.5, 0.45, d + 0.5]} p={[0, F * 2 + 0.1, 0]} c={TRIM} />
      {/* parapet with merlons */}
      {Array.from({ length: 19 }, (_, i) => (
        <Box key={i} s={[0.9, 0.7, 0.4]} p={[-w / 2 + 1.6 + i * ((w - 3.2) / 18), F * 2 + 0.65, d / 2]} c={TRIM} radius={0.06} />
      ))}
      {/* ground floor: an arcade of arches with a shaded verandah behind */}
      {Array.from({ length: bays }, (_, i) => {
        const bx = -w / 2 + 2 + bay * (i + 0.5)
        const ar = bay * 0.34
        return (
          <group key={i} position={[bx, 0, d / 2]}>
            <Box s={[ar * 2, 2.2, 0.3]} p={[0, 1.8, 0.02]} c={PAL.INTERIOR} rough={0.9} grade={false} shadow={false} />
            <ArchFill p={[0, 2.9, 0.1]} r={ar} c={PAL.INTERIOR} />
            <ArchHead p={[0, 2.9, 0.2]} r={ar + 0.06} />
            {/* upper floor: arched windows with a cream hood */}
            <Win p={[0, F + 1.9, 0]} w={1.3} h={1.9} frame={TRIM} shade={false} />
            <ArchHead p={[0, F + 2.85, 0.14]} r={0.72} tube={0.11} />
          </group>
        )
      })}
      {/* piers between the arches */}
      {Array.from({ length: bays + 1 }, (_, i) => (
        <Box key={i} s={[0.42, F - 0.4, 0.5]} p={[-w / 2 + 2 + bay * i, (F - 0.4) / 2 + 0.2, d / 2 + 0.12]} c={TRIM} radius={0.06} />
      ))}
      {/* corner towers with domes */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 - tower / 2 + 0.6), 0, 0.4]}>
          <Box s={[tower, F * 2.9, tower]} p={[0, (F * 2.9) / 2, d / 2 - tower / 2 + 0.3]} c={BRICK} />
          <Box s={[tower + 0.3, 0.32, tower + 0.3]} p={[0, F, d / 2 - tower / 2 + 0.3]} c={TRIM} />
          <Box s={[tower + 0.4, 0.4, tower + 0.4]} p={[0, F * 2.9, d / 2 - tower / 2 + 0.3]} c={TRIM} />
          <Win p={[0, F * 2.35, d / 2 + 0.35]} w={1.2} h={1.8} frame={TRIM} shade={false} />
          <ArchHead p={[0, F * 2.35 + 0.92, d / 2 + 0.45]} r={0.66} tube={0.1} />
          <Dome p={[0, F * 2.9 + 0.2, d / 2 - tower / 2 + 0.3]} r={2.2} />
        </group>
      ))}
      {/* central clock tower */}
      <group position={[0, 0, d / 2 - 2.2]}>
        <Box s={[5.6, F * 4, 5.6]} p={[0, F * 2, 0]} c={BRICK} />
        <Box s={[5.9, 0.4, 5.9]} p={[0, F * 2.05, 0]} c={TRIM} />
        <Box s={[6.1, 0.45, 6.1]} p={[0, F * 4, 0]} c={TRIM} />
        {/* clock: cream face, ink hands at ten past ten */}
        <Cyl rt={1.3} h={0.2} p={[0, F * 3.3, 2.85]} r={[Math.PI / 2, 0, 0]} c={PAL.WALL_BUTTER} grade={false} seg={32} />
        <mesh position={[0, F * 3.3, 2.97]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[1.3, 0.12, 6, 32]} />
          <meshStandardMaterial color={TRIM} roughness={0.7} />
        </mesh>
        <Box s={[0.12, 0.95, 0.05]} p={[-0.3, F * 3.3 + 0.35, 3.0]} r={[0, 0, 0.9]} c={INK} radius={0.02} grade={false} />
        <Box s={[0.12, 0.7, 0.05]} p={[0.25, F * 3.3 + 0.25, 3.0]} r={[0, 0, -1.0]} c={INK} radius={0.02} grade={false} />
        <Dome p={[0, F * 4 + 0.2, 0]} r={2.4} />
        {[-1, 1].flatMap((a) => [-1, 1].map((b) => <Chhatri key={`${a}${b}`} p={[a * 2.4, F * 4 + 0.2, b * 2.4]} />))}
      </group>
      {[-1, 1].map((s) => (
        <Chhatri key={s} p={[s * (w / 2 - 9), F * 2 + 0.3, d / 2 - 1]} />
      ))}
    </group>
  )
}

// --- HELLO <CITY>: big painted letter blocks on the promenade --------------------------

const LETTER_COLORS = [PAL.FLAME, PAL.KERB_YELLOW, PAL.AUTO_GREEN, PAL.BUS_BLUE, PAL.WALL_PINK]

function letterMaterial(ch: string, bg: string, fg: string) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 320
  const g = c.getContext('2d')!
  g.fillStyle = bg
  g.fillRect(0, 0, 256, 320)
  g.fillStyle = fg
  g.font = `italic 800 290px ${fontVar('--font-display')}`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(ch, 128, 175)
  // painted speckle so it reads as paint, not print
  const r = rng(ch.charCodeAt(0))
  for (let i = 0; i < 700; i++) {
    g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
    g.fillRect(r() * 256, r() * 320, 2 + r() * 3, 2 + r() * 3)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 })
}

export function CitySign() {
  useFontsReady() // suspends until the display font is in, so the letters paint in it
  const { x, z, w } = CITY_SIGN
  const word = `HELLO ${CITY_NAME.toUpperCase()}`
  const letters = useMemo(
    () => word.split('').map((ch, i) => (ch === ' ' ? null : { ch, i, m: letterMaterial(ch, LETTER_COLORS[i % LETTER_COLORS.length], UI.CREAM) })),
    [],
  )
  const step = w / word.length
  return (
    // faces the road (+Z), the sea is behind it — the photo everyone takes
    <group position={[x, BASE, z]}>
      <Box s={[w + 0.6, 0.5, 1.4]} p={[0, 0.25, 0]} c={PAL.CONCRETE_WARM} />
      <Sign p={[0, 0.25, 0.72]} w={5.4} h={0.36} spec={{ title: 'YOU ARE HERE', bg: INK, fg: PAL.WALL_BUTTER }} frame={PAL.CONCRETE_WARM} depth={0.04} />
      {letters.map((l) => {
        if (!l) return null
        const lx = -w / 2 + step * (l.i + 0.5)
        const hop = (l.i % 3) * 0.12
        return (
          <group key={l.i} position={[lx, 0.5 + 1.0 + hop, 0]} rotation={[0, ((l.i % 2) - 0.5) * 0.08, 0]}>
            <Box s={[step * 0.94, 2.0, 0.7]} c={LETTER_COLORS[l.i % LETTER_COLORS.length]} />
            <mesh position={[0, 0, 0.36]} material={l.m}>
              <planeGeometry args={[step * 0.84, 1.9]} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

// --- snack row: snack carts on the sand ----------------------------------------------

export function SnackCart(c: Cart) {
  const umbrella = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ map: repeated(stripeTex(c.awning[0], c.awning[1]), 8, 1), roughness: 0.85, side: THREE.DoubleSide })
    return { m, g: new THREE.CylinderGeometry(0.06, 1.7, 0.6, 24, 1, true) }
  }, [c.awning])
  const { w, d } = CART
  return (
    // local +Z faces the promenade
    <group position={[c.x, SAND_Y, c.z]} rotation={[0, c.rot, 0]}>
      {/* cart body on two wheels */}
      <Box s={[w, 0.8, d]} p={[0, 0.85, 0]} c={PAL.WOOD} rough={0.75} />
      <Box s={[w + 0.1, 0.08, d + 0.1]} p={[0, 1.29, 0]} c={PAL.STEEL} rough={0.35} metal={0.6} grade={false} />
      {[-1, 1].map((s) => (
        <Cyl key={s} rt={0.42} h={0.12} p={[s * (w / 2 - 0.4), 0.42, -d / 2 - 0.08]} r={[Math.PI / 2, 0, 0]} c={INK} rough={0.6} grade={false} />
      ))}
      <Box s={[0.08, 0.08, 0.9]} p={[w / 2 + 0.4, 0.95, 0]} c={PAL.WOOD} />
      {/* steel vessels, a glass case and the day's heap */}
      {[-0.75, -0.2].map((vx) => (
        <Cyl key={vx} rt={0.26} rb={0.22} h={0.32} p={[vx, 1.48, 0.15]} c={PAL.STEEL} rough={0.3} metal={0.7} grade={false} />
      ))}
      <Box s={[0.9, 0.5, 0.6]} p={[0.55, 1.58, 0]} c="#9DB7C4" rough={0.15} grade={false} />
      {/* the kerosene lamp: a real light at night */}
      <Cyl rt={0.07} h={0.6} p={[-w / 2 + 0.2, 1.6, -0.3]} c={INK} grade={false} />
      <Box s={[0.22, 0.26, 0.22]} p={[-w / 2 + 0.2, 1.98, -0.3]} material={lampMat()} radius={0.04} />
      {/* painted board across the front */}
      <Sign p={[0, 0.85, d / 2 + 0.07]} w={w - 0.2} h={0.62} spec={{ title: c.title, sub: c.sub, bg: c.bg, fg: c.fg }} frame={PAL.WOOD} depth={0.05} />
      {/* beach umbrella */}
      <Cyl rt={0.04} h={2.9} p={[0, 1.45, -0.2]} c={PAL.WOOD} grade={false} />
      <mesh geometry={umbrella.g} material={umbrella.m} position={[0, 2.95, -0.2]} castShadow receiveShadow />
      {/* two plastic stools for the regulars */}
      {[-0.9, 0.7].map((sx, i) => (
        <group key={sx} position={[sx, 0, d / 2 + 0.9 + i * 0.3]}>
          <Cyl rt={0.2} rb={0.24} h={0.42} p={[0, 0.21, 0]} c={i ? PAL.BUS_BLUE : PAL.FLAME} rough={0.5} grade={false} />
        </group>
      ))}
    </group>
  )
}

// --- fishing boats --------------------------------------------------------------------

function hullGeometry(l: number, w: number, h: number) {
  const s = new THREE.Shape()
  const hl = l / 2
  const hw = w / 2
  s.moveTo(-hl, -hw * 0.82)
  s.lineTo(hl * 0.45, -hw)
  s.quadraticCurveTo(hl * 0.95, -hw * 0.7, hl, 0)
  s.quadraticCurveTo(hl * 0.95, hw * 0.7, hl * 0.45, hw)
  s.lineTo(-hl, hw * 0.82)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 3, curveSegments: 10 })
  g.rotateX(-Math.PI / 2)
  return g
}

export function Boat({ x, z, yaw, hull, band, seed }: { x: number; z: number; yaw: number; hull: string; band: string; seed: number }) {
  const g = useMemo(
    () => ({ hull: hullGeometry(BOAT.l, BOAT.w, 0.75), band: hullGeometry(BOAT.l + 0.06, BOAT.w + 0.06, 0.16), inner: hullGeometry(BOAT.l - 0.6, BOAT.w - 0.45, 0.1) }),
    [],
  )
  const r = rng(seed)
  return (
    // pulled up and resting a little tilted on the sand
    <group position={[x, SAND_Y + 0.12, z]} rotation={[0, yaw, 0.06]}>
      <mesh geometry={g.hull} material={mat(hull, { rough: 0.55 })} castShadow receiveShadow />
      <mesh geometry={g.band} material={mat(band, { rough: 0.55, grade: false })} position={[0, 0.62, 0]} castShadow />
      <mesh geometry={g.inner} material={mat(PAL.INTERIOR, { rough: 0.8, grade: false })} position={[0, 0.82, 0]} />
      {/* thwarts */}
      {[-1.6, 0.2, 1.8].map((tx) => (
        <Box key={tx} s={[0.3, 0.08, BOAT.w - 0.2]} p={[tx, 0.86, 0]} c={PAL.WOOD} rough={0.75} />
      ))}
      {/* outboard motor tipped up at the stern */}
      <group position={[-BOAT.l / 2 - 0.15, 0.8, 0]} rotation={[0, 0, -0.5]}>
        <Box s={[0.45, 0.7, 0.4]} p={[0, 0.35, 0]} c={INK} rough={0.45} grade={false} />
        <Box s={[0.1, 0.8, 0.12]} p={[-0.05, -0.3, 0]} c={PAL.GRILLE} grade={false} />
      </group>
      {/* a heap of nylon net */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} geometry={sphere(0.42 + r() * 0.12, 12, 8)} position={[0.7 + i * 0.32, 0.95, (r() - 0.5) * 0.4]} scale={[1.3, 0.45, 1]} material={mat(i % 2 ? PAL.AUTO_GREEN : PAL.FLAME, { rough: 0.9, grade: false })} />
      ))}
    </group>
  )
}

// --- coconut palms ----------------------------------------------------------------------

function frondGeometry(len: number) {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.quadraticCurveTo(len * 0.45, 0.42, len, 0)
  s.quadraticCurveTo(len * 0.45, -0.42, 0, 0)
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.03, bevelSegments: 1, curveSegments: 8 })
  g.rotateX(Math.PI / 2)
  return g
}

export function Palm({ x, z, s, lean, yaw, seed }: { x: number; z: number; s: number; lean: number; yaw: number; seed: number }) {
  const geo = useMemo(() => ({ inner: frondGeometry(1.9), outer: frondGeometry(2.3) }), [])
  const r = rng(seed)
  const SEG = 7
  const segH = 1.15
  // a gentle curve: each segment leans a little more
  const pts: [number, number, number][] = []
  let px = 0
  let py = 0
  for (let i = 0; i < SEG; i++) {
    const a = lean * (i / SEG) * 1.6
    pts.push([px + (Math.sin(a) * segH) / 2, py + (Math.cos(a) * segH) / 2, a])
    px += Math.sin(a) * segH
    py += Math.cos(a) * segH
  }
  const leaf = mat(PAL.LEAF_MID, { rough: 0.8, grade: false })
  const leafDark = mat(PAL.LEAF_DEEP, { rough: 0.8, grade: false })
  return (
    <group position={[x, SAND_Y, z]} rotation={[0, yaw, 0]} scale={s}>
      {pts.map(([sx, sy, a], i) => (
        <Cyl key={i} rt={0.2 - i * 0.012} rb={0.24 - i * 0.012} h={segH * 1.02} p={[sx, sy, 0]} r={[0, 0, -a]} c={i % 2 ? PAL.TRUNK : '#7A685A'} rough={0.9} grade={false} seg={10} />
      ))}
      <group position={[px, py, 0]}>
        {/* coconuts */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} geometry={sphere(0.2, 10, 8)} position={[Math.cos(i * 1.6) * 0.25, -0.2, Math.sin(i * 1.6) * 0.25]} material={mat(i % 2 ? '#7E8B3A' : '#8A6A3A', { rough: 0.7, grade: false })} castShadow />
        ))}
        {/* fronds: an inner ring rising, an outer ring arching down */}
        {Array.from({ length: 7 }, (_, i) => {
          const a = (i / 7) * Math.PI * 2 + r() * 0.3
          return (
            <group key={`o${i}`} rotation={[0, a, 0]}>
              <group rotation={[0, 0, -0.15 - r() * 0.2]}>
                <mesh geometry={geo.outer} material={i % 2 ? leaf : leafDark} castShadow />
                <group position={[2.2, 0, 0]} rotation={[0, 0, -0.6]}>
                  <mesh geometry={geo.inner} material={i % 2 ? leaf : leafDark} castShadow />
                </group>
              </group>
            </group>
          )
        })}
        {Array.from({ length: 4 }, (_, i) => (
          <group key={`i${i}`} rotation={[0, (i / 4) * Math.PI * 2 + 0.4, 0]}>
            <group rotation={[0, 0, 0.55]}>
              <mesh geometry={geo.inner} material={leaf} castShadow />
            </group>
          </group>
        ))}
      </group>
    </group>
  )
}

// --- the kite seller's stand ----------------------------------------------------------

export function KiteStand() {
  const { x, z } = KITES
  const colors = [PAL.FLAME, PAL.KERB_YELLOW, PAL.BUS_BLUE, PAL.WALL_PINK, PAL.AUTO_GREEN]
  return (
    <group position={[x, SAND_Y, z]}>
      <Box s={[1.6, 0.9, 1]} p={[0, 0.45, 0]} c={PAL.WOOD} rough={0.75} />
      <Cyl rt={0.05} h={3.2} p={[0, 1.6, -0.3]} c={PAL.WOOD} grade={false} />
      <Box s={[1.8, 0.06, 0.06]} p={[0, 2.9, -0.3]} c={PAL.WOOD} grade={false} />
      {/* kites for sale hang from the bar */}
      {colors.map((c, i) => (
        <group key={c} position={[-0.75 + i * 0.38, 2.45, -0.3]} rotation={[0, 0, Math.PI / 4]}>
          <Box s={[0.42, 0.42, 0.02]} c={c} radius={0.01} grade={false} />
        </group>
      ))}
      {/* the anchor stake the flying kites are tied to */}
      <Cyl rt={0.06} h={1.3} p={[0.6, 0.65, 0.6]} c={INK} grade={false} />
    </group>
  )
}

// --- City bus shelter on the inland kerb --------------------------------------------------

export function BusShelter() {
  const { x, z } = BUS_SHELTER
  return (
    // local +Z faces the road (−Z world): signs and the open side toward the traffic
    <group position={[x, BASE, z]} rotation={[0, Math.PI, 0]}>
      {[-2.6, 2.6].map((px) => (
        <Box key={px} s={[0.14, 2.8, 0.14]} p={[px, 1.4, -1.0]} c={PAL.GRILLE} metal={0.4} rough={0.45} grade={false} />
      ))}
      <Box s={[6, 0.16, 2]} p={[0, 2.85, -0.4]} r={[-0.06, 0, 0]} c={PAL.BUS_BLUE} rough={0.5} />
      <Box s={[5.4, 1.8, 0.08]} p={[0, 1.7, -1.35]} c="#9DB7C4" rough={0.15} grade={false} />
      <Box s={[4.4, 0.1, 0.5]} p={[0, 0.5, -1.0]} c={PAL.STEEL} rough={0.35} metal={0.5} grade={false} />
      <Sign p={[0, 3.25, -0.1]} w={4.6} h={0.55} spec={{ title: 'CITY BEACH', bg: PAL.BUS_BLUE, fg: '#FFF6E5' }} frame={PAL.WALL_WHITE} depth={0.06} />
      <group position={[-3.3, 0, -0.6]}>
        <Cyl rt={0.06} h={2.6} p={[0, 1.3, 0]} c={PAL.GRILLE} grade={false} />
        <Sign p={[0, 2.5, 0.05]} w={0.8} h={0.5} spec={{ title: 'BUS', sub: '27D · 21G · 12B', bg: PAL.BUS_BLUE, fg: PAL.KERB_YELLOW }} frame={PAL.WALL_WHITE} depth={0.04} />
      </group>
    </group>
  )
}

// --- ships waiting offshore for the harbour (a Shore horizon) ------------------------------

export function Ships() {
  const ships: [number, number, number, number][] = [
    [-150, -250, 70, 0.1],
    [110, -300, 56, -0.08],
    [-20, -380, 80, 0.04],
  ]
  return (
    <>
      {ships.map(([x, z, l, yaw]) => (
        <group key={x} position={[x, -0.3, z]} rotation={[0, yaw, 0]}>
          <Box s={[l, 4.5, l * 0.16]} p={[0, 2.2, 0]} c={PAL.GRILLE} radius={0.6} grade={false} shadow={false} />
          <Box s={[l * 0.7, 2.6, l * 0.15]} p={[l * 0.05, 5.6, 0]} c={PAL.SIGN_RED} radius={0.4} grade={false} shadow={false} />
          <Box s={[l * 0.13, 7, l * 0.13]} p={[-l * 0.4, 7.5, 0]} c={PAL.WALL_WHITE} radius={0.4} grade={false} shadow={false} />
          <Box s={[l * 0.04, 3, l * 0.04]} p={[-l * 0.4, 12, 0]} c={BRONZE} radius={0.2} grade={false} shadow={false} />
        </group>
      ))}
    </>
  )
}
