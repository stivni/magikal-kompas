# Architecture Decision Records

Deze map legt de dragende architectuurbeslissingen van Magikal Kompas vast.
Formaat: [MADR](https://adr.github.io/madr/) — Context, Decision, Consequences,
Considered alternatives. Elke ADR formuleert de *huidige* keuze op zichzelf, niet
de weg ernaartoe. "Toekomst / open vragen" staat per ADR onder Consequences.

Status van alle records hieronder: **Accepted** (vastgelegd na de POC-fase),
tenzij anders vermeld.

| # | Titel | Groep |
|---|---|---|
| [001](001-eigen-lokale-tool.md) | Eigen, lokale tool zonder verdienmodel | Productafbakening |
| [002](002-toegankelijkheid-toestanden.md) | Toegankelijkheid in vier toestanden | Attractiemodel |
| [003](003-type-en-eigenschappen.md) | Twee assen: bewegingstype en eigenschappen | Attractiemodel |
| [004](004-eigenschappen-afgeleid.md) | Eigenschappen primair afgeleid uit het type | Attractiemodel |
| [005](005-voorkeuren-per-lid.md) | Voorkeuren per lid, met harde uitsluiter *(Superseded)* | Voorkeuren & ranking |
| [006](006-ranken-op-plezier.md) | Parken ranken op plezier, twee lenzen | Voorkeuren & ranking |
| [007](007-drie-datalagen.md) | Drie datalagen met eigen eigenaarschap | Data, rollen & opslag |
| [008](008-opslag-per-toestel.md) | Gezelschaps-data per toestel, deelbaar zonder server | Data, rollen & opslag |
| [009](009-statische-app-data-los.md) | Statische app met data los van code | Data, rollen & opslag |
| [010](010-parken-uitsluiten.md) | Parken uitsluiten van de berekening | Data, rollen & opslag |
| [011](011-leeg-gezelschap-voor-nieuwe-gebruiker.md) | Leeg gezelschap voor een nieuwe gebruiker | Data, rollen & opslag |
| [012](012-twee-taken-in-de-ui.md) | UI rond twee concrete taken | Productafbakening |
| [013](013-forceer-uitzondering-per-lid.md) | Forceer-uitzondering per lid en per attractie *(Withdrawn)* | Voorkeuren & ranking |
| [014](014-visuele-en-bron-velden.md) | Visuele en bron-velden per park en per attractie | Data, rollen & opslag |
| [015](015-meertalige-ui.md) | Meertalige UI met stabiele datasleutels *(Proposed)* | Productafbakening |
| [016](016-leeftijdsregels-en-ontbrekende-data.md) | Leeftijdsregels per attractie, en "ontbrekende data" als eigen toestand | Attractiemodel |
| [017](017-hash-routing-voor-tab-en-park.md) | Hash-routing voor tab en gekozen park | Productafbakening |
| [018](018-chrome-per-breakpoint.md) | Chrome in één plek per breakpoint | Productafbakening |
| [019](019-admin-foto-curatie.md) | Admin-pagina voor foto-curatie | Data, rollen & opslag |
| [020](020-frontend-en-admin-stack.md) | Frontend en admin-backend in TypeScript (React + Vite + Express) | Productafbakening |
| [021](021-begeleiding-haalbaarheid.md) | Begeleiding-haalbaarheid als eigen signaal naast plezier *(Proposed)* | Voorkeuren & ranking |
| [022](022-samen-en-splits-transparantie.md) | Samen en splits: transparantie zonder subgroepen-modeling *(Proposed)* | Voorkeuren & ranking |
| [023](023-permanent-gesloten-attracties.md) | Permanent gesloten attracties markeren in plaats van schrappen | Data, rollen & opslag |
| [024](024-voorkeur-model-gedragsstaten.md) | Voorkeur-model: gedragsstaten als afleiding van intensiteits-assen | Voorkeuren & ranking |
| [025](025-kunnen-willen-moeten-zullen.md) | Park-aggregaten als vier werkwoorden: KUNNEN · WILLEN · MOETEN · ZULLEN *(Proposed)* | Voorkeuren & ranking |
| [026](026-splits-planning.md) | Splits-planning: subgroepen als eerste-klas-burger *(Proposed)* | Voorkeuren & ranking |
