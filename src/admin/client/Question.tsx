export function Question({ k, v }: { k: string; v: string }) {
  return (
    <div className="adm-q">
      <span className="adm-k">{k}</span>
      <p>{v}</p>
    </div>
  )
}