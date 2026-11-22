'use client'

import { useState } from 'react'
import { intentOf } from '@/social/intents'
import type { Conn } from '@/social/connect'
import { useConnect } from '@/social/connect'
import { useGame } from '@/city/core/store'
import { placeName } from '@/city/districts/registry'
import { Portrait } from './Portrait'
import { ago } from './helpers'

/** Someone asked you: who, why, what they said — then one clear decision. */
export function AskCard({ c, focus, i: idx }: { c: Conn; focus: boolean; i: number }) {
  const busy = useConnect((s) => s.busy)
  const [leaving, setLeaving] = useState(false)
  const i = intentOf(c.intent)
  const notNow = () => {
    setLeaving(true)
    setTimeout(async () => {
      await useConnect.getState().respond(c.id, false)
      useGame.getState().showToast('NOT NOW · THEY WON’T BE TOLD', 'info')
    }, 220)
  }
  return (
    <div
      className={`cn-card${focus ? ' cn-card--focus' : ''}${!c.seen ? ' cn-card--new' : ''}${leaving ? ' cn-card--out' : ''}`}
      style={{ ['--i' as string]: idx }}
      data-id={c.id}
    >
      <div className="cn-card-main">
        <div className="cn-card-head">
          <Portrait who={c.other} />
          <span className="cn-card-who">
            <b>{c.other.name.toUpperCase()}</b>
            <em>
              {c.other.role} · {placeName(c.other.location)}
            </em>
          </span>
          <small className="cn-card-ago">{ago(c.created_at)}</small>
        </div>
        <span className="cn-chip">
          <span className="cn-chip-e">{i.emoji}</span> {i.label}
        </span>
        {c.note && <p className="cn-bubble">{c.note}</p>}
      </div>
      <div className="cn-foot">
        <button className="cn-foot-btn" disabled={busy || leaving} onClick={notNow}>
          <span>NOT NOW</span>
        </button>
        <button className="cn-foot-btn cn-foot-btn--go" disabled={busy || leaving} onClick={() => useConnect.getState().respond(c.id, true)}>
          <span>ACCEPT ▸</span>
        </button>
      </div>
    </div>
  )
}
