# 16. Leeftijdsregels per attractie, met geboortejaar als bron en "ontbrekende data" als eigen toestand

- Status: Accepted
- Groep: Attractiemodel

## Context

Sommige parken hanteren een **minimumleeftijd** bovenop de lengte-eisen, en
sporadisch een **maximumleeftijd** op kindertoestellen ("tot en met 11 jaar"). Voor­
beelden van minima: "minimum 8 jaar" of "minimum 12 jaar zonder begeleider". Lengte
alleen vangt dat niet: een kind van 145 cm dat 6 jaar is, mag op zo'n attractie nog
steeds niet. Tot voor kort beoordeelde Magikal Kompas enkel op lengte (zie
[ADR-002](002-toegankelijkheid-toestanden.md)), wat tot valse "haalbaar"-uitkomsten
leidt.

Tegelijk botsen we op een verwant probleem: niet elk lid hééft de relevante data
ingevuld. Vroeger kreeg een nieuw lid standaard 120 cm — dat lijkt onschuldig, maar
het verbergt onbekendheid achter een schijnzekerheid. We willen geen verplichte
velden (zou bestaande gezelschappen breken en voelt zwaar voor een licht hulpje),
maar we willen ook geen verzonnen verdict.

Een ruwe leeftijd in jaren zou ook werken, maar verschaalt: een kind dat we vandaag
op "6" zetten, blijft 6 in het bestand. Liever bewaren we wat *niet* verandert:
het geboortejaar (eventueel aangevuld met maand en dag).

## Decision

### (a) Leeftijdsregels per attractie, parallel aan lengte

Per ride drie optionele velden, allemaal in jaren:

- `min_age_beg` — minimumleeftijd onder begeleiding (`null` = geen regel)
- `min_age_zelf` — minimumleeftijd zelfstandig (`null` = geen regel)
- `max_age` — maximumleeftijd (`null` = geen regel)

De min-velden zijn de exacte parallel van `beg` / `zelf` voor lengte (zie
[ADR-002](002-toegankelijkheid-toestanden.md)). Eén min-veld zou het frequente
"min 12 zonder begeleider, geen ondergrens met begeleider" niet kunnen uitdrukken
zonder verlies. `max_age` is altijd een kindertoestel-grens en hoeft geen
180-cm-achtige drempel; overschrijden = `ontgroeid` (soft-uit, niet gemist).

### (b) Lid bewaart geboortejaar, niet leeftijd

Per lid drie optionele velden:

- `birthYear` — bv. `2018`
- `birthMonth` — `1`–`12` (optioneel)
- `birthDay` — `1`–`31` (optioneel)

De leeftijd wordt afgeleid uit `currentDate - birthDate`, met de precisie die
beschikbaar is. Geen migratie nodig om elk jaar bij te werken: het bestand blijft
correct.

Bestaande gezelschappen met een oud `age`-veld worden bij load eenmalig
geconverteerd: `birthYear = currentYear - age`. Dat is ruw maar conservatief — vanaf
dan kan de gebruiker maand/dag aanvullen voor meer precisie.

### (c) Onbekend of onzeker → toestand `onbekend`

De `ageState` van een lid op een attractie wordt berekend uit een **bereik**
`[ageLo, ageHi]`:

- **Alleen geboortejaar**: het lid heeft dit jaar misschien al verjaardag gehad,
  misschien nog niet → `[currentYear - birthYear - 1, currentYear - birthYear]`.
- **Met maand**: bereik krimpt op basis van de huidige maand. In de geboortemaand
  blijft het bereik 1 wijd (dag onbekend).
- **Met dag**: exacte leeftijd, bereik = 1 waarde.

Als de leeftijdsgrens van de attractie *buiten* het bereik valt, is het verdict
duidelijk (`alleen`, `begeleid`, `jong` of `ontgroeid`). Als de grens *binnen* het
bereik valt, is het verdict onzeker en wordt het `onbekend`. De UI nudgt dan om
maand of dag in te vullen voor dat lid. Dit "borderline-detectie" maakt het
verschil tussen "we weten het echt niet" en "we weten het niet precies genoeg".

### (d) Algemeen principe: geen verplichte velden

Punten (b)+(c) zijn geen leeftijd-uitzondering maar een principe: data die de
gebruiker niet aanlevert, vragen we niet af te dwingen. We tonen het effect
(`onbekend`) en bieden de plek om het in te vullen, en laten de keuze daar.
Hetzelfde principe geldt voor `h` (lengte): ontbreekt h en heeft de attractie een
lengte-eis → `onbekend`.

## Consequences

- Parken met expliciete leeftijdsregels krijgen eindelijk een correcte beoordeling.
- Een lid hoeft maar één keer ingesteld te worden; volgend jaar telt de tool zelf
  een jaar bij. Geboortejaar dekt 95% van de regels ("min 8") prima.
- Wie meer precisie wil — bv. omdat een regel op de grens valt — kan optioneel
  maand en dag invullen. De UI vraagt dat alleen wanneer het uitmaakt.
- Nieuwe leden krijgen geen automatische default voor geboortejaar; lengte behoudt
  voorlopig zijn slider-default van 120 cm. UI-werk om óók lengte écht optioneel
  te maken (slider met "leeg"-stand) is een vervolgstap; het datamodel staat het
  al toe (`h: null`).
- ADR-002 wordt uitgebreid met de toestanden `jong` en `onbekend` (zie daar), en
  met `max_age` als nieuwe bron van `ontgroeid`.
- Haalbaarheidspercentages worden iets eerlijker: een lid zonder geboortejaar op
  een park vol leeftijdsregels krijgt een visueel signaal in plaats van een
  verzonnen uitkomst.
- De tag-agent moet leren minimum- en maximumleeftijden uit parkpagina's te halen
  waar ze er zijn. Voorlopig blijven `min_age_*` en `max_age` overal `null` tot ze
  manueel of door de agent zijn aangevuld.

## Considered alternatives

- **`age` (integer jaren) opslaan**: simpel maar verouderd onmiddellijk; verlies van
  precisie en de gebruiker moet jaarlijks bijwerken. Niet gekozen.
- **Volledige geboortedatum verplicht**: precieser maar zwaarder qua invoer (date
  picker) en zelden nodig — parkregels werken op hele jaren. Niet gekozen.
- **Eén `min_age`-veld**: verliest het onderscheid "mag met ouder" vs "mag
  zelfstandig", precies de nuance waarvoor we bij lengte twee drempels hebben.
  Niet gekozen.
- **Geboortejaar verplicht maken bij elk lid**: breekt bestaande gezelschappen en
  voelt zwaar; haalt de drempel op om nieuwe leden toe te voegen. Niet gekozen.
- **Bij ontbrekende data terugvallen op lengte-verdict**: lijkt vriendelijk maar
  geeft valse "haalbaar" terug; ondermijnt het vertrouwen in de tool. Niet gekozen.
- **Borderline gewoon naar `jong` of `alleen` afronden**: gemakzuchtig, geeft soms
  verkeerde uitkomst zonder dat de gebruiker dat doorheeft. Niet gekozen.
