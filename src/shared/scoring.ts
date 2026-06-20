/* Magikal Kompas — scoring & toegankelijkheids-logica.
 * Pure functies; geen DOM. Identiek aan de oude app.js qua semantiek. */

import type {
  AgeState,
  Behavior,
  Category,
  GrowthSignal,
  LengthState,
  Member,
  MemberPrefs,
  OutgrownSignal,
  ParkMetrics,
  PropKey,
  Ride,
  RideState,
  TypeKey,
} from "./types"

export const GENUINE_MAX = 180

// "strengst wint": hard-uit > ontgroeid > onbekend > begeleid > alleen.
export const STATE_BUCKET: Record<RideState, number> = {
  alleen: 0,
  begeleid: 1,
  onbekend: 2,
  ontgroeid: 3,
  klein: 4,
  jong: 4,
  groot: 4,
}

export function lengthState(h: number | null | undefined, r: Ride): LengthState {
  const hasReq = r.beg != null || r.zelf != null || r.max != null
  if (h == null) return hasReq ? "onbekend" : "alleen"
  if (r.max != null && h > r.max) return r.max >= GENUINE_MAX ? "groot" : "ontgroeid"
  if (h >= r.zelf) return "alleen"
  if (h >= r.beg) return "begeleid"
  return "klein"
}

export interface AgeBound { lo: number; hi: number }

/** Bereik van mogelijke leeftijden gegeven precisie van de geboortedatum. */
export function ageRange(p: Member, today: Date): AgeBound | null {
  if (p.birthYear == null) return null
  const yT = today.getFullYear()
  const mT = today.getMonth() + 1
  const dT = today.getDate()
  const y0 = p.birthYear
  const m0 = p.birthMonth
  const d0 = p.birthDay
  if (m0 == null) return { lo: yT - y0 - 1, hi: yT - y0 }
  if (d0 == null) {
    if (mT < m0) return { lo: yT - y0 - 1, hi: yT - y0 - 1 }
    if (mT > m0) return { lo: yT - y0, hi: yT - y0 }
    return { lo: yT - y0 - 1, hi: yT - y0 }
  }
  let age = yT - y0
  if (mT < m0 || (mT === m0 && dT < d0)) age--
  return { lo: age, hi: age }
}

function ageStateFor(a: number, r: Ride): AgeState {
  if (r.max_age != null && a > r.max_age) return "ontgroeid"
  if (r.min_age_zelf != null && a >= r.min_age_zelf) return "alleen"
  if (r.min_age_beg != null && a >= r.min_age_beg) return "begeleid"
  if (r.min_age_zelf == null && r.min_age_beg == null) return "alleen"
  return "jong"
}

export function ageState(p: Member, r: Ride): AgeState {
  const hasReq =
    r.min_age_zelf != null || r.min_age_beg != null || r.max_age != null
  if (!hasReq) return "alleen"
  const range = ageRange(p, new Date())
  if (!range) return "onbekend"
  const sLo = ageStateFor(range.lo, r)
  const sHi = ageStateFor(range.hi, r)
  return sLo === sHi ? sLo : "onbekend"
}

export function status(p: Member, r: Ride): RideState {
  const L = lengthState(p.h, r)
  const A = ageState(p, r)
  return STATE_BUCKET[L] >= STATE_BUCKET[A] ? L : A
}

export const canDo = (s: RideState): boolean =>
  s === "alleen" || s === "begeleid"

export const isHardOut = (s: RideState): boolean =>
  s === "klein" || s === "jong" || s === "groot"

export function ageBorderline(p: Member, r: Ride): boolean {
  if (p.birthYear == null) return false
  if (p.birthMonth != null && p.birthDay != null) return false
  const range = ageRange(p, new Date())
  if (!range || range.lo === range.hi) return false
  return ageStateFor(range.lo, r) !== ageStateFor(range.hi, r)
}

export type PropPrefMap = Record<string, Partial<Record<PropKey, "prima" | "liever" | "nooit">>>
export type TypePrefMap = Record<string, Partial<Record<TypeKey, number>>>

export interface PrefAccess {
  tp: (name: string, t: TypeKey) => number
  pp: (name: string, p: PropKey) => "prima" | "liever" | "nooit"
}

export function makePrefAccess(typePref: TypePrefMap, propPref: PropPrefMap): PrefAccess {
  return {
    tp: (name, t) => {
      const m = typePref[name]
      return m && m[t] != null ? (m[t] as number) : 1
    },
    pp: (name, p) => {
      const m = propPref[name]
      return m && m[p] ? (m[p] as "prima" | "liever" | "nooit") : "prima"
    },
  }
}

export function joy(name: string, r: Ride, pref: PrefAccess): { ex: boolean; j: number } {
  const props = r.props || []
  for (const p of props) {
    if (pref.pp(name, p) === "nooit") return { ex: true, j: 0 }
  }
  let base = pref.tp(name, r.type)
  let pen = 0
  props.forEach((p) => {
    if (pref.pp(name, p) === "liever") pen++
  })
  return { ex: false, j: Math.max(0, base - pen) }
}

export function dotSym(s: RideState, member: Member, r: Ride): string {
  const h = member.h
  if (s === "alleen") return "✓"
  if (s === "begeleid") return "B"
  if (s === "klein") return h != null && r.beg != null ? String(r.beg - h) : "✕"
  if (s === "jong") {
    const m = r.min_age_beg != null ? r.min_age_beg : r.min_age_zelf
    const range = ageRange(member, new Date())
    return range && m != null ? (m - range.hi) + "j" : "j"
  }
  if (s === "ontgroeid") return "—"
  if (s === "onbekend") return "?"
  return "✕"
}

export function rideGroupScore(
  r: Ride,
  selectedMembers: Member[],
  pref: PrefAccess,
): { score: number; favCount: number; canCount: number; total: number } {
  let score = 0
  let favCount = 0
  let canCount = 0
  selectedMembers.forEach((k) => {
    const s = status(k, r)
    if (!canDo(s)) return
    canCount++
    const J = joy(k.name, r, pref)
    if (J.ex) return
    score += J.j
    if (J.j >= 2) favCount++
  })
  return { score, favCount, canCount, total: selectedMembers.length }
}

function childPark(
  name: string,
  k: Member,
  rides: Ride[],
  pref: PrefAccess,
): { score: number; fav: number; doable: number } {
  let score = 0
  let fav = 0
  let doable = 0
  rides.forEach((r) => {
    if (!canDo(status(k, r))) return
    const J = joy(name, r, pref)
    if (J.ex) return
    doable++
    score += J.j
    if (J.j >= 2) fav++
  })
  return { score, fav, doable }
}

export function parkMetrics(
  parkRides: Ride[],
  selectedMembers: Member[],
  pref: PrefAccess,
): ParkMetrics {
  const kids = selectedMembers
  const per = kids.map((k) => ({
    k,
    ...childPark(k.name, k, parkRides, pref),
  }))
  const favs = per.map((x) => x.fav)
  const scores = per.map((x) => x.score)
  const minFav = favs.length ? Math.min(...favs) : 0
  const avgFav = favs.length ? favs.reduce((a, b) => a + b, 0) / favs.length : 0
  const minScore = scores.length ? Math.min(...scores) : 0
  const avgScore = scores.length
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0
  let weakKid = per[0]!
  per.forEach((x) => {
    if (
      x.fav < weakKid.fav ||
      (x.fav === weakKid.fav && x.score < weakKid.score)
    )
      weakKid = x
  })
  let samen = 0
  let begNeeded = 0
  parkRides.forEach((r) => {
    const st = kids.map((k) => status(k, r))
    if (st.every(canDo)) {
      samen++
      begNeeded = Math.max(
        begNeeded,
        st.filter((s) => s === "begeleid").length,
      )
    }
  })
  return {
    minFav,
    avgFav,
    minScore,
    avgScore,
    weakKid,
    samen,
    begNeeded,
    total: parkRides.length,
    per,
  }
}

// ─── ADR-024 v2 + ADR-025: Categorieën afgeleid uit TypeKey ─────────────────

/**
 * Expliciete mapping TypeKey → Category (ADR-025).
 * Één centrale waarheid; wijziging hier raakt geen park-JSONs.
 * Record<TypeKey, Category> garandeert exhaustiveness bij compile-time.
 */
const CATEGORY_OF: Record<TypeKey, Category> = {
  // ── Coasters → thrill (uitzondering: water_coaster → splash) ────────────
  wooden_coaster:    "thrill",
  family_coaster:    "thrill",
  kiddie_coaster:    "thrill",
  thrill_coaster:    "thrill",
  launch_coaster:    "thrill",
  inverted_coaster:  "thrill",
  spinning_coaster:  "thrill",
  water_coaster:     "splash",  // primair nat, niet thrill (ADR-025 edge-case)
  mine_train:        "thrill",
  alpine_coaster:    "thrill",
  // ── Flat thrill → thrill ─────────────────────────────────────────────────
  drop_tower:        "thrill",
  kiddie_drop:       "thrill",
  pirate_ship:       "thrill",
  frisbee_pendulum:  "thrill",
  star_flyer:        "thrill",
  wave_swinger:      "thrill",
  flying_chairs:     "thrill",
  flying_bicycles:   "thrill",
  balloon_ride:      "thrill",
  top_spin:          "thrill",  // adrenaline-rijk, hoort bij Buikkriebels (ADR-025 update)
  // ── Spinners → spin ──────────────────────────────────────────────────────
  tilt_a_whirl:      "spin",
  teacups:           "spin",
  flat_spinner:      "spin",
  octopus:           "spin",
  // ── Klassiek-draaien → savor ─────────────────────────────────────────────
  carousel:          "savor",
  ferris_wheel:      "savor",
  // ── Beleving → immerse ───────────────────────────────────────────────────
  story_ride:        "immerse",
madhouse:          "immerse", // madhouse = verhaal in ruimte (Villa Volta)
  // ── Water → splash ───────────────────────────────────────────────────────
  log_flume:         "splash",
  rapids:            "splash",
  splash_battle:     "compete", // water-PvP is wedijver (ADR-025)
  // ── Speel / klauter → romp ───────────────────────────────────────────────
  playground:        "romp",
  funhouse:          "romp",
  ball_pit:          "romp",
  walkthrough_climb: "romp",
  // ── Wedijver → compete ───────────────────────────────────────────────────
  arcade:            "compete",
  karting:           "compete",
  shoot_ride:        "compete",
  // ── Besturen → drive ─────────────────────────────────────────────────────
  kids_drive:        "drive",
  bumper_cars:       "drive",
  pedal_boat:        "drive",
  pedal_ride:        "drive",
  kiddie_track_ride: "drive",
  // ── Rondrit / show → savor ───────────────────────────────────────────────
  transport_train:   "savor",
  slow_boat:         "savor",
  show:              "savor",
  walkthrough_decor: "savor",
  park_decor:        "savor",
  animal_ride:       "savor",
}

/**
 * Geeft de gevoel-categorie voor een TypeKey (ADR-025).
 * Eén attractie heeft altijd precies één categorie.
 */
export function categoryOf(type: TypeKey): Category {
  return CATEGORY_OF[type] ?? "savor" // fallback voor onbekende toekomstige types
}

/**
 * Bepaalt de categorie van een attractie — array voor backwards-compat
 * met callers die `.some()` gebruiken.
 *
 * Match enkel op TYPE — niet op props. Een waterspeeltuin (playground + wet)
 * blijft een speeltuin, geen waterattractie. Props spelen hun eigen rol
 * via de drietrap; ze bepalen niet de categorie van een ride.
 */
function rideCategories(r: Ride): Category[] {
  return [categoryOf(r.type)]
}

/**
 * Resultaat van deriveBehaviorResult: ofwel een Behavior of een GrowthSignal.
 * Gebruik deriveBehavior() als je alleen de Behavior nodig hebt (growth → nooit
 * als fallback voor backwards-compat). Gebruik deriveBehaviorResult() voor het
 * volledige signaal inclusief 🌱.
 */
export type BehaviorResult = { behavior: Behavior } | GrowthSignal | OutgrownSignal

/**
 * Leidt de gedragsstaat af voor één persoon op één attractie (ADR-024 v2).
 *
 * Geeft { behavior } of { growth: true } terug. Volgorde van checks:
 *
 * 1.  perRideOverride wint altijd.
 * 2.  canDo false (hard-out of te klein):
 *       — hypothetisch (zonder canDo) ≥ voorGroep? → { growth: true } (🌱)
 *       — anders: { behavior: "nooit" }
 * 3.  prop nooit → nooit
 * 4.  height_intensity > heightCeiling + 1 → nooit; == heightCeiling + 1 → alsmoet
 *     (heightCeiling = "tot dit niveau inclusief OK" — anders dan intensityCeiling)
 * 5.  intensity ≥ intensityCeiling (indien gezet) → nooit (✕-cel = "vanaf hier no way")
 * 6.  categorie-match → intrinsiek
 * 7.  intensity ∈ intensityBand (indien gezet) → intrinsiek
 * 8.  heeft intensityBand?
 *       ja:  intensity < band[0]  → voorGroep
 *            intensity > band[1]  → alsmoet
 *     nee: heeft intensityCeiling?
 *              ja:  intensity < ceiling → alsmoet (expliciete opoffering)
 *              nee:                    → voorGroep (default, geen mening)
 * 9.  prop voorGroep → alsmoet
 */
export function deriveBehaviorResult(
  member: Member,
  ride: Ride,
  prefs: MemberPrefs,
  parkSlug: string,
): BehaviorResult {
  const overrideKey = `${parkSlug}/${ride.att}`

  // 1. Per-ride override
  if (prefs.perRideOverride[overrideKey] != null) {
    return { behavior: prefs.perRideOverride[overrideKey]! }
  }

  // 2. canDo check
  const rideStatus = status(member, ride)
  if (!canDo(rideStatus)) {
    // Bepaal hypothetische uitkomst alsof canDo waar zou zijn.
    // Alleen als die hypothetische uitkomst zelf "nooit" is (prop-nooit of
    // expliciete no-way-grens) blijft 🙅 — dan is canDo niet de reden.
    // In alle andere gevallen (intrinsiek/voorGroep/alsmoet) signaleren we
    // groei (te klein/jong) of ontgroeid (te groot/oud): de persoon kon of
    // zou anders meegaan.
    const hypothetical = _deriveBehaviorWithoutCanDo(member, ride, prefs, parkSlug)
    if (hypothetical === "nooit") {
      return { behavior: "nooit" }
    }
    if (rideStatus === "groot" || rideStatus === "ontgroeid") {
      return { outgrown: true }
    }
    return { growth: true }
  }

  return { behavior: _deriveBehaviorWithoutCanDo(member, ride, prefs, parkSlug) }
}

/**
 * Interne helper: afleidingslogica zonder canDo-check.
 * Bevat stappen 3-9 van de ADR-024 v2 detectie-regels.
 */
function _deriveBehaviorWithoutCanDo(
  _member: Member,
  ride: Ride,
  prefs: MemberPrefs,
  parkSlug: string,
): Behavior {
  const overrideKey = `${parkSlug}/${ride.att}`

  // Per-ride override (ook hier van toepassing voor de hypothetische berekening)
  if (prefs.perRideOverride[overrideKey] != null) {
    return prefs.perRideOverride[overrideKey]!
  }

  const props = ride.props || []
  const ri = ride.intensity
  const rh = ride.height_intensity
  const band = prefs.intensityBand
  const hCeil = prefs.heightCeiling
  const iCeil = prefs.intensityCeiling

  // ── A. Alle "nooit"-condities (strengste eerst, alle assen samen) ─────────
  // Iedere harde uitsluiting wint van categorie/band/alsmoet.
  // Hoogte: "comfortabel of niet" — boven plafond is direct nooit (geen alsmoet-tussenzone).
  for (const p of props) {
    if ((prefs.propChoices[p] ?? "prima") === "nooit") return "nooit"
  }
  if (iCeil != null && ri != null && ri >= iCeil) return "nooit"
  if (hCeil != null && rh != null && rh > hCeil) return "nooit"

  // ── B. Positieve aantrekking: categorie ÉN in-band → intrinsiek ──────────
  // Beide voorwaarden moeten gelden. Één van beide volstaat niet.
  //
  // Edge-cases (beide leiden tot doorval naar C/D):
  //  • band == null: geen intensiteits-anker → AND nooit waar; catMatch alleen
  //    → voorGroep (we durven 😍 niet uit te roepen zonder band-context).
  //  • ri == null: ride heeft geen intensity-tag → AND niet evalueerbaar;
  //    → valt door naar rest van de afleiding.
  const rideCats = rideCategories(ride)
  const catMatch = rideCats.some((cat) => prefs.categoryInterests[cat])
  if (catMatch && band != null && ri != null && ri >= band[0] && ri <= band[1]) {
    return "intrinsiek"
  }

  // ── C. "Alsmoet"-condities (alle bronnen verzamelen, eerst-match wint) ───
  for (const p of props) {
    if ((prefs.propChoices[p] ?? "prima") === "voorGroep") return "alsmoet"
  }
  if (band != null && ri != null && ri > band[1]) return "alsmoet"
  if (band == null && iCeil != null) {
    // Geen band, wel ceiling → expliciete opoffering onder ceiling
    return "alsmoet"
  }

  // ── D. Onder band → saai ─────────────────────────────────────────────────
  // Alleen als intensityBand gezet is én ride-intensity onder band[0] ligt.
  // Zonder band kan niet worden bepaald of iets "te saai" is → voorGroep (fallback).
  if (band != null && ri != null && ri < band[0]) return "saai"

  // ── Fallback ─────────────────────────────────────────────────────────────
  return "voorGroep"
}

/**
 * Convenience wrapper: geeft Behavior terug (growth wordt nooit als fallback).
 * Gebruik voor UI-code die geen onderscheid hoeft te maken tussen groei en nooit.
 */
export function deriveBehavior(
  member: Member,
  ride: Ride,
  prefs: MemberPrefs,
  parkSlug: string,
): Behavior {
  const result = deriveBehaviorResult(member, ride, prefs, parkSlug)
  if ("growth" in result || "outgrown" in result) return "nooit"
  return result.behavior
}

export interface BehaviorCounts {
  intrinsiek: number
  voorGroep: number
  /** 🥱 te saai — onder band-min, maar gaat mee (ADR-025 Fase 1). */
  saai: number
  alsmoet: number
  nooit: number
  /** 🌱 groei-signaal: wil wel, mag nog niet (te klein/te jong). */
  growth: number
  /** 🍂 ontgroeid-signaal: wil wel, mag niet meer (te groot/te oud). */
  outgrown: number
}

/**
 * Telt de gedragsstaten voor alle attracties in een park voor één lid (ADR-024 v2).
 * Returns 4 gedragsstaten + groei- + ontgroeid-signaal.
 */
export function parkBehaviorCounts(
  rides: Ride[],
  member: Member,
  prefs: MemberPrefs,
  parkSlug: string,
): BehaviorCounts {
  const counts: BehaviorCounts = {
    intrinsiek: 0,
    voorGroep: 0,
    saai: 0,
    alsmoet: 0,
    nooit: 0,
    growth: 0,
    outgrown: 0,
  }
  for (const ride of rides) {
    const result = deriveBehaviorResult(member, ride, prefs, parkSlug)
    if ("growth" in result) counts.growth++
    else if ("outgrown" in result) counts.outgrown++
    else counts[result.behavior]++
  }
  return counts
}

/**
 * Park-score per persoon (ADR-024 v2):
 * 3 × intrinsiek + 1 × voorGroep − 1 × alsmoet
 */
export function parkScore(
  rides: Ride[],
  member: Member,
  prefs: MemberPrefs,
  parkSlug: string,
): number {
  const c = parkBehaviorCounts(rides, member, prefs, parkSlug)
  return 3 * c.intrinsiek + 1 * c.voorGroep - 1 * c.alsmoet
}

/**
 * Geeft true als het lid een begeleider nodig heeft op deze attractie (ADR-024 v2).
 * Voedt de 🅱-marker in de UI.
 */
export function isCompanionNeeded(member: Member, ride: Ride): boolean {
  return status(member, ride) === "begeleid"
}

/** Groeps-aggregatie: hoeveel leden kunnen op deze ride (geen 🙅), en of
 *  er minstens één begeleiding nodig heeft. Strikt: 🙅 (welke bron dan ook)
 *  telt als niet-kunnen; 🌱/🍂 (signalen) tellen ook als niet-kunnen. */
export interface GroupKanFraction {
  passed: number
  total: number
  needsCompanion: boolean
}

export function groupKanFraction(
  ride: Ride,
  members: Member[],
  partyPrefs: Record<string, MemberPrefs>,
  parkSlug: string,
): GroupKanFraction {
  let passed = 0
  let needsCompanion = false
  for (const m of members) {
    const prefs = partyPrefs[m.name]
    if (!prefs) {
      // Geen prefs ingesteld → val terug op canDo (lengte/leeftijd) zonder voorkeur-blokkering
      if (canDo(status(m, ride))) {
        passed++
        if (isCompanionNeeded(m, ride)) needsCompanion = true
      }
      continue
    }
    const result = deriveBehaviorResult(m, ride, prefs, parkSlug)
    if ("behavior" in result && result.behavior !== "nooit") {
      passed++
      if (isCompanionNeeded(m, ride)) needsCompanion = true
    }
  }
  return { passed, total: members.length, needsCompanion }
}

/** Groeps-wil-score: per lid dat kan, +1 voor 😍, 0 voor 🙂, −1 voor 😰.
 *  Leden die niet kunnen (🙅 of growth/outgrown) tellen niet mee.
 *  Returnt netto-score plus splitsing (plus = aantal 😍, minus = aantal 😰). */
export interface GroupWilScore {
  net: number
  plus: number
  minus: number
  /** Aantal leden dat meedeed aan de score (kan en heeft prefs). */
  counted: number
}

export function groupWilScore(
  ride: Ride,
  members: Member[],
  partyPrefs: Record<string, MemberPrefs>,
  parkSlug: string,
): GroupWilScore {
  let plus = 0
  let minus = 0
  let counted = 0
  for (const m of members) {
    const prefs = partyPrefs[m.name]
    if (!prefs) continue
    const result = deriveBehaviorResult(m, ride, prefs, parkSlug)
    if (!("behavior" in result)) continue // growth/outgrown → niet meetellen
    if (result.behavior === "nooit") continue
    counted++
    if (result.behavior === "intrinsiek") plus++
    else if (result.behavior === "alsmoet") minus++
  }
  return { net: plus - minus, plus, minus, counted }
}

/**
 * Detail-trace per regel — voor de hover-popover.
 * Eén entry per ADR-024 v2 detectie-stap; `matched` = welke regel uiteindelijk vuurde.
 */
export interface RuleTrace {
  label: string
  detail: string
  matched: boolean
  /** True voor stappen die niet konden draaien (geen data, regel n.v.t.). */
  skipped?: boolean
}

export interface BehaviorTrace {
  rideStatus: RideState
  finalState: Behavior | "growth" | "outgrown"
  rules: RuleTrace[]
}

/**
 * Drie compacte zinnen voor de hover-popover — mensentaal, één per as.
 * Het blok dat de finale uitkomst bepaalt staat `active: true`; de rest is
 * gedimd. Bedoeld voor lezen, niet voor debug-trace.
 */
export interface SimpleExplain {
  finalState: BehaviorTrace["finalState"]
  finalSentence: string
  limits: { active: boolean; sentence: string }
  preferences: { active: boolean; sentence: string }
  parkRules: { active: boolean; sentence: string }
}

const PROP_NL: Record<PropKey, string> = {
  wet: "nat worden",
  dark: "donker",
  scary: "engheid",
  spins: "snel ronddraaien",
  inversions: "over de kop",
  swings: "schommelen",
  nausea: "rondtollen (misselijkheid)",
  extra_paid: "extra betalen",
}

const CAT_NL: Record<Category, string> = {
  thrill:  "buikkriebels-ritten",
  spin:    "tolritten",
  immerse: "belevingsritten",
  splash:  "waterritten",
  compete: "wedijver-attracties",
  drive:   "besturitten",
  romp:    "ravot-attracties",
  savor:   "slenternummers",
}

/** Heel korte match-tag (2-5 woorden) voor in de expanded view per deelnemer.
 *  Geen volle zin — bedoeld voor compacte rechter-kolom. */
export function briefMatch(
  member: Member,
  ride: Ride,
  prefs: MemberPrefs,
  parkSlug: string,
): string {
  const result = deriveBehaviorResult(member, ride, prefs, parkSlug)
  const rideStatus = status(member, ride)
  const overrideKey = `${parkSlug}/${ride.att}`

  if (prefs.perRideOverride[overrideKey] != null) {
    return `override: ${prefs.perRideOverride[overrideKey]}`
  }

  if ("growth" in result) {
    if (rideStatus === "klein") {
      const need = ride.beg ?? ride.zelf
      const have = member.h
      if (need != null && have != null) return `nog ${need - have}cm te klein`
      return "nog te klein"
    }
    if (rideStatus === "jong") return "nog te jong"
    return "nog niet groot genoeg"
  }
  if ("outgrown" in result) {
    if (rideStatus === "groot" || rideStatus === "ontgroeid") return "ontgroeid"
    return "uit deze attractie"
  }

  if (!canDo(rideStatus)) {
    if (rideStatus === "klein") return "te klein"
    if (rideStatus === "jong") return "te jong"
    if (rideStatus === "groot" || rideStatus === "ontgroeid") return "ontgroeid"
    if (rideStatus === "onbekend") return "data onbekend"
    return "niet haalbaar"
  }

  const props = ride.props || []
  const nooitProp = (props as PropKey[]).find(
    (p) => (prefs.propChoices[p] ?? "prima") === "nooit",
  )
  if (nooitProp) return `${PROP_NL[nooitProp]} = nooit`

  const ri = ride.intensity
  const rh = ride.height_intensity
  const iCeil = prefs.intensityCeiling
  const hCeil = prefs.heightCeiling
  if (iCeil != null && ri != null && ri >= iCeil) return `intensiteit ≥ ${iCeil}`
  if (hCeil != null && rh != null && rh > hCeil) return `boven hoogte ${hCeil}`

  const cats = rideCategories(ride)
  const matchedCat = cats.find((c) => prefs.categoryInterests[c])
  if (matchedCat) return `via ${CAT_NL[matchedCat]}`

  const band = prefs.intensityBand
  if (band != null && ri != null && ri >= band[0] && ri <= band[1]) {
    return `in band [${band[0]}–${band[1]}]`
  }

  const voorGroepProp = (props as PropKey[]).find(
    (p) => (prefs.propChoices[p] ?? "prima") === "voorGroep",
  )
  if (voorGroepProp) return `${PROP_NL[voorGroepProp]} alleen voor groep`

  if (band != null && ri != null && ri > band[1]) return `boven band [${band[0]}–${band[1]}]`
  if (band != null && ri != null && ri < band[0]) return `te saai (≥ ${band[0]} nodig)`
  if (band == null && iCeil != null) return "opoffering onder grens"

  return "geen voorkeur"
}

export function explainSimple(
  member: Member,
  ride: Ride,
  prefs: MemberPrefs,
  parkSlug: string,
): SimpleExplain {
  const result = deriveBehaviorResult(member, ride, prefs, parkSlug)
  const finalState: BehaviorTrace["finalState"] = "growth" in result
    ? "growth"
    : "outgrown" in result
      ? "outgrown"
      : result.behavior

  const rideStatus = status(member, ride)
  const name = member.name
  const props = ride.props || []
  const ri = ride.intensity
  const rh = ride.height_intensity
  const band = prefs.intensityBand
  const iCeil = prefs.intensityCeiling
  const hCeil = prefs.heightCeiling

  // ── Beperkingen ──
  const nooitProp = (props as PropKey[]).find(
    (p) => (prefs.propChoices[p] ?? "prima") === "nooit",
  )
  const hardIntensity = iCeil != null && ri != null && ri >= iCeil
  const hardHeight = hCeil != null && rh != null && rh > hCeil

  let limitsActive = false
  let limitsSentence = "Geen harde beperkingen"

  // Bepaal welke beperking de uitkomst veroorzaakte (volgorde uit detection)
  if (finalState === "nooit") {
    if (nooitProp) {
      limitsActive = true
      limitsSentence = `${name} doet nooit attracties met ${PROP_NL[nooitProp]}`
    } else if (hardIntensity) {
      limitsActive = true
      limitsSentence = `${name} gaat no-way bij intensiteit ${iCeil} of hoger`
    } else if (hardHeight) {
      limitsActive = true
      limitsSentence = `${name} vermijdt attracties boven hoogte-niveau ${hCeil}`
    }
    // Anders: nooit door canDo (geen growth/outgrown match) — beperkingen
    // niet de oorzaak, parkregels-blok wordt actief.
  } else {
    // Niet-actief, maar beschrijf eventuele instellingen kort
    const parts: string[] = []
    if (iCeil != null) parts.push(`grens vanaf intensity ${iCeil}`)
    if (hCeil != null) parts.push(`hoogte tot ${hCeil}`)
    const nooitProps = (props as PropKey[]).filter(
      (p) => (prefs.propChoices[p] ?? "prima") === "nooit",
    )
    if (nooitProps.length)
      parts.push(`nooit-props: ${nooitProps.map((p) => PROP_NL[p]).join(", ")}`)
    if (parts.length === 0) {
      limitsSentence = `${name} heeft geen harde beperkingen ingesteld`
    } else {
      limitsSentence = `Geen beperking geraakt (${parts.join("; ")})`
    }
  }

  // ── Interesses ──
  const cats = rideCategories(ride)
  const matchedCat = cats.find((c) => prefs.categoryInterests[c])
  const inBand =
    band != null && ri != null && ri >= band[0] && ri <= band[1]
  const aboveBand = band != null && ri != null && ri > band[1]
  const underBand = band != null && ri != null && ri < band[0]
  const voorGroepProp = (props as PropKey[]).find(
    (p) => (prefs.propChoices[p] ?? "prima") === "voorGroep",
  )

  let prefsActive = false
  let prefsSentence = ""

  if (finalState === "intrinsiek") {
    prefsActive = true
    if (matchedCat) {
      prefsSentence = `${CAT_NL[matchedCat]} vallen binnen ${name}'s interesses`
    } else if (inBand) {
      prefsSentence = `Intensiteit ${ri} valt in ${name}'s interesse-band [${band![0]}–${band![1]}]`
    } else {
      prefsSentence = `${name} komt hier graag voor`
    }
  } else if (finalState === "saai") {
    prefsActive = true
    prefsSentence = `Te saai voor ${name} — onder de interesse-band, maar gaat mee`
  } else if (finalState === "voorGroep") {
    prefsActive = true
    prefsSentence = `${name} heeft geen sterke mening, gaat mee zonder drama`
  } else if (finalState === "alsmoet") {
    prefsActive = true
    if (voorGroepProp) {
      prefsSentence = `${name} doet ${PROP_NL[voorGroepProp]} alleen voor de groep`
    } else if (aboveBand) {
      prefsSentence = `Boven ${name}'s interesse-band — opofferen voor de groep`
    } else if (band == null && iCeil != null) {
      prefsSentence = `${name} heeft geen actieve interesse — gaat opofferend mee onder de grens`
    } else {
      prefsSentence = `${name} gaat alleen mee als 't moet`
    }
  } else if (finalState === "growth" || finalState === "outgrown") {
    // Voor 🌱/🍂: toon hypothetische interesse als context
    if (matchedCat) {
      prefsSentence = `${CAT_NL[matchedCat]} vallen binnen ${name}'s interesses`
      prefsActive = true
    } else if (inBand) {
      prefsSentence = `Intensiteit ${ri} zou in ${name}'s interesse-band passen`
      prefsActive = true
    } else {
      prefsSentence = `Geen actieve interesse vastgesteld`
    }
  } else {
    // nooit door beperking of canDo: interesses niet actief
    if (cats.length === 0 && band == null && iCeil == null) {
      prefsSentence = `${name} heeft geen interesses ingesteld`
    } else if (matchedCat) {
      prefsSentence = `${CAT_NL[matchedCat]} valt binnen ${name}'s interesses (overruled)`
    } else if (inBand) {
      prefsSentence = `Intensiteit valt in band (overruled door beperking)`
    } else {
      prefsSentence = `Geen interesse-match voor deze attractie`
    }
  }

  // ── Parkregels ──
  let parkActive = false
  let parkSentence = ""
  if (rideStatus === "alleen") {
    parkSentence = `${name} mag op de attractie (zonder begeleiding)`
  } else if (rideStatus === "begeleid") {
    parkActive = isCompanionNeeded(member, ride) // alleen highlighten als relevant
    parkSentence = `${name} mag mits begeleiding 🅱`
  } else if (rideStatus === "klein") {
    parkActive = true
    const need = ride.beg
    const have = member.h
    parkSentence =
      need != null && have != null
        ? `${name} is te klein (${have}cm, ride vereist ${need}cm)`
        : `${name} is te klein voor de attractie`
  } else if (rideStatus === "jong") {
    parkActive = true
    parkSentence = `${name} is te jong voor de attractie`
  } else if (rideStatus === "groot") {
    parkActive = true
    parkSentence = `${name} is uit deze attractie gegroeid (max ${ride.max}cm)`
  } else if (rideStatus === "ontgroeid") {
    parkActive = true
    parkSentence = `${name} is uit deze attractie gegroeid`
  } else if (rideStatus === "onbekend") {
    parkSentence = `Niet zeker — vul lengte/leeftijd in voor ${name}`
  }

  // ── Eindzin ──
  const finalSentences: Record<BehaviorTrace["finalState"], string> = {
    intrinsiek: `hiervoor komt ${name}`,
    voorGroep: `${name} gaat mee, geen drama`,
    saai: `te saai voor ${name}, maar gaat mee`,
    alsmoet: `${name} doet het alleen als 't moet`,
    nooit: `niet doen`,
    growth: `kan nog niet (groeit er nog naartoe)`,
    outgrown: `kan niet meer (ontgroeid)`,
  }

  return {
    finalState,
    finalSentence: finalSentences[finalState],
    limits: { active: limitsActive, sentence: limitsSentence },
    preferences: { active: prefsActive, sentence: prefsSentence },
    parkRules: { active: parkActive, sentence: parkSentence },
  }
}

export function traceBehavior(
  member: Member,
  ride: Ride,
  prefs: MemberPrefs,
  parkSlug: string,
): BehaviorTrace {
  const result = deriveBehaviorResult(member, ride, prefs, parkSlug)
  const finalState: BehaviorTrace["finalState"] = "growth" in result
    ? "growth"
    : "outgrown" in result
      ? "outgrown"
      : result.behavior

  const rideStatus = status(member, ride)
  const overrideKey = `${parkSlug}/${ride.att}`
  const rules: RuleTrace[] = []

  // 1. Override
  const ovr = prefs.perRideOverride[overrideKey]
  rules.push({
    label: "Per-attractie-override",
    detail: ovr ?? "geen",
    matched: ovr != null,
  })
  if (ovr != null) return { rideStatus, finalState, rules }

  // 2. canDo
  const canDoOk = canDo(rideStatus)
  rules.push({
    label: "canDo (lengte/leeftijd)",
    detail: `status: ${rideStatus}`,
    matched: !canDoOk,
  })
  if (!canDoOk) return { rideStatus, finalState, rules }

  const props = ride.props || []
  const ri = ride.intensity
  const rh = ride.height_intensity
  const band = prefs.intensityBand
  const hCeil = prefs.heightCeiling
  const iCeil = prefs.intensityCeiling

  // ── A. Harde uitsluitingen — strengste eerst ─────────────────────────────
  const nooitProp = props.find((p) => (prefs.propChoices[p] ?? "prima") === "nooit")
  rules.push({
    label: "Prop op 'nooit'",
    detail: nooitProp ? `${nooitProp}: nooit → 🙅` : "geen",
    matched: nooitProp != null,
  })
  if (nooitProp) return { rideStatus, finalState, rules }

  const intensityCeilMatched =
    iCeil != null && ri != null && ri >= iCeil
  rules.push({
    label: "Intensity ≥ no way!-grens",
    detail:
      iCeil == null
        ? "geen grens gezet"
        : ri == null
          ? "ride heeft geen intensity"
          : intensityCeilMatched
            ? `intensity ${ri} ≥ grens ${iCeil} → 🙅`
            : `intensity ${ri} < grens ${iCeil} → OK`,
    matched: intensityCeilMatched,
    skipped: iCeil == null || ri == null,
  })
  if (intensityCeilMatched) return { rideStatus, finalState, rules }

  const heightOverMatched =
    hCeil != null && rh != null && rh > hCeil
  rules.push({
    label: "Hoogte > plafond",
    detail:
      hCeil == null
        ? "geen plafond gezet"
        : rh == null
          ? "ride heeft geen height_intensity"
          : heightOverMatched
            ? `h_int ${rh} > plafond ${hCeil} → 🙅`
            : `h_int ${rh} ≤ plafond ${hCeil} → OK`,
    matched: heightOverMatched,
    skipped: hCeil == null || rh == null,
  })
  if (heightOverMatched) return { rideStatus, finalState, rules }

  // ── B. Positieve aantrekking → intrinsiek ────────────────────────────────
  const rideCats = rideCategories(ride)
  const matchedCat = rideCats.find((cat) => prefs.categoryInterests[cat])
  rules.push({
    label: "Categorie-match",
    detail: matchedCat
      ? `${matchedCat} aangevinkt → 😍`
      : `ride-cats: [${rideCats.join(",") || "geen"}]`,
    matched: matchedCat != null,
    skipped: rideCats.length === 0,
  })
  if (matchedCat) return { rideStatus, finalState, rules }

  const inBandMatched =
    band != null && ri != null && ri >= band[0] && ri <= band[1]
  rules.push({
    label: "Intensity in interesse-band",
    detail:
      band == null
        ? "geen band gezet"
        : ri == null
          ? "ride heeft geen intensity"
          : inBandMatched
            ? `intensity ${ri} ∈ band [${band[0]},${band[1]}] → 😍`
            : `intensity ${ri} ∉ band [${band[0]},${band[1]}]`,
    matched: inBandMatched,
    skipped: band == null,
  })
  if (inBandMatched) return { rideStatus, finalState, rules }

  // ── C. Alsmoet-condities ─────────────────────────────────────────────────
  const voorGroepProp = props.find(
    (p) => (prefs.propChoices[p] ?? "prima") === "voorGroep",
  )
  rules.push({
    label: "Prop op 'voor de groep'",
    detail: voorGroepProp ? `${voorGroepProp}: voorGroep → 😰` : "geen",
    matched: voorGroepProp != null,
  })
  if (voorGroepProp) return { rideStatus, finalState, rules }

  const aboveBandAlsmoet =
    band != null && ri != null && ri > band[1]
  rules.push({
    label: "Intensity boven band, onder grens",
    detail:
      band == null || ri == null
        ? "n.v.t."
        : aboveBandAlsmoet
          ? `intensity ${ri} > band[${band[1]}] → 😰`
          : `intensity ${ri} ≤ band[${band[1]}]`,
    matched: aboveBandAlsmoet,
    skipped: band == null || ri == null,
  })
  if (aboveBandAlsmoet) return { rideStatus, finalState, rules }

  const explicitSacrifice = band == null && iCeil != null
  rules.push({
    label: "Geen band, wel grens (opoffering)",
    detail: explicitSacrifice
      ? `intensity onder grens, geen interesse → 😰 alsmoet`
      : "n.v.t.",
    matched: explicitSacrifice,
    skipped: !(band == null && iCeil != null),
  })
  if (explicitSacrifice) return { rideStatus, finalState, rules }

  // ── D. Onder band of fallback → saai / voorGroep ─────────────────────────
  const underBand = band != null && ri != null && ri < band[0]
  rules.push({
    label: "Onder interesse-band",
    detail:
      band == null || ri == null
        ? "fallback → 🙂 voorGroep"
        : underBand
          ? `intensity ${ri} < band[${band[0]}] → 🥱 saai`
          : "n.v.t.",
    matched: underBand || (band == null && iCeil == null),
  })

  return { rideStatus, finalState, rules }
}

/**
 * Geeft een leesbare uitleg van de eerst-matchende detectie-regel voor
 * deriveBehaviorResult — voor debug/tooltip-doeleinden.
 */
export function explainBehavior(
  member: Member,
  ride: Ride,
  prefs: MemberPrefs,
  parkSlug: string,
): string {
  const result = deriveBehaviorResult(member, ride, prefs, parkSlug)
  const overrideKey = `${parkSlug}/${ride.att}`

  if (prefs.perRideOverride[overrideKey] != null) {
    return `Per-attractie-overschrijving: ${prefs.perRideOverride[overrideKey]}`
  }

  const rideStatus = status(member, ride)
  if (!canDo(rideStatus)) {
    if ("growth" in result) {
      return `Te klein/jong (status: ${rideStatus}) — zou anders mee willen → 🌱 groei`
    }
    if ("outgrown" in result) {
      return `Ontgroeid (status: ${rideStatus}) — zou anders mee willen → 🍂 ontgroeid`
    }
    return `Niet haalbaar (status: ${rideStatus}) → 🙅 nooit`
  }

  const props = ride.props || []
  for (const p of props) {
    const choice = prefs.propChoices[p] ?? "prima"
    if (choice === "nooit") {
      return `Prop "${p}" staat op nooit → 🙅`
    }
  }

  const ri = ride.intensity
  const rh = ride.height_intensity
  const band = prefs.intensityBand
  const hCeil = prefs.heightCeiling
  const iCeil = prefs.intensityCeiling

  if (hCeil != null && rh != null) {
    if (rh > hCeil + 1) {
      return `Hoogte ${rh} valt ${rh - hCeil} boven plafond (${hCeil}) → 🙅`
    }
    if (rh === hCeil + 1) {
      return `Hoogte ${rh} is één boven plafond (${hCeil}) → 😰`
    }
  }

  if (iCeil != null && ri != null && ri >= iCeil) {
    return `Intensiteit ${ri} op of boven "no way!"-grens (${iCeil}) → 🙅`
  }

  // Categorie-match
  const rideCats = rideCategories(ride)
  const matchedCat = rideCats.find((cat) => prefs.categoryInterests[cat])
  if (matchedCat) {
    return `Categorie "${matchedCat}" aangevinkt — categorie-match → 😍`
  }

  if (band != null && ri != null && ri >= band[0] && ri <= band[1]) {
    return `Intensiteit ${ri} binnen interesse-band [${band[0]},${band[1]}] → 😍`
  }

  if (band != null) {
    if (ri != null && ri < band[0]) {
      return `Intensiteit ${ri} onder band [${band[0]},${band[1]}] → 🙂`
    }
    if (ri != null && ri > band[1]) {
      return `Intensiteit ${ri} boven band [${band[0]},${band[1]}], onder grens → 😰`
    }
  } else if (iCeil != null) {
    return `Geen interesse-band, intensity ${ri ?? "?"} onder grens (${iCeil}) → 😰 (opoffering)`
  }

  for (const p of props) {
    const choice = prefs.propChoices[p] ?? "prima"
    if (choice === "voorGroep") {
      return `Prop "${p}" op "voor de groep" → 😰`
    }
  }

  if ("behavior" in result) {
    return `Geen specifieke regel — fallback → ${result.behavior}`
  }
  return `(unreachable)`
}

/**
 * Park-score gemodulateerd door thematisatie-belang (ADR-024 v2).
 *
 * themingImportance === "high"   → park_score × (1 + theming_score × 0.2)
 * themingImportance === "medium" → ongewijzigd (× 1.0)
 * themingImportance === "none"   → ongewijzigd
 * null / niet ingevuld           → ongewijzigd
 *
 * theming_score ontbreekt in data → default 3 (neutraal).
 */
export function parkScoreWithTheming(
  rides: Ride[],
  member: Member,
  prefs: MemberPrefs,
  parkSlug: string,
  parkThemingScore?: number,
): number {
  const base = parkScore(rides, member, prefs, parkSlug)
  const ts = parkThemingScore ?? 3
  if (prefs.themingImportance === "high") {
    return base * (1 + ts * 0.2)
  }
  return base
}

/**
 * Willen & kunnen per lid per park (ADR-024 v2).
 *
 * willen = intrinsiek − alsmoet   (netto enthousiasme; kan negatief)
 * kunnen = intrinsiek + voorGroep (bereikbaar én aanvaardbaar)
 *
 * Sluit 1-op-1 aan op de emoji's per attractie (😍/🙂/😰/🙅).
 */
export function parkWillenKunnen(
  rides: Ride[],
  member: Member,
  prefs: MemberPrefs,
  parkSlug: string,
): { willen: number; kunnen: number } {
  const c = parkBehaviorCounts(rides, member, prefs, parkSlug)
  return {
    willen: c.intrinsiek - c.alsmoet,
    kunnen: c.intrinsiek + c.voorGroep,
  }
}

/**
 * KUNNEN per persoon (ADR-025 Fase 1):
 * # rides waar resultaat een Behavior heeft (niet growth/outgrown) EN behavior ≠ "nooit".
 * Dus: {saai, voorGroep, intrinsiek, alsmoet}.
 * Parkregels-staten (growth/outgrown) sluiten KUNNEN uit.
 */
export function kunnenCount(
  rides: Ride[],
  member: Member,
  prefs: MemberPrefs,
  parkSlug: string,
): number {
  let count = 0
  for (const ride of rides) {
    const result = deriveBehaviorResult(member, ride, prefs, parkSlug)
    if ("behavior" in result && result.behavior !== "nooit") {
      count++
    }
  }
  return count
}

/**
 * WILLEN per persoon (ADR-025 Fase 1):
 * # rides waar behavior === "intrinsiek".
 * Parkregels-uitsluiting blokkeert WILLEN ook: growth/outgrown tellen niet.
 */
export function willenCount(
  rides: Ride[],
  member: Member,
  prefs: MemberPrefs,
  parkSlug: string,
): number {
  let count = 0
  for (const ride of rides) {
    const result = deriveBehaviorResult(member, ride, prefs, parkSlug)
    if ("behavior" in result && result.behavior === "intrinsiek") {
      count++
    }
  }
  return count
}

/**
 * ZULLEN per persoon (ADR-025 Fase 1):
 * # rides met growth: true (🌱 binnenkort wel).
 * 🍂 ontgroeid telt NIET mee — dat is geen toekomst.
 */
export function zullenCount(
  rides: Ride[],
  member: Member,
  prefs: MemberPrefs,
  parkSlug: string,
): number {
  let count = 0
  for (const ride of rides) {
    const result = deriveBehaviorResult(member, ride, prefs, parkSlug)
    if ("growth" in result && result.growth) {
      count++
    }
  }
  return count
}

// ─── ADR-025 Fase 3: Noodzakelijk-aanwezig & MOETEN ──────────────────────────

/**
 * Bepaalt per ride welke leden noodzakelijk-aanwezig zijn (moeten begeleiden
 * omdat een ander lid wil rijden maar begeleiding nodig heeft).
 *
 * Heuristiek (ADR-025):
 *  1. Identificeer "wachtende-kinderen" = leden die de rit willen rijden
 *     (behavior intrinsiek), isCompanionNeeded = true, en niet uitgesloten
 *     (geen growth/outgrown/nooit).
 *  2. Geen wachtende → niemand noodzakelijk-aanwezig.
 *  3. Beschikbare-volwassenen = leden die zelf mogen rijden (isCompanionNeeded
 *     = false) EN behavior in {intrinsiek, voorGroep, saai, alsmoet},
 *     dus niet 🙅/🌱/🍂.
 *  4. Sorteer beschikbare op pijnloosheid: intrinsiek > voorGroep > saai >
 *     alsmoet. Kies de eerste (de minst-pijnlijke).
 *  5. De gekozen volwassene is noodzakelijk-aanwezig. Als zijn behavior
 *     `saai` is → MOETEN-saai-kost; als `alsmoet` → MOETEN-wild-kost.
 *  6. Eén begeleider per rit volstaat in de standaardheuristiek.
 *  7. Als er geen beschikbare volwassene is → niemand noodzakelijk-aanwezig
 *     (geen keuze te maken; documenteer als "geen begeleider beschikbaar").
 *
 * Returns: Set<string> met de namen van noodzakelijk-aanwezige leden voor
 * deze ride.
 */
export function requiredCompanions(
  ride: Ride,
  members: Member[],
  prefsByMember: Record<string, MemberPrefs>,
  emptyPrefs: () => MemberPrefs,
  parkSlug: string,
): Set<string> {
  const BEHAVIOR_PRIORITY: Record<string, number> = {
    intrinsiek: 0,
    voorGroep: 1,
    saai: 2,
    alsmoet: 3,
  }

  // 1. Wachtende-kinderen: intrinsiek én begeleiding nodig
  const waitingKids = members.filter((m) => {
    if (!isCompanionNeeded(m, ride)) return false
    const prefs = prefsByMember[m.name] ?? emptyPrefs()
    const result = deriveBehaviorResult(m, ride, prefs, parkSlug)
    return "behavior" in result && result.behavior === "intrinsiek"
  })

  // 2. Geen wachtenden → geen noodzakelijk-aanwezig
  if (waitingKids.length === 0) return new Set()

  // 3. Beschikbare volwassenen: canDo zelfstandig + behavior niet nooit/growth/outgrown
  const available: Array<{ member: Member; behavior: string }> = []
  for (const m of members) {
    if (isCompanionNeeded(m, ride)) continue // begeleid = niet zelf autonoom
    const prefs = prefsByMember[m.name] ?? emptyPrefs()
    const result = deriveBehaviorResult(m, ride, prefs, parkSlug)
    if (!("behavior" in result)) continue // growth/outgrown
    if (result.behavior === "nooit") continue
    available.push({ member: m, behavior: result.behavior })
  }

  // 7. Geen beschikbare volwassene → geen noodzakelijk-aanwezig
  if (available.length === 0) return new Set()

  // 4. Sorteer op pijnloosheid (intrinsiek wint)
  available.sort(
    (a, b) =>
      (BEHAVIOR_PRIORITY[a.behavior] ?? 99) -
      (BEHAVIOR_PRIORITY[b.behavior] ?? 99),
  )

  // 5. Kies de minst-pijnlijke
  const chosen = available[0]!

  // Als de gekozen al intrinsiek of voorGroep is: zij gaan toch al mee →
  // geen MOETEN-kost. Alleen saai/alsmoet telt als echte opoffering.
  // Maar toch telt degene als "noodzakelijk-aanwezig" voor de heuristiek.
  return new Set([chosen.member.name])
}

/**
 * Interne helper: telt moeten-saai en moeten-wild voor één lid over alle rides.
 * Geeft { saai, wild } terug.
 */
function _moetenCountsFor(
  member: Member,
  rides: Ride[],
  members: Member[],
  prefsByMember: Record<string, MemberPrefs>,
  emptyPrefs: () => MemberPrefs,
  parkSlug: string,
): { saai: number; wild: number } {
  const prefs = prefsByMember[member.name] ?? emptyPrefs()
  let saai = 0
  let wild = 0
  for (const ride of rides) {
    const forced = requiredCompanions(ride, members, prefsByMember, emptyPrefs, parkSlug)
    if (!forced.has(member.name)) continue
    const result = deriveBehaviorResult(member, ride, prefs, parkSlug)
    if (!("behavior" in result)) continue
    if (result.behavior === "saai") saai++
    else if (result.behavior === "alsmoet") wild++
  }
  return { saai, wild }
}

/**
 * # rides waar dit lid noodzakelijk-aanwezig is EN behavior = "saai".
 * MOETEN-saai = opoffering uit verveling.
 */
export function moetenSaaiCount(
  member: Member,
  rides: Ride[],
  members: Member[],
  prefsByMember: Record<string, MemberPrefs>,
  emptyPrefs: () => MemberPrefs,
  parkSlug: string,
): number {
  return _moetenCountsFor(member, rides, members, prefsByMember, emptyPrefs, parkSlug).saai
}

/**
 * # rides waar dit lid noodzakelijk-aanwezig is EN behavior = "alsmoet".
 * MOETEN-wild = opoffering uit angst.
 */
export function moetenWildCount(
  member: Member,
  rides: Ride[],
  members: Member[],
  prefsByMember: Record<string, MemberPrefs>,
  emptyPrefs: () => MemberPrefs,
  parkSlug: string,
): number {
  return _moetenCountsFor(member, rides, members, prefsByMember, emptyPrefs, parkSlug).wild
}

/**
 * Hoeveel van dit lid's saai/alsmoet-rides zijn "forced" (noodzakelijk-aanwezig).
 * Bedoeld voor de BehaviorBar split: vrijwillig-saai vs gedwongen-saai.
 */
export function parkForcedCounts(
  rides: Ride[],
  member: Member,
  members: Member[],
  prefsByMember: Record<string, MemberPrefs>,
  emptyPrefs: () => MemberPrefs,
  parkSlug: string,
): { saai: number; alsmoet: number } {
  const counts = _moetenCountsFor(member, rides, members, prefsByMember, emptyPrefs, parkSlug)
  return { saai: counts.saai, alsmoet: counts.wild }
}

// ─── ADR-025 Fase 3: Groeps-aggregaten als verb-tellers ──────────────────────

/**
 * KUNNEN samen (intersectie):
 * # rides waar elk geselecteerd lid behavior in {saai, voorGroep, intrinsiek, alsmoet} heeft.
 * Dus geen 🙅/🌱/🍂 voor niemand.
 */
export function groupKunnenIntersect(
  rides: Ride[],
  members: Member[],
  prefsByMember: Record<string, MemberPrefs>,
  emptyPrefs: () => MemberPrefs,
  parkSlug: string,
): number {
  if (members.length === 0) return 0
  let count = 0
  for (const ride of rides) {
    const allCan = members.every((m) => {
      const prefs = prefsByMember[m.name] ?? emptyPrefs()
      const result = deriveBehaviorResult(m, ride, prefs, parkSlug)
      return "behavior" in result && result.behavior !== "nooit"
    })
    if (allCan) count++
  }
  return count
}

/**
 * WILLEN (groep):
 * # rides waar minstens één lid 😍 (intrinsiek) is EN niemand uitgesloten
 * (🙅/🌱/🍂).
 */
export function groupWillenCount(
  rides: Ride[],
  members: Member[],
  prefsByMember: Record<string, MemberPrefs>,
  emptyPrefs: () => MemberPrefs,
  parkSlug: string,
): number {
  if (members.length === 0) return 0
  let count = 0
  for (const ride of rides) {
    let hasWant = false
    let hasExcluded = false
    for (const m of members) {
      const prefs = prefsByMember[m.name] ?? emptyPrefs()
      const result = deriveBehaviorResult(m, ride, prefs, parkSlug)
      if ("behavior" in result) {
        if (result.behavior === "nooit") { hasExcluded = true; break }
        if (result.behavior === "intrinsiek") hasWant = true
      } else {
        // growth/outgrown = uitgesloten
        hasExcluded = true
        break
      }
    }
    if (hasWant && !hasExcluded) count++
  }
  return count
}

/**
 * ZULLEN (groep):
 * # rides waar minstens één lid in 🌱 zit.
 */
export function groupZullenCount(
  rides: Ride[],
  members: Member[],
  prefsByMember: Record<string, MemberPrefs>,
  emptyPrefs: () => MemberPrefs,
  parkSlug: string,
): number {
  if (members.length === 0) return 0
  let count = 0
  for (const ride of rides) {
    const hasGrowth = members.some((m) => {
      const prefs = prefsByMember[m.name] ?? emptyPrefs()
      const result = deriveBehaviorResult(m, ride, prefs, parkSlug)
      return "growth" in result && result.growth
    })
    if (hasGrowth) count++
  }
  return count
}

// ─── ADR-026: Splits-planning ─────────────────────────────────────────────────

/** Output van splits-plan-berekening per park. */
export interface SplitsPlan {
  samen: Ride[]
  splits: SplitsConfiguration[]
  onmogelijk: Ride[]
}

export interface SplitsConfiguration {
  /** Stabiele id: gesorteerde namen van actieve subgroep, joined met "|". */
  configKey: string
  /** Namen van leden die de rit doen (gesorteerd). */
  actieve: string[]
  /** Namen van leden die niet meegaan (gesorteerd). */
  wachtenden: string[]
  /** Alle rides die deze configuratie deelt. */
  rides: Ride[]
  /**
   * Rides die de wachtende subgroep onderling tegelijk kan doen (suggesties).
   * Gesorteerd op aantal intrinsiek voor de wachtenden desc.
   */
  wachtenden_kan: Ride[]
}

/**
 * Greedy splits-plan voor één park, ADR-026 §Algoritme.
 *
 * @param tol - Moeite-budget: hoeveel forced-leden per beslissing toegestaan.
 *   Default 0 (streng: niemand gedwongen). Hogere waarde = minder splits, meer MOETEN.
 *
 * Stap 1: Samen-blok:
 *   Voor elke ride: als niemand uitgesloten is (growth/outgrown/nooit) EN
 *   forced-count (noodzakelijk-aanwezigen) ≤ tol → samen-rit.
 *
 * Stap 2: Voor elke overige ride:
 *   - kern-actieve = leden waar behavior in {intrinsiek, voorGroep} (niet forced).
 *   - Als kern-actieve begeleiding-haalbaar is én niet leeg: gebruik die.
 *   - Anders: probeer forced-leden toe te voegen (minst-pijnlijk eerst) tot
 *     begeleiding-haalbaar of budget uitgeput.
 *   - Begeleiding-haalbaarheid: als een actief lid isCompanionNeeded, dan
 *     moet er in de actieve subgroep minstens één lid zijn dat
 *     isCompanionNeeded=false voor deze rit (kan zelfstandig meedoen) én
 *     behavior ≠ nooit. Als dit ontbreekt → onmogelijk.
 *   - Als actieve leeg → onmogelijk.
 *   - Anders: configKey = actieve.sort().join("|")
 *
 * Stap 3: Groepeer per configKey → SplitsConfiguration.
 *
 * Stap 4 (alleen bij tol ≥ 1): Subset-merging-pass:
 *   Voor elke configuratie A: zoek configuratie B waarbij A.actieve ⊂ B.actieve.
 *   Als geen verschil-lid een exclusie (nooit/growth/outgrown) heeft op A's rides,
 *   EN het maximale forced-count in B na merge ≤ tol blijft: merge A in B.
 *
 * Stap 5: Voor elke configuratie: bereken wachtenden_kan = rides waar de
 *   wachtende subgroep onderling samen kan (met tol-budget), gesorteerd op
 *   aantal intrinsiek-behaviors voor de wachtenden desc.
 */
export function computeSplitsPlan(
  rides: Ride[],
  members: Member[],
  prefsByMember: Record<string, MemberPrefs>,
  emptyPrefs: () => MemberPrefs,
  parkSlug: string,
  tol = 0,
): SplitsPlan {
  if (members.length === 0 || rides.length === 0) {
    return { samen: [], splits: [], onmogelijk: [] }
  }

  // Prioriteit voor pijnloosheid bij het toevoegen van forced-leden (minst-pijnlijk eerst)
  const FORCED_PRIORITY: Record<string, number> = {
    intrinsiek: 0,
    voorGroep: 1,
    saai: 2,
    alsmoet: 3,
  }

  const samen: Ride[] = []
  // Map van configKey → array van rides voor die configuratie
  const splitsMap = new Map<string, { actieve: string[]; wachtenden: string[]; rides: Ride[] }>()
  const onmogelijk: Ride[] = []

  for (const ride of rides) {
    // Bereken behavior per lid
    const behaviorPerLid = new Map<string, { canDo: boolean; excluded: boolean; forced: boolean; behavior: string | null }>()
    const forcedSet = requiredCompanions(ride, members, prefsByMember, emptyPrefs, parkSlug)

    for (const m of members) {
      const prefs = prefsByMember[m.name] ?? emptyPrefs()
      const result = deriveBehaviorResult(m, ride, prefs, parkSlug)
      const isGrowthOrOutgrown = "growth" in result || "outgrown" in result
      const behaviorVal = "behavior" in result ? result.behavior : null
      const isExcluded = isGrowthOrOutgrown || behaviorVal === "nooit"
      behaviorPerLid.set(m.name, {
        canDo: !isExcluded,
        excluded: isExcluded,
        forced: forcedSet.has(m.name),
        behavior: behaviorVal,
      })
    }

    // Stap 1: samen-check met tol-budget:
    //   niemand uitgesloten (growth/outgrown/nooit) EN forced-count ≤ tol
    const anyExcluded = members.some((m) => behaviorPerLid.get(m.name)!.excluded)
    const forcedCount = members.filter((m) => behaviorPerLid.get(m.name)!.forced).length

    if (!anyExcluded && forcedCount <= tol) {
      samen.push(ride)
      continue
    }

    // Stap 2: bepaal actieve subgroep
    // kern-actieve = kan mee (niet uitgesloten) én niet forced
    const kernActieve = members
      .filter((m) => {
        const bd = behaviorPerLid.get(m.name)!
        return bd.canDo && !bd.forced
      })
      .map((m) => m.name)
      .sort((a, b) => a.localeCompare(b))

    let actieve: string[] = kernActieve

    // Controleer begeleiding-haalbaarheid van kern-actieve
    const checkGuidance = (actieveNames: string[]): boolean => {
      if (actieveNames.length === 0) return false
      const actMs = members.filter((m) => actieveNames.includes(m.name))
      const anyNeeds = actMs.some((m) => isCompanionNeeded(m, ride))
      if (!anyNeeds) return true
      return actMs.some((m) => !isCompanionNeeded(m, ride) && behaviorPerLid.get(m.name)!.canDo)
    }

    // Als kern-actieve niet levensvatbaar (leeg of geen begeleiding), probeer forced leden toe te voegen
    if (actieve.length === 0 || !checkGuidance(actieve)) {
      if (tol > 0) {
        // Soreer forced-leden op pijnloosheid (minst-pijnlijk eerst)
        const forcedCandidates = members
          .filter((m) => {
            const bd = behaviorPerLid.get(m.name)!
            return bd.canDo && bd.forced
          })
          .sort((a, b) => {
            const pa = FORCED_PRIORITY[behaviorPerLid.get(a.name)!.behavior ?? ""] ?? 99
            const pb = FORCED_PRIORITY[behaviorPerLid.get(b.name)!.behavior ?? ""] ?? 99
            return pa - pb
          })

        // Voeg forced leden toe zolang budget niet overschreden
        const extended = [...actieve]
        let addedForced = 0
        for (const fc of forcedCandidates) {
          if (addedForced >= tol) break
          extended.push(fc.name)
          addedForced++
          if (checkGuidance(extended)) break
        }

        if (checkGuidance(extended) && addedForced <= tol) {
          actieve = extended.sort((a, b) => a.localeCompare(b))
        } else {
          onmogelijk.push(ride)
          continue
        }
      } else {
        if (actieve.length === 0 || !checkGuidance(actieve)) {
          onmogelijk.push(ride)
          continue
        }
      }
    }

    const configKey = actieve.join("|")
    const wachtenden = members
      .filter((m) => !actieve.includes(m.name))
      .map((m) => m.name)
      .sort((a, b) => a.localeCompare(b))

    if (!splitsMap.has(configKey)) {
      splitsMap.set(configKey, { actieve, wachtenden, rides: [] })
    }
    splitsMap.get(configKey)!.rides.push(ride)
  }

  // Stap 4 (alleen bij tol ≥ 1): Subset-merging-pass
  // Greedy: doorloop configuraties van klein naar groot (op actieve-grootte)
  if (tol >= 1) {
    const keys = Array.from(splitsMap.keys()).sort((a, b) => {
      const sizeA = splitsMap.get(a)!.actieve.length
      const sizeB = splitsMap.get(b)!.actieve.length
      return sizeA - sizeB || a.localeCompare(b)
    })

    for (const keyA of keys) {
      if (!splitsMap.has(keyA)) continue // al gemerged
      const cfgA = splitsMap.get(keyA)!

      // Zoek een configuratie B waarbij A.actieve ⊂ B.actieve
      for (const keyB of keys) {
        if (keyB === keyA) continue
        if (!splitsMap.has(keyB)) continue
        const cfgB = splitsMap.get(keyB)!

        // Check: A.actieve ⊂ B.actieve
        const isSubset = cfgA.actieve.every((name) => cfgB.actieve.includes(name))
        if (!isSubset) continue

        // Verschil-leden: B.actieve \ A.actieve
        const verschil = cfgB.actieve.filter((name) => !cfgA.actieve.includes(name))

        // Elk verschil-lid mag geen exclusie hebben op A's rides
        let verschilOk = true
        for (const vName of verschil) {
          const vMember = members.find((m) => m.name === vName)
          if (!vMember) { verschilOk = false; break }
          for (const rideA of cfgA.rides) {
            const prefs = prefsByMember[vMember.name] ?? emptyPrefs()
            const result = deriveBehaviorResult(vMember, rideA, prefs, parkSlug)
            const isExcluded = "growth" in result || "outgrown" in result ||
              ("behavior" in result && result.behavior === "nooit")
            if (isExcluded) { verschilOk = false; break }
          }
          if (!verschilOk) break
        }
        if (!verschilOk) continue

        // Bereken max forced-count in B na merge: voor elke A-rit, tel forced-leden in B
        // Een verschil-lid in B op een A-rit telt als forced (🥱-acceptatie)
        let maxForcedInB = 0
        for (const rideA of cfgA.rides) {
          const bForcedSet = requiredCompanions(rideA, members.filter(m => cfgB.actieve.includes(m.name)), prefsByMember, emptyPrefs, parkSlug)
          // Verschil-leden die meegaan in B's actieve groep maar voor A's rit geen intrinsieke interesse hebben → tellen als forced
          let forcedCount = bForcedSet.size
          // Verschil-leden die op A's rit saai/alsmoet/voorGroep zijn tellen als forced-acceptatie
          for (const vName of verschil) {
            const vMember = members.find((m) => m.name === vName)
            if (!vMember) continue
            const prefs = prefsByMember[vMember.name] ?? emptyPrefs()
            const result = deriveBehaviorResult(vMember, rideA, prefs, parkSlug)
            if ("behavior" in result && result.behavior !== "intrinsiek") {
              forcedCount++
            }
          }
          if (forcedCount > maxForcedInB) maxForcedInB = forcedCount
        }

        if (maxForcedInB <= tol) {
          // Merge A in B
          cfgB.rides.push(...cfgA.rides)
          splitsMap.delete(keyA)
          break // eerste match wint (greedy)
        }
      }
    }
  }

  // Stap 5: bouw SplitsConfiguration-objecten op met wachtenden_kan
  const splits: SplitsConfiguration[] = []

  for (const [configKey, cfg] of splitsMap) {
    const wachtendeMembers = members.filter((m) => cfg.wachtenden.includes(m.name))

    // Wachtenden_kan: rides waar de wachtende subgroep samen kan (met tol-budget)
    // Gesorteerd op aantal intrinsiek voor de wachtenden desc
    const wachtenden_kan: Array<{ ride: Ride; intrinsiekCount: number }> = []

    for (const r of rides) {
      if (cfg.rides.some((cr) => cr.att === r.att)) continue // skip eigen rides
      const forcedForR = requiredCompanions(r, wachtendeMembers, prefsByMember, emptyPrefs, parkSlug)
      let allWachtendCanSamen = true
      let wForcedCount = 0
      let intrinsiekCount = 0

      for (const m of wachtendeMembers) {
        const prefs = prefsByMember[m.name] ?? emptyPrefs()
        const result = deriveBehaviorResult(m, r, prefs, parkSlug)
        const isGrowthOrOutgrown = "growth" in result || "outgrown" in result
        const behaviorVal = "behavior" in result ? result.behavior : null
        if (isGrowthOrOutgrown || behaviorVal === "nooit") {
          allWachtendCanSamen = false
          break
        }
        if (forcedForR.has(m.name)) wForcedCount++
        if (behaviorVal === "intrinsiek") intrinsiekCount++
      }

      if (allWachtendCanSamen && wForcedCount <= tol && wachtendeMembers.length > 0) {
        wachtenden_kan.push({ ride: r, intrinsiekCount })
      }
    }

    wachtenden_kan.sort((a, b) => b.intrinsiekCount - a.intrinsiekCount)

    splits.push({
      configKey,
      actieve: cfg.actieve,
      wachtenden: cfg.wachtenden,
      rides: cfg.rides,
      wachtenden_kan: wachtenden_kan.map((x) => x.ride),
    })
  }

  // Sorteer splits op configKey voor deterministische output
  splits.sort((a, b) => a.configKey.localeCompare(b.configKey))

  return { samen, splits, onmogelijk }
}

/**
 * MOETEN (groep):
 * Som van moeten-saai resp. moeten-wild over alle leden.
 * Twee aparte getallen naast elkaar — geen gewogen totaal (ADR-025).
 */
export function groupMoetenCounts(
  rides: Ride[],
  members: Member[],
  prefsByMember: Record<string, MemberPrefs>,
  emptyPrefs: () => MemberPrefs,
  parkSlug: string,
): { saai: number; wild: number } {
  let saai = 0
  let wild = 0
  for (const m of members) {
    const counts = _moetenCountsFor(m, rides, members, prefsByMember, emptyPrefs, parkSlug)
    saai += counts.saai
    wild += counts.wild
  }
  return { saai, wild }
}
