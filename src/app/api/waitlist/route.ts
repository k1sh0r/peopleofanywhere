import { normalizeEmail, waitlistSource } from '@/membership/waitlist'
import { admin, json } from '@/server/supabaseAdmin'

// The waitlist while the city is paused (src/membership/waitlist.ts). Anyone may join; no account is made and
// no email is sent. Joining twice is fine: the second time changes nothing and still answers ok, so the
// response never tells anyone whether an address was already on the list.

export async function POST(req: Request) {
  const raw = await req.text()
  if (raw.length > 1000) return json({ ok: false, state: 'invalid' }, 413)
  let body: { email?: unknown; source?: unknown }
  try {
    body = JSON.parse(raw)
  } catch {
    return json({ ok: false, state: 'invalid' }, 400)
  }
  const email = normalizeEmail(body.email)
  if (!email) return json({ ok: false, state: 'invalid' }, 400)

  const { error } = await admin()
    .from('waitlist')
    .upsert({ email, source: waitlistSource(body.source) }, { onConflict: 'email', ignoreDuplicates: true })
  if (error) {
    console.error('[waitlist] insert', error)
    return json({ ok: false, state: 'error' }, 500)
  }
  return json({ ok: true })
}