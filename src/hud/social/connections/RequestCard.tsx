import { intentOf, type Intent } from '@/social/intents'

/** The request as they'll see it: who, why, and your note. */
export function RequestCard({ intent, note, from }: { intent: Intent; note: string; from: string }) {
  const i = intentOf(intent)
  return (
    <div className="cn-ask cn-ask--preview">
      <span className="cn-ask-e">{i.emoji}</span>
      <span>
        <b>
          {from.split(' ')[0].toUpperCase()} WANTS TO {i.label}
        </b>
        {note.trim() ? <q className="cn-note">{note.trim()}</q> : <em>No note</em>}
      </span>
    </div>
  )
}