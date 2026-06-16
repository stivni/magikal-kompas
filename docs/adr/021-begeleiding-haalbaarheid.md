---
status: Proposed
---

# 21. Begeleiding-haalbaarheid als eigen signaal naast plezier

- Status: Proposed
- Groep: Voorkeuren & ranking

## Context

[ADR-006](006-ranken-op-plezier.md) rankt parken op plezier en toont
begeleidersbehoefte ernaast, maar zegt niets over of het gezelschap die
begeleiding ook kán leveren. In de praktijk staat `begNeeded` vandaag voor "het
maximum aantal kinderen dat op één rit tegelijk begeleiding nodig heeft". Of
dat aantal past binnen het aantal volwassenen in het gezelschap wordt niet
gecheckt.

Voor wie met kleine kinderen reist is dat een gat: een park dat hoog scoort op
plezier kan in de praktijk onhaalbaar zijn omdat de volwassenen niet rondkomen
zonder dubbel aan te schuiven. "Dubbel aanschuiven" is precies de pijn die
deze tool wil vermijden.

## Decision

We introduceren een derde signaal-as naast haalbaarheid (lengte/leeftijd) en
plezier (voorkeuren): **begeleiding-haalbaarheid**.

- Een rit telt als "begeleidingsknelpunt" wanneer méér leden de toestand
  `begeleid` hebben dan er volwassenen in het actieve gezelschap zijn.
- "Volwassene" is afgeleid uit geboortejaar (≥ leeftijdsgrens die de toestand
  `zelf` voor de meeste attracties ontgrendelt — vermoedelijk 16, te
  bevestigen bij implementatie).
- Per park tonen we hoeveel ritten een knelpunt opleveren. Indien > 0
  verschijnt een alarm-badge naast de plezier-score.
- De rang-sortering blijft onveranderd: dit signaal mengt zich niet in
  `minFav`/`avgFav`. De gebruiker ziet het ernaast en oordeelt zelf, in lijn
  met de filosofie van [ADR-006](006-ranken-op-plezier.md).

## Consequences

- Het alarm is een hint, geen blokkade. Een gezin van twee volwassenen + drie
  kleine kinderen blijft alle parken zien, maar weet meteen welke parken
  praktisch lastig worden.
- "Volwassene" is een afleiding, geen rol. We voegen geen aparte
  `role: "adult"`-veld toe; geboortejaar volstaat en is al verplicht voor
  andere checks ([ADR-016](016-leeftijdsregels-en-ontbrekende-data.md)).
- Implementatie wacht op de React-herbouw ([ADR-020](020-frontend-en-admin-stack.md)).
- Toekomst / open vragen:
  - Of "splitsen-bereidheid" een gezelschapsinstelling moet worden (een gezin
    dat splitst heeft minder vaak een knelpunt). Voorlopig niet — eerst zien
    of het signaal nuttig is.
  - Of we per rit moeten differentiëren ("opa kan dit kind wél begeleiden,
    maar niet díe"). Vermoedelijk overkill voor de doelgroep.

## Considered alternatives

- **Begeleiding meewegen in de plezier-score**: verstopt de afweging in een
  formule. Strijdig met [ADR-006](006-ranken-op-plezier.md). Niet gekozen.
- **Park uitsluiten bij knelpunt**: te bot. Het kan voor sommige gezelschappen
  wél werkbaar zijn (verschillende strategieën, één volwassene blijft met
  kleinste). Niet gekozen.
- **Alleen tonen, geen alarm**: leest als "verstopt in detailweergave". De
  pijn rechtvaardigt een zichtbare badge. Niet gekozen.
