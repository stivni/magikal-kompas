# 6. Parken ranken op plezier, langs twee lenzen

- Status: Accepted
- Groep: Voorkeuren & ranking

## Context

Een park met veel haalbare attracties is niet hetzelfde als een park waar iedereen uit
het gezelschap zich vermaakt. Ranken op een kaal aantal of op een gemiddelde verbergt
net het kind dat zich zou vervelen. We willen parken vergelijken op werkelijk plezier,
en we willen recht doen aan zowel "niemand verveelt zich" als "de groep haalt er
maximaal uit" — die twee kunnen tegengesteld wijzen.

## Decision

We ranken parken op favorieten: attracties die voor een lid zowel haalbaar (lengte) als
gewenst (voorkeuren, niet uitgesloten) zijn. De gebruiker kiest per keer de lens:

- **Zwakste schakel**: het minst bediende lid telt; maximaliseert dat niemand zich
  verveelt.
- **Gemiddeld plezier**: het groepsgemiddelde; maximaliseert de totale opbrengst.

Beide waarden zijn altijd zichtbaar; de lens bepaalt alleen de sortering.

## Consequences

- De afweging tussen eerlijkheid (minst bediende) en totaal (groep) ligt expliciet bij
  de gebruiker, niet verstopt in een formule.
- Begeleidersbehoefte en haalbaarheid worden naast de plezier-score getoond, zodat een
  keuze alle dimensies in beeld heeft.
- De ranking is alleen zo goed als de ingevulde voorkeuren. Een leeg gezelschap
  ([ADR-011](011-leeg-gezelschap-voor-nieuwe-gebruiker.md)) en de huidige
  "alles op oké"-default maken dat een nieuwe gebruiker in de praktijk een rang ziet
  die *aantal haalbare attracties* benadert, niet *plezier*. Twee aanvullingen
  (beide nog niet geïmplementeerd, vastgelegd voor de React-herbouw — zie
  [ADR-020](020-frontend-en-admin-stack.md)):
  - **Wizard bij het toevoegen van een lid**: enkele gerichte vragen (leeftijd,
    waar deze persoon vooral voor komt, harde "nooit"-eigenschappen) zetten de
    type- en eigenschap-voorkeuren ineens scherp. Dit is de primaire bron — niet
    een slimmer algoritme dat met weinig data moet raden.
  - **Defaults gederiveerd uit geboortejaar** als vangnet wanneer de wizard wordt
    overgeslagen. Geboortejaar is sowieso al nodig voor leeftijdsregels
    ([ADR-016](016-leeftijdsregels-en-ontbrekende-data.md)), dus de inspanning
    is nul. Default-voorkeuren staan zichtbaar op de ledenkaart en zijn
    overschrijfbaar — geen verborgen aanname.
- Toekomst / open vragen: weging (bv. favorieten zwaarder dan "oké"-ritten) is nu
  eenvoudig gehouden. Met betere voorkeur-data uit de wizard kan dit grover of
  juist preciezer gemaakt worden; eerst de data, dan de weging herzien.

## Considered alternatives

- **Alleen gemiddelde**: verbergt het kind dat buiten de boot valt. Niet gekozen.
- **Alleen zwakste schakel**: kan een sterk park onderwaarderen omdat één lid weinig
  wil. Niet gekozen.
- **Eén vaste samengestelde score**: ontneemt de gebruiker de keuze die juist
  situatie-afhankelijk is. Niet gekozen.
