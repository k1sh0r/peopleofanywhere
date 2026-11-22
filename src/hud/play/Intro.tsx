'use client'

import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { useGame } from '@/city/core/store'
import { useDirectory } from '@/city/people/directory'
import { DEFAULT_DISTRICT, districtInfo, homeDistrict } from '@/city/districts/registry'
import { requestLook } from '@/city/player/input'
import { useAccess } from '@/membership/gate'
import { useOnboarding } from '@/profile/onboarding'
import { CITY_NAME, IS_PRODUCTION, SITE_NAME } from '@/config/site'
import { supabase } from '@/platform/supabase'
import { CITY_PAUSED, WAITLIST_KEY, normalizeEmail, pauseBypassed, type WaitlistSource } from '@/membership/waitlist'

/** Title screen over a slow cinematic orbit of the block. */
export function Intro() {
  const phase = useGame((s) => s.phase)
  const ready = useGame((s) => s.ready)
  const enter = useGame((s) => s.enter)
  const me = useDirectory((s) => s.me)
  const { progress } = useProgress()
  const pct = ready ? 100 : Math.min(99, Math.round(progress))
  // invite landing (?invite=CODE): check the code while the city loads, greet them with who vouched
  const linkCode = useAccess((s) => s.linkCode)
  const codeState = useAccess((s) => s.codeState)
  const inviter = useAccess((s) => s.inviter)
  const invited = !me && !!linkCode && codeState === 'ok' && !!inviter
  // the pause (src/membership/waitlist.ts): read after mount so the server render and the first client render agree
  const [paused, setPaused] = useState(CITY_PAUSED)
  useEffect(() => {
    if (CITY_PAUSED && pauseBypassed(location.search, IS_PRODUCTION)) setPaused(false)
  }, [])

  useEffect(() => {
    const a = useAccess.getState()
    if ((CITY_PAUSED && !pauseBypassed(location.search, IS_PRODUCTION)) || !a.linkCode || useDirectory.getState().me) return
    useAccess.setState({ code: a.linkCode })
    void a.checkCode()
  }, [])

  const start = () => {
    if (!ready || paused) return
    // signed-in players start in the district they live in
    if (me) useGame.getState().setDistrict(homeDistrict(me.location))
    enter()
    requestLook()
  }

  // straight into the gate, on the code step with the ✓ already showing
  const accept = () => {
    if (!ready || paused) return
    enter()
    useOnboarding.getState().setStep(0)
    useGame.getState().startCreate()
  }

  if (paused) {
    return (
      <div className={`intro intro--paused${phase !== 'intro' ? ' intro--gone' : ''}${ready ? ' intro--ready' : ''}`}>
        <div className="wl-backdrop" />
        <CityPulse />
        <div className="wl-wrap">
          <Waitlist source={me ? 'member' : linkCode ? 'invite' : 'guest'} />
        </div>
      </div>
    )
  }

  return (
    <div className={`intro${phase !== 'intro' ? ' intro--gone' : ''}${ready ? ' intro--ready' : ''}`}>
      <div className="intro-shade" />
      <div className="intro-tag slant">
        <span className="unslant">EARLY ACCESS</span>
      </div>
      {invited ? (
        <div className="intro-title intro-title--invite">
          <div className="intro-kicker">YOU’RE INVITED</div>
          <h1>{inviter.name.split(' ')[0].toUpperCase()} INVITED YOU</h1>
          {inviter.role && <p className="intro-invite-role">{inviter.role}</p>}
          <p>Walk the city of designers and builders. When you’re ready, you go live — no review.</p>
        </div>
      ) : (
        <div className="intro-title">
          <div className="intro-kicker">PEOPLE OF</div>
          <h1>{CITY_NAME.toUpperCase()}</h1>
          <p>Walk the city. Meet the people who design it.</p>
          {!me && <p className="intro-note">You’ll arrive invisible — become visible whenever you’re ready.</p>}
        </div>
      )}
      <div className="intro-cta">
        {ready ? (
          invited ? (
            <>
              <button className="btn-primary slant" onClick={accept} autoFocus>
                <span className="unslant">ACCEPT INVITE ▸</span>
              </button>
              <button className="intro-later" onClick={start}>
                LOOK AROUND FIRST
              </button>
            </>
          ) : (
            <button className="btn-primary slant" onClick={start} autoFocus>
              <span className="unslant">{me ? `ENTER ${districtInfo(homeDistrict(me.location)).title} AS ${me.name.split(' ')[0].toUpperCase()} ▸` : `ENTER ${districtInfo(DEFAULT_DISTRICT).title} ▸`}</span>
            </button>
          )
        ) : (
          <div className="loader slant">
            <div className="loader-fill" style={{ width: `${pct}%` }} />
            <span className="unslant loader-label">PAINTING THE CITY… {pct}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

type SendState = 'idle' | 'sending' | 'invalid' | 'error'

/** The paused title screen's card: why the gates are shut, and the email field that saves a spot. */
function Waitlist({ source }: { source: WaitlistSource }) {
  const me = useDirectory((s) => s.me)
  const myEmail = useDirectory((s) => s.email)
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState<string | null>(null)
  const [state, setState] = useState<SendState>('idle')

  // this browser already joined: show that, not the form
  useEffect(() => {
    try {
      setJoined(localStorage.getItem(WAITLIST_KEY))
    } catch {}
  }, [])
  // members: their sign-in email, ready to send
  useEffect(() => {
    if (myEmail) setEmail((e) => e || myEmail)
  }, [myEmail])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state === 'sending') return
    const clean = normalizeEmail(email)
    if (!clean) return setState('invalid')
    setState('sending')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: clean, source }),
      })
      if (!res.ok) return setState(res.status === 400 ? 'invalid' : 'error')
      try {
        localStorage.setItem(WAITLIST_KEY, clean)
      } catch {}
      setJoined(clean)
      setState('idle')
    } catch {
      setState('error')
    }
  }

  const first = me?.name.split(' ')[0].toUpperCase()

  if (joined) {
    return (
      <div className="wl wl--in" role="dialog" aria-modal="true" aria-labelledby="wl-title">
        <div>
          <Head chip="✓ SPOT SAVED" />
          <Update />
          <h2 className="wl-title" id="wl-title">
            YOU’RE ON THE LIST
          </h2>
          <p className="wl-copy">
            We’ll write to <b>{joined}</b> the moment the gates open. You’re first in line.
          </p>
          <button
            className="intro-later wl-again"
            onClick={() => {
              try {
                localStorage.removeItem(WAITLIST_KEY)
              } catch {}
              setEmail('')
              setJoined(null)
            }}
          >
            USE ANOTHER EMAIL
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="wl" onSubmit={send} noValidate role="dialog" aria-modal="true" aria-labelledby="wl-title">
      <div>
        <Head chip="PAUSED · BACK SOON" />
        <Update />
        <h2 className="wl-title" id="wl-title">
          {first ? `WELCOME BACK, ${first}` : 'YOU ALL SHOWED UP AT ONCE'}
        </h2>
        <p className="wl-copy">
          {me
            ? `The response was overwhelming, so we’ve paused ${SITE_NAME} while we make room. Your profile is safe. Leave your email and you’ll be first back in when the city reopens.`
            : `The response was overwhelming, so we’ve paused ${SITE_NAME} while we make room. Leave your email and you’ll be first through the gates when the city reopens.`}
        </p>
        <div className="wl-row">
          <label className="cr-field wl-field">
            <span className="cr-label">EMAIL</span>
            <input
              type="email"
              inputMode="email"
              value={email}
              placeholder="you@studio.com"
              autoComplete="email"
              spellCheck={false}
              autoFocus={!me}
              aria-invalid={state === 'invalid'}
              onChange={(e) => {
                setEmail(e.target.value)
                if (state === 'invalid' || state === 'error') setState('idle')
              }}
            />
          </label>
          <button className="btn-primary slant wl-send" type="submit" disabled={state === 'sending'}>
            <span className="unslant">{state === 'sending' ? 'SAVING…' : 'SAVE MY SPOT ▸'}</span>
          </button>
        </div>
        {state === 'invalid' && <div className="cr-error wl-err">THAT EMAIL DOESN’T LOOK RIGHT</div>}
        {state === 'error' && <div className="cr-error wl-err">COULDN’T SAVE THAT · TRY AGAIN</div>}
      </div>
    </form>
  )
}

/** The notice's header strip: the wordmark, and what state the city is in. */
function Head({ chip }: { chip: string }) {
  return (
    <div className="wl-head">
      <span className="wl-mark">
        PEOPLE OF <b>{CITY_NAME.toUpperCase()}</b>
      </span>
      <span className="wl-chip slant">
        <span className="unslant">{chip}</span>
      </span>
    </div>
  )
}

/** The highlighted line inside the notice. */
function Update() {
  return (
    <div className="wl-update slant">
      <span className="unslant">★ MAJOR UPDATE COMING SOON</span>
    </div>
  )
}

type Pulse = {
  recruiters_online: number
  recruiters_total: number
  members_online: number
  members_total: number
  waiting: number
}

/** The top panel over the paused city: the counts in public.city_pulse (written by scripts/pulse). */
function CityPulse() {
  const [n, setN] = useState<Pulse | null>(null)

  useEffect(() => {
    if (!supabase) return
    let alive = true
    const load = async () => {
      const { data, error } = await supabase!
        .from('city_pulse')
        .select('recruiters_online, recruiters_total, members_online, members_total, waiting')
        .eq('id', 1)
        .maybeSingle()
      // keep the last numbers on a failed read; the row itself keeps its last values when the script is off
      if (alive && !error && data) setN(data as Pulse)
    }
    void load()
    const id = window.setInterval(load, 30_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return (
    <div className="pulse">
      {n && (
        <div className="pulse-bar slant">
          <span className="unslant pulse-row">
            <span className="pulse-stat pulse-stat--live">
              <i className="pulse-dot" />
              <Num v={n.recruiters_online} />/{n.recruiters_total} RECRUITERS
            </span>
            <span className="pulse-amp">&amp;</span>
            <span className="pulse-stat pulse-stat--live">
              <Num v={n.members_online} />/{n.members_total} MEMBERS ONLINE
            </span>
            <span className="pulse-stat">
              <Num v={n.waiting} /> WAITING TO GET IN
            </span>
          </span>
        </div>
      )}
    </div>
  )
}

/** A number that pops when it changes. */
function Num({ v }: { v: number }) {
  return (
    <b key={v} className="pulse-num">
      {v}
    </b>
  )
}