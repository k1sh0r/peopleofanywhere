"use client";

import { useOnboarding } from "@/profile/onboarding";
import { CODE_ERRORS, CODE_PREFIX, GATE_MOCK, MOCK_CODES, useAccess } from "@/membership/gate";

/** Invite path: enter + validate the code. */
export function CodeScreen() {
  const code = useAccess((s) => s.code);
  const state = useAccess((s) => s.codeState);
  const inviter = useAccess((s) => s.inviter);
  const setCode = useAccess((s) => s.setCode);
  const check = useAccess((s) => s.checkCode);
  const choose = useAccess((s) => s.choose);
  const setStep = useOnboarding((s) => s.setStep);
  const err = CODE_ERRORS[state];
  return (
    <>
      <h2 className="cr-title">ENTER YOUR CODE</h2>
      <p className="cr-copy gate-lede">Codes come from members. Each one works once.</p>
      <div className={`gate-code${state === "ok" ? " gate-code--ok" : err ? " gate-code--bad" : ""}`}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onFocus={(e) => e.target.select()} // retyping a code replaces it
          onKeyDown={(e) => {
            if (e.key === "Backspace" && code === CODE_PREFIX) e.preventDefault();
          }}
          spellCheck={false}
          autoCapitalize="characters"
          autoComplete="off"
          aria-label="Invite code"
        />
        <button className="btn-primary slant gate-check" onClick={() => check()} disabled={state === "checking"}>
          <span className="unslant">{state === "checking" ? "CHECKING…" : "CHECK ▸"}</span>
        </button>
      </div>

      {state === "ok" && inviter && (
        <div className="cr-sent gate-ok">
          <b>✓ INVITED BY {inviter.name.toUpperCase()}</b>
          <p>{inviter.role} vouched for you. Finish your profile and you go live straight away.</p>
        </div>
      )}
      {err && (
        <div className="cr-error gate-err">
          {err}
          <button
            className="gate-switch"
            onClick={() => {
              setStep(0);
              choose("pay");
            }}
          >
            APPLY INSTEAD ▸
          </button>
        </div>
      )}
      {GATE_MOCK && (
        <p className="gate-preview">
          PREVIEW CODES · {Object.keys(MOCK_CODES).join(" · ")}
        </p>
      )}
    </>
  );
}