/** A longer answer: cream slab like the other fields, body type so a paragraph stays readable. */
export function Answer({
  label,
  value,
  onChange,
  placeholder,
  max,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  max: number;
  rows?: number;
}) {
  const left = max - value.length;
  return (
    <label className="cr-field">
      <span className="cr-label">
        {label} <em className={left < 40 ? "cr-count cr-count--low" : "cr-count"}>{left}</em>
      </span>
      <textarea
        className="cr-answer"
        value={value}
        maxLength={max}
        rows={rows}
        placeholder={placeholder}
        enterKeyHint="next"
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}