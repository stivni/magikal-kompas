# 2. Toegankelijkheid in vier toestanden, met betekenisvolle maximumlengte

- Status: Accepted
- Groep: Attractiemodel

## Context

Lengte bepaalt of iemand een attractie mag doen, en zo ja zelfstandig of onder
begeleiding. Attracties hebben een minimumlengte zelfstandig, een (lagere of gelijke)
minimumlengte onder begeleiding, en soms een maximumlengte. Die maximumlengte betekent
twee fundamenteel verschillende dingen: een veiligheidsplafond op een heftige
attractie (alleen relevant voor zeer lange personen) versus "uitgegroeid" voor een
kleutertoestel. Beide gelijk behandelen vertekent de uitkomst: een lang kind lijkt dan
"te groot" voor talloze kleuterritjes, wat geen echte teleurstelling is.

## Decision

We bepalen per persoon-attractie precies één toestand:

- **alleen** — lengte ≥ minimum zelfstandig
- **met begeleider** — minimum zelfstandig > lengte ≥ minimum onder begeleiding
- **te klein** — lengte < minimum onder begeleiding
- **te groot / ontgroeid** — lengte > maximumlengte

De maximumlengte splitsen we op een drempel van 180 cm: ≥180 cm geldt als echte
veiligheidsuitsluiting ("te groot", telt als gemiste attractie); <180 cm geldt als
kindertoestel ("ontgroeid", telt niet mee als gemist en valt uit de noemer van
haalbaarheidspercentages).

## Consequences

- Lange kinderen worden niet afgestraft voor het bestaan van kleutertoestellen.
- Een echt veiligheidsplafond blijft een zichtbare waarschuwing.
- De haalbaarheidspercentages sluiten aan bij de intuïtie "wat had dit kind hier
  willen en kunnen doen".
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
