import type { Draft } from "@/profile/onboarding";
import { Field } from "./Field";

export function StepLinks({ d, patch }: { d: Draft; patch: (p: Partial<Draft>) => void }) {
  return (
    <div className="cr-fields">
      <Field
        label="PORTFOLIO"
        hint="optional"
        value={d.portfolio}
        onChange={(portfolio) => patch({ portfolio })}
        placeholder="yourname.design"
        max={200}
      />
      <Field
        label="LINKEDIN"
        hint="optional"
        value={d.linkedin}
        onChange={(linkedin) => patch({ linkedin })}
        placeholder="linkedin.com/in/you"
        max={200}
      />
      <Field
        label="X"
        hint="optional"
        value={d.x}
        onChange={(x) => patch({ x })}
        placeholder="@handle"
        max={60}
      />
    </div>
  );
}