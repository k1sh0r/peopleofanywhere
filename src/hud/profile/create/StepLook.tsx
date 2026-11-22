import { PLAYABLE, hasGenders, styleOf, withGender, type Gender } from "@/city/avatars/roster";
import type { Draft } from "@/profile/onboarding";

export function LookStep({
  d,
  patch,
}: {
  d: Draft;
  patch: (p: Partial<Draft>) => void;
}) {
  const style = styleOf(d.character);
  const both = hasGenders(style);
  const setGender = (g: Gender) =>
    patch({ gender: g, character: withGender(d.character, g) });
  return (
    <>
      <div className="cr-gender">
        {(["m", "f"] as const).map((g) => (
          <button
            key={g}
            className={`chip slant${both && d.gender === g ? " chip--on" : ""}`}
            onClick={() => setGender(g)}
            disabled={!both}
            aria-pressed={both && d.gender === g}
          >
            <span className="unslant chip-name">
              {g === "m" ? "MALE" : "FEMALE"}
            </span>
          </button>
        ))}
        {!both && (
          <span className="cr-gender-note">
            This look is the same for everyone
          </span>
        )}
      </div>
      <div className="cr-chips">
        {PLAYABLE.map((c) => (
          <button
            key={c.id}
            className={`chip slant${c.id === style ? " chip--on" : ""}`}
            onClick={() => patch({ character: withGender(c.id, d.gender) })}
            aria-label={c.name}
          >
            <span className="chip-swatch" style={{ background: c.accent }} />
            <span className="unslant chip-name">
              {c.name.replace("THE ", "")}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}