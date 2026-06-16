/* Magikal Kompas — gezelschap-state in localStorage.
 * Wordt geconsumeerd via React-state in App.tsx; deze module bevat alleen
 * de pure (de)serialisatie en share-link-helpers. */

import type { Member, PartyState } from "../shared/types"

const SKEY = "ppm_party_v1"

export const EMPTY_PARTY: PartyState = {
  people: [],
  typePref: {},
  propPref: {},
  forceOv: {},
  excludedParks: {},
}

function migrateAge(people: Member[]) {
  const yT = new Date().getFullYear()
  people.forEach((p) => {
    if (p.birthYear == null && typeof p.age === "number") {
      p.birthYear = yT - p.age
    }
    delete p.age
  })
}

export function loadParty(): PartyState {
  try {
    const s = localStorage.getItem(SKEY)
    if (!s) return { ...EMPTY_PARTY }
    const d = JSON.parse(s) as Partial<PartyState>
    const out: PartyState = {
      people: d.people ?? [],
      typePref: d.typePref ?? {},
      propPref: d.propPref ?? {},
      forceOv: d.forceOv ?? {},
      excludedParks: d.excludedParks ?? {},
    }
    migrateAge(out.people)
    return out
  } catch {
    return { ...EMPTY_PARTY }
  }
}

export function saveParty(p: PartyState) {
  try {
    localStorage.setItem(SKEY, JSON.stringify(p))
  } catch {
    /* quota of disabled; geen verhaal */
  }
}

/* ---- share-link (base64url van een JSON-payload) ---- */
export function b64urlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}
export function b64urlDecode(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/")
  while (s.length % 4) s += "="
  return decodeURIComponent(escape(atob(s)))
}

function pickByName<T extends Record<string, unknown>>(map: T, names: string[]): Partial<T> {
  const out: Record<string, unknown> = {}
  names.forEach((n) => {
    if (map[n] !== undefined) out[n] = map[n]
  })
  return out as Partial<T>
}

export interface SharePayload {
  v: 1
  people: Member[]
  typePref: PartyState["typePref"]
  propPref: PartyState["propPref"]
  forceOv: PartyState["forceOv"]
}

export function configString(p: PartyState, names: string[] | null): string {
  const sel = names && names.length ? new Set(names) : new Set(p.people.map((x) => x.name))
  const payload: SharePayload = {
    v: 1,
    people: p.people.filter((x) => sel.has(x.name)),
    typePref: pickByName(p.typePref, [...sel]) as PartyState["typePref"],
    propPref: pickByName(p.propPref, [...sel]) as PartyState["propPref"],
    forceOv: pickByName(p.forceOv, [...sel]) as PartyState["forceOv"],
  }
  return JSON.stringify(payload)
}

export function shareURL(p: PartyState, names: string[]): string {
  return (
    location.origin +
    location.pathname +
    "#c=" +
    b64urlEncode(configString(p, names))
  )
}

export function importFromHash(): SharePayload | null {
  const m = (location.hash || "").match(/c=([^&]+)/)
  if (!m) return null
  try {
    const d = JSON.parse(b64urlDecode(m[1]!)) as SharePayload
    history.replaceState(null, "", location.pathname + location.search)
    if (!d || !Array.isArray(d.people) || !d.people.length) return null
    return d
  } catch {
    return null
  }
}

export function uniqueName(people: Member[], base: string): string {
  let i = 2
  while (people.some((p) => p.name === base + " " + i)) i++
  return base + " " + i
}
