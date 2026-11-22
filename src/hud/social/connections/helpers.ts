import { useDirectory } from '@/city/people/directory'
import { LOCALE } from '@/config/site'

export const isMemberNow = () => useDirectory.getState().me?.status === 'approved'

export function ago(iso: string) {
  const s = (Date.now() - Date.parse(iso)) / 1000
  if (s < 60) return 'JUST NOW'
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}M AGO`
  if (s < 86400) return `${Math.round(s / 3600)}H AGO`
  return `${Math.round(s / 86400)}D AGO`
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
export const firstName = (name: string) => name.split(/\s+/)[0].toUpperCase()

/** A chat's time, messenger style: 4:12 PM today, YESTERDAY, then the date. */
export function stamp(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((day(now) - day(d)) / 86_400_000)
  if (days <= 0) return d.toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' }).toUpperCase()
  if (days === 1) return 'YESTERDAY'
  if (days < 7) return d.toLocaleDateString(LOCALE, { weekday: 'short' }).toUpperCase()
  return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' }).toUpperCase()
}

/** An unread count for a bubble: exact up to 99, then 99+ (Slack, Discord, iOS). */
export const count = (n: number) => (n > 99 ? '99+' : String(n))