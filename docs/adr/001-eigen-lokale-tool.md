# 1. Eigen, lokale tool zonder verdienmodel

- Status: Accepted
- Groep: Productafbakening

## Context

Een gezelschap met kinderen van uiteenlopende lengtes (en soms een petekind) wil per
pretpark kunnen bepalen: wat is haalbaar, loont het de moeite om te gaan, en hoeveel
begeleiders zijn nodig. De relevante parken liggen in de Benelux en Frankrijk. Twee
zaken zijn essentieel en in bestaande oplossingen zwak vertegenwoordigd: het
onderscheid tussen zelfstandig en onder begeleiding rijden, en een rekensom voor het
aantal begeleiders. De gegevens veranderen per seizoen en moeten onderhoudbaar zijn.

## Decision

We bouwen een eigen, zelf te hosten tool zonder commercieel oogmerk. We optimaliseren
voor één gezin dat de tool gebruikt en eventueel deelt met vrienden, niet voor groei,
gebruikersaantallen of opbrengst.

## Consequences

- Beslissingen mogen "goed genoeg voor ons" zijn; geen schaal- of monetisatie-eisen.
- Onderhoud van attractiedata is de structurele kostenpost, niet hosting of techniek.
- Toekomst / open vragen: mocht het ooit breder gedeeld worden, dan verschuift de
  afweging (privacy, datakwaliteit als belofte). Die deur staat open maar wordt nu
  niet ingebouwd.

## Considered alternatives

- **Bestaande ride-height-tools** (Tall to Ride, diverse apps): gericht op
  Disney/Universal en grote ketens; missen het Benelux/Frankrijk-aanbod, het
  alleen/begeleid-onderscheid en de begeleidersrekensom. Niet gekozen omdat de kern
  van onze behoefte er net buiten valt.
- **Tool met verdienmodel** (affiliate, abonnement): legt schaal- en
  onderhoudsdruk op die niet past bij een privégebruik. Niet gekozen.
