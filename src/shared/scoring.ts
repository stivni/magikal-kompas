/* Magikal Kompas — scoring & toegankelijkheids-logica.
 * Pure functies; geen DOM. Identiek aan de oude app.js qua semantiek. */

import type {
  AgeState,
  LengthState,
  Member,
  ParkMetrics,
  PropKey,
  Ride,
  RideState,
  TypeKey,
} from "./types"

export const GENUINE_MAX = 180

/** True wanneer de attractie permanent gesloten is (of "onbekend, te
 * verifiëren"). Centrale check zodat views niet zelf de vlag-semantiek
 * hoeven kennen. Zie ADR-023. */
export function isClosed(r: Pick<Ride, "closed">): boolean {
  return r.closed === true || r.closed === "unknown"
}

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
