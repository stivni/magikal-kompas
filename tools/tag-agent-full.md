# Tag-agent — volledige curatie (één run per park)

Bredere variant van [tag-agent.md](tag-agent.md): vult feiten + lengte/leeftijd
aan, markeert verdwenen attracties als gesloten, voegt nieuwe attracties toe,
en stelt per attractie één **admin-preview-foto** voor (rechten NIET gecheckt,
puur voor herkenning in de admin-UI — niet voor publicatie).

> ⚠️ Twee velden die deze prompt gebruikt — `closed*` en `admin_preview` —
> staan vandaag nog niet in [data/schema.md](../data/schema.md) en zijn niet
> in een ADR vastgelegd. Voer deze prompt pas uit nadat schema en ADR-014
> (of een nieuwe ADR) zijn bijgewerkt, anders breekt de validatie.

## Doel

Voor het opgegeven park (`data/parks/<slug>.json`):

1. Alle bestaande attracties verifiëren tegen de officiële parksite.
2. Ontbrekende attracties toevoegen.
3. Verdwenen attracties markeren als `closed` (niet schrappen).
4. Per (open) attractie: feiten compleet maken — `type`, `props`, `oms`,
   lengtes, leeftijden, `park_url`, `source_url`.
5. Per (open) attractie: één `admin_preview`-foto-URL voorstellen voor de
   admin-UI. Rechten worden **niet** gecheckt; veld is alleen voor herkenning.

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
  Dan:
  - **permanent gesloten, bevestigd** → `closed: true` + `closed_year`
    (indien gekend, anders `null`) + `closed_source_url`.
  - **onduidelijk** → `closed: "unknown"` + `closed_verify: true`. Admin
    bevestigt.
- Verwijder NOOIT zelf een entry. Markeren, niet schrappen — zodat eerder
  geverifieerde lengte/leeftijd-data niet verloren gaat.

### 2. Nieuwe attracties toevoegen

Voor elke attractie op de parksite die niet in de JSON staat: voeg een nieuwe
ride toe met dezelfde veldvolgorde als bestaande entries. Vul alles in wat
objectief af te leiden valt. Laat `beg`/`zelf`/`max`/`min_age_*` op `null`
als de parksite ze niet expliciet noemt — admin vult dat aan. `tag_source: "web"`,
`tag_confidence` volgens de regels onder.

### 3. Per ride: feitelijke velden

Verplicht voor elke open ride (bestaand of nieuw), behalve waar de bestaande
waarde van een admin komt (`tag_source: "admin"`) — die nooit overschrijven:

- `type` — exact één uit de types-lijst in [data/schema.md](../data/schema.md).
  Kies het dominante bewegingsmodel, niet de thematisatie.
- `props` — subset van `wet`, `high`, `fast`, `inversions`, `spins`, `swings`, `dark`.
- `tag_source` — `web` voor wat jij invult; bestaande `admin` blijft staan.
- `tag_confidence` — per regels in [tag-agent.md](tag-agent.md). `verified`
  NOOIT zelf zetten; alleen admin.
- `source_url` — bron van de tagging (parksite, RCDB, fanwiki).
- `park_url` — directe link naar de officiële attractiepagina. **Apart** van
  `source_url`; zie [ADR-014](../docs/adr/014-visuele-en-bron-velden.md).
- `oms` — korte NL-omschrijving (max 1 zin). Niet overschrijven als er al
  een niet-lege `oms` staat.

### 4. Per ride: lengte- en leeftijdsvelden

Alleen invullen waar de huidige waarde `null` is OF de entry nieuw is. Bestaande
waarden NOOIT overschrijven — admin heeft die mogelijk geverifieerd ter plaatse.

- `beg`, `zelf`, `max` in cm; `0` = geen eis, `null` = onbekend.
- `min_age_beg`, `min_age_zelf`, `max_age` in jaar of `null`
  (zie [ADR-016](../docs/adr/016-leeftijdsregels-en-ontbrekende-data.md)).
- Alleen invullen als de parksite expliciet een drempel noemt. Bij twijfel:
  `null` laten, en de hele ride op `tag_confidence: low` zetten.

### 5. Per ride: closed-vlag (bij verdwenen attracties)

```json
{
  "att": "Tam Tam Aventure",
  "closed": true,
  "closed_year": 2024,
  "closed_source_url": "https://...",
  "closed_verify": false,
  "type": "...",          // bestaande feiten laten staan
  "props": [...],
  // ...
}
```

- `closed`: `true` (zeker), `"unknown"` (twijfel), weg of `false` (open).
- `closed_year`: jaar van sluiting of `null`.
- `closed_source_url`: link naar bron die de sluiting bevestigt. Bij
  `closed: "unknown"` mag dit leeg zijn.
- `closed_verify`: `true` als admin het nog moet checken; standaard bij
  `closed: "unknown"`.

De UI zal gesloten attracties grijs/doorhalen tonen (admin-UI én publieke UI),
zodat ze in oudere bezoekverslagen herkenbaar blijven.

### 6. Per ride: admin-preview-foto (rechten NIET gecheckt)

Voor elke **open** attractie één URL voorstellen die de admin helpt herkennen:

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

Voor gesloten attracties geen `admin_preview` invullen.

## Output

- Schrijf het bestand terug. Geldige JSON. Zelfde veldvolgorde als bestaande
  entries (`att`, `oms`, `beg`, `zelf`, `max`, `min_age_*`, `max_age`, `type`,
  `props`, `tag_*`, `source_url`, `park_url`, `image?`, `admin_preview?`,
  `closed*?`).
- `meta.updated` op vandaag zetten.
- `meta.tagging` updaten naar bv. `"web-vN (admin-review nodig voor low/unknown)"`.

Geen comments in de JSON. Sluit je antwoord af met een korte changelog:

- X attracties geverifieerd
- Y nieuwe attracties toegevoegd
- Z als gesloten gemarkeerd (waarvan W met `closed_verify: true`)
- Attracties met `tag_confidence: low` (lijst, voor admin-review)
- Attracties zonder `admin_preview` (lijst — meestal alleen de gesloten ones,
  vlag de rest expliciet)

## Belangrijk

- Reproduceer geen auteursrechtelijke teksten of foto's; vat feitelijk samen.
  De `admin_preview`-URL is een verwijzing, geen kopie.
- Admin blijft eindredacteur. Twijfel = `low` of `unknown`, niet zelf raden
  met te veel zelfvertrouwen.
- Eigennamen (park, attractie) niet vertalen (zie [CLAUDE.md](../CLAUDE.md)).
- Stabiele Engelse keys voor `type` en `props`
  (zie [ADR-015](../docs/adr/015-meertalige-ui.md)).
- Velden waar `tag_source: "admin"` staat: NIET overschrijven. Alleen
  aanvullen waar de admin nog niets heeft ingevuld.
