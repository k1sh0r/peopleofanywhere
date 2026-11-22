import { placeLabel } from "@/city/districts/registry";
import type { Draft } from "@/profile/onboarding";

/** The application summary shared by the last step of both paths. */
export function Summary({ d }: { d: Draft }) {
  return (
    <div className="cr-summary">
      <span className="cr-summary-k">NEIGHBOURHOOD</span>
      <span className="cr-summary-v">{placeLabel(d.location)}</span>
      {d.email && (
        <>
          <span className="cr-summary-k">EMAIL</span>
          <span className="cr-summary-v cr-summary-v--plain">{d.email}</span>
        </>
      )}
    </div>
  );
}