# Backlog

Lopende stapel werk die nog niet (volledig) is opgepakt. Eén item per regel
zodat snelle scans mogelijk blijven.

## Verhouding tot ADRs

- **ADR** = vastgelegde beslissing (huidige stand, met motivatie).
- **Backlog** = werk dat die beslissing concreet maakt, of werk waarvoor nog
  geen beslissing nodig is.

Als een item een dragende keuze met zich meebrengt → eerst (of tegelijk) een
ADR. Als het gewoon uitvoering is van iets dat al in een ADR staat → backlog
volstaat.

## Status-emoji

- 🟢 klaar om op te pakken (richting helder)
- 🟡 onderzoek/ontwerp nodig vóór uitvoering
- 🔵 wacht op iets externs
- ⚪️ idee, nog niet besloten of we het doen

## Items

### Voorkeur-model uitrollen ([ADR-024](adr/024-voorkeur-model-gedragsstaten.md))

De ADR is geland; nu is het uitvoering. Volgorde belangrijk: data eerst,
dan code, dan UI.

- 🟢 **Park-curation-agent uitbreiden** — twee verplichte tags toevoegen aan
  [tools/park-curation.md](../tools/park-curation.md): `intensity` (1-5) en
  `height_intensity` (1-5). Ankers uit ADR-024 in de prompt. Eerste batch:
  rerun op bestaande attractieset.
- 🟢 **Data-schema uitbreiden** — `data/schema.md` bijwerken: nieuwe types
  (`story_ride` vervangt `dark_ride`), nieuwe props (`scary`, `themed`),
  intensiteits-tags (`intensity`, `height_intensity`), optionele data-velden
  (`top_speed_kmh`, `max_height_m`, `drop_m`, `inversions`, `duration_s`,
  `g_force`). Migratie-script voor bestaande `dark_ride` → split in
  `story_ride` of coaster+`dark`.
- 🟢 **Scoring-refactor** — `src/shared/scoring.ts` herschrijven rond de vijf
  gedragsstaten. Pure `deriveBehavior(member, ride)` met de testtabel uit
  ADR-024 als unit-test-set. `parkMetrics` returnt 5 tellers per persoon.
- 🟢 **Wizard 2.0** — huidige `AddMemberWizard` vervangen. Stappen:
  naam+lengte → drietrap props (middenstaat "voor de groep") → intensiteit
  band (tap-to-fill op gradient) → hoogte plafond (tap-to-fill, range altijd
  [1, X]) → categorie-interesses. Geen summary. Abstracte ankers in de UI,
  voorbeelden-als-feedback uit geactiveerde parken.
- 🟢 **Ledenkaart 2.0** — `MemberCard` aligneren op het nieuwe model. Zelfde
  gradient-band voor intensiteit, plafond voor hoogte, drietrap voor props.
  De wizard en de kaart delen herbruikbare componenten.
- 🟡 **"Grens bijstellen voor overschrijven"-UX** — bij klik op een attractie
  in de feedback-zone eerst suggestie om de band te verschuiven, pas dan
  per-attractie-uitzondering. Vereist [ADR-013](adr/013-forceer-uitzondering-per-lid.md)
  her-introduceren in lichtere vorm (was Withdrawn).
- 🟡 **Begeleiding-haalbaarheid via 😰-tellingen** — implementatie van
  [ADR-021](adr/021-begeleiding-haalbaarheid.md), nu gevoed door de nieuwe
  gedragsstaten i.p.v. een aparte signaal-as.
- 🟡 **Verificatie-status voor uitsluitings-parameters (incl. tri-state props)** —
  uitvoering van "Datavertrouwen in de afleiding" in
  [ADR-024](adr/024-voorkeur-model-gedragsstaten.md). Centrale as: `verified:
  boolean` (enkel mens) op elke claim die een harde uitsluiting drijft; "onbekend"
  niet langer stil als "geen probleem". Werk:
  - **props → map** `PropKey → { value: boolean; verified: boolean; by?; evidence? }`
    (ontbrekende key = onbekend); `types.ts` + `data/schema.md` + migratie
    park-JSONs (legacy-array = alle-present/mens-geverifieerd).
  - **scoring-refactor** — alle `props`-iteraties in `scoring.ts` (`joy`,
    `deriveBehavior`, traces) naar map-lezen; predicaten `present`/`verifiedAbsent`/`unknown`.
  - **parkregels-optimisme fixen** — `lengthState`/`ageState`: ontbrekende
    `beg`/`zelf`/`max` resp. leeftijds-eisen niet meer als `"alleen"`/canDo
    behandelen maar als onbekend → marker. Eén "parkregels geverifieerd"-vlag per
    ride (cluster, want lengte+leeftijd komen samen uit de officiële park-bron).
  - **intensity / height_intensity** — elk een `verified`-vlag; ongeverifieerd of
    ontbrekend → marker waar het een ceiling raakt (subjectief oordeel, AI zwak).
  - **afleiding + UI** — onzekerheidsvlag náást de behavior-staat; schaarse marker
    met richting (waarschijnlijk-wel / -niet / geen-info), markerregel-tabel ADR-024.
  - **tag-agent** — [tools/park-curation.md](../tools/park-curation.md): claims
    gegrond op brontekst, `evidence` per claim, onthouden boven gokken; AI zet
    nooit `verified: true`.
  - **admin** — snelle mens-verifieer-knop (present / absent / onbekend, plus
    "parkregels gecheckt") in de categorize-view; de marker krimpt enkel naarmate
    mens-verificaties binnenkomen.
  - Migratie raakt veel leescode in `scoring.ts` — mechanisch maar breed; plannen
    samen met / na de lopende ADR-024-scoring-refactor. Het lengte/leeftijd-stuk
    kan een eigen ADR krijgen (raakt [ADR-003](adr/003-type-en-eigenschappen.md))
    als het groot wordt.
- 🟡 **Samen/deels/splits via doorsnedes** — implementatie van
  [ADR-022](adr/022-samen-en-splits-transparantie.md), gevoed door de
  niet-🙅 doorsnede over de groep.
- ⚪️ **Park-kennis vragen in de wizard** — "Welke parken ken je al?" zodat
  feedback-voorbeelden uit bekende parken komen. Bewust uit MVP — eerst de
  niveau-omschrijvingen scherp krijgen.
- ⚪️ **Favorieten-weging herzien** — open vraag uit
  [ADR-006](adr/006-ranken-op-plezier.md). Pas oppakken als ranking met het
  nieuwe model in gebruik te grof of te fijn aanvoelt.

### Voor publieke release

Werk dat moet landen vóór Magikal Kompas naar een breder publiek gaat. Niet
optioneel.

- 🟡 **Inclusiviteit & toegankelijkheid** — de tool gaat vandaag uit van
  "gemiddeld lichaam, geen beperkingen". Voor publicatie moet ze ook
  bruikbaar zijn voor:
  - **Tijdelijke aandoeningen**: hart, rug, zwangerschap, blessures, recent
    geopereerd. Veel parken hebben hier expliciete waarschuwingen of
    uitsluitingen; die zijn vandaag niet in het datamodel.
  - **Permanente beperkingen**: rolstoelgebruik (kan deze attractie / hoe
    instappen?), prikkelgevoeligheid (lawaai, fel licht, drukke wachtrij),
    sensorische beperkingen (slecht zien/horen), motorische beperkingen.
  - Raakt zowel **data-laag** als **voorkeur-laag**: mogelijk komt er een
    extra persoons-as naast wildheid/hoogte/categorie/props, of een
    parallelle "uitsluiting wegens beperking"-laag. Te bepalen.
  - Vereist een eigen ontwerpronde + ADR vóór bouw — dit is geen quick add.

### Feitelijke bronnen per attractie

Vandaag heeft elke ride `wikipedia_url?: string | null` (zie commits van
2026-06-20). Voor curator-werk in de Categorize-view is meer feitelijke
context welkom dan Wikipedia alleen biedt — vooral voor kleinere parken
(La Récré, Walibi Rhône-Alpes) waar NL/FR Wikipedia dun is.

- ⚪️ **Coasterpedia-URL per ride** — analoog veld `coasterpedia_url?: string | null`
  (tri-state: bevestigd / gezocht-niets-gevonden / nog niet gecheckt).
  coasterpedia.net heeft brede dekking voor coasters én flat rides, met een
  vrij vaste infobox (manufacturer, model, jaar, hoogte, snelheid). Te vullen
  via Sonnet-agents met dezelfde aanpak als de wikipedia_url-sweep.
- ⚪️ **RCDB-URL per ride** — alleen relevant voor coasters. Zit nu al
  ad-hoc in `sources` voor sommige rides; ofwel systematisch aanvullen daar,
  ofwel eigen veld `rcdb_url?: string | null`. Beslissing nodig: extra veld
  of `sources` herstructureren als getypeerde lijst.
- ⚪️ **Multi-park Wikipedia-sweep voor nulls** — de strikte validatie van
  de eerste sweep heeft een paar matches gemist (bv. "Space Shot (parcs Walibi)"
  voor Le Totem, "Boomerang (parcs Walibi)" voor Generator — handmatig hersteld
  op 2026-06-20). Een tweede pass die multi-park artikelen wel als match
  accepteert (zolang de specifieke ride er expliciet in genoemd wordt) levert
  vermoedelijk ~5-15 extra URLs over alle parken.

Beslispunt: nieuwe velden of `sources` herstructureren? Een typed `sources:
[{kind: "wikipedia"|"coasterpedia"|"rcdb"|"park"|"other", url, lang?}]` zou
de losse `wikipedia_url`/`coasterpedia_url`/`rcdb_url`-trits vervangen door
één veld, met `null`-marker per bron via een sentinel of een aparte
`checked: ["wikipedia", ...]`-lijst. Vraagt ADR voor de keuze.

### Voorkeur-model herzien (toekomst, na MVP-gebruik)

Items die in de praktijk bovenkomen en een eigen denkbeweging vragen.

- 🟡 **Types en categorieën opnieuw bekijken** — huidige 4 categorieën
  (water / story / shows / classic_fair) en 18 types blijken in de praktijk
  te grof. Doel-shape (geuit 2026-06-20 bij bouw van de intensity-categorize
  tool, [src/admin/IntensityView.tsx](../src/admin/IntensityView.tsx)):
  - ~6 stabiele top-level categorieën (kandidaten: thrill, family, kids,
    water, story/dark, shows/flat).
  - Per categorie meer sub-types dan vandaag, vooral de **echt-vs-kinder**-as:
    valtoren echt (Dalton Terror) vs kindervaltoren (Kikker); schommelschip
    echt vs kinderversie; analoog uitbreiden naar andere ride-families.
    Achtbaan-tiers (kiddie / family / thrill) bestaan al — dat patroon
    veralgemenen.
  - Andere kandidaat-splits die eerder opkwamen: `playground` als eigen
    categorie (niet onder classic_fair); "Molens / draaiers" als eigen
    cluster (carousel, teacups, wave_swinger, ferris_wheel, flat_spinner) —
    qua beleving anders dan een treintje.
  Waarom dringend genoeg om vast te leggen: te grove types produceren slechte
  default-intensity per ride en maken "wil je dit soort attracties" een lege
  vraag. Backwards-compat-pad: nieuwe sub-types via uitbreiding van TypeKey,
  deprecated alias houden voor lezen van oude park-JSONs (zoals
  `dark_ride` → `story_ride` al gedaan is).
  Volgorde-suggestie: eerst manufacturer/model invullen (curator-taak
  `task_55f8be0c` gespawnd op 2026-06-20) — die data toont waarschijnlijk
  vanzelf welke sub-types echt nodig zijn (Vekoma SLC ≠ Vekoma Junior
  Boomerang qua intensity).
- 🟡 **Park-keuze-ranking** — na de "scores voorlopig weghalen"-beweging
  staat de Parken-view nu met legacy `parkMetrics`. Wachten op duidelijkheid
  over wat een groep- of park-score moet betekenen.
- 🟡 **MagIkAl-park-ranking (groei-score)** — een aparte park-ranking die
  vooruitkijkt: hoeveel 🌱 (ride-zullen) tikken straks om naar 😍/🙂 als
  iedereen een jaar ouder is? Vraagstuk: groeps-ZULLEN unie ("één kind dat
  groeit telt") vs. intersectie ("alle kinderen groeien naartoe"), en hoe je
  dat combineert met huidige WILLEN. Hangt samen met de "in welk jaar peakt
  dit park voor dit gezin?"-vraag. Uit [ADR-025](adr/025-kunnen-willen-moeten-zullen.md)
  bewust uitgesteld.

### Onderhoud

- 🟡 **ADR-consolidatie** (geuit 2026-06-20) — alle ADRs herschrijven om ze
  te versimpelen en te consolideren. Bewust **gefaseerd**: eerst alle lopende
  WIP afwerken (o.a. de ADR-024 voorkeur-model-uitrol hierboven), dán de
  consolidatie — niet een bewegend doel opruimen. De ADR-set is organisch
  gegroeid met dichte supersede-/extend-ketens; de "Voorkeuren & ranking"-
  groep is de dichtste knoop (ADR-005 → gesuperseed door 024 → uitgebreid/
  herklassificeerd door 025, plus uitgedijde Datavertrouwen-sectie in 024).
  Eén geconsolideerde "voorkeur-model"-ADR kan daar ~3-4 documenten vervangen.
  In de tussentijd géén nieuwe losse ADRs proliferereren waar een bestaande
  bijgewerkt kan worden (sluit aan bij de CLAUDE.md-regel "bestaande ADRs
  bijwerken mag"). Hou ADR-uitbreidingen beknopt.
- 🟡 **Ubiquitous language scherpstellen** (geuit 2026-06-20) — de domeintaal
  over code/ADRs/docs/prompts heen één maken, met expliciet onderscheid
  modeltaal vs. UI-taal (UI mag complexiteit bewust afschermen). Extractie is
  gedaan en staat als **draft** in [docs/lexicon.md](lexicon.md): woordenschat
  langs 5 lagen, per term model-id + UI-label, plus 9 open synoniemclusters
  (C1–C9) als spar-agenda. **Bewust gepauzeerd tot de WIP af is**, zelfde
  fasering als de ADR-consolidatie hierboven. Hervatten: clusters rechttrekken
  (o.a. nog open: C1 persoon-woord "lid" vs "deelnemer", C3 `voorGroep` zit op
  twee plekken, C5 groei/ontgroeid = staat of signaal), dán vastleggen in
  lexicon.md + een dunne ADR-027 (lagenmodel + naamprincipes) en de docs
  rechttrekken (o.a. stale props-lijst in CLAUDE.md: `high`/`fast` weg, `scary`
  ontbreekt; canoniek = `wet, inversions, spins, swings, dark, scary`).

### Productafbakening

- ✅ **React-herbouw afronden** — klaar; zie [ADR-020](adr/020-frontend-en-admin-stack.md).
- ✅ **Wizard MVP (eerste poging)** — gebouwd en geleerd; vervangen door
  Wizard 2.0 op basis van [ADR-024](adr/024-voorkeur-model-gedragsstaten.md).
  De drietrap-stap op props blijft semantisch behouden; thrill 1-5 en slow
  1-3 vervallen.

## Afgesloten model-vragen

De volgende open vragen uit eerdere iteraties zijn opgelost in
[ADR-024](adr/024-voorkeur-model-gedragsstaten.md) en zijn dus niet meer
"open":

- ~~Spinning_coaster als prop-variant, niet als apart type~~ — `spinning_coaster`
  blijft als type bestaan (wereld-laag); de voorkeur-laag werkt via wildheid +
  `spins`-prop, los van het type. Geen actie nodig.
- ~~Water als nat-ladder + PvP apart~~ — `water_ride` en `water_battle` blijven
  als types; nat-ladder wordt impliciet via `wet`-prop drietrap en wildheid.
  Geen aparte PvP-prop nodig.
- ~~Top_spin hoort bij inversions, niet bij hoog~~ — er is geen "hoog"- of
  "inversies"-ladder meer als persoons-as. Wildheid en hoogte zijn de
  intensiteits-assen; `inversions` blijft een drietrap-prop. Top_spin krijgt
  wildheid 4-5 en `inversions: true` op de attractie-tag.
- ~~Voorkeur-model: ladders + losse types?~~ — beslecht door ADR-024:
  wildheid + hoogte als intensiteits-assen, categorie-interesses voor blinde
  vlekken, props als drietrap. Geen apart "ladder vs type"-debat meer.
