"use client";

import { useOnboarding } from "@/profile/onboarding";
import { useAccess, type Path } from "@/membership/gate";
import { GATE_OPTIONS } from "./gateOptions";

/** Step 0 — the gate. Nothing to fill in until you know you can get in. */
export function GateScreen({ sel, setSel }: { sel: number; setSel: (n: number) => void }) {
  const choose = useAccess((s) => s.choose);
  const setStep = useOnboarding((s) => s.setStep);
  const pick = (path: Path) => {
    setStep(0);
    choose(path);
  };
  return (
    <>
      <h2 className="cr-title">HOW ARE YOU GETTING IN?</h2>
      <p className="cr-copy gate-lede">
        Anyone can walk the city. To be <b>seen</b>, a member vouches for you — or you apply.
      </p>
      <div className="gate-opts">
        {GATE_OPTIONS.map((o, i) => (
          <button
            key={o.path}
            className={`gate-opt slant${sel === i && o.open ? " gate-opt--on" : ""}${o.open ? "" : " gate-opt--off"}`}
            disabled={!o.open}
            onMouseEnter={() => o.open && setSel(i)}
            onFocus={() => o.open && setSel(i)}
            onClick={() => o.open && pick(o.path)}
          >
            <span className="unslant gate-opt-body">
              <span className="gate-opt-n">{o.n}</span>
              <span className="gate-opt-main">
                <span className="gate-opt-title">
                  {o.title} <span className={`gate-badge gate-badge--${o.open ? o.path : "soon"}`}>{o.badge}</span>
                </span>
                <span className="gate-opt-blurb">{o.blurb}</span>
              </span>
              <span className="gate-opt-go">▸</span>
            </span>
          </button>
        ))}
      </div>
      <p className="cr-copy gate-aside gate-signin">
        Already in the city, or already applied?{" "}
        <button className="gate-switch" onClick={() => useAccess.getState().setStage("signin")}>
          SIGN IN ▸
        </button>
      </p>
    </>
  );
}