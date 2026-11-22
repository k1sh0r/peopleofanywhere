import { ANSWER_MAX, type Draft } from "@/profile/onboarding";
import { Answer } from "./Answer";

/** The application's one question, WHY HERE? (CLAUDE.md 5E). The step title asks it; pay path only. */
export function QuestionStep({ d, patch }: { d: Draft; patch: (p: Partial<Draft>) => void }) {
  return (
    <div className="cr-fields">
      <Answer
        label="YOUR ANSWER"
        value={d.appWhy}
        onChange={(appWhy) => patch({ appWhy })}
        placeholder="I’ve been designing here for six years and…"
        max={ANSWER_MAX}
      />
      <span className="cr-q-private">ONLY THE REVIEWERS SEE THIS · NEVER SHOWN IN THE CITY</span>
    </div>
  );
}