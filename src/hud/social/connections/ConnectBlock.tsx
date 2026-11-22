'use client'

import { useEffect, useState } from 'react'
import { intentOf } from '@/social/intents'
import { connWith, useConnect } from '@/social/connect'
import type { Profile } from '@/city/people/profiles'
import { useDirectory } from '@/city/people/directory'
import { useOnboarding } from '@/profile/onboarding'
import { useGame } from '@/city/core/store'
import { openThread } from '@/social/chat'
import { ago } from './helpers'

/** Profile panel: CONNECT and its state with this one person. Sending a request opens ConnectFlow. */
export function ConnectBlock({ p, onConnect }: { p: Profile; onConnect: () => void }) {
  const member = useDirectory((s) => s.me?.status === 'approved')
  const signedIn = useDirectory((s) => !!s.me)
  const items = useConnect((s) => s.items)
  const busy = useConnect((s) => s.busy)
  const c = connWith(items, p.id)
  const [err, setErr] = useState<string | null>(null)
  const [unmatching, setUnmatching] = useState(false)

  useEffect(() => {
    setErr(null)
    setUnmatching(false)
  }, [p.id])

  if (p.sample) {
    return (
      <span className="pp-btn slant pp-btn--primary pp-btn--off" title="Bots can’t connect">
        <span className="unslant">
          CONNECT <small>BOTS CAN’T CONNECT · FIND SOMEONE REAL</small>
        </span>
      </span>
    )
  }

  if (p.resident) {
    return (
      <span className="pp-btn slant pp-btn--primary pp-btn--off" title="Not in the city yet">
        <span className="unslant">
          CONNECT <small>NOT IN THE CITY YET · USE THEIR LINKS</small>
        </span>
      </span>
    )
  }

  if (!member) {
    const become = () => {
      const ob = useOnboarding.getState()
      if (useDirectory.getState().me) {
        ob.fromProfile()
        ob.setStep(1)
      } else ob.setStep(0)
      useGame.getState().startCreate()
    }
    return (
      <div className="cn-block">
        <button className="pp-btn slant pp-btn--primary cn-btn" onClick={signedIn ? undefined : become} disabled={signedIn}>
          <span className="unslant">{signedIn ? 'CONNECT ONCE YOU’RE LIVE' : 'BECOME VISIBLE TO CONNECT'}</span>
        </button>
        <p className="cn-fine">Only people in the city can connect — so everyone you meet here is real.</p>
      </div>
    )
  }

  const respond = async (accept: boolean) => {
    if (!c) return
    const r = await useConnect.getState().respond(c.id, accept)
    if (!r.ok) return setErr('That request isn’t open any more.')
    if (!accept) useGame.getState().showToast('NOT NOW · THEY WON’T BE TOLD', 'info')
  }

  if (c?.state === 'matched') {
    const i = intentOf(c.intent)
    const first = c.other.name.split(' ')[0]
    const unmatch = async () => {
      useConnect.setState({ busy: true })
      await useConnect.getState().remove(c.id)
      useConnect.setState({ busy: false })
      setUnmatching(false)
      useGame.getState().showToast(`UNMATCHED · THE CHAT WITH ${first.toUpperCase()} IS GONE`, 'info')
    }
    return (
      <div className="cn-block">
        <div className="cn-state cn-state--match slant">
          <span className="unslant">
            ✓ CONNECTED · {i.emoji} {i.label}
          </span>
        </div>
        <button className="pp-btn slant pp-btn--primary cn-btn" onClick={() => void openThread(c.id)}>
          <span className="unslant">
            MESSAGE ▸{c.unread > 0 && <em className="hud-badge cn-unread">{c.unread}</em>}
          </span>
        </button>
        {unmatching ? (
          <div className="ch-confirm">
            <b>UNMATCH {first.toUpperCase()}?</b>
            <p>Your chat is deleted for both of you. You can connect again later.</p>
            <div className="ch-confirm-row">
              <button className="pp-btn slant cn-btn" onClick={() => setUnmatching(false)} disabled={busy}>
                <span className="unslant">CANCEL</span>
              </button>
              <button className="pp-btn slant cn-btn ch-danger" onClick={() => void unmatch()} disabled={busy}>
                <span className="unslant">{busy ? '…' : 'UNMATCH'}</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="cn-fine">
            Changed your mind?{' '}
            <button className="gate-switch" onClick={() => setUnmatching(true)}>
              UNMATCH
            </button>
          </p>
        )}
      </div>
    )
  }

  if (c && c.dir === 'in') {
    const i = intentOf(c.intent)
    return (
      <div className="cn-block">
        <div className="cn-ask">
          <span className="cn-ask-e">{i.emoji}</span>
          <span>
            <b>WANTS TO {i.label}</b>
            {c.note && <q className="cn-note">{c.note}</q>}
            <em>with you · {ago(c.created_at)}</em>
          </span>
        </div>
        <div className="pp-links-row">
          <button className="pp-btn slant cn-btn" onClick={() => respond(false)} disabled={busy}>
            <span className="unslant">NOT NOW</span>
          </button>
          <button className="pp-btn slant pp-btn--primary cn-btn" onClick={() => respond(true)} disabled={busy}>
            <span className="unslant">ACCEPT ▸</span>
          </button>
        </div>
        {err && <div className="cr-error">{err}</div>}
      </div>
    )
  }

  if (c && c.dir === 'out') {
    const i = intentOf(c.intent)
    return (
      <div className="cn-block">
        <div className="cn-state slant">
          <span className="unslant">
            REQUEST SENT · {i.emoji} {i.label}
          </span>
        </div>
        <p className="cn-fine">
          Sent {ago(c.created_at).toLowerCase()}. If they say yes, a chat opens between you two.{' '}
          <button className="gate-switch" onClick={() => useConnect.getState().withdraw(c.id)}>
            WITHDRAW
          </button>
        </p>
      </div>
    )
  }

  return (
    <button className="pp-btn slant pp-btn--primary cn-btn" onClick={onConnect}>
      <span className="unslant">CONNECT ▸</span>
    </button>
  )
}
