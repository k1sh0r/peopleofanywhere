import { supabase } from '@/platform/supabase'
import { formatMoney } from '@/config/site'
import type { App } from './types'

export const ago = (iso: string | null) => {
  if (!iso) return '—'
  const h = (Date.now() - new Date(iso).getTime()) / 3_600_000
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m ago`
  if (h < 48) return `${Math.round(h)}h ago`
  return `${Math.round(h / 24)}d ago`
}

export const money = (a: App) =>
  a.amount == null ? '—' : formatMoney({ amount: a.amount, currency: a.currency ?? 'USD' })

/** Applicant-supplied links: only http(s) ever becomes an href (no javascript: etc.). */
export const safeUrl = (u?: string | null) => {
  try {
    const x = new URL(u ?? '')
    return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null
  } catch {
    return null
  }
}

const LISTED = /^([^\s@,;]+@[^\s@,;]+\.[^\s@,;]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

/** Emails and application IDs pasted from the CSV (any separator). Two or more = a list, not a search. */
export function pasted(q: string) {
  const tokens = q.trim().toLowerCase().split(/[\s,;"']+/).filter(Boolean)
  const listed = tokens.filter((t) => LISTED.test(t))
  return { tokens, listed: listed.length >= 2 || (listed.length === 1 && tokens.length === 1) ? [...new Set(listed)] : null }
}

/** The search box: a pasted list shows exactly those people; anything else searches name, email, role, company, WhatsApp, ID. */
export function matches(a: App, q: string) {
  const { tokens, listed } = pasted(q)
  if (!tokens.length) return true
  if (listed) return listed.includes(a.email.toLowerCase()) || listed.includes(a.id)
  const p = a.profile
  const hay = [p.name, a.email, p.role, p.company, p.location, a.whatsapp, a.id].filter(Boolean).join(' ').toLowerCase()
  return tokens.every((t) => hay.includes(t))
}

export async function adminToken() {
  const { data } = await supabase!.auth.getSession()
  return data.session?.access_token ?? null
}