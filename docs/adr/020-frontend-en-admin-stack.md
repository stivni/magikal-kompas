# 20. Frontend en admin-backend in TypeScript (React + Vite + Express)

- Status: Accepted
- Groep: Productafbakening
- Vervangt: stack-keuze in [ADR-019](019-admin-foto-curatie.md) (PHP-backend).
  De *workflow* van admin (aparte URL, scope per attractie met park als
  filter, auto-save, live Commons-kandidaten) blijft ongewijzigd; alleen
  het implementatieframework verandert.

## Context

De hoofdapp en admin zijn lange tijd in vanilla JS gebouwd, met statische
publicatie en `file://`-openbaarheid als principe ([ADR-009](009-statische-app-data-los.md)).
Die aanpak hield het project klein en bouwde geen treadmill van dependencies
op. Tegelijk groeit het: i18n, hash-routing, breakpoint-chrome, foto-curatie
met live API, surgisch updaten van DOM-fragmenten. Met elk feature werd het
duidelijker dat de UI-laag een **component-model** miste. Cohesie ontbrak —
hetzelfde `rideThumbHTML` stond duplicaat tussen hoofdapp en admin met
subtiel andere semantiek; het surgisch updaten van DOM moest handmatig
georchestreerd worden (`redrawHead`, `redrawGrid`, event-delegatie); types
bestonden enkel in het hoofd van de auteur.

Een "component-model zonder framework" via vanilla Web Components is
mogelijk maar reproduceert handmatig wat React/Vue/Svelte standaard doen.
Voor een auteur die JS/TS minder kent dan PHP, is een breed gedocumenteerd
framework — met sterke AI- en tutorial-ondersteuning — laagdrempeliger dan
een eigen "clever vanilla"-conventie.

De admin had bovendien al een tweede taal in de stack: PHP. Twee talen voor
één project is niet inherent slecht, maar wel een onnodig hoge overhead als
één moderne TS-keten de hele scope kan dekken.

## Decision

De volledige stack gaat naar **TypeScript**:

### Frontend (hoofdapp + admin)

- **React 18** met **TypeScript** als component- en taalkeuze. Functionele
  componenten + hooks; geen class components.
- **Vite** als dev-server en bundler. `npm run dev` voor de hoofdapp,
  `npm run build` voor publicatie. Geen Webpack, geen Babel-config, geen
  CRA.
- **Eén Vite-project** met twee entry-points (`index.html`,
  `admin.html`). Gedeelde code (types, vocab, scoring-helpers, shared
  componenten zoals `RideThumb`, `Lightbox`) leeft in `src/shared/`.
- **Geen externe state-library** (Redux/Zustand/Jotai). React's eigen
  `useState`/`useContext` is voldoende voor onze schaal. Wel toegestaan
  zodra het pijnlijk wordt — niet preventief.
- **Geen UI-bibliotheek** (geen MUI/Chakra). De huidige CSS (kleurpalet,
  Bricolage-typografie, kaartstijl) blijft de visuele identiteit; de
  bestaande `styles.css` migreert mee als één globaal stylesheet.
- **Geen React Router** vooralsnog — single-page, tab-state in
  `useState`. De hash-routing uit [ADR-017](017-hash-routing-voor-tab-en-park.md)
  blijft een eigen hook (`useHashRoute`); router-library toevoegen kan
  later als routes complexer worden.

### Admin-backend

- **Node 20+ met TypeScript**.
- **Express** als HTTP-framework. Eén bestand (`server/index.ts`) met de
  drie endpoints uit [ADR-019](019-admin-foto-curatie.md) (`/api/candidates`,
  `/api/save`, `/api/photo`). Express omdat het de meest-gedocumenteerde
  Node HTTP-keuze is — sluit aan op de "AI- en tutorial-laagdrempelig"-overweging.
- **`sharp`** vervangt PHP's GD voor image-processing: download met
  `fetch` (Node 20 native), schaal naar max 800px, encodeer als WebP q80.
  Geen `cwebp`-fallback meer nodig — sharp dekt alle relevante bronformaten.
- **`tsx watch`** voor development (auto-reload bij file changes). Geen
  aparte build voor de server; in productie zou je `node --import tsx` of
  een compile-stap toevoegen, maar de server is lokaal-only.

### Project-structuur

```
magikal-kompas/
├── src/
│   ├── main.tsx              ← entry hoofdapp
│   ├── admin.tsx             ← entry admin
│   ├── app/                  ← hoofdapp-componenten + views
│   ├── admin/                ← admin-componenten + views
│   └── shared/               ← types, vocab, scoring, shared components
├── server/
│   └── index.ts              ← Express admin-backend
├── data/parks/*.json         ← onveranderd
├── assets/                   ← onveranderd
├── index.html                ← Vite entry
├── admin.html                ← Vite entry
├── package.json
├── vite.config.ts
├── tsconfig.json
└── docs/adr/
```

### Dev-flow

```
npm run dev      # Vite (frontend, beide entries) op :5173
npm run server   # tsx watch server/index.ts op :8001
npm run all      # beide tegelijk via concurrently
```

Vite proxiet `/api/*` naar `localhost:8001` zodat de admin-frontend
zonder CORS-gedoe met de backend praat.

### Publicatie

`npm run build` produceert `dist/` met `index.html`, `admin.html` en
gebundelde JS/CSS. De GitHub Pages workflow ([.github/workflows/deploy.yml](../../.github/workflows/deploy.yml))
bouwt en publiceert `dist/`. **Belangrijk**: `admin.html` zit in de
publicatie-bundel maar werkt online niet — er is geen `/api/*` backend.
Dat is OK; admin is bewust lokaal-only ([ADR-019](019-admin-foto-curatie.md)),
en wie de admin-URL aanklikt krijgt een nette "lokale server nodig"-melding.

Alternatief: `admin.html` uit `dist/` snippen tijdens de deploy. Voorlopig
laten staan voor eenvoud.

## Consequences

- **Build-step verplicht**. `file://`-openbaarheid uit
  [ADR-009](009-statische-app-data-los.md) is bewust losgelaten. In ruil:
  ES modules, type-safety, hot-reload, AI-vriendelijke component-code.
- **`node_modules` en `package-lock.json`** komen in de repo (laatste
  gecommit, eerste in `.gitignore`). Maandelijkse `npm outdated` voor
  hygiëne; geen automatische upgrade-treadmill voor een persoonlijke tool.
- **`data.js` en `data/build-data.mjs` verdwijnen**. Park-JSON's worden
  direct in TS geïmporteerd:

  ```ts
  import efteling from "../data/parks/efteling.json"
  ```

  Vite handelt JSON-import natively. Geen prebuild-stap meer.

- **PHP-backend verdwijnt**. `admin-server.php` wordt vervangen door
  `server/index.ts`. cURL → `fetch`, GD → `sharp`, `exec("node …")` is niet
  meer nodig omdat data direct in TS wordt gemuteerd en weggeschreven.
- **Eén taal over de volle stack**. TypeScript van frontend tot backend
  vereenvoudigt context-switches en maakt types delen (Park, Ride, Image)
  triviaal — gedeelde TS-types in `src/shared/types.ts`, server-importeerbaar.
- **Vanilla migratiekost**. De ~1800 regels JS van hoofdapp + admin
  worden in één migratie geport. Geschat een weekend werk; voor het
  daaropvolgende onderhoud is React/TS productiever voor de auteur.
- **Bestaande ADRs blijven gelden** op semantisch niveau: ADR-001
  (lokale tool), ADR-007 (drie datalagen), ADR-014 (visuele velden),
  ADR-017 (hash-routing), ADR-018 (chrome per breakpoint), ADR-019
  (admin-workflow) blijven inhoudelijk staan. Alleen ADR-009 (statisch +
  file://) wordt herzien om de build-step te erkennen.

## Considered alternatives

- **Svelte 5 / SolidJS + Vite + TS**: elegantere reactivity-modellen,
  vaak minder boilerplate. Maar kleinere community, minder tutorials,
  minder consistente AI-output. Voor een auteur die JS/TS minder kent,
  is "wat AI's altijd goed kunnen" een belangrijker criterium dan
  "wat technisch eleganter is". Niet gekozen.
- **Volledig vanilla + Web Components** (vorige plan): minder dependencies,
  geen build-step. Maar reproduceert handmatig wat een framework standaard
  doet, en bouwt geen overdraagbare skill op. Niet gekozen.
- **Next.js**: SSR en file-based routing zijn voor onze schaal overkill,
  en de admin-backend (Node-side) past niet natuurlijk in de Next-API-routes-
  structuur als je hem lokaal-only wil houden. Niet gekozen.
- **Frontend in React, backend in PHP behouden**: werkt prima, twee talen
  zijn ook prima. Maar nu je toch een grote stap zet, is "één taal over de
  volle stack" het iets-betere antwoord — minder context-switches, betere
  type-delen, minder dingen om te onderhouden. Niet gekozen.
- **Bun in plaats van Node** voor de backend: aantrekkelijk (snel, alles
  built-in), maar minder volwassen en minder breed gedocumenteerd dan
  Node + Express. Niet gekozen — Node is voorspelbaar.
- **tRPC** in plaats van handgeschreven Express-routes: zou type-safety
  end-to-end geven. Maar drie endpoints rechtvaardigen geen tRPC-laag;
  een gedeeld `src/shared/types.ts` is meer dan voldoende. Niet gekozen.
