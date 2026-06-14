# 11. Leeg gezelschap voor een nieuwe gebruiker

- Status: Accepted
- Groep: Data, rollen & opslag

## Context

Tot nu toe startte een nieuwe gebruiker met een voorbeeld-gezelschap van vijf leden
(Alex, Emma, Max, Anna, Sofia) met fictieve lengtes. Dat was handig om de app meteen
"in te vullen" tijdens de POC-fase: de ranking, de detailweergave en de "Per lid"-tab
toonden direct iets zinnigs. Buiten die fase werkt het tegen ons. Een nieuwe gebruiker
moet eerst alle voorbeeld-leden verwijderen voor zijn echte gezelschap in beeld komt, of
erger: hij vergeet dat en deelt per ongeluk een link met andermans (verzonnen) namen en
lengtes erin. Dat botst met het privacy-uitgangspunt uit [[opslag-per-toestel]] — de
zender hoort bewust te kiezen wie meereist, en de standaard hoort daar niet tegenin te
gaan.

## Decision

Een nieuwe gebruiker start met een **leeg gezelschap**. Er staan geen voorbeeld-leden in
`localStorage` en geen voorbeeld-leden in de code; het scherm toont meteen het
gezelschap-paneel in open toestand, met enkel de "Lid toevoegen"-knop.

De parken-tab en de "Per lid"-tab tonen in die toestand hun bestaande lege-staat-
boodschap ("Vink minstens één lid aan"). Bestaande gebruikers met opgeslagen state zijn
niet geraakt: hun `localStorage` blijft de bron van waarheid, inclusief hun eigen
voorkeur voor open/dicht-stand van het paneel.

## Consequences

- Eerste handeling van een nieuwe gebruiker is "Lid toevoegen", niet "voorbeeld-leden
  opruimen". Dat past bij de mentale model van de app: jouw gezelschap, niet een
  voorbeeld dat jij overschrijft.
- Geen risico meer dat verzonnen namen/lengtes per ongeluk in een deel-link belanden:
  een gebruiker die niets toevoegt heeft niets te delen.
- De eerste indruk is minder "rijk": geen ingevulde ranking om naar te kijken. Dat is
  een bewuste keuze — de ranking heeft pas betekenis zodra het gezelschap echt is.
- Het paneel staat open by default voor een nieuwe gebruiker, zodat de "Lid toevoegen"-
  knop direct zichtbaar is zonder een extra klik op de header.

## Considered alternatives

- **Voorbeeld-gezelschap behouden zoals tijdens de POC**: rijke eerste indruk, maar
  vraagt de gebruiker om eerst op te ruimen en geeft risico op per-ongeluk-delen van
  fictieve data. Niet gekozen.
- **Eén placeholder-lid ("Lid 1", 120 cm)**: vermijdt het lege scherm maar voegt geen
  informatie toe; de gebruiker moet hem nog steeds aanpassen of verwijderen. Niet
  gekozen — even goed meteen leeg starten.
- **Onboarding-wizard die door het toevoegen van het eerste lid leidt**: pedagogisch
  netter, maar overkill voor een app waar "Lid toevoegen" al de enige zichtbare knop
  is in lege toestand. Niet gekozen; opengehouden mocht uit gebruik blijken dat de
  drempel toch te hoog is.
