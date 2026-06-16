# Backlog

Lopende stapel werk die nog niet (volledig) is opgepakt. Eén item per regel
zodat snelle scans mogelijk blijven.

## Verhouding tot ADRs

- **ADR** = vastgelegde beslissing (huidige stand, met motivatie).
- **Backlog** = werk dat die beslissing concreet maakt, of werk waarvoor nog
  geen beslissing nodig is.

Als een item een dragende keuze met zich meebrengt → eerst (of tegelijk) een
ADR. Als het gewoon uitvoering is van iets dat al in een ADR staat → backlog
volstaat.

## Status-emoji

- 🟢 klaar om op te pakken (richting helder)
- 🟡 onderzoek/ontwerp nodig vóór uitvoering
- 🔵 wacht op iets externs (bv. React-herbouw)
- ⚪️ idee, nog niet besloten of we het doen

## Items

### Voorkeuren & ranking

- 🔵 **Wizard voor toevoegen van een lid** — gerichte vragen (leeftijd,
  primaire interesse, harde "nooit"-eigenschappen) zetten type- en
  eigenschap-voorkeuren ineens scherp. Zie [ADR-006](adr/006-ranken-op-plezier.md).
  Wacht op React-herbouw ([ADR-020](adr/020-frontend-en-admin-stack.md)).
- 🔵 **Defaults gederiveerd uit geboortejaar** voor leden zonder wizard-input.
  Vangnet zodat een nieuwe gebruiker met lege invoer geen "alles telt mee"-ranking
  krijgt. Zie [ADR-006](adr/006-ranken-op-plezier.md).
- 🔵 **Begeleiding-haalbaarheid als alarm-badge** — aantal volwassenen
  vergelijken met piek-gelijktijdige begeleidingsvraag, tonen naast plezier-
  score. Zie [ADR-021](adr/021-begeleiding-haalbaarheid.md).
- 🔵 **Samen/deels/splits-cijfers op park-detail** — drie afgeleide getallen
  bovenaan, per rit een mini-indicator wie wel/niet kan. Zie
  [ADR-022](adr/022-samen-en-splits-transparantie.md).
- 🟡 **Favorieten-weging herzien** — nu telt een "dol op" 2× een "oké". Pas
  herzien wanneer de wizard betere voorkeur-data oplevert; misschien grover
  (3× fav vs 1× rest), misschien preciezer. Zie open vraag in
  [ADR-006](adr/006-ranken-op-plezier.md).

### Productafbakening

- 🔵 **React-herbouw afronden** — gaande bij start van deze backlog. Veel
  bovenstaande items hangen hieraan.
