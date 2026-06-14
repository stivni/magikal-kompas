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

- **Desktop (≥ 861px)**: een **sidebar** links. Bevat alles wat geen
  inhoud is — brand, taalkiezer, mode-switcher, gezelschap (met telbadge),
  deel-knop, "goed om te weten" en instellingen/over in de voet.
  De appbar is verborgen (`display:none`).
- **Mobiel (≤ 860px)**: een **appbar** bovenaan. Bevat brand, mode-switcher,
  taalkiezer, gezelschap-pill en het tandwiel. De sidebar wordt verborgen en
  schuift op vraag open als full-screen sheet (via de gezelschap-pill of het
  tandwiel). De sheet hergebruikt dezelfde rail-DOM.

Brand en taalkiezer worden in beide breakpoints getoond, maar elk in
**precies één** container — niet beide tegelijk. Concreet: twee DOM-kopieën van
de taalkiezer (`#lang-pill-mob` in de appbar, `#lang-pill-desk` in de rail),
gesynchroniseerd via een korte `onchange`-handler. Eén kopie is zichtbaar per
breakpoint; de andere zit op `display:none`.

## Consequences

- Geen "verdubbelde" chrome meer: één blik leert waar dingen zitten.
- De rail-DOM dient zowel als desktop-sidebar als mobiele sheet. Dat houdt
  state en interacties identiek tussen breakpoints.
- Twee lichte DOM-kopieën (brand-blok en taalkiezer) blijven nodig zolang
  CSS-only oplossingen (zoals `display:contents` + grid-reordering) niet
  toelaten om hetzelfde element op twee plekken te hangen. Een
  `onchange`-sync van enkele regels is goedkoper dan een DOM-move-on-resize.
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
