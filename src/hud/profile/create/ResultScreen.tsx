"use client";

import { CodeEntry } from "../../membership/CodeEntry";
import { APPLICATIONS_FREE } from "@/membership/applyFlags";
import { sendEmailCode, useOnboarding } from "@/profile/onboarding";
import { GATE_MOCK, useAccess } from "@/membership/gate";
import { RESULT } from "./resultCopy";

/** After the steps (or when reopening with an application in flight). */
export function ResultScreen({ onDone }: { onDone: () => void }) {
  const result = useAccess((s) => s.result) ?? "review";
  const choose = useAccess((s) => s.choose);
  const email = useOnboarding((s) => s.draft.email);
  const setStep = useOnboarding((s) => s.setStep);
  const fee = useAccess((s) => s.fee);
  const paying = useAccess((s) => s.paying);
  const payError = useAccess((s) => s.payError);
  const reason = useAccess((s) => s.reason);
  const pay = useAccess((s) => s.pay);
  const r = RESULT[result];
  const useCode = () => {
    setStep(0);
    choose("invite");
  };
  return (
    <>
      <span className={`gate-chip gate-chip--${r.tone}`}>
        <span className="np-dot" /> {r.chip}
      </span>
      <h2 className="cr-title">{r.title}</h2>
      {/* invite path: signing in redeems the code (Session.tsx) and you're live, so the panel closes */}
      {result === "inbox" && <CodeEntry email={email} onResend={() => sendEmailCode(email)} onVerified={onDone} />}
      {result === "confirm" && (
        <>
          <p className="cr-copy gate-lede">Confirm it’s you: your application is saved the moment you sign in.</p>
          <CodeEntry email={email} onResend={() => sendEmailCode(email)} />
        </>
      )}
      {result === "saved" && (
        <>
          <p className="cr-copy gate-lede">
            {APPLICATIONS_FREE ? (
              <>Your profile and answers are saved. Send them and they go to a reviewer.</>
            ) : (
              <>
                Your profile and answers are saved. Pay the <b>{fee}</b> application fee and they go to a reviewer.
                Not approved? You get it all back.
              </>
            )}
          </p>
          {payError && <div className="cr-error">{payError}</div>}
          <p className="cr-copy gate-aside">Got an invite code meanwhile? Use it and you’re in straight away.</p>
        </>
      )}
      {result === "review" && (
        <>
          <p className="cr-copy gate-lede">
            We review every application within 72 hours. Keep an eye on <b>{email || "your inbox"}</b> — that’s
            where the decision lands. Until then you’re still a ghost, so explore all you like.
          </p>
          <p className="cr-copy gate-aside">
            {APPLICATIONS_FREE ? "Got an invite code meanwhile? Use it and you’re in straight away." : "Got an invite code meanwhile? Use it and your fee is refunded."}
          </p>
        </>
      )}
      {result === "rejected" && (
        <>
          <p className="cr-copy gate-lede">
            {APPLICATIONS_FREE
              ? "Your application wasn’t approved this time. You can still walk the city."
              : "Your application wasn’t approved, and your fee has been refunded in full. You can still walk the city."}
          </p>
          <div className="gate-note">
            <span className="cr-summary-k">REVIEWER’S NOTE</span>
            <p>{reason ?? (GATE_MOCK ? "The reviewer’s reason appears here." : "No note was left.")}</p>
          </div>
          <p className="cr-copy gate-aside">A member can still invite you in.</p>
        </>
      )}
      {result === "approved" && (
        <>
          <p className="cr-copy gate-lede">
            Welcome to the city. Sign in with your email and your avatar goes live.
          </p>
          <p className="cr-copy gate-aside">You also get <b>2 invite codes</b> — share them with people you’d vouch for.</p>
        </>
      )}
      {GATE_MOCK && <p className="gate-preview">PREVIEW · nothing was sent or charged</p>}
      <div className="cr-nav">
        {result === "saved" || result === "review" || result === "rejected" ? (
          <button className="pp-btn slant cr-back" onClick={useCode}>
            <span className="unslant">I HAVE A CODE</span>
          </button>
        ) : (
          <span />
        )}
        {result === "saved" ? (
          <button className="btn-primary slant cr-next" autoFocus onClick={() => pay()} disabled={paying}>
            <span className="unslant">{APPLICATIONS_FREE ? (paying ? "SENDING…" : "SEND FOR REVIEW ▸") : paying ? "OPENING CHECKOUT…" : `PAY ${fee} ▸`}</span>
          </button>
        ) : (
          <button className="btn-primary slant cr-next" autoFocus onClick={onDone}>
            <span className="unslant">BACK TO THE CITY ▸</span>
          </button>
        )}
      </div>
    </>
  );
}