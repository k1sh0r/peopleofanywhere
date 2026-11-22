"use client";

import { useState } from "react";
import { CITY_NAME } from "@/config/site";
import {
  CITY_MARK,
  DEFAULT_DISTRICT,
  DISTRICTS,
  districtInfo,
  districtOfLocation,
  placeKind,
  placeName,
  type PlaceKind,
} from "@/city/districts/registry";
import { spotIn, type Draft } from "@/profile/onboarding";
import { Field } from "./Field";
import { ELSEWHERE } from "./hangoutElsewhere";

/** Where do you hang out: one of the five districts, or somewhere else (an empty field to type it). */
export function HangoutStep({ d, patch }: { d: Draft; patch: (p: Partial<Draft>) => void }) {
  // the chip you picked, not what the text spells: typing "Old Town" into OTHER keeps the field open
  const [kind, setKind] = useState<PlaceKind>(() => placeKind(d.location));
  const typed = placeName(d.location);
  const pickDistrict = (name: string) => {
    setKind("district");
    patch({ location: name, spot: spotIn(name, d.spot) });
  };
  const pickElsewhere = (k: Exclude<PlaceKind, "district">) => {
    if (k === kind) return;
    setKind(k);
    patch({ location: k === "city" ? CITY_MARK : "" });
  };
  const type = (v: string) => {
    const name = v.replace(/^@+/, "").slice(0, 39);
    patch({ location: kind === "city" ? CITY_MARK + name : name });
  };
  const other = ELSEWHERE.find((e) => e.kind === kind);
  const district = kind === "district" ? districtOfLocation(d.location) : null;
  const visiting = districtInfo(DEFAULT_DISTRICT).name;
  return (
    <div className="cr-fields">
      <span className="cr-label">YOUR NEIGHBOURHOOD</span>
      <div className="cr-chips cr-chips--tight">
        {DISTRICTS.filter((n) => n.onboarding).map((n) => (
          <button key={n.id} className={`chip slant${district?.id === n.id ? " chip--on" : ""}`} onClick={() => pickDistrict(n.name)}>
            <span className="unslant chip-name">{n.title}</span>
          </button>
        ))}
        {ELSEWHERE.map((e) => (
          <button key={e.kind} className={`chip slant${kind === e.kind ? " chip--on" : ""}`} onClick={() => pickElsewhere(e.kind)}>
            <span className="unslant chip-name">{e.title}</span>
          </button>
        ))}
      </div>
      {other && (
        <div style={{ marginTop: 14 }}>
          <Field key={other.kind} label={other.label} value={typed} onChange={type} placeholder={other.placeholder} max={39} autoFocus />
        </div>
      )}
      {district && !district.built && (
        <span className="cr-gender-note" style={{ margin: "8px 0 0" }}>
          {district.title} isn’t built yet. You’ll be visiting {visiting} until it is.
        </span>
      )}
      {other && (
        <span className="cr-gender-note" style={{ margin: "8px 0 0" }}>
          {kind === "city"
            ? `You’ll be visiting ${CITY_NAME}: you’ll hang out in ${visiting}.`
            : `Your area isn’t built yet. You’ll be visiting ${visiting} until it is.`}
        </span>
      )}
    </div>
  );
}