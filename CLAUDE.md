# Project guidelines

## Architectuurbeslissingen

- Elke design- of architectuurbeslissing moet worden opgenomen in een ADR (Architecture Decision Record). Het is voorlopig toegelaten om bestaande ADRs bij te werken in plaats van altijd een nieuwe aan te maken.

## Taal en meertaligheid (zie [ADR-015](docs/adr/015-meertalige-ui.md))

- **UI-strings** horen niet hardcoded in `index.html`/`app.js`, maar in `i18n/<lang>.json` via een `t(key)`-helper en `data-i18n="..."`-attributen. NL is vandaag bron-van-waarheid en fallback; later schuift dat door naar EN.
- **Vocabulaire-sleutels in data zijn stabiel-Engels**: `type` (`thrill_coaster`, …) en `props` (`high`, `fast`, `wet`, `dark`, `spins`, `swings`, `inversions`). Nooit een NL-woord als sleutel in een park-JSON — alleen als display-label in een `i18n`-bestand.
- **Vrije tekst** (`oms`, `image.attribution`) mag een string zijn (= bron-taal NL) of een object `{ "nl": "…", "en": "…" }`. Beide vormen blijven geldig; niet preventief alles naar object herschrijven.
- **Park- en attractienamen blijven eigennamen**, niet vertalen.
- **Tag-agent**: prompt-tekst blijft NL (operator-taal), maar de output gebruikt de stabiele Engelse keys hierboven.
