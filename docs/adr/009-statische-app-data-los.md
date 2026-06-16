# 9. Statische app met data los van code

- Status: Accepted
- Groep: Data, rollen & opslag

## Context

Het onderhoud van de tool draait om data: parken en attracties toevoegen of bijwerken,
seizoen na seizoen. Dat mag geen herbouw van de hele applicatie vergen. Alle matching
gebeurt lokaal, dus de data wordt in de client ingeladen — geen runtime-backend voor
de eindgebruiker.

## Decision

Data staat los van code: per park een JSON-databestand. De frontend (React, zie
[ADR-020](020-frontend-en-admin-stack.md)) importeert die bestanden via Vite's
bundeling tijdens de build. De gepubliceerde versie is **statisch** — `dist/`
bevat HTML, JS-bundels en assets en wordt 1-op-1 door GitHub Pages geserveerd.
Geen runtime-server voor eindgebruikers.

Een park toevoegen is: een JSON-bestand erbij + `npm run build`.

Lokaal werken vereist een dev-server (Vite voor de frontend, Express voor het
admin-backend) — `file://` openen wordt niet meer ondersteund. Dat valt samen
met de migratie naar ES modules (zie [ADR-020](020-frontend-en-admin-stack.md))
en is in de praktijk geen verlies: ontwikkelen gebeurde toch al via een
lokale HTTP-server.

## Consequences

- Parken toevoegen of corrigeren raakt de applicatiecode niet — alleen een
  rebuild via `npm run build`.
- De productie-versie blijft zonder backend te hosten (GitHub Pages, statisch).
- De wereld-data staat versioneerbaar in de repo (sluit aan op ADR-007).
- Vite-build vervangt de oude handgemaakte `data/build-data.mjs`-stap. Data
  wordt rechtstreeks geïmporteerd in de TS-code; de bundler doet de rest.
- Toekomst / open vragen: alle data wordt nu vooraf ingeladen. Dat schaalt prima tot in
  de honderden parken (orde grootte honderden KB tot enkele MB tekst). Daarboven is de
  uitweg lui-laden via dynamic imports — Vite ondersteunt code-splitting per park
  zonder extra werk. Het echte plafond is tag-onderhoud, niet de downloadgrootte.

## Considered alternatives

- **Alle data inline in de code**: vermengt onderhoud van data met code en dwingt
  herbouw bij elke wijziging. Niet gekozen.
- **Losse databestanden via runtime-fetch**: modulair, maar geeft een extra
  netwerkronde per park bij eerste bezoek. Bundling-bij-build is voor onze
  schaal gratis en sneller. Niet gekozen als basis; blijft optie voor lazy-load.
- **`file://`-openbaarheid behouden** door classic scripts + meerdere `<script>`-tags:
  technisch mogelijk, maar belet ES modules en de moderne tooling-stack
  (zie [ADR-020](020-frontend-en-admin-stack.md)). In de praktijk werd `file://`
  toch al niet gebruikt — dev draait altijd via een server. Niet gekozen.
