# Tag-agent — opdracht (één run per park)

Doel: voor één park de attractielijst ophalen en elke attractie objectief taggen
met **type** en **eigenschappen**, mét **bron** en **zekerheid**. Smaak hoort hier
NIET thuis — alleen feiten over de attractie.

## Werkwijze
1. Neem het bestaande `data/parks/<slug>.json` als startpunt (namen + hoogtes staan er al).
2. Zoek per attractie de echte gegevens op (parksite, coaster-database, fanwiki).
3. Vul `type`, `props`, `tag_source: "web"`, `tag_confidence`, `source_url` in.
4. Verander NOOIT de smaak-laag of de gezelschaps-data. Bewerk alleen wereld-data.
5. Schrijf het bestand terug in hetzelfde formaat (zie `data/schema.md`).

## Regels voor zekerheid
- `high`  : expliciet bevestigd op een betrouwbare bron (parksite / RCDB e.d.).
- `med`   : sterk afgeleid uit beschrijving/foto's, niet letterlijk bevestigd.
- `low`   : gok op naam/thema; **markeer voor menselijke controle**.
- Laat bij twijfel `low` staan i.p.v. te raden met te veel zelfvertrouwen.

## Eigenschappen — wat objectief op te zoeken is
- `inversies`: heeft de baan loopings/over-de-kop? (vaak letterlijk vermeld)
- `donker`: indoor / darkride? (vermeld op parksite)
- `hoog` / `snel`: uit hoogte/snelheid of het type + schaal.
- `nat`: waterattractie? word je echt nat? (let op: watergevecht kan droog blijven)
- `draait` / `schommelt`: uit het bewegingsmodel.

## Belangrijk
- Geef per attractie de `source_url` mee. Zonder bron → `tag_confidence: low`.
- Een agent die op het web zoekt kan overtuigend fout zitten: de admin blijft
  eindredacteur en kijkt minstens alle `low`-gevallen na.
- Reproduceer geen auteursrechtelijke teksten of foto's; vat feitelijk samen.

## Types-vocabulaire
Gebruik exact de types uit `data/schema.md`. Kies het dominante bewegingsmodel,
niet de thematisatie (een ruimteschip dat schommelt is `pirate_ship`).
