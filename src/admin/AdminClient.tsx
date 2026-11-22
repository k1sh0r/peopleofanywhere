'use client'

import { CodeEntry } from '@/hud/membership/CodeEntry'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/platform/supabase'
import './admin.css'
import { InvitesAdmin } from './InvitesAdmin'
import { WaitlistAdmin } from './WaitlistAdmin'
import { gameOrigin } from '@/config/site'
import { ApplicationCard } from './client/ApplicationCard'
import { ReportCard } from './client/ReportCard'
import { matches, pasted } from './client/helpers'
import { TABS, type App, type Report, type Tab } from './client/types'

// THE REVIEW QUEUE (CLAUDE.md 5E-B). Admins only (public.admins).
// ACCEPT → /api/admin/approve: approve_application() (profile goes live, invite codes issued) + the email.
// REJECT + REFUND → /api/admin/reject (Dodo refund from the server).
// REPORTS (5G): what a member reported from a chat → RESOLVE, or HIDE MEMBER (they leave the city).
// INVITES (5D): founder codes — make them in batches, track who joined with each, revoke (InvitesAdmin.tsx).
// WAITLIST: emails left while the city is paused (WaitlistAdmin.tsx, src/membership/waitlist.ts).

export default function AdminClient() {
  const [phase, setPhase] = useState<'loading' | 'signed_out' | 'not_admin' | 'ready'>('loading')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  // each new code cancels the last, so a second click while sending breaks the first email
  const [sending, setSending] = useState(false)
  const [apps, setApps] = useState<App[]>([])
  const [members, setMembers] = useState<Set<string>>(new Set())
  const [reports, setReports] = useState<Report[]>([])
  const [tab, setTab] = useState<Tab>('queue')
  const [err, setErr] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('applications').select('*').order('created_at', { ascending: true })
    if (error) return setErr(error.message)
    const list = (data ?? []) as App[]
    setApps(list)
    const { data: rep } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(200)
    setReports((rep ?? []) as Report[])
    // approved profiles are public: tells us who got in by invite while waiting
    const ids = list.map((a) => a.user_id)
    if (ids.length) {
      const { data: p } = await supabase.from('profiles').select('id').eq('status', 'approved').in('id', ids)
      setMembers(new Set((p ?? []).map((r: { id: string }) => r.id)))
    }
  }, [])

  useEffect(() => {
    if (!supabase) return setPhase('signed_out')
    const check = async () => {
      const { data } = await supabase!.auth.getSession()
      if (!data.session) return setPhase('signed_out')
      const { data: ok } = await supabase!.rpc('is_admin')
      if (!ok) return setPhase('not_admin')
      setPhase('ready')
      void load()
    }
    void check()
    const { data } = supabase.auth.onAuthStateChange((e) => {
      if (e === 'SIGNED_IN' || e === 'SIGNED_OUT') void check()
    })
    return () => data.subscription.unsubscribe()
  }, [load])

  const counts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [t.id, apps.filter((a) => (t.statuses as readonly string[]).includes(a.status)).length])),
    [apps],
  )
  const shown = useMemo(() => {
    const t = TABS.find((x) => x.id === tab)
    if (!t) return []
    const list = apps.filter((a) => (t.statuses as readonly string[]).includes(a.status) && matches(a, q))
    return tab === 'decided' ? list.reverse() : list
  }, [apps, tab, q])
  const inTab = TABS.some((t) => t.id === tab) ? counts[tab] : 0
  const list = pasted(q).listed
  // pasted entries nobody in this tab has: already decided, a typo, or a different email
  const missing = list ? list.filter((x) => !shown.some((a) => a.email.toLowerCase() === x || a.id === x)) : []
  const findRef = useRef<HTMLInputElement>(null)
  // / jumps to the search, like the game's finder
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.key !== '/' || el.closest('input, textarea, [contenteditable]')) return
      e.preventDefault()
      findRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const sendLink = async () => {
    if (!supabase || sending) return
    setSending(true)
    setErr(null)
    // a code, not a link: CodeEntry signs this tab in, then onAuthStateChange runs the admin check
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } })
    setSending(false)
    if (error) setErr(error.message)
    else setSent(true)
  }

  return (
    <div className="adm">
      <header className="adm-top">
        <div className="adm-badge slant">
          <span className="unslant">
            <small>PEOPLE OF ANYWHERE</small>
            <b>REVIEW QUEUE</b>
          </span>
        </div>
        {phase === 'ready' && (
          <div className="adm-actions">
            <button className="adm-ghost" onClick={() => void load()}>
              REFRESH
            </button>
            <a className="adm-ghost" href={gameOrigin()}>
              BACK TO THE CITY ▸
            </a>
          </div>
        )}
      </header>

      {err && (
        <div className="adm-err" onClick={() => setErr(null)}>
          {err}
        </div>
      )}

      {phase === 'loading' && <p className="adm-empty">LOADING…</p>}

      {phase === 'signed_out' && (
        <div className="adm-panel adm-gate">
          <h1>REVIEWERS ONLY</h1>
          {sent ? (
            <CodeEntry email={email} onResend={sendLink} />
          ) : (
            <>
              <p>Sign in with the email you added to the admins table.</p>
              <div className="adm-row">
                <input
                  type="email"
                  value={email}
                  placeholder="you@studio.com"
                  disabled={sending}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendLink()}
                />
                <button className="btn-primary slant adm-btn" onClick={sendLink} disabled={sending}>
                  <span className="unslant">{sending ? 'SENDING…' : 'SEND CODE ▸'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {phase === 'not_admin' && (
        <div className="adm-panel adm-gate">
          <h1>NOT A REVIEWER</h1>
          <p>
            This account isn’t in <code>public.admins</code>. Add it in the Supabase SQL editor, then refresh.
          </p>
          <button className="adm-ghost" onClick={() => supabase?.auth.signOut()}>
            SIGN OUT
          </button>
        </div>
      )}

      {phase === 'ready' && (
        <>
          <nav className="adm-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`adm-tab slant${tab === t.id ? ' adm-tab--on' : ''}${t.id === 'problems' && counts[t.id] ? ' adm-tab--alert' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span className="unslant">
                  {t.label} <em>{counts[t.id]}</em>
                </span>
              </button>
            ))}
            <button
              className={`adm-tab slant${tab === 'reports' ? ' adm-tab--on' : ''}${reports.some((r) => r.status === 'open') ? ' adm-tab--alert' : ''}`}
              onClick={() => setTab('reports')}
            >
              <span className="unslant">
                REPORTS <em>{reports.filter((r) => r.status === 'open').length}</em>
              </span>
            </button>
            <button className={`adm-tab slant${tab === 'invites' ? ' adm-tab--on' : ''}`} onClick={() => setTab('invites')}>
              <span className="unslant">INVITES</span>
            </button>
            <button className={`adm-tab slant${tab === 'waitlist' ? ' adm-tab--on' : ''}`} onClick={() => setTab('waitlist')}>
              <span className="unslant">WAITLIST</span>
            </button>
          </nav>

          {tab === 'waitlist' ? (
            <WaitlistAdmin onError={setErr} />
          ) : tab === 'invites' ? (
            <InvitesAdmin onError={setErr} />
          ) : tab === 'reports' ? (
            <div className="adm-list">
              {reports.length === 0 && <p className="adm-empty">NO REPORTS</p>}
              {reports.map((r) => (
                <ReportCard key={r.id} r={r} onDone={load} onError={setErr} />
              ))}
            </div>
          ) : (
            <>
              <div className={`adm-find${q.trim() ? ' adm-find--on' : ''}`}>
                <span className="adm-find-k slant">
                  <span className="unslant">
                    <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden>
                      <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="3" />
                      <path d="M12.6 12.6 17.5 17.5" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
                    </svg>
                    FIND
                  </span>
                </span>
                <input
                  ref={findRef}
                  type="text"
                  value={q}
                  spellCheck={false}
                  aria-label="Search applications"
                  placeholder="Name, email, role, company, WhatsApp…"
                  onChange={(e) => setQ(e.target.value)}
                  // a pasted CSV column: keep one entry per line apart (a one-line box would glue them together)
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text')
                    if (!/[\r\n]/.test(text)) return
                    e.preventDefault()
                    setQ(text.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean).join(', '))
                  }}
                  onKeyDown={(e) => e.key === 'Escape' && (setQ(''), e.currentTarget.blur())}
                />
                {q.trim() ? (
                  <>
                    <span className="adm-find-n">
                      <b>{shown.length}</b>
                      <small>/ {inTab}</small>
                    </span>
                    <button className="adm-find-clear" onClick={() => (setQ(''), findRef.current?.focus())}>
                      CLEAR <span className="keycap">ESC</span>
                    </button>
                  </>
                ) : (
                  <span className="keycap adm-find-key">/</span>
                )}
              </div>
              <div className="adm-find-sub">
                {list ? (
                  <>
                    <span className="adm-find-chip slant">
                      <span className="unslant">LIST · {list.length} PASTED</span>
                    </span>
                    <span>
                      {list.length - missing.length} here
                      {missing.length > 0 && (
                        <>
                          {' · '}
                          <em>
                            {missing.length} not in this tab: {missing.slice(0, 6).join(', ')}
                            {missing.length > 6 ? ` +${missing.length - 6} more` : ''}
                          </em>
                        </>
                      )}
                    </span>
                  </>
                ) : (
                  <span>Tip: paste the email or ID column from the CSV to see just those people.</span>
                )}
              </div>

              {shown.length === 0 && (
                <p className="adm-empty">
                  {q.trim() ? 'NOBODY MATCHES' : tab === 'queue' ? 'NOBODY WAITING · THE QUEUE IS CLEAR' : 'NOTHING HERE'}
                </p>
              )}

              <div className="adm-list">
                {shown.map((a) => (
                  <ApplicationCard key={a.id} a={a} member={members.has(a.user_id)} onDone={load} onError={setErr} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}