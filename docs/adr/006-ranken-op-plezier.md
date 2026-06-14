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
- Toekomst / open vragen: weging (bv. favorieten zwaarder dan "oké"-ritten) is nu
  eenvoudig gehouden; fijnere weging kan later indien de ranking te grof aanvoelt.

## Considered alternatives

- **Alleen gemiddelde**: verbergt het kind dat buiten de boot valt. Niet gekozen.
- **Alleen zwakste schakel**: kan een sterk park onderwaarderen omdat één lid weinig
  wil. Niet gekozen.
- **Eén vaste samengestelde score**: ontneemt de gebruiker de keuze die juist
  situatie-afhankelijk is. Niet gekozen.
