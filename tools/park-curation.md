# Park-curation-agent — volledige curatie (één run per park)

Volledige curatie-agent voor één park: vult feiten + lengte/leeftijd
aan, signaleert verdwenen attracties als verwijderings-voorstel, voegt
nieuwe attracties toe, en stelt per attractie één **admin-preview-foto**
voor (rechten NIET gecheckt, puur voor herkenning in de admin-UI — niet
voor publicatie).

## Doel

Voor het opgegeven park (`data/parks/<slug>.json`):

1. Alle bestaande attracties verifiëren tegen de officiële parksite.
2. Ontbrekende attracties toevoegen.
3. Verdwenen attracties **voorstellen om te verwijderen** in een aparte
   sectie van je output (NIET zelf schrappen, NIET als JSON-flag markeren).
4. Per attractie: feiten compleet maken — `type`, `props`, `intensity`,
   `height_intensity`, `oms`, lengtes, leeftijden, `park_url`, `sources`.
5. Per attractie: één `admin_preview`-foto-URL voorstellen voor de admin-UI.
   Rechten worden **niet** gecheckt; veld is alleen voor herkenning.

Smaak (leuk/saai/lang aanschuiven) hoort hier NIET thuis — alleen feiten.

## Input

- `data/parks/<slug>.json` als startpunt en bron-van-waarheid voor velden die
  al `tag_source: "admin"` hebben.
- `meta.site` als startpunt voor de parksite.

## Werkwijze

### 1. Lijst kruisen tegen de parksite

- Haal de actuele attractielijst op via `meta.site` (overzichtspagina zoals
  `/attractions`, of via parkkaart-pagina als die geen aparte lijst heeft).
- Match op naam (case-insensitive, accent-tolerant, herken NL/FR/EN-varianten
  zoals "Aire de Jeux X" ↔ "Playground X").
- Voor elke JSON-entry die **niet** op de site staat: verifieer op één tweede
  bron (parknieuws, lokale pers, themepark-tracker zoals Coasterpedia/RCDB).
  Neem die op in je output-sectie **"Verwijderen-voorstel"** met:
  - attractienaam, sluitingsjaar indien gekend, bron-URL, korte motivatie.
  - Geen verschil meer tussen "bevestigd" en "twijfel" in de JSON — twijfel
    vermeld je in de motivatie.
- **Verwijder NOOIT zelf een entry uit de JSON.** Admin doet de feitelijke
  verwijdering nadat hij/zij je voorstel reviewed heeft.
- Vroeger gebruikten we `closed`/`closed_year`/`closed_source_url`/`closed_verify`-
  velden in de JSON; die zijn vervallen (zie [ADR-023](../docs/adr/023-permanent-gesloten-attracties.md),
  Withdrawn). Schrijf deze velden NIET terug naar JSON.

### 2. Nieuwe attracties toevoegen

Voor elke attractie op de parksite die niet in de JSON staat: voeg een nieuwe
ride toe met dezelfde veldvolgorde als bestaande entries. Vul alles in wat
objectief af te leiden valt. Laat `beg`/`zelf`/`max`/`min_age_*` op `null`
als de parksite ze niet expliciet noemt — admin vult dat aan. `tag_source: "web"`,
`tag_confidence` volgens de regels onder.

### 3. Per ride: feitelijke velden

Verplicht voor elke ride (bestaand of nieuw), behalve waar de bestaande
waarde van een admin komt (`tag_source: "admin"`) — die nooit overschrijven:

- `type` — exact één uit de types-lijst hieronder (en in [data/schema.md](../data/schema.md)).
  Kies het dominante bewegingsmodel, niet de thematisatie.
- `props` — subset van `wet`, `inversions`, `spins`, `swings`, `dark`, `scary`,
  `nausea`, `extra_paid`. `high` en `fast` zijn verwijderd (ADR-024).
- `tag_source` — `web` voor wat jij invult; bestaande `admin` blijft staan.
- `tag_confidence` — zie regels hieronder. `verified` NOOIT zelf zetten; alleen admin.
- `sources` — **lijst** (`string[]`) van URL-strings die de tagging onderbouwen
  (parksite, RCDB, fanwiki, lokale pers). Vervangt het vroegere `source_url`-
  veld (één string). Mag leeg zijn als je echt niets vond; één bron is de
  norm, meerdere bij feiten die over meer pagina's verspreid liggen.
- `park_url` — directe link naar de officiële attractiepagina. **Apart** van
  `sources`; zie [ADR-014](../docs/adr/014-visuele-en-bron-velden.md).
- `oms` — korte NL-omschrijving (max 1 zin). Niet overschrijven als er al
  een niet-lege `oms` staat.

#### Verplichte intensiteits-tags (ADR-024)

Elke attractie krijgt twee verplichte numerieke tags. Leid ze niet af uit naam
of thema; gebruik feitelijke gegevens (snelheid, hoogte, type) plus de ankers.

**`intensity` (1–5) — beleefde intensiteit**

| Waarde | Anker | Wat het tagt |
|--------|-------|--------------|
| 1 | rustig deinen | passieve beweging, geen schrik-trigger |
| 2 | lichte deining | beweegt mee, herkenbaar veilig |
| 3 | stevige beuk | echte rit, familie-niveau |
| 4 | hou je vast | thrill, hartje slaat over |
| 5 | niet voor watjes | extreme G's, gillen |

**`height_intensity` (1–5) — beleefde hoogte (niet meters)**

| Waarde | Anker | Voorbeeld | Indicatieve hoogte |
|--------|-------|-----------|-------------------|
| 1 | voeten op de grond | draaimolen, treintje | 0 m |
| 2 | omhoog, maar je voelt je vast | Bumballoon, Dolle Busrit | 0–5 m |
| 3 | je ziet de hoogte | K3-rollercoaster, Wienerwalz | 5–10 m |
| 4 | hoogte is deel van de thrill | Heidi the Ride, Supersplash | 10–50 m |
| 5 | hoogte ís de thrill | Dalton Terror, Nachtwachtflyer | > 50 m |

Let op: `height_intensity` is beleving, niet meters. Een 45 m gesloten gondel
(Pagode) kan `height_intensity: 3` krijgen; een open 30 m coaster kan 4 zijn.

#### Optionele data-velden

Vul in als je betrouwbare bronnen vindt (parksite, RCDB, fabrikant):

- `top_speed_kmh` — maximale snelheid in km/h
- `max_height_m` — maximale hoogte in meters (feit, FYI op kaartje)
- `drop_m` — grootste val in meters
- `inversions_count` — exact aantal omkeringen (FYI; prop `inversions` blijft
  de quick-filter)
- `duration_s` — ritduur in seconden
- `g_force` — piekbelasting in G

### 4. Per ride: lengte- en leeftijdsvelden

Alleen invullen waar de huidige waarde `null` is OF de entry nieuw is. Bestaande
waarden NOOIT overschrijven — admin heeft die mogelijk geverifieerd ter plaatse.

- `beg`, `zelf`, `max` in cm; `0` = geen eis, `null` = onbekend.
- `min_age_beg`, `min_age_zelf`, `max_age` in jaar of `null`
  (zie [ADR-016](../docs/adr/016-leeftijdsregels-en-ontbrekende-data.md)).
- Alleen invullen als de parksite expliciet een drempel noemt. Bij twijfel:
  `null` laten, en de hele ride op `tag_confidence: low` zetten.

### 5. Per ride: admin-preview-foto (rechten NIET gecheckt)

Voor elke attractie één URL voorstellen die de admin helpt herkennen:

```json
"admin_preview": {
  "url": "https://www.walibi.fr/sites/default/files/.../mystic-hero.jpg",
  "source_page": "https://www.walibi.fr/fr/decouvrir-le-parc/attractions/sensations/mystic",
  "note": "rechten-niet-gecheckt — alleen voor herkenning in admin-UI, NIET publiceren"
}
```

Regels:

- **Voorkeur 1**: hero-foto van de officiële attractiepagina (parksite).
- **Voorkeur 2**: foto die het rij-voertuig of de duidelijke scène toont,
  vindbaar via Google Afbeeldingen.
- ALLEEN de externe URL invullen — niets downloaden naar de repo.
- Het `note`-veld is verplicht en moet **letterlijk** met
  `"rechten-niet-gecheckt"` beginnen, zodat code/UI dit veld automatisch kan
  herkennen en uit publieke renders kan weren.
- Dit veld is fundamenteel **anders** dan `image` (zie
  [ADR-014](../docs/adr/014-visuele-en-bron-velden.md)): `image` is
  CC-gelicenseerd en publiek; `admin_preview` is rechten-niet-gecheckt en
  blijft admin-only.

Voor attracties die je in het verwijder-voorstel zet: geen `admin_preview`
nodig.

### 6. Per ride: activity-entry bij wijzigingen

Voor elke ride die je daadwerkelijk wijzigt: push één entry vooraan in
`ride.activity` (zie [data/schema.md](../data/schema.md)). Cap = 3; oudste
rolt eruit.

```json
{
  "at": "2026-06-18T00:00:00Z",
  "by": "agent:web-v1",
  "changes": {
    "type": { "from": "family_coaster", "to": "thrill_coaster" },
    "props": { "from": ["high"], "to": ["high", "fast"] },
    "intensity": { "from": null, "to": 4 },
    "height_intensity": { "from": null, "to": 3 },
    "park_url": { "from": "", "to": "https://..." }
  }
}
```

Regels:

- `at`: ISO-8601 UTC datum van je run.
- `by`: `"agent:web-vN"` — vervang `vN` door je eigen versie.
- `changes`: alleen velden die echt anders zijn dan vóór. Hele oude waarde
  in `from`, hele nieuwe in `to` — ook voor arrays (zoals `props`, `sources`)
  en objecten (zoals `image`, `admin_preview`). `intensity` en
  `height_intensity` kunnen hier ook voorkomen.
- Géén verify-entries (`verified: true`). Dat is alleen voor admin via de
  ✓-knop in de UI.
- Wijzig je niets in een ride? Push dan ook niets.

## Regels voor zekerheid

- `high`  : expliciet bevestigd op een betrouwbare bron (parksite / RCDB e.d.).
- `med`   : sterk afgeleid uit beschrijving/foto's, niet letterlijk bevestigd.
- `low`   : gok op naam/thema; **markeer voor menselijke controle**.
- Laat bij twijfel `low` staan i.p.v. te raden met te veel zelfvertrouwen.

## Types-vocabulaire (ADR-003 + ADR-025)

Gebruik exact de types hieronder. Kies het dominante bewegingsmodel, niet de
thematisatie (een ruimteschip dat schommelt is `pirate_ship`).

Elke type valt eenduidig in één gevoel-categorie (afgeleid via `categoryOf()`
in code — nooit in de JSON opslaan):

| Type | Categorie | Toelichting |
|------|-----------|-------------|
| `wooden_coaster` | thrill | houten achtbaan |
| `family_coaster` | thrill | familie-coaster (geen special mechanic) |
| `kiddie_coaster` | thrill | kinderachtbaan |
| `thrill_coaster` | thrill | grote coaster zonder speciale mech |
| `launch_coaster` | thrill | LSM/LIM/hydraulic launch |
| `inverted_coaster` | thrill | Boomerang, SLC, wing coaster |
| `spinning_coaster` | thrill | spinnen als hoofd-mechanic |
| `water_coaster` | **splash** | coaster met natte finale (Vliegende Hollander, Pulsar) |
| `mine_train` | thrill | mijntrein-coaster |
| `alpine_coaster` | thrill | bobsled-glijbaan (Alpenrutsche) |
| `drop_tower` | thrill | grote valtoren |
| `kiddie_drop` | thrill | mini-valtoren |
| `pirate_ship` | thrill | schommelschip |
| `frisbee_pendulum` | thrill | giant frisbee / pendulum (Guitar Riff) |
| `top_spin` | **thrill** | pure flat top-spin (niet madhouse) — adrenaline-rijk |
| `tilt_a_whirl` | **spin** | schijfspinner (Orbiter, Fun Recorder) |
| `star_flyer` | thrill | hoge zweefmolen (Nachtwachtflyer, Wind Seekers) |
| `wave_swinger` | thrill | klassieke zweefmolen |
| `flying_chairs` | thrill | vliegende stoelen (Rode Baron, Stunt Flight) |
| `flying_bicycles` | thrill | vliegende fietsen (uniek type) |
| `balloon_ride` | thrill | ballonmolen omhoog (Bumballoon, Balloonrace) |
| `teacups` | **spin** | koffiekopjes |
| `flat_spinner` | **spin** | ronddraaier (El Toro, Spinning Vibe) |
| `octopus` | **spin** | octopus-spinner |
| `carousel` | savor | draaimolen |
| `ferris_wheel` | savor | reuzenrad |
| `story_ride` | immerse | belevingsrit (Droomvlucht, Symbolica, Bos van Plop) |
| `madhouse` | immerse | madhouse-rit (Villa Volta, Villa Fiasko, Houdini) |
| `log_flume` | splash | wildwaterbaan / log flume |
| `rapids` | splash | river rapids |
| `splash_battle` | **compete** | water-PvP (Wickie The Battle, Banana Battle) |
| `playground` | romp | speeltuin / klimrek |
| `funhouse` | romp | funhouse (spiegels, scheve vloeren) |
| `ball_pit` | romp | ballenbad |
| `walkthrough_climb` | romp | klim-doorloopattractie |
| `arcade` | compete | spelletjes / arcade |
| `karting` | compete | karting (Le Karting, Rijschool Suikerbuik) |
| `shoot_ride` | compete | schiet-rit (Challenge of Tutankhamon, Popcorn Revenge) |
| `kids_drive` | drive | kinderauto's / rijschool (geen karting-competitie) |
| `bumper_cars` | drive | autoscooter |
| `pedal_boat` | drive | waterfiets / pedaalboot |
| `pedal_ride` | drive | trapattractie (Horse Pedalo) |
| `kiddie_track_ride` | drive | kinderrailrit (Eendjes, Konijntjes) |
| `transport_train` | savor | treintje / monorail |
| `slow_boat` | savor | rustige boottocht (Gondoletta, Safari) |
| `show` | savor | show / bioscoop |
| `walkthrough_decor` | savor | doorloopattractie (Diorama, Sprookjesbos, Hampi) |
| `park_decor` | savor | park-icoon, geen echte rit (Holle Bolle Gijs) |
| `animal_ride` | savor | echte dieren-rit (Pony Ride) |

### Beslisregels voor lastige gevallen

- **`madhouse` vs `top_spin`**: madhouse = verhaal in een ruimte (Villa Volta, Villa Fiasko).
  Top_spin = pure flatride zonder verhaal (Sledge Hammer, Buzzsaw). Madhouse → immerse,
  top_spin → thrill (Doldraaien-categorie nee; Buikkriebels ja).
- **`story_ride` vs `shoot_ride`**: als de schiet-actie de hoofd-driver is → `shoot_ride`.
  Als het verhaal centraal staat en schieten een bonus is → `story_ride` of `story_ride`
  met `interactive`-overweging.
- **`water_coaster`**: coaster-mechaniek + natte finale (niet een pure log flume).
  Pulsar (Walibi BE), Vliegende Hollander (Efteling) zijn `water_coaster`.
- **`spinning_coaster`**: rolt mee als thrill (niet spin). K3 roller skater is `kiddie_coaster`
  (kindercoaster), niet `spinning_coaster`.
- **`balloon_ride`**: ballon die omhoog gaat (thrill-gevoel). Bumballoon, Balloonrace,
  Bloemenmolen zijn `balloon_ride`. Klassieke zweefmolen = `wave_swinger`.

### Prop-toelichting

- **`nausea`**: rondtollen als hoofd-ervaring (5+ sec continu) waarbij misselijkheid
  mogelijk is. Tagt: `teacups`, `flat_spinner`, `octopus`, `spinning_coaster`,
  `madhouse`, `top_spin`, `tilt_a_whirl`.
- **`extra_paid`**: attractie vraagt extra betaling bovenop entree (arcade-automaten,
  karting, foto-attracties). Niet: normale parkaantrekkingen.
- **`dark`**: in het donker (maar niet bewust eng). Vogel Rok, Revolution.
- **`scary`**: bewust eng, jump-scares, horror-thema. Spookslot, Popcorn Revenge.
- **`wet`**: je wordt nat (kleding). Niet: lichte watersprenkels.
- **`inversions`**: ride gaat ondersteboven (ook via inversions_count).
- **`spins`**: draait snel rond als extra element (bovenop normaal rijden).
- **`swings`**: schommelt significant (pirate_ship, wave_swinger).

`high` en `fast` zijn verwijderd (ADR-024) — gebruik `intensity` en `height_intensity`.

## Output

- Schrijf het bestand terug. Geldige JSON. Zelfde veldvolgorde als bestaande
  entries (`att`, `oms`, `beg`, `zelf`, `max`, `min_age_*`, `max_age`, `type`,
  `props`, `intensity`, `height_intensity`, `tag_*`, `sources`, `park_url`,
  `image?`, `admin_preview?`).
- `meta.updated` op vandaag zetten.
- `meta.tagging` updaten naar bv. `"web-vN (admin-review nodig voor low)"`.

Geen comments in de JSON. Sluit je antwoord af met een korte changelog:

- X attracties geverifieerd
- Y nieuwe attracties toegevoegd
- Voorstel om Z attracties te **verwijderen** (lijst — naam, sluitjaar
  indien gekend, bron, korte motivatie). Admin past de verwijdering toe.
- Attracties met `tag_confidence: low` (lijst, voor admin-review)
- Attracties zonder `admin_preview` (lijst — vlag de uitzonderingen
  expliciet)

Valideer je output optioneel tegen `data/park-schema.json`.

## Belangrijk

- Reproduceer geen auteursrechtelijke teksten of foto's; vat feitelijk samen.
  De `admin_preview`-URL is een verwijzing, geen kopie.
- Admin blijft eindredacteur. Twijfel = `low`, niet zelf raden met te veel
  zelfvertrouwen.
- Eigennamen (park, attractie) niet vertalen (zie [CLAUDE.md](../CLAUDE.md)).
- Stabiele Engelse keys voor `type` en `props`
  (zie [ADR-015](../docs/adr/015-meertalige-ui.md)).
- Velden waar `tag_source: "admin"` staat: NIET overschrijven. Alleen
  aanvullen waar de admin nog niets heeft ingevuld.
