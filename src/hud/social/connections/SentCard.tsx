'use client'

import { intentOf } from '@/social/intents'
import type { Conn } from '@/social/connect'
import { useConnect } from '@/social/connect'
import { Portrait } from './Portrait'
import { ago } from './helpers'

/** You asked: small, out of the way. */
export function SentCard({ c }: { c: Conn }) {
  const i = intentOf(c.intent)
  return (
    <div className="cn-sent">
      <Portrait who={c.other} size="s" />
      <span className="cn-sent-who">
        <b>{c.other.name.toUpperCase()}</b>
        <em>
          {i.emoji} {i.verb} · {ago(c.created_at)}
        </em>
      </span>
      <button className="gate-switch" onClick={() => useConnect.getState().withdraw(c.id)}>
        WITHDRAW
      </button>
    </div>
  )
}
