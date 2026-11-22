"use client";

import { CodeEntry } from "../../membership/CodeEntry";
import { GATE_MOCK, useAccess } from "@/membership/gate";
import { SIGNIN_ERRORS } from "./signinErrors";

/** Returning members and applicants: email in, code out, code in. Never creates an account. */
export function SigninScreen({ email, setEmail }: { email: string; setEmail: (e: string) => void }) {
  const state = useAccess((s) => s.signin);
  const err = SIGNIN_ERRORS[state];
  return (
    <>
      <h2 className="cr-title">WELCOME BACK</h2>
      {state !== "sent" && (
        <p className="cr-copy gate-lede">Members and applicants: we’ll email you a sign-in code. No passwords.</p>
      )}
      {state === "sent" ? (
        <CodeEntry email={email} onResend={() => useAccess.getState().signIn(email)} />
      ) : (
        <div className="cr-fields">
          <label className="cr-field">
            <span className="cr-label">EMAIL</span>
            <input
              type="email"
              inputMode="email"
              value={email}
              placeholder="you@studio.com"
              autoComplete="email"
              spellCheck={false}
              onChange={(e) => {
                setEmail(e.target.value);
                if (state !== "idle" && state !== "sending") useAccess.setState({ signin: "idle" });
              }}
            />
          </label>
        </div>
      )}
      {err && (
        <div className="cr-error gate-err">
          {err}
          {state === "unknown" && (
            <button className="gate-switch" onClick={() => useAccess.getState().setStage("gate")}>
              WAYS IN ▸
            </button>
          )}
        </div>
      )}
      {GATE_MOCK && <p className="gate-preview">PREVIEW · nothing is sent</p>}
    </>
  );
}