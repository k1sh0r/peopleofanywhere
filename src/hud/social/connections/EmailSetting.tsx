'use client'

import { useConnect } from '@/social/connect'

/** Email on or off (requests, matches, unread messages). */
export function EmailSetting() {
  const emails = useConnect((s) => s.emails)
  const setEmails = useConnect((s) => s.setEmails)
  return (
    <div className="cn-you">
      <button className={`cr-toggle${emails ? ' cr-toggle--on' : ''}`} onClick={() => setEmails(!emails)}>
        <span className="cr-switch" />
        <span>
          <b>EMAIL ME</b>
          <em>When someone wants to connect, when it’s a match, and when a message waits for you</em>
        </span>
      </button>
    </div>
  )
}
