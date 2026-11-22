'use client'

import { useEffect, useState } from 'react'
import { getCharacter } from '@/city/avatars/roster'
import type { Profile } from '@/city/people/profiles'
import { getPeople } from '@/city/people/directory'
import { useGame } from '@/city/core/store'
import { activeStatus } from '@/profile/status'
import { isTyping } from '@/city/player/input'
import { ConnectBlock, ConnectFlow } from './Connections'
import { useNet } from '@/city/live/useNet'
import { districtInfo, placeLabel, type DistrictId } from '@/city/districts/registry'

const byId = (id: string | null) => (id ? getPeople().find((p) => p.id === id) : undefined)

/**
 * Approach prompt: just the action. Who they are (name, role, open to work, status) is
 * already on their nameplate right above them, and the ring on the ground marks who it's for.
 */
function Prompt({ p, onOpen }: { p: Profile; onOpen: () => void }) {
  return (
    <button className="prompt prompt--person slant" key={p.id} onClick={onOpen} aria-label={`View ${p.name}'s profile`}>
      <span className="unslant prompt-body">
        <span className="prompt-action">
          <span className="keycap">E</span> VIEW PROFILE
        </span>
      </span>
    </button>
  )
}

/** Standing at the portal: choose when to travel (never pops up on its own). */
function PortalPrompt({ onOpen }: { onOpen: () => void }) {
  return (
    <button className="prompt prompt--portal slant" onClick={onOpen}>
      <span className="unslant prompt-body">
        <span className="prompt-open">
          <span className="warp-ring" /> PORTAL · TRAVEL
        </span>
        <span className="prompt-name">TRAVEL</span>
        <span className="prompt-role">Step through to another district</span>
        <span className="prompt-action">
          <span className="keycap">E</span> CHOOSE DESTINATION
        </span>
      </span>
    </button>
  )
}

/** A link they added; links they haven't added are simply not shown. */
function LinkButton({ label, href, primary }: { label: string; href?: string; primary?: boolean }) {
  if (!href) return null
  return (
    <a className={`pp-btn slant${primary ? ' pp-btn--primary' : ''}`} href={href} target="_blank" rel="noopener noreferrer">
      <span className="unslant">{label} ↗</span>
    </a>
  )
}

/**
 * Online / offline for a real member (Phase 8A). Only shown once we know who's online (members on the
 * live map; guests never connect, so to them nobody would ever look online). Elsewhere = another district.
 */
function Presence({ p }: { p: Profile }) {
  const known = useNet((s) => s.cityCounts !== null)
  const here = useNet((s) => s.live.has(p.id))
  const where = useNet((s) => s.online[p.id] as DistrictId | undefined)
  const district = useGame((s) => s.district)
  if (p.sample || p.resident || !known) return null
  if (!here && !where)
    return (
      <span className="pp-presence pp-presence--off">
        <span className="pp-presence-dot" /> OFFLINE
      </span>
    )
  const away = !here && where && where !== district ? districtInfo(where)?.title : null
  return (
    <span className="pp-presence">
      <span className="pp-presence-dot" /> ONLINE{away ? ` · IN ${away}` : ''}
    </span>
  )
}

/** Profile panel (CLAUDE.md §13) — slides in from the right; the world stays visible. */
// Sample people are bots: say so in the panel only, never on the nameplate.
// Hover or focus shows why they're here; a tap toggles it on touch.
function BotTag() {
  const [open, setOpen] = useState(false)
  return (
    <span className={`pp-bot${open ? ' is-open' : ''}`} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="pp-sample" aria-describedby="pp-bot-tip" onClick={() => setOpen((o) => !o)}>
        BOT <span className="pp-bot-i">?</span>
      </button>
      <span id="pp-bot-tip" role="tooltip" className="pp-bot-tip">
        These bots roam the city until it fills up with real people.
      </span>
    </span>
  )
}

// A real person shown before they've joined (profiles.ts RESIDENTS): say so, in the same tag slot.
function ResidentTag() {
  const [open, setOpen] = useState(false)
  return (
    <span className={`pp-bot${open ? ' is-open' : ''}`} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="pp-sample" aria-describedby="pp-resident-tip" onClick={() => setOpen((o) => !o)}>
        NOT JOINED YET <span className="pp-bot-i">?</span>
      </button>
      <span id="pp-resident-tip" role="tooltip" className="pp-bot-tip">
        A real person who hasn’t joined the city yet. Reach them through their links.
      </span>
    </span>
  )
}

function Panel({ p, onClose }: { p: Profile; onClose: () => void }) {
  const style = getCharacter(p.character)
  // CONNECT takes over the whole panel as a stepper; the profile comes back after
  const [connecting, setConnecting] = useState(false)
  if (connecting)
    return (
      <aside className="pp" style={{ ['--accent' as string]: style.accent }}>
        <ConnectFlow p={p} onExit={() => setConnecting(false)} />
      </aside>
    )
  return (
    <aside className="pp" style={{ ['--accent' as string]: style.accent }}>
      <div className="pp-inner">
        <div className="pp-top">
          <span className="pp-tag">PROFILE</span>
          {p.sample && <BotTag />}
          {p.resident && <ResidentTag />}
          <Presence p={p} />
          <button className="pp-close" onClick={onClose} aria-label="Close profile">
            <span className="keycap">ESC</span>
          </button>
        </div>

        <h2 className="pp-name">{p.name}</h2>
        <div className="pp-role">
          {p.role}
          {p.company && (
            <>
              {' '}
              <span>·</span> {p.company}
            </>
          )}
        </div>
        <div className="pp-loc">
          <span className="pp-pin" /> {placeLabel(p.location)}
        </div>

        {activeStatus(p.status) && (
          <div className="pp-note">
            {p.status!.emoji && <span className="pp-note-e">{p.status!.emoji}</span>}
            <span className="pp-note-body">
              <span className="pp-note-k">STATUS</span>
              <span className="pp-note-t">{p.status!.text}</span>
            </span>
          </div>
        )}

        {p.openToWork && (
          <div className="pp-status slant pp-status--open">
            <span className="unslant">
              <span className="np-dot" /> OPEN TO WORK
            </span>
          </div>
        )}

        {p.building && (
          <section className="pp-section">
            <h3>CURRENTLY BUILDING</h3>
            <p>{p.building}</p>
          </section>
        )}
        {p.previously && (
          <section className="pp-section">
            <h3>PREVIOUSLY</h3>
            <p>{p.previously}</p>
          </section>
        )}
        <section className="pp-section">
          <h3>PLAYS AS</h3>
          <p>
            <span className="pp-swatch" /> {style.name}
          </p>
        </section>

        <div className="pp-links">
          <ConnectBlock p={p} onConnect={() => setConnecting(true)} />
          <LinkButton label="PORTFOLIO" href={p.links.portfolio} />
          {(p.links.linkedin || p.links.x) && (
            <div className="pp-links-row">
              <LinkButton label="LINKEDIN" href={p.links.linkedin} />
              <LinkButton label="X" href={p.links.x} />
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export function Interaction() {
  const phase = useGame((s) => s.phase)
  const focusId = useGame((s) => s.focusId)
  const openId = useGame((s) => s.openId)
  const openProfile = useGame((s) => s.openProfile)
  const closeProfile = useGame((s) => s.closeProfile)
  const portalPrompt = useGame(
    (s) => s.nearPortal && !s.focusId && !s.openId && !s.searchOpen && !s.statusOpen && !s.connectOpen && !s.invitesOpen && !s.profileOpen && !s.paused && !s.portalOpen && !s.travel && s.trackStage !== 'fly' && s.trackStage !== 'hold',
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = useGame.getState()
      if (g.phase !== 'play' || isTyping(e) || g.searchOpen || g.statusOpen || g.connectOpen || g.invitesOpen || g.profileOpen || g.paused || g.portalOpen || g.travel) return
      if (e.code === 'KeyE' && !e.repeat) {
        if (g.openId) g.closeProfile()
        else if (g.focusId) g.openProfile(g.focusId)
        else if (g.nearPortal && g.trackStage !== 'fly' && g.trackStage !== 'hold') g.setPortalOpen(true)
      }
      if (e.code === 'Escape' && g.openId) g.closeProfile()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (phase !== 'play') return null
  const open = byId(openId)
  const focus = byId(focusId)
  return (
    <>
      {focus && !open && <Prompt p={focus} onOpen={() => openProfile(focus.id)} />}
      {portalPrompt && <PortalPrompt onOpen={() => useGame.getState().setPortalOpen(true)} />}
      {open && <Panel key={open.id} p={open} onClose={closeProfile} />}
    </>
  )
}
