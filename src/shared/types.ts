/* Magikal Kompas — gedeelde types
 * Afgeleid uit data/schema.md + huidige app.js/lib.js.
 * Property-keys zijn stabiel Engels (zie ADR-015 Accepted) — UI-labels komen
 * uit PNL/i18n. */

// Types (bewegingsmodel) — Engelse, stabiele sleutels
export type TypeKey =
  | "thrill_coaster"
  | "family_coaster"
  | "kiddie_coaster"
  | "spinning_coaster"
  | "drop_tower"
  | "pirate_ship"
  | "top_spin"
  | "teacups"
  | "carousel"
  | "wave_swinger"
  | "ferris_wheel"
  | "flat_spinner"
  | "water_ride"
  | "water_battle"
  | "dark_ride"
  | "transport"
  | "kiddie_flat"
  | "playground"
  | "show"
  | "funhouse"

// Eigenschap-keys — stabiel Engels (zie ADR-015 Accepted)
export type PropKey =
  | "wet"
  | "high"
  | "fast"
  | "inversions"
  | "spins"
  | "swings"
  | "dark"

export type CountryCode = "BE" | "NL" | "FR" | "DE" | "LU" | "UK" | "GB"

export interface ImageRef {
  url: string
  license: string
  attribution: string
  source_page: string
}

/** Rechten-niet-gecheckte foto, uitsluitend voor herkenning in de admin-UI.
 * Fundamenteel anders dan `image` (CC-gelicenseerd en publiek; zie ADR-014):
 * dit veld wordt NOOIT in de publieke UI gerenderd. `note` moet letterlijk
 * met `"rechten-niet-gecheckt"` beginnen — code gebruikt dat als safeguard. */
export interface AdminPreview {
  url: string
  source_page?: string
  note: string
}

/** Permanent-gesloten-status. `true` = bevestigd gesloten, `"unknown"` =
 * twijfel (admin moet bevestigen), weg/`false` = open. Zie ADR-023. */
export type ClosedFlag = true | false | "unknown"

export interface Ride {
  att: string
  oms?: string | { nl?: string; en?: string; fr?: string }
  beg: number
  zelf: number
  max: number | null
  min_age_beg?: number | null
  min_age_zelf?: number | null
  max_age?: number | null
  type: TypeKey
  props: PropKey[]
  tag_source?: string
  tag_confidence?: string
  source_url?: string
  park_url?: string
  image?: ImageRef | null
  admin_preview?: AdminPreview | null
  closed?: ClosedFlag
  closed_year?: number | null
  closed_source_url?: string
  closed_verify?: boolean
}

export interface ParkMeta {
  country?: CountryCode
  site?: string
  updated?: string
  tagging?: string
}

export interface Park {
  park: string
  logo?: string | null
  icon?: string | null
  meta: ParkMeta
  rides: Ride[]
}

// In-memory ride met park-referentie (zoals het oude RIDES.push({park, …r}))
export interface RideWithPark extends Ride {
  park: string
}

export interface Member {
  name: string
  h: number | null
  on: boolean
  birthYear?: number | null
  birthMonth?: number | null
  birthDay?: number | null
  /** Voor backwards-compat: oude opslag had `age` (jaren). Bij load gemigreerd. */
  age?: number
}

export type LengthState =
  | "alleen"
  | "begeleid"
  | "klein"
  | "groot"
  | "ontgroeid"
  | "onbekend"
export type AgeState = "alleen" | "begeleid" | "jong" | "ontgroeid" | "onbekend"
export type RideState = LengthState | AgeState

export type SortKey = "weak" | "avg"

export interface PartyState {
  people: Member[]
  typePref: Record<string, Partial<Record<TypeKey, number>>>
  propPref: Record<string, Partial<Record<PropKey, "prima" | "liever" | "nooit">>>
  forceOv: Record<string, Record<string, unknown>>
  excludedParks: Record<string, boolean>
}

export interface ParkMetrics {
  minFav: number
  avgFav: number
  minScore: number
  avgScore: number
  weakKid: { k: Member; fav: number; score: number; doable: number }
  samen: number
  begNeeded: number
  total: number
  per: Array<{ k: Member; score: number; fav: number; doable: number }>
}

// Admin candidate-foto's
export interface PhotoCandidate {
  thumb_url: string
  full_url: string
  source_page: string
  title: string
  attribution: string
  license: string
  width: number
  height: number
}
