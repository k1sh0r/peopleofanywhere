import { APPLICATIONS_FREE } from "@/membership/applyFlags";
import type { Draft } from "@/profile/onboarding";
import type { Path } from "@/membership/gate";

export function StepEmail({ d, patch, path }: { d: Draft; patch: (p: Partial<Draft>) => void; path: Path | null }) {
  return (
    <div className="cr-fields">
      <label className="cr-field">
        <span className="cr-label">EMAIL</span>
        <input
          type="email"
          inputMode="email"
          value={d.email}
          placeholder="you@studio.com"
          autoComplete="email"
          spellCheck={false}
          onChange={(e) => patch({ email: e.target.value })}
        />
      </label>
      {path === "pay" && (
        <label className="cr-field">
          <span className="cr-label">
            WHATSAPP <em>OPTIONAL · ONLY REVIEWERS SEE IT</em>
          </span>
          <input
            type="tel"
            inputMode="tel"
            value={d.whatsapp}
            placeholder="+44 7700 900123"
            autoComplete="tel"
            maxLength={20}
            onChange={(e) => patch({ whatsapp: e.target.value })}
          />
        </label>
      )}
      <p className="cr-copy">
        {path === "invite"
          ? "Your sign-in code goes here once you’re done. No passwords."
          : APPLICATIONS_FREE
            ? "The review decision comes here, within 72 hours. No passwords."
            : "Before you pay, we’ll send a code here to confirm it’s you. The review decision comes here too."}
      </p>
    </div>
  );
}