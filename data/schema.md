# Parkbestand-formaat (`data/parks/<slug>.json`)

```json
{
  "park": "Walibi Belgium",
  "logo": "assets/logos/walibi-belgium.svg", // optioneel, zie ADR-014
  "icon": "assets/icons/walibi-belgium.svg", // optioneel, vierkant, zie ADR-014
  "meta": {
    "country": "BE",
    "site": "https://www.walibi.be",
    "updated": "2026-06-14",
    "tagging": "korte notitie over de staat van de tagging"
  },
  "rides": [
    {
      "att": "Kondaa",                 // attractienaam
      "oms": "",                       // korte omschrijving (optioneel)
      "beg": 130,                      // min. lengte ONDER BEGELEIDING (cm), 0 = geen
      "zelf": 130,                     // min. lengte ZELFSTANDIG (cm)
      "max": null,                     // max. lengte (cm) of null
      "min_age_beg": null,             // min. leeftijd ONDER BEGELEIDING (jaar) of null, zie ADR-016
      "min_age_zelf": null,            // min. leeftijd ZELFSTANDIG (jaar) of null, zie ADR-016
      "max_age": null,                 // max. leeftijd (jaar) of null, soft-uit kindertoestel
      "type": "thrill_coaster",        // bewegingsmodel, zie lijst onder
      "props": ["high","fast"],        // eigenschappen die WAAR zijn (stabiel-EN keys)
      "tag_source": "auto-v1",         // auto-v1 | web | admin
      "tag_confidence": "unverified",  // unverified | low | med | high | verified
      "sources": [],                   // bron(nen) van de TAGGING (parksite, RCDB, fanwiki, …); lijst van URL-strings
      "park_url": "",                  // optioneel: officiële attractiepagina (UI: "meer info")
      "image": null                    // optioneel: zie hieronder
    }
  ]
}
```

## Optionele visuele en bron-velden (zie [ADR-014](../docs/adr/014-visuele-en-bron-velden.md))

- `logo` (parkniveau): pad naar lokaal logobestand, bv. `assets/logos/<slug>.svg`.
  Voor liggende koppen.
- `icon` (parkniveau): pad naar klein vierkant icoon, bv. `assets/icons/<slug>.svg`.
  Voor dichte lijstjes en chips. Geen automatische fallback tussen `logo` en
  `icon`; ontbreekt beide → UI toont een letterblokje (zie ADR-014).
- `park_url` (per attractie): directe link naar de officiële attractiepagina op
  de parksite. Apart van `sources`, dat de bron(nen) van de *tagging* zijn.
- `sources` (per attractie): lijst van URL-strings (mag leeg zijn) die de
  tagging onderbouwen — parksite, RCDB, fanwiki, lokale pers. Vervangt het
  vroegere `source_url` (één string); meerdere bronnen zijn nu de norm.
- `image` (per attractie): object met expliciete licentievelden. Zodra `url`
  is ingevuld zijn `license`, `attribution` en `source_page` verplicht.

  ```json
  "image": {
    "url": "assets/photos/walibi-belgium/kondaa.webp",
    "license": "CC-BY-SA-4.0",
    "attribution": "Foto door X, via Wikimedia Commons",
    "source_page": "https://commons.wikimedia.org/..."
  }
  ```

- `admin_preview` (per attractie, optioneel): rechten-niet-gecheckte foto-URL
  die de admin helpt herkennen welke attractie het is. **Alleen** zichtbaar in
  de admin-UI; nooit in de publieke render. Fundamenteel anders dan `image`
  (zie [ADR-014](../docs/adr/014-visuele-en-bron-velden.md)).

  ```json
  "admin_preview": {
    "url": "https://www.walibi.fr/.../mystic-hero.jpg",
    "source_page": "https://www.walibi.fr/.../mystic",
    "note": "rechten-niet-gecheckt — alleen voor herkenning in admin-UI, NIET publiceren"
  }
  ```

  `note` moet **letterlijk** beginnen met `"rechten-niet-gecheckt"` zodat
  code het veld automatisch kan herkennen en uit publieke renders kan weren.

## Activity-log per attractie

Elke ride heeft optioneel `activity`: een array van **maximaal 3** entries die
de laatste wijzigingen bewaart (nieuwste vooraan; oudste rolt eruit bij push).

Twee soorten entries:

**Wijziging:**

```json
{
  "at": "2026-06-18T10:30:00Z",
  "by": "admin",
  "changes": {
    "type": { "from": "thrill_coaster", "to": "family_coaster" },
    "props": { "from": ["high"], "to": ["high", "fast"] }
  }
}
```

**Verify:**

```json
{ "at": "2026-06-18T10:31:00Z", "by": "admin", "verified": true }
```

- `at`: ISO-8601 UTC.
- `by`: `"admin"` of `"agent:<vN>"` (bv. `"agent:web-v1"`).
- `changes`: object met veld→`{from,to}`. Alleen velden die echt veranderden.
  Hele oude/nieuwe waarde in `from`/`to`, ook voor arrays/objecten.
- `verified: true` alleen bij verify-entries (door admin via ✓-knop). Agents
  zetten dit nooit; zij produceren enkel wijziging-entries.

Bestaande rides starten zonder `activity` (of `[]`); het veld vult zich tijdens
gebruik. Geen backfill van historische data.

## Permanent gesloten attracties

Verdwenen attracties worden **hard verwijderd** uit het park-bestand. De
park-curation-agent stelt enkel verwijderingen voor in een aparte sectie van zijn
output (zie [park-curation.md](../tools/park-curation.md)); admin past de
verwijdering toe. Zie [ADR-023](../docs/adr/023-permanent-gesloten-attracties.md)
(Withdrawn) voor de eerdere markeer-aanpak die teruggedraaid werd.

## Toegankelijkheids-logica (in de tool)

Per as (lengte en leeftijd) berekent de tool een toestand; de strengste wint. Zie
[ADR-002](../docs/adr/002-toegankelijkheid-toestanden.md) en
[ADR-016](../docs/adr/016-leeftijdsregels-en-ontbrekende-data.md).

**Lengte-as** (gebruikt `h` van het lid):
- `h >= zelf`  → mag alleen
- `zelf > h >= beg` → mag met begeleider
- `h < beg` → te klein
- `max` met `h > max`: ≥180 cm = echte veiligheidsgrens ("te groot"); <180 cm = kindertoestel ("ontgroeid", telt niet als gemist)
- `h` ontbreekt en de attractie heeft een lengte-eis → onbekend

**Leeftijd-as** (gebruikt `birthYear`, optioneel `birthMonth`, `birthDay` van het lid):
- Geen `min_age_*` en geen `max_age` op de attractie → as is "alleen" (geen restrictie)
- Leeftijd wordt afgeleid uit `currentDate - birthDate` als bereik `[lo, hi]` op
  basis van de precisie van de geboortedatum (zie ADR-016)
- Het bereik valt volledig ≥ `min_age_zelf` → mag alleen
- Het bereik valt volledig ≥ `min_age_beg` (en < `min_age_zelf`) → mag met begeleider
- Het bereik valt volledig onder `min_age_beg` (of `min_age_zelf` als enige drempel) → te jong
- Het bereik valt volledig boven `max_age` → ontgroeid (soft-uit kindertoestel)
- `birthYear` ontbreekt en er is een leeftijdsregel → onbekend
- De drempel valt *binnen* het bereik (onvoldoende precisie) → onbekend + UI-hint
  om maand/dag in te vullen

**Strengst-wint-combinatie**: een hard-uit (`klein`, `jong`, `groot`) wint van
`ontgroeid`, dat van `onbekend`, dat van `begeleid`, dat van `alleen`. Bij twee
hard-uits wint de lengte-toestand (informatiever in de UI).

## Types (bewegingsmodel)
thrill_coaster, family_coaster, kiddie_coaster, spinning_coaster, drop_tower,
pirate_ship, top_spin, teacups, carousel, wave_swinger, ferris_wheel, flat_spinner,
water_ride, water_battle, **story_ride** (belevingsrit — vervangt dark_ride als
typenaam; dark_ride behouden voor backwards-compat lezen), transport, kiddie_flat,
playground, show, funhouse

## Eigenschappen
wet, high, fast, inversions, spins, swings, dark,
**scary** (bewust eng — jump-scares, horror-theming),
**themed** (mate van wereld/verhaal/onderdompeling)

Keys zijn stabiel Engels (zie [ADR-015](../docs/adr/015-meertalige-ui.md)); de
NL-labels in de UI komen uit `PNL`/i18n. Eigenschappen zijn feiten over de
attractie (niet smaak). ~81% volgt uit het type; de rest (vooral
high/fast/dark/inversions) per attractie checken.

## Intensiteits-tags (verplicht bij nieuwe tagging — ADR-024)

- `intensity` (1-5) — beleefde intensiteit (niet afgeleid, handmatig getagd):
  - 1 = rustig deinen (passieve beweging, geen schrik-trigger)
  - 2 = lichte deining (beweegt mee, herkenbaar veilig)
  - 3 = stevige beuk (echte rit, familie-niveau)
  - 4 = hou je vast (thrill, hartje slaat over)
  - 5 = niet voor watjes (extreme G's, gillen)

- `height_intensity` (1-5) — beleefde hoogte (niet `max_height_m`; gescheiden
  zodat een 45m gesloten gondel lager kan scoren dan een open 30m coaster):
  - 1 = voeten op de grond (0 m)
  - 2 = omhoog maar je voelt je vast (0-5 m)
  - 3 = je ziet de hoogte (5-10 m)
  - 4 = hoogte is deel van de thrill (10-50 m)
  - 5 = hoogte ís de thrill (> 50 m)

## Optionele data-velden (FYI voor tagger/admin — ADR-024)

```json
"top_speed_kmh": 119,
"max_height_m": 45.6,
"drop_m": 37.5,
"inversions_count": 4,
"duration_s": 90,
"g_force": 3.8
```

Al deze velden zijn optioneel. Ze zijn FYI op het attractiekaartje en voeden
de park-curation-agent bij het bepalen van `intensity` en `height_intensity`. Ze hebben
geen semantisch gewicht in de score-berekening zelf.
