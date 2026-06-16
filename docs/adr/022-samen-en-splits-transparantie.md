---
status: Proposed
---

# 22. Samen en splits: transparantie zonder subgroepen-modeling

- Status: Proposed
- Groep: Voorkeuren & ranking

## Context

In een gezelschap met grote spreiding (kleine kinderen + tieners + volwassenen)
verloopt een parkdag zelden volledig samen. Mensen splitsen op, komen weer
samen, doen tussendoor iets afzonderlijk. Vandaag toont de app `samen` (aantal
ritten waar iedereen op kan), maar zegt niets over wat dáárbuiten ligt — terwijl
juist dat de mentale planning stuurt.

We hebben overwogen om "subgroepen" als formeel concept te bouwen (zelf
samenstellen of automatisch voorstellen). De stuurvraag was: lossen we dit op
door te modelleren, of door inzichtelijk te maken? Modelleren riskeert
overengineering vóór we weten dat gebruikers de tool zo gebruiken.

## Decision

We maken inzichtelijk wat er samen kan en waar het gezelschap uiteenvalt, zonder
subgroepen als entiteit te introduceren.

- Per rit in de lijst een mini-indicator: bv. "alle 5 ✓" of "3 van 5" met op
  hover/tap wie wel en wie niet.
- Bovenaan park-detail een samenvatting in drie cijfers:
  - **samen**: aantal ritten waar het hele actieve gezelschap op kan
    (bestaat al);
  - **deels**: aantal ritten waar minstens één lid afvalt;
  - **splits**: aantal ritten waar de groep in twee of meer subgroepen
    uiteenvalt (er valt iemand af én er is een lid van een andere
    leeftijd/voorkeur dat wél kan).
- Geen workflow eromheen: geen "stel een splitsing voor", geen routeplanning.
  De gebruiker leest de getallen en beslist zelf.

## Consequences

- Het gezelschap blijft één geheel in het datamodel. Geen subgroepen, geen
  sessies-per-subgroep, geen extra opslag.
- De cijfers zijn afleidingen uit bestaande per-lid-data; geen nieuwe invoer
  nodig van de gebruiker.
- Wanneer (en als) blijkt dat gebruikers actief op deze cijfers sturen, hebben
  we het gebruikssignaal om alsnog subgroepen te overwegen. Tot dan: niet
  bouwen.
- Implementatie wacht op de React-herbouw ([ADR-020](020-frontend-en-admin-stack.md)).
- Toekomst / open vragen:
  - Of "deels" een nuttige tussenstap is of de gebruiker enkel verwart. Te
    valideren bij eerste use.
  - Of we de samenvatting ook in de park-lijst (niet alleen detail) tonen.
    Voorlopig alleen detail om de lijst niet te overladen.

## Considered alternatives

- **Subgroepen als entiteit**, eventueel met automatisch voorstel ("deze drie
  samen, die twee samen"): te zwaar zonder bewijs dat gebruikers zo plannen.
  Niet gekozen.
- **Niets tonen, gebruiker zoekt het zelf uit per rit**: bestaande gedrag,
  maar dwingt de gebruiker om de mentale rekensom telkens opnieuw te maken.
  Niet gekozen.
- **"Splits" meewegen in de park-rang**: net als bij begeleiding mengen we
  geen praktische haalbaarheid in de plezier-score. Strijdig met
  [ADR-006](006-ranken-op-plezier.md). Niet gekozen.
