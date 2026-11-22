// One step of the paused title screen's top panel numbers (public.city_pulse; claude.md: PAUSED).
// OPTIONAL and SIMULATED: this generates plausible-looking numbers, it does not count anyone. If you run it, visitors
// see invented figures; prefer writing real counts to public.city_pulse instead. Pure: the runner (pulse.mjs)
// reads the row, calls step(), writes the result back.
//
// - waiting, recruiters_total, members_total only ever grow, at a rate that differs per day
// - recruiters_online / members_online random-walk by ±1 at uneven moments, pulled toward a share of their total,
//   so they trend up as the totals grow

const DAY_MS = 86_400_000

/** Growth per day for each count: [min, max]; the day's rate is fixed by the date (same all day). */
export const GROWTH = {
  waiting: [5, 25],
  recruiters_total: [0, 2],
  members_total: [2, 6],
}

/** Online as a share of the total: the walk is pulled toward `share` and kept inside [lo, hi]. */
export const ONLINE = {
  recruiters: { share: 0.4, lo: 0.25, hi: 0.6 },
  members: { share: 0.36, lo: 0.25, hi: 0.55 },
}

/** The starting row, if the table is empty. */
export const SEED = { recruiters_online: 19, recruiters_total: 48, members_online: 67, members_total: 186, waiting: 200 }

/** A day's growth rate for one counter, in [min, max], from the date (a small integer hash). */
export function dailyRate(day, [min, max], salt) {
  let h = (day + 1 + salt * 7919) * 2654435761
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
  h ^= h >>> 16
  return min + (Math.abs(h) % (max - min + 1))
}

/** Whole units to add for `minutes` at `perDay`: the expected amount, with the fraction settled by chance. */
function grow(perDay, minutes, rand) {
  const e = (perDay * minutes) / 1440
  const whole = Math.floor(e)
  return whole + (rand() < e - whole ? 1 : 0)
}

function walk(n, total, { share, lo, hi }, minutes, rand) {
  // about one move every 1–3 minutes; never more than one step per run
  if (rand() > Math.min(1, minutes / 2)) return clamp(n, total, lo, hi)
  const target = total * share
  const pull = Math.max(-0.3, Math.min(0.3, (target - n) / (total * 0.08)))
  const up = rand() < 0.5 + pull
  return clamp(n + (up ? 1 : -1), total, lo, hi)
}

function clamp(n, total, lo, hi) {
  return Math.max(Math.round(total * lo), Math.min(Math.round(total * hi), total - 1, n))
}

/**
 * The next row. `prev` is the stored row (with updated_at), or null for a fresh table.
 * Minutes since the last run are capped at 60, so a machine that slept doesn't jump the numbers.
 */
export function step(prev, now = Date.now(), rand = Math.random) {
  const row = prev ?? { ...SEED, updated_at: new Date(now).toISOString() }
  const last = Date.parse(row.updated_at) || now
  const minutes = Math.min(60, Math.max(0, (now - last) / 60_000))
  const day = Math.floor(now / DAY_MS)

  const next = { ...row }
  let salt = 0
  for (const key of Object.keys(GROWTH)) next[key] = row[key] + grow(dailyRate(day, GROWTH[key], salt++), minutes, rand)
  next.recruiters_online = walk(row.recruiters_online, next.recruiters_total, ONLINE.recruiters, minutes, rand)
  next.members_online = walk(row.members_online, next.members_total, ONLINE.members, minutes, rand)
  next.updated_at = new Date(now).toISOString()
  return next
}