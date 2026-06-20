# 25. Park-aggregaten als vier werkwoorden: KUNNEN · WILLEN · MOETEN · ZULLEN

- Status: Proposed
- Groep: Voorkeuren & ranking
- Supersedes/raakt: [ADR-024](024-voorkeur-model-gedragsstaten.md) (gedragsstaten — uitgebreid met 🥱 saai-staat, 🌱/🍂 herklassificeerd als zesde "parkregels"-staat, MOETEN-uitsplitsing), [ADR-003](003-type-en-eigenschappen.md) (types & categorieën — expliciet als aparte assen), [ADR-006](006-ranken-op-plezier.md) (rang-formules — vervangen door verb-gebaseerde tellers)

## Context

ADR-024 introduceerde vier gedragsstaten (😍 / 🙂 / 😰 / 🙅) plus twee signalen
(🌱 / 🍂) en een park-score `3 × 😍 + 1 × 🙂 − 1 × 😰`. Bij gebruik tegen echte
data en bij park-vergelijking kwamen vier scheuren bovendrijven:

1. **Eén "onder-band"-staat dekt twee gevoelens.** Vandaag valt zowel "neutraal
   akkoord" als "té saai voor mij, maar OK voor mijn zusje" in 🙂. Dat zijn
   verschillende deelnames: bij neutraal-akkoord is er geen kost, bij
   saai-opoffering wel.
2. **😰 wordt ten onrechte altijd als kost gerekend.** Als jij angstig bent voor
   de Drop Tower maar je broer kan beneden wachten met papa, kost dat niets —
   jullie splitsen. Pas als jij dé enige beschikbare begeleider bent en
   noodzakelijk-aanwezig moet zijn, wordt 😰 een echte kost.
3. **🌱 en 🍂 zijn parkregels, geen losse signalen.** Ze zijn niet "naast" een
   gedragsstaat — ze zijn een gedragsstaat: "je mag volgens de regels niet op
   deze attractie". Hun nuance is *toekomst* (groei je er nog naartoe of ben
   je er uit gegroeid?), niet *parallelle deelname*.
4. **Categorieën en types lopen door elkaar.** `categoryInterests` uit ADR-024
   gebruikt vier waarden (water/story/shows/classic_fair) terwijl er ~18
   TypeKeys zijn. Wizard-keuze ("waar kom je voor?") en data-classificatie
   ("welk soort rit is dit?") zijn fundamenteel verschillende assen.

## Decision

### Zes gedragsstaten (uitbreiding én herklassificatie t.o.v. ADR-024)

| Staat | Betekenis | Voorrang |
|---|---|---|
| 🌱 zullen-binnenkort | "parkregels laten niet toe — maar groeit er naartoe" | parkregels eerst |
| 🍂 ontgroeid | "parkregels laten niet meer toe — definitief voorbij" | parkregels eerst |
| 🙅 nooit | "voorkeur sluit uit — boven plafond, prop-nooit, of forceer-uitzondering" | voorkeur |
| 🥱 saai | "te saai voor mij — onder band-min" | voorkeur |
| 🙂 akkoord | "kan mee zonder mening" | voorkeur |
| 😍 willen | "hiervoor kom ik" | voorkeur |
| 😰 te-hevig | "boven mijn keuze, té intens" | voorkeur |

Belangrijk: 🌱 en 🍂 zijn niet langer "signalen naast een staat" maar
**volwaardige zesde staat** (met twee flavors). Ze winnen van de
voorkeur-afleiding: als de regels de persoon uitsluiten, doet de
voorkeur-staat er voor *deze rit* niet toe. We bewaren wel het toekomst-
versus-verleden-onderscheid omdat dat de hele waarde is van de aparte
markering.

😍 blijft één laag (geen ranking binnen 😍 voor nu).

### Persoons-as: saai-grens valt samen met band-min

We voegen 🥱 toe als staat zonder een aparte saai-grens-as in te voeren:
**`intensity < band.min` → 🥱**. De bestaande `intensityBand: [min, max]`
uit ADR-024 levert dus zowel de saai-grens (onderkant) als de
té-hevig-grens (bovenkant). Symmetrisch en uitlegbaar zonder extra
schuifregelaar.

Afleidingsvolgorde per ride per persoon:

```
1. parkregels (lengte/leeftijd):
     onder min-lengte/min-leeftijd én groei mogelijk          → 🌱
     boven max-lengte/max-leeftijd (te oud, te lang)          → 🍂
2. voorkeur (alleen als parkregels OK):
     intensity > intensityCeiling, OF prop = nooit            → 🙅
     intensity > band.max                                     → 😰
     intensity < band.min                                     → 🥱
     intensity in band ÉN categorie matcht                    → 😍   ← AND (beide vereist)
     intensity in band, categorie matcht niet                 → 🙂
```

**Edge-cases voor 😍 (AND-logica):**

- `band == null`: AND kan niet evalueren → catMatch-alleen geeft nooit 😍; valt door naar onderstaande
  regels (😰 als ceiling gezet, anders 🙂).
- `intensity == null` op de attractie: zelfde fallback.
- catMatch + boven band (`i > band.max`): niet intrinsiek → 😰 via de boven-band-regel.
- catMatch + onder band (`i < band.min`): niet intrinsiek → 🥱.
- in-band + geen catMatch: niet intrinsiek → 🙂.

### Vier park-aggregaten als werkwoorden

Park-niveau-rapportering gebeurt voortaan in vier verb-tellers, ontleend aan
de Nederlandse modale werkwoorden. **De definities zijn cumulatief**: WILLEN
en MOETEN vooronderstellen KUNNEN; ZULLEN staat ernaast.

| Verb | Per persoon |
|---|---|
| **KUNNEN** | # rides in {🥱, 🙂, 😍, 😰} — dus *niet* 🙅, *niet* 🌱, *niet* 🍂. Parkregels-staten sluiten KUNNEN uit (je mag niet, dus je kan niet vandaag). |
| **WILLEN** | # rides = 😍 én KUNNEN (parkregels-uitsluiting blokkeert WILLEN ook al wil je het — "willen kunnen" hangt samen). |
| **MOETEN** | twee getallen, zie hieronder. Per definitie binnen KUNNEN. |
| **ZULLEN** | # rides = 🌱. Alleen "binnenkort wel" — 🍂 telt hier niet (ontgroeid is geen toekomst). |

**Voor de groep:**

| Verb | Groeps-definitie |
|---|---|
| **KUNNEN** | intersectie — # rides waar *iedereen* in {🥱, 🙂, 😍, 😰} zit |
| **WILLEN** | # rides waar *minstens N leden* 😍 zijn én niemand de rit uitsluit (🙅 / 🌱 / 🍂) |
| **MOETEN** | som van persoons-MOETEN over de groep (twee getallen blijven gescheiden) |
| **ZULLEN** | *open vraag* — uitgesteld, zie open vragen |

### MOETEN: twee getallen, géén gewogen totaal

MOETEN wordt expliciet **niet** als één scalair samengevat:

```
moeten_uit_saai  = # rides waar persoon = 🥱 én noodzakelijk-aanwezig
moeten_uit_wild  = # rides waar persoon = 😰 én noodzakelijk-aanwezig
```

**Noodzakelijk-aanwezig** = de persoon kan niet weg uit deze rit zonder dat
de groep eronder lijdt — typisch: de enige beschikbare volwassen begeleider
voor iemand die wél naartoe wil. Heuristiek:

- Als de rit één begeleider vraagt en minstens één volwassene in de groep
  is niet 😰 én niet 🥱 voor deze rit → die volwassene gaat, niemand is
  noodzakelijk-aanwezig (geen MOETEN-load).
- Als alle beschikbare volwassenen 😰 zijn → één van hen wordt
  noodzakelijk-aanwezig; die telt voor `moeten_uit_wild`.
- Als alle beschikbare volwassenen 🥱 zijn → één van hen wordt
  noodzakelijk-aanwezig; die telt voor `moeten_uit_saai`.
- Voor rits met meerdere begeleiders nodig (uitzonderlijk): zelfde logica,
  meerdere personen tegelijk noodzakelijk-aanwezig.

Beide getallen worden naast elkaar gerapporteerd. Geen gewicht, geen som tot
één score. Reden: ze meten verschillende soorten kost (angst-opoffering ≠
verveling-opoffering), en gebruikers moeten zelf zien welke kost zwaarder
weegt voor hun gezin.

Visualisatie-gevolg in de behavior-balk: 🥱- en 😰-segmenten krijgen een
visueel onderscheid tussen *vrijwillig opofferbaar* (vlakke kleur) en
*gedwongen-aanwezig* (gestreept patroon).

### Types ≠ categorieën: drie aparte assen, met afleiding

| As | Granulariteit | Gebruik | Locatie | Afleidbaar uit |
|---|---|---|---|---|
| **Model** (optioneel) | identiek voor exacte dubbels | "Cobra ≈ Boomerang ≈ Generator" koppelen tussen parken | `model?: string` op Ride | — (data-input) |
| **Manufacturer** (optioneel) | fabrikant-naam | filteren / linken op fabrikant | `manufacturer?: string` op Ride | (vaak deel van model-id) |
| **TypeKey** | fijn (~30+, zie [ADR-003](003-type-en-eigenschappen.md)) | data-classificatie, scoring, tag-agent | `type` op Ride | model (waar beschikbaar) |
| **Category** | grof (6 gevoel-buckets) | wizard-input "waar kom je voor?" | **afgeleid** — geen veld op Ride | **TypeKey via `categoryOf(type)`-mapping** |

**Belangrijk: Category is afleidbaar uit TypeKey, niet per-ride opgeslagen.**

Reden: als elke fijne TypeKey eenduidig in één gevoel-categorie past, voegt
een aparte `category`-veld op de ride niets toe — het zou alleen drift
introduceren tussen `type` en `category` en migratie verzwaren. Eén
`categoryOf(type): Category`-functie in code is de waarheid.

**Categorie-definities (semantiek per bucket)**

| Code-key | UI-werknaam | Hoofdgevoel | Wel | Niet |
|---|---|---|---|---|
| `thrill` | Buikkriebels | val/snelheid/zwaai die de buik laat meekomen, adrenaline-piek | alle coasters · valtorens · schommelschepen · zweefmolens · zwaaipendulums · **top-spins** (adrenaline-rijk ondanks rotatie) | passief rondtollen (→ spin); langzaam-draaiend genoegen (→ savor) |
| `spin` | Doldraaien | rotatie als hoofd-ervaring waar adrenaline laag is en duizel-gevoel hoog | theekopjes · klassieke flat-spinners · octopus · tilt-a-whirl | top-spin (thrill primair); spinning coasters (coaster-thrill primair); klassieke carrousels (te traag, geen duizeling) |
| `immerse` | Andere wereld | onderdompelen in verhaal of sfeer, hoofd-ervaring is "ik stap ergens in" | story-rides · madhouses · verhaal-walk-throughs met sfeer | passieve walk-throughs zonder verhaal (→ savor); schiet-rits met story-overlay (→ compete) |
| `splash` | Spetters | nat worden, frisheid, lachen om elkaar — kracht zit in het natte | wildwaterbanen · raften · supersplash · water-coasters (water primair) | water-PvP (→ compete, het scoren is hoofdzaak); pedalo-boten (→ drive, sturen primair) |
| `compete` | Mikken | wedijver of scoren — jij wint, jij raakt, jij gaat sneller | arcades · karting · schiet-rits · splash-battles | bumper cars (geen score, → drive); pretend-driving (→ drive) |
| `drive` | Besturen | controle over voertuig zonder wedstrijd — rolspelen, fake-control, eigen aansturen | bumper cars · pretend-rijden · pedalo's · kiddie-track-rides (wiebel op rail, voor de kid alsof) | karting (race-element → compete); klassieke carousel (groep-moment → savor) |
| `romp` | Ravotten | jij beweegt zelf, lichaam in actie — klauteren, glijden, springen | speeltuinen · funhouses · ballenbaden · klim-walk-throughs | passief decor (→ savor); pedal-rits (→ drive) |
| `savor` | Slenteren | passief meegevoerd of klassiek-kalm — observeren, genieten, klein groep-moment | carousels (groep-moment) · reuzenrad · transport-treintjes · gondoletta · walkthrough-decor (sprookjesbos, Anton Pieckplein) · shows | kiddie-track-rides (kid-solo, → drive); funhouses met klauter-element (→ romp) |

**Definitieve `categoryOf`-mapping** — *UI-werknamen, code-keys vast*:

| Categorie (UI-werknaam) | Code-key | TypeKeys |
|---|---|---|
| **Buikkriebels** | `thrill` | alle coasters · `drop_tower` · `kiddie_drop` · `pirate_ship` · `frisbee_pendulum` · `top_spin` · `star_flyer` · `wave_swinger` · `flying_chairs` · `flying_bicycles` · `balloon_ride` |
| **Doldraaien** | `spin` | `teacups` · `flat_spinner` · `octopus` · `tilt_a_whirl` |
| **Andere wereld** | `immerse` | `story_ride` · `madhouse` |
| **Spetters** | `splash` | `log_flume` · `rapids` · `water_coaster` |
| **Mikken** | `compete` | `arcade` · `karting` · `shoot_ride` · `splash_battle` |
| **Besturen** | `drive` | `kids_drive` · `bumper_cars` · `pedal_boat` · `pedal_ride` · `kiddie_track_ride` |
| **Ravotten** | `romp` | `playground` · `funhouse` · `ball_pit` · `walkthrough_climb` |
| **Slenteren** | `savor` | `carousel` · `ferris_wheel` · `transport_train` · `slow_boat` · `show` · `walkthrough_decor` · `park_decor` · `animal_ride` |

**Edge-cases die de mapping oplost:**

- **`water_coaster`** valt tussen Buikkriebels en Spetters. Toewijzing:
  primair Spetters (het natte is de hoofd-ervaring); intensity-as
  differentieert de pittiger varianten binnen die bucket.
- **`madhouse`** vs **`top_spin`**: identieke mechaniek, ander gevoel
  (Andere wereld vs. Buikkriebels). Vraagt expliciet onderscheid op
  type-niveau bij tagging — `top_spin` is een pure adrenaline-flatride,
  `madhouse` is een verhaal-in-een-ruimte met top-spin-mechaniek.
- **`spinning_coaster`** valt onder **Buikkriebels** (coaster-thrill is
  hoofd-ervaring), niet onder Doldraaien. De `nausea`-prop (zie
  ADR-003-uitbreiding) filtert per persoon wie misselijk wordt — die wint
  van de categorie-match en levert 🙅.
- **K3 roller skater vs. koffiekopjes** illustreren de Doldraaien-splitsing:
  beide lage intensity (1-2), beide voor jonge kinderen, maar
  **verschillende categorieën** (Buikkriebels vs. Doldraaien). Een kind kan
  voor één van beide kiezen zonder de andere automatisch ook 😍 te krijgen.
- **Carousel vs. kiddie_track_ride** (Eendjes/Konijntjes): mechanisch
  vergelijkbaar (zit op iets dat over een rail beweegt), categorie
  verschillend. Carousel = **Slenteren** want groep-moment (ouder kan
  meegaan op buurtpaard, adult-acceptabel). Kiddie_track_ride = **Besturen**
  want solo-kid op het ding met pretend-control — de kid kiest ervoor om
  "te rijden", niet om passief te kijken.
- **Karting vs. bumper_cars**: beide besturen, maar karting heeft
  race-element (wie eerst). Karting → Mikken (compete). Bumper_cars → Besturen
  (drive) — botsen is niet competitief in de score-zin.
- **`balloon_ride`** (Balloonrace, Bumballoon) telt onder **Buikkriebels**
  omdat het gevoel "omhoog gaan + lichte zwaai" dichter ligt bij
  zweef-thrill dan bij klassiek-draaien — intensity-as differentieert
  kid-versies van grote.

**Beslissingen vastgelegd in deze ADR:**

- Categorie-set: **8 gevoel-buckets** met code-keys `thrill` · `spin` · `immerse` · `splash` · `compete` · `drive` · `romp` · `savor`
- UI-werknamen (Buikkriebels/Doldraaien/...) blijven open voor iteratie via i18n
- Geen `Ride.category`-veld; afleiding via `categoryOf(type)` in code
- `MemberPrefs.categoryInterests` blijft als wizard-input — gebruiker kiest gevoel-buckets, scoring matcht via `categoryOf(ride.type) ∈ member.categoryInterests`
- Bij type-uitbreiding wordt de mapping bijgewerkt in één centrale functie, niet in alle park-JSONs
- Prop `vertigo` wordt hernoemd naar `nausea` om naam-overlap met categorie-key te vermijden — `nausea: nooit` = "ik word misselijk van rondtollen, sluit dit uit"

### Vervalt uit ADR-024

- De gewogen park-score `3 × 😍 + 1 × 🙂 − 1 × 😰` als primaire ranking-formule. Vervangen door de vier verb-tellers, met "WILLEN" als primaire sorteersleutel en MOETEN als kosten-tegenwicht (twee aparte getallen, niet gewogen).
- 🌱 en 🍂 als "signalen naast staten". Ze zijn nu zelf een zesde gedragsstaat (met twee flavors) en hebben voorrang op voorkeur-afleiding.

### Hangt later op (niet in deze ADR)

- Hoe de wizard categorieën als keuze-eenheid presenteert (3-buckets, sterren, drag-rank — open UI-vraag).
- "Forced top-N" / kalibratie tegen kinderen die alles ❤️ klikken (apart probleem, apart ADR mogelijk).
- Park-vergelijking op `/parken`: lens-switcher "voor de groep" / "voor [lid]", normaliseringen, fairness-spread.
- Groeps-ZULLEN-aggregatie en MagIkAl-park-ranking (toekomst-score). Zie backlog.

## Consequences

### Positief

- **Uitlegbaarheid op park-detail wordt scherper.** "Jullie WILLEN 23 rides, KUNNEN er 30, MOETEN 4×-saai en 2×-wild" leest als een zin in plaats van een dashboard-getal.
- **Saai en hevig krijgen symmetrische behandeling.** De band heeft nu echt twee zinvolle wanden — zonder extra invoer-as.
- **MOETEN reflecteert echte kost.** Vrijwillig 😰 is niet langer een straf-factor; alleen noodzakelijk-aanwezig telt.
- **Parkregels winnen consistent.** 🌱/🍂 als zesde staat sluiten KUNNEN/WILLEN/MOETEN uit; alleen ZULLEN (alleen 🌱) overleeft het regel-filter. Geen tegenspraak meer tussen "wil dit" en "mag dit niet".
- **Categorieën-herziening kan los van TypeKey-impact.** Geen breaking change in park-JSONs.

### Negatief / risico

- **Zesde staat verhoogt complexiteit in afleiding en in de UI-balk.** Mitigatie: afleidingsvolgorde is strikt (parkregels eerst), en de balk toont 🌱/🍂 als aparte segmenten zoals nu al gebeurt.
- **"Noodzakelijk-aanwezig" vereist begeleiding-grafiek per ride per groep.** Bestaande ADR-021-logica wordt voeding; de vrijwillig/gedwongen-splitsing voor 😰 is nieuw.
- **Categorie-herdefinitie raakt bestaande `categoryInterests` in opgeslagen `MemberPrefs`.** Migratie nodig: oude waarden mappen op nieuwe set, of resetten met "vul opnieuw in"-banner. Beslissing uitgesteld tot de categorie-set vastligt.

### Open vragen

- **Groeps-ZULLEN-aggregatie**: unie ("één kind 🌱 telt") of intersectie ("alle 🌱")? Uitgesteld — past in de MagIkAl-park-ranking-vraag, opgenomen in backlog.
- **Noodzakelijk-aanwezig override**: de heuristiek bovenaan dekt het standaardgeval, maar gezinnen met aparte voorkeuren (papa gaat altijd mee op coasters omdat hij het leuk vindt; mama doet alles met de jongste) zullen overrides willen. Per-rit override later, lid-niveau "ik begeleid sowieso wat ik mag" eventueel ook.
- **Hoe weergeven we op `/parken` vier verb-tellers compact zonder de park-cards te bloaten?** Open UI-vraag, na implementatie van park-detail.
