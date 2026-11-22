import { PAL } from '@/config/palette'
import { BASE, type AABB, type BuildingSpec, type TreeSpec } from '../units'
import { portalColliders } from '../units'

// The Shore — the city's front porch, and the default district (CLAUDE.md Phase 6).
// The beach is compressed hard: the real sand is ~300 m deep, here it's ~34 m,
// enough to feel the openness without walking forever. See reference.md.
//
//   +Z (inland): heritage row behind a compound wall · bus shelter · PORTAL PLAZA (west)
//   Shore Road runs along X — two carriageways + median
//   the promenade: lamps, benches, the big HELLO sign
//   −Z (the sea): sand · snack carts · fishing boats · the lighthouse (east) · the surf

/** Kerb lines (z). */
export const ROAD_N = 23 // inland kerb
export const ROAD_S = 9 // beach-side kerb
export const MEDIAN_Z = 16
export const MEDIAN_W = 0.8 // half-width
export const MEDIAN_GAP = 5 // the U-turn opening in the median (|x|)

/** The promenade's sea edge: a low seat wall with steps down to the sand. */
export const PROM_EDGE = -1
export const STEP_GAPS: [number, number][] = [
  [-27, -23],
  [-4, 0],
  [21, 25],
]

/** Where the surf breaks on average (z); the waves wash ±WASH around it. */
export const SHORE = -32
export const WASH = 2.2
/** Players can wade to here; beyond is the sea. */
export const SEA_STOP = -35.5

export const SAND_Y = 0.04
export const PROM_Y = BASE

export const SHORE_PORTAL = { x: -31, z: 32, face: Math.PI } // faces Shore Road

export const LIGHTHOUSE = { x: 38, z: -7, r: 2.6, h: 34 }
export const CITY_SIGN = { x: -14, z: 3.4, w: 11 }
export const HERITAGE = { x: 13, z: 41.5, w: 40, d: 10 }
export const COMPOUND_Z = 31.5
export const COMPOUND = { x0: -12, x1: 44, gate: [11, 15] as const }
export const BUS_SHELTER = { x: 2, z: 25.2 }

/** Snack row: snack carts on the sand, facing the promenade. */
export type Cart = { x: number; z: number; rot: number; title: string; sub: string; bg: string; fg: string; awning: [string, string]; seed: number }
export const CARTS: Cart[] = [
  { x: -36, z: -9, rot: 0.1, title: 'POPCORN', sub: 'SALTED · CARAMEL · CHEESE', bg: PAL.AUTO_GREEN, fg: '#FFF6E5', awning: [PAL.WALL_WHITE, PAL.AUTO_GREEN], seed: 601 },
  { x: -29, z: -10, rot: -0.05, title: 'HOT FRITTERS', sub: 'HOT · FRESH · 2.00', bg: PAL.SIGN_RED, fg: PAL.WALL_BUTTER, awning: [PAL.WALL_BUTTER, PAL.SIGN_RED], seed: 602 },
  { x: -21.5, z: -9.5, rot: 0.08, title: 'SWEET CORN', sub: 'BUTTER · MASALA · LEMON', bg: PAL.KERB_YELLOW, fg: PAL.SIGN_RED, awning: [PAL.WALL_WHITE, PAL.KERB_YELLOW], seed: 603 },
  { x: -14, z: -10.5, rot: -0.1, title: 'ICE CREAM', sub: 'VANILLA · MANGO · PISTACHIO', bg: PAL.WALL_PINK, fg: '#2B2F45', awning: [PAL.WALL_WHITE, PAL.WALL_PINK], seed: 604 },
]
export const CART = { w: 2.4, d: 1.3 }

/** Fibreglass fishing boats pulled up the sand (x, z, yaw, hull colour, band colour). */
export const BOATS: [number, number, number, string, string][] = [
  [12, -22, 0.35, PAL.BUS_BLUE, PAL.KERB_YELLOW],
  [19, -25, -0.2, PAL.AUTO_GREEN, PAL.WALL_WHITE],
  [26.5, -21.5, 0.6, PAL.WALL_WHITE, PAL.FLAME],
]
export const BOAT = { l: 7.2, w: 1.7 }

/** The kite seller's stand and the kites tethered to it. */
export const KITES = { x: 2, z: -12 }

export const PALMS: { x: number; z: number; s: number; lean: number; yaw: number; seed: number }[] = [
  { x: -42, z: -4, s: 1.05, lean: 0.22, yaw: 2.2, seed: 701 },
  { x: -7.5, z: -17, s: 0.95, lean: 0.3, yaw: -0.6, seed: 702 },
  { x: 30, z: -13, s: 1.1, lean: 0.18, yaw: 0.9, seed: 703 },
  { x: 44, z: -20, s: 0.9, lean: 0.34, yaw: 2.8, seed: 704 },
  { x: -40, z: -19, s: 0.85, lean: 0.26, yaw: -1.4, seed: 705 },
]

/** Rain trees on the inland pavement and in the heritage lawn; gulmohars beside the portal plaza. */
export const SHORE_TREES: TreeSpec[] = [
  ...[-6, 26, 40].map((x, i) => ({ x, z: 26.2, s: 1.0, seed: 801 + i, kind: 'rain' as const })),
  { x: -10, z: 35, s: 1.2, seed: 811, kind: 'rain' },
  { x: 39, z: 35.5, s: 1.15, seed: 812, kind: 'rain' },
  { x: -40, z: 27, s: 0.75, seed: 821, kind: 'gulmohar' },
  { x: -22, z: 38, s: 0.85, seed: 822, kind: 'gulmohar' },
]

/** Promenade lamp posts (x) — a row along the road kerb, lamps facing the walk. */
export const LAMPS_X = [-42, -30, -18, -6, 6, 18, 30]
export const LAMP_Z = 7.7

/** Blocks framing the portal plaza — not hero buildings. */
export const SHORE_FILLERS: BuildingSpec[] = [
  { x: -31, z: 42, rot: Math.PI, w: 14, d: 8, floors: 3, wall: PAL.WALL_BUTTER, accent: PAL.TERRACOTTA, tanks: 2, balconies: 'alt', seed: 851 },
]

export const BENCHES_X = [-36, -12, 10, 32]

/** Ground height: road at 0, pavements and promenade at BASE, sand just above the road. */
export function shoreGround(x: number, z: number) {
  if (z > ROAD_S && z < ROAD_N) return Math.abs(z - MEDIAN_Z) < MEDIAN_W && Math.abs(x) > MEDIAN_GAP ? BASE + 0.05 : 0
  if (z >= ROAD_N) return BASE
  if (z >= PROM_EDGE) return PROM_Y
  return SAND_Y
}

// --- colliders ---------------------------------------------------------------

export const shoreColliders: AABB[] = []
const box = (x0: number, x1: number, z0: number, z1: number, y0 = 0, y1 = 30) =>
  shoreColliders.push({ min: [Math.min(x0, x1), y0, Math.min(z0, z1)], max: [Math.max(x0, x1), y1, Math.max(z0, z1)] })

// the sea: wade to SEA_STOP, no further
box(-60, 60, -60, SEA_STOP, 0, 6)
// promenade seat wall, with its step gaps
{
  let from = -60
  for (const [a, b] of STEP_GAPS) {
    box(from, a, PROM_EDGE - 0.35, PROM_EDGE + 0.35, 0, 0.6)
    from = b
  }
  box(from, 60, PROM_EDGE - 0.35, PROM_EDGE + 0.35, 0, 0.6)
}
// lighthouse + keeper's lodge
box(LIGHTHOUSE.x - LIGHTHOUSE.r - 0.6, LIGHTHOUSE.x + LIGHTHOUSE.r + 0.6, LIGHTHOUSE.z - LIGHTHOUSE.r - 0.6, LIGHTHOUSE.z + LIGHTHOUSE.r + 0.6)
box(LIGHTHOUSE.x - 6.5, LIGHTHOUSE.x - 2.6, LIGHTHOUSE.z - 2, LIGHTHOUSE.z + 2, 0, 4)
// HELLO letters
box(CITY_SIGN.x - CITY_SIGN.w / 2, CITY_SIGN.x + CITY_SIGN.w / 2, CITY_SIGN.z - 0.6, CITY_SIGN.z + 0.6, 0, 3)
// heritage row + its compound wall (gate gap) + the side walls
box(HERITAGE.x - HERITAGE.w / 2 - 1.5, HERITAGE.x + HERITAGE.w / 2 + 1.5, HERITAGE.z - HERITAGE.d / 2 - 0.5, 60)
box(COMPOUND.x0, COMPOUND.gate[0], COMPOUND_Z - 0.2, COMPOUND_Z + 0.2, 0, 2)
box(COMPOUND.gate[1], COMPOUND.x1, COMPOUND_Z - 0.2, COMPOUND_Z + 0.2, 0, 2)
box(COMPOUND.x0 - 0.2, COMPOUND.x0 + 0.2, COMPOUND_Z, HERITAGE.z, 0, 2)
// bus shelter roof posts + bench
box(BUS_SHELTER.x - 3, BUS_SHELTER.x + 3, BUS_SHELTER.z + 0.6, BUS_SHELTER.z + 1.4, 0, 3)
// carts, boats, kite stand, benches, lamps, palms, trees
for (const c of CARTS) box(c.x - CART.w / 2, c.x + CART.w / 2, c.z - CART.d / 2, c.z + CART.d / 2, 0, 3)
for (const [x, z, yaw] of BOATS) {
  const hx = Math.abs(Math.cos(yaw)) * BOAT.l * 0.5 + Math.abs(Math.sin(yaw)) * BOAT.w * 0.5
  const hz = Math.abs(Math.sin(yaw)) * BOAT.l * 0.5 + Math.abs(Math.cos(yaw)) * BOAT.w * 0.5
  box(x - hx * 0.85, x + hx * 0.85, z - hz * 0.85, z + hz * 0.85, 0, 1.4)
}
box(KITES.x - 0.9, KITES.x + 0.9, KITES.z - 0.6, KITES.z + 0.6, 0, 3)
for (const x of BENCHES_X) box(x - 1.1, x + 1.1, PROM_EDGE + 0.6, PROM_EDGE + 1.3, 0, 0.8)
for (const x of LAMPS_X) box(x - 0.25, x + 0.25, LAMP_Z - 0.25, LAMP_Z + 0.25, 0, 9)
for (const b of SHORE_FILLERS) box(b.x - b.w / 2, b.x + b.w / 2, b.z - b.d / 2, b.z + b.d / 2)
for (const p of PALMS) box(p.x - 0.35, p.x + 0.35, p.z - 0.35, p.z + 0.35, 0, 4)
for (const t of SHORE_TREES) {
  const r = t.kind === 'gulmohar' ? 0.3 : 0.45 * t.s
  box(t.x - r, t.x + r, t.z - r, t.z + r, 0, 4)
}
shoreColliders.push(...portalColliders(SHORE_PORTAL.x, SHORE_PORTAL.z, SHORE_PORTAL.face))
