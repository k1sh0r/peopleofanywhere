import { registerDistrict, type Surface } from '../active'
import {
  BOATS,
  CARTS,
  COMPOUND,
  COMPOUND_Z,
  HERITAGE,
  KITES,
  LIGHTHOUSE,
  SHORE_PORTAL,
  SHORE_TREES,
  MEDIAN_GAP,
  MEDIAN_W,
  MEDIAN_Z,
  CITY_SIGN,
  PALMS,
  PROM_EDGE,
  ROAD_N,
  ROAD_S,
  SHORE,
  BUS_SHELTER,
  shoreColliders,
  shoreGround,
} from './layout'

// The Shore — the beach, the lighthouse, the city's front porch. The default district.

function surface(x: number, z: number): Surface {
  if (z > ROAD_S && z < ROAD_N) return Math.abs(z - MEDIAN_Z) < MEDIAN_W && Math.abs(x) > MEDIAN_GAP ? 'pavers' : 'asphalt'
  if (Math.hypot(x - SHORE_PORTAL.x, z - SHORE_PORTAL.z) < 3.4) return 'stone'
  if (z > COMPOUND_Z && x > COMPOUND.x0 && x < HERITAGE.x + HERITAGE.w / 2 + 3) return 'grass' // the heritage lawn
  if (z >= PROM_EDGE) return 'pavers'
  return 'sand'
}

const cart = (i: number, dx: number, face: number): [number, number, number] => [CARTS[i].x + dx, CARTS[i].z + 1.9, face]

registerDistrict({
  id: 'shore',
  colliders: shoreColliders,
  ground: (x, z) => shoreGround(x, z) + (Math.hypot(x - SHORE_PORTAL.x, z - SHORE_PORTAL.z) < 3.4 ? 0.1 : 0),
  surface,
  landmarks: [
    { x: SHORE_PORTAL.x, z: SHORE_PORTAL.z, r: 6, label: 'PORTAL PLAZA' },
    { x: LIGHTHOUSE.x - 2, z: LIGHTHOUSE.z, r: 9, label: 'THE LIGHTHOUSE' },
    { x: CITY_SIGN.x, z: CITY_SIGN.z, r: 7, label: 'THE BIG LETTERS' },
    { x: -25, z: -9.5, r: 10, label: 'SNACK ROW' },
    { x: 19, z: -23, r: 9, label: 'FISHING BOATS' },
    { x: KITES.x, z: KITES.z, r: 5, label: 'KITE SELLER' },
    { x: BUS_SHELTER.x, z: BUS_SHELTER.z, r: 5, label: 'BEACH BUS STOP' },
    { x: HERITAGE.x, z: 38, r: 22, label: 'HERITAGE ROW' },
    // (circles can't follow a straight beach: the waterline gets a few, the road keeps the area name)
    ...[-30, -10, 10].map((x) => ({ x, z: SHORE + 1, r: 7, label: 'THE SHORE' })),
  ],
  area: 'CITY BEACH',
  // (SHORE ROAD is the road; it reads from the street signs, not the HUD)
  // first look: from the promenade, out over the sand to the sea, the lighthouse to the right
  spawn: { x: 0, z: 4.5, face: Math.PI },
  portal: SHORE_PORTAL,
  arrival: { x: SHORE_PORTAL.x, z: SHORE_PORTAL.z - 6.5, face: Math.PI },
  spots: {
    'shore-snacks': { label: 'SNACK ROW', blurb: 'Fritters and popcorn on the sand', slots: [cart(1, -0.6, Math.PI), cart(0, 0.5, Math.PI + 0.3), cart(2, 0.4, Math.PI - 0.3)] },
    'shore-lighthouse': { label: 'THE LIGHTHOUSE', blurb: 'At the foot of the lighthouse', slots: [[LIGHTHOUSE.x - 5, LIGHTHOUSE.z + 4.2, 0.4], [LIGHTHOUSE.x - 1, LIGHTHOUSE.z + 5.2, -0.2], [LIGHTHOUSE.x - 8.5, LIGHTHOUSE.z + 2.6, 0.9]] },
    'shore-sign': { label: 'THE BIG LETTERS', blurb: 'In front of the big letters', slots: [[CITY_SIGN.x - 3, CITY_SIGN.z + 2.6, Math.PI], [CITY_SIGN.x + 2, CITY_SIGN.z + 2.9, Math.PI + 0.3], [CITY_SIGN.x + 6.5, CITY_SIGN.z + 2.2, Math.PI - 0.5]] },
    'shore-promenade': { label: 'THE PROMENADE', blurb: 'On the seat wall, watching the sea', slots: [[8, PROM_EDGE + 1.5, Math.PI], [30, PROM_EDGE + 1.5, Math.PI + 0.2], [-34, PROM_EDGE + 1.6, Math.PI - 0.2]] },
    'shore-shore': { label: 'THE SHORE', blurb: 'Feet in the water', slots: [[-12, SHORE + 3.5, Math.PI], [-4, SHORE + 3.2, Math.PI + 0.4], [4, SHORE + 3.8, Math.PI - 0.3]] },
    'shore-boats': { label: 'FISHING BOATS', blurb: 'Among the boats on the sand', slots: [[BOATS[0][0] - 2.5, BOATS[0][1] + 3, 0.6], [BOATS[1][0] + 1, BOATS[1][1] + 3.2, -0.2], [BOATS[2][0] - 1.5, BOATS[2][1] + 3, 2.8]] },
  },
  breaks: [
    // at the carts (face = the cart's front, looking back at it)
    ...CARTS.map((c) => ({ x: c.x, z: c.z + 1.8, face: Math.PI + c.rot })),
    { x: KITES.x, z: KITES.z + 1.6, face: Math.PI },
  ],
  trees: [...SHORE_TREES.map((t) => ({ x: t.x, z: t.z })), ...PALMS.map((p) => ({ x: p.x, z: p.z }))],
  radio: [CARTS[1].x, 1.8, CARTS[1].z],
  orbit: [0, 3, -6],
  shore: SHORE,
})
