# 4. Eigenschappen primair afgeleid uit het bewegingstype

- Status: Accepted
- Groep: Attractiemodel

## Context

Met twee assen (ADR-003) en honderden attracties dreigt het invullen van zeven
eigenschappen per attractie onwerkbaar te worden. Een analyse op de eigen data toont
echter dat het bewegingstype de eigenschappen grotendeels vastlegt: een pirate ship
schommelt altijd, koffiekopjes draaien altijd, een speeltuin is nooit eng. Ongeveer
81% van de eigenschap-waarden volgt eenduidig uit het type; de variatie zit
geclusterd in een paar plekken (hoog/snel afhankelijk van schaal, donker afhankelijk
van indoor/darkride, inversies afhankelijk van de specifieke baan).

## Decision

Eigenschappen worden afgeleid uit het type waar dat eenduidig is. Voor de variabele
gevallen gebruiken we heuristieken (hoog/snel uit de minimumlengte, donker uit
indoor/darkride-kenmerken, inversies uit baankenmerken) en blijft handmatige correctie
het sluitstuk. Taggen draait dus primair om het kiezen van het juiste type; de
eigenschappen volgen grotendeels mee.

## Consequences

- Het tagwerk is beheersbaar: vooral het type bepalen, niet 7 vakjes per attractie.
- De afgeleide waarden zijn een vertrekpunt, geen eindpunt; correctie blijft mogelijk.
- Toekomst / open vragen: de huidige afleiding is automatisch en nog ongeverifieerd.
  Eigenschappen als "inversies" en "donker" zijn objectief opzoekbaar op fansites en
  databases — daar is verifiëren duidelijk beter dan afleiden. Dit hoort tot het
  tag-werk per park.

## Considered alternatives

- **Alle eigenschappen handmatig**: maximale precisie, maar onwerkbaar op schaal en
  onnodig voor de 81% die eenduidig volgt. Niet gekozen.
- **Alles afleiden, geen correctie**: snel maar onjuist voor de ~19% variabele
  gevallen die het type niet vastlegt. Niet gekozen.
