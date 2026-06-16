# 19. Admin als lokale tool met backend (type, eigenschappen, foto per attractie)

- Status: Accepted
- Groep: Data, rollen & opslag
- Stack: zie [ADR-020](020-frontend-en-admin-stack.md) — frontend in
  React/TS, backend in Express/TS met `sharp`. Eerdere PHP-implementatie
  is bewust losgelaten in dezelfde keuze.
- Vervangt eerdere iteraties: tab-binnen-app (`?admin`), losse `admin.html`
  met JSON-download-export. Beide loslaten omdat ze de auteurservaring
  brak maakten (handmatig downloaden, handmatig naar `data/parks/` slepen,
  handmatig commits).

## Context

[ADR-014](014-visuele-en-bron-velden.md) legt vast hoe een attractie z'n
`image`-veld krijgt (lokaal pad, CC-licentie, attributie, bronpagina). Voor
welke kandidaat de attractie het best samenvat is een menselijke beoordeling
— dat oordeel hoort bij de admin, niet bij de agent of bij de eindgebruiker.
De admin bewerkt ook `type` en `props` (zie [ADR-007](007-drie-datalagen.md),
wereld-laag).

De vorige iteratie was een aparte statische pagina (`admin.html` + `admin.js`)
die kandidaten las uit een vooraf gegenereerde `data/photo-candidates/<slug>.json`
en bij elke wijziging een park-JSON liet downloaden. Twee problemen:

- **Download → handmatig kopiëren → commit**. Drie stappen per beslissing
  ondermijnde de "kleine, frequente correctie"-flow.
- **Statische kandidaten verouderen**. Wikimedia Commons groeit; een
  precomputed snapshot per park betekent dat een nieuwe foto pas zichtbaar
  wordt na een nieuwe agent-ronde.

## Decision

Admin draait als **lokale tool met eigen backend**. Stack-details staan in
[ADR-020](020-frontend-en-admin-stack.md); de admin-workflow zelf is:

- **Hoofdapp en admin worden samen gebouwd** maar gebruiken aparte
  entry-points (`index.html`, `admin.html`). De hoofdapp draait online op
  GitHub Pages; de admin werkt alleen wanneer de lokale backend draait.
- **Start lokaal**: `npm run all` start Vite (frontend) én de Express-
  backend (`server/index.ts`, poort 8001). Vite proxiet `/api/*` naar de
  backend zodat de admin-frontend zonder CORS-gedoe praat met `/api/...`.
- **Drie endpoints**, allemaal JSON:
  - `GET /api/candidates?park_slug=&att=&extra=` — bevraagt Wikimedia
    Commons live (`generator=search` + `imageinfo`), filtert op
    CC0 / CC-BY(-SA) / Public Domain, skipt titels met `construction`,
    `queue`, `entrance`, `sign`, `map`, `logo` en breedte < 600px. Returnt
    3–5 kandidaten in hetzelfde JSON-formaat dat de admin-frontend
    consumeert. Optionele `extra`-zoekterm laat de admin een tweede
    ronde forceren.
  - `POST /api/save` — krijgt de volledige park-JSON, schrijft die naar
    `data/parks/<slug>.json` (pretty-printed, UTF-8), update
    `meta.updated` naar vandaag. Geen aparte build-rebuild stap meer
    nodig — de hoofdapp leest de JSON tijdens haar eigen volgende build,
    en de Vite-dev-server triggert automatisch een HMR-refresh wanneer
    een park-bestand wijzigt.
  - `POST /api/photo` — downloadt de gekozen Commons-URL via `fetch`,
    schaalt naar max 800px breed met `sharp`, encodeert als WebP q80,
    schrijft `assets/photos/<park_slug>/<att_slug>.webp`. Retourneert het
    volledige `image`-object dat de admin-frontend rechtstreeks in de
    park-JSON kan zetten (en daarna `POST /api/save` triggert).
- **Auto-save bij elke wijziging**. Geen overrides, geen exporteer-knop,
  geen dirty-tracking. De React-admin houdt de park-state in `useState`
  en POSTet onmiddellijk naar `/api/save` bij elke mutatie. Klein
  indicator-bolletje rechtsboven (`opslaan…` / `opgeslagen ✓` / `fout: …`).
- **Geen authenticatie**. Lokale tool, één gebruiker, één machine
  ([ADR-001](001-eigen-lokale-tool.md)).

### Scope: alle ride-level wereld-data

De admin bewerkt vandaag **alle wereld-data op rijniveau**:

- `type` (bewegingsmodel) en `props` (eigenschappen) — sinds de eerste
  iteratie.
- `image` (foto + licentievelden) — via de Commons-kandidatengrid.
- `beg`, `zelf`, `max` — lengtes in cm, met `0`/`null`-semantiek uit
  [ADR-002](002-toegankelijkheid-toestanden.md).
- `min_age_beg`, `min_age_zelf`, `max_age` — leeftijden in jaar, met
  `null`-semantiek uit [ADR-016](016-leeftijdsregels-en-ontbrekende-data.md).
- `oms` — vrije omschrijving (bewerkt als NL-string, zie
  [ADR-015](015-meertalige-ui.md): een i18n-object op deze plek wordt bij
  bewerking vervangen door de NL-string-vorm).
- `source_url` (bron van de tagging) en `park_url` (officiële
  attractiepagina).

Park-level velden (`logo`, `icon`, `meta.country`, `meta.site`) blijven
buiten scope vandaag; daarvoor blijft handmatige JSON-edit de weg. Toevoegen
of verwijderen van rides of parken via admin blijft eveneens buiten scope.

Alle nieuwe velden volgen dezelfde auto-save-flow: commit gebeurt
`onBlur` van het input-veld, geen aparte save-knop. Bij elke veld-save
worden `tag_source` op `"admin"` en `tag_confidence` op `"verified"`
gezet — consistent met type- en props-edits.

### Granulariteit blijft per attractie, park als filter

De UI verandert niet wezenlijk: bovenaan een park-picker, eronder per
attractie type-knoppen, props-toggles, huidige foto met attributie, en een
grid van live-geladen kandidaten. Wat wegviel:

- `data/photo-candidates/` (directory + Efteling-bestand) is verwijderd.
- `typeOv`/`propOv`/`imageOv` overrides + `eff*`-derivaten zijn weg.
- De exporteer-knop is weg.
- `dirtyParks()`/`exportDirty()` zijn weg.

Wat erbij kwam:

- Per attractie een klein zoekveldje + "vernieuwen" om kandidaten met
  een extra term te herladen.

## Consequences

- **Auteurservaring**: één klik, één save, zichtbaar in de hoofdapp na
  refresh. Geen handmatig kopiëren meer.
- **Live-kandidaten**: nieuwere Commons-uploads zijn direct kiesbaar; geen
  agent-ronde meer nodig om de kandidatenset te verversen.
- **Tweede runtime** (Node + Express) erbij in de devloop. Productie raakt
  het niet — GitHub Pages serveert enkel de gebouwde statische bundel
  zonder backend. `admin.html` zit nominaal in de publicatie maar toont
  een nette "lokale server nodig"-melding zonder `/api/*` achter zich.
- **Commons-API hangt aan een externe service**. Bij downtime of
  rate-limiting verschijnt "Kandidaten konden niet geladen worden" met
  hint. Type- en props-edits blijven werken (die raken Commons niet).
- **`sharp`** dekt alle relevante bronformaten (JPEG, PNG, WebP, TIFF) —
  geen aparte fallback nodig. Native binaries worden via `npm install`
  meegeleverd voor de ontwikkel-architectuur.
- Toekomst / open vragen:
  - Geen verwijderen van attracties of toevoegen via admin — voorlopig
    blijft dat een handmatige JSON-edit. Past bij de scope-discipline.
  - Multilang-`oms` (object-vorm `{nl, en, fr}`) bewerken in de admin:
    voorlopig niet — bij edit wordt het object vervangen door de
    NL-string. Per-taal-edit krijgt z'n eigen UI als de nood er is.

## Considered alternatives

- **Tab-binnen-app met `?admin`-flag**: bundle-pollutie, geen aparte URL.
  Niet gekozen (eerdere iteratie).
- **Statische `admin.html` met JSON-download-export**: vereiste te veel
  handmatige tussenstappen per save. Niet meer gekozen (deze iteratie
  vervangt het).
- **PHP-backend (vorige iteratie)**: werkte goed, één bestand, geen
  dependency-tree. Vervangen door Express/TS omdat de hele frontend toch
  naar TS migreerde (zie [ADR-020](020-frontend-en-admin-stack.md));
  één taal over de stack weegt voor onderhoud en gedeelde types
  ruimschoots op tegen de extra `npm install`-keten.
- **Python (Flask/FastAPI)**: minder vertrouwd bij de auteur, geen
  natuurlijke band met de frontend-stack. Niet gekozen.
- **Kandidaten blijven in een JSON-bestand**: bestaande agent-ronde-1
  blijft een geldige fallback voor wie offline werkt, maar het ingebakken
  pad in de admin wordt nu live. Niet voorkeur.
- **Geen lokale verwerking, externe Commons-URL als definitief**: schendt
  ADR-014's "lokale bestanden"-regel. Niet gekozen.
