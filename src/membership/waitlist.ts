// The pause and its waitlist (CLAUDE.md: PAUSED). Shared by the title screen and /api/waitlist.

/**
 * TEMPORARY (2026-11-14): the city is paused for everyone, members included. The title screen shows the
 * waitlist instead of ENTER; the shore still plays behind it. Set to false and deploy to reopen.
 */
export const CITY_PAUSED = false

/**
 * Off production only: `?unpause` lets you into the paused city, so the game can still be worked on.
 * Never on the production domain.
 */
export function pauseBypassed(search: string, isProduction: boolean): boolean {
  return !isProduction && new URLSearchParams(search).has('unpause')
}

/** Where someone joined from; informational only (the client says it, nothing trusts it). */
export const WAITLIST_SOURCES = ['guest', 'member', 'invite'] as const
export type WaitlistSource = (typeof WAITLIST_SOURCES)[number]

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The stored form of an email (trimmed, lower case), or null when it can't be one. */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const email = raw.trim().toLowerCase()
  return email.length <= 254 && EMAIL.test(email) ? email : null
}

export function waitlistSource(raw: unknown): WaitlistSource {
  return WAITLIST_SOURCES.includes(raw as WaitlistSource) ? (raw as WaitlistSource) : 'guest'
}

/** localStorage key: this browser already joined (the title screen shows "you're on the list"). */
export const WAITLIST_KEY = 'poa.v1.waitlist'