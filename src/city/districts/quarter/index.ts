import { quarterColliders, quarterGround, QUARTER_LANDMARKS, QUARTER_PARK, QUARTER_ROAD, QUARTER_TREES } from './layout'
import { portalColliders } from '../units'
import { SPOTS } from '../../people/spots'
import { registerDistrict, type Surface } from '../active'

// Studio Lane, Design Quarter — the first district (layout.ts holds the hand-placed scene).

export const QUARTER_PORTAL = { x: 14.5, z: 40.5, face: -Math.PI / 2 }
const PLINTH = 3.4

function surface(x: number, z: number): Surface {
  if (Math.abs(x) < QUARTER_ROAD || Math.abs(z) < QUARTER_ROAD) return 'asphalt'
  if (x > QUARTER_PARK.x0 && x < QUARTER_PARK.x1 && z > QUARTER_PARK.z0 && z < QUARTER_PARK.z1) {
    const loop = Math.abs(Math.max(Math.abs(x - 20), Math.abs(z - 20)) - 7) < 0.85
    return loop ? 'pavers' : 'grass'
  }
  if (z < -8 && z > -11.6 && x > 9 && x < 45) return 'stone'
  if (x > -20 && x < -10 && z > 10.9 && z < 13.1) return 'stone'
  if (Math.hypot(x - QUARTER_PORTAL.x, z - QUARTER_PORTAL.z) < PLINTH) return 'stone'
  return 'pavers'
}

registerDistrict({
  id: 'quarter',
  colliders: [...quarterColliders, ...portalColliders(QUARTER_PORTAL.x, QUARTER_PORTAL.z, QUARTER_PORTAL.face)],
  ground: (x, z) => quarterGround(x, z) + (Math.hypot(x - QUARTER_PORTAL.x, z - QUARTER_PORTAL.z) < PLINTH ? 0.1 : 0),
  surface,
  landmarks: [{ x: QUARTER_PORTAL.x, z: QUARTER_PORTAL.z, r: 6, label: 'PORTAL PLAZA' }, ...QUARTER_LANDMARKS],
  area: 'STUDIO LANE',
  spawn: { x: 1.6, z: 21, face: Math.PI },
  portal: QUARTER_PORTAL,
  // far enough out that the follow camera sits in front of the portal, not inside it
  arrival: { x: QUARTER_PORTAL.x - 6.5, z: QUARTER_PORTAL.z, face: -Math.PI / 2 },
  spots: SPOTS,
  breaks: [
    ...[11, 14.5, 18].map((x) => ({ x, z: -5.85, face: Math.PI })),
    ...[...SPOTS.mess.slots, ...SPOTS.coconut.slots].map(([x, z, face]) => ({ x, z, face })),
  ],
  trees: QUARTER_TREES.map((t) => ({ x: t.x, z: t.z })),
  radio: [14.5, 2.4, -10.5],
  orbit: [6, 3, -4],
})
