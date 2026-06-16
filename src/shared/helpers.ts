/* Magikal Kompas — kleine pure helpers (geen DOM, geen React). */

import { AVA_PALETTE } from "./vocab"
import type { Ride, RideWithPark } from "./types"

export function rid(r: Pick<RideWithPark, "park" | "att">): string {
  return r.park + "|" + r.att
}

/** Slug: lowercase, NFD-strip accenten, & → "en", niet-alfanumeriek → "-".
 *  Moet exact matchen wat de oude PHP/JS deden, want bestaande filenames
 *  (assets/photos/efteling/max-en-moritz.webp) hangen ervan af. */
export function parkSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    // strip combining marks (U+0300..U+036F)
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/** Slug voor attractienamen — zelfde regels als park, met & → "en". */
export function attSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " en ")
    .replace(/\+/g, " en ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function colorOf(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) >>> 0
  return AVA_PALETTE[h % AVA_PALETTE.length]!
}

export function initialsOf(name: string): string {
  const ws = name.replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean)
  if (!ws.length) return "??"
  if (ws.length === 1) return ws[0]!.slice(0, 2).toUpperCase()
  return (ws[0]![0]! + ws[1]![0]!).toUpperCase()
}

export function escapeHTML(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/** Leest het bron-taal-veld van een vrije tekst (string of {nl,en,…}). */
export function freeText(v: Ride["oms"] | undefined, lang = "nl"): string {
  if (v == null) return ""
  if (typeof v === "string") return v
  return v[lang as keyof typeof v] ?? v.nl ?? ""
}
