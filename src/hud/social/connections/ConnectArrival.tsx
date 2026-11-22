'use client'

import { useEffect, useState } from 'react'
import { intentOf } from '@/social/intents'
import { useConnect } from '@/social/connect'
import { useGame } from '@/city/core/store'
import { isTouch } from '@/city/core/device'
import { Portrait } from './Portrait'

/** Slides in from the right when a request or match arrives while you play (5G-C). */
export function ConnectArrival() {
  const arrival = useConnect((s) => s.arrival)
  const busy = useGame((s) => s.phase !== 'play' || !!s.openId || s.searchOpen || s.paused || s.connectOpen || !!s.travel || s.statusOpen || s.invitesOpen || s.profileOpen)
  const [hold, setHold] = useState(false)
  useEffect(() => {
    if (!arrival || hold) return
    const id = setTimeout(() => useConnect.getState().dismissArrival(), 6500)
    return () => clearTimeout(id)
  }, [arrival, hold])
  if (!arrival || busy) return null
  const { conn: c, more } = arrival
  const i = intentOf(c.intent)
  const matched = c.state === 'matched'
  const view = () => (matched ? useConnect.getState().showMatch(c.id) : useConnect.getState().openTray(c.id))
  const accept = async () => {
    useConnect.getState().dismissArrival()
    await useConnect.getState().respond(c.id, true)
  }
  return (
    <div
      className={`cn-arrive slant${matched ? ' cn-arrive--match' : ''}`}
      key={c.id + c.state}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      role="status"
    >
      <span className="unslant cn-arrive-body">
        <span className="cn-arrive-top">
          <Portrait who={c.other} />
          <span className="cn-arrive-who">
            <span className="cn-arrive-k">{matched ? 'IT’S A MATCH' : 'WANTS TO MEET YOU'}</span>
            <b>{c.other.name.toUpperCase()}</b>
            <span className="cn-arrive-intent">
              <span className="cn-arrive-e">{i.emoji}</span> {matched ? `You both want to ${i.verb}` : `wants to ${i.verb}`}
            </span>
          </span>
          <button className="cn-arrive-x" onClick={() => useConnect.getState().dismissArrival()} aria-label="Dismiss">
            ×
          </button>
        </span>
        {!matched && c.note && <q className="cn-arrive-note">{c.note}</q>}
        <span className="cn-arrive-actions">
          {!matched && (
            <button className="pp-btn slant pp-btn--primary cn-btn" onClick={accept}>
              <span className="unslant">ACCEPT</span>
            </button>
          )}
          <button className={`pp-btn slant cn-btn${matched ? ' pp-btn--primary' : ''}`} onClick={view}>
            <span className="unslant">
              VIEW {!isTouch && <span className="keycap">C</span>}
            </span>
          </button>
          {more > 0 && <span className="cn-arrive-more">+{more} more</span>}
        </span>
      </span>
    </div>
  )
}
