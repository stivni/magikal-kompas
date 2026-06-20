/* Magikal Kompas — gedeelde types
 * Afgeleid uit data/schema.md + huidige app.js/lib.js.
 * Property-keys zijn stabiel Engels (zie ADR-015 Accepted) — UI-labels komen
 * uit PNL/i18n. */

// Types (bewegingsmodel) — Engelse, stabiele sleutels (ADR-003 + ADR-025)
export type TypeKey =
  // ── Coasters ──────────────────────────────────────────────────────────────
  | "wooden_coaster"
  | "family_coaster"
  | "kiddie_coaster"
  | "thrill_coaster"
  | "launch_coaster"
  | "inverted_coaster"
  | "spinning_coaster"
  | "water_coaster"     // coaster met water-finale → categorie: splash
  | "mine_train"
  | "alpine_coaster"
  // ── Flat thrill ───────────────────────────────────────────────────────────
  | "drop_tower"
  | "kiddie_drop"
  | "pirate_ship"
  | "frisbee_pendulum"
  | "top_spin"
  | "tilt_a_whirl"
  // ── Hoog + zwaai ──────────────────────────────────────────────────────────
  | "star_flyer"
  | "wave_swinger"
  | "flying_chairs"
  | "flying_bicycles"
  | "balloon_ride"
  // ── Spinners (nausea-rich) ─────────────────────────────────────────────────
  | "teacups"
  | "flat_spinner"
  | "octopus"
  // ── Klassiek-draaien ──────────────────────────────────────────────────────
  | "carousel"
  | "ferris_wheel"
  // ── Beleving ──────────────────────────────────────────────────────────────
  | "story_ride"        // belevingsrit: Droomvlucht-stijl (ADR-024)
  | "madhouse"
  // ── Water ─────────────────────────────────────────────────────────────────
  | "log_flume"
  | "rapids"
  | "splash_battle"
  // ── Speel / klauter ───────────────────────────────────────────────────────
  | "playground"
  | "funhouse"
  | "ball_pit"
  | "walkthrough_climb"
  // ── Wedijver ──────────────────────────────────────────────────────────────
  | "arcade"
  | "karting"
  | "shoot_ride"
  // ── Besturen ──────────────────────────────────────────────────────────────
  | "kids_drive"
  | "bumper_cars"
  | "pedal_boat"
  | "pedal_ride"
  | "kiddie_track_ride"
  // ── Rondrit / show ────────────────────────────────────────────────────────
  | "transport_train"
  | "slow_boat"
  | "show"
  | "walkthrough_decor"
  | "park_decor"
  | "animal_ride"

// Eigenschap-keys — stabiel Engels (zie ADR-015 Accepted)
// `high` en `fast` zijn verwijderd (ADR-024 v2): vervangen door height_intensity en intensity.
// `themed` is uit PROPS getild en is nu een gradient-veld `theming` op de ride.
export type PropKey =
  | "wet"
  | "inversions"
  | "spins"
  | "swings"
  | "dark"
  | "scary"       // bewust eng (jump-scares, horror-theming) — ADR-024
  | "nausea"      // rondtollen-mechaniek (misselijkheid mogelijk) — ADR-003 v2 / ADR-025
  | "extra_paid"  // bovenop entree bijbetalen — ADR-003 v2

/** Mate van wereld/verhaal/onderdompeling op een attractie (ADR-024). */
export type Theming = "none" | "light" | "medium" | "high"

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

/** Per-veld diff voor één wijziging-entry. `from`/`to` zijn de hele oude/nieuwe
 * waarde (ook voor arrays/objecten). Alleen velden die echt veranderden. */
export interface ActivityChange {
  from: unknown
  to: unknown
}

/** Eén entry in `Ride.activity` — twee soorten:
 *  - wijziging: { at, by, changes }
 *  - verify:    { at, by, verified: true }
 *  Cap op 3 entries; oudste rolt eruit. */
export type ActivityEntry =
  | { at: string; by: string; changes: Record<string, ActivityChange> }
  | { at: string; by: string; verified: true }

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
  /** Beleefde intensiteit 1-5 (ADR-024). Verplicht bij nieuwe tagging. */
  intensity?: number
  /** Beleefde hoogte 1-5 — gescheiden van max_height_m (ADR-024). Verplicht bij nieuwe tagging. */
  height_intensity?: number
  /** Mate van thematisatie/wereld (ADR-024) — vervangt `themed` prop. */
  theming?: Theming
  /** Technisch feit in km/u; optioneel hulpveld voor tagger/admin (ADR-024). */
  top_speed_kmh?: number | null
  /** Technisch feit in meters; optioneel hulpveld (ADR-024). */
  max_height_m?: number | null
  /** Vrije val in meters; optioneel hulpveld (ADR-024). */
  drop_m?: number | null
  /** Aantal inversies; optioneel hulpveld (ADR-024). */
  inversions_count?: number | null
  /** Rijtijd in seconden; optioneel hulpveld (ADR-024). */
  duration_s?: number | null
  /** Maximale G-kracht; optioneel hulpveld (ADR-024). */
  g_force?: number | null
  tag_source?: string
  tag_confidence?: string
  sources?: string[]
  park_url?: string
  /** Wikipedia-pagina van de attractie, indien gevonden.
   *  `string` = bevestigde URL; `null` = curator heeft gezocht maar geen passende pagina gevonden;
   *  `undefined` = nog niet gecheckt. Onderscheid voorkomt eindeloos herzoeken. */
  wikipedia_url?: string | null
  /** Fabrikant (eng. naam, zoals "Vekoma", "B&M", "Mack Rides", "Zamperla", "ABC Rides").
   *  Zelfde null/undefined-conventie als wikipedia_url. Voedt "gelijkaardige attracties"-
   *  signaal: zelfde manufacturer+model = identieke karakteristieken. */
  manufacturer?: string | null
  /** Model-naam binnen die fabrikant ("Boomerang", "Inverted Coaster", "Disk'O", …).
   *  Zelfde null/undefined-conventie als manufacturer. */
  model?: string | null
  image?: ImageRef | null
  admin_preview?: AdminPreview | null
  activity?: ActivityEntry[]
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
  /** Thematisatie-score 1-5 voor het park (ADR-024 v2).
   *  Voedt de persoons-as "thematisatie-belang".
   *  Ontbrekend → default 3 (neutraal). */
  theming_score?: number
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
  /** Manuele ster. Iedereen begint als gewone deelnemer; favoriete leden
   * verschuiven naar een eigen sectie bovenaan. Onafhankelijk van herkomst —
   * geen "mijn huishouden vs gasten"-onderscheid (zie ADR-008). */
  favorite?: boolean
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

/**
 * Gevoel-buckets voor categorie-interesses (ADR-025).
 * Afgeleid uit TypeKey via `categoryOf(type)` in scoring.ts — nooit opgeslagen op Ride.
 *
 * thrill   — Buikkriebels: val/snelheid/zwaai
 * spin     — Doldraaien: rondtollen, duizelen
 * immerse  — Andere wereld: onderdompelen in verhaal
 * splash   — Spetters: nat worden
 * compete  — Mikken: wedijver, scoren
 * drive    — Besturen: zelf sturen
 * romp     — Ravotten: zelf bewegen, klauteren
 * savor    — Slenteren: passief, kalm, kijken
 */
export type Category = "thrill" | "spin" | "immerse" | "splash" | "compete" | "drive" | "romp" | "savor"

/** Gedragsstaat per persoon per attractie (ADR-024 v2 + ADR-025 Fase 1).
 * Vijf staten:
 *  intrinsiek  — hiervoor kom ik
 *  voorGroep   — kan mee zonder drama, persoon kiest zelf (was ook "meh"/"sla over")
 *  saai        — 🥱 te saai voor mij — onder band-min, maar gaat mee
 *  alsmoet     — boven mijn keuze, opofferbaar (té hevig)
 *  nooit       — absoluut nee (boven grens, prop nooit, of niet haalbaar)
 */
export type Behavior = "intrinsiek" | "voorGroep" | "saai" | "alsmoet" | "nooit"

/**
 * Groei-signaal: aparte teller naast de 4 gedragsstaten (ADR-024 v2).
 * Betekenis: "wil wel, maar mag nog niet (te klein/te jong)".
 * Telt NIET mee als nooit — positief toekomst-signaal ("komend jaar misschien wel").
 */
export type GrowthSignal = { growth: true }

/**
 * Ontgroeid-signaal: aparte teller naast Growth en de 4 gedragsstaten.
 * Betekenis: "wil wel, maar mag niet meer (te groot/te oud — ontgroeid)".
 * Telt NIET mee als nooit — informatief signaal voor wie zegt:
 * "ben je hier uit; misschien een ander park."
 */
export type OutgrownSignal = { outgrown: true }

/** Drietrap per prop in het nieuwe voorkeur-model (ADR-024). */
export type PropTrap = "prima" | "voorGroep" | "nooit"

/** Voorkeur-data per lid (ADR-024 v2).
 * intensityBand      — [min, max] aaneengesloten band, bijv. [2,4]; null = niet ingevuld
 * intensityCeiling   — pijngrens 1-5 voor intensiteit; null = geen beperking (ADR-024 v2)
 * heightCeiling      — plafond 1-5 voor hoogte; null = geen beperking
 * heightBand         — [min, max] interesse-band voor hoogte; zelden gebruikt ("ik kom voor de hoogte"); null = niet ingevuld (ADR-024 v2)
 * themingImportance  — belang van thematisering voor park-keuze; null = niet ingevuld (ADR-024 v2)
 * categoryInterests  — set van categorieën die 😍 opleveren
 * propChoices        — per prop: prima (default) / voorGroep / nooit
 * perRideOverride    — keyed door "<parkSlug>/<att>", wint altijd van afleiding
 */
export interface MemberPrefs {
  intensityBand: [number, number] | null
  intensityCeiling: number | null
  heightCeiling: number | null
  heightBand: [number, number] | null
  themingImportance: "none" | "medium" | "high" | null
  categoryInterests: Partial<Record<Category, true>>
  propChoices: Partial<Record<PropKey, PropTrap>>
  perRideOverride: Record<string, Behavior>
}

export interface PartyState {
  people: Member[]
  excludedParks: Record<string, boolean>
  /** Voorkeur-data per lid, gekeyed op member.name (ADR-024). */
  memberPrefs: Record<string, MemberPrefs>
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
