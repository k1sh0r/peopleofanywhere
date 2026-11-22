import type { Draft } from "@/profile/onboarding";
import { Field } from "./Field";

export function StepBuilding({ d, patch }: { d: Draft; patch: (p: Partial<Draft>) => void }) {
  return (
    <div className="cr-fields">
      <Field
        label="CURRENTLY BUILDING"
        hint="optional"
        value={d.building}
        onChange={(building) => patch({ building })}
        placeholder="A side project, a startup, a design system…"
        max={80}
      />
      <Field
        label="PREVIOUSLY"
        hint="optional"
        value={d.previously}
        onChange={(previously) => patch({ previously })}
        placeholder="Past teams or studios"
        max={80}
      />
      <Field
        label="SKILLS"
        hint="comma separated"
        value={d.skills}
        onChange={(skills) => patch({ skills })}
        placeholder="Figma, Motion, Design systems"
        max={120}
      />
      <button
        className={`cr-toggle${d.openToWork ? " cr-toggle--on" : ""}`}
        onClick={() => patch({ openToWork: !d.openToWork })}
      >
        <span className="cr-switch" />
        <span>
          <b>OPEN TO WORK</b>
          <em>Shows a green tag on your nameplate</em>
        </span>
      </button>
    </div>
  );
}