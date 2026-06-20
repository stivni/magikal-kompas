# 24. Voorkeur-model: gedragsstaten als afleiding van intensiteits-assen

- Status: Accepted
- Groep: Voorkeuren & ranking
- Supersedes: [ADR-005](005-voorkeuren-per-lid.md) (voorkeuren als prima/liever/nooit op props + 0/1/2 op types)
- Raakt: [ADR-003](003-type-en-eigenschappen.md) (types & eigenschappen — uitgebreid met intensiteits-tags en nieuwe types/props), [ADR-006](006-ranken-op-plezier.md) (zwakste-schakel/gemiddeld-lenzen blijven, voeding wordt rijker), [ADR-021](021-begeleiding-haalbaarheid.md) en [ADR-022](022-samen-en-splits-transparantie.md) (worden gevoed door de nieuwe staten + B-marker i.p.v. losse signaal-assen)

## Context

Het oorspronkelijke voorkeur-model (ADR-005) modelleerde smaak in abstracte
schalen: per type 0 / 1 / 2, per prop prima / liever / nooit. Bij wizard-
ontwerp kwamen drie scheuren bovendrijven:

1. **"Te eng" en "te saai" lopen door elkaar.** Een "nee" op `family_coaster`
   betekent voor een 4-jarige "te eng" en voor een tiener "saai".
2. **Binary props zijn te grof.** `high` op een K3-rollercoaster (5m) en op
   een Nachtwachtflyer (70m) is dezelfde tag voor radicaal verschillende
   beleving.
3. **De sociale dimensie ontbreekt.** "Ga mee voor de groep", "alleen omdat
   ik moet (begeleiden)" en "ik doe iets anders" zijn drie verschillende
   deelnames die alle drie buiten het oude model vielen.

Een eerste iteratie van dit ADR introduceerde zes gedragsstaten. Bij verder
denken bleek het verschil tussen 🙂 ("voor groep") en 😐 ("sla over") niet
houdbaar als afzonderlijke staat — onder-band-deelname hangt af van wat de
groep doet, niet van een intrinsieke persoonseigenschap. Die twee zijn nu
samengevouwen.

## Decision

### Vijf gedragsstaten als output-eenheid

Per persoon per attractie wordt één gedragsstaat afgeleid:

| Staat | Betekenis | Tel voor |
|---|---|---|
| 😍 intrinsiek | "hiervoor kom ik" | echte-interesse-teller |
| 🙂 onder interesse | "kan mee zonder drama, persoon kiest zelf" | participatie-teller |
| 😰 alsmoet | "boven mijn keuze, opofferbaar (té hevig)" | belasting-teller |
| 🙅 nooit | "echt nee — boven grens, prop nooit, of niet haalbaar" | uitgesloten |

Plus één **6e signaal-teller, geen gedragsstaat**:

| Signaal | Betekenis |
|---|---|
| 🌱 groei | "wil wel, mag nog niet (te klein/te jong)" |

🌱 is een **aparte teller naast de 5 staten** — komt niet voor naast 😍/🙂/😰/🙅
in de hoofdtelling. Een ride die 🌱 zou zijn telt niet als 🙅 maar krijgt
zijn eigen signaal: "komend jaar wel". Dat onderscheidt "wil en mag niet" van
"wil niet en kan ook niet".

Een park-rang per persoon volgt rechtstreeks uit deze tellingen:

```
Alex op Walibi:      7😍 · 10🙂 · 1😰 · 2🙅   +3 🌱
Alex op Bellewaerde: 6😍 · 11🙂 · 0😰 · 0🙅   +0 🌱
```

De twee lenzen uit [ADR-006](006-ranken-op-plezier.md) blijven geldig
("zwakste schakel" sorteert op `min(😍)`, "gemiddeld plezier" op
`som(😍 + 🙂)`), maar worden rijker gevoed.

### Park-score formule

```
park_score(persoon) = 3 × 😍 + 1 × 🙂 − 1 × 😰
park_signals       = aantal 🌱 (groei-rides — "komend jaar")
                      aantal 🅱  (begeleidings-belasting, zie verderop)
```

😰 telt nu écht als straf (opoffering kost iets), 🙂 = neutraal positief
(participatie zonder klacht), 😍 = sterk positief. 🌱 en 🅱 zijn
informatieve signalen voor park-keuze.

### Voorkeur-invoer per lid op vijf assen

De gebruiker geeft input op **vijf persoons-assen**; de gedragsstaat per
attractie wordt automatisch afgeleid uit invoer + attractie-tags.

1. **Intensiteit** — twee zaken op één gradient (zie "Interactie-model"):
   - **Interesse-band** (optioneel): aaneengesloten range `[min, max]`
   - **Pijngrens** (optioneel): één niveau waar het te zwaar wordt
2. **Hoogte** — zelfde patroon, beide optioneel:
   - Interesse-band (zelden gebruikt; "ik kom voor de hoogte")
   - Pijngrens (typisch wel gebruikt)
3. **Categorie-interesses** — multi-select op:
   - 💦 **Waterritten** (`water`) — nat-makende rides: `water_ride`, `water_battle`, of andere types met `wet`-prop. Rondvaarten *zijn geen waterritten* — die vallen onder `transport`-type.
   - 🎭 **Belevingsritten** (`story`) — passieve ride-throughs (Droomvlucht-stijl) én andere attracties met sterke `themed`-tag (Vogel Rok).
   - 🎪 **Shows** (`shows`) — type `show`
   - 🎠 **Klassieke kermis** (`classic_fair`) — carrousel, reuzenrad, treintje, retro

   Aangevinkt = 😍 op attracties van die categorie, ongeacht intensiteit.
4. **Discrete props als drietrap** — voor elke prop één van drie staten:
   - 🙂 prima (default)
   - 😰 niet ideaal, maar voor de groep gaat het
   - 🙅 absoluut niet
   - Props: `wet`, `dark`, `scary`, `spins`, `inversions`, `swings`
   - **Niet meer in de drietrap**: `high` (vervangen door hoogte-as), `fast`
     (vervangen door intensiteit-as), `themed` (vervangen door categorie-
     interesse `story`).
5. **Thematisatie-belang** — drietrap die park-keuze beïnvloedt los van
   losse rides:
   - 🏰 veel — gestileerde parken (Efteling, Phantasialand) wegen zwaarder
   - 🎢 matig — default
   - 🎯 niet — alleen mechanische rides interesseren

### Schalen voor de continue assen

**Intensiteit** (5-trap, attractie-tag + persoonsband):

| | Anker | Wat het tagt |
|---|---|---|
| 1 | rustig deinen | passieve beweging, geen schrik-trigger |
| 2 | lichte deining | beweegt mee, herkenbaar veilig |
| 3 | stevige beuk | echte rit, familie-niveau |
| 4 | hou je vast | thrill, hartje slaat over |
| 5 | niet voor watjes | extreme G's, gillen |

**Hoogte** (5-trap, beleving niet meters):

| | Anker | Voorbeeld | Indicatieve hoogte |
|---|---|---|---|
| 1 | voeten op de grond | draaimolen, treintje | 0 m |
| 2 | omhoog, maar je voelt je vast | Bumballoon, Dolle Busrit | 0-5 m |
| 3 | je ziet de hoogte | K3-rollercoaster, Wienerwalz | 5-10 m |
| 4 | hoogte is deel van de thrill | Heidi the Ride, Supersplash | 10-50 m |
| 5 | hoogte ís de thrill | Dalton Terror, Nachtwachtflyer | > 50 m |

Een attractie krijgt twee hoogte-velden: `max_height_m` (data-FYI) en
`height_intensity` (1-5, beleving — wat de filter gebruikt). Een 45m gesloten
gondel (Pagode) krijgt `height_intensity: 3`.

### Detectie-regels — vier persoonsprofielen

Volgorde van checks (eerst-matchende wint):

```
1.  canDo(member, ride) === false:
      if hypothetisch (zonder canDo) zou ≥ 🙂 zijn: → 🌱 (groei)
      else: → 🙅
2.  prop ∈ propChoices waarbij propChoices[prop] === "nooit": → 🙅
3.  height_intensity ≥ heightCeiling (indien gezet): → 🙅
4.  intensity ≥ intensityCeiling (indien gezet): → 🙅
5.  categorie-match ÉN intensity ∈ intensityBand (beide condities gelden): → 😍
    — als één van beide ontbreekt (geen band, ride heeft geen intensity, of alleen catMatch
      zonder in-band) valt de afleiding door naar stap 7.
6.  (was vroeger "in-band alleen → 😍"; vervalt — zie ADR-025 AND-update)
7.  heeft intensityBand gezet?
      ja:  intensity < band[0]               → 🙂
           intensity > band[1]               → 😰 (opofferbaar)
      nee: heeft intensityCeiling gezet?
             ja:  intensity < ceiling        → 😰 (expliciete opoffering)
             nee:                            → 🙂 (geen mening, default)
8.  prop ∈ propChoices waarbij propChoices[prop] === "voorGroep": → 😰
```

### Vier persoonsprofielen samengevat

| Wat ingevuld | Onder band/grens | In band | Boven band, onder grens | Op/boven grens |
|---|---|---|---|---|
| Band + grens (familie-mens) | 🙂 | 😍 | 😰 | 🙅 |
| Alleen band (tiener-thrillzoeker) | 🙂 | 😍 | 😰 | (n.v.t.) |
| Alleen grens (mevrouw zonder voorkeur) | 😰 | (n.v.t.) | (n.v.t.) | 🙅 |
| Niets (default — wizard overgeslagen) | 🙂 | (n.v.t.) | (n.v.t.) | (n.v.t.) |

De "alleen-grens"-positie is bewuste opoffering: persoon zegt "ik heb een
grens, alles eronder is dragen". Lege state is "geen mening uitgesproken,
alles 🙂".

### Interactie-model: tap-to-fill met grens-knopjes

UI-vorm voor intensiteit en hoogte is een **horizontale gradient-bar** met 5
segmenten (groen → rood, dezelfde visuele taal voor attractie-tag en
persoons-band). Handgrepen of sliders worden vermeden (touch-onvriendelijk).

**Twee actie-zones op één gradient** (UI-vorm "C"):
- **Tap op cel** = voeg toe aan / krimp uit interesse-band (groen)
- **Klein ✕-knopje rechtsboven elke cel boven de band** = "pijngrens hier"

Visueel:
```
        ┌────┬────┬────┬────┬────┐
        │ 1  │ 2  │ 3  │ 4  │ 5  │
        │    │    │ ✓  │ ✓  │  ⊗ │
        └────┴────┴────┴────┴────┘
```

**Regels** voor een tik op cel `X` (band-deel; hoogte werkt identiek):

| Huidige band | Tik op `X` | Nieuwe band |
|---|---|---|
| leeg | — | `[X, X]` |
| `[min, max]`, `X > max` | uitbreiden boven | `[min, X]` |
| `[min, max]`, `X < min` | uitbreiden onder | `[X, max]` |
| `[X, X]` (één segment) | — | leeg |
| `[min, max]`, `X = min` (en `min ≠ max`) | krimpen onder | `[min+1, max]` |
| `[min, max]`, `X = max` (en `min ≠ max`) | krimpen boven | `[min, max-1]` |
| `[min, max]`, `min < X < max` | binnen band | onveranderd |

Het ✕-knopje is een aparte single-select: klik = zet pijngrens op dat
niveau; klik nogmaals = verwijder pijngrens.

### Begeleidings-marker (B) — geen aparte signaal-as meer

Het feit *dat* iemand begeleidt op een attractie is een **aparte laag naast
de gedragsstaat**, geen eigen gedragsstaat. Visueel: een kleine B-badge
naast de emoji wanneer `status === "begeleid"`.

```
ST 😍   AL 🙂🅱   EM 🌱   MA 🙂   AN 🙅   LO 😍
             ↑               ↑
       Alex begeleidt    Emma is te klein
```

Daarmee:
- **De oude dotSym-rij** (✓/B/✕/—/?) vervalt — die info zit nu naast de
  gedragsstaat.
- **ADR-021's begeleidings-alarm** wordt gevoed door het optellen van 🅱 per
  persoon: een persoon met veel 🅱 draagt veel begeleidings-last.
- **ADR-022's samen/splits-cijfers** worden afgeleid van de niet-🙅-
  doorsnede over de groep.

### Calibratie-UI: abstract eerst, voorbeelden als feedback

De wizard gebruikt **abstracte ankers** (pretpark-taal + gradient-kleur) als
primaire invoer — geen voorbeeld-attracties als input. Gebruikers kennen
pretpark-attracties verschillend goed.

**Voorbeelden komen wél, maar als feedback** onder de gradient-bar:

```
   ⬆  Te wild     Goliath · Baron 1898 · Ride to Happiness   +3
   ✓  In je band  Joris en de Draak · Vogel Rok · Python    +14
   ⬇  Onder       Carrousel · Halve Maen · Kindertreintje    +9
```

Voorbeelden komen uit de geactiveerde parken (herkenbaar), bij voorkeur met
foto. Live updaten bij elke verandering aan band of pijngrens.

### "Grens bijstellen" voor per-attractie-overschrijving

Een attractie in de "verkeerde" zone is meestal een signaal dat de
persoonsband of -grens nét te krap staat, niet dat de attractie een
uitzondering is. Klikken op een attractie in de feedback-zone toont eerst:

```
Vogel Rok valt boven jouw pijngrens.
[ Schuif pijngrens omhoog tot Vogel Rok past ]   ← primair
[ Toch deze attractie als uitzondering ]         ← secundair, last resort
```

Per-attractie-overschrijving blijft bestaan voor de echte hoekgevallen, maar
de UX duwt eerst naar grens-aanpassen.

### Acceptatiecriteria via omgekeerde testtabel

**Nb (AND-update, ADR-025):** 😍 vereist nu zowel catMatch ÉN in-band. De tabel
hieronder geeft het gedrag voor een attractie **zónder** categorie-match. Voeg
catMatch toe om 😍 te activeren in de in-band-cellen.

| Profiel | band | grens | i=1 | i=2 | i=3 | i=4 | i=5 |
|---|---|---|---|---|---|---|---|
| Tiener thrillzoeker (geen catMatch) | [4,5] | — | 🥱 | 🥱 | 🥱 | 🙂 | 🙂 |
| Tiener thrillzoeker (mét catMatch) | [4,5] | — | 🥱 | 🥱 | 🥱 | 😍 | 😍 |
| Familie-mens (geen catMatch) | [3,4] | 5 | 🥱 | 🥱 | 🙂 | 🙂 | 🙅 |
| Familie-mens (mét catMatch) | [3,4] | 5 | 🥱 | 🥱 | 😍 | 😍 | 🙅 |
| Familie-mens zonder grens (mét catMatch) | [3,4] | ∅ | 🥱 | 🥱 | 😍 | 😍 | 😰 |
| Mevrouw (alleen grens) | ∅ | 3 | 😰 | 😰 | 🙅 | 🙅 | 🙅 |
| Mevrouw + story-interesse op Droomvlucht (i=1, band=∅) | ∅ | 3 | 😰 | 😰 | 🙅 | 🙅 | 🙅 |
| Niets ingevuld | ∅ | ∅ | 🙂 | 🙂 | 🙂 | 🙂 | 🙂 |
| Kind 110cm wil thrills (Goliath zelf=130) | [4,5] | — | 🥱 | 🥱 | 🥱 | 🌱 | 🌱 |

Mevrouw met story-interesse krijgt op Droomvlucht (i=1) nu 😰 in plaats van 😍:
band=∅ → AND kan niet evalueren → catMatch-alleen volstaat niet voor 😍.
Om 😍 te bereiken moet mevrouw ook een intensityBand instellen die i=1 omvat.

Onverwachte uitkomsten in implementatie = signaal om een afleidingsregel te
herzien.

### Datavertrouwen in de afleiding: onbevestigd ≠ afwezig

`props` is een **aanwezigheidslijst**: een prop staat erin (= waar) of niet.
De afleiding leest "niet aanwezig" impliciet als "afwezig" (closed-world). Maar
de data wordt open-world verzameld: "staat er niet in" dekt twee gevallen die we
vandaag niet kunnen scheiden — **"gecheckt, niet van toepassing"** versus **"nog
niet getagd, onbekend"**. Dat knelt juist bij de props waar mensen `nooit` op
zetten (`wet`, `dark`, `scary`).

De schade is **asymmetrisch**, en die asymmetrie stuurt de oplossing:

| Werkelijkheid | Tag | Gevolg voor lid met prop op `nooit` | Kost |
|---|---|---|---|
| prop van toepassing | niet getagd | rit wordt **wél** aanbevolen → slechte ervaring | hoog — vertrouwen kapot |
| prop niet van toepassing | toch getagd | rit onterecht uitgesloten | laag — gemiste rit |

Een *ontbrekende* tag op een hard-avoid prop is veel erger dan een tag te veel —
maar **alleen aan de `nooit`-kant**. Aan de wil-kant (categorie-/band-match) is
een gemiste tag enkel een gemiste 😍: jammer, niet schadelijk.

**Beslissing:**

De spil is niet *wie* de tag zette maar *of een mens de claim verifieerde*. Een
mens kan óók een onzekere gok invoeren; AI kan per definitie nooit verifiëren.
Elke uitsluitings-relevante claim draagt dus een `verified: boolean` (default
`false`, enkel door een mens op `true` te zetten) plus audit-metadata `by` /
`evidence`.

1. **Tri-state per prop, mét expliciete verificatie-status.** `props` wordt een
   map `PropKey → { value: boolean; verified: boolean; by?; evidence? }`;
   ontbrekende key = onbekend. Dat geeft vijf zichtbare statussen op één as
   (voorbeeld `wet`):

   | Status | `value` | `verified` | Wie kon het zetten |
   |---|---|---|---|
   | droog ✓ | `false` | `true` | enkel mens |
   | droog (ongeverifieerd) | `false` | `false` | mens-gok of AI |
   | onbekend | (geen key) | — | default |
   | nat (ongeverifieerd) | `true` | `false` | mens-gok of AI |
   | nat ✓ | `true` | `true` | enkel mens |

   Opslag = twee velden; de vijf labels zijn de afgeleide weergave. De *logica*
   leest `verified`; `by`/`evidence` zijn enkel audit (welke AI-run, welke bron).
   Eén map met `verified` is zuiverder dan twee parallelle lijsten of een
   `src: human|ai`-veld: het scheidt de claim (`value`) van de zekerheid
   (`verified`), zodat ook een onzekere mens-invoer correct als "ongeverifieerd"
   landt.

2. **Markerregel hangt aan verificatie, niet aan auteur.** Voor een lid dat de
   prop op `nooit` heeft:

   | prop-status | uitkomst |
   |---|---|
   | nat ✓ (mens-geverifieerd) | 🙅 nooit |
   | droog ✓ (mens-geverifieerd) | veilig, géén marker |
   | al de rest (ongeverifieerd / onbekend) | marker, mét richting: waarschijnlijk-wel / -niet / geen-info |

   De rit wordt enkel in de twee mens-geverifieerde rijen stil uitgesloten of als
   veilig getoond; daarbuiten blijft hij zichtbaar mét marker en houdt de
   gebruiker regie.

3. **De verificatie-vlag neutraliseert hallucinatie vanzelf.** Een AI-claim is
   altijd `verified: false`, dus een gehallucineerde "droog" geeft sowieso de
   marker — geen aparte veiligheidsregel nodig. Het eerdere verbod ("AI mag op
   `wet`/`dark`/`scary` geen absent schrijven") verschuift daarmee van
   veiligheids- naar **data-hygiëne**-regel: AI kan beter *onthouden* dan "droog
   ongeverifieerd" gokken (zelfde marker, enkel vervuiling). Nuttige AI-output is
   de present-hint ("waarschijnlijk nat — check"). Verder blijft: AI grondt op
   opgehaalde brontekst, zet `evidence`, en onthoudt zonder bron — "zet props
   alleen als je zeker bent" als prompt-tekst is een zwakke garantie, de
   structuur is de echte borging.

4. **Schaarse, krimpende marker.** Verschijnt enkel waar (a) het lid de prop op
   `nooit` heeft én (b) er geen mens-verificatie is; **krimpt één-op-één** met
   elke mens-bevestiging. Zonder de derde toestand kun je enkel kiezen tussen
   *altijd vertrouwen* (onveilig) en *altijd waarschuwen* (ruis); de
   verificatie-as koopt de enige bruikbare optie — *waarschuw alleen waar geen
   mens instond voor ja óf nee*.

5. **Curatie-prioriteit.** Omdat ondertagging asymmetrisch pijn doet, gaat
   mens-verificatie op de hard-avoid props (`wet`/`dark`/`scary`) vóór de
   nice-to-have props.

### Generalisatie: verificatie-status voor álle uitsluitings-parameters

De prop-marker is een speciaal geval. Het algemene principe: **elke parameter die
een harde uitsluiting kan voorstellen verdient een verificatie-status, en
"onbekend" mag nooit stilzwijgend als "geen probleem" gelezen worden.** Dat zit
vandaag al fout — niet enkel bij props maar, met hógere inzet, bij de parkregels:

> In `scoring.ts` geeft een attractie zónder lengte-eis (`beg`/`zelf`/`max`
> allemaal `null`) `lengthState` → `"alleen"` → `canDo` true. Een *ontbrekende*
> eis wordt als *geen* eis gelezen: de app zegt "mag erop" terwijl ze het niet
> weet. Idem leeftijd. Exact hetzelfde open-world-optimisme als bij props, op de
> plek waar een foute "mag erop" het meest kost.

| Parameter | Drijft | Soort feit | "Geverifieerd" = | AI |
|---|---|---|---|---|
| `beg`/`zelf`/`max` | parkregel (canDo) | objectief, park-gepubliceerd | gecheckt tegen officiële bron | redelijk, verwart ritten |
| `min_age_*` / `max_age` | parkregel | objectief, gepubliceerd | idem | redelijk |
| `intensity` (+ `intensityCeiling`) | 🙅 / 😰 | subjectief oordeel (1-5) | mens gekalibreerd op ankers | zwak |
| `height_intensity` (+ `heightCeiling`) | 🙅 | subjectief oordeel | idem | zwak |
| `props` (nooit) | 🙅 | deels objectief / oordeel | mens bevestigd | wisselend |

- **Granulariteit = onafhankelijke kenbaarheid.** Props zijn los kenbaar →
  verificatie *per prop*. Lengte + leeftijd komen samen uit één officiële bron →
  één "parkregels geverifieerd"-vlag voor het cluster volstaat. Intensiteit en
  hoogte-intensiteit zijn elk één oordeel → elk één vlag.
- **Richting blijft asymmetrisch.** Bij elk is *onderschatten* van de drempel de
  dure fout (te lage min-lengte, te lage intensiteit, gemiste prop → "het
  kan/mag" terwijl misschien niet). Verificatie en marker richten zich daarop.

**Géén** verificatie-status nodig: puur-positieve parameters (`type`, `theming`,
`categoryInterests`) en puur-informatieve velden (`top_speed_kmh`, `max_height_m`,
`drop_m`, `g_force`, `duration_s`) — een fout kost daar enkel een zachte
mis-score of gemiste 😍, geen vertrouwen. (FYI-cijfers tellen wél als *evidence*
onder een intensiteit-oordeel, niet als eigen gate.)

Dit raakt [ADR-003](003-type-en-eigenschappen.md) en de
`status`/`lengthState`/`ageState`-logica; de lengte/leeftijd-uitwerking kan een
eigen ADR krijgen als ze groeit. Exacte encodering, de `verified`-drempel en de
migratie van bestaande `props: PropKey[]`-data → backlog (legacy-array lezen als
"alle vermelde props = mens-present, rest onbekend").

## Consequences

- **Begeleiding-haalbaarheid** ([ADR-021](021-begeleiding-haalbaarheid.md)) wordt
  gevoed door 🅱-markers per persoon — niet langer een aparte signaal-as maar
  een view op deze data.
- **Samen/splits-transparantie** ([ADR-022](022-samen-en-splits-transparantie.md))
  wordt gevoed door doorsnedes over de niet-🙅-staten van de groep.
- **De oude dotSym-vinkjesrij** (✓/B/✕/—/?) vervalt. Eén visuele rij per
  attractie met behavior-emoji + B-marker waar nodig.
- **ADR-005** is gesupersedeed.
- **ADR-003** wordt verder uitgebreid:
  - Nieuwe type `story_ride` (vervangt `dark_ride` als typenaam) — pure
    belevingsritten (Droomvlucht-stijl).
  - Nieuwe props: `scary` (bewust eng), `themed` (mate van wereld/verhaal).
  - **Verwijderde props** (uit data én UI): `high` (vervangen door
    `height_intensity`), `fast` (vervangen door `intensity`).
  - Verplichte intensiteits-tags op attractie: `intensity` (1-5),
    `height_intensity` (1-5).
  - Optionele data-velden: `top_speed_kmh`, `max_height_m`, `drop_m`,
    `inversions_count`, `duration_s`, `g_force`.
  - **Park-niveau**: `theming_score` (1-5) als afgeleide of handmatige tag —
    voedt de persoons-as "thematisatie-belang".
- **Wizard 3.0** vervangt de eerdere wizard. Stappen:
  1. Naam + lengte
  2. Discrete props drietrap (6 props i.p.v. eerdere 7)
  3. Intensiteit-band + pijngrens (UI-vorm C)
  4. Hoogte-band + pijngrens (zelfde patroon, optioneel)
  5. Categorie-interesses (4 categorieën) + thematisatie-belang (drietrap)
- **De tag-agent** krijgt de nieuwe tags + ankers; bestaande tagging hoeft
  niet opnieuw te runnen tenzij `high`/`fast` opruimen telt (mechanische
  cleanup, geen web-research).
- Toekomst / open vragen:
  - **Park-kennis vragen** in de wizard om feedback-voorbeelden uit bekende
    parken te kiezen. Bewust uit MVP.
  - **Inclusiviteit & toegankelijkheid** staat los van dit model — eigen
    ontwerpronde voor publieke release.
  - **Rondvaarten als `transport` taggen** — tag-cleanup-actie voor de
    admin: bestaande tag-agent-run kan rondvaarten foutief als `water_ride`
    hebben gemarkeerd.
  - **Score-weging** binnen `3 × 😍 + 1 × 🙂 − 1 × 😰` — pas herzien als de
    weging te grof of te fijn aanvoelt.

## Considered alternatives

- **Doorbouwen op ADR-005** (smaak-ladder verfijnen): pakt symptoom maar niet
  de oorzaak (geen sociale dimensie, "te eng" vs "te saai"-verwarring). Niet
  gekozen.
- **Zes gedragsstaten** (met 🙂 "voor groep" en 😐 "sla over" apart): het
  verschil bleek niet houdbaar als persoonseigenschap — onder-band-deelname
  hangt af van groepscontext, niet van een intrinsieke disposition.
  Samengevouwd tot één 🙂. Niet gekozen.
- **🌱 als 5e gedragsstaat** i.p.v. een aparte teller: zou de visualisatie
  vervuilen ("kan niet" loopt door "geen interesse"). Beter als apart signaal
  naast de 4-staten-telling. Gekozen voor het signaal-model.
- **Per attractie individueel een staat opslaan** (geen afleiding): maximaal
  accuraat, onbeheersbare invoer-last. Beschikbaar als ontsnappingsluik via
  per-attractie-overschrijving. Niet gekozen als hoofd-mechanisme.
- **Sliders met handgrepen**: touch-onvriendelijk, moeilijk precies te raken
  op mobiel. Tap-to-fill op segmenten geeft hetzelfde resultaat zonder dat
  probleem. Niet gekozen.
- **Aparte rij voor pijngrens**: visueel cleaner maar twee elementen i.p.v.
  één voor één concept. UI-vorm C (één gradient, ✕-knopjes voor grens) houdt
  het samen. Niet gekozen.
- **Voorbeeld-attracties als wizard-input** ("Klik 😍 op Goliath"): vereist
  dat de gebruiker de attractie kent. Abstracte ankers met voorbeelden-als-
  feedback gaf het beste van beide. Niet gekozen als input.
- **`dark_ride` behouden als type**: het label vouwt twee verschillende
  ervaringen samen (coaster-in-donker vs belevingsrit). Hernoemen naar
  `story_ride` + `dark`-prop scheidt mechanica van sfeer. Niet gekozen om te
  behouden.
- **`high` en `fast` als props behouden**: redundant naast `height_intensity`
  en `intensity`. Verwijderd zowel uit data als persoon-drietrap. Niet
  gekozen om te behouden.
- **`themed` als persoon-drietrap**: redundant naast categorie-interesse
  `story`. Verwijderd uit persoon-UI; blijft als attractie-tag om de
  categorie-match te voeden (Vogel Rok matcht story-interesse via themed).
  Niet gekozen voor drietrap.
- **Intensiteit via samengestelde formule**: vangt "verrassend wild door
  donker" niet, vereist data die voor veel attracties niet betrouwbaar is.
  Handmatige 1-5 tag met ankers is transparanter. Niet gekozen.
- **"Wildheid" als termnaam**: werkt aan de bovenkant maar voelt raar op
  niveau 1 ("draaimolen heeft geen wildheid"). "Intensiteit" werkt
  consistent over de hele schaal. Niet gekozen als naam.
- **"Sla over"-staat (😐) als aparte gedragsstaat**: bleek niet houdbaar —
  detectie was contextueel (afhankelijk van groep en moment), niet inherent
  aan de persoon. Samengevouwd in 🙂. Niet gekozen.
