# 9. Statische app met data los van code

- Status: Accepted
- Groep: Data, rollen & opslag

## Context

Het onderhoud van de tool draait om data: parken en attracties toevoegen of bijwerken,
seizoen na seizoen. Dat mag geen herbouw van de hele applicatie vergen. Tegelijk moet
het geheel zonder server kunnen draaien (lokaal openen, eenvoudig statisch hosten). Alle
matching gebeurt lokaal, dus de data wordt in de client ingeladen.

## Decision

Data staat los van code: per park een databestand, samengevoegd door een buildstap tot
één laadbare bundel die de statische app inleest. De applicatie zelf is volledig
statisch (te openen door het HTML-bestand te openen, te hosten als statische bestanden).
Een park toevoegen is: een databestand erbij plus de bundel herbouwen.

## Consequences

- Parken toevoegen of corrigeren raakt de applicatiecode niet.
- De app draait zonder server; hosten kan gratis en statisch.
- De wereld-data staat versioneerbaar in de repo (sluit aan op ADR-007).
- Toekomst / open vragen: alle data wordt nu vooraf ingeladen. Dat schaalt prima tot in
  de honderden parken (orde grootte honderden KB tot enkele MB tekst). Daarboven is de
  uitweg lui-laden: alleen een lichte parkindex vooraf, en de attracties van een park pas
  bij openen. De structuur (losse parkbestanden + index) ligt daar al voor klaar; het
  echte plafond is tag-onderhoud, niet de downloadgrootte.

## Considered alternatives

- **Alle data inline in de code**: vermengt onderhoud van data met code en dwingt
  herbouw bij elke wijziging. Niet gekozen.
- **Losse databestanden via runtime-fetch**: modulair, maar vereist een server (fetch
  werkt niet bij lokaal openen). Niet gekozen als basis; wel de vorm die lui-laden later
  mogelijk maakt.
