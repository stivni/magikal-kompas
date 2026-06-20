/* Magikal Kompas — vocabulaire (types, props, vlaggen, kleuren).
 * Property-keys zijn stabiel Engels (zie ADR-015 Accepted); de NL-labels in
 * PNL/TNL blijven UI-bron-van-waarheid voor Nederlands. */

import type { Category, CountryCode, PropKey, TypeKey } from "./types"

export const TNL: Record<TypeKey, string> = {
  // ── Coasters ──────────────────────────────────────────────────────────────
  wooden_coaster:    "Houten achtbaan",
  family_coaster:    "Familie-achtbaan",
  kiddie_coaster:    "Kinderachtbaan",
  thrill_coaster:    "Thrill-achtbaan",
  launch_coaster:    "Launch-achtbaan",
  inverted_coaster:  "Inverted coaster",
  spinning_coaster:  "Spinning coaster",
  water_coaster:     "Water-achtbaan",
  mine_train:        "Mijntrein-achtbaan",
  alpine_coaster:    "Alpine coaster / bobsled",
  // ── Flat thrill ───────────────────────────────────────────────────────────
  drop_tower:        "Valtoren",
  kiddie_drop:       "Mini-valtoren",
  pirate_ship:       "Schommelschip",
  frisbee_pendulum:  "Giant frisbee / pendulum",
  top_spin:          "Top spin",
  tilt_a_whirl:      "Tilt-a-whirl",
  // ── Hoog + zwaai ──────────────────────────────────────────────────────────
  star_flyer:        "Star flyer",
  wave_swinger:      "Zweefmolen",
  flying_chairs:     "Vliegende stoelen",
  flying_bicycles:   "Vliegende fietsen",
  balloon_ride:      "Ballonmolen",
  // ── Spinners ──────────────────────────────────────────────────────────────
  teacups:           "Koffiekopjes",
  flat_spinner:      "Ronddraaier",
  octopus:           "Octopus",
  // ── Klassiek-draaien ──────────────────────────────────────────────────────
  carousel:          "Draaimolen",
  ferris_wheel:      "Reuzenrad",
  // ── Beleving ──────────────────────────────────────────────────────────────
  story_ride:        "Belevingsrit",
  madhouse:          "Madhouse",
  // ── Water ─────────────────────────────────────────────────────────────────
  log_flume:         "Wildwaterbaan / log flume",
  rapids:            "River rapids",
  splash_battle:     "Watergevecht",
  // ── Speel / klauter ───────────────────────────────────────────────────────
  playground:        "Speeltuin",
  funhouse:          "Funhouse",
  ball_pit:          "Ballenbad",
  walkthrough_climb: "Klim-doorloopattractie",
  // ── Wedijver ──────────────────────────────────────────────────────────────
  arcade:            "Arcade / spelletjes",
  karting:           "Karting",
  shoot_ride:        "Schietrit",
  // ── Besturen ──────────────────────────────────────────────────────────────
  kids_drive:        "Kinderauto's / rijschool",
  bumper_cars:       "Autoscooter",
  pedal_boat:        "Waterfiets / pedaalboot",
  pedal_ride:        "Trapattractie",
  kiddie_track_ride: "Kinderrailrit",
  // ── Rondrit / show ────────────────────────────────────────────────────────
  transport_train:   "Treintje / monorail",
  slow_boat:         "Rustige boottocht",
  show:              "Show",
  walkthrough_decor: "Doorloopattractie / decor",
  park_decor:        "Park-icoon / decor",
  animal_ride:       "Dierenrit",
}

export const TYPES: TypeKey[] = Object.keys(TNL) as TypeKey[]

export const TEMO: Record<TypeKey, string> = {
  // ── Coasters ──────────────────────────────────────────────────────────────
  wooden_coaster:    "\u{1F333}\u{1F3A2}", // boom + achtbaan
  family_coaster:    "\u{1F39F}\u{FE0F}",  // kaartje
  kiddie_coaster:    "\u{1F68C}",          // bus (kleine trein)
  thrill_coaster:    "\u{1F3A2}",          // achtbaan
  launch_coaster:    "\u{1F680}",          // raket
  inverted_coaster:  "\u{1F504}",          // rotatie (ondersteboven)
  spinning_coaster:  "\u{1F300}",          // wervelwind
  water_coaster:     "\u{1F30A}",          // golf
  mine_train:        "\u{26CF}\u{FE0F}",   // houweel
  alpine_coaster:    "\u{26F7}\u{FE0F}",   // ski
  // ── Flat thrill ───────────────────────────────────────────────────────────
  drop_tower:        "\u{1F5FC}",          // toren
  kiddie_drop:       "\u{1F4CD}",          // mini-toren (pin)
  pirate_ship:       "⛵",             // zeilboot
  frisbee_pendulum:  "\u{1F4BF}",          // schijf
  top_spin:          "\u{1F504}",          // lus
  tilt_a_whirl:      "\u{1F32A}\u{FE0F}",  // wervelwind
  // ── Hoog + zwaai ──────────────────────────────────────────────────────────
  star_flyer:        "\u{1FA82}",          // kite / schommel
  wave_swinger:      "\u{1FA82}",          // schommel
  flying_chairs:     "\u{1FA82}",          // schommel
  flying_bicycles:   "\u{1F6B4}",          // fiets
  balloon_ride:      "\u{1F388}",          // ballon
  // ── Spinners ──────────────────────────────────────────────────────────────
  teacups:           "☕",             // koffie
  flat_spinner:      "\u{1F365}",          // donut
  octopus:           "\u{1F419}",          // octopus
  // ── Klassiek-draaien ──────────────────────────────────────────────────────
  carousel:          "\u{1F3A0}",          // draaimolen
  ferris_wheel:      "\u{1F3A1}",          // reuzenrad
  // ── Beleving ──────────────────────────────────────────────────────────────
  story_ride:        "\u{1F3AD}",          // theater
  madhouse:          "\u{1F3F0}",          // kasteel
  // ── Water ─────────────────────────────────────────────────────────────────
  log_flume:         "\u{1F6A3}",          // roeiboot
  rapids:            "\u{1F30A}",          // golf
  splash_battle:     "\u{1F52B}",          // pistool
  // ── Speel / klauter ───────────────────────────────────────────────────────
  playground:        "\u{1F6DD}",          // speelplaats
  funhouse:          "\u{1F3AA}",          // circus
  ball_pit:          "⚽",             // bal
  walkthrough_climb: "\u{1F9D7}",          // klimmer
  // ── Wedijver ──────────────────────────────────────────────────────────────
  arcade:            "\u{1F3AE}",          // game controller
  karting:           "\u{1F3CE}\u{FE0F}",  // raceauto
  shoot_ride:        "\u{1F3AF}",          // doel
  // ── Besturen ──────────────────────────────────────────────────────────────
  kids_drive:        "\u{1F697}",          // auto
  bumper_cars:       "\u{1F4A5}",          // botsing
  pedal_boat:        "\u{1F6F6}",          // kano
  pedal_ride:        "\u{1F6B2}",          // fiets
  kiddie_track_ride: "\u{1F682}",          // trein (small)
  // ── Rondrit / show ────────────────────────────────────────────────────────
  transport_train:   "\u{1F682}",          // stoomtrein
  slow_boat:         "\u{26F5}",           // zeilboot
  show:              "\u{1F3AD}",          // theater
  walkthrough_decor: "\u{1F5FA}\u{FE0F}",  // kaart / omgeving
  park_decor:        "\u{1F331}",          // spruitje
  animal_ride:       "\u{1F434}",          // paard
}

// `high` en `fast` zijn verwijderd (ADR-024 v2): vervangen door height_intensity en intensity.
// `themed` is uit PROPS gehaald — nu een gradient-veld `theming` op de ride (zie THEMING_LEVELS).
export const PROPS: PropKey[] = [
  "wet",
  "inversions",
  "spins",
  "swings",
  "dark",
  "scary",
  "nausea",
  "extra_paid",
]

export const PNL: Record<PropKey, string> = {
  wet:        "Nat worden",
  inversions: "Over de kop",
  spins:      "Rondjes draaien",
  swings:     "Schommelen",
  dark:       "In het donker",
  scary:      "Bewust eng",
  nausea:     "Tolt (misselijkheid mogelijk)",
  extra_paid: "Extra betalen",
}

export const PEMO: Record<PropKey, string> = {
  wet:        "\u{1F4A6}",  // druppels
  inversions: "\u{1F501}",  // herhaal
  spins:      "\u{1F300}",  // wervelwind
  swings:     "⛵",     // boot
  dark:       "\u{1F311}",  // maan
  scary:      "\u{1F631}",  // schrik
  nausea:     "\u{1F635}",  // duizelig gezicht
  extra_paid: "\u{1F4B6}",  // bankbiljet
}

/** Theming-niveaus (ADR-024) — mate van wereld/verhaal/onderdompeling op een attractie. */
export const THEMING_LEVELS: Array<{ key: "none" | "light" | "medium" | "high"; nl: string; emoji: string }> = [
  { key: "none",   nl: "Niet thematisch",       emoji: "—" },
  { key: "light",  nl: "Lichte sfeer",           emoji: "\u{1F331}" },
  { key: "medium", nl: "Sterke sfeer",           emoji: "\u{1F3F0}" },
  { key: "high",   nl: "Volle wereld / verhaal", emoji: "✨" },
]

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

/** Gevoel-buckets voor categorie-interesses (ADR-025). */
export const CNL: Record<Category, string> = {
  thrill:  "Buikkriebels",
  spin:    "Doldraaien",
  immerse: "Andere wereld",
  splash:  "Spetters",
  compete: "Mikken",
  drive:   "Besturen",
  romp:    "Ravotten",
  savor:   "Slenteren",
}

export const CEMO: Record<Category, string> = {
  thrill:  "\u{1F3A2}", // achtbaan
  spin:    "\u{1F300}", // wervelwind
  immerse: "\u{1F3F0}", // kasteel
  splash:  "\u{1F4A6}", // druppels
  compete: "\u{1F3AF}", // doel
  drive:   "\u{1F697}", // auto
  romp:    "\u{1F938}", // acrobaat
  savor:   "\u{1F331}", // spruitje
}

/** Categorieën voor categorie-interesses (ADR-025). */
export const CATEGORIES: Array<{ key: Category; label: string; emoji: string }> = [
  { key: "thrill",  label: CNL.thrill,  emoji: CEMO.thrill },
  { key: "spin",    label: CNL.spin,    emoji: CEMO.spin },
  { key: "immerse", label: CNL.immerse, emoji: CEMO.immerse },
  { key: "splash",  label: CNL.splash,  emoji: CEMO.splash },
  { key: "compete", label: CNL.compete, emoji: CEMO.compete },
  { key: "drive",   label: CNL.drive,   emoji: CEMO.drive },
  { key: "romp",    label: CNL.romp,    emoji: CEMO.romp },
  { key: "savor",   label: CNL.savor,   emoji: CEMO.savor },
]

/** Thematisatie-belang drietrap (ADR-024 v2) — beïnvloedt park-keuze, niet losse rides. */
export const THEMING_IMPORTANCE_LEVELS: Array<{ key: "none" | "medium" | "high"; nl: string; emoji: string }> = [
  { key: "none",   nl: "Niet belangrijk", emoji: "\u{1F3AF}" },
  { key: "medium", nl: "Matig",           emoji: "\u{1F3A2}" },
  { key: "high",   nl: "Heel belangrijk", emoji: "\u{1F3F0}" },
]

/** Intensiteits-ankers (ADR-024) — 5-trap, beleefde intensiteit. */
export const INTENSITY_ANCHORS: Array<{ level: number; label: string; desc: string }> = [
  { level: 1, label: "Rustig deinen",    desc: "Passieve beweging, geen schrik-trigger" },
  { level: 2, label: "Lichte deining",   desc: "Beweegt mee, herkenbaar veilig" },
  { level: 3, label: "Stevige beuk",     desc: "Echte rit, familie-niveau" },
  { level: 4, label: "Hou je vast",      desc: "Thrill, hartje slaat over" },
  { level: 5, label: "Niet voor watjes", desc: "Extreme G's, gillen" },
]

/** Hoogte-ankers (ADR-024) — 5-trap, beleefde hoogte (niet meters). */
export const HEIGHT_ANCHORS: Array<{ level: number; label: string; example: string; indicative: string }> = [
  { level: 1, label: "Voeten op de grond",           example: "Draaimolen, treintje",          indicative: "0 m" },
  { level: 2, label: "Omhoog, maar je voelt je vast", example: "Bumballoon, Dolle Busrit",     indicative: "0-5 m" },
  { level: 3, label: "Je ziet de hoogte",             example: "K3-rollercoaster, Wienerwalz", indicative: "5-10 m" },
  { level: 4, label: "Hoogte is deel van de thrill",  example: "Heidi the Ride, Supersplash",  indicative: "10-50 m" },
  { level: 5, label: "Hoogte ís de thrill",      example: "Dalton Terror, Nachtwachtflyer", indicative: "> 50 m" },
]
