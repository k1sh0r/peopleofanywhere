import { APPLICATIONS_FREE } from "@/membership/applyFlags";

export const RESULT: Record<string, { tag: string; title: string; chip: string; tone: "open" | "wait" | "bad" }> = {
  inbox: { tag: "INVITED", title: "CHECK YOUR EMAIL", chip: "NO REVIEW NEEDED", tone: "open" },
  confirm: { tag: "APPLICATION", title: "CHECK YOUR INBOX", chip: "CONFIRM YOUR EMAIL", tone: "wait" },
  saved: { tag: "APPLICATION", title: "ONE STEP LEFT", chip: APPLICATIONS_FREE ? "NOT SENT YET" : "PAYMENT PENDING", tone: "wait" },
  review: { tag: "APPLICATION", title: "YOU’RE ON THE WAITLIST", chip: "UNDER REVIEW", tone: "wait" },
  rejected: { tag: "APPLICATION", title: "NOT THIS TIME", chip: APPLICATIONS_FREE ? "NOT APPROVED" : "FEE REFUNDED", tone: "bad" },
  approved: { tag: "APPLICATION", title: "YOU’RE IN", chip: "APPROVED", tone: "open" },
};