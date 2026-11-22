'use client'

import { useEffect, useState } from 'react'
import { groups, landingTab, useConnect } from '@/social/connect'
import { useDirectory } from '@/city/people/directory'
import { isTyping, requestLook } from '@/city/player/input'
import { useGame } from '@/city/core/store'
import { Thread, escInThread } from './Chat'
import { isMemberNow, count } from './connections/helpers'
import { AskCard } from './connections/AskCard'
import { ChatRow } from './connections/ChatRow'
import { EmailSetting } from './connections/EmailSetting'
import { Match } from './connections/Match'
import { SentCard } from './connections/SentCard'

export { ConnectFlow } from './connections/ConnectFlow'
export { ConnectBlock } from './connections/ConnectBlock'
export { ConnectHud } from './connections/ConnectHud'
export { ConnectArrival } from './connections/ConnectArrival'

// CONNECT (CLAUDE.md Phase 5G) — the profile-panel action, the Connections screen (C), the match
// moment and the chats (Chat.tsx). design.md §10: ink panels, slanted saffron actions, condensed caps.

/** C — the connections tray: a pane from the right; the city stays in view (5G-C). */
export function Connections() {
  const phase = useGame((s) => s.phase)
  const open = useGame((s) => s.connectOpen)
  const setOpen = useGame((s) => s.setConnectOpen)
  const member = useDirectory((s) => s.me?.status === 'approved')
  const items = useConnect((s) => s.items)
  const matchId = useConnect((s) => s.matchId)
  const focus = useConnect((s) => s.focus)
  const showMatch = useConnect((s) => s.showMatch)
  const threadId = useConnect((s) => s.threadId)
  const showThread = useConnect((s) => s.showThread)
  const [settings, setSettings] = useState(false)
  const [sentOpen, setSentOpen] = useState(false)
  const [tab, setTab] = useState<'chats' | 'requests'>('chats')
  const { requests, matches, sent } = groups(items)
  const unreadChats = matches.filter((c) => c.unread > 0 || (!c.last && c.dir === 'out' && !c.seen)).length
  const match = matchId ? items.find((c) => c.id === matchId) : undefined
  const thread = threadId ? items.find((c) => c.id === threadId && c.state === 'matched') : undefined
  const close = () => {
    setOpen(false)
    showMatch(null)
    showThread(null)
    useConnect.setState({ focus: null })
    requestLook()
  }
  // C = connections (members), from the street; with a card on screen, C opens the tray on it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = useGame.getState()
      if (e.code !== 'KeyC' || e.repeat || isTyping(e) || g.phase !== 'play' || !isMemberNow()) return
      if (g.openId || g.searchOpen || g.paused || g.portalOpen || g.travel || g.statusOpen || g.invitesOpen || g.profileOpen) return
      e.preventDefault()
      if (g.connectOpen) return g.setConnectOpen(false)
      const a = useConnect.getState().arrival
      if (a?.conn.state === 'matched') useConnect.getState().showMatch(a.conn.id)
      else useConnect.getState().openTray(a?.conn.id ?? null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  // opening: load and mark seen
  useEffect(() => {
    if (!open) return
    setSettings(false)
    const st = useConnect.getState()
    const focused = st.focus ? st.items.find((c) => c.id === st.focus) : undefined
    setTab(focused ? (focused.state === 'matched' ? 'chats' : 'requests') : landingTab(st.items) === 'matches' ? 'chats' : 'requests')
    st.dismissArrival()
    void useConnect
      .getState()
      .load()
      .then(() => useConnect.getState().markSeen())
  }, [open])
  // the focused card scrolls into view
  useEffect(() => {
    if (!open || !focus) return
    const id = setTimeout(() => document.querySelector(`[data-id="${focus}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 260)
    return () => clearTimeout(id)
  }, [open, focus, items])
  // links from the emails: /?connections
  useEffect(() => {
    if (phase !== 'play' || !member) return
    const url = new URL(window.location.href)
    if (!url.searchParams.has('connections')) return
    url.searchParams.delete('connections')
    window.history.replaceState(null, '', url)
    setOpen(true)
  }, [phase, member, setOpen])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      const st = useConnect.getState()
      if (st.threadId && escInThread()) return // the chat's ••• menu closes first
      if (st.threadId) showThread(null)
      else if (st.matchId) showMatch(null)
      else close()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })
  if (phase !== 'play' || !open || !member) return null
  return (
    <div className="cn-tray-wrap" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <aside className="cn-tray" aria-label="Connections">
        <header className="cn-tray-top">
          <span className="cn-tray-k">CONNECTIONS</span>
          <button
            className={`cn-gear${settings ? ' cn-gear--on' : ''}`}
            onClick={() => setSettings((v) => !v)}
            aria-label="Email settings"
            aria-expanded={settings}
          >
            ⚙
          </button>
          <button className="pp-close" onClick={close} aria-label="Close">
            <span className="keycap">ESC</span>
          </button>
        </header>

        {settings ? (
          <div className="cn-tray-scroll">
            <EmailSetting />
          </div>
        ) : thread ? (
          <div className="cn-tray-chat" key={`t${thread.id}`}>
            <Thread c={thread} onBack={() => showThread(null)} />
          </div>
        ) : match ? (
          <div className="cn-tray-scroll" key={match.id}>
            <Match c={match} onBack={() => showMatch(null)} />
          </div>
        ) : (
          <>
            <div className="cn-tabs" role="tablist">
              <button role="tab" aria-selected={tab === 'chats'} className={`you-tab slant${tab === 'chats' ? ' you-tab--on' : ''}`} onClick={() => setTab('chats')}>
                <span className="unslant">
                  CHATS {unreadChats > 0 && <em className="cn-tab-n cn-tab-n--chat">{count(unreadChats)}</em>}
                </span>
              </button>
              <button
                role="tab"
                aria-selected={tab === 'requests'}
                className={`you-tab slant${tab === 'requests' ? ' you-tab--on' : ''}`}
                onClick={() => setTab('requests')}
              >
                <span className="unslant">
                  REQUESTS {requests.length > 0 && <em className="cn-tab-n">{count(requests.length)}</em>}
                </span>
              </button>
            </div>
            <div className="cn-tray-scroll" key={tab}>
              {tab === 'chats' ? (
                matches.length ? (
                  <div className="cn-rows">
                    {matches.map((c, n) => (
                      <ChatRow key={c.id} c={c} focus={focus === c.id} i={n} />
                    ))}
                  </div>
                ) : (
                  <div className="cn-empty-tray">
                    <b>NO CHATS YET</b>
                    <p>
                      {requests.length
                        ? `${requests.length === 1 ? 'Someone wants' : `${requests.length} people want`} to meet you. Say yes under REQUESTS and a chat opens here.`
                        : 'A chat opens here when someone says yes to you. Find someone (F) and hit CONNECT on their profile.'}
                    </p>
                  </div>
                )
              ) : (
                <>
                  {requests.map((c, n) => (
                    <AskCard key={c.id} c={c} focus={focus === c.id} i={n} />
                  ))}
                  {!requests.length && (
                    <div className="cn-empty-tray">
                      <b>NO REQUESTS</b>
                      <p>Set a status (N) so people know what you’re up for. When someone wants to meet you, it shows up here.</p>
                    </div>
                  )}
                  {sent.length > 0 && (
                    <section className="cn-sec">
                      <button className="cn-sec-k cn-sec-toggle" onClick={() => setSentOpen((v) => !v)} aria-expanded={sentOpen}>
                        SENT BY YOU <em>{sent.length}</em> <span className="cn-chev">{sentOpen ? '▾' : '▸'}</span>
                      </button>
                      {sentOpen && sent.map((c) => <SentCard key={c.id} c={c} />)}
                    </section>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}