import { CITY_NAME } from "@/config/site";
import type { PlaceKind } from "@/city/districts/registry";

export const ELSEWHERE: { kind: Exclude<PlaceKind, "district">; title: string; placeholder: string; label: string }[] = [
  { kind: "area", title: `OTHER IN ${CITY_NAME.toUpperCase()}`, placeholder: "Riverside, Hilltop, Old Port…", label: "WHICH AREA?" },
  { kind: "city", title: "OTHER CITY", placeholder: "Lisbon, Nairobi, Austin…", label: "WHICH CITY?" },
];