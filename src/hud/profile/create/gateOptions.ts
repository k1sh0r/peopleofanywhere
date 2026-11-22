import { APPLICATIONS_FREE } from "@/membership/applyFlags";
import type { Path } from "@/membership/gate";

export type GateOption = {
  path: Path;
  n: string;
  title: string;
  badge: string;
  blurb: string;
  open: boolean;
};

/** Gate path choices (keyboard handler + GateScreen). */
export const GATE_OPTIONS: GateOption[] = [
  { path: "invite", n: "01", title: "I HAVE AN INVITE CODE", badge: "INSTANT", blurb: "A member vouched for you. You go live as soon as you’re done — no review.", open: true },
  {
    path: "pay",
    n: "02",
    title: "APPLY TO JOIN",
    badge: APPLICATIONS_FREE ? "FREE · REVIEWED" : "REVIEWED",
    blurb: APPLICATIONS_FREE
      ? "Build your profile, tell us why you belong here, and a reviewer decides. Free for now."
      : "Build your profile, pay the application fee, and we review it. Not approved? Full refund.",
    open: true,
  },
];