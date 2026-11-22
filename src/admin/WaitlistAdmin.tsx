import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/platform/supabase'
import { LOCALE } from '@/config/site'

// WAITLIST (CLAUDE.md: PAUSED): who left an email while the city was paused (src/membership/waitlist.ts).
// Admins read the table directly (RLS: is_admin(); supabase/migrations/20261114120000_waitlist.sql).
// To let them in when the city reopens: make founder codes on INVITES and send one to each.

type Row = { email: string; source: 'guest' | 'member' | 'invite'; created_at: string }

const SOURCE = { guest: 'GUEST', member: 'MEMBER', invite: 'HAD AN INVITE' } as const
const when = (iso: string) =>
  new Date(iso).toLocaleString(LOCALE, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

function csv(rows: Row[]) {
  // anyone can type the email, so a cell starting with = + - @ would run as a formula in Excel / Sheets
  const q = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`
  const body = rows.map((r) => [r.email, r.source, r.created_at].map(q).join(','))
  const blob = new Blob([['email,source,joined_at', ...body].join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function WaitlistAdmin({ onError }: { onError: (e: string) => void }) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(async () => {
    // first come, first in: oldest at the top. Paged, since PostgREST caps one response at 1000 rows.
    const all: Row[] = []
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase!
        .from('waitlist')
        .select('email, source, created_at')
        .order('created_at', { ascending: true })
        .range(from, from + 999)
      if (error) {
        onError(error.message)
        return setRows((r) => r ?? [])
      }
      all.push(...((data ?? []) as Row[]))
      if (!data || data.length < 1000) break
    }
    setRows(all)
  }, [onError])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!flash) return
    const id = setTimeout(() => setFlash(null), 2200)
    return () => clearTimeout(id)
  }, [flash])

  const counts = useMemo(() => {
    const all = rows ?? []
    return { member: all.filter((r) => r.source === 'member').length, invite: all.filter((r) => r.source === 'invite').length }
  }, [rows])

  const copyEmails = async () => {
    try {
      await navigator.clipboard.writeText((rows ?? []).map((r) => r.email).join('\n'))
      setFlash(`${rows?.length ?? 0} EMAILS COPIED`)
    } catch {
      setFlash('COULDN’T COPY')
    }
  }

  return (
    <div className="adm-list">
      <section className="adm-inv-make">
        <div className="adm-inv-make-text">
          <span className="adm-k">WAITLIST · {rows?.length ?? '…'}</span>
          <p>
            Emails left on the paused title screen, first come first. {counts.member} are members, {counts.invite} came with an invite.
            When the city reopens, send each one a founder code from INVITES.
          </p>
        </div>
        <div className="adm-row">
          {flash && <span className="adm-inv-flash">{flash}</span>}
          <button className="adm-ghost" onClick={load}>
            REFRESH
          </button>
          <button className="adm-ghost" onClick={copyEmails} disabled={!rows?.length}>
            COPY EMAILS
          </button>
          <button className="adm-ghost" onClick={() => rows && csv(rows)} disabled={!rows?.length}>
            EXPORT CSV
          </button>
        </div>
      </section>

      {rows === null ? (
        <p className="adm-empty">LOADING…</p>
      ) : rows.length === 0 ? (
        <p className="adm-empty">NOBODY ON THE WAITLIST YET</p>
      ) : (
        <div className="adm-inv-table">
          {rows.map((r, i) => (
            <div key={r.email} className={`adm-inv-row adm-wl-row${r.source === 'member' ? ' adm-inv-row--joined' : ''}`}>
              <span className="adm-wl-n">#{i + 1}</span>
              <span className="adm-wl-email">{r.email}</span>
              <span className={`adm-chip adm-chip--${r.source === 'member' ? 'approved' : 'draft'}`}>{SOURCE[r.source]}</span>
              <span className="adm-inv-who">{when(r.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}