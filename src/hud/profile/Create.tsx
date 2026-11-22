"use client";

import { useEffect, useRef, useState } from "react";
import { PLAYABLE, styleOf, withGender } from "@/city/avatars/roster";
import { useDirectory } from "@/city/people/directory";
import {
  STEP_TITLE,
  stepsFor,
  useOnboarding,
  validateKey,
  type StepKey,
} from "@/profile/onboarding";
import { useAccess } from "@/membership/gate";
import { requestLook } from "@/city/player/input";
import { useGame } from "@/city/core/store";
import { isTouch } from "@/city/core/device";
import { GATE_OPTIONS } from "./create/gateOptions";
import { GateScreen } from "./create/GateScreen";
import { SigninScreen } from "./create/SigninScreen";
import { CodeScreen } from "./create/CodeScreen";
import { ResultScreen } from "./create/ResultScreen";
import { LookStep } from "./create/StepLook";
import { StepEmail } from "./create/StepEmail";
import { StepWho } from "./create/StepWho";
import { StepBuilding } from "./create/StepBuilding";
import { StepLinks } from "./create/StepLinks";
import { HangoutStep } from "./create/HangoutStep";
import { GoLiveStep } from "./create/StepGoLive";
import { InviteGoLive } from "./create/InviteGoLive";
import { QuestionStep } from "./create/StepQuestion";
import { PayStep } from "./create/PayStep";

/** "Become visible" — the gate, then character creation + profile, over the live street. */
export function Create() {
  const phase = useGame((s) => s.phase);
  const endCreate = useGame((s) => s.endCreate);
  const { step, draft: d, error, setStep, patch } = useOnboarding();
  const stage = useAccess((s) => s.stage);
  const path = useAccess((s) => s.path);
  const codeState = useAccess((s) => s.codeState);
  const member = useDirectory((s) => !!s.me);
  const signedIn = useDirectory((s) => !!s.userId);
  const panel = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState(0);
  const [signinEmail, setSigninEmail] = useState("");
  const signin = useAccess((s) => s.signin);
  const saving = useOnboarding((s) => s.mail === "sending" || s.saving);
  const paying = useAccess((s) => s.paying);
  const busy = saving || paying;
  const fee = useAccess((s) => s.fee);

  const keys: StepKey[] = stepsFor(member ? null : path);
  const key = keys[Math.min(step, keys.length - 1)];
  const last = keys.length - 1;

  const exit = () => {
    endCreate();
    requestLook();
  };
  const next = () => {
    const err = validateKey(key, d);
    if (err) return useOnboarding.setState({ error: err });
    if (step === last && !member) return useAccess.getState().finish();
    setStep(Math.min(last, step + 1));
  };
  const back = () => {
    if (step > 0) return setStep(step - 1);
    if (member) return exit();
    useAccess.getState().setStage(path === "invite" ? "code" : "gate");
  };

  // opening "Become visible": members skip the gate; an application in flight shows its status
  useEffect(() => {
    if (phase !== "create") return;
    useAccess.getState().open(useDirectory.getState().me != null);
    setSel(0);
    setSigninEmail(useOnboarding.getState().draft.email);
  }, [phase]);

  // the emailed code signed this tab in while the panel waits on "check your email":
  // a member is done — back to the street, no profile steps; an applicant sees where their application stands
  const userId = useDirectory((s) => s.userId);
  const loaded = useDirectory((s) => s.loaded);
  useEffect(() => {
    if (phase !== "create" || !userId || !loaded || useAccess.getState().stage !== "signin") return;
    if (useDirectory.getState().me) return exit();
    void useAccess.getState().loadApplication().then(() => useAccess.getState().open(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, userId, loaded]);

  useEffect(() => {
    if (phase !== "create") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.code === "Escape") return exit();
      // answers: Shift+Enter is a new line, Enter alone moves on
      if (e.code === "Enter" && e.shiftKey && t.tagName === "TEXTAREA") return;
      const a = useAccess.getState();

      if (a.stage === "gate") {
        const to = (i: number) => GATE_OPTIONS[i]?.open && setSel(i);
        if (e.code === "ArrowDown" || e.code === "KeyS") to(1);
        if (e.code === "ArrowUp" || e.code === "KeyW") to(0);
        if (e.code === "Digit1" || e.code === "Digit2") to(e.code === "Digit1" ? 0 : 1);
        if (e.code === "Enter" && !e.repeat && GATE_OPTIONS[sel].open) {
          e.preventDefault();
          setStep(0);
          a.choose(GATE_OPTIONS[sel].path);
        }
        return;
      }
      if (a.stage === "code") {
        if (e.code === "Enter" && !e.repeat) {
          e.preventDefault();
          if (a.codeState === "ok") a.setStage("steps");
          else void a.checkCode();
        }
        return;
      }
      if (a.stage === "signin") {
        if (e.code === "Enter" && !e.repeat && a.signin !== "sent" && a.signin !== "sending") {
          e.preventDefault();
          void a.signIn(signinEmail);
        }
        return;
      }
      if (a.stage === "result") return;

      // Enter = Next, from anywhere on the step (fields, chips, toggles, spots).
      // The Back / Next / Go-live buttons keep their own Enter; held keys don't skip steps.
      if (e.code === "Enter" && !t.closest(".cr-nav") && (step < last || !member)) {
        e.preventDefault();
        if (!e.repeat) document.querySelector<HTMLButtonElement>(".cr-next")?.click(); // same path as clicking: validation + sound
        return;
      }

      // Pick your look: ← → / A D / ↑ ↓ all move through the styles.
      if (key === "look" && t.tagName !== "INPUT") {
        const dir =
          e.code === "ArrowLeft" || e.code === "KeyA" || e.code === "ArrowUp"
            ? -1
            : e.code === "ArrowRight" || e.code === "KeyD" || e.code === "ArrowDown"
              ? 1
              : 0;
        if (!dir) return;
        e.preventDefault();
        const i = PLAYABLE.findIndex((c) => c.id === styleOf(d.character));
        patch({
          character: withGender(
            PLAYABLE[(i + dir + PLAYABLE.length) % PLAYABLE.length].id,
            d.gender,
          ),
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (!isTouch) panel.current?.querySelector<HTMLElement>("input, textarea")?.focus();
  }, [step, stage]);

  if (phase !== "create") return null;
  const setStage = useAccess.getState().setStage;
  const tag = member && stage !== "signin"
    ? "EDIT PROFILE"
    : stage === "signin"
      ? "SIGN IN"
      : stage === "gate"
        ? "BECOME VISIBLE"
        : path === "invite"
          ? "BECOME VISIBLE · INVITED"
          : path === "pay"
            ? "BECOME VISIBLE · APPLICATION"
            : "BECOME VISIBLE";
  // a member who just signed in stays on the sign-in screen until the panel closes (never the profile steps)
  const gated = (!member || stage === "signin") && stage !== "steps";

  return (
    <div className="cr">
      <div className="select-shade" />
      <div className={`cr-panel${gated ? " cr-panel--gate" : ""}`} ref={panel} key={gated ? stage : `${path}-${step}`}>
        <div className="cr-top">
          <span className="cr-tag slant">
            <span className="unslant">{tag}</span>
          </span>
          {!gated && (
            <>
              <span className="cr-step">
                STEP {step + 1} / {keys.length}
              </span>
              <span className="cr-pips">
                {keys.map((_, i) => (
                  <span key={i} className={i <= step ? "on" : ""} />
                ))}
              </span>
            </>
          )}
          {/* phones have no Esc: the ✕ closes the flow from any screen (the draft is kept) */}
          <button className="pp-close cr-close" onClick={exit} aria-label="Close">
            <span className="keycap">ESC</span>
          </button>
        </div>

        {gated && stage === "gate" && <GateScreen sel={sel} setSel={setSel} />}
        {gated && stage === "code" && <CodeScreen />}
        {gated && stage === "result" && <ResultScreen onDone={exit} />}
        {gated && stage === "signin" && <SigninScreen email={signinEmail} setEmail={setSigninEmail} />}

        {!gated && <h2 className="cr-title">{STEP_TITLE[key]}</h2>}

        {!gated && key === "email" && <StepEmail d={d} patch={patch} path={path} />}
        {!gated && key === "look" && <LookStep d={d} patch={patch} />}
        {!gated && key === "who" && <StepWho d={d} patch={patch} />}
        {!gated && key === "building" && <StepBuilding d={d} patch={patch} />}
        {!gated && key === "links" && <StepLinks d={d} patch={patch} />}
        {!gated && key === "hangout" && <HangoutStep d={d} patch={patch} />}
        {!gated && key === "golive" && (member ? <GoLiveStep d={d} /> : <InviteGoLive d={d} />)}
        {!gated && key === "why" && <QuestionStep d={d} patch={patch} />}
        {!gated && key === "pay" && <PayStep d={d} />}

        {error && <div className="cr-error">{error}</div>}

        {stage === "gate" && gated && (
          <div className="cr-nav">
            <button className="pp-btn slant cr-back" onClick={exit}>
              <span className="unslant">NOT NOW · STAY A GHOST</span>
            </button>
            <span className="gate-keys">
              <span className="keycap">↑</span>
              <span className="keycap">↓</span> CHOOSE <span className="keycap keycap--wide">ENTER</span>
            </span>
          </div>
        )}

        {stage === "code" && gated && (
          <div className="cr-nav">
            <button className="pp-btn slant cr-back" onClick={() => setStage("gate")}>
              <span className="unslant">◀ BACK</span>
            </button>
            <button className="btn-primary slant cr-next" disabled={codeState !== "ok"} onClick={() => setStage("steps")}>
              <span className="unslant">CONTINUE ▸</span>
            </button>
          </div>
        )}

        {stage === "signin" && gated && (
          <div className="cr-nav">
            <button className="pp-btn slant cr-back" onClick={() => setStage("gate")}>
              <span className="unslant">◀ BACK</span>
            </button>
            {signin === "sent" ? (
              <button className="pp-btn slant cr-next" onClick={() => useAccess.setState({ signin: "idle" })}>
                <span className="unslant">USE ANOTHER EMAIL</span>
              </button>
            ) : (
              <button
                className="btn-primary slant cr-next"
                disabled={signin === "sending"}
                onClick={() => useAccess.getState().signIn(signinEmail)}
              >
                <span className="unslant">{signin === "sending" ? "SENDING…" : "SEND MY CODE ▸"}</span>
              </button>
            )}
          </div>
        )}

        {!gated && (
          <div className="cr-nav">
            <button className="pp-btn slant cr-back" onClick={back}>
              <span className="unslant">◀ BACK</span>
            </button>
            {(step < last || !member) && (
              <button className="btn-primary slant cr-next" onClick={next} disabled={step === last && busy}>
                <span className="unslant">
                  {step < last
                    ? "NEXT ▸"
                    : busy
                      ? "ONE MOMENT…"
                      : key === "pay"
                        ? `SUBMIT + PAY ${fee} ▸`
                        : path === "pay" && !member
                          ? "SEND FOR REVIEW ▸"
                          : signedIn
                            ? "GO LIVE ▸"
                            : "LOG IN ▸"}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}