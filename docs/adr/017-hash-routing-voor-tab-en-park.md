# 17. Hash-routing voor tab en gekozen park

- Status: Accepted
- Groep: Productafbakening

## Context

De app bestaat uit één HTML-pagina met twee taken (zie
[ADR-012](012-twee-taken-in-de-ui.md)): "Welk park?" en "Wat eerst?". Tot nu
woonde de UI-state — welke tab open is en welk park gekozen — uitsluitend in
JavaScript-variabelen. Resultaat: een refresh op "Wat eerst?" landde terug op
"Welk park?", en de keuze van het park ging verloren. Ook deel-links binnen één
toestel ("kijk eens naar deze attractie in dit park") waren niet mogelijk zonder
de gebruiker eerst door beide tabs te laten klikken.

Een gewone path-router (`/wat-eerst/efteling`) zou een server-side SPA-fallback
nodig hebben. De app draait op GitHub Pages (zie
[ADR-009](009-statische-app-data-los.md)) zonder rewrites; dat zou een 404-truc
of een buildstap vragen die niet in verhouding staat tot de baat.

## Decision

We gebruiken **hash-routing** als bron van waarheid voor twee stukjes UI-state:
de open tab en het gekozen park in "Wat eerst?".

Routes:

- `#/parken` — tab "Welk park?".
- `#/wat-eerst` — tab "Wat eerst?", park wordt automatisch ingevuld (top
  gerankt).
- `#/wat-eerst/<slug>` — tab "Wat eerst?" met expliciet gekozen park. Slug =
  lowercase, accenten gestript (NFD), niet-alfanumerieke runs als `-`.
- `#/deelnemers` — beheer-pagina voor het gezelschap (huishouden + gasten).
  Bereikbaar via de pill in rail/topbar en als redirect-doel voor een lege
  party (zie [ADR-011](011-leeg-gezelschap-voor-nieuwe-gebruiker.md)).

Bij elke tab- of park-wissel doet de app `history.replaceState` met de
bijhorende route. Een `hashchange`-luisteraar reageert op browser-back/forward.

De bestaande `#c=…` deel-link voor gezelschap (zie
[ADR-008](008-opslag-per-toestel.md)) blijft ongewijzigd: die wordt eerst
geïmporteerd en uit de hash gestript, daarna neemt de route-laag over.

## Consequences

- Refresh op "Wat eerst?" met park X gekozen, blijft op park X. Idem voor de
  tab-keuze.
- Park-keuze is deelbaar via copy-paste van de URL — handig binnen één
  toestel, of als bookmark.
- We gebruiken `replaceState` (geen `pushState`): een tab-wissel mag niet
  uitlopen op een lange browser-history. De hashchange-luisteraar dekt
  back/forward voor wie expliciet een URL in de balk plakt.
- Slugs zijn stabiel-Engels-achtig (geen vertaling). Park-namen zijn vandaag
  ASCII; de NFD-strip dekt toekomstige accenten zonder kapotte URLs.
- Een onbekende slug valt netjes terug op "auto-kies top-gerankt park" en de
  hash wordt rechtgezet.
- Geen build- of server-wijziging: blijft compatibel met statische hosting.

## Considered alternatives

- **Path-routing (`/wat-eerst/efteling`)**: vereist SPA-fallback. Voor GitHub
  Pages betekent dat een `404.html`-truc of migratie naar een platform met
  rewrites. Niet in verhouding tot de baat — niet gekozen.
- **`localStorage` voor `selectedPark` en `tab`**: lost refresh op, maar geeft
  geen deelbare URL en is per-toestel. De hash kost ongeveer evenveel code en
  doet beide. Niet gekozen.
- **Geen routing, alleen tab-state onthouden**: minimaal, maar laat de
  "deelbare park-link"-baat liggen die nu gratis meekomt. Niet gekozen.
- **`pushState` i.p.v. `replaceState`**: zou elke tab- of park-wissel een
  history-entry geven. Voor een app die je veel klikt, geeft dat een
  back-button die nooit terug naar de pagina ervoor gaat. Niet gekozen.
