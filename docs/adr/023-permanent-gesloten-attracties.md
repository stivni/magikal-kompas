# 23. Permanent gesloten attracties markeren in plaats van schrappen

- Status: Accepted
- Groep: Data, rollen & opslag

## Context

Parken vernieuwen voortdurend: een attractie verdwijnt, een nieuwe komt erbij.
De tag-agent ([tools/tag-agent-full.md](../../tools/tag-agent-full.md)) merkt
zulke verschuivingen op door de bestaande JSON te kruisen met de actuele
parksite. Twee opties drongen zich op voor "deze attractie staat niet meer
op de parksite":

1. **Schrappen** uit het park-bestand.
2. **Markeren** als gesloten en in de data laten staan.

Schrappen is verleidelijk omdat het de lijst compact houdt, maar gooit ook
context weg die we eerder hebben opgebouwd:

- Lengte- en leeftijds-eisen die de admin ter plaatse heeft geverifieerd
  (`tag_source: "admin"`, `tag_confidence: "verified"`). Die zijn niet
  zomaar terug te halen.
- Type en eigenschappen die de admin handmatig heeft gecorrigeerd.
- Herkenbaarheid in oudere bezoekverslagen: "weet je nog, Tam Tam Aventure?"
  blijft een legitieme vraag, ook nadat de attractie weg is. Zonder spoor in
  de data verdwijnt die haak.

Tegelijk mogen gesloten attracties niet meetellen in matching of ranking —
ze zijn er gewoon niet meer.

## Decision

Verdwenen attracties worden **gemarkeerd**, niet geschrapt. Vier optionele
velden op een ride:

- **`closed`**: `true` (bevestigd gesloten), `"unknown"` (twijfel — staat
  niet meer op de parksite, maar er is geen bron die het bevestigt) of
  weggelaten/`false` (open). De drie-statussen-vorm dekt de werkelijkheid
  van de tag-agent: zekerheid is niet altijd te krijgen.
- **`closed_year`**: jaar van sluiting (integer) of `null` als onbekend.
- **`closed_source_url`**: link naar een bron die de sluiting bevestigt
  (parknieuws, lokale pers, themepark-tracker). Optioneel bij
  `closed: "unknown"`.
- **`closed_verify`**: `true` als de admin het nog moet checken. Standaard
  `true` bij `closed: "unknown"`.

### UI-behandeling

Zowel in de **admin-UI** als de **publieke UI** wordt een gesloten attractie
visueel onderscheiden: grijs uiterlijk, naam doorgehaald. Een kleine pill
("gesloten · 2024" of "te verifiëren") maakt expliciet wat de status is en
laat de admin meteen ingrijpen.

In de **berekeningen** (matching, ranking, `parkMetrics`) tellen gesloten
attracties **niet** mee — `closed === true` of `"unknown"` filtert ze weg uit
de actieve ride-set. De totalen ("X/Y haalbaar") gebruiken alleen open rides.

### Bij `closed: "unknown"`

De admin krijgt in de admin-UI een duidelijk "te verifiëren"-signaal en kan
één van drie dingen doen:

- bevestigen → `closed: true` + `closed_year` + `closed_source_url`,
  `closed_verify: false`;
- weerleggen → `closed` weglaten/`false` zetten (de attractie blijft
  gewoon open);
- in twijfel laten — dan blijft `closed_verify: true` staan tot een
  volgende ronde.

## Consequences

- Het park-bestand groeit langzaam aan met "geschiedenis"-entries; voor de
  schaal van Magikal Kompas (≈9 parken, enkele tientallen rides per park)
  blijft dat ruim binnen wat een statische app aankan
  ([ADR-009](009-statische-app-data-los.md)).
- Code die de actieve ride-set bepaalt moet leren `closed` te respecteren.
  Een centrale helper voorkomt dat individuele views het zelf moeten doen.
- Eerder geverifieerde admin-data blijft beschikbaar als referentie wanneer
  een sluiting later wordt teruggedraaid (een opnieuw geopende attractie
  hoeft niet vanaf nul opgemeten te worden).
- De tag-agent en de admin delen dezelfde data-shape; geen aparte "graveyard"-
  bestanden of parallelle dataset nodig.
- Toekomst / open vragen:
  - Of "gesloten"-rides apart getoond worden in de publieke UI (in een eigen
    sectie onderaan) of stilzwijgend uit zicht blijven. Voorlopig: filteren
    uit de actieve lijst is genoeg; een aparte sectie kan later als de
    nood er is.
  - Of we ook een `reopened_year` of `replaced_by` willen voor parken die
    iets sluiten en kort daarna iets nieuws op dezelfde plek bouwen. Niet
    bouwen tot we de eerste keer tegen het missen ervan aanlopen.

## Considered alternatives

- **Gewoon schrappen.** Compact, maar gooit geverifieerde admin-data weg en
  breekt de herkenbaarheid in oudere bezoekverslagen. Niet gekozen.
- **Aparte `closed-rides.json` per park** (graveyard). Twee bronnen van
  waarheid voor "kent dit park ride X?" — extra ceremonie zonder voordeel
  ten opzichte van een vlag op de ride zelf. Niet gekozen.
- **Booleaanse `closed`-vlag zonder `"unknown"`-status.** Dwingt de tag-agent
  om bij elke verdwenen attractie een definitieve uitspraak te doen, ook
  zonder bron. Pakt slecht uit in praktijk: de helft van de gevallen is
  echt twijfelachtig. Drie-statussen-vorm gekozen.
- **`closed` meetellen in de score, maar gemerkt als 0 plezier.** Zou de
  ride zichtbaar houden in rankings; maakt de score onleesbaar omdat
  "haalbaar" en "bestaat nog" door elkaar gaan lopen. Niet gekozen.
- **Een aparte `status: "open" | "closed" | "unknown"`-string i.p.v.
  `closed`-vlag.** Generieker, maar suggereert een bredere status-machine
  dan we hebben. Niet gekozen — `closed` met de drie waarden is precies
  scherp genoeg.
