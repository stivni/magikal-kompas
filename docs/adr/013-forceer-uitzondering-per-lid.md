# 13. Forceer-uitzondering per lid en per attractie

- Status: Withdrawn (zie [Update](#update))
- Groep: Voorkeuren & ranking

## Context

Het type/eigenschap-model uit [ADR-005](005-voorkeuren-per-lid.md) is bewust
grofkorrelig en daardoor overdraagbaar naar parken die het gezelschap nog niet
kent. Er zijn echter attracties die de assen niet vatten: een lid is dol op
achtbanen maar haat juist die ene specifieke rit, of vindt één toestel een
topper terwijl het type maar "oké" scoort. ADR-005 hield die forceeroptie open
onder "Toekomst / open vragen"; in de praktijk leeft ze al in de code en de UI,
maar was ze nog niet als bewuste keuze vastgelegd.

## Decision

Per (lid, attractie) bestaat één status — **♥ / auto / ✕**, default `auto`:

- **♥** ("love"): het lid zegt zelf "deze wil ik". Telt mee als favoriet
  (joy-waarde 2, gelijk aan "dol op" uit ADR-005), en overrulet het oordeel
  dat anders uit de type- en eigenschap-voorkeuren zou worden afgeleid.
- **auto**: geen uitzondering; de afleiding uit de assen geldt.
- **✕** ("no"): hard nee voor dit lid op deze attractie. Even hard als NOOIT
  op een eigenschap (ADR-005): de attractie valt volledig weg voor dat lid.

De uitzondering hoort bij het lid, niet bij de attractie: ze leeft op de
ledenkaart-data ([ADR-007](007-drie-datalagen.md)) en reist mee bij delen
([ADR-008](008-opslag-per-toestel.md)). De UI noemt het "Forceer per lid
(jouw uitzondering)", per attractie uitklapbaar.

Forceeruitzonderingen zijn highlights, geen volledig oordeel: niemand vult ze
in voor honderden attracties, en dat hoeft ook niet. Het type/eigenschap-model
blijft het hoofdmodel — deze laag is afwerking voor wat de assen niet vatten.

## Consequences

- ✕ werkt symmetrisch met NOOIT: één soort hard nee, geen tweede variant met
  afwijkende semantiek.
- ♥ overrulet de afleiding uit de assen — dat is de bedoeling, want het lid
  weet beter dan het model wat het zelf wil.
- De drie waarden vormen één trap (geen aparte schalen voor positief en
  negatief), consistent met de drietrappen in ADR-005.
- Toekomst / open vragen:
  - Een tussenniveau ("topper" bovenop ♥) als één positief niveau te grof
    blijkt.
  - ♥-signalen als bron voor suggesties ("vond X leuk, dan ook Y") binnen
    hetzelfde type of dezelfde eigenschappen — een aparte beslissing voor een
    eigen ADR, wanneer de vorm helderder is.

## Considered alternatives

- **Schaal (1–5 sterren) per attractie**: schijnprecisie en vermoeiend om in
  te vullen, en niet consistent met de drietrappen elders (ADR-005).
  Niet gekozen.
- **Alleen ♥, geen ✕**: laat de "wel haalbaar volgens de assen, toch niet
  voor mij"-gevallen onopgelost en breekt de symmetrie. Niet gekozen.
- **Per-attractie-rating als hoofdmodel, assen weg**: niet overdraagbaar naar
  onbekende parken — een rating van toestel X zegt niets over toestel Y in
  een ander park. De assen blijven juist nodig om die brug te slaan.
  Niet gekozen.
- **Uitzondering bij de attractie in plaats van bij het lid**: zou de
  ledenkaart leger houden, maar de uitzondering is een uitspraak van het lid
  en hoort daar conceptueel thuis — en moet meereizen met dat lid bij delen.
  Niet gekozen.

## Update

De per-rit forceeruitzondering vervalt: in de parkmode bestaat de uitklap-met-
editor niet meer (zie [ADR-012](012-twee-taken-in-de-ui.md)), en `joy()`
honoreert `forceOv` niet langer. "Aanpassingen" verhuizen naar wereldniveau via
de admin (zie [ADR-019](019-admin-foto-curatie.md) en latere admin-ADRs);
favorietsignalen op attractieniveau worden later opnieuw bekeken in een eigen
beslissing. Bestaande `forceOv`-data in localStorage of deel-URL's blijft
inert behouden om bestaande links niet te breken, maar is niet meer instelbaar
en weegt niet meer mee.
