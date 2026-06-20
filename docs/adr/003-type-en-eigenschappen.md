# 3. Twee assen: bewegingstype en eigenschappen

- Status: Accepted (uitgebreid door [ADR-024](024-voorkeur-model-gedragsstaten.md))
- Groep: Attractiemodel

## Context

Om te bepalen waar iemand het naar zijn zin heeft, moeten we attracties beschrijven op
een manier die smaak vat. Eén enkel "soort"-label is ontoereikend om twee redenen: een
attractie is vaak meerdere dingen tegelijk (een wildwaterbaan is nat én hoog én snel),
en een vrij soort-label mengt het bewegingsmodel (wat je lichaam voelt) met thema en
schaal (hoe het eruitziet). Voor de vraag "kom ik aan mijn trekken" telt het
bewegingsmodel; thema is ruis. Tegelijk weten mensen scherp wat ze niet willen voelen
(nat, op de kop), los van welk type rit dat is.

## Decision

Elke attractie krijgt twee onafhankelijke assen:

1. **Bewegingstype** — een verfijnde categorie op industriestandaard-model
   (bv. pirate ship, teacups, drop tower, wing coaster), gekozen op beweging, niet op
   thematisatie. Een ruimteschip dat schommelt is een pirate ship.
2. **Eigenschappen** — objectieve feiten over de beleving: nat, hoog, snel, inversies,
   draait, schommelt, donker.

## Consequences

- Het type draagt smaak-generalisatie: wie één schommelschip leuk vindt, vindt ze
  vermoedelijk allemaal leuk — één mening werkt over alle parken.
- Eigenschappen snijden dwars door types en vangen harde uitsluiters ("wat het ook is,
  als het nat maakt: nee").
- Samen lossen ze het kleutertoestel op: een speeltuin-type zonder enge eigenschappen
  valt vanzelf in "voor de kleintjes".

### Uitbreiding via ADR-024

[ADR-024](024-voorkeur-model-gedragsstaten.md) bouwt op deze twee assen voort en
vereist drie soorten uitbreiding aan attractiezijde:

**Typologie-aanpassing:**

- Type `dark_ride` is permanent verwijderd; was deprecated alias voor `story_ride`.

**Verwijderde props** (zowel uit data als persoon-UI):

- **`high`** — vervangen door intensiteits-tag `height_intensity` (1-5,
  beleving). Was te grof: K3-rollercoaster (5m) en Nachtwachtflyer (70m)
  hadden dezelfde tag.
- **`fast`** — vervangen door intensiteits-tag `intensity` (1-5). Snel zit
  per definitie in intensiteit-niveau 4-5.

**Nieuwe props:**

- **`scary`** — bewust eng (jump-scares, horror-theming). Spookslot ja,
  Droomvlucht nee. Onderscheidt sfeer-donker van schrik-bedoeld.
- **`themed`** — mate van wereld/verhaal/onderdompeling. Gradient die op alle
  types kan zitten; matcht de categorie-interesse `story` ongeacht het
  mechanische type. Per [ADR-024](024-voorkeur-model-gedragsstaten.md) niet
  meer in de persoon-drietrap — alleen attractie-tag.
- **`nausea`** — rondtollen-mechaniek waar misselijkheid kan optreden
  (5+ seconden continu rondtollen als hoofd-ervaring). Tagt theekopjes,
  flat-spinners, spinning coasters, madhouses, top spins. Persoon kan
  `nausea: nooit` zetten — dan worden alle gemerkte rides 🙅 ongeacht
  intensity of categorie-match. Voorheen `vertigo` genoemd, hernoemd om
  naam-overlap met categorie-key `spin` te vermijden.
- **`extra_paid`** — attracties die *bovenop* het entree-ticket bijbetalen
  vragen (typisch arcades, sommige karting-banen, foto-attracties).
  Persoon kan `extra_paid: nooit` zetten — past bij gezinnen die niet
  willen onderhandelen tijdens een park-dag.

**Park-niveau theming-score:**

Een park krijgt een afgeleide `theming_score` (1-5) — gemiddelde van
`themed`-tags over zijn rides plus optionele handmatige park-overschrijving.
Voedt de persoons-as "thematisatie-belang" voor parkkeuze.

**Intensiteits-tags (verplicht):**

- **`intensity`** (1-5) — beleefde intensiteit. Niet een formule uit
  speed/g/drop, wel een handmatige tag met ankers (1 = kiddie-flat, 3 =
  familie-coaster, 5 = mega-coaster). Vangt ook "verrassend wild door donker"
  (Vogel Rok) wat een formule mist.
- **`height_intensity`** (1-5) — beleefde hoogte. Apart van `max_height_m`
  zodat een 45m gesloten gondel (Pagode) op intensiteit lager kan staan dan
  een open 30m coaster.

**Optionele data-velden** (FYI op het kaartje + voeding voor de tag-agent bij
het bepalen van `intensity`):

- `top_speed_kmh`, `max_height_m`, `drop_m`, `inversions`, `duration_s`,
  `g_force`.

Volledige semantiek + persoons-bands staat in
[ADR-024](024-voorkeur-model-gedragsstaten.md).

### Tweede uitbreiding via ADR-025: verfijnde types + model/manufacturer

[ADR-025](025-kunnen-willen-moeten-zullen.md) drijft een fijnere `TypeKey`-set
en twee nieuwe optionele velden door:

**Verfijnde TypeKey-set** — vervangt de oude grove 18-types. Reden: de
gevoel-categorisering uit ADR-025 (Category als afleiding) werkt alleen als
elke fijne type eenduidig in één categorie valt. Type-set hieronder (niet
exhaustief — uit te breiden naarmate nieuwe rides binnenkomen):

| Cluster | Fijne TypeKeys |
|---|---|
| **Coasters** | `wooden_coaster` · `family_coaster` · `kiddie_coaster` · `thrill_coaster` · `launch_coaster` · `inverted_coaster` · `spinning_coaster` · `water_coaster` · `mine_train` · `alpine_coaster` |
| **Flat thrill** | `drop_tower` · `kiddie_drop` · `pirate_ship` · `frisbee_pendulum` · `top_spin` |
| **Hoog + zwaai** | `star_flyer` · `wave_swinger` · `flying_chairs` · `flying_bicycles` · `balloon_ride` |
| **Spinners (nausea-rich)** | `teacups` · `flat_spinner` · `octopus` · `tilt_a_whirl` |
| **Klassiek-draaien** | `carousel` · `ferris_wheel` |
| **Beleving** | `story_ride` · `madhouse` |
| **Water** | `log_flume` · `rapids` · `splash_battle` |
| **Speel / klauter** | `playground` · `funhouse` · `ball_pit` · `walkthrough_climb` |
| **Wedijver** | `arcade` · `karting` · `shoot_ride` |
| **Besturen** | `kids_drive` · `bumper_cars` · `pedal_boat` · `pedal_ride` · `kiddie_track_ride` |
| **Rondrit / show** | `transport_train` · `slow_boat` · `show` · `walkthrough_decor` · `park_decor` · `animal_ride` |

Voorbeelden van waarom finer-grained nodig is:
- `top_spin` (Pulsar — pure flatride) vs. `madhouse` (Villa Volta — verhaal
  in een ruimte met top-spin-mechaniek). Mechanisch verwant, gevoel-categorie
  verschillend (**Buikkriebels** vs. **Andere wereld**).
- `drop_tower` (Pulsar, Dalton Terror) vs. `kiddie_drop` (kleine valtoren).
  Beide **Buikkriebels** maar de intensity-as moet duidelijk schuiven; door
  ze als aparte types te taggen krijgt de tag-agent een steviger anker dan
  alleen een i-score.
- `carousel` (klassieke paardenmolen, langzaam) vs. `wave_swinger` (omhoog,
  zwaai, wind). Mechanisch verschillend; **Slenteren** vs. **Buikkriebels**.

**Nieuwe optionele velden op `Ride`:**

- **`model?: string`** — fabrikant-model-identifier voor exacte replica's
  tussen parken. Bv. `vekoma_boomerang` linkt Cobra (Walibi BE) · Boomerang
  (Bellewaerde) · Generator (Walibi RA). Conventie: `<manufacturer>_<model>`
  in snake_case.
- **`manufacturer?: string`** — fabrikant-naam. Vrije string maar
  geconventionaliseerd: `vekoma`, `intamin`, `mack`, `bolliger_mabillard`, …

Beide optioneel; data wordt graduel ingevuld via aparte curatie-pass.

**Categorie wordt afgeleid, niet opgeslagen** — zie [ADR-025](025-kunnen-willen-moeten-zullen.md)
§Types ≠ categorieën. `Ride` krijgt geen `category`-veld; één
`categoryOf(type): Category`-mapping in code levert de gevoel-bucket per
ride. Mapping leeft daar zodat categorieën herzien kunnen worden zonder
park-JSON-migratie.

- Toekomst / open vragen: het type-vocabulaire is afgeleid van industriestandaarden
  maar zelf vastgezet; nieuwe parken kunnen types vergen die nog ontbreken.

## Considered alternatives

- **Alleen "soort"**: te grof, mengt beweging met thema, dwingt één-op-één-hokjes.
  Niet gekozen.
- **Alleen eigenschappen**: vangt afkeer goed maar verliest de smaak-generalisatie en
  laat het kleutertoestel (geen enge eigenschappen) ongeplaatst. Niet gekozen.
