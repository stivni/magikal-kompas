# 7. Drie datalagen met eigen eigenaarschap

- Status: Accepted
- Groep: Data, rollen & opslag

## Context

In de tool leven twee soorten waarheid die makkelijk door elkaar lopen. Data over de
wereld — een attractie ís nat, heeft een maximumlengte, is een schommelschip — is voor
iedereen gelijk en moet gezaghebbend zijn. Data over een gezelschap — lengtes, smaak,
wie meegaat — is van één gebruiker en mag door niemand anders aangeraakt worden. De tool
is bedoeld om te delen met externen, dus die scheiding moet ook over rechten gaan, niet
alleen over weergave.

## Decision

We onderscheiden drie lagen met expliciet eigenaarschap:

1. **Wereld-data** (parken, attracties, types, eigenschappen, hoogtegrenzen): leeft in
   de repo, beheerd door de admin. Externen zien deze als vast.
2. **Gezelschaps-data** (leden, lengtes, voorkeuren, uitzonderingen): privé per
   gebruiker, alleen door die gebruiker te bewerken.
3. **Feit-correcties**: alleen in admin-modus; verlopen via export naar een commit op de
   repo.

## Consequences

- Externen kunnen feiten niet vervuilen: de afscherming zit in repo-toegang (git), niet
  in een knop in de UI. De admin-modus is een gemak, geen beveiliging.
- Een externe kan lokaal in admin-modus van alles wijzigen, maar kan het niet
  publiceren — alleen wie commit-rechten heeft, verandert de canonieke data.
- De grens tussen smaak-uitzondering (privé) en feit-correctie (wereld) is bewust
  getrokken: het eerste mag iedereen voor zichzelf, het tweede alleen de admin.
- Toekomst / open vragen: als externen feiten zouden mogen voorstellen, dan via een
  apart voorstel-/goedkeuringspad — bewust niet nu gebouwd.

## Considered alternatives

- **Alles vrij bewerkbaar**: elke gebruiker overschrijft elkaars feiten; geen
  gezaghebbende bron. Niet gekozen.
- **Alles admin-only**: ontneemt gebruikers hun eigen smaak-uitzonderingen. Niet gekozen.
- **Echte serverbeveiliging op feiten**: overkill voor data die toch publiek in de repo
  staat; git-toegang is de natuurlijke grens. Niet gekozen.
