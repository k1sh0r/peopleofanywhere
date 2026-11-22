import type { Draft } from "@/profile/onboarding";
import { Field } from "./Field";

export function StepWho({ d, patch }: { d: Draft; patch: (p: Partial<Draft>) => void }) {
  return (
    <div className="cr-fields">
      <Field
        label="NAME"
        value={d.name}
        onChange={(name) => patch({ name })}
        placeholder="Ananya Rao"
        max={40}
      />
      <Field
        label="ROLE"
        value={d.role}
        onChange={(role) => patch({ role })}
        placeholder="Product Designer"
        max={60}
      />
      <Field
        label="COMPANY"
        hint="optional"
        value={d.company}
        onChange={(company) => patch({ company })}
        placeholder="Where you work"
        max={60}
      />
    </div>
  );
}