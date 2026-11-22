import type { Profile } from './profiles'

// Built-in residents are real people shown before they have an account (profiles.ts). The moment the
// real person joins, their built-in stand-in has to go, or they would be in the city twice.

/** "https://x.com/Kavyar/", "@kavyar", "kavyar" → "kavyar". */
export function xHandle(x: string | undefined): string {
  if (!x) return ''
  const m = x.trim().match(/^(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/([^/?#]+)/i)
  return (m ? m[1] : x.trim()).replace(/^@/, '').toLowerCase()
}

/** "https://www.Nila.design/" → "nila.design": a site address without protocol, www, query or trailing slash. */
export function siteKey(url: string | undefined): string {
  if (!url) return ''
  return url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[?#].*$/, '').replace(/\/+$/, '')
}

const sameName = (a: string, b: string) => a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase()

/** True when one of the real members is this resident: the same X handle, the same site, or the same name. */
export function hasJoined(resident: Profile, real: Profile[]): boolean {
  const handle = xHandle(resident.links.x)
  const site = siteKey(resident.links.portfolio)
  return real.some(
    (m) =>
      (handle !== '' && xHandle(m.links.x) === handle) ||
      (site !== '' && siteKey(m.links.portfolio) === site) ||
      sameName(m.name, resident.name),
  )
}

/** The residents still to be shown: everyone whose real self hasn't joined yet. */
export const residentsToShow = (residents: Profile[], real: Profile[]): Profile[] =>
  residents.filter((r) => !hasJoined(r, real)).map((r) => ({ ...r, resident: true }))
