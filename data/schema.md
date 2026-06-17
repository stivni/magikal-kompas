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
      "source_url": "",                // bron van de TAGGING (parksite, RCDB, fanwiki)
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
  de parksite. Apart van `source_url`, dat de bron van de *tagging* is.
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

## Permanent gesloten attracties (zie [ADR-023](../docs/adr/023-permanent-gesloten-attracties.md))

Verdwenen attracties worden gemarkeerd in plaats van geschrapt — eerder
geverifieerde lengte/leeftijd-data blijft bewaard, en de attractie blijft
herkenbaar in oudere bezoekverslagen. Vier optionele velden, allemaal
weglaten = open:

- `closed`: `true` (bevestigd gesloten), `"unknown"` (twijfel, admin moet
  bevestigen), of weggelaten/`false` (open).
- `closed_year`: jaar van sluiting of `null`.
- `closed_source_url`: link naar bron die de sluiting bevestigt (optioneel
  bij `"unknown"`).
- `closed_verify`: `true` als admin het nog moet checken (standaard `true`
  bij `closed: "unknown"`).

Gesloten attracties tellen niet mee in matching/ranking en worden grijs/
doorgehaald getoond in zowel admin- als publieke UI.

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
water_ride, water_battle, dark_ride, transport, kiddie_flat, playground, show, funhouse

## Eigenschappen
wet, high, fast, inversions, spins, swings, dark

Keys zijn stabiel Engels (zie [ADR-015](../docs/adr/015-meertalige-ui.md)); de
NL-labels in de UI komen uit `PNL`/i18n. Eigenschappen zijn feiten over de
attractie (niet smaak). ~81% volgt uit het type; de rest (vooral
high/fast/dark/inversions) per attractie checken.
