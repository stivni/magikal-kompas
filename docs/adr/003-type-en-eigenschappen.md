# 3. Twee assen: bewegingstype en eigenschappen

- Status: Accepted
- Groep: Attractiemodel

## Context

Om te bepalen waar iemand het naar zijn zin heeft, moeten we attracties beschrijven op
een manier die smaak vat. Eén enkel "soort"-label is ontoereikend om twee redenen: een
attractie is vaak meerdere dingen tegelijk (een wildwaterbaan is nat én hoog én snel),
en een vrij soort-label mengt het bewegingsmodel (wat je lichaam voelt) met thema en
schaal (hoe het eruitziet). Voor de vraag "kom ik aan mijn trekken" telt het
bewegingsmodel; thema is ruis. Tegelijk weten mensen scherp wat ze niet willen voelen
(nat, op de kop), los van welk type rit dat is.

## Decision

Elke attractie krijgt twee onafhankelijke assen:

1. **Bewegingstype** — een verfijnde categorie op industriestandaard-model
   (bv. pirate ship, teacups, drop tower, wing coaster), gekozen op beweging, niet op
   thematisatie. Een ruimteschip dat schommelt is een pirate ship.
2. **Eigenschappen** — objectieve feiten over de beleving: nat, hoog, snel, inversies,
   draait, schommelt, donker.

## Consequences

- Het type draagt smaak-generalisatie: wie één schommelschip leuk vindt, vindt ze
  vermoedelijk allemaal leuk — één mening werkt over alle parken.
- Eigenschappen snijden dwars door types en vangen harde uitsluiters ("wat het ook is,
  als het nat maakt: nee").
- Samen lossen ze het kleutertoestel op: een speeltuin-type zonder enge eigenschappen
  valt vanzelf in "voor de kleintjes".
- Toekomst / open vragen: het type-vocabulaire is afgeleid van industriestandaarden
  maar zelf vastgezet; nieuwe parken kunnen types vergen die nog ontbreken.

## Considered alternatives

- **Alleen "soort"**: te grof, mengt beweging met thema, dwingt één-op-één-hokjes.
  Niet gekozen.
- **Alleen eigenschappen**: vangt afkeer goed maar verliest de smaak-generalisatie en
  laat het kleutertoestel (geen enge eigenschappen) ongeplaatst. Niet gekozen.
