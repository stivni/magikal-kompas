# 5. Voorkeuren per lid, op beide assen, met harde uitsluiter

- Status: **Superseded** door [ADR-024](024-voorkeur-model-gedragsstaten.md)
- Groep: Voorkeuren & ranking

> **Achterhaald.** Het model van "dol op / oké / nee" op types en "prima /
> liever / nooit" op props bleek bij wizard-ontwerp drie scheuren te hebben:
> "te eng" en "te saai" lopen door elkaar, binary props zijn te grof (K3-
> rollercoaster vs Nachtwachtflyer beide `high`), en de sociale dimensie
> ontbreekt ("mee voor de groep" ≠ "alleen om te begeleiden" ≠ "ik haak af").
> [ADR-024](024-voorkeur-model-gedragsstaten.md) vervangt dit met vijf
> gedragsstaten als afleiding van intensiteits-assen + categorie-interesses.
> Onderstaande blijft staan als leesbaar pad-naar-deze-keuze.

## Context

Smaak verschilt per persoon en hoort conceptueel bij wie die persoon is — naast de
lengte. We hebben twee assen om voorkeuren op uit te drukken (ADR-003): bewegingstype
en eigenschappen. We moeten kiezen hoeveel nuance een gebruiker per as kan geven, en
hoe een conflict beslecht wordt wanneer iemand dol is op een type maar één eigenschap
ervan verafschuwt (bv. houdt van waterbanen maar wil absoluut niet nat worden).

## Decision

Per lid leggen we voorkeuren vast op beide assen:

- **Per type**: dol op / oké / nee.
- **Per eigenschap**: een drietrap — prima / liever niet / NOOIT.

NOOIT is een harde uitsluiter: een attractie met die eigenschap valt volledig weg,
ongeacht hoe geliefd het type is. "Liever niet" is een minpunt dat de aantrekking
verlaagt zonder uit te sluiten. Lengte én voorkeuren wonen samen op één ledenkaart, zodat
een lid één geheel is (lengte + typevoorkeuren + eigenschap-filters).

## Consequences

- De afkeer-kant is scherp regelbaar; mensen weten beter wat ze niet willen dan wat ze
  precies wel willen.
- Een geliefd type kan nooit een absolute weigering overrulen — dat is de bedoeling.
- Voorkeuren en lengte staan bij elkaar; er is geen los voorkeuren-scherm meer.
- Per-attractie-uitzonderingen ("dit ene toestel wél/niet") voor gevallen die
  de twee assen niet vatten, bestaan als forceer-laag per lid en zijn
  vastgelegd in [ADR-013](013-forceer-uitzondering-per-lid.md).

## Considered alternatives

- **Tweetrap (oké / NOOIT) per eigenschap**: te grof, verliest het "liever niet"-minpunt.
  Niet gekozen.
- **Vijfpuntsschaal per eigenschap**: schijnprecisie en vermoeiend in te vullen, zonder
  betere ranking. Niet gekozen.
- **Optellen zonder harde uitsluiter**: laat een geliefd type een absolute weigering
  overstemmen, wat niet strookt met hoe mensen "nooit" bedoelen. Niet gekozen.
