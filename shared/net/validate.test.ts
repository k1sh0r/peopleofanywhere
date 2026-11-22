import { describe, expect, it } from 'vitest'
import { BOUNDS, RUN, SPEED_TOL } from './config'
import { advanceMovementBudget, startMovementBudget } from './validate'

const start = () => startMovementBudget(0, 0, 0)!

describe('movement check', () => {
  it('allows running at full speed, tick after tick', () => {
    let s = start()
    for (let i = 1; i <= 60; i++) {
      // 6 s of running stays inside the district
      s = advanceMovementBudget(s, (RUN * i) / 10, 0, i * 100)!
      expect(s).not.toBeNull()
    }
  })

  it('allows a lag burst: three moves arriving at once', () => {
    let s = advanceMovementBudget(start(), 0.68, 0, 100)!
    s = advanceMovementBudget(s, 1.36, 0, 400)! // 300 ms gap
    s = advanceMovementBudget(s, 2.04, 0, 401)!
    expect(advanceMovementBudget(s, 2.72, 0, 402)).not.toBeNull()
  })

  it('refuses a teleport', () => {
    expect(advanceMovementBudget(start(), 20, 0, 100)).toBeNull()
  })

  it('caps a flood of small steps to the tolerated speed', () => {
    let s = start()
    let t = 0
    let travelled = 0
    // 30 messages a second for 10 s, each trying 1 m
    for (let i = 0; i < 300; i++) {
      t += 1000 / 30
      const next = advanceMovementBudget(s, s.x + 1, 0, t)
      if (next) {
        s = next
        travelled += 1
      }
    }
    expect(travelled).toBeLessThanOrEqual(RUN * SPEED_TOL * 10 + 6)
  })

  it('refuses positions outside the district', () => {
    expect(startMovementBudget(BOUNDS + 1, 0, 0)).toBeNull()
    expect(advanceMovementBudget(startMovementBudget(BOUNDS - 0.1, 0, 0)!, BOUNDS + 0.5, 0, 100)).toBeNull()
    expect(startMovementBudget(NaN, 0, 0)).toBeNull()
  })
})