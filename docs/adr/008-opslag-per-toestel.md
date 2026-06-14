# 8. Gezelschaps-data per toestel, deelbaar zonder server

- Status: Accepted
- Groep: Data, rollen & opslag

## Context

Gezelschaps-data is privé (ADR-007) en bevat gevoelige gegevens: lengtes en namen van
(andermans) kinderen. Gebruikers willen hun configuratie op meerdere toestellen kunnen
gebruiken zonder telkens opnieuw in te stellen. Tegelijk willen we niet dat iemand
andermans kinderdata op een server beheert — dat zou privacy van een gemak naar een
verantwoordelijkheid tillen.

## Decision

Gezelschaps-data wordt per toestel opgeslagen (lokale opslag in de browser), zonder
accounts en zonder server. Overzetten tussen toestellen gebeurt via een deel-link (met
QR van diezelfde link).

De zender kiest **per lid** wie er meegaat in de link: alleen de aangevinkte leden — met
hun naam, lengte, voorkeuren en uitzonderingen — worden meegestuurd. De ontvanger
**mergt** de inkomende leden in zijn bestaande gezelschap; bij naam-conflict krijgt de
ontvanger per botsende naam een keuze (behouden, overschrijven, of toevoegen onder een
nieuwe naam zoals "Emma 2").

## Consequences

- Geen server betekent geen centrale opslag van kinderdata en dus geen bijbehorende
  privacyplicht.
- Delen kan zonder backend of account: de gebruiker deelt een momentopname, geen
  live-account.
- De deel-link bevat namen en lengtes; gebruikers moeten hem alleen met vertrouwde
  personen delen. Dit wordt in de UI en README expliciet vermeld.
- Selectie aan zenderkant: in de link reizen alleen de bewust aangevinkte leden mee.
  Iemand die niet wordt aangevinkt komt niet in de URL terecht — minder data lekt mee
  bij delen, in lijn met het privacy-uitgangspunt.
- Merge aan ontvangerkant met conflict-prompt: bestaand gezelschap op het ontvangende
  toestel wordt nooit zomaar overschreven. Eenmalig instellen op oma's tablet (één
  kleinkind) en later iemand anders toevoegen blijft mogelijk zonder dataverlies.
- QR leunt op een client-side bibliotheek; zonder internet rendert de QR niet, maar de
  link blijft werken.
- Toekomst / open vragen: accounts met synchronisatie over toestellen worden bewust
  opengehouden voor later — pas te bouwen mét de privacyplichten van centrale opslag.
  Bij grote gezelschappen wordt de deel-link lang; voor een handvol leden is dat geen
  probleem.

## Considered alternatives

- **Server met accounts en sync**: lost overzetten elegant op maar legt de
  verantwoordelijkheid voor andermans kinderdata bij de beheerder. Niet nu gekozen;
  opengehouden voor de toekomst.
- **Alleen per toestel, niet deelbaar**: privacy-veilig maar dwingt opnieuw instellen op
  elk toestel. Niet gekozen.
- **Config delen via een bestand**: werkt, maar is omslachtiger dan een link/QR voor
  het beoogde gebruik. Niet gekozen.
- **Hele gezelschap als één bundel overzetten** (eerdere implementatie): één klik aan
  zenderkant, ontvanger wordt overschreven. Werkt voor "verhuizen naar nieuw toestel"
  maar is onhandig zodra het ontvangende toestel al een gezelschap heeft — en stuurt
  altijd alle namen/lengtes mee, ook die je niet wou delen. Vervangen door de huidige
  selectie-bij-zenden + merge-bij-ontvangst.
- **Eén persoon per QR (één lid = één link)**: simpelste mentale model maar bij meer dan
  één lid omslachtig (meerdere QR's scannen). De huidige oplossing is een superset: vink
  je één lid aan, dan krijg je effectief dit gedrag.
- **Eén link met alle leden, ontvanger kiest welke te importeren**: één klik aan
  zenderkant, controle bij ontvanger. Verworpen omdat ook niet-gewenste leden dan in de
  URL/QR meereizen — strijdig met het privacy-uitgangspunt dat de zender bewust kiest
  wat hij deelt.
