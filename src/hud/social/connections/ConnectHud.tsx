'use client'

import { useEffect, useState } from 'react'
import { useConnect } from '@/social/connect'
import { useDirectory } from '@/city/people/directory'
import { useGame } from '@/city/core/store'
import { firstName, plural } from './helpers'

/** HUD button with the badge. Members only. */
/** How often the bell reminds you of something unseen. */
const NUDGE_MS = 40_000

/**
 * Top right, beside FIND SOMEONE: the connections button (5G-C). It says what's waiting in
 * words, not a red dot: "PRIYA WANTS TO MEET" when it arrives (the bell swings), then a short
 * summary ("1 REQUEST · 1 MATCH") until you open it. [C] on desktop, like FIND SOMEONE [F].
 */
export function ConnectHud() {
  const member = useDirectory((s) => s.me?.status === 'approved')
  const items = useConnect((s) => s.items)
  const ring = useConnect((s) => s.ring)
  const [announce, setAnnounce] = useState<{ text: string; kind: 'ask' | 'match' } | null>(null)
  const [nudge, setNudge] = useState(0)
  const unseen = items.filter((c) => (!c.seen && ((c.dir === 'in' && c.state === 'pending') || (c.dir === 'out' && c.state === 'matched'))) || c.unread > 0).length

  // a reminder: while something you haven't seen waits, the bell swings again every 40 s —
  // silently (the chime only plays when it first arrives), never over a menu, and it stops
  // once you open the tray (that marks everything seen)
  useEffect(() => {
    if (!unseen) return
    const id = setInterval(() => {
      const g = useGame.getState()
      const busy = g.phase !== 'play' || !!g.openId || g.searchOpen || g.paused || g.connectOpen || g.statusOpen || g.invitesOpen || g.profileOpen || !!g.travel
      if (!busy && document.visibilityState === 'visible') setNudge((n) => n + 1)
    }, NUDGE_MS)
    return () => clearInterval(id)
  }, [unseen])

  // something arrived: name it for a few seconds, then settle to the summary
  useEffect(() => {
    if (!ring) return
    setNudge(0) // the arrival's own swing (a match rings bigger) takes over from reminders
    const s = useConnect.getState()
    const c =
      s.arrival?.conn ??
      [...s.items]
        .filter((x) => (ring.kind === 'match' ? x.state === 'matched' && x.dir === 'out' : x.state === 'pending' && x.dir === 'in'))
        .sort((x, y) => (y.decided_at ?? y.created_at).localeCompare(x.decided_at ?? x.created_at))[0]
    if (!c) return
    setAnnounce({ text: ring.kind === 'match' ? `IT’S A MATCH · ${firstName(c.other.name)}` : `${firstName(c.other.name)} WANTS TO MEET`, kind: ring.kind })
    const id = setTimeout(() => setAnnounce(null), 8000)
    return () => clearTimeout(id)
  }, [ring])

  if (!member) return null
  const asks = items.filter((c) => c.dir === 'in' && c.state === 'pending').length
  const matches = items.filter((c) => c.dir === 'out' && c.state === 'matched' && !c.seen).length
  const msgs = items.reduce((n, c) => n + (c.state === 'matched' ? c.unread : 0), 0)
  const summary = [asks && plural(asks, 'REQUEST', 'REQUESTS'), matches && plural(matches, 'MATCH', 'MATCHES'), msgs && plural(msgs, 'MESSAGE', 'MESSAGES')]
    .filter(Boolean)
    .join(' · ')
  const label = announce?.text ?? summary
  const short = asks + matches + msgs > 0 ? `${asks + matches + msgs} NEW` : ''
  const isMatch = announce ? announce.kind === 'match' : matches > 0 && !asks
  return (
    <button
      className={`slant hud-find hud-bell${label ? ' hud-bell--news' : ''}${isMatch ? ' hud-bell--match' : ''}`}
      onClick={() => useConnect.getState().openTray()}
      aria-label={label ? `Connections: ${label}` : 'Connections'}
    >
      {ring && <span key={`p${ring.n}`} className={`hud-bell-ping hud-bell-ping--${ring.kind}`} />}
      {label && <span className="hud-bell-shine" aria-hidden />}
      <span className="unslant">
        <svg
          key={`g${ring?.n ?? 0}-${nudge}`}
          className={`hud-bell-glyph${ring || nudge ? ` hud-bell-glyph--${nudge ? 'ask' : ring!.kind}` : ''}`}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path d="M12 2.4a1.7 1.7 0 0 1 1.7 1.7v.45c3 .72 5 3.3 5 6.45v3.1l1.95 2.65c.42.57.01 1.38-.7 1.38H4.05c-.71 0-1.12-.81-.7-1.38l1.95-2.65V11c0-3.15 2-5.73 5-6.45V4.1A1.7 1.7 0 0 1 12 2.4Z" />
          <path d="M9.4 19.2h5.2a2.6 2.6 0 0 1-5.2 0Z" />
        </svg>
        {label && (
          <span className="hud-bell-label" key={label}>
            <span className="hud-bell-long">{label}</span>
            <span className="hud-bell-short">{short}</span>
          </span>
        )}
        <span className="keycap">C</span>
      </span>
    </button>
  )
}
