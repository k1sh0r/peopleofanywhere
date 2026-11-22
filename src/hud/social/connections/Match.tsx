'use client'

import { intentOf } from '@/social/intents'
import type { Conn } from '@/social/connect'
import { useDirectory } from '@/city/people/directory'
import { openThread } from '@/social/chat'

/** IT'S A MATCH — both said yes; the chat opens from here. */
export function Match({ c, onBack }: { c: Conn; onBack: () => void }) {
  const me = useDirectory((s) => s.me)
  const i = intentOf(c.intent)
  return (
    <div className="cn-match">
      <span className="gate-chip gate-chip--open">
        <span className="np-dot" /> IT’S A MATCH
      </span>
      <div className="cn-pair">
        <span>{(me?.name ?? 'YOU').toUpperCase()}</span>
        <span className="cn-pair-e">{i.emoji}</span>
        <span>{c.other.name.toUpperCase()}</span>
      </div>
      <h2 className="cr-title cn-match-title">BOTH OF YOU WANT TO {i.label}.</h2>
      <p className="cr-copy">Say hi — you both want to {i.verb}, so you’re expected. Suggest a time and a place.</p>
      <div className="cr-nav">
        <button className="pp-btn slant cr-back" onClick={onBack}>
          <span className="unslant">◀ ALL CONNECTIONS</span>
        </button>
        <button className="btn-primary slant cr-next" onClick={() => void openThread(c.id)}>
          <span className="unslant">SAY HI ▸</span>
        </button>
      </div>
    </div>
  )
}
