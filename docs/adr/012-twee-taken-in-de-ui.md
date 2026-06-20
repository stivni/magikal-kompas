# 12. UI rond twee concrete taken

- Status: Accepted
- Groep: Productafbakening

## Context

De vorige hoofdnavigatie had twee tabs: "Welk park?" en "Per lid". De eerste
beantwoordt een echte beslissingsvraag van de gebruiker; de tweede was eerder
analytisch ("wat kan dit kind in elk park?") en zelden de aanleiding voor een
sessie. Wie de tool opent, doet dat doorgaans omdat één van twee taken zich
aandient: een park kiezen, of — eenmaal het park gekozen — beslissen welke
attracties eerst.

## Decision

We structureren de hoofdnavigatie rond exact die twee taken:

1. **Welk park?** — parken gerankt op groepsplezier, langs de lens uit
   [ADR-006](006-ranken-op-plezier.md).
2. **Wat eerst?** — voor één gekozen park: alle attracties gerankt op totale
   groeps-joy, hoogste eerst.

Het beheer van het gezelschap zelf — leden toevoegen, lengtes/voorkeuren bewerken,
gasten opzij zetten — is een *setup-taak* en bewust géén derde nav-tab. Het leeft op
een aparte route `#/deelnemers` (zie [ADR-017](017-hash-routing-voor-tab-en-park.md))
bereikbaar via een pill in de chrome. De pill toont de telling (bv. "4/6 vandaag mee")
zodat de gebruiker zonder klik weet waar hij staat; klikken brengt hem naar de
beheer-pagina met de volle viewport-breedte.

Het park in tab 2 wordt op twee manieren gekozen: parkpicker bovenaan (default =
het top-gerankte actieve park), of door in tab 1 op een parkkaart te klikken —
de kaart heeft geen eigen detailweergave; de klik leidt rechtstreeks naar tab 2
met dat park geselecteerd. Uitsluiten gebeurt met een kleine knop op de kaart
zelf (zie [ADR-010](010-parken-uitsluiten.md)), niet via een uitklapper.

Ride-score per attractie = som van de joy-waarde (favoriet 2, oké 1, exclusie 0)
over de aangevinkte leden die de attractie haalbaar vinden. Niet-haalbare leden
en harde uitsluiters tellen voor 0; ze blokkeren de attractie niet. Ties: meer
favorieten → meer haalbare rijders → alfabetisch.

## Consequences

- De volgorde-lijst gebruikt geen lens: de gebruiker wil één concrete volgorde,
  niet twee. Eerlijkheid tussen leden komt al tot uiting in tab 1.
- Per-lid-analyse ("wat kan dit kind alleen?") vervalt als eigen tab. Die info
  blijft beschikbaar via de uitgeklapte ledenkaart en de per-attractie-dots in
  tab 2.
- De rangschikking negeert reistijd en wachtrijen bewust: dat is dag-data, geen
  voorkeurs-data. Toekomst / open vragen: of begeleidersbelasting (samen
  haalbaar versus splitsen) zwaarder mee moet wegen in de volgorde.

## Considered alternatives

- **"Per lid" als derde tab behouden**: minder strikt task-oriented; de nieuwe
  tab zou concurreren met een view die zelden een beslissing aanstuurt. Niet
  gekozen.
- **Lens hergebruiken in tab 2** (zwakste / gemiddeld): doublure met tab 1 en
  geen duidelijke meerwaarde — een attractie-volgorde is per definitie één
  lijst. Niet gekozen.
- **Groeperen zoals in tab 1 (samen / kleintjes / deels / niet) maar gerankt**:
  behoudt structuur, maar mengt twee beslissingen ("voor wie?" en "in welke
  volgorde?") in één lijst. Niet gekozen — de gebruiker vroeg expliciet om één
  volgorde op score.
