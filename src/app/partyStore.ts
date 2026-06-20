/* Magikal Kompas — gezelschap-state in localStorage.
 * Wordt geconsumeerd via React-state in App.tsx; deze module bevat alleen
 * de pure (de)serialisatie en share-link-helpers. */

import type { Member, MemberPrefs, PartyState } from "../shared/types"

const SKEY = "ppm_party_v3"

export function emptyPrefs(): MemberPrefs {
  return {
    intensityBand: null,
    intensityCeiling: null,
    heightCeiling: null,
    heightBand: null,
    themingImportance: null,
    categoryInterests: {},
    propChoices: {},
    perRideOverride: {},
  }
}

export const EMPTY_PARTY: PartyState = {
  people: [],
  excludedParks: {},
  memberPrefs: {},
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

/* Het oude `mine`-veld is uitgefaseerd ten gunste van `favorite` (ADR-008).
 * Mensen die al in localStorage zaten als "huishouden" worden favoriet — dat
 * benadert hun intentie het dichtst. `mine` zelf wordt verwijderd. */
function migrateFavorite(people: Member[]) {
  people.forEach((p) => {
    const legacy = (p as { mine?: boolean }).mine
    if (p.favorite == null && legacy != null) p.favorite = legacy
    delete (p as { mine?: boolean }).mine
  })
}

/** Detecteer v1 opslag: had typePref/propPref/forceOv sleutels. */
function isV1(d: Record<string, unknown>): boolean {
  return "typePref" in d || "propPref" in d || "forceOv" in d
}

/**
 * Migreer MemberPrefs van v2 naar v3: voeg nieuwe velden toe als ze ontbreken
 * en pas categoryInterests-keys aan van oud (water/story/shows/classic_fair)
 * naar nieuw (splash/immerse/savor/savor). (ADR-025)
 * Wist GEEN bestaande data — uitbreiden met nulls is veilig.
 */
function migrateMemberPrefs(memberPrefs: Record<string, MemberPrefs>): void {
  // Oude → nieuwe Category-key mapping
  const CAT_MIGRATE: Record<string, string> = {
    water:        "splash",
    story:        "immerse",
    shows:        "savor",
    classic_fair: "savor",
  }

  for (const name of Object.keys(memberPrefs)) {
    const p = memberPrefs[name]!
    if (!("intensityCeiling" in p)) {
      (p as MemberPrefs).intensityCeiling = null
    }
    if (!("heightBand" in p)) {
      (p as MemberPrefs).heightBand = null
    }
    if (!("themingImportance" in p)) {
      (p as MemberPrefs).themingImportance = null
    }
    // Migreer oude category-keys naar nieuwe (ADR-025)
    if (p.categoryInterests) {
      const ci = p.categoryInterests as Record<string, boolean>
      for (const [oldKey, newKey] of Object.entries(CAT_MIGRATE)) {
        if (ci[oldKey]) {
          ci[newKey] = true
          delete ci[oldKey]
        }
      }
    }
  }
}

export function loadParty(): PartyState {
  // Probeer eerst v3 (huidige versie)
  try {
    const s = localStorage.getItem(SKEY)
    if (s) {
      const d = JSON.parse(s) as Partial<PartyState>
      const out: PartyState = {
        people: d.people ?? [],
        excludedParks: d.excludedParks ?? {},
        memberPrefs: d.memberPrefs ?? {},
      }
      migrateAge(out.people)
      migrateFavorite(out.people)
      migrateMemberPrefs(out.memberPrefs) // ook cat-migratie (idempotent)
      return out
    }
  } catch {
    // val through
  }

  // Probeer v2 — migreer naar v3 (ADR-025: category-keys)
  try {
    const s = localStorage.getItem("ppm_party_v2")
    if (s) {
      const d = JSON.parse(s) as Partial<PartyState>
      const out: PartyState = {
        people: d.people ?? [],
        excludedParks: d.excludedParks ?? {},
        memberPrefs: d.memberPrefs ?? {},
      }
      migrateAge(out.people)
      migrateFavorite(out.people)
      migrateMemberPrefs(out.memberPrefs) // migreert ook category-keys
      return out
    }
  } catch {
    // val through
  }

  // Probeer v1 — detect en wipe naar EMPTY (ADR-024)
  try {
    const s = localStorage.getItem("ppm_party_v1")
    if (s) {
      const d = JSON.parse(s) as Record<string, unknown>
      if (isV1(d)) {
        // v1 data gevonden — behoud people + excludedParks maar gooi voorkeuren weg
        const people = (d.people as Member[] | undefined) ?? []
        migrateAge(people)
        migrateFavorite(people)
        return {
          people,
          excludedParks: (d.excludedParks as Record<string, boolean> | undefined) ?? {},
          memberPrefs: {},
        }
      }
    }
  } catch {
    // val through
  }

  return { ...EMPTY_PARTY }
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

/** v4: Category-keys gemigreerd naar 8-bucket-set (ADR-025) */
export interface SharePayload {
  v: 4
  people: Member[]
  memberPrefs: PartyState["memberPrefs"]
}

export function configString(p: PartyState, names: string[] | null): string {
  const sel = names && names.length ? new Set(names) : new Set(p.people.map((x) => x.name))
  const payload: SharePayload = {
    v: 4,
    people: p.people.filter((x) => sel.has(x.name)),
    memberPrefs: pickByName(p.memberPrefs, [...sel]) as PartyState["memberPrefs"],
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
    // Migreer memberPrefs — inclusief category-keys (ADR-025)
    if (d.memberPrefs) migrateMemberPrefs(d.memberPrefs)
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
