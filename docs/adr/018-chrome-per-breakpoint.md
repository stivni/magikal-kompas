# 18. Chrome in één plek per breakpoint

- Status: Accepted
- Groep: Productafbakening

## Context

De app heeft een "chrome"-laag (brand, mode-switcher, taal, gezelschap-pill,
deel-knop, instellingen) en een inhouds-laag (parken/attracties). De vorige
opzet had **beide** een appbar bovenaan *en* een sidebar links: op desktop
stonden brand en taal in de appbar terwijl de rest in de sidebar zat — twee
verschillende plekken voor "dezelfde soort dingen". Op mobiel verdubbelde dat
zich in een appbar plus een uitschuifbare sheet. Onnodige cognitieve last:
"waar staat dit ding eigenlijk?"

## Decision

Eén navigatie-oppervlak per breakpoint:

- **Desktop (≥ 961px)**: een **sidebar** links. Bevat alles wat geen
  inhoud is — brand bovenaan, mode-switcher, gezelschap (met telbadge),
  deel-knop en "goed om te weten" in het midden, en een **sticky voet**
  onderaan met taalkiezer + instellingen/over. De voet kleeft aan de
  onderrand van de rail-scroll (`position:sticky;bottom:0`) zodat de
  taalkiezer altijd bereikbaar blijft, ook bij een lang gezelschap.
  Conventie: taalkiezers staan op de meeste sites onderaan; volg dat
  patroon. De appbar is verborgen (`display:none`).
- **Mobiel (≤ 960px)**: een **appbar** bovenaan. Bevat brand, mode-switcher,
  taalkiezer, gezelschap-pill en het tandwiel. De sidebar wordt verborgen en
  schuift op vraag open als full-screen sheet (via de gezelschap-pill of het
  tandwiel). De sheet hergebruikt dezelfde rail-DOM.

Eén React-component (`Chrome.tsx`) verzorgt beide breakpoints. Een
`useIsMobile()`-hook beslist per render welk DOM-fragment getoond wordt
(appbar of sidebar); React mount/unmount alleen wat nodig is bij een
window-resize. Geen verborgen DOM-kopieën meer en geen `onchange`-sync — state
en handlers leven in één component.

De gezelschap-pill (`PartyPill`) krijgt een `variant`-prop (`"rail"` of
`"appbar"`) die alleen layout-details regelt: op desktop een rij met icon,
avatars (max 6) en chev; op mobiel een compactere variant met icon, avatars
(max 3) en geen chev. Beide linken naar `#/deelnemers` (zie
[ADR-017](017-hash-routing-voor-tab-en-park.md)). Dat illustreert het
"chrome ≡ chrome"-principe: één rol, één component, twee vormen afhankelijk
van de beschikbare ruimte.

## Consequences

- Geen "verdubbelde" chrome meer: één blik leert waar dingen zitten.
- Eén component, één bron-van-waarheid voor chrome-state. Bij een
  window-resize switcht React netjes tussen de twee DOM-fragmenten zonder
  parallelle DOM-kopieën te onderhouden.
- Het tandwiel-popover blijft bestaan op mobiel als korte route naar
  "Deelnemers delen" en de ADR-link. Op desktop wordt het popover bereikt
  via de "⚙ Instellingen"-knop in de rail-voet — niet via een eigen knop in
  de chrome, want die zou de "één oppervlak"-regel doorbreken.
- Toekomst / open vragen:
  - Of het tandwiel-popover op termijn helemaal vervalt (de inhoud is nu
    minimaal: één link en één deel-knop, beide al elders aanwezig). Eerst
    zien of de taal-flow en deel-flow stabiel zijn voor we het mes erin
    zetten.

## Considered alternatives

- **Appbar + sidebar samen houden, op beide breakpoints.** De vorige opzet.
  Werkt, maar dwingt de gebruiker te leren waar wát zit — en bij elke nieuwe
  control komt de vraag "appbar of sidebar?" opnieuw terug. Niet gekozen.
- **Alleen een appbar, ook op desktop.** Bespaart een container, maar
  verspilt de horizontale ruimte op desktop en knelt de chrome op mobiel niet
  minder dan vandaag. Niet gekozen.
- **Alleen een sidebar, ook op mobiel (als drawer).** Eén container, maar op
  mobiel verdwijnt elke chrome achter een hamburger — slechter voor
  ontdekbaarheid van de mode-switcher en de telbadge. Niet gekozen.
- **Eén DOM-element met `position`-gebaseerde reflow via CSS.** Klinkt
  elegant, maar vereist trucs (`display:contents` of `subgrid`) die slecht
  schalen wanneer de elementen ook anders moeten ogen per breakpoint
  (pill-grootte, dropdown-richting). Twee kopieën met sync is helderder.
