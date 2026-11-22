export function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  max,
  autoFocus,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  max: number;
  autoFocus?: boolean;
}) {
  return (
    <label className="cr-field">
      <span className="cr-label">
        {label} {hint && <em>{hint}</em>}
      </span>
      <input
        value={value}
        maxLength={max}
        placeholder={placeholder}
        autoFocus={autoFocus}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}