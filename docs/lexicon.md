# Lexicon — Magikal Kompas

> **Ubiquitous language.** Eén plek voor de woordenschat waarmee we over dit project
> praten: in code, ADR's, prompts, data én onderling. Doel is dat één woord één ding
> betekent, en dat we weten *welk woord op welke laag* hoort.
>
> Dit is een **levend document**. Beslissingen over de woordenschat horen hier thuis;
> het *waarom* van een keuze hoort in een ADR (zie [ADR-027](adr/027-ubiquitous-language.md)).

## Hoe te lezen

Elke term heeft waar relevant:

- **Concept** — het ding zelf, in mensentaal.
- **Model-id** — de identifier in code/data (`TypeKey`, `intensityBand`, …).
- **UI-label** — wat de eindgebruiker ziet (kan bewust afwijken van het model).
- **Laag** — zie het lagenmodel hieronder.
- **Status** — ✅ canoniek · 🟡 te beslissen (synoniem/overlap, zie §Synoniemclusters) · ⛔ deprecated/vervangen.

### Kernprincipe: model ≠ UI

De ubiquitous language is de **modeltaal**. De UI mag de complexiteit van dat model
bewust afschermen voor de gebruiker. Een afwijking tussen model-id en UI-label is dus
**geen fout** — ze hoort alleen expliciet en consistent te zijn, en hier vastgelegd.

### Taal-conventies (zie [ADR-015](adr/015-meertalige-ui.md))

1. **Vocabulaire-sleutels in data zijn stabiel-Engels** — `type`, `props`, … Nooit een
   NL-woord als sleutel in park-JSON; enkel als display-label in `i18n/<lang>.json`.
2. **Modeltaal in code mag NL zijn** waar het een domeinbegrip is zonder data-sleutel-rol
   (`intrinsiek`, `voorGroep`, `saai`, `alleen`, `begeleid`, …). Dit is bewust: de
   domeintaal zit zo in de code zelf.
3. **Vrije tekst** (`oms`, `attribution`) mag een string zijn (bron-taal NL) of een
   object `{ nl, en, fr }`. Beide blijven geldig.
4. **Eigennamen** (park- en attractienamen) worden niet vertaald.
5. **UI-strings** horen in `i18n/<lang>.json` via `t(key)`, niet hardcoded. NL is vandaag
   bron-van-waarheid en fallback. *(Status: deels nageleefd — zie §Bekende drift.)*

## Het lagenmodel

De woordenschat valt uiteen in vijf lagen. Het model-vs-UI-onderscheid leeft vooral
tussen laag 3 en laag 4.

| # | Laag | Bereik | Voorbeeld |
|---|------|--------|-----------|
| 0 | **Wereld / data** | per attractie | `type`, `props`, `intensity`, toegangsregels |
| 1 | **Voorkeur-invoer** | per lid | `intensityBand`, `categoryInterests`, `propChoices` |
| 2 | **Afgeleide staat** | lid × attractie | gedragsstaten (😍🙂🥱😰🙅) + signalen (🌱🍂) |
| 3 | **Aggregatie** | groep × park | KUNNEN · WILLEN · MOETEN · ZULLEN · splits |
| 4 | **UI-oppervlak** | wat de gebruiker ziet | "Welk park?", "gezelschap", "deelnemer" |

De **ruggengraat**: de vier modale werkwoorden (laag 3) zijn de hoofdtaal waarin we over
een park beslissen; de vijf gedragsstaten (laag 2) zijn de brandstof eronder.

---

## Laag 0 — Wereld / data (per attractie)

### Kernbegrippen

| Concept | Model-id | UI-label | Status |
|---|---|---|---|
| Pretpark | `Park` / veld `park` (eigennaam) | "park" | ✅ |
| Attractie | `Ride` / veld `att` | "attractie" | 🟡 (zie C8) |
| Attractie + parkref | `RideWithPark` | — | ✅ |
| Bewegingstype | `TypeKey` / veld `type` | "Type beweging" (admin) | ✅ |
| Eigenschap | `PropKey` / veld `props` | "Eigenschappen" | ✅ |
| Beleefde intensiteit | veld `intensity` (1–5) | gradient-band | ✅ |
| Beleefde hoogte | veld `height_intensity` (1–5) | gradient-band | ✅ |
| Thematisatie (rit) | veld `theming` (`Theming`) | "sfeer / wereld" | 🟡 (zie C6) |

### Toegangsregels (lengte & leeftijd)

| Concept | Model-id | Eenheid | Opmerking |
|---|---|---|---|
| Min. lengte onder begeleiding | `beg` | cm | `0` = geen eis |
| Min. lengte zelfstandig | `zelf` | cm | `0` = geen eis |
| Max. lengte | `max` | cm of `null` | ≥180 = veiligheid; <180 = kindertoestel |
| Min. leeftijd begeleiding | `min_age_beg` | jaar of `null` | `null` = onbekend |
| Min. leeftijd zelfstandig | `min_age_zelf` | jaar of `null` | `null` = onbekend |
| Max. leeftijd | `max_age` | jaar of `null` | soft-uit (ontgroeid) |

> ⚠️ De veldnamen `att`, `oms`, `beg`, `zelf`, `h`, `on`, `max` zijn **cryptische
> legacy-sleutels** (uit de oude app.js). Ze blijven stabiel om data niet te breken,
> maar in proza gebruiken we de *concept*-naam (attractienaam, omschrijving,
> begeleidingslengte, …), niet de sleutel. Zie C9.

### `type` — bewegingsmodel (21 sleutels: 20 canoniek + 1 deprecated)

Stabiel-Engelse sleutels. Categoriseert op **beweging**, niet op thematisatie. Kies er
exact één per attractie. NL-labels in `TNL` ([vocab.ts](../src/shared/vocab.ts)).

| Sleutel | NL-label | | Sleutel | NL-label |
|---|---|---|---|---|
| `thrill_coaster` | Thrill-achtbaan | | `ferris_wheel` | Reuzenrad |
| `family_coaster` | Familie-achtbaan | | `flat_spinner` | Ronddraaier |
| `kiddie_coaster` | Kinderachtbaan | | `water_ride` | Waterbaan |
| `spinning_coaster` | Spinning coaster | | `water_battle` | Watergevecht |
| `drop_tower` | Valtoren | | `story_ride` | Belevingsrit |
| `pirate_ship` | Schommelschip | | `transport` | Treintje / boottocht |
| `top_spin` | Top spin / overslag | | `kiddie_flat` | Kinderattractie |
| `teacups` | Koffiekopjes | | `playground` | Speeltuin |
| `carousel` | Draaimolen | | `show` | Show |
| `wave_swinger` | Zweefmolen | | `funhouse` | Funhouse |
| | | | `dark_ride` ⛔ | Darkride → gebruik `story_ride` |

### `props` — eigenschappen (6 sleutels)

Stabiel-Engelse sleutels; een attractie heeft er een subset van (aanwezigheid = `true`).
NL-labels in `PNL`.

| Sleutel | NL-label | Betekenis |
|---|---|---|
| `wet` | Nat worden | expliciete sproei/splash |
| `inversions` | Over de kop | loopings/keringen ≥ 1 |
| `spins` | Rondjes draaien | rotatie om eigen as |
| `swings` | Schommelen | heen-en-weer pendel |
| `dark` | In het donker | bedekt/binnenbaan (≠ `story_ride` zelf) |
| `scary` | Bewust eng | jump-scares, horror-theming |

> ⛔ `high`, `fast` zijn verwijderd (ADR-024 v2) → vervangen door `height_intensity` /
> `intensity`. `themed` is verwijderd → vervangen door `theming`. **CLAUDE.md vermeldt
> nog de oude lijst** — zie §Bekende drift.

### Intensiteits- en hoogte-ankers (1–5)

Schaal voor `intensity` en `height_intensity` — **beleving**, niet techniek. Volledige
ankers in `INTENSITY_ANCHORS` / `HEIGHT_ANCHORS`.

| Niv. | `intensity` | `height_intensity` |
|---|---|---|
| 1 | Rustig deinen | Voeten op de grond |
| 2 | Lichte deining | Omhoog, maar je voelt je vast |
| 3 | Stevige beuk | Je ziet de hoogte |
| 4 | Hou je vast | Hoogte is deel van de thrill |
| 5 | Niet voor watjes | Hoogte ís de thrill |

### Technische hulpvelden & metadata

Optionele feiten die de tagger/admin helpen, géén directe voorkeur-invoer: `top_speed_kmh`,
`max_height_m`, `drop_m`, `inversions_count`, `duration_s`, `g_force`, `manufacturer`,
`model`. Verder: `tag_source`, `tag_confidence`, `sources`, `park_url`, `wikipedia_url`,
`theming_score` (park-niveau, 1–5). Visuele/bron-velden: `image` (CC-publiek),
`admin_preview` (rechten-niet-gecheckt, nooit publiek), `activity` (wijzig/verify-log).
Detail in [data/schema.md](../data/schema.md) en [ADR-014](adr/014-visuele-en-bron-velden.md).

---

## Laag 1 — Voorkeur-invoer (per lid)

Wat een lid aangeeft. Verzameld in `MemberPrefs`; gekeyd op `member.name` in
`PartyState.memberPrefs`.

| Concept | Model-id | Vorm | UI-sectie |
|---|---|---|---|
| Intensiteit-band | `intensityBand` | `[min,max]` of `null` | "Intensiteit" |
| Intensiteit-pijngrens | `intensityCeiling` | 1–5 of `null` | "Intensiteit" |
| Hoogte-pijngrens | `heightCeiling` | 1–5 of `null` | "Hoogte plafond" |
| Hoogte-band | `heightBand` | `[min,max]` of `null` | zelden ("ik kom voor de hoogte") |
| Thematisatie-belang | `themingImportance` | `none`/`medium`/`high` | "Thematisatie-belang" |
| Categorie-interesses | `categoryInterests` | set van `Category` | "Interesses" |
| Eigenschap-keuzes | `propChoices` | per prop een `PropTrap` | "Eigenschappen" |
| Per-attractie-uitzondering | `perRideOverride` | `"<parkSlug>/<att>"` → `Behavior` | (override) |

**`Category`** (4): `water` (Waterritten) · `story` (Belevingsritten) · `shows` (Shows) ·
`classic_fair` (Klassieke kermis).

**`PropTrap`** (drietrap per prop): `prima` (default) · `voorGroep` ("voor de groep gaat
het") · `nooit` ("absoluut niet"). ⚠️ `voorGroep` botst met de gedragsstaat — zie C3.

> De **band** speelt twee rollen tegelijk: onder `band.min` → 🥱 saai, boven `band.max`
> → 😰 alsmoet, binnen band (+ categorie-match) → 😍 intrinsiek. De **ceiling** is een
> harde grens → 🙅 nooit.

### Identiteit van een lid (`Member`)

| Concept | Model-id | Opmerking |
|---|---|---|
| Naam | `name` | tevens sleutel voor `memberPrefs` |
| Lengte | `h` | cm of `null` |
| Meedoen in groep | `on` | boolean (aan/uit) |
| Favoriet | `favorite` | manuele ster, geen model-impact |
| Geboortedatum | `birthYear` / `birthMonth` / `birthDay` | precisie bepaalt onzekerheid |

---

## Laag 2 — Afgeleide staat (lid × attractie)

Het resultaat van voorkeur + attractie-tags + parkregels, per lid per attractie.

### Gedragsstaten — `Behavior` (5)

| Model-id | Emoji | UI-label | Betekenis |
|---|---|---|---|
| `intrinsiek` | 😍 | "Wil graag" | hiervoor kom ik |
| `voorGroep` | 🙂 | "Kan mee" | kan mee zonder drama, kiest niet zelf |
| `saai` | 🥱 | "Te saai" | onder band-min, maar gaat mee |
| `alsmoet` | 😰 | "Opoffering" | boven keuze, opofferbaar (té hevig) |
| `nooit` | 🙅 | "Niet" | absoluut nee / niet haalbaar |

### Signalen (geen gedragsstaat)

| Model-id | Emoji | UI-label | Betekenis |
|---|---|---|---|
| `GrowthSignal` `{ growth: true }` | 🌱 | "Nog te klein/jong" | wil wel, mag nog niet |
| `OutgrownSignal` `{ outgrown: true }` | 🍂 | "Ontgroeid" | wil wel, mag niet meer |

> 🟡 Status staat-of-signaal niet eenduidig: code modelleert 🌱/🍂 als **aparte
> signaal-objecten**, ADR-025 promoveert ze tot **staten met voorrang**, en meerdere
> comments tellen inconsistent "4 vs 5 gedragsstaten". Zie C5.

### Toegangs-toestanden (parkregel-afleiding)

`LengthState`: `alleen` · `begeleid` · `klein` · `groot` · `ontgroeid` · `onbekend`.
`AgeState`: `alleen` · `begeleid` · `jong` · `ontgroeid` · `onbekend`.
Gecombineerd via `status()` → `RideState`. Voeden de 🌱/🍂-signalen en `nooit`.

---

## Laag 3 — Aggregatie (groep × park)

De beslis-taal: vier modale werkwoorden, afgeleid uit de gedragsstaten van alle
geselecteerde leden.

| Werkwoord | Model-id (groep) | Definitie |
|---|---|---|
| **KUNNEN** | `groupKunnenIntersect` | doorsnede: # attracties waar *iedereen* in {🥱🙂😍😰} valt (niet 🙅/🌱/🍂) |
| **WILLEN** | `groupWillenCount` | # attracties met genoeg intrinsieke interesse (😍) |
| **MOETEN** | `groupMoetenCounts` | twee getallen: `saai` (gedwongen 🥱) + `wild` (gedwongen 😰) van noodzakelijk-aanwezige leden |
| **ZULLEN** | `groupZullenCount` | # attracties met groei-signaal (🌱) |

**Hulp-begrippen:**
- **Noodzakelijk-aanwezig** (`requiredCompanions`) — een lid dat niet weg kan zonder de
  groep schade te doen (enige beschikbare begeleider). MOETEN telt alleen zulke leden.
- **samen / deels** — `ParkMetrics.samen` = # attracties die de hele groep samen kan.
  ⚠️ "samen" heeft een tweede betekenis bij splits — zie C7.
- **Splits** — gezelschap valt tijdelijk in subgroepen uiteen ([ADR-026](adr/026-splits-planning.md)).
  Begrippen: **split-moment**, **split-configuratie** (partitie van de groep),
  **moeite-budget** `tol` (hoeveel gedwongen leden per moment toegestaan; regelt de
  balans splits ↔ MOETEN).

> 🟡 De UI toont per-attractie-sortering "Kunnen"/"Willen" (`RideSortKey`) naast de
> groeps-pills KUNNEN·WILLEN·MOETEN·ZULLEN·SPLITS. Werkwoord (laag 3) en gedragsstaat
> (laag 2) lijken op elkaar maar zijn níét hetzelfde. Zie C4.

---

## Laag 4 — UI-oppervlak

Wat de eindgebruiker ziet. Bron: `i18n/nl.json` + (nog) hardcoded strings.

| UI-label | Model-term | Afwijking? |
|---|---|---|
| "Welk park?" (tab) | route `parken` | nee |
| "Wat eerst?" (tab) | route `volgorde` | nee |
| "Wie gaat mee?" (pill) | route `deelnemers` | nee |
| "gezelschap" | `party` / `PartyState` | ja — model-EN, UI-NL |
| "lid" / "deelnemer(s)" | `Member` / `people` | 🟡 twee UI-woorden — zie C1 |
| "attractie" | `Ride` / `att` | nee |
| "Wil graag / Kan mee / Te saai / Opoffering / Niet" | `Behavior`-staten | nee (bewuste vermenselijking) |
| sorteer "Eerlijkst / Totaal plezier" | `SortKey` `weak` / `avg` | nee |

---

## Synoniemclusters — te beslissen (spar-agenda)

De gevallen waar **meerdere termen op één concept wijzen**, of waar één term twee
concepten draagt. Status 🟡 tot we ze samen hebben rechtgetrokken. Per cluster mijn
voorlopige aanbeveling — nog niet vastgelegd.

| # | Concept (Y) | Termen die nu rondzweven (X) | Voorlopige aanbeveling |
|---|---|---|---|
| **C1** | de persoon | model `Member` / veld `people`; UI "lid" (toevoegen/verwijderen) én "deelnemer(s)" (delen, view-titel, "Wie gaat mee?") | kies één UI-woord; model `Member` houden |
| **C2** | de groep | model `party` / `PartyState`; UI "gezelschap" | "gezelschap" is sterk; overweeg model→`Gezelschap`/`partyState` consistent |
| **C3** | `voorGroep` overladen | gedragsstaat 🙂 "Kan mee" **én** `PropTrap`-waarde "voor de groep" | hernoem één van beide (bv. staat → `meegaan`/`neutraal`) |
| **C4** | werkwoord vs staat | laag 3 "Kunnen/Willen" tellers vs laag 2 "Kan mee"/staten; lijken te rijmen | houd werkwoorden exclusief voor laag 3; staten krijgen niet-werkwoord-labels |
| **C5** | groei/ontgroeid | "signaal" (code) vs "staat" (ADR-025); "4 vs 5 gedragsstaten" in comments | beslis: signaal náást de 5 staten; comments rechttrekken |
| **C6** | thema/wereld | prop `themed` ⛔ / rit `theming` (4-trap) / park `theming_score` (1–5) / lid `themingImportance` (3-trap) / categorie `story` / UI "sfeer", "wereld", "thematisatie" | één begripsnaam + bewust verschillende schalen documenteren |
| **C7** | "samen" | `ParkMetrics.samen` (doorsnede) vs ADR-026 "samen-blok" (binnen `tol`) | twee namen geven, of "samen" reserveren voor doorsnede |
| **C8** | attractie | UI "attractie" / soms "rit"; model `Ride` / veld `att` | UI "attractie" canoniseren; "rit" enkel informeel |
| **C9** | cryptische datasleutels | `att`, `oms`, `beg`, `zelf`, `h`, `on`, `max` | sleutels stabiel houden; concept-namen vastleggen voor proza |

---

## Bekende drift (op te lossen, scope "docs rechttrekken")

- **CLAUDE.md props-lijst is stale**: vermeldt `high, fast` (verwijderd) en mist `scary`.
  Canoniek = `wet, inversions, spins, swings, dark, scary`.
- **Comments "4 gedragsstaten"** in [types.ts:194](../src/shared/types.ts:194) en
  [BehaviorBar.tsx:4](../src/shared/components/BehaviorBar.tsx:4) terwijl `Behavior` er 5 heeft.
- **ADR-024 vs ADR-025** over 🌱/🍂 (signaal vs staat) — zie C5.
- **Hardcoded UI-strings** die nog niet via `i18n` lopen (route-tabs, gedragsstaat-labels,
  wizard-stappen) — bekend, conform ADR-015 op te schonen (latere ronde).

---

## Deprecated & vervangen

| Oud | Nieuw | Bron |
|---|---|---|
| `dark_ride` (type) | `story_ride` (+ `dark`-prop voor coasters in donker) | ADR-024 |
| `high`, `fast` (props) | `intensity`, `height_intensity` | ADR-024 v2 |
| `themed` (prop) | `theming` (rit) + categorie `story` | ADR-024 |
| `hoog`/`snel`/`nat`/… (NL prop-keys) | `high`/`fast`/`wet`/… → en verder zie boven | ADR-015 |
| `closed`/`closed_year`/… velden | hard verwijderen uit JSON; reden in commit | ADR-023 (Withdrawn) |
| `source_url` (string) | `sources` (string[]) + apart `park_url` | ADR-014 |
