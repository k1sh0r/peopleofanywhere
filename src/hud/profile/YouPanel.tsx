'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useDirectory } from '@/city/people/directory'
import { useOnboarding } from '@/profile/onboarding'
import { useNet } from '@/city/live/useNet'
import { getCharacter } from '@/city/avatars/roster'
import { isTyping, requestLook } from '@/city/player/input'
import { useGame } from '@/city/core/store'
import { useCanSetStatus } from './StatusEditor'

// THE YOU PANEL — one panel, three tabs: PROFILE (V) · STATUS (N) · INVITES (I).
// Opened from your tag bottom-right, the keys, the pause menu or the missions. design.md §10.6: the same
// right-hand panel as someone's profile (slanted edge, full height, your character's colour on top); the
// street stays visible on the left. A bottom sheet on phones.

/** When the last tab switch happened: a switch keeps the panel still instead of sliding it in again. */
let switchedAt = 0

export type YouTab = 'profile' | 'status' | 'invites'

const KEY: Record<YouTab, string> = { profile: 'V', status: 'N', invites: 'I' }
const LABEL: Record<YouTab, string> = {
  profile: 'PROFILE',
  status: 'STATUS',
  invites: 'INVITES',
}

/** Which tab is open, or null. */
export function youTab(g: { profileOpen: boolean; statusOpen: boolean; invitesOpen: boolean }): YouTab | null {
  return g.profileOpen ? 'profile' : g.statusOpen ? 'status' : g.invitesOpen ? 'invites' : null
}

export function openYou(tab: YouTab) {
  const g = useGame.getState()
  if (youTab(g)) switchedAt = performance.now()
  if (tab === 'profile') g.setProfileOpen(true)
  else if (tab === 'status') g.setStatusOpen(true)
  else g.setInvitesOpen(true)
}

export function closeYou() {
  useGame.setState({
    profileOpen: false,
    statusOpen: false,
    invitesOpen: false,
  })
  requestLook()
}

/** The panel itself, shared by the three tabs. */
export function YouShell({ children }: { children: ReactNode }) {
  const character = useDirectory((s) => s.me?.character)
  const [still] = useState(() => performance.now() - switchedAt < 400)
  return (
    <aside
      className={`pp you-pp${still ? ' you-pp--still' : ''}`}
      style={{
        ['--accent' as string]: character ? getCharacter(character).accent : 'var(--saffron)',
      }}
    >
      <div className="pp-inner">{children}</div>
    </aside>
  )
}

/** The tabs a member has: invites only once you're live; status only where it can be seen. */
function useTabs(): YouTab[] {
  const member = useDirectory((s) => s.me?.status === 'approved')
  const canStatus = useCanSetStatus()
  const has = useDirectory((s) => !!s.me)
  return [...(has ? (['profile'] as const) : []), ...(canStatus ? (['status'] as const) : []), ...(member ? (['invites'] as const) : [])]
}

/** The panel's header: the tabs on the left, ESC on the right. Replaces each tab's own tag. */
export function YouTabs({ active, onClose }: { active: YouTab; onClose?: () => void }) {
  const tabs = useTabs()
  return (
    <div className="cr-top you-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t}
          role="tab"
          aria-selected={t === active}
          className={`you-tab slant${t === active ? ' you-tab--on' : ''}`}
          onClick={() => t !== active && openYou(t)}
        >
          <span className="unslant">
            {LABEL[t]} <span className="keycap">{KEY[t]}</span>
          </span>
        </button>
      ))}
      <button className="pp-close st-close" onClick={onClose ?? closeYou} aria-label="Close">
        <span className="keycap">ESC</span>
      </button>
    </div>
  )
}

/** V / N / I from the street open that tab; inside the panel they switch tabs; the open tab's key closes it. */
export function useYouKeys() {
  const canStatus = useCanSetStatus()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tab: YouTab | null = e.code === 'KeyV' ? 'profile' : e.code === 'KeyN' ? 'status' : e.code === 'KeyI' ? 'invites' : null
      if (!tab || e.repeat || isTyping(e)) return
      const g = useGame.getState()
      const me = useDirectory.getState().me
      if (g.phase !== 'play' || !me || g.openId || g.searchOpen || g.paused || g.portalOpen || g.travel || g.connectOpen) return
      if (tab === 'status' && !canStatus) return
      if (tab === 'invites' && me.status !== 'approved') return
      e.preventDefault()
      if (youTab(g) === tab) closeYou()
      else openYou(tab)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canStatus])
}

/** Jump into the Become Visible steps at one section (members: look 0 · who 1 · building 2 · links 3 · hang out 4). */
function edit(step: number) {
  const ob = useOnboarding.getState()
  ob.fromProfile()
  ob.setStep(step)
  useGame.getState().startCreate()
}

const host = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

/** PROFILE — what the city sees of you, one row per section; each row jumps into that step to edit it. */
export function ProfilePanel() {
  const open = useGame((s) => s.profileOpen && s.phase === 'play')
  const me = useDirectory((s) => s.me)
  const net = useNet((s) => s.status)
  useYouKeys()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        closeYou()
      }
      if (e.code === 'Enter' && !e.repeat && !(e.target as HTMLElement).closest('button')) {
        e.preventDefault()
        edit(1)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])

  if (!open || !me) return null

  const live = me.status === 'approved'
  const elsewhere = live && net === 'replaced'
  const state = elsewhere ? 'LIVE IN ANOTHER TAB' : live ? 'LIVE ON THE MAP' : me.status === 'hidden' ? 'HIDDEN' : 'PENDING APPROVAL'
  const links = [me.portfolio && host(me.portfolio), me.linkedin && 'LinkedIn', me.x && `@${me.x.replace(/^@/, '')}`].filter(Boolean) as string[]

  const rows: { label: string; value: string | null; step: number }[] = [
    { label: 'LOOK', value: getCharacter(me.character).name, step: 0 },
    {
      label: 'WHO YOU ARE',
      value: [me.role, me.company].filter(Boolean).join(' · ') + (me.open_to_work ? ' · Open to work' : ''),
      step: 1,
    },
    { label: 'BUILDING', value: me.building || null, step: 2 },
    { label: 'LINKS', value: links.length ? links.join(' · ') : null, step: 3 },
    { label: 'HANGS OUT IN', value: me.location || null, step: 4 },
  ]

  return (
    <YouShell>
      <YouTabs active="profile" />
      <h2 className="cr-title">{me.name.toUpperCase()}</h2>
      <p className={`you-p-state${live && !elsewhere ? ' you-p-state--live' : ''}`}>
        <span className="np-dot" /> {state}
      </p>

      <div className="you-rows">
        {rows.map((r) => (
          <button key={r.label} className="you-row" onClick={() => edit(r.step)}>
            <span className="cr-label">{r.label}</span>
            <span className={`you-row-v${r.value ? '' : ' you-row-v--empty'}`}>{r.value ?? 'Not added yet'}</span>
            <span className="you-row-go">EDIT ▸</span>
          </button>
        ))}
      </div>
    </YouShell>
  )
}
