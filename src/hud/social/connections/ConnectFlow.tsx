'use client'

import { useEffect, useState } from 'react'
import { INTENTS, type Intent } from '@/social/intents'
import { NOTE_MAX, SEND_ERRORS, useConnect } from '@/social/connect'
import type { Profile } from '@/city/people/profiles'
import { useDirectory } from '@/city/people/directory'
import { getCharacter } from '@/city/avatars/roster'
import { isTyping } from '@/city/player/input'
import { isTouch } from '@/city/core/device'
import { activeStatus } from '@/profile/status'
import { IntentPicker } from './IntentPicker'
import { RequestCard } from './RequestCard'

type FlowStep = 'why' | 'note' | 'sent'

/**
 * CONNECT — takes over the whole profile panel as a short stepper: WHY → NOTE (optional) → sent.
 * Esc steps back; from the first step it returns to the profile.
 */
export function ConnectFlow({ p, onExit }: { p: Profile; onExit: () => void }) {
  const me = useDirectory((s) => s.me)
  const busy = useConnect((s) => s.busy)
  const [intent, setIntent] = useState<Intent | null>(null)
  const [note, setNote] = useState('')
  const [step, setStep] = useState<FlowStep>('why')
  const [err, setErr] = useState<string | null>(null)
  const steps: FlowStep[] = ['why', 'note']
  const at = steps.indexOf(step)
  const accent = getCharacter(p.character).accent
  const first = p.name.split(' ')[0]
  const left = NOTE_MAX - note.length

  const send = async () => {
    if (!intent) return setStep('why')
    setErr(null)
    const r = await useConnect.getState().send(p.id, intent, note)
    if (r.ok && r.state === 'matched') return onExit() // they'd already asked you: the match screen takes over
    if (r.ok) return setStep('sent')
    if (r.state === 'connected' || r.state === 'already_sent') return onExit()
    setErr(SEND_ERRORS[r.state] ?? SEND_ERRORS.error)
  }

  const next = () => {
    if (step === 'why' && intent) return setStep('note')
    if (step === 'note') return void send()
  }
  const back = () => {
    setErr(null)
    if (step === 'why' || step === 'sent') return onExit()
    setStep(steps[at - 1])
  }

  // Esc = back · 1–5 pick a reason · Enter = next (a note is one line, so Enter in it is next too)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = isTyping(e)
      if (e.code === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        back()
        return
      }
      if (typing) return
      // E would close the profile underneath: inside the flow it does nothing
      if (e.code === 'KeyE') {
        e.stopPropagation()
        return
      }
      if (step === 'why' && /^Digit[1-5]$/.test(e.code)) {
        e.preventDefault()
        setIntent(INTENTS[Number(e.code.slice(5)) - 1].id)
        setErr(null)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (step === 'sent') onExit()
        else next()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  const title: Record<FlowStep, string> = {
    why: `WHY MEET ${first.toUpperCase()}?`,
    note: 'ADD A NOTE',
    sent: 'REQUEST SENT',
  }

  return (
    <div className="pp-inner cf" key={step}>
      <div className="pp-top">
        <span className="pp-tag">CONNECT</span>
        {step !== 'sent' && (
          <>
            <span className="cr-step cf-step">
              STEP {at + 1} / {steps.length}
            </span>
            <span className="cr-pips cf-pips">
              {steps.map((x, i) => (
                <span key={x} className={i <= at ? 'on' : ''} />
              ))}
            </span>
          </>
        )}
        <button className="pp-close" onClick={back} aria-label={step === 'why' || step === 'sent' ? 'Back to profile' : 'Back'}>
          <span className="keycap">ESC</span>
        </button>
      </div>

      <div className="cf-to">
        <span className="cf-to-k">TO</span>
        <span className="cf-swatch" style={{ background: accent }} />
        <b>{p.name.toUpperCase()}</b>
        <em>{p.role}</em>
      </div>

      <h2 className="cr-title cf-title">{title[step]}</h2>

      {step === 'why' && (
        <>
          <p className="cr-copy cf-lede">Pick one. It’s the first thing they see.</p>
          <IntentPicker
            value={intent}
            onPick={(i) => {
              setIntent(i)
              setErr(null)
            }}
          />
        </>
      )}

      {step === 'note' && intent && (
        <>
          <p className="cr-copy cf-lede">
            Optional — but people say yes far more often when they know why you’re reaching out. One line is plenty.
          </p>
          {activeStatus(p.status) && (
            <div className="pp-note cf-reply">
              {p.status!.emoji && <span className="pp-note-e">{p.status!.emoji}</span>}
              <span className="pp-note-body">
                <span className="pp-note-k">REPLYING TO</span>
                <span className="pp-note-t">{p.status!.text}</span>
              </span>
            </div>
          )}
          <label className="cr-field cf-note">
            <span className="cr-label">
              YOUR NOTE <em className={left < 30 ? 'cr-count cr-count--low' : 'cr-count'}>{left}</em>
            </span>
            <textarea
              className="cr-answer"
              rows={3}
              value={note}
              maxLength={NOTE_MAX}
              autoFocus={!isTouch}
              placeholder={`Loved your work on ${p.building || 'your last project'} — free for a coffee this week?`}
              onChange={(e) => setNote(e.target.value.replace(/\n/g, ' '))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                  next()
                }
              }}
              aria-label={`A note to ${first} (optional)`}
            />
          </label>
          <span className="cr-label cf-preview-k">WHAT {first.toUpperCase()} SEES</span>
          <RequestCard intent={intent} note={note} from={me?.name ?? 'You'} />
          <p className="cn-fine">If {first} says yes, a chat opens between you two, right here in the city.</p>
        </>
      )}

      {step === 'sent' && intent && (
        <>
          <p className="cr-copy cf-lede">
            If {first} says yes, a chat opens between you two. If not, nothing happens and nobody is told.
          </p>
          <RequestCard intent={intent} note={note} from={me?.name ?? 'You'} />
          <p className="cn-fine">Requests nobody answers quietly disappear after 14 days. Track it under CONNECTIONS (C) → SENT.</p>
        </>
      )}

      {err && <div className="cr-error">{err}</div>}

      <div className="cr-nav cf-nav">
        {step !== 'sent' ? (
          <button className="pp-btn slant cr-back" onClick={back}>
            <span className="unslant">{step === 'why' ? '◀ PROFILE' : '◀ BACK'}</span>
          </button>
        ) : (
          <span />
        )}
        {step === 'why' && (
          <button className="btn-primary slant cr-next" disabled={!intent} onClick={next}>
            <span className="unslant">NEXT ▸</span>
          </button>
        )}
        {step === 'note' && (
          <button className="btn-primary slant cr-next" disabled={busy} onClick={next}>
            <span className="unslant">{busy ? 'SENDING…' : note.trim() ? 'SEND REQUEST ▸' : 'SEND WITHOUT A NOTE ▸'}</span>
          </button>
        )}
        {step === 'sent' && (
          <button className="btn-primary slant cr-next" onClick={onExit}>
            <span className="unslant">BACK TO PROFILE ▸</span>
          </button>
        )}
      </div>
    </div>
  )
}
