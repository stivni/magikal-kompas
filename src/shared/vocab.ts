/* Magikal Kompas — vocabulaire (types, props, vlaggen, kleuren).
 * Property-keys zijn stabiel Engels (zie ADR-015 Accepted); de NL-labels in
 * PNL/TNL blijven UI-bron-van-waarheid voor Nederlands. */

import type { CountryCode, PropKey, TypeKey } from "./types"

export const TNL: Record<TypeKey, string> = {
  thrill_coaster: "Thrill-achtbaan",
  family_coaster: "Familie-achtbaan",
  kiddie_coaster: "Kinderachtbaan",
  spinning_coaster: "Spinning coaster",
  drop_tower: "Valtoren",
  pirate_ship: "Schommelschip",
  top_spin: "Top spin / overslag",
  teacups: "Koffiekopjes",
  carousel: "Draaimolen",
  wave_swinger: "Zweefmolen",
  ferris_wheel: "Reuzenrad",
  flat_spinner: "Ronddraaier",
  water_ride: "Waterbaan",
  water_battle: "Watergevecht",
  dark_ride: "Darkride",
  transport: "Treintje / boottocht",
  kiddie_flat: "Kinderattractie",
  playground: "Speeltuin",
  show: "Show",
  funhouse: "Funhouse",
}

export const TYPES: TypeKey[] = Object.keys(TNL) as TypeKey[]

export const TEMO: Record<TypeKey, string> = {
  thrill_coaster: "\u{1F3A2}",
  family_coaster: "\u{1F39F}\u{FE0F}",
  kiddie_coaster: "\u{1F68C}",
  spinning_coaster: "\u{1F300}",
  drop_tower: "\u{1F5FC}",
  pirate_ship: "⛵",
  top_spin: "\u{1F504}",
  teacups: "☕",
  carousel: "\u{1F3A0}",
  wave_swinger: "\u{1FA82}",
  ferris_wheel: "\u{1F3A1}",
  flat_spinner: "\u{1F365}",
  water_ride: "\u{1F6A3}",
  water_battle: "\u{1F52B}",
  dark_ride: "\u{1F311}",
  transport: "\u{1F682}",
  kiddie_flat: "\u{1F9F8}",
  playground: "\u{1F6DD}",
  show: "\u{1F3AD}",
  funhouse: "\u{1F3AA}",
}

export const PROPS: PropKey[] = [
  "wet",
  "high",
  "fast",
  "inversions",
  "spins",
  "swings",
  "dark",
]

export const PNL: Record<PropKey, string> = {
  wet: "Nat worden",
  high: "Hoog",
  fast: "Snel",
  inversions: "Over de kop",
  spins: "Rondjes draaien",
  swings: "Schommelen",
  dark: "In het donker",
}

export const PEMO: Record<PropKey, string> = {
  wet: "\u{1F4A6}",
  high: "\u{1F5FC}",
  fast: "\u{1F4A8}",
  inversions: "\u{1F501}",
  spins: "\u{1F300}",
  swings: "⛵",
  dark: "\u{1F311}",
}

export const FLAGS: Partial<Record<CountryCode, string>> = {
  BE: "\u{1F1E7}\u{1F1EA}",
  NL: "\u{1F1F3}\u{1F1F1}",
  FR: "\u{1F1EB}\u{1F1F7}",
  DE: "\u{1F1E9}\u{1F1EA}",
  LU: "\u{1F1F1}\u{1F1FA}",
  UK: "\u{1F1EC}\u{1F1E7}",
  GB: "\u{1F1EC}\u{1F1E7}",
}

export const COUNTRY_NL: Partial<Record<CountryCode, string>> = {
  BE: "België",
  NL: "Nederland",
  FR: "Frankrijk",
  DE: "Duitsland",
  LU: "Luxemburg",
  GB: "VK",
  UK: "VK",
}

export const AVA_PALETTE = [
  "#e94f37",
  "#3a4a6b",
  "#7a3b96",
  "#1f897e",
  "#e0729a",
  "#e08a2b",
  "#c98b8b",
  "#5a8b3a",
  "#3a7a8b",
  "#b5494a",
]
