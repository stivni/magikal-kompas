# Tag-agent — opdracht (één run per park)

Doel: voor één park de attractielijst ophalen en elke attractie objectief taggen
met **type** en **eigenschappen**, mét **bron** en **zekerheid**. Smaak hoort hier
NIET thuis — alleen feiten over de attractie.

## Werkwijze
1. Neem het bestaande `data/parks/<slug>.json` als startpunt (namen + hoogtes staan er al).
2. Zoek per attractie de echte gegevens op (parksite, coaster-database, fanwiki).
3. Vul `type`, `props`, `tag_source: "web"`, `tag_confidence`, `source_url` in.
4. Als je tijdens stap 2 op de officiële parksite belandt: vul ook `park_url`
   in met de directe link naar de attractiepagina. Dit is een ander veld dan
   `source_url` — zie [ADR-014](../docs/adr/014-visuele-en-bron-velden.md).
5. Verander NOOIT de smaak-laag of de gezelschaps-data. Bewerk alleen wereld-data.
6. Schrijf het bestand terug in hetzelfde formaat (zie `data/schema.md`).

## Regels voor zekerheid
- `high`  : expliciet bevestigd op een betrouwbare bron (parksite / RCDB e.d.).
- `med`   : sterk afgeleid uit beschrijving/foto's, niet letterlijk bevestigd.
- `low`   : gok op naam/thema; **markeer voor menselijke controle**.
- Laat bij twijfel `low` staan i.p.v. te raden met te veel zelfvertrouwen.

## Eigenschappen — wat objectief op te zoeken is

Keys zijn stabiel Engels (zie [ADR-015](../docs/adr/015-meertalige-ui.md)) —
gebruik die exact in de `props`-array. UI-labels zijn NL maar staan los van de
data.

- `inversions`: heeft de baan loopings/over-de-kop? (vaak letterlijk vermeld)
- `dark`: indoor / darkride? (vermeld op parksite)
- `high` / `fast`: uit hoogte/snelheid of het type + schaal.
- `wet`: waterattractie? word je echt nat? (let op: watergevecht kan droog blijven)
- `spins` / `swings`: uit het bewegingsmodel.

## Belangrijk
- Geef per attractie de `source_url` mee. Zonder bron → `tag_confidence: low`.
- `source_url` (bron van de tagging, mag fanwiki/RCDB zijn) en `park_url`
  (officiële attractiepagina) zijn aparte velden, niet uitwisselbaar.
- Een agent die op het web zoekt kan overtuigend fout zitten: de admin blijft
  eindredacteur en kijkt minstens alle `low`-gevallen na.
- Reproduceer geen auteursrechtelijke teksten of foto's; vat feitelijk samen.

## Later: CC-foto's (apart te activeren, zie [ADR-014](../docs/adr/014-visuele-en-bron-velden.md))

Geen onderdeel van een standaard-tagrun. Wanneer expliciet gevraagd: zoek per
attractie een vrij gelicenseerde foto (vooral Wikimedia Commons) en vul het
`image`-object in. Zodra `image.url` is ingevuld zijn `license`, `attribution`
en `source_page` verplicht — anders niet invullen. Bij twijfel over de licentie:
sla over. Lokaal bestand opslaan onder `assets/photos/<slug>/<att-slug>.webp`,
geen externe URL als `image.url`.

## Types-vocabulaire
Gebruik exact de types uit `data/schema.md`. Kies het dominante bewegingsmodel,
niet de thematisatie (een ruimteschip dat schommelt is `pirate_ship`).
