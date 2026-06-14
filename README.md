# Magikal Kompas

Een persoonlijk hulpje om te kiezen naar welk pretpark je met een gezelschap gaat,
welke attracties iedereen kan doen (alleen / met begeleider), en waar elk kind het
meest aan zijn trekken komt — op basis van lengte én smaak.

## Achtergrond & beslissingen

De dragende architectuurkeuzes staan als ADRs in [`docs/adr/`](docs/adr/README.md) (MADR-stijl: context, beslissing, gevolgen, verworpen alternatieven). Lees die eerst als je iets fundamenteels wil wijzigen.

## Drie lagen (en wie wat mag)

| Laag | Wat | Waar | Wie beheert |
|---|---|---|---|
| **Wereld** | parken, attracties, types, eigenschappen, hoogtegrenzen | `data/parks/*.json` (in de repo) | **admin** (jij) |
| **Gezelschap** | gezinsleden, lengtes, smaak-voorkeuren, uitzonderingen | `localStorage` (per toestel) | elke gebruiker, alleen voor zichzelf |
| **Admin-correcties** | feit-correcties op de wereld-data | admin-modus → export → commit | **admin** (jij) |

De wereld-data is voor iedereen gelijk en gezaghebbend. Externen zien die als vast.
Gezelschaps-data is privé en blijft op het toestel — die raakt geen server, dus je
beheert nooit andermans (kinder)data. Dat is bewust: zo kun je de tool delen zonder
privacy-verantwoordelijkheid.

## Lokaal draaien

Open gewoon `index.html` in een browser. Geen server nodig — `data.js` bevat de
gebundelde parkdata.

## Een park toevoegen of bijwerken

1. Maak/bewerk `data/parks/<slug>.json` (zie `data/schema.md` voor het formaat).
2. Herbouw de bundel:  `node data/build-data.mjs`
3. Commit en push. Klaar.

## Admin-modus (feit-correcties)

Open de tool met `?admin` in de URL (bv. `index.html?admin`).
Dan kun je per attractie het **type** en de **eigenschappen** corrigeren.
Onderaan "Welk park?" verschijnt een knop **Exporteer gewijzigde parken**: die
downloadt de verbeterde `<park>.json`-bestanden. Leg ze in `data/parks/`, herbouw,
en commit.

> De admin-knop is een gemak, geen slot. De échte bescherming is git: alleen wie
> commit-rechten op de repo heeft, verandert de canonieke data. Een externe kan
> in admin-modus lokaal van alles wijzigen, maar kan het niet publiceren.

## Data taggen met een agent

Zie `tools/tag-agent.md`. Het idee: één agent **per park** haalt de echte
attractielijst op, vult type + eigenschappen in **met bron en zekerheid**, en
schrijft het parkbestand. Jij kijkt alleen de gemarkeerde twijfelgevallen na.

## Schaal

Alle matching gebeurt lokaal, dus alle parkdata wordt ingeladen. Dat is geen
bottleneck: ~140 bytes per attractie betekent ~200 KB bij 50 parken, ~800 KB bij
200 parken. Pas in de honderden parken wordt vooraf-inladen merkbaar — en dan is de
oplossing lui-laden: alleen `data/index.json` vooraf, attracties per park pas bij
openen. De structuur (losse parkbestanden + index) ligt daar al klaar voor. Het
echte schaalprobleem is tag-onderhoud, niet de download.

## Status van de data

Alle types/eigenschappen zijn nu `tag_source: auto-v1`, `tag_confidence: unverified`
— automatisch geraden, nog niet geverifieerd. Eerste klus: per park door de
tag-agent halen of in admin-modus nalopen.


## Leden overzetten tussen toestellen

Klik **Overzetten** bij "Wie gaat er mee?". Vink aan welke leden je wil overzetten —
alleen die leden reizen mee in de link (naam, lengte, voorkeuren, uitzonderingen).
Je krijgt een deel-link plus QR van diezelfde link. De config zit volledig ín de link
(in de URL-hash), er gaat niets naar een server.

Op het ontvangende toestel worden de inkomende leden **toegevoegd** aan het bestaande
gezelschap. Als een naam al bestaat, krijg je per botsende naam een keuze: het
bestaande lid behouden, overschrijven met het inkomende, of het inkomende lid onder
een nieuwe naam ("Emma 2") toevoegen.

Let op: in de link staan namen en lengtes van de aangevinkte leden. Deel hem alleen
met jezelf of mensen die je vertrouwt. De QR gebruikt een client-side bibliotheek
(qrcodejs via cdnjs); zonder internet rendert de QR niet maar werkt de link gewoon.

## Later (bewust uitgesteld)

- **Accounts + sync over toestellen.** Pas zinvol als je data van anderen op een
  server bewaart — met de privacy-plichten die daarbij horen. Nu staat alles per
  toestel; de codestructuur houdt deze stap open.
- **Foto's per attractie.** Veld is voorzien in het schema (`source_url`); gebruik
  eigen foto's, persmateriaal-onder-voorwaarden, of links. Geen parkfoto's klakkeloos
  publiceren.
