# 26. Splits-planning: subgroepen als eerste-klas-burger

- Status: Proposed
- Groep: Voorkeuren & ranking
- Supersedes/raakt: [ADR-022](022-samen-en-splits-transparantie.md) (samen-en-splits — uitgewerkt van transparantie-vraag naar planning-eenheid), [ADR-025](025-kunnen-willen-moeten-zullen.md) (KUNNEN-samen is de intersectie; alles erbuiten is splits-werk)

## Context

ADR-025 maakt zichtbaar dat van bv. 54 attracties slechts 42 voor *iedereen
samen* haalbaar zijn (KUNNEN-intersectie). De resterende 12 zijn rides waar
minstens één lid uitgesloten is (🙅 / 🌱 / 🍂) — niet noodzakelijk omdat
niemand wil, maar omdat niet iedereen mág of kán.

Vandaag verdwijnen die 12 in een grijze zone. Twee gevoelens leven daar door
elkaar:

1. **"Niemand mag dwingen"** — we willen niet dat iemand 😰 of 🥱 noodzakelijk-
   aanwezig moet zijn omdat anders een wens niet doorgaat. ADR-025 weegt dit
   met MOETEN-tellers, maar lost het niet op.
2. **"Wat als we splitsen?"** — door tijdelijk uit elkaar te gaan kan elk
   subset doen waar het 😍 of 🙂 voor is. Maar splitsen heeft zelf een kost:
   minder samen-tijd, meer logistiek, meer reshuffling.

ADR-022 (samen-en-splits-transparantie) noemde splits, maar liet de
*planning-eenheid* impliciet. Dit ADR maakt splits-momenten en
splits-configuraties eerste-klas-burgers in het model, met meetbare
pijn-assen.

## Decision

### Drie kernbegrippen

| Term | Definitie |
|---|---|
| **Splits-rit** | Een rit die niet door de hele geselecteerde groep gedaan kan worden zonder dat iemand MOET. De groep splitst tijdelijk. |
| **Splits-configuratie** | Een unieke partitie van de groep over deelsubgroepen voor één splits-moment. Bijvoorbeeld `{papa, Max, Anna}` doet de rit, `{mama, Louiza}` blijft achter. |
| **Splits-moment** | Eén logisch moment in de daginvulling waarbij een specifieke splits-configuratie geldt. Eén configuratie kan meerdere achtereenvolgende rides afhandelen → één moment. |

Een dag kan dus zo gestructureerd worden:

```
SAMEN-blok        : 42 rides
SPLITS-moment A   : configuratie {papa+kids ≥ 1.20m | mama+Louiza}  → 8 splits-rides
SPLITS-moment B   : configuratie {mama+oudsten | papa+jongste}      → 3 splits-rides
SAMEN-blok        : weer iedereen
```

### Twee pijn-assen voor splits

Splits-pijn is bewust niet één scalair. Twee getallen worden naast elkaar
gerapporteerd:

| As | Wat het meet | Lage waarde = | Hoge waarde = |
|---|---|---|---|
| **Complexiteit** | aantal unieke splits-configuraties | weinig handoffs, eenvoudige planning | veel reshuffling, vermoeiend |
| **Duur** | aantal splits-rides (over alle configuraties heen) | korte tijd weg-van-elkaar | lange tijd weg-van-elkaar (minder "gezellig") |

Een gezin van 4 met 1 splits-configuratie × 8 rides scoort `1 / 8`. Een ander
gezin met 4 configuraties × 2 rides elk scoort `4 / 8`. Beide hebben evenveel
splits-rides, maar de tweede vraagt veel meer logistieke aandacht. De UI moet
beide cijfers tonen zodat gebruikers zelf kunnen kiezen wat zwaarder weegt.

### Wat is een geldige splits-configuratie?

Voor één splits-rit `r`:

- **Actieve subgroep** = leden die de rit doen.
- **Wachtende subgroep** = leden die ondertussen iets anders (of niets) doen.

Beperkingen op de configuratie zijn niet absoluut maar via een
**moeite-budget**-parameter regelbaar (zie volgende sectie):

1. **Forced-aantal in elke subgroep ≤ `tol`** — bij `tol = 0` mag de
   actieve subgroep niemand bevatten die 😰 of 🥱 is voor `r`, en de
   wachtende subgroep niemand voor wie het wachten zelf een opoffering
   is. Bij hogere `tol` wordt een beperkt aantal forced-leden geaccepteerd.
2. **Begeleiding-haalbaarheid in elke subgroep** — geen kind alleen achter
   zonder volwassene; geen kind op een rit zonder begeleider als die nodig
   is. Voeding uit [ADR-021](021-begeleiding-haalbaarheid.md). Niet
   onderhandelbaar.
3. **De wachtende subgroep mag passief zijn** — dit ADR verplicht *niet*
   dat zij ondertussen ook een 😍-rit doen. Suggesties voor de wachtende
   subgroep zijn een tweede laag (zie volgende secties).

### Moeite-budget als regelbare parameter

Splits-pijn en MOETEN-pijn zijn uitwisselbaar — een gezin kan kiezen tussen
"minder splits, meer MOETEN" en "meer splits, geen MOETEN". Dit ADR
introduceert daarom een instelbaar **moeite-budget** als groeps-parameter:
een geheel getal `tol ≥ 0` dat aangeeft **hoeveel forced-leden per
beslissing toegestaan zijn**.

Het budget geldt **uniform** op drie beslismomenten:

1. **Samen-blok-besluit** — een rit telt als samen als ≤ `tol` leden in de
   groep forced zijn voor die rit.
2. **Splits-configuratie-besluit** — een actieve subgroep is geldig als ≤ `tol`
   leden erin forced zijn.
3. **Subset-merging** — configuratie A mag in B versmelten als het verschil-
   lid in B's rides niet uitgesloten is en het totale forced-aantal in B
   nog ≤ `tol` blijft. Bij `tol = 0` is subset-merging dus uitgesloten.

Een hoger `tol` betekent **minder splits, meer MOETEN**. Een lager `tol`
betekent **meer splits, minder MOETEN**. De grafiek (splits-rides,
MOETEN-rides) over `tol` is monotoon — `tol` schuift de trade-off-curve.

`tol` is in eerste instantie **één groeps-instelling**, default `0`. De
UI mag labels koppelen aan integer-waarden (`0` = "streng / niemand
gedwongen", `1` = "lichte opoffering OK", etc.) — die labeling is een
UI-keuze, niet model-laag. Een per-park-override is wenselijk (een
Plopsaland-dag voelt anders dan een Efteling-dag) maar bewust uitgesteld
tot het algoritme staat.

Praktisch gevolg: **dezelfde rit kan onder verschillende `tol`-waarden in
een ander blok belanden**. Bij `tol = 0` eindigt een rit waar papa 😰 op
is in de splits-blok; bij `tol = 1` kan hetzelfde rit in de samen-blok
zitten (papa gaat mee onder MOETEN-vlag). De UI-cijfers verschuiven mee —
dat is precies waarom de regelaar bestaat.

### Suggesties voor de wachtende subgroep

Tijdens een splits-moment doet de wachtende subgroep idealiter iets dat
voor *hen* 😍 of 🙂 is. Twee lagen:

1. **Welke rides KAN de wachtende subgroep samen doen?** Pure intersectie
   over de wachtenden — een mini-KUNNEN-samen voor de subgroep. Eerste
   implementatie: lijst per splits-moment, gesorteerd op WILLEN voor de
   wachtenden.

2. **Welke daarvan liggen geografisch dicht bij de actieve rit?** Vereist
   ride-coördinaten als data-laag (latitude/longitude of park-grid).
   Vandaag is dat veld er niet — bewust uitgesteld tot park-geografie
   gemodelleerd wordt (zie open vragen). Tot die tijd: alle wachtenden-
   rides worden voorgesteld zonder afstand-filter.

### Eén splits-moment per configuratie, niet per rit

Twee rides met dezelfde geldige splits-configuratie tellen samen als **één
splits-moment** maar **twee splits-rides**. Dat is de hele kern van het twee-
assen-onderscheid: dezelfde configuratie hergebruiken kost minder
complexiteit, ook al duurt het langer.

### Algoritme (eerste implementatie)

Greedy, niet bewezen-optimaal, maar voldoende voor MVP. Parameter `tol ≥ 0`
= moeite-budget (aantal forced-leden per beslissing toegestaan):

```
input:  rides, members, prefs, tol
output: { samen: [rides], splits: [{ configuratie, rides, wachtenden_kan: [rides] }], onmogelijk: [rides] }

1. Samen-blok-pass:
   - Voor elke ride: bereken behavior per lid.
   - Tel forced-leden (😰 of 🥱 én noodzakelijk-aanwezig per ADR-025).
   - Als forced-count ≤ tol én niemand 🙅/🌱/🍂 → samen-rit.
2. Voor de rest (rides die het samen-budget overschrijden of waar iemand 🙅/🌱/🍂 is):
   - Bepaal actieve subgroep: leden met behavior in {😍, 🙂} (geen forced),
     aangevuld met tot `tol` forced leden als dat de actieve subgroep
     levensvatbaar maakt (begeleiding-haalbaar).
   - Wachtende = rest van de groep.
   - Als actieve leeg of begeleiding-haalbaarheid faalt → "onmogelijk-zonder-moeten".
   - Anders: hash de actieve subgroep als configuratie-id.
3. Groepeer splits-rides per configuratie-id.
4. Subset-merging-pass (alleen bij tol ≥ 1):
   - Voor elke configuratie A: bestaat er configuratie B waarin A ⊂ B en
     het verschil-lid voor A's rides geen exclusie (🙅/🌱/🍂) heeft?
   - Zo ja én het forced-totaal in B na merge ≤ tol blijft: voeg A's
     rides toe aan B, drop A. Het verschil-lid in A's rides telt als
     forced (🥱-acceptatie) tegen B's budget.
5. Voor elke overblijvende configuratie: bereken `wachtenden_kan` =
   rides die de wachtende subgroep onderling KAN-samen doen (met `tol`
   forced-budget binnen die subgroep). Suggesties voor de wachtenden —
   geen verplichting.
6. Return: samen-rides, splits-configuraties met rides + suggesties,
   onmogelijk-zonder-moeten-rides.
```

### Wat te tonen op park-detail

Naast de bestaande verb-pills (KUNNEN/WILLEN/MOETEN/ZULLEN) een vijfde blok:

```
+ 12 rides via 2 splits-configuraties (10 rides totaal):
  • Configuratie A · 8 rides : papa+Max+Anna gaan · mama+Louiza blijft
  • Configuratie B · 2 rides : mama+Anna gaan · papa+rest blijft
+ 2 rides ALLEEN met MOETEN haalbaar
```

De pillen kunnen compact:

```
[ SPLITS  2 cfg · 10 rides ]
```

Met een uitklap-detail per configuratie.

### Splits vs. MOETEN

Splits is altijd preferent over MOETEN in dit ADR's voorkeur-volgorde. Pas
als een rit *niet kan* via splits (geen volwassene zonder 😰/🥱 beschikbaar
als begeleider) komt MOETEN in beeld. Dit verandert de verb-pill-interpretatie
in ADR-025:

- **MOETEN** in ADR-025 was "iemand is forced". Dat blijft de meting.
- Maar **SPLITS** wordt eerste-keus-oplossing voor uit-KUNNEN-samen-vallende
  rides. Pas als splits ook niet kan, is MOETEN het laatste redmiddel.

In de UI kan dat zichtbaar worden door MOETEN-rides expliciet als
"onvermijdelijk" te markeren — splits-rides als "vermijdbaar via splits".

## Consequences

### Positief

- **De grijze zone tussen KUNNEN-samen en MOETEN krijgt taal en cijfers.**
  Niet "12 rides die niet samen kunnen" maar "12 rides via 2 splits-momenten".
- **Twee pijn-assen geven gezinnen keuzevrijheid.** Een gezin dat
  reshuffling haat kiest het park met `1 cfg × 8 rides`. Een gezin dat
  splits ervaart als "samen pauzeren" kan ermee leven dat `4 cfg × 2 rides`.
- **Splits wordt eerste-keus-oplossing boven MOETEN.** Dat reflecteert hoe
  echte gezinnen omgaan met "papa houdt niet van draaiers" — ze splitsen,
  ze dwingen niet.
- **Voedt later park-vergelijking.** Een park kan een lage WILLEN-score
  hebben maar nul splits-moment-pijn (alles is samen-haalbaar) — dat is een
  ander profiel dan een hoge WILLEN-score met 5 configuraties.

### Negatief / risico

- **Algoritme is greedy en niet bewezen-optimaal.** Subset-merging staat
  erin maar zoekt geen globaal minimum. Latere iteratie als de output in
  praktijk niet voldoet.
- **Tolerantie als nieuwe regelaar voegt UX-complexiteit toe.** Risico:
  gebruikers begrijpen niet wat "streng/gemiddeld/soepel" voor *hun* dag
  betekent. Mitigatie: live-preview-effect — verschuiven van de regelaar
  toont onmiddellijk hoe de cijfers veranderen.
- **Wachtenden-suggesties zonder afstand-filter kunnen misleidend zijn.**
  Een rit "voor de wachtenden" die geografisch aan de andere kant van het
  park ligt is geen echte optie. Tot park-geografie er is moet de UI dat
  expliciet aangeven ("suggesties zonder afstand-check").
- **Toevoeging van een vijfde verb-blok riskeert UI-bloat.** Compact houden;
  uitklapbaar maken; alleen tonen als > 0.

### Open vragen

- **Park-geografie als laag**: ride-coördinaten of een park-grid zijn nodig
  om wachtenden-suggesties op afstand te filteren (50m vs 1km wandelen
  maakt het verschil tussen "leuk" en "niet doen"). Vereist datamodel-
  uitbreiding (lat/lng per ride of zone-id) én curatie. Idealiter ook voor
  splits-rits-volgorde: rides in dezelfde configuratie groeperen die
  geografisch bij elkaar liggen. Bewust uit MVP — magisch gevolg voor later.
- **Tolerantie per-park**: vandaag één groeps-instelling. Een
  Plopsaland-dag voelt anders dan een Efteling-dag — wenselijk dat
  gebruikers per-park een afwijkende `tol`-waarde kunnen kiezen. Uitgesteld
  tot het algoritme staat en de groep-brede instelling getest is.
- **Voorkeur "ik laat me niet splitsen"** als persoonlijke instelling — bv.
  "papa wil niet alleen achterblijven", "Louiza wil altijd bij mama". Niet
  hier; aparte uitbreiding van het voorkeur-model.
