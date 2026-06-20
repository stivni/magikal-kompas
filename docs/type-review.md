# TypeKey-review per cluster

**Doel:** voorbereiding voor de TypeKey-uitbreiding uit [ADR-003](adr/003-type-en-eigenschappen.md).
Per huidige TypeKey toont dit document alle rides + mijn voorgestelde fijne-grained
mapping. Flags:

- **⚠️ mis-tag-kandidaat**: huidige type lijkt fout, mijn vermoeden onder "Note"
- **🤔 onzeker**: ride niet herkend, gok op basis van naam
- *geen flag*: ik denk dat de mapping helder is

Onderaan staan **edge-cases en open vragen** voor de hele set.

---

## 1. `thrill_coaster` (28) — sterk splitsen

Splits in: `launch_coaster` · `inverted_coaster` · `wooden_coaster` · `spinning_coaster` · `thrill_coaster` (catch-all voor grote-coasters-zonder-special-mechanic)

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bellewaerde | Boomerang | `inverted_coaster` | Vekoma Boomerang |
| Bobbejaanland | Bob Express | `thrill_coaster` | klassieke looping |
| Bobbejaanland | Fury | `launch_coaster` | shuttle launch |
| Bobbejaanland | Revolution | `thrill_coaster` | indoor looping |
| Bobbejaanland | Typhoon | `launch_coaster` | shuttle |
| Efteling | Baron 1898 | `thrill_coaster` | dive coaster (B&M Dive) |
| Efteling | Python | `thrill_coaster` | klassieke 4-looping |
| Efteling | Vogel Rok | `thrill_coaster` | enclosed/dark — `dark`-prop |
| La Recré | Le Vertika | `thrill_coaster` | vertical lift |
| Plopsaland | Anubis | `launch_coaster` | Gerstlauer launch |
| Plopsaland | Ride to Happiness | `spinning_coaster` ⚠️ | Mack Xtreme spinning — mis-tag |
| Toverland | Booster Bike | `launch_coaster` | Vekoma motorbike launch |
| Toverland | Fēnix | `inverted_coaster` | B&M wing |
| Toverland | Troy | `wooden_coaster` ⚠️ | klassieke houten — mis-tag |
| Walibi BE | Cobra | `inverted_coaster` | Vekoma Boomerang |
| Walibi BE | Kondaa | `thrill_coaster` | Intamin mega |
| Walibi BE | Loup-Garou | `wooden_coaster` ⚠️ | houten coaster — mis-tag |
| Walibi BE | Turbine | `launch_coaster` 🤔 | onzeker — small thrill |
| Walibi BE | Vampire | `inverted_coaster` | Vekoma SLC |
| Walibi NL | Condor | `inverted_coaster` 🤔 | onzeker, mogelijk verwijderd |
| Walibi NL | Goliath | `thrill_coaster` | Intamin mega |
| Walibi NL | Lost Gravity | `thrill_coaster` | Mack Big Dipper |
| Walibi NL | Speed of Sound | `inverted_coaster` 🤔 | onzeker |
| Walibi NL | UNTAMED | `wooden_coaster` ⚠️ | RMC hybrid (houten basis) — mis-tag |
| Walibi NL | Xpress: Platform 13 | `launch_coaster` | Vekoma Booster Bike-clone |
| Walibi NL | YOY THRILL | `thrill_coaster` 🤔 | onzeker, mogelijk family |
| Walibi RA | Generator | `inverted_coaster` | Vekoma Boomerang |
| Walibi RA | Mystic | `thrill_coaster` 🤔 | onzeker |

---

## 2. `family_coaster` (23) — beperkte splitsing

Splits in: `family_coaster` · `mine_train` · `water_coaster` (voor coasters-met-water-finale)

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bellewaerde | Dawson Duel | `family_coaster` | family duel coaster |
| Bellewaerde | Huracan | `family_coaster` | |
| Bellewaerde | Wakala | `family_coaster` | |
| Bobbejaanland | Oki Doki | `family_coaster` | |
| Bobbejaanland | Speedy Bob | `family_coaster` | |
| Efteling | Joris en de Draak | `family_coaster` ⚠️ | mogelijk wooden — duelling wooden coaster — check |
| Efteling | Max & Moritz | `family_coaster` | |
| Efteling | Vliegende Hollander | `water_coaster` ⚠️ | coaster met water-finale — mis-tag |
| La Recré | Le Train de la Mine | `mine_train` | mine train theme |
| Plopsaland | Dolle busrit | `family_coaster` 🤔 | onzeker — kan transport-rit zijn |
| Plopsaland | Draconis | `family_coaster` | wing coaster family |
| Plopsaland | Grote Golf | `family_coaster` | sea-serpent style |
| Plopsaland | Heidi | `family_coaster` | wooden family coaster — check |
| Plopsaland | LikeMe coaster | `family_coaster` | |
| Toverland | Toos-Express | `family_coaster` | |
| Walibi BE | Calamity Mine | `mine_train` ⚠️ | mine train — currently family_coaster |
| Walibi BE | Mecalodon | `top_spin` ⚠️ | dit is een ABC Rides spinner-rit, geen coaster — check! |
| Walibi BE | Tiki-Waka | `family_coaster` | spinning coaster — check of spinning_coaster |
| Walibi NL | Drako | `family_coaster` | |
| Walibi NL | YOY CHILL | `family_coaster` | |
| Walibi RA | La Coccinelle | `family_coaster` | |
| Walibi RA | Timber | `wooden_coaster` ⚠️ | houten family coaster — mis-tag |
| Walibi RA | Woodstock Express | `family_coaster` | |

---

## 3. `kiddie_coaster` (6) — blijft meestal

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bellewaerde | Brazilian Buggies | `kiddie_coaster` | |
| Bellewaerde | Peter Pan | `kiddie_coaster` 🤔 | of dark_ride / story_ride? |
| La Recré | Jeepo'Dino | `kiddie_coaster` | |
| Walibi BE | Fun Pilot | `kiddie_coaster` | |
| Walibi BE | Graffiti Shuttle | `kiddie_coaster` | shuttle |
| Walibi NL | Eat My Dust | `kiddie_coaster` | |

---

## 4. `spinning_coaster` (6) — blijft

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bobbejaanland | Dreamcatcher | `spinning_coaster` | |
| Bobbejaanland | Naga Bay | `spinning_coaster` | |
| Plopsaland | K3 roller skater | `kiddie_coaster` ⚠️ | kindercoaster, niet spinning — mis-tag |
| Toverland | Dwervelwind | `spinning_coaster` | |
| Toverland | Nieuwe attractie (Blitz Bahn-opvolger) | `spinning_coaster` 🤔 | onzeker |
| Walibi RA | Mahuka | `spinning_coaster` | |

---

## 5. `water_ride` (29) — sterk splitsen

Splits in: `log_flume` (klassiek splash-flume) · `rapids` (raft-rivier) · `water_coaster` (coaster met water) · `slow_boat` (voor Gondoletta-type, gaat naar Slenteren)

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bellewaerde | Amazonia | `rapids` 🤔 | bootrit door grotten, mogelijk slow_boat |
| Bellewaerde | Bengal Rapid River | `rapids` | river rapids |
| Bellewaerde | Big Chute | `log_flume` | |
| Bellewaerde | Niagara | `log_flume` | |
| Bellewaerde | Rio Do Cacao | `slow_boat` 🤔 | rustige bootrit |
| Bellewaerde | Rio Do Café | `slow_boat` 🤔 | rustige bootrit |
| Bobbejaanland | Big Bang | `log_flume` 🤔 | log flume met explosie-finale |
| Bobbejaanland | El Rio | `rapids` 🤔 | rivier |
| Bobbejaanland | Terra Magma | `log_flume` 🤔 | |
| Bobbejaanland | Wildwaterbaan | `log_flume` | |
| Efteling | Gondoletta | `slow_boat` ⚠️ | rustige gondol — hoort bij Slenteren, niet Spetters |
| Efteling | Pirana | `rapids` | klassieke rapids |
| La Recré | Le Niagara | `log_flume` | |
| La Recré | Le River Splash | `log_flume` | |
| La Recré | Les Pedalos | `pedal_boat` ⚠️ | trapboten, eigen type? of `slow_boat`? |
| Plopsaland | Dinosplash | `log_flume` | |
| Plopsaland | Supersplash | `log_flume` | mega-splash |
| Toverland | Djengu River | `rapids` | |
| Toverland | Drakenslangen | `log_flume` 🤔 | of rapids |
| Toverland | Expedition Zork | `rapids` | |
| Walibi BE | Flash-Back | `log_flume` | |
| Walibi BE | Pulsar | `water_coaster` ⚠️ | shuttle launch coaster met water finale — niet pure water_ride, eerder thrill_coaster of water_coaster |
| Walibi BE | Radja River | `rapids` | |
| Walibi NL | Crazy River | `rapids` | |
| Walibi NL | El Rio Grande | `rapids` | |
| Walibi RA | Bambooz River | `rapids` 🤔 | |
| Walibi RA | Concert'O | `flat_spinner` ⚠️ | natte spinner-rit, niet water-rivier — mis-tag |
| Walibi RA | Gold River | `log_flume` | |
| Walibi RA | Surf Music | `flat_spinner` ⚠️ | natte spinner-rit — mis-tag |

---

## 6. `water_battle` (7) — hernoemen

Splits in: `splash_battle` (water-PvP) · `jet_ski` of `water_pedal` (eigen sturen)

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bobbejaanland | Banana Battle | `splash_battle` | |
| La Recré | La Bataille d'eau | `splash_battle` | |
| Plopsaland | Jetski | `jet_ski` ⚠️ | jij stuurt — andere ervaring dan PvP-battle |
| Plopsaland | Waterlelies | `slow_boat` 🤔 | of jet_ski stijl |
| Plopsaland | Wickie The Battle | `splash_battle` | |
| Walibi NL | Splash Battle | `splash_battle` | |
| Walibi RA | Tiki Academy | `splash_battle` | |

---

## 7. `kiddie_flat` (25) — sterk splitsen

Splits in: `balloon_ride` · `flying_chairs` · `flying_bicycles` · `kiddie_drop` · `tilt_a_whirl` · `walkthrough_decor` · etc.

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bellewaerde | Dansende Ballonnen | `balloon_ride` | |
| Bellewaerde | Gekke Koets | `flying_chairs` 🤔 | of carousel-stijl |
| Bellewaerde | Vlinders | `flying_chairs` 🤔 | of balloon_ride |
| Bobbejaanland | Flying Orca | `flying_chairs` 🤔 | |
| Bobbejaanland | Glijbaan | `playground` ⚠️ | speeltuin-glijbaan — mis-tag |
| Bobbejaanland | Glijbaan kinderland | `playground` ⚠️ | mis-tag |
| Bobbejaanland | Orbiter | `tilt_a_whirl` 🤔 | spinner-flat |
| Bobbejaanland | Rode Baron | `flying_chairs` 🤔 | |
| Efteling | Kinderspoor | `transport_train` ⚠️ | kindertrein — mis-tag |
| La Recré | Le Baron Rouge | `flying_chairs` 🤔 | |
| La Recré | Les Drakkars | `tilt_a_whirl` 🤔 | wiebelboten |
| La Recré | Les Grenouilles | `kiddie_drop` 🤔 | mini valtorens-kikkers |
| Toverland | Klokhuis | `walkthrough_decor` 🤔 | |
| Walibi BE | 4x4 Adventure | `transport_train` 🤔 | mini autorit |
| Walibi BE | Fun Recorder | `tilt_a_whirl` 🤔 | spinning kids ride |
| Walibi BE | Kids Airlines | `flying_chairs` | |
| Walibi BE | Kondaala | `kiddie_drop` 🤔 | mini drop tower? |
| Walibi BE | Poneys | `transport_train` ⚠️ | pony-rit, mogelijk eigen type |
| Walibi BE | Vliegend Tapijt | `flying_chairs` 🤔 | of vliegend-tapijt-flatride |
| Walibi NL | Bubble Swirl | `tilt_a_whirl` ⚠️ | duplicaat met teacups Bubble Swirl — mis-tag-conflict |
| Walibi NL | Mini Taxi's | `transport_train` 🤔 | |
| Walibi NL | Space Kidz | `kiddie_drop` 🤔 | mini drop |
| Walibi NL | Stunt Flight | `flying_chairs` 🤔 | |
| Walibi NL | Walibi's Shuttle | `transport_train` 🤔 | |
| Walibi RA | La Chevauchee | `flying_chairs` 🤔 | |

---

## 8. `top_spin` (6) — split madhouse vs flat

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bobbejaanland | Sledge Hammer | `top_spin` | flat top-spin |
| Plopsaland | Storm op zee | `top_spin` | flat |
| Walibi BE | Buzzsaw | `top_spin` | flat |
| Walibi NL | Blast | `top_spin` | flat |
| Walibi NL | G-Force | `top_spin` | flat |
| Walibi RA | AirBoat | `top_spin` 🤔 | onzeker |

Geen `madhouse` in deze cluster — die zit verstopt in `funhouse` (Villa Volta).

---

## 9. `drop_tower` (15) — split kiddie vs groot

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bellewaerde | Kikker | `kiddie_drop` | mini valtoren |
| Bellewaerde | Psssht Station | `kiddie_drop` 🤔 | small drop |
| Bellewaerde | Screaming Eagle | `drop_tower` | groot |
| Efteling | Hooghmoed | `drop_tower` 🤔 | of madhouse — check |
| La Recré | TREMOR | `drop_tower` | |
| Plopsaland | Valtoren | `kiddie_drop` 🤔 | mini |
| Toverland | Coco Bolo | `kiddie_drop` 🤔 | |
| Toverland | Dragonwatch | `drop_tower` 🤔 | |
| Toverland | Vliegend Tapijt | `flying_carpet` ⚠️ | vliegend tapijt, geen drop — mis-tag |
| Walibi BE | Dalton Terror | `drop_tower` | groot, Intamin |
| Walibi BE | Guitar Riff | `frisbee_pendulum` ⚠️ | giant frisbee — mis-tag |
| Walibi NL | Skydiver | `drop_tower` 🤔 | |
| Walibi NL | Space Shot | `drop_tower` | S&S Space Shot |
| Walibi RA | Le Petit Vapeur | `kiddie_drop` 🤔 | |
| Walibi RA | Le Totem | `drop_tower` | klassieke Space Shot |

---

## 10. `wave_swinger` (16) — split star_flyer vs klassiek vs balloon

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bellewaerde | Flying Carrousel | `wave_swinger` | |
| Bobbejaanland | Kettingmolen | `wave_swinger` | klassiek |
| Efteling | Anton Pieckplein | `walkthrough_decor` ⚠️ | wandelplein, geen swinger — mis-tag |
| La Recré | Le Reve d'Icare | `wave_swinger` 🤔 | |
| Plopsaland | Balloonrace | `balloon_ride` ⚠️ | ballon-omhoog — mis-tag |
| Plopsaland | Bumballoon | `balloon_ride` ⚠️ | mis-tag |
| Plopsaland | Nachtwachtflyer | `star_flyer` ⚠️ | 70m star flyer — mis-tag |
| Plopsaland | Vliegende fietsen | `flying_bicycles` ⚠️ | unieke flying bicycle type — mis-tag |
| Plopsaland | Wienerwalz | `wave_swinger` | |
| Toverland | Djinn | `wave_swinger` 🤔 | |
| Walibi BE | Little Swing | `wave_swinger` | kids variant |
| Walibi BE | Wave Swinger | `wave_swinger` | klassiek |
| Walibi NL | Super Swing | `wave_swinger` | |
| Walibi NL | Wind Seekers | `star_flyer` ⚠️ | hoge star flyer — mis-tag |
| Walibi RA | Balloon Race | `balloon_ride` ⚠️ | mis-tag |
| Walibi RA | Hurricane | `wave_swinger` 🤔 | |

---

## 11. `pirate_ship` (10)

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bellewaerde | Piratenboot | `pirate_ship` | |
| Bellewaerde | Seesaw Swing | `pirate_ship` 🤔 | of een ander schommel-type |
| Efteling | Halve Maen | `pirate_ship` | |
| La Recré | Le Galion des Pirates | `pirate_ship` | |
| Plopsaland | Piratenboot | `pirate_ship` | |
| Plopsaland | Swingboom | `pirate_ship` 🤔 | |
| Plopsaland | Wickie's Wervelwind | `pirate_ship` 🤔 | of seesaw-swing — Skyfly type? Check |
| Toverland | Alpenrutsche | `alpine_coaster` ⚠️ | bobsled-glijbaan — mis-tag |
| Toverland | Scorpios | `pirate_ship` 🤔 | of een ander flatride |
| Walibi RA | Dock'N Roll | `pirate_ship` 🤔 | |

---

## 12. `teacups` (9) — meestal blijft, één duplicaat-naam-conflict

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bellewaerde | Koffietassen | `teacups` | |
| La Recré | Les Tasses a The | `teacups` | |
| Plopsaland | Koffiekopjes | `teacups` | |
| Toverland | Theekopjes | `teacups` | |
| Walibi BE | Bubble Swirl | `teacups` 🤔 | duplicaat naam — mogelijk flat_spinner ipv teacups |
| Walibi BE | Spinning Taxi | `teacups` 🤔 | klassieke spinning taxis |
| Walibi NL | Pavillon de Thé | `teacups` | |
| Walibi NL | Walibi's Fun Recorder | `teacups` 🤔 | of `flat_spinner` |
| Walibi RA | Les P'tits Chaudrons | `teacups` | |

---

## 13. `flat_spinner` (21) — meestal blijft

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bellewaerde | El Toro | `flat_spinner` 🤔 | spinner-flat |
| Bellewaerde | El Volador | `flat_spinner` ⚠️ | grote spinning-flat — mogelijk frisbee_pendulum |
| Bellewaerde | Hampi | `walkthrough_decor` ⚠️ | safari-doorloop — mis-tag |
| Bobbejaanland | Aztek Express | `family_coaster` ⚠️ | mini coaster of trein — niet spinner — mis-tag |
| Bobbejaanland | King Kong | `top_spin` ⚠️ | top-spin — mis-tag |
| Efteling | Sirocco | `flat_spinner` 🤔 | spinning flat — of mogelijk eigen type Mack Tea Cup variant |
| La Recré | La Pieuvre | `octopus` ⚠️ | octopus-spinner — andere subset |
| La Recré | Le Mambo | `flat_spinner` 🤔 | |
| Plopsaland | Kikkers | `kiddie_drop` ⚠️ | kindervaltorens-kikkers — mis-tag |
| Toverland | Pixarus | `inverted_coaster` ⚠️ | inverted family-coaster — mis-tag |
| Walibi BE | Octopus | `octopus` | klassieke octopus |
| Walibi BE | Silverton | `flat_spinner` 🤔 | |
| Walibi BE | Spinning Vibe | `flat_spinner` | klassieke spinning-flat |
| Walibi BE | Stormy | `flat_spinner` 🤔 | |
| Walibi BE | Tous en Boîte | `flat_spinner` 🤔 | |
| Walibi NL | Los Sombreros | `flat_spinner` 🤔 | sombrero-spinner |
| Walibi NL | Spinning Vibe | `flat_spinner` | |
| Walibi NL | The Tomahawk | `frisbee_pendulum` ⚠️ | grote pendulum — mis-tag |
| Walibi RA | On Air | `flat_spinner` 🤔 | |
| Walibi RA | RepaR'TaKar | `flat_spinner` 🤔 | |
| Walibi RA | Volt-O-Vent | `flat_spinner` 🤔 | |

---

## 14. `carousel` (19) — meeste blijven, ballonmolen-mis-tags

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bellewaerde | Carrousel | `carousel` | |
| Bobbejaanland | Balloon Race | `balloon_ride` ⚠️ | ballonmolen — mis-tag |
| Bobbejaanland | Dubbeldekcarousel | `carousel` | |
| Bobbejaanland | Locomotion | `transport_train` ⚠️ | trein — mis-tag |
| Bobbejaanland | Old Carousel | `carousel` | |
| Efteling | Stoomcarrousel | `carousel` | |
| La Recré | La Chevauchee Sauvage | `carousel` 🤔 | |
| La Recré | Le Carrousel | `carousel` | |
| La Recré | Le Pen Draig | `carousel` 🤔 | |
| Plopsaland | Carousel | `carousel` | |
| Plopsaland | Dierenmolen | `carousel` | thema-carousel |
| Plopsaland | Eendjes | `carousel` 🤔 | of kiddie ride |
| Plopsaland | Konijntjes | `carousel` 🤔 | |
| Toverland | Jumping Juna | `carousel` 🤔 | of hopper-flatride |
| Toverland | Karussell | `carousel` | |
| Toverland | Tolly Molly | `carousel` 🤔 | |
| Walibi BE | Grand Carrousel | `carousel` | |
| Walibi NL | Merrie Go'Round | `carousel` | |
| Walibi RA | Carrousel | `carousel` | |

---

## 15. `story_ride` (18) — meeste blijven

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bobbejaanland | El Paso Special | `story_ride` 🤔 | of shoot_ride |
| Efteling | Carnaval Festival | `story_ride` | |
| Efteling | Danse Macabre | `story_ride` 🤔 | nieuw, mogelijk top_spin-variant |
| Efteling | Droomvlucht | `story_ride` | klassieker |
| Efteling | Fata Morgana | `story_ride` | |
| Efteling | Symbolica | `story_ride` | |
| La Recré | Le Cinema 6D | `show` ⚠️ | 6D-cinema — mis-tag (kort en passief) |
| Plopsaland | Bloemenmolen | `balloon_ride` ⚠️ | mis-tag — bloemen-ballon-molen |
| Plopsaland | Bos van Plop | `story_ride` | |
| Plopsaland | Op Reis met Bumba | `story_ride` | |
| Plopsaland | TikTak-bootjes | `story_ride` | bootjes-rit |
| Plopsaland | Tractors | `transport_train` ⚠️ | tractor-rit — mis-tag |
| Toverland | Exploria Magica | `story_ride` 🤔 | nieuwe attractie |
| Toverland | Merlin's Quest | `story_ride` | shooting-game in story-context — check |
| Toverland | Villa Toverhoed | `walkthrough_decor` 🤔 | of `madhouse` |
| Walibi BE | Challenge of Tutankhamon | `shoot_ride` ⚠️ | schiet-rit in story — mis-tag |
| Walibi BE | Popcorn Revenge | `shoot_ride` ⚠️ | schiet-rit — mis-tag |
| Walibi RA | WAB Band Tour | `story_ride` 🤔 | |

---

## 16. `funhouse` (7) — split madhouse

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bellewaerde | Het Huis Van Houdini | `madhouse` ⚠️ | madhouse-stijl — eigen type |
| Efteling | Villa Volta | `madhouse` ⚠️ | dé madhouse — eigen type, gevoel = immerse |
| Plopsaland | Glijbaan | `playground` ⚠️ | mis-tag — speeltuin-glijbaan |
| Toverland | Villa Fiasko | `madhouse` ⚠️ | |
| Walibi BE | Het Paleis van de Geest | `madhouse` ⚠️ | madhouse |
| Walibi NL | Merlin's Magic Castle | `madhouse` 🤔 | of walkthrough_decor |
| Walibi RA | Labyrinthe végétal | `walkthrough_decor` ⚠️ | doolhof — mis-tag |

---

## 17. `ferris_wheel` (7) — blijft

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bellewaerde | Minirad | `ferris_wheel` | klein |
| Bobbejaanland | Minirad | `ferris_wheel` | klein |
| Bobbejaanland | Reuzenrad | `ferris_wheel` | groot |
| Efteling | Pagode | `ferris_wheel` 🤔 | observatie-toren, niet ferris-wheel — mogelijk eigen type |
| La Recré | La Grande Roue | `ferris_wheel` | |
| Toverland | Wirbelbaum | `ferris_wheel` 🤔 | |
| Walibi NL | La Grande Roue | `ferris_wheel` | |

---

## 18. `show` (8) — blijft, met park-decor

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bellewaerde | 4D-Cinema | `show` | |
| Efteling | Diorama | `walkthrough_decor` ⚠️ | |
| Efteling | Efteling Museum | `walkthrough_decor` ⚠️ | |
| Efteling | Fabula | `show` | |
| Efteling | Holle Bolle Gijs | `park_decor` ⚠️ | iconisch maar geen rit/show |
| La Recré | Les Photos Humoristiques | `arcade` 🤔 | foto-attractie |
| Toverland | Magiezijn | `walkthrough_decor` 🤔 | |
| Walibi BE | 4D-bioscoop | `show` | |

---

## 19. `transport` (36) — split slow_boat + arcade

| Park | Att | → Nieuwe TypeKey | Note |
|---|---|---|---|
| Bellewaerde | Bengal Express | `transport_train` | |
| Bellewaerde | Expresstrein | `transport_train` | |
| Bellewaerde | Jungle Mission | `story_ride` ⚠️ | jungle-themed boot — mogelijk mis-tag |
| Bellewaerde | Tuff-Tuff | `transport_train` | |
| Bobbejaanland | Bootvaart | `slow_boat` ⚠️ | bootrit |
| Bobbejaanland | Convoy trucks | `transport_train` | |
| Bobbejaanland | Horse Pedalo | `pedal_ride` 🤔 | trapfietsen-paarden — eigen type? |
| Bobbejaanland | Minitrein | `transport_train` | |
| Bobbejaanland | Pony Ride | `animal_ride` 🤔 | echte pony's — niet pretpark-rit |
| Efteling | De Monorail | `transport_train` | |
| Efteling | De Oude Tufferbaan | `transport_train` | |
| Efteling | Stoomtrein | `transport_train` | |
| La Recré | Le Karting | `karting` ⚠️ | karting — Mikken-categorie |
| La Recré | Le Petit Train | `transport_train` | |
| La Recré | Le Tchou Tchou Moutig | `transport_train` | |
| La Recré | Les Teufs-Teufs | `transport_train` | |
| Plopsaland | Autoscooters | `bumper_cars` ⚠️ | bumper cars — eigen type? |
| Plopsaland | Het Vlot | `slow_boat` 🤔 | vlot-rit |
| Plopsaland | Rijschool Suikerbuik | `karting` 🤔 | rijschool-karting voor kids |
| Plopsaland | Safari | `slow_boat` ⚠️ | safari-bootrit — mis-tag |
| Plopsaland | Waterfietsen | `pedal_boat` 🤔 | trapboten |
| Toverland | Garden Tour | `transport_train` | |
| Toverland | Morrels Truckjes | `transport_train` | |
| Toverland | Paarden van Ithaka | `carousel` ⚠️ | paarden-carousel — mis-tag |
| Walibi BE | Melody Road | `transport_train` | |
| Walibi BE | Mini Tour | `transport_train` | |
| Walibi BE | Tchou-Tchou Express | `transport_train` | |
| Walibi NL | Garage | `arcade` 🤔 | of transport |
| Walibi NL | Le Tour des Jardins | `transport_train` | |
| Walibi NL | Tequila Taxi's | `bumper_cars` ⚠️ | bumper cars — mis-tag |
| Walibi NL | Walibi Express Station 1 | `transport_train` | trein-deel 1 |
| Walibi NL | Walibi Express Station 2 | `transport_train` | trein-deel 2 |
| Walibi NL | Walibi's World Tour | `transport_train` | |
| Walibi RA | Festival Station | `transport_train` | |
| Walibi RA | Melody Road | `transport_train` | |
| Walibi RA | MonORail | `transport_train` | |

---

## 20. `playground` (51) — meeste blijven, met enkele splits

Geen volledige tabel — kies hier voor patronen:

- Klassieke **klauterspeelplaats**: blijft `playground`
- **Ballenbad** (Het Ballenbad, Tumbi's Ballenbad, Maximus' Wunderball): nieuw type `ball_pit`?
- **Glijbaan-centric** (De Klimboom, Sparky's Splash Dock): blijft `playground`
- **Walk-through-decor** (Holle Bolle Gijs, Het Volk van Laaf, Game Gallery, De Doorloopweide, Big & Betsy Hoeve, De Tuin van Big, Sprookjesbos, Anton Pieckplein): **`walkthrough_decor` ⚠️** — deze horen bij Slenteren, niet bij Ravotten
- **Arcade-spelletjes** (Game Gallery, Les Jeux couverts, Les Photos Humoristiques): **`arcade`**
- **Waterspeel-zone** (L'Aquatico, Les Bassins enfants, Sparky's Splash Dock, De Dansende Fonteinen, Cooldown): nieuw type `water_play`?

Specifiek te flaggen:
- **Sprookjesbos** (Efteling) — staat nu als playground; eigenlijk een **walkthrough_decor** (loop door sprookjes-tableaus). Hoort bij Slenteren.
- **Anton Pieckplein** (Efteling) — staat nu als wave_swinger (zie cluster 10) maar is een wandelplein.

---

## Onzekerheden en open vragen

1. **`pedal_boat` / `pedal_ride`** — bestaan in vorm van Waterfietsen, Les Pedalos, Horse Pedalo. Eigen TypeKey, of valt onder slow_boat? Voor de meeste mensen is "zelf trappen" een actie-ervaring → mogelijk eigen bucket of bij Ravotten.
2. **`bumper_cars`** — Autoscooters, Tequila Taxi's. Categorie? Mikken (wedijver) ligt voor de hand, maar de meeste mensen ervaren het meer als spelen/lachen. **Voorstel: `bumper_cars`-type → Mikken** (botsen IS de wedijver).
3. **`alpine_coaster`** — Alpenrutsche (Toverland) is een bobsled-glijbaan, eigen type? Of valt onder kiddie_coaster?
4. **`shoot_ride`** — Challenge of Tutankhamon, Popcorn Revenge, Merlin's Quest (?), El Paso Special (?). Schiet-elementen in een story-rit. Categorie: **Mikken** (wedijver primair) of **Andere wereld** (verhaal primair)? Voorstel: als de schiet-actie de hoofd-driver is → Mikken; anders Andere wereld. Mss eigen prop `interactive` op story_rides?
5. **`park_decor`** — Holle Bolle Gijs, Diorama, Anton Pieckplein, Efteling Museum. Geen attractie maar park-vulling. In data houden? Of in een aparte "niet-rit"-categorie?
6. **`animal_ride`** — Pony Ride (Bobbejaanland). Echte pony's, geen mechanisch. Hoort dit überhaupt in de data?
7. **`pedal_ride`** — Horse Pedalo. Trapfietsen met paarden-vorm. Eigen type?
8. **Onbekende rides** — Condor (Walibi NL), Mahuka, Mystic — als jij ze niet kent: schrap of opzoeken?
9. **Mecalodon** — staat nu als `family_coaster` maar is een ABC Rides spinner-flat. **Wezenlijke mis-tag.**
10. **Aztek Express** — staat nu als `flat_spinner` maar is een mini-coaster. Mis-tag.
11. **Pixarus** — staat nu als `flat_spinner` maar is een inverted family-coaster (Vekoma). Mis-tag.

## Samenvatting van impact

Geschatte mis-tags ⚠️: ~35 rides
Onzekere mappings 🤔: ~50 rides
Heldere 1-op-1 (geen ⚠️/🤔): ~260 rides

De ⚠️-cluster is waar je ogen eerst op zouden moeten gaan — die zijn nu actief verkeerd.
