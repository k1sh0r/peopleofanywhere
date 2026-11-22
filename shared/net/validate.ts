import { BOUNDS, BURST_S, MOVE_SLACK, RUN, SPEED_TOL } from './config'

// The room's movement check (CLAUDE.md Phase 8A). A distance budget that refills at the fastest tolerated
// speed: lag bursts (several moves arriving at once) spend saved-up budget, but flooding small steps can't
// add up to more than RUN × SPEED_TOL over time. Pure, so it's tested without a server.

export type MovementBudget = { x: number; z: number; t: number; budget: number }

const RATE = RUN * SPEED_TOL
const CAP = RATE * BURST_S + MOVE_SLACK

export const isWithinDistrict = (x: number, z: number) =>
  Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) <= BOUNDS && Math.abs(z) <= BOUNDS

/** The first position after joining may be anywhere in bounds (spawn, or arriving from the portal). */
export function startMovementBudget(x: number, z: number, t: number): MovementBudget | null {
  return isWithinDistrict(x, z) ? { x, z, t, budget: CAP } : null
}

/** The new state if the move is allowed, otherwise null (the room snaps them back to `prev`). */
export function advanceMovementBudget(prev: MovementBudget, x: number, z: number, t: number): MovementBudget | null {
  if (!isWithinDistrict(x, z)) return null
  const dt = Math.max(0, (t - prev.t) / 1000)
  const budget = Math.min(CAP, prev.budget + dt * RATE)
  const d = Math.hypot(x - prev.x, z - prev.z)
  if (d > budget) return null
  return { x, z, t, budget: budget - d }
}