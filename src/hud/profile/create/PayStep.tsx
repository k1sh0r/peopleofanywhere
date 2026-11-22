"use client";

import { APPLICATIONS_FREE } from "@/membership/applyFlags";
import { useDirectory } from "@/city/people/directory";
import { GATE_MOCK, useAccess } from "@/membership/gate";
import type { Draft } from "@/profile/onboarding";
import { Summary } from "./Summary";

/** Pay path, last step: save the application, then the Dodo checkout (5E-B). */
export function PayStep({ d }: { d: Draft }) {
  const signedIn = useDirectory((s) => !!s.userId);
  const fee = useAccess((s) => s.fee);
  const payError = useAccess((s) => s.payError);
  return (
    <div className="cr-live">
      <Summary d={d} />
      <div className="gate-pay slant">
        <span className="unslant gate-pay-body">
          <span className="gate-pay-k">APPLICATION FEE</span>
          <span className="gate-pay-v">{APPLICATIONS_FREE ? "FREE" : fee}</span>
          <span className="gate-pay-note">
            {APPLICATIONS_FREE
              ? "FREE FOR NOW · NOTHING TO PAY"
              : GATE_MOCK
                ? "PREVIEW · nothing is charged"
                : "ONE-TIME · FULL REFUND IF NOT APPROVED · SECURE CHECKOUT BY DODO PAYMENTS"}
          </span>
        </span>
      </div>
      {payError && <div className="cr-error">{payError}</div>}
      <ol className="gate-next">
        {!GATE_MOCK && !signedIn && !APPLICATIONS_FREE && (
          <li>
            <b>CONFIRM YOUR EMAIL</b> — we send {d.email || "you"} a code.{" "}
            Type it in and you go straight to payment.
          </li>
        )}
        {!APPLICATIONS_FREE && <li><b>PAY {fee}</b> on the secure checkout, then you’re back in the city.</li>}
        <li><b>WE REVIEW</b> your profile and your answer{APPLICATIONS_FREE ? " within 72 hours" : ""}. You stay a ghost meanwhile.</li>
        <li><b>APPROVED</b> — you go live in the city, with 2 invite codes of your own.</li>
        <li>{APPLICATIONS_FREE ? <><b>NOT APPROVED</b> — you can still walk the city, and a member can invite you in.</> : <><b>NOT APPROVED</b> — your fee is refunded automatically.</>}</li>
      </ol>
    </div>
  );
}