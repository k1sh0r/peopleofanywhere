'use client'

import { intentOf } from '@/social/intents'
import type { Conn } from '@/social/connect'
import { lastActive } from '@/social/connections'
import { useNet } from '@/city/live/useNet'
import { openThread } from '@/social/chat'
import { Portrait } from './Portrait'
import { count, stamp } from './helpers'

export function ChatRow({ c, focus, i: idx }: { c: Conn; focus: boolean; i: number }) {
  const i = intentOf(c.intent)
  const online = useNet((s) => !!s.online[c.other.id])
  const unread = c.unread > 0
  const fresh = !c.last && c.dir === 'out' && !c.seen
  return (
    <button
      className={`cn-row${unread || fresh ? ' cn-row--unread' : ''}${focus ? ' cn-row--focus' : ''}`}
      style={{ ['--i' as string]: idx }}
      data-id={c.id}
      onClick={() => void openThread(c.id)}
    >
      <span className="cn-row-face">
        <Portrait who={c.other} />
        {online && <span className="cn-row-dot" aria-label="In the city now" />}
      </span>
      <span className="cn-row-body">
        <span className="cn-row-top">
          <b>{c.other.name.toUpperCase()}</b>
          <small>{stamp(lastActive(c))}</small>
        </span>
        <span className="cn-row-bottom">
          <span className="cn-row-line">
            {c.last ? (
              <>
                {c.last.mine && <span className="cn-row-you">YOU: </span>}
                {c.last.body}
              </>
            ) : (
              <em>
                {i.emoji} You both want to {i.verb} · say hi
              </em>
            )}
          </span>
          {unread ? <em className="cn-row-n">{count(c.unread)}</em> : fresh && <em className="cn-row-n cn-row-n--new">NEW</em>}
        </span>
      </span>
    </button>
  )
}
