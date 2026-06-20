/* Magikal Kompas — data-laag.
 * Importeert alle park-JSON's via Vite's import.meta.glob. Eager + default
 * zodat ze in de bundel zitten en synchroon beschikbaar zijn.
 * Zie ADR-009 / ADR-020. */

import type { Park, RideWithPark } from "./types"

const modules = import.meta.glob<Park>("/data/parks/*.json", {
  eager: true,
  import: "default",
})

// Stabiele volgorde op bestandsnaam (matched de oude readdirSync.sort()).
const sortedEntries = Object.entries(modules).sort(([a], [b]) => a.localeCompare(b))
export const PARK_DATA: Park[] = sortedEntries.map(([, p]) => p)

export const parks: string[] = PARK_DATA.map((p) => p.park)

export const PARKMETA: Record<string, Park["meta"]> = {}
export const PARKEXTRA: Record<string, { logo: string | null; icon: string | null }> = {}
export const RIDES: RideWithPark[] = []

PARK_DATA.forEach((p) => {
  PARKMETA[p.park] = p.meta || {}
  PARKEXTRA[p.park] = { logo: p.logo || null, icon: p.icon || null }
  p.rides.forEach((r) => RIDES.push({ ...r, park: p.park }))
})

export const ridesOf = (parkName: string): RideWithPark[] =>
  RIDES.filter((r) => r.park === parkName)

export function findPark(parkName: string): Park | null {
  return PARK_DATA.find((p) => p.park === parkName) || null
}
