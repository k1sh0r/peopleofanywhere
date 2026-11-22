"use client";

import { useDirectory } from "@/city/people/directory";
import { useAccess } from "@/membership/gate";
import type { Draft } from "@/profile/onboarding";
import { Summary } from "./Summary";

/** Invite path, last step. */
export function InviteGoLive({ d }: { d: Draft }) {
  const inviter = useAccess((s) => s.inviter);
  const signedIn = useDirectory((s) => !!s.userId);
  return (
    <div className="cr-live">
      <Summary d={d} />
      <p className="cr-copy">
        <b>{inviter?.name ?? "A member"}</b> vouched for you, so there’s no review.{" "}
        {signedIn ? (
          <>Go live and everyone in the city can see you straight away.</>
        ) : (
          <>
            Log in and we’ll email <b>{d.email}</b> a code. Type it in and you’re on the map.
          </>
        )}
      </p>
    </div>
  );
}