import { INTENTS, type Intent } from '@/social/intents'
import { isTouch } from '@/city/core/device'

export function IntentPicker({ value, onPick }: { value: Intent | null; onPick: (i: Intent) => void }) {
  return (
    <div className="cn-intents">
      {INTENTS.map((i, n) => (
        <button key={i.id} className={`chip slant cn-intent${value === i.id ? ' chip--on' : ''}`} onClick={() => onPick(i.id)}>
          <span className="unslant">
            <span className="cn-intent-e">{i.emoji}</span> {i.label}
            {!isTouch && <span className="keycap cn-intent-k">{n + 1}</span>}
          </span>
        </button>
      ))}
    </div>
  )
}