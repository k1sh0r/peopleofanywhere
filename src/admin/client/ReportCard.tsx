'use client'

import { useState } from 'react'
import { supabase } from '@/platform/supabase'
import type { Report } from './types'
import { ago } from './helpers'
import { Question } from './Question'

/** A member reported from a chat: what they saw (the request + the last messages, copied before the chat was deleted). */
export function ReportCard({ r, onDone, onError }: { r: Report; onDone: () => void; onError: (e: string) => void }) {
  const [busy, setBusy] = useState(false)
  const who = r.snapshot.reported
  const c = r.snapshot.connection
  const resolve = async (hide: boolean) => {
    setBusy(true)
    const { data, error } = await supabase!.rpc('admin_resolve_report', { p_id: r.id, p_hide: hide })
    setBusy(false)
    if (error || !(data as { ok?: boolean } | null)?.ok) return onError(error?.message ?? 'Couldn’t update the report.')
    onDone()
  }
  const side = (id: string) => (id === r.reported_id ? (who?.name ?? 'Reported').toUpperCase() : 'REPORTER')
  return (
    <article className={`adm-card adm-card--${r.status === 'open' ? 'under_review' : 'approved'}`}>
      <div className="adm-who">
        <div className="adm-status">
          <span className={`adm-chip adm-chip--${r.status === 'open' ? 'refund_failed' : 'approved'}`}>
            {r.status === 'open' ? 'OPEN' : r.status === 'hidden' ? 'MEMBER HIDDEN' : 'RESOLVED'}
          </span>
        </div>
        <h2>{(who?.name ?? 'Unknown member').toUpperCase()}</h2>
        <p className="adm-role">{who?.role}</p>
        <dl className="adm-facts">
          <dt>REPORTED</dt>
          <dd>{ago(r.created_at)}</dd>
          <dt>CONNECTION</dt>
          <dd>
            {c.intent} · {c.status}
          </dd>
        </dl>
      </div>
      <div className="adm-answers">
        <Question k="WHAT HAPPENED (REPORTER)" v={r.reason ?? '—'} />
        {c.note && <Question k={`REQUEST NOTE (${side(c.from_id)})`} v={c.note} />}
        <div className="adm-q">
          <span className="adm-k">LAST MESSAGES ({r.snapshot.messages.length})</span>
          {r.snapshot.messages.length === 0 && <p>—</p>}
          {r.snapshot.messages.map((m, n) => (
            <p key={n}>
              <b>{side(m.from)}:</b> {m.body}
            </p>
          ))}
        </div>
        {r.status === 'open' && (
          <div className="adm-decide">
            <div className="adm-row">
              <button className="adm-ghost" onClick={() => resolve(false)} disabled={busy}>
                RESOLVE · NO ACTION
              </button>
              <button className="adm-btn adm-btn--reject slant" onClick={() => resolve(true)} disabled={busy || !r.reported_id}>
                <span className="unslant">{busy ? '…' : 'HIDE MEMBER ▸'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
