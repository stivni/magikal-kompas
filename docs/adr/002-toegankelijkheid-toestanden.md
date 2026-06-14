# 2. Toegankelijkheid in zes toestanden, met betekenisvolle maximumlengte

- Status: Accepted
- Groep: Attractiemodel

## Context

Lengte bepaalt mee of iemand een attractie mag doen, en zo ja zelfstandig of onder
begeleiding. Attracties hebben een minimumlengte zelfstandig, een (lagere of gelijke)
minimumlengte onder begeleiding, en soms een maximumlengte. Die maximumlengte betekent
twee fundamenteel verschillende dingen: een veiligheidsplafond op een heftige
attractie (alleen relevant voor zeer lange personen) versus "uitgegroeid" voor een
kleutertoestel. Beide gelijk behandelen vertekent de uitkomst: een lang kind lijkt dan
"te groot" voor talloze kleuterritjes, wat geen echte teleurstelling is.

Sinds [ADR-016](016-leeftijdsregels-en-ontbrekende-data.md) hebben we naast lengte ook
een **leeftijdsas** (sommige parken hanteren een minimumleeftijd) en het besef dat
ledendata gewoon kan ontbreken. Dat vereist twee extra toestanden naast de
oorspronkelijke vier.

## Decision

We bepalen per persoon-attractie precies één toestand. We berekenen de toestand per
as (lengte en leeftijd) en combineren met "strengste wint":

- **alleen** — haalbaar zonder begeleider (lengte ≥ zelfstandig én leeftijd ≥
  zelfstandig, voor zover die regels bestaan)
- **begeleid** — haalbaar met begeleider (één van beide assen vraagt begeleiding)
- **te klein** — lengte < minimum onder begeleiding
- **te jong** — leeftijd < minimum onder begeleiding (analoog aan "te klein", maar
  op de leeftijdsas; zie [ADR-016](016-leeftijdsregels-en-ontbrekende-data.md))
- **te groot / ontgroeid** — lengte > maximumlengte, óf leeftijd > maximumleeftijd
- **onbekend** — er geldt een regel op een as waarvoor het lid geen waarde heeft
  ingevuld, of de beschikbare precisie laat geen eenduidig verdict toe
  (bv. geboortejaar zonder maand, op een regel waar het lid net rond de drempel
  zit) — we durven het verdict niet te geven

`te klein`, `te jong` en `te groot` tellen als gemiste attractie. `ontgroeid` en
`onbekend` tellen niet als gemist en vallen uit de noemer van
haalbaarheidspercentages — bij `onbekend` toont de UI bovendien een aansporing om de
ontbrekende waarde in te vullen.

De maximumlengte splitsen we op een drempel van 180 cm: ≥180 cm geldt als echte
veiligheidsuitsluiting ("te groot"); <180 cm geldt als kindertoestel ("ontgroeid").

## Consequences

- Lange kinderen worden niet afgestraft voor het bestaan van kleutertoestellen.
- Een echt veiligheidsplafond blijft een zichtbare waarschuwing.
- De haalbaarheidspercentages sluiten aan bij de intuïtie "wat had dit kind hier
  willen en kunnen doen".
- Leeftijd is een eigen as geworden; dezelfde "strengst-wint"-combinatie geldt voor
  elke nieuwe as die er ooit bij komt.
- Toekomst / open vragen: de 180 cm-grens is een aanname die voor onze parken klopt
  (echte plafonds rond 195, kleutertoestellen rond 140-150). Indien een park een max
  van bv. 160 cm als echte grens hanteert, moet de drempel instelbaar worden of een
  per-attractie-vlag krijgen.

## Considered alternatives

- **Maximumlengte altijd als blokkade**: technisch eenvoudig maar vervuilt de
  uitkomst met loze "te groot"-meldingen op kleuterritjes. Niet gekozen.
- **Maximumlengte negeren**: voorkomt valse uitsluitingen maar verliest de echte
  veiligheidswaarschuwing. Niet gekozen.
- **Eén enkele drempel zonder onderscheid**: kan niet beide gevallen correct
  weergeven. Niet gekozen.
