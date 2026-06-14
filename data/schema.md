# Parkbestand-formaat (`data/parks/<slug>.json`)

```json
{
  "park": "Walibi Belgium",
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
      "type": "thrill_coaster",        // bewegingsmodel, zie lijst onder
      "props": ["hoog","snel"],        // eigenschappen die WAAR zijn
      "tag_source": "auto-v1",         // auto-v1 | web | admin
      "tag_confidence": "unverified",  // unverified | low | med | high | verified
      "source_url": ""                 // bron van de tagging (agent vult dit)
    }
  ]
}
```

## Hoogte-logica (in de tool)
- `h >= zelf`  → mag alleen
- `zelf > h >= beg` → mag met begeleider
- `h < beg` → te klein
- `max` met `h > max`: ≥180 cm = echte veiligheidsgrens ("te groot"); <180 cm = kindertoestel ("ontgroeid", telt niet als gemist)

## Types (bewegingsmodel)
thrill_coaster, family_coaster, kiddie_coaster, spinning_coaster, drop_tower,
pirate_ship, top_spin, teacups, carousel, wave_swinger, ferris_wheel, flat_spinner,
water_ride, water_battle, dark_ride, transport, kiddie_flat, playground, show, funhouse

## Eigenschappen
nat, hoog, snel, inversies, draait, schommelt, donker

Eigenschappen zijn feiten over de attractie (niet smaak). ~81% volgt uit het type;
de rest (vooral hoog/snel/donker/inversies) per attractie checken.
