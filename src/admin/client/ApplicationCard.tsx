'use client'

import { useState } from 'react'
import { placeLabel } from '@/city/districts/registry'
import type { App } from './types'
import { STATUS_LABEL } from './types'
import { adminToken, ago, money, safeUrl } from './helpers'
import { Question } from './Question'

export function ApplicationCard({ a, member, onDone, onError }: { a: App; member: boolean; onDone: () => void; onError: (e: string) => void }) {
  const [mode, setMode] = useState<'idle' | 'rejecting'>('idle')
  const [reason, setReason] = useState(a.reason ?? '')
  const [busy, setBusy] = useState(false)
  const p = a.profile
  const links = { portfolio: safeUrl(p.portfolio), linkedin: safeUrl(p.linkedin), x: safeUrl(p.x) }
  const reviewable = a.status === 'paid' || a.status === 'under_review'

  const accept = async () => {
    setBusy(true)
    const t = await adminToken()
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id }),
    })
    setBusy(false)
    const r = (await res.json().catch(() => ({}))) as { ok?: boolean; state?: string; error?: string }
    if (!r.ok) return onError(`Couldn’t approve (${r.state ?? r.error ?? res.status}).`)
    onDone()
  }

  // free applications (src/membership/applyFlags.ts) have nothing to refund
  const paid = !!a.payment_id

  const reject = async () => {
    setBusy(true)
    const t = await adminToken()
    const res = await fetch('/api/admin/reject', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, reason }),
    })
    setBusy(false)
    const r = (await res.json().catch(() => ({}))) as { ok?: boolean; status?: string; error?: string }
    if (!r.ok) onError(r.status === 'refund_failed' ? 'Rejected, but the refund failed — retry it from REFUND FAILED.' : `Couldn’t reject (${r.error ?? res.status}).`)
    setMode('idle')
    onDone()
  }

  return (
    <article className={`adm-card adm-card--${a.status}`}>
      <div className="adm-who">
        <div className="adm-status">
          <span className={`adm-chip adm-chip--${a.status}`}>{a.status === 'rejected' && !paid ? 'REJECTED' : STATUS_LABEL[a.status]}</span>
          {member && <span className="adm-chip adm-chip--invite">JOINED BY INVITE</span>}
        </div>
        <h2>{(p.name ?? 'Unnamed').toUpperCase()}</h2>
        <p className="adm-role">
          {p.role}
          {p.company ? ` · ${p.company}` : ''}
        </p>
        <dl className="adm-facts">
          <dt>FROM</dt>
          <dd>{p.location ? placeLabel(p.location) : '—'}</dd>
          {p.building && (
            <>
              <dt>BUILDING</dt>
              <dd>{p.building}</dd>
            </>
          )}
          {p.previously && (
            <>
              <dt>PREVIOUSLY</dt>
              <dd>{p.previously}</dd>
            </>
          )}
          {!!p.skills?.length && (
            <>
              <dt>SKILLS</dt>
              <dd>{p.skills.join(', ')}</dd>
            </>
          )}
          <dt>EMAIL</dt>
          <dd>{a.email}</dd>
          {a.whatsapp && (
            <>
              <dt>WHATSAPP</dt>
              <dd>
                <a className="adm-wa" href={`https://wa.me/${a.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                  {a.whatsapp} ↗
                </a>
              </dd>
            </>
          )}
          <dt>PAID</dt>
          <dd>{paid ? `${money(a)} · ${ago(a.paid_at)}` : 'FREE APPLICATION'}</dd>
          <dt>APPLIED</dt>
          <dd>{ago(a.created_at)}</dd>
        </dl>
        <div className="adm-links">
          {links.portfolio && (
            <a href={links.portfolio} target="_blank" rel="noreferrer">
              PORTFOLIO
            </a>
          )}
          {links.linkedin && (
            <a href={links.linkedin} target="_blank" rel="noreferrer">
              LINKEDIN
            </a>
          )}
          {links.x && (
            <a href={links.x} target="_blank" rel="noreferrer">
              X
            </a>
          )}
        </div>
      </div>

      <div className="adm-answers">
        <Question k="WHY HERE?" v={a.why} />
        {a.reason && !reviewable && (
          <div className="adm-q">
            <span className="adm-k">NOTE</span>
            <p>{a.reason}</p>
          </div>
        )}

        {(reviewable || a.status === 'refund_failed') && (
          <div className="adm-decide">
            {mode === 'rejecting' ? (
              <>
                <textarea
                  value={reason}
                  maxLength={400}
                  rows={2}
                  autoFocus
                  placeholder="A short, kind reason — the applicant sees this."
                  onChange={(e) => setReason(e.target.value)}
                />
                <div className="adm-row">
                  <button className="adm-ghost" onClick={() => setMode('idle')} disabled={busy}>
                    CANCEL
                  </button>
                  <button className="adm-btn adm-btn--reject slant" onClick={reject} disabled={busy}>
                    <span className="unslant">{busy ? (paid ? 'REFUNDING…' : 'REJECTING…') : paid ? `REJECT + REFUND ${money(a)} ▸` : 'REJECT ▸'}</span>
                  </button>
                </div>
              </>
            ) : a.status === 'refund_failed' ? (
              <button className="adm-btn adm-btn--reject slant" onClick={reject} disabled={busy}>
                <span className="unslant">{busy ? 'RETRYING…' : 'RETRY REFUND ▸'}</span>
              </button>
            ) : (
              <div className="adm-row">
                <button className="adm-ghost" onClick={() => setMode('rejecting')} disabled={busy}>
                  {member ? (paid ? 'REFUND (JOINED BY INVITE)' : 'CLOSE (JOINED BY INVITE)') : paid ? 'REJECT + REFUND' : 'REJECT'}
                </button>
                {!member && (
                  <button className="btn-primary slant adm-btn" onClick={accept} disabled={busy}>
                    <span className="unslant">{busy ? 'APPROVING…' : 'ACCEPT ▸'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
