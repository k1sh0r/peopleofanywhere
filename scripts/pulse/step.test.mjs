import { describe, expect, it } from 'vitest'
import { SEED, dailyRate, step } from './step.mjs'

const MIN = 60_000
const DAY = 1440 * MIN
const T0 = Date.UTC(2026, 10, 15)

/** Runs the script every 2 minutes for `days`, as the timer would. */
function run(days, from = null) {
  const rows = []
  let row = from
  for (let t = T0; t < T0 + days * DAY; t += 2 * MIN) {
    row = step(row, t)
    rows.push(row)
  }
  return rows
}

describe('step', () => {
  it('starts from the seed', () => {
    const first = step(null, T0)
    expect(first.recruiters_total).toBe(SEED.recruiters_total)
    expect(first.members_total).toBe(SEED.members_total)
    expect(first.waiting).toBe(SEED.waiting)
  })

  it('never lowers waiting or the totals', () => {
    const rows = run(10)
    for (let i = 1; i < rows.length; i++) {
      for (const k of ['waiting', 'recruiters_total', 'members_total']) expect(rows[i][k]).toBeGreaterThanOrEqual(rows[i - 1][k])
    }
  })

  it('grows waiting about 5–25 a day', () => {
    const rows = run(20)
    const perDay = (rows.at(-1).waiting - SEED.waiting) / 20
    expect(perDay).toBeGreaterThan(5)
    expect(perDay).toBeLessThan(25)
  })

  it('moves the online counts by at most 1 a run, always below the total', () => {
    const rows = run(10)
    for (let i = 1; i < rows.length; i++) {
      for (const [n, total] of [['recruiters_online', 'recruiters_total'], ['members_online', 'members_total']]) {
        expect(Math.abs(rows[i][n] - rows[i - 1][n])).toBeLessThanOrEqual(1)
        expect(rows[i][n]).toBeLessThan(rows[i][total])
      }
    }
  })

  it('trends the online counts up over weeks', () => {
    const rows = run(45)
    const avg = (from, to, k) => rows.slice(from, to).reduce((s, r) => s + r[k], 0) / (to - from)
    const day = 720 // runs per day
    for (const k of ['recruiters_online', 'members_online']) expect(avg(44 * day, 45 * day, k)).toBeGreaterThan(avg(0, day, k))
  })

  it('does not jump after the machine slept', () => {
    const before = step(null, T0)
    const after = step(before, T0 + 3 * DAY)
    expect(after.waiting - before.waiting).toBeLessThanOrEqual(2)
  })

  it('picks a different rate on different days', () => {
    expect(new Set(Array.from({ length: 14 }, (_, d) => dailyRate(d, [5, 25], 0))).size).toBeGreaterThan(5)
  })
})