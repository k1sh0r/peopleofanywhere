#!/usr/bin/env node
// Writes the next step of the paused title screen's top panel numbers into public.city_pulse.
// Optional: run it on any always-on Linux box every couple of minutes (systemd timer: see README.md here).
// The numbers are simulated (step.mjs), not counted; write real counts to public.city_pulse if you can.
// Needs Node 18+ and SUPABASE_URL + SUPABASE_SECRET_KEY in the environment. No dependencies.

import { step } from './step.mjs'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY
if (!url || !key) {
  console.error('[pulse] SUPABASE_URL / SUPABASE_SECRET_KEY not set')
  process.exit(1)
}

const headers = { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' }
const table = `${url.replace(/\/+$/, '')}/rest/v1/city_pulse`

async function main() {
  const got = await fetch(`${table}?id=eq.1&select=*`, { headers })
  if (!got.ok) throw new Error(`read ${got.status}: ${await got.text()}`)
  const [prev] = await got.json()

  const next = step(prev ?? null)
  const put = await fetch(table, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: 1, ...next }),
  })
  if (!put.ok) throw new Error(`write ${put.status}: ${await put.text()}`)

  const { recruiters_online: r, recruiters_total: rt, members_online: m, members_total: mt, waiting: w } = next
  console.log(`[pulse] ${r}/${rt} recruiters · ${m}/${mt} members · ${w} waiting`)
}

main().catch((e) => {
  console.error('[pulse]', e.message)
  process.exit(1)
})