import { PAL } from '@/config/palette'
import { type AABB, BASE, type BuildingSpec, type ShopSpec, type TreeSpec } from '../units'

// Studio Lane, Design Quarter — one hand-placed intersection (design.md §6.4).
// The N–S road runs along Z, the E–W "Beacon Road" along X. Origin = junction.
//   NE: The Canteen + shop row     NW: Parkview Residency
//   SW: Peepal Labs (startup house)   SE: Studio Lane Park + bus stop

export const QUARTER_ROAD = 5.25 // road half-width to kerb face

export const quarterColliders: AABB[] = []

function box(x0: number, x1: number, z0: number, z1: number, y0 = 0, y1 = 30) {
  quarterColliders.push({
    min: [Math.min(x0, x1), y0, Math.min(z0, z1)],
    max: [Math.max(x0, x1), y1, Math.max(z0, z1)],
  })
}

function footprint(cx: number, cz: number, w: number, d: number, rot: number, y0 = 0, y1 = 30) {
  const swap = Math.abs(Math.sin(rot)) > 0.5
  const hx = (swap ? d : w) / 2
  const hz = (swap ? w : d) / 2
  box(cx - hx, cx + hx, cz - hz, cz + hz, y0, y1)
}

export function quarterGround(x: number, z: number) {
  return Math.abs(x) < QUARTER_ROAD || Math.abs(z) < QUARTER_ROAD ? 0 : BASE
}

// ---------------------------------------------------------------------------

export const QUARTER_CAFE = { x: 14.5, z: -12.5, rot: 0, w: 11, d: 9 }

export const QUARTER_SHOP_Z = -12
export const QUARTER_SHOPS: ShopSpec[] = [
  {
    x: 24,
    floors: 2,
    wall: PAL.WALL_POWDER,
    sign: { title: "CORNER BAKERY", sub: 'HOT CHIPS · CAKES · PUFFS', bg: PAL.KERB_YELLOW, fg: PAL.SIGN_RED },
    shutter: 'open',
    goods: [PAL.WALL_BUTTER, '#C98A3A', PAL.WALL_PINK, PAL.WALL_WHITE],
    balcony: true,
    seed: 101,
  },
  {
    x: 30,
    floors: 2,
    wall: PAL.WALL_PINK,
    sign: { title: 'CITY PHARMACY', sub: 'OPEN 24 HOURS', bg: PAL.AUTO_GREEN, fg: '#FFF6E5' },
    shutter: 'open',
    goods: [PAL.WALL_WHITE, PAL.WALL_POWDER, PAL.AUTO_GREEN, PAL.WALL_SALMON],
    balcony: false,
    seed: 102,
  },
  {
    x: 36,
    floors: 3,
    wall: PAL.WALL_MINT,
    sign: { title: 'PIXEL MOBILES', sub: 'RECHARGE · REPAIR · ACCESSORIES', bg: PAL.FLAME, fg: '#FFF6E5' },
    shutter: 'half',
    goods: [PAL.GRILLE, PAL.BUS_BLUE, PAL.KERB_YELLOW, PAL.WALL_WHITE],
    balcony: true,
    seed: 103,
  },
  {
    x: 42,
    floors: 2,
    wall: PAL.WALL_BUTTER,
    sign: { title: 'NEW STAR TAILORS', sub: 'LADIES & GENTS', bg: PAL.BUS_BLUE, fg: '#FFF6E5' },
    shutter: 'closed',
    goods: [PAL.TERRACOTTA, PAL.WALL_POWDER, PAL.WALL_PINK, PAL.WALL_MINT],
    balcony: false,
    seed: 104,
  },
]

export const QUARTER_APARTMENT: BuildingSpec = {
  x: -16.5,
  z: -16,
  rot: 0,
  w: 14,
  d: 12,
  floors: 5,
  wall: PAL.WALL_BUTTER,
  trim: PAL.WALL_WHITE,
  accent: PAL.TERRACOTTA,
  stilt: true,
  balconies: 'alt',
  tanks: 3,
  seed: 7,
}

export const QUARTER_STARTUP = { x: -15, z: 15, rot: Math.PI }

export const QUARTER_PARK = { x0: 8.6, x1: 32, z0: 8.6, z1: 32, gate: [8.6, 12] as const }

export const QUARTER_BUS_STOP = { x: 24, z: 6.9, rot: Math.PI }

/** Filter & Frame: café + design books in a converted bungalow on Beacon Road (world/Cafe.tsx). Body z 11–19, veranda to z 8.8. */
export const QUARTER_CAFE_HOUSE = { x: -31.5, z: 15, w: 11, d: 8, tables: [[-35.2, 7.4], [-31.8, 7.4]] as [number, number][] }

const H = Math.PI / 2
export const QUARTER_FILLERS: BuildingSpec[] = [
  { x: -14.5, z: -31, rot: H, w: 12, d: 11, floors: 3, wall: PAL.WALL_POWDER, accent: PAL.WALL_WHITE, seed: 3 },
  { x: 14.5, z: -31, rot: -H, w: 12, d: 11, floors: 4, wall: PAL.WALL_SALMON, stilt: true, seed: 4 },
  { x: 14.5, z: -46, rot: -H, w: 12, d: 11, floors: 3, wall: PAL.WALL_MINT, accent: PAL.WALL_BUTTER, seed: 5 },
  { x: -14.5, z: -46, rot: H, w: 12, d: 11, floors: 4, wall: PAL.WALL_PINK, accent: PAL.WALL_WHITE, seed: 6 },
  { x: -14.5, z: 30.5, rot: H, w: 12, d: 11, floors: 3, wall: PAL.WALL_SALMON, accent: PAL.WALL_WHITE, seed: 9 },
  { x: -31.5, z: -14, rot: 0, w: 12, d: 11, floors: 3, wall: PAL.WALL_MINT, accent: PAL.TERRACOTTA, seed: 10 },
  { x: 38.5, z: 14, rot: Math.PI, w: 10, d: 10, floors: 3, wall: PAL.WALL_PINK, accent: PAL.WALL_WHITE, seed: 12, tanks: 1 },
]

export const QUARTER_TREES: TreeSpec[] = [
  { x: 20, z: 20, s: 1.35, seed: 11, kind: 'rain' },
  { x: -6.8, z: -33, s: 1.0, seed: 12, kind: 'rain' },
  { x: 6.8, z: 34, s: 1.05, seed: 13, kind: 'rain' },
  { x: 38, z: -6.8, s: 0.95, seed: 14, kind: 'rain' },
  { x: -34, z: 6.8, s: 1.0, seed: 15, kind: 'rain' },
  { x: 29, z: 12, s: 0.9, seed: 21, kind: 'gulmohar' },
  { x: -22.5, z: 10, s: 0.75, seed: 22, kind: 'gulmohar' },
]

// Electric poles: [x, z, armDirX, armDirZ] — lamp arm points over the road.
export const QUARTER_POLE_RUNS: [number, number, number, number][][] = [
  [-41, -27, -13].map((z) => [-7.3, z, 1, 0]),
  [-41, -27, -13].map((z) => [7.3, z, -1, 0]),
  [13, 27, 41].map((z) => [-7.3, z, 1, 0]),
  [13, 27].map((z) => [7.3, z, -1, 0]), // (no pole at 41 — keeps the portal plaza in clear view)
  [21, 33, 45].map((x) => [x, -7.3, 0, 1]),
  [-41, -27, -13].map((x) => [x, -7.3, 0, 1]),
  [13, 29, 43].map((x) => [x, 7.3, 0, -1]),
  [-41, -27, -13].map((x) => [x, 7.3, 0, -1]),
] as [number, number, number, number][][]

export const QUARTER_LANDMARKS = [
  { x: 24, z: 6.5, r: 3.5, label: 'BUS STOP' },
  { x: 0, z: 0, r: 5.5, label: 'STUDIO LANE JUNCTION' },
  { x: 14.5, z: -9, r: 8, label: 'THE CANTEEN' },
  { x: 34, z: -9, r: 12, label: 'BEACON ROAD' },
  { x: 20, z: 20, r: 13, label: 'STUDIO LANE PARK' },
  { x: -15, z: 11, r: 9, label: 'PEEPAL LABS' },
  { x: -16, z: -11, r: 9, label: 'PARKVIEW RESIDENCY' },
  { x: -31.5, z: 10, r: 7.5, label: 'FILTER & FRAME' },
]

// ---------------------------------------------------------------------------
// Colliders
// ---------------------------------------------------------------------------

// The mess: kitchen block, side walls, mid pillar, counter, upper floor (camera only)
box(9, 20, -17, -11.5)
box(9, 9.4, -11.5, -8)
box(19.6, 20, -11.5, -8)
box(14.25, 14.75, -8.55, -8.05)
box(11.5, 17.5, -11.3, -10.5, 0, 1.2)
box(9, 20, -17, -8, 4.1, 9)
for (const x of [11, 14.5, 18]) box(x - 0.35, x + 0.35, -6.85, -6.15, 0, 1.2)

for (const s of QUARTER_SHOPS) {
  box(s.x - 3, s.x + 3, -16, -11) // back block
  box(s.x - 3, s.x - 2.4, -11, -8) // piers
  box(s.x + 2.4, s.x + 3, -11, -8)
  box(s.x - 2, s.x + 2, -9.1, -8.4, 0, 1.1) // counter
  box(s.x - 3, s.x + 3, -16, -8, 2.8, 14)
}

footprint(QUARTER_APARTMENT.x, QUARTER_APARTMENT.z, QUARTER_APARTMENT.w, QUARTER_APARTMENT.d, 0)
box(-24, -18.2, -8.55, -8.25, 0, 1.6) // compound wall, gate gap -18.2..-14.8
box(-14.8, -8.25, -8.55, -8.25, 0, 1.6)
box(-8.55, -8.25, -24, -8.25, 0, 1.6)

box(-20, -10, 13, 19) // startup house body
box(-20, -10, 11, 19, 3.2, 12) // porch roof (camera)
for (const x of [-18.8, -11.2]) box(x - 0.25, x + 0.25, 11, 11.5)
box(-24, -15.3, 8.25, 8.55, 0, 1.6) // compound wall, gate gap -15.3..-12.7
box(-12.7, -8.25, 8.25, 8.55, 0, 1.6)
box(-8.55, -8.25, 8.25, 24, 0, 1.6)

box(QUARTER_PARK.gate[1], QUARTER_PARK.x1, QUARTER_PARK.z0 - 0.15, QUARTER_PARK.z0 + 0.15, 0, 1.4)
box(QUARTER_PARK.x0 - 0.15, QUARTER_PARK.x0 + 0.15, QUARTER_PARK.z0 + 0.5, QUARTER_PARK.z1, 0, 1.4)
box(QUARTER_PARK.x0, QUARTER_PARK.x1, QUARTER_PARK.z1 - 0.15, QUARTER_PARK.z1 + 0.15, 0, 1.4)
box(QUARTER_PARK.x1 - 0.15, QUARTER_PARK.x1 + 0.15, QUARTER_PARK.z0, QUARTER_PARK.z1, 0, 1.4)
for (const [x, z, r] of [
  [16, 14.5, 0],
  [25, 20, 1],
  [16, 26, 0],
] as const)
  r ? box(x - 0.35, x + 0.35, z - 1.1, z + 1.1, 0, 0.8) : box(x - 1.1, x + 1.1, z - 0.35, z + 0.35, 0, 0.8)

box(21.8, 26.2, 7.2, 7.95, 0, 3) // bus stop back panel + bench
box(21.8, 26.2, 5.6, 7.95, 2.5, 3.2) // roof (camera)

for (const b of QUARTER_FILLERS) footprint(b.x, b.z, b.w, b.d, b.rot)
// Filter & Frame: the bungalow, its veranda columns (walk under the veranda between them), the tables
box(QUARTER_CAFE_HOUSE.x - QUARTER_CAFE_HOUSE.w / 2, QUARTER_CAFE_HOUSE.x + QUARTER_CAFE_HOUSE.w / 2, QUARTER_CAFE_HOUSE.z - QUARTER_CAFE_HOUSE.d / 2, QUARTER_CAFE_HOUSE.z + QUARTER_CAFE_HOUSE.d / 2)
for (const cx of [-QUARTER_CAFE_HOUSE.w / 2 + 0.4, -1.6, 1.6, QUARTER_CAFE_HOUSE.w / 2 - 0.4]) box(QUARTER_CAFE_HOUSE.x - cx - 0.2, QUARTER_CAFE_HOUSE.x - cx + 0.2, 8.8, 9.2)
for (const [tx, tz] of QUARTER_CAFE_HOUSE.tables) box(tx - 0.45, tx + 0.45, tz - 0.45, tz + 0.45, 0, 1.2)

for (const t of QUARTER_TREES) box(t.x - 0.45 * t.s, t.x + 0.45 * t.s, t.z - 0.45 * t.s, t.z + 0.45 * t.s, 0, 4)

for (const run of QUARTER_POLE_RUNS) for (const [x, z] of run) box(x - 0.2, x + 0.2, z - 0.2, z + 0.2, 0, 9)

// ---------------------------------------------------------------------------
// Street life — hand-placed props (design.md §6.2). Every one has a reason.
// ---------------------------------------------------------------------------

export const QUARTER_COCONUT_CART = { x: 6.6, z: 18.2, rot: 0 }

export const QUARTER_SCOOTERS = [
  { x: -20.6, z: -12.4, rot: 0.15, color: PAL.WALL_POWDER }, // apartment stilt parking
  { x: -18.7, z: -12.7, rot: -0.1, color: PAL.SIGN_RED },
  { x: 29.6, z: -6.7, rot: Math.PI + 0.08, color: PAL.WALL_WHITE }, // outside City Pharmacy
  { x: 30.7, z: -6.6, rot: Math.PI - 0.06, color: PAL.RAIL_GREEN },
  { x: 40.2, z: -6.7, rot: Math.PI + 0.1, color: PAL.WALL_BUTTER },
  { x: -11.4, z: 6.9, rot: 0.12, color: PAL.FLAME }, // outside Peepal Labs
]

export const QUARTER_STREET_SIGNS = [
  {
    x: 6.4,
    z: -6.4,
    rot: -Math.PI / 4,
    spec: { title: 'BEACON ROAD', sub: 'STUDIO LANE · DESIGN QUARTER', bg: '#2F6B4F', fg: '#FFF6E5' },
  },
  {
    x: -6.4,
    z: 6.4,
    rot: (3 * Math.PI) / 4,
    spec: { title: '4TH MAIN ROAD', sub: 'STUDIO LANE · DESIGN QUARTER', bg: '#2F6B4F', fg: '#FFF6E5' },
  },
  {
    // Beacon Road runs on toward University Hill and the coast (districts still to come)
    x: 45,
    z: 6.6,
    rot: Math.PI,
    spec: { title: 'UNIVERSITY HILL ▸', sub: 'SOUTH COAST', bg: '#2F6B4F', fg: '#FFF6E5' },
  },
]

export const QUARTER_POSTERS = [
  { x: -12.6, z: -8.27, rot: 0, spec: { title: 'YOGA CLASSES', sub: '6 AM · STUDIO LANE PARK', bg: PAL.KERB_YELLOW, fg: '#1C1F2B' } },
  { x: -10.6, z: -8.27, rot: 0, spec: { title: 'DESIGN MEETUP', sub: 'SAT 11 AM · THE CANTEEN', bg: '#1C1F2B', fg: '#FFB020' } },
  { x: -8.27, z: 16, rot: Math.PI / 2, spec: { title: 'MATHS TUITION', sub: 'STD 1–10 · STATE & CBSE', bg: PAL.WALL_POWDER, fg: '#1C1F2B' } },
  { x: -8.27, z: 19.4, rot: Math.PI / 2, spec: { title: '2BHK FOR RENT', sub: 'NO BACHELORS · CALL 98450 •••••', bg: PAL.WALL_WHITE, fg: PAL.SIGN_RED } },
]

export const QUARTER_RANGOLI = [
  { x: -14.4, z: 7.0, s: 1.3, seed: 1 },
  { x: -16.5, z: -7.0, s: 1.2, seed: 2 },
  { x: 42, z: -7.0, s: 1.1, seed: 3 },
]

export const QUARTER_MANHOLES: [number, number][] = [
  [-2, 26],
  [2.3, -14],
  [-15, -1.5],
  [30, 1.8],
  [-2.4, -36],
]

export const QUARTER_DUSTBIN = { x: -6.3, z: -6.7 }
export const QUARTER_CRATES = { x: 26.7, z: -7.6 }

box(QUARTER_COCONUT_CART.x - 0.65, QUARTER_COCONUT_CART.x + 0.65, QUARTER_COCONUT_CART.z - 1.0, QUARTER_COCONUT_CART.z + 1.5, 0, 2.6)
for (const s of QUARTER_SCOOTERS) box(s.x - 0.4, s.x + 0.4, s.z - 0.95, s.z + 0.95, 0, 1.2)
for (const s of QUARTER_STREET_SIGNS) box(s.x - 0.15, s.x + 0.15, s.z - 0.15, s.z + 0.15, 0, 3)
box(QUARTER_DUSTBIN.x - 0.35, QUARTER_DUSTBIN.x + 0.35, QUARTER_DUSTBIN.z - 0.35, QUARTER_DUSTBIN.z + 0.35, 0, 1)
box(QUARTER_CRATES.x - 0.3, QUARTER_CRATES.x + 0.3, QUARTER_CRATES.z - 0.25, QUARTER_CRATES.z + 0.25, 0, 1)
