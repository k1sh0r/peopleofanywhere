"use client";

import { useState } from "react";
import { CodeEntry } from "../../membership/CodeEntry";
import { useDirectory } from "@/city/people/directory";
import { placeLabel } from "@/city/districts/registry";
import { sendEmailCode, submitProfile, useOnboarding, type Draft } from "@/profile/onboarding";
import { useGame } from "@/city/core/store";

export function GoLiveStep({ d }: { d: Draft }) {
  const userId = useDirectory((s) => s.userId);
  const email = useDirectory((s) => s.email);
  const me = useDirectory((s) => s.me);
  const mail = useOnboarding((s) => s.mail);
  const saving = useOnboarding((s) => s.saving);
  const [addr, setAddr] = useState("");
  const enter = useGame((s) => s.endCreate);
  const showToast = useGame((s) => s.showToast);

  const goLive = async () => {
    const r = await submitProfile();
    if (!r.ok) return;
    enter();
    showToast(
      me?.status === "approved"
        ? "PROFILE UPDATED"
        : "YOU’RE VISIBLE · LIVE FOR EVERYONE ONCE APPROVED",
      "good",
    );
  };

  return (
    <div className="cr-live">
      <div className="cr-summary">
        <span className="cr-summary-k">NEIGHBOURHOOD</span>
        <span className="cr-summary-v">{placeLabel(d.location)}</span>
      </div>

      {userId ? (
        <>
          <p className="cr-copy">
            Signed in as <b>{email}</b>.{" "}
            {me?.status === "approved"
              ? "Your changes go live right away."
              : "You’ll see yourself straight away; everyone else sees you once your profile is approved."}
          </p>
          <button
            autoFocus
            className="btn-primary slant cr-golive"
            onClick={goLive}
            disabled={saving}
          >
            <span className="unslant">
              {saving ? "SAVING…" : me ? "SAVE CHANGES ▸" : "GO LIVE ▸"}
            </span>
          </button>
        </>
      ) : mail === "sent" ? (
        <CodeEntry email={addr} onResend={() => sendEmailCode(addr)} />
      ) : (
        <>
          <p className="cr-copy">
            Save your profile: we email you a sign-in code. No passwords.
          </p>
          <div className="cr-email">
            <input
              type="email"
              value={addr}
              placeholder="you@studio.com"
              autoFocus
              onChange={(e) => setAddr(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendEmailCode(addr)}
              aria-label="Email"
            />
            <button
              className="btn-primary slant"
              onClick={() => sendEmailCode(addr)}
              disabled={mail === "sending"}
            >
              <span className="unslant">
                {mail === "sending" ? "SENDING…" : "SEND MY CODE ▸"}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}