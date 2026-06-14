# 10. Parken uitsluiten van de berekening

- Status: Accepted
- Groep: Data, rollen & opslag

## Context

De wereld-data (ADR-007) bevat alle parken die de tool kent. In de praktijk wil een
gezelschap soms een park niet meenemen in de vergelijking: te ver, al gepland, niet
relevant deze zomer. Tot nu toe was elk park altijd zichtbaar in de ranking en in de
"Per lid"-tellingen.

## Decision

Een park kan per toestel "uit de berekening" worden gehaald. Uitgesloten parken
verschijnen niet in de gesorteerde lijst en tellen niet mee in de "Per lid"-statistieken.
Ze blijven onderaan zichtbaar in een aparte sectie "Niet meegerekend" met een knop om ze
weer mee te nemen.

De uitsluitingen worden bewaard in dezelfde [[opslag-per-toestel]] (`localStorage`) als
de rest van de gezelschaps-state, onder de sleutel `excludedParks`.

De uitsluitingen reizen **niet** mee in de [[deel-link]]: het is een toestel-eigen
voorkeur, niet een eigenschap van een lid. Wie op een ander toestel werkt, kan zijn eigen
keuze maken.

## Consequences

- De gebruiker krijgt grip op de lijst zonder dat hij parken permanent uit de wereld-data
  moet kunnen verwijderen — admin-correcties (ADR-007) blijven het kanaal voor structurele
  wijzigingen aan de wereld.
- Re-includen is altijd één klik: parken worden niet vergeten, alleen gemarkeerd.
- "Per lid"-statistieken volgen dezelfde filter; cijfers blijven consistent met wat in de
  ranking telt.
- Geen migratie nodig voor bestaande gebruikers: ontbrekende `excludedParks` betekent
  niets uitgesloten.

## Considered alternatives

- **Parken volledig verbergen, niet meer terugvindbaar**: simpel, maar vergeten parken
  kunnen niet meer terugkomen zonder de localStorage te wissen. Niet gekozen.
- **Uitsluitingen meesturen in de deel-link**: zou twee gebruikers met dezelfde link
  dezelfde park-keuze geven. Niet gekozen — de keuze hoort bij wie de tool gebruikt,
  niet bij het gezelschap. Wie het toch wil delen, kan ter plaatse afspreken.
- **Per-lid uitsluitingen ("dit park interesseert Sofia niet")**: te fijnmazig voor het
  doel; bestaande voorkeuren (types, eigenschappen, forceer-uitzonderingen) dekken dit
  al per attractie.
