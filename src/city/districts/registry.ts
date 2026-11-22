import { PAL } from '@/config/palette'
import { CITY_NAME } from '@/config/site'

// The districts of the city (CLAUDE.md Phase 6). Built one at a time —
// unbuilt districts show as "coming soon" at the portal.

export type DistrictId =
  | 'shore'
  | 'quarter'
  | 'makers'
  | 'techpark'
  | 'coast'
  | 'business'
  | 'oldtown'
  | 'campus'
  | 'lakeside'
  | 'outskirts'
  | 'market'
  | 'highstreet'
  | 'garden'
  | 'crossroads'

export type DistrictInfo = {
  id: DistrictId
  /** Matches a profile's `location`. */
  name: string
  title: string
  /** Optional second line in a local language or script (shown under the title on the portal and travel card). */
  local?: string
  identity: string
  accent: string
  built: boolean
  /** Offered as a neighbourhood in onboarding (the rest are portal-only "coming soon"). */
  onboarding: boolean
}

/** Where guests spawn and where anyone from an unbuilt or unknown area visits: The Shore, the primary district. */
export const DEFAULT_DISTRICT: DistrictId = 'shore'

// Order is the order shown in onboarding and the portal: the default district first.
export const DISTRICTS: DistrictInfo[] = [
  { id: 'shore', name: 'The Shore', title: 'THE SHORE', identity: 'The beach · The lighthouse · The city’s front porch', accent: PAL.BUS_BLUE, built: true, onboarding: true },
  { id: 'quarter', name: 'Design Quarter', title: 'DESIGN QUARTER', identity: 'Startup · Design · Founder district', accent: PAL.FLAME, built: true, onboarding: true },
  { id: 'makers', name: 'Makers Row', title: 'MAKERS ROW', identity: 'Builder · Indie district', accent: '#1F8A70', built: true, onboarding: true },
  { id: 'techpark', name: 'Tech Park', title: 'TECH PARK', identity: 'Tech corridor · Marsh · Metro under construction', accent: '#3E5C8A', built: false, onboarding: true },
  { id: 'coast', name: 'South Coast', title: 'SOUTH COAST', identity: 'The south coast · Glowing shore at night', accent: '#1F8FA0', built: false, onboarding: true },
  { id: 'business', name: 'Business District', title: 'BUSINESS DISTRICT', identity: 'The flyover · Glass towers · Enterprise district', accent: PAL.TERRACOTTA, built: false, onboarding: true },
  { id: 'oldtown', name: 'Old Town', title: 'OLD TOWN', identity: 'Old meets new', accent: PAL.ROOF_TILE, built: false, onboarding: false },
  { id: 'campus', name: 'University Hill', title: 'UNIVERSITY HILL', identity: 'Research parks · Beach road', accent: PAL.AUTO_GREEN, built: false, onboarding: false },
  { id: 'lakeside', name: 'Lakeside', title: 'LAKESIDE', identity: 'Malls · The train terminus', accent: PAL.BOUGAIN, built: false, onboarding: false },
  { id: 'outskirts', name: 'The Outskirts', title: 'THE OUTSKIRTS', identity: 'Far-off campuses', accent: PAL.GLASS, built: false, onboarding: false },
  { id: 'market', name: 'Market Square', title: 'MARKET SQUARE', identity: 'The market · The metro hub', accent: PAL.KERB_YELLOW, built: false, onboarding: false },
  { id: 'highstreet', name: 'High Street', title: 'HIGH STREET', identity: 'The bazaar · Creative · Culture', accent: PAL.SIGN_RED, built: false, onboarding: false },
  { id: 'garden', name: 'Garden District', title: 'GARDEN DISTRICT', identity: 'Cafés · Agencies · Old bungalows', accent: PAL.WALL_PINK, built: false, onboarding: false },
  { id: 'crossroads', name: 'Crossroads', title: 'CROSSROADS', identity: 'The junction · Startups off the corridor', accent: PAL.LEAF_MID, built: false, onboarding: false },
]

export const districtInfo = (id: DistrictId) => DISTRICTS.find((d) => d.id === id)!

/** Areas typed in onboarding that belong to a district (lower case), e.g. neighbourhoods inside it. */
const AREAS: Partial<Record<DistrictId, string[]>> = {
  shore: ['the beach', 'lighthouse'],
  quarter: ['studio lane'],
  makers: ['second avenue'],
}

const norm = (s: string) => s.trim().toLowerCase()

/** The district a location names: its name, or an area inside it. Unknown / legacy locations count as the default district. */
export function districtOfLocation(location: string): DistrictInfo {
  const l = norm(location)
  return (
    DISTRICTS.find((d) => norm(d.name) === l) ??
    DISTRICTS.find((d) => AREAS[d.id]?.includes(l)) ??
    districtInfo(DEFAULT_DISTRICT)
  )
}

/**
 * Where someone says they are. profiles.location is one text field (≤ 40): a district's name, another
 * area of the city as typed ("Studio Lane"), or another city with a leading "@" ("@Lisbon"). Anything that
 * isn't in a built district visits the default district.
 */
export type PlaceKind = 'district' | 'area' | 'city'
export const CITY_MARK = '@'

export function placeKind(location: string): PlaceKind {
  if (location.startsWith(CITY_MARK)) return 'city'
  return DISTRICTS.some((d) => norm(d.name) === norm(location)) ? 'district' : 'area'
}

/** The place as typed, without the city mark. */
export const placeName = (location: string) => (location.startsWith(CITY_MARK) ? location.slice(1) : location)

/** Where Day Zero's CROSS OVER sends you from here: the default district, or (from it) the next built one. */
export function crossOverTo(here: DistrictId): DistrictInfo {
  const built = DISTRICTS.filter((d) => d.built && d.id !== here)
  return built.find((d) => d.id === DEFAULT_DISTRICT) ?? built[0]
}

/** For display: "Design Quarter, Anywhere" · "Lisbon". */
export const placeLabel = (location: string) =>
  placeKind(location) === 'city' ? placeName(location) : `${placeName(location)}, ${CITY_NAME}`

/** The district a person actually appears in right now (visitors stay in the default district). */
export function homeDistrict(location: string): DistrictId {
  const d = districtOfLocation(location)
  return d.built ? d.id : DEFAULT_DISTRICT
}
