# 14. Visuele en bron-velden per park en per attractie

- Status: Accepted
- Groep: Data, rollen & opslag

## Context

De UI toont vandaag alleen tekst: parknaam, attractienaam, type, eigenschappen.
Herkenning gaat sneller met een logo per park, en een foto per attractie zou
helpen om twijfelgevallen ("welke is dat ook weer?") direct te beslechten. Voor
wie meer wil weten is een directe link naar de pagina van de attractie op de
parksite het natuurlijke volgende stapje — handiger dan zelf gaan zoeken.

Drie beperkingen kleuren de keuze:

- **Rechten.** Parklogo's zijn merken; officiële attractiefoto's zijn
  auteursrechtelijk beschermd. Eigen foto's of CC-gelicenseerde beelden (vooral
  Wikimedia Commons) zijn de veilige route, maar dekken niet elke attractie.
- **Omvang.** Logo's (≈9 stuks) zijn verwaarloosbaar; foto's per attractie
  kunnen oplopen tot honderden bestanden. Dat is nog steeds binnen wat een
  statische app aankan ([ADR-009](009-statische-app-data-los.md)), mits per
  beeld klein gehouden en lazy-geladen.
- **Volwassenheid.** Logo's en park-URL's zijn snel te vullen; CC-foto's
  zoeken is een eigen klus voor de tag-agent en hoeft niet meteen.

## Decision

Drie optionele velden komen erbij in de wereld-data
([ADR-007](007-drie-datalagen.md)). Allemaal optioneel — de UI valt terug op
tekst als ze ontbreken.

- **`park.logo`** (parkniveau): pad naar een lokaal logo-bestand, bv.
  `assets/logos/efteling.svg`. SVG of klein WebP/PNG. Bedoeld voor koppen waar
  plaats is voor een liggend logo.
- **`park.icon`** (parkniveau): pad naar een klein, vierkant icoon, bv.
  `assets/icons/efteling.svg`. Bedoeld voor dichte lijstjes en chips waar een
  breed logo niet past (richtgrootte in de UI: ~16–24 px). Apart veld omdat een
  uitgerekt logo in een vierkant chipje lelijk wordt en omgekeerd; één bron
  voor beide gebruiken dwingt een compromis af.
- **`ride.park_url`** (attractieniveau): directe link naar de officiële
  attractiepagina op de parksite. Apart van `source_url` — dat veld blijft
  *bron van de tagging* (kan ook RCDB of een fanwiki zijn). `park_url` is
  bedoeld voor de "meer info"-link in de UI.
- **`ride.image`** (attractieniveau): object met expliciete licentievelden:

  ```json
  "image": {
    "url": "assets/photos/efteling/baron-1898.webp",
    "license": "CC-BY-SA-4.0",
    "attribution": "Foto door X, via Wikimedia Commons",
    "source_page": "https://commons.wikimedia.org/..."
  }
  ```

  `license`, `attribution` en `source_page` zijn verplicht zodra `url` is
  ingevuld — anders weten we later niet meer waar het beeld vandaan kwam en
  kan attributie of een take-down niet correct verwerkt worden. De UI toont
  attributie zichtbaar (bv. onderaan het beeld of in een tooltip).

### Admin-preview-foto: legitieme uitzondering op de "alleen CC"-regel

Naast `image` (CC-gelicenseerd, publiek getoond met attributie) is er per
attractie een optioneel **`admin_preview`**-object:

```json
"admin_preview": {
  "url": "https://www.walibi.fr/.../mystic-hero.jpg",
  "source_page": "https://www.walibi.fr/.../mystic",
  "note": "rechten-niet-gecheckt — alleen voor herkenning in admin-UI, NIET publiceren"
}
```

Doel: de admin helpen herkennen welke attractie het is wanneer er nog geen
CC-foto gevonden werd. De tag-agent
([tools/tag-agent-full.md](../../tools/tag-agent-full.md)) stelt hiervoor
een hero-foto van de parksite voor (of een Google-Afbeeldingen-treffer),
**zonder** licentiecheck. Dat botst niet met de "alleen CC"-regel hierboven,
omdat dit veld onder twee strikte voorwaarden valt:

- **Alleen admin-UI**, nooit publiek. De publieke renders kennen het veld
  niet en filteren `admin_preview` weg.
- **`note` is verplicht** en moet **letterlijk** met `"rechten-niet-gecheckt"`
  beginnen. Dat prefix is een machine-leesbare safeguard: code die het veld
  per ongeluk publiek zou willen tonen kan ervan uit gaan dat het hier om
  niet-gecheckt materiaal gaat en moet weigeren te renderen.

Geen lokale kopie in de repo: alleen de externe URL. Bij take-down of dode
link valt de admin-thumbnail terug op de bestaande emoji-fallback van
`RideThumb`. Het veld is fundamenteel anders dan `image`: `image` is bron
voor publieke render mét attributie, `admin_preview` is een werkkrabbel voor
de admin en blijft binnen die context.

### Fallback-volgorde voor parkvisuals

Per UI-context kiezen, in deze volgorde:

1. **Logo** waar plaats is voor een liggend beeld (lijstheaders, plan-kop).
2. **Icon** in dichte lijstjes en chips.
3. **Letterblokje** als beide ontbreken: een vierkant met de initialen van de
   parknaam (één letter; twee letters voor parken die met hetzelfde woord
   beginnen, zoals "Walibi Belgium" → "WB"). Achtergrondkleur deterministisch
   afgeleid uit de parkslug (stabiele kleur per park). Dit garandeert dat er
   altijd iets visueels staat, ook zonder asset.

Niet automatisch terugvallen van `logo` op `icon` of omgekeerd: een logo in een
chipje en een icoontje in een grote header zien er beide slecht uit.

### Publicatieafspraak (rechten)

Logo's en iconen zijn merken van de respectieve parken. De afspraak voor het
gebruik in deze tool — gestoeld op verwijzend gebruik en de regels rond
objectieve vergelijking (EU-richtlijn 2006/114/EG, omgezet in WER boek VI):

- Logo's/iconen worden **ongewijzigd** weergegeven, op functionele grootte, en
  enkel om naar het park te verwijzen. Geen suggestie van een band of
  endorsement.
- In de footer staat een zichtbare disclaimer: Magikal Kompas is een
  onafhankelijke, objectieve vergelijkingstool, geen band met de parken,
  merken en logo's zijn eigendom van hun respectieve houders.
- Een take-down-verzoek van een park wordt gerespecteerd: het betreffende
  `logo`/`icon`-veld leeggemaakt, de UI valt terug op het letterblokje.
- Geen juridisch advies; bij commercieel gebruik (vandaag uitgesloten door
  [ADR-001](001-eigen-lokale-tool.md)) hoort eerst een IE-check.

Fasering:

1. **Nu**: `park.logo` en `park.icon` invullen voor de bestaande parken;
   letterblokje-fallback en disclaimer-footer in de UI.
2. **Nu, gratis meegenomen**: `park_url` opnemen in het schema; de tag-agent
   ([tools/tag-agent.md](../../tools/tag-agent.md)) vult dit voortaan mee in
   waar mogelijk, naast `source_url`.
3. **Later**: `image` in een aparte tag-agent-ronde, gericht op Wikimedia
   Commons en andere CC-bronnen. Geen treffer → veld blijft leeg.

## Consequences

- Het schema groeit met drie optionele velden; bestaande parkbestanden blijven
  geldig zonder wijziging.
- De UI moet leren omgaan met "logo aanwezig of niet" en "foto aanwezig of
  niet"; voor `image` hoort daar zichtbare attributie bij.
- Beelden komen als lokale bestanden in de repo (sluit aan op
  [ADR-009](009-statische-app-data-los.md)): versioneerbaar, geen runtime-fetch
  naar externe hosts nodig, geen broken links als een externe bron verdwijnt.
  Prijs: de repo wordt groter naarmate foto's worden toegevoegd.
- `source_url` (bron van de tagging) en `park_url` (officiële attractiepagina)
  bestaan naast elkaar met verschillende betekenis. De tag-agent moet dat
  onderscheid maken.
- Toekomst / open vragen:
  - Wanneer de fotomap groot wordt: lui-laden per park, gelijklopend met de
    uitweg die [ADR-009](009-statische-app-data-los.md) al schetst.
  - Of we ook een `park.url` (homepage) los van `meta.site` willen — vandaag
    overlappen die genoeg om geen apart veld te rechtvaardigen.

## Considered alternatives

- **`image` als losse string-URL zonder licentievelden.** Compact, maar
  attributie en bron raken kwijt zodra een agent het beeld vindt. Bij hergebruik
  of een take-down is dat een echt probleem. Niet gekozen.
- **Externe foto-URL's (hotlinken naar Wikimedia of de parksite).** Spaart
  repo-omvang, maar breekt zodra de bron verdwijnt of zijn pad wijzigt, en
  vereist runtime-fetch — wat [ADR-009](009-statische-app-data-los.md) bewust
  vermijdt voor de kern. Niet gekozen.
- **`source_url` hergebruiken voor de "meer info"-link.** Rekt de semantiek
  op: `source_url` mag vandaag een fanwiki of RCDB zijn, geen officiële
  parkpagina. Niet gekozen — `park_url` apart houden is duidelijker en
  goedkoper dan later ontwarren.
- **Logo's en foto's nu samen aanpakken.** Logo's zijn klein en snel; CC-foto's
  zoeken is een eigen klus voor de agent met eigen licentieregels. Samen
  vertraagt het stuk dat meteen waarde geeft. Niet gekozen.
- **Eén beeldveld dat zowel logo als icon dient.** Vereist een compromis-bron
  (vierkant-ish, klein-ish) of CSS-trucs om beide gebruiken te dekken. Twee
  velden is voor 9 parken nauwelijks meer werk en geeft beide contexten een
  bron op maat. Niet gekozen.
- **Geen letterblokje-fallback, gewoon tekst.** Werkt, maar maakt de UI minder
  scanbaar voor parken zonder logo/icon en haalt het herkenningsvoordeel weg
  juist waar het nog ontbreekt. Niet gekozen.
