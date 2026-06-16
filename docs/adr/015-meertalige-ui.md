# 15. Meertalige UI met stabiele datasleutels

- Status: Accepted
- Groep: Productafbakening

## Context

De app is vandaag NL-only: `<html lang="nl">`, UI-strings staan hardcoded in
[index.html](../../index.html) en [app.js](../../app.js), de eigenschapssleutels
in de data zijn Nederlandse woorden (`"hoog"`, `"snel"`, `"nat"`, `"donker"`,
`"draait"`, `"schommelt"`, `"inversies"`), en het veld `oms` is een vrije
NL-tekst. De bewegingstypes (`thrill_coaster`, `family_coaster`, …) zijn al
Engels-sleutels — die kant is dus al hybride.

Drie dingen kleuren waarom dit nu speelt:

- **Publiek dat overschrijdt.** De parken in [data/parks](../../data/parks) zijn
  BE/NL/Frans/Duits van origine. Een gezelschap met een Franstalig of
  Engelstalig lid is realistisch; vandaag vallen die terug op vertalen-in-het-hoofd.
- **Bronnen die meertalig zijn.** De tag-agent ([tools/tag-agent.md](../../tools/tag-agent.md))
  put uit parksites (vaak meertalig), RCDB (EN), Wikipedia/Wikimedia (per taal).
  Stabiele sleutels in de data maken dat agentwerk goedkoper: één keer taggen,
  meerdere labels uit één map renderen.
- **Geen commercieel product.** [ADR-001](001-eigen-lokale-tool.md) zegt: eigen,
  lokale tool. Een volledig vertaalplatform met CMS is overdreven. Maar de basis
  zo leggen dat een tweede taal *erbij* kan, kost nu weinig en is later duur.

## Decision

Drie lagen, drie aanpakken — gespiegeld aan [ADR-007](007-drie-datalagen.md).

### 1. UI-chrome — JSON per taal, in de app-laag

Alle zichtbare strings uit `index.html`/`app.js` verhuizen naar
`i18n/<lang>.json`, met platte sleutels:

```json
{
  "app.tagline": "Lengtes zetten, voorkeuren ingeven, …",
  "tab.plan": "Plannen",
  "tab.tag": "Taggen",
  "party.empty": "Nog geen gezelschap.",
  "footer.disclaimer": "Magikal Kompas is een onafhankelijke …"
}
```

`nl.json` is de bron-van-waarheid: ontbrekende sleutels in andere talen vallen
expliciet terug op NL (geen lege string, geen sleutel-zichtbaar-in-UI). Een
kleine `t(key)`-helper in [app.js](../../app.js) doet de lookup; HTML krijgt
`data-i18n="key"`-attributen die bij `init()` ingevuld worden.

Talen in MVP-volgorde: **NL** (vandaag), **EN** (breedste bereik, bronnentaal),
**FR** (BE-Walloniê + Franse parken). DE later als iemand het nodig heeft.

### 2. Vocabulaire-sleutels — Engels, stabiel, vertaald via map

De eigenschapssleutels in de data worden hernoemd naar stabiele Engelse keys:

| Oud (NL) | Nieuw (key) |
|---|---|
| `hoog` | `high` |
| `snel` | `fast` |
| `nat` | `wet` |
| `donker` | `dark` |
| `draait` | `spins` |
| `schommelt` | `swings` |
| `inversies` | `inversions` |

Types (`thrill_coaster`, …) waren al stabiel — die blijven. De UI rendert via
een vertaaltabel in `i18n/<lang>.json` onder `props.*` en `types.*`. Dit lijnt
ook met hoe types al werken in [data/schema.md](../../data/schema.md).

Migratie: één keer over alle parkbestanden, plus de tag-agent-prompt aanpassen.
Sleutels niet vertalen in de data was de oorspronkelijke fout — nu rechtzetten
is goedkoper dan later met meer parken.

### 3. Vrije tekst — optioneel per taal, fallback naar NL

`ride.oms` (omschrijving) en `image.attribution` zijn vrije tekst. Twee vormen
naast elkaar toegestaan:

```json
"oms": "Snelle achtbaan met inversies"
```

of, zodra een tweede taal nodig is:

```json
"oms": { "nl": "Snelle achtbaan met inversies", "en": "Fast coaster with inversions" }
```

Een string wordt gelezen als "deze tekst, in de bron-taal (NL)". Een object
biedt vertalingen; ontbrekende taal valt terug op `nl`, dan op de string-vorm,
dan op leeg. Park- en attractienamen blijven eigennamen — geen vertaling.

### Taalkeuze en opslag

De actieve taal wordt bepaald in deze volgorde:

1. **Gebruikerskeuze** in de UI: zichtbare selector in de app-bar (rechts,
   naast het gezelschap-pill), niet weggestopt achter het tandwiel. Opgeslagen
   in `localStorage` per toestel ([ADR-008](008-opslag-per-toestel.md)).
   Reden: een taalkiezer is een eerste-indruk-keuze, geen geavanceerde
   instelling — wie de UI niet kan lezen, vindt het tandwiel ook niet.
2. **`navigator.language`** als beginwaarde wanneer nog niets gekozen is —
   exact-match (`nl`, `en`, `fr`) of valt terug op NL.
3. **NL** als laatste vangnet.

Geen aparte URL's per taal (`/en/…`). De app blijft één statische bundel
([ADR-009](009-statische-app-data-los.md)); taal swappen herrendert de UI
zonder pagina-reload.

### Fasering

1. **Nu**: i18n-skelet (`t()`-helper, `data-i18n`-attributen, `nl.json` gevuld
   uit bestaande hardcoded strings). Eén taal, maar de structuur staat.
2. **Nu, in dezelfde slag**: eigenschapssleutels hernoemen in de data en in
   [data/schema.md](../../data/schema.md). De tag-agent-prompt
   ([tools/tag-agent.md](../../tools/tag-agent.md)) krijgt dezelfde
   sleutel-update: NL-prompt-tekst blijft (operator-taal), maar de
   voorbeeld-output en de toegelaten property-waardes worden EN-keys.
   Goedkoper bij 9 parken dan bij 30.
3. **Volgend**: `en.json` toevoegen, taalkiezer in de UI. Eerste echte tweede taal.
4. **Later**: `fr.json` wanneer iemand het vraagt. `oms`-object-vorm pas vullen
   waar het nodig is — niet retroactief over alle attracties.

## Consequences

- **Uitgevoerd op 2026-06-14**: prop-keys in alle `data/parks/*.json` en in
  `src/shared/vocab.ts` (`PROPS`, `PNL`, `PEMO`) en `src/shared/types.ts`
  (`PropKey`) zijn van NL naar EN gemigreerd; `data/schema.md` en
  `tools/tag-agent.md` tonen voortaan de EN-keys. UI-labels blijven NL via
  `PNL`/`i18n/nl.json`. De i18n-skelet-fase (`t()`-helper, `nl.json`) was al
  eerder uitgevoerd.
- De data-bestanden krijgen een eenmalige sleutel-hernoeming. Niet
  achterwaarts-compatibel: een oude `"hoog"` in een park-JSON werkt niet meer.
  Dat is bewust — een shim levensondersteuning is duurder dan migreren.
- De tag-agent ([tools/tag-agent.md](../../tools/tag-agent.md)) levert
  voortaan stabiele Engelse property-keys. De prompt blijft NL (dat is
  operator-taal), de output-keys niet.
- De UI moet door een `t()`-laag. Eerste keer iets meer code; daarna is een
  nieuwe taal toevoegen ≈ een JSON-bestand erbij.
- Hybride `oms`-veld (string OR object) is een lichte schema-complicatie. Bewust:
  voor 9 parken nu meteen alles in objectvorm zetten is werk-voor-niets zolang
  er één taal is.
- Bronattributie in `image.attribution` ([ADR-014](014-visuele-en-bron-velden.md))
  volgt dezelfde regel — mag string of object zijn.
- Toekomst / open vragen:
  - **Fallback-taal verschuiven naar EN** zodra de tweede taal echt aanstaat
    en de tool een breder publiek krijgt. Vandaag is NL als fallback eerlijk
    over het publiek; later draait dat om. De `t()`-helper en de
    JSON-bestanden moeten dat met één regel-aanpassing aankunnen — geen
    structurele blocker, wel een bewuste cutover.
  - Pluralisatie en getalsvormen (vandaag nauwelijks nodig — UI heeft weinig
    "X parken / 1 park"-patronen). Als het opduikt: ICU MessageFormat of een
    minimale eigen helper, niet meteen een library.
  - Datums en getallen (cm-lengtes): vandaag taal-neutraal genoeg
    (`130 cm`), geen `Intl`-laag nodig.
  - Of de tag-agent zelf meertalige `oms` mag produceren wanneer een EN-bron
    voor de hand ligt — pas relevant als EN echt aanstaat.

## Considered alternatives

- **NL houden, vertaling overlaten aan de browser.** Werkt voor passief lezen,
  maar voorkeuren-invullen en uitsluiters zetten gaat slecht in een
  machinevertaalde UI met Nederlandse property-chips. Niet gekozen.
- **Volledig CMS / vertaalplatform (Crowdin, Weblate, …).** Overkill voor een
  eigen tool ([ADR-001](001-eigen-lokale-tool.md)) met < 500 strings en geen
  externe vertalers. Niet gekozen.
- **Aparte statische builds per taal (`/nl/`, `/en/`).** Conceptueel netjes,
  maar vereist een build-stap en dubbele assets, terwijl
  [ADR-009](009-statische-app-data-los.md) bewust kiest voor één statische
  bundel met data los. Niet gekozen.
- **NL-property-sleutels houden, alleen UI-label vertalen.** Spaart de
  data-migratie, maar maakt elke nieuwe bron (RCDB, EN-fanwiki) en elke
  niet-NL-spreker die ooit naar de data kijkt onnodig onhandig. De
  hernoeming is nu goedkoper dan ooit. Niet gekozen.
- **`oms` altijd als object, ook bij één taal.** Schema-uniformer, maar dwingt
  voor 9 parken werk af voor een hypothetische tweede taal. Hybride
  (string-of-object) is eerlijker over de huidige staat. Niet gekozen.
- **Taalkeuze in URL of subdomein.** Deel-vriendelijker, maar conflicteert met
  de "data per toestel"-aanpak ([ADR-008](008-opslag-per-toestel.md)) — een
  gedeelde URL met `?lang=fr` zegt niets over het gezelschap dat erop landt.
  `localStorage` per toestel volstaat. Niet gekozen.
