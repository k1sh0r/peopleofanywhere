import { getCharacter } from '@/city/avatars/roster'
import type { Conn } from '@/social/connect'

/** Who someone is at a glance: their character's colour + initials (rendered portraits: 5G-D). */
export function Portrait({ who, size = 'm' }: { who: Conn['other']; size?: 's' | 'm' }) {
  const accent = getCharacter(who.character).accent
  const n = parseInt(accent.slice(1), 16)
  const light = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.5
  const ini = who.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span className={`cn-face cn-face--${size}`} style={{ ['--accent' as string]: accent, color: light ? '#1C1F2B' : '#FFF6E5' }}>
      {ini}
    </span>
  )
}