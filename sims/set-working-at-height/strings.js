/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of set-working-at-height, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Crews' loanwords (key grip, gaffer, video village) as the
   owner listed them; skela s ogradom, podizna platforma, rubna letva, stega and the other terms marked (check) in
   NOTES.md "For the owner". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Rad iznad seta sa strane i odozgo, energija pada i tjedan ispuštenih predmeta',

      access: 'Pristup',
      access_ladder: 'ljestve',
      access_platform: 'skela',
      access_lift: 'košara',
      trained: 'Osposobljen za taj pristup',
      item: 'U ruci (0,5 / 1 / 2,5 kg)',
      item_spanner: 'ključ',
      item_clamp: 'stega',
      item_lamp: 'reflektor',
      height: 'Visina rada',
      traffic: 'Ispod prolaze',
      traffic_few: 'rijetko',
      traffic_busy: 'često',
      traffic_through: 'jedini prolaz',
      zone: 'Zona ispod',
      zone_open: 'otvorena',
      zone_taped: 'samo traka',
      zone_closed: 'zatvorena',
      zoneR: 'Polumjer zone',
      tether: 'Alat na uzici',
      seedParam: 'Tjedan',
      newWeek: 'Drugi tjedan',
      newWeekHint: 'Isti uvjeti, drugi nasumični trenutci padova',

      preset_ladder: 'Ljestve, 6 m',
      hint_ladder: 'Stega s 6 m, zona otvorena',
      preset_zone: 'Zatvori zonu',
      hint_zone: 'Isti padovi, nitko ispod',
      preset_small: 'Premala zona',
      hint_small: '1,5 m, a pada do 2,3 m',
      preset_taped: 'Samo traka',
      hint_taped: 'Ljudi i dalje presijecaju',
      preset_layers: 'Skela i uzica',
      hint_layers: 'Pada samo ono što se dodaje',
      preset_low: 'Samo 2 m',
      hint_low: 'Pad radnika: 1570 J',

      formula: 'E = m · g · h',
      eLine: '{m} kg × 9,81 m/s² × {h} m = {e} J',
      speedLine: 'na podu {v} m/s ({kmh} km/h)',
      band_0: 'jak udarac',
      band_1: 'teška ozljeda bez kacige',
      band_2: 'opasno i s kacigom',
      bandScale: 'Energija udarca (granice izmišljene)',
      side: 'Sa strane',
      landR: 'pada do {r} m',
      zoneTag_taped: 'traka {z} m',
      zoneTag_closed: 'zona {z} m',
      blocked_ladder: 'Nije osposobljen za ljestve: ne penje se',
      blocked_platform: 'Nije osposobljen za skelu: ne penje se',
      blocked_lift: 'Nije osposobljen za košaru: ne penje se',
      blockedSub: 'Posao čeka nekoga tko jest.',

      weekTitle: 'Tjedan rada iznad seta: 5 dana po 4 sata',
      weekSeed: 'tjedan {n}',
      cDropped: 'palo',
      cCaught: 'uhvatila uzica',
      cStopped: 'zaustavila rubna letva',
      cLanded: 'do poda',
      cHits: 'netko ispod',
      avg: 'prosječno {x} tjedno',
      day: 'dan {n}',

      planTitle: 'Odozgo',
      planNote: 'prolaz između seta i video villagea',

      fallTitle: 'Ako padne radnik',
      fallLine: '80 kg × 9,81 × {h} m = {e} J',
      fallStop_ladder: 'Ništa ne zaustavlja pad',
      fallStop_platform: 'Ograda protiv pada',
      fallStop_lift: 'Ograda i pojas zakvačen u košari protiv pada',

      legLand: 'gdje pada',
      legTape: 'traka',
      legClosed: 'zatvorena zona',
      legHit: 'netko ispod',
      legClear: 'nitko ispod',
      legCaught: 'uzica',
      legStopped: 'rubna letva',
      legPerson: 'ljudi',

      capWeek: 'Ovaj tjedan: palo {d}, do poda {l}, netko ispod {n} (prosječno {x} tjedno).',
      capNone: 'Ništa nije stiglo do poda.',
      capBlocked: 'Ljestve, skele i podizne platforme koriste samo oni koji su za to osposobljeni. Tko nije, ne penje se: posao čeka.',
      capHeld: 'Sve je palo unutar zatvorene zone, u koju dok je bila zatvorena nitko nije ušao.',
      capSmall: 'Zona ima {z} m, a s {h} m predmeti padnu i do {r} m: ono što padne izvan nje može pogoditi ljude koji prolaze uz njezin rub.',
      capTaped: 'Samo traka: ljudi je i dalje presijecaju, pa pogodaka ima manje, ali ne nula. Zatvorena zona je ona u koju nitko ne ulazi.',
      capOpen: 'Probaj zatvorenu zonu ispod, alat na uzici ili skelu s ogradom.',
      capPass: 'Do poda stiže samo ono što ispadne pri dodavanju gore i dolje: to ne zaustavljaju ni uzica ni rubna letva, nego zona ispod.',
      capEdge: 'S ljestava padne i ono što je odloženo pa srušeno: na skeli ga zaustavi rubna letva.',
      capHand: 'Iz ruke i dalje ispada: alat na uzici to hvata.',
      capEnergy: '{m} kg s {h} m: {e} J, {band}.',
      capFall: 'A radnik: pad s {h} m je {f} J, ni 2 m nisu nisko.',

      foot: 'Pojednostavnjeno, brojke su izmišljene. Zadnju riječ imaju sigurnosni brifing produkcije i voditelj odjela (key grip, gaffer).',

      explain: '<p><b>Energija pada.</b> Predmet koji padne s visine <i>h</i> stiže do poda s energijom E = m·g·h: ' +
        'stega od 1 kg sa 6 m nosi oko 59 J i udara brzinom od oko 11 m/s (39 km/h). Dvostruko viši rad, dvostruka ' +
        'energija; dvostruko teži predmet također. I mali ključ od 0,5 kg s 10 m nosi 49 J. Granice na ljestvici (10 J i ' +
        '100 J) izmišljene su za ovu stranicu, kao i sve brojke na njoj.</p>' +
      '<p><b>Gdje padne.</b> Predmet se odbije od skele, ograde ili rasvjete i odskoči od poda, pa ne pada točno ' +
        'ispod radnika: krug u koji pada raste s visinom. Zona ispod mora pokriti cijeli taj krug. <i>Zatvorena</i> zona ' +
        'je ona u koju nitko ne ulazi dok netko radi iznad, i netko na to pazi; sama traka nije zatvorena zona, kroz ' +
        'nju se i dalje prolazi.</p>' +
      '<p><b>Što zaustavlja predmet.</b> Alat na uzici hvata ono što ispadne iz ruke. Rubna letva na skeli i u košari ' +
        'podizne platforme zaustavlja ono što je odloženo pa srušeno nogom; s ljestava to padne. Ono što ispadne dok se ' +
        'dodaje gore ili dolje ne zaustavlja ništa od toga, nego samo zona ispod. Zato se mjere slažu jedna na drugu, ' +
        'a nijedna sama ne znači da je sigurno.</p>' +
      '<p><b>Radnik.</b> Pad s 2 m za osobu od 80 kg je oko 1570 J: i to je dovoljno za tešku ozljedu. Ljestve su brze, ' +
        'ali na njima ništa ne zaustavlja pad; na skeli to čini ograda, u košari ograda i pojas. Zato ograda i pojas ' +
        'idu prije brzine. Ljestve, skele i podizne platforme koriste samo oni koji su za to osposobljeni ' +
        '(osposobljavanje za rad na siguran način prema Zakonu o zaštiti na radu, koji vrijedi za sve na setu); rukovanje ' +
        'podiznom platformom posao je osposobljenog rukovatelja, a stranica pokazuje samo što zaustavlja pad.</p>' +
      '<p><b>Tjedan.</b> Trenutci padova i tko je u tom trenutku ispod nasumični su, ali isti za svaku mjeru: kad ' +
        'uključiš zonu ili uzicu, gledaš isti tjedan s tom mjerom. Jedan pad rijetko nekoga pogodi; kroz tjedan se ' +
        'pogodci zbroje. „Prosječno” je ono što bi dalo mnogo tjedana.</p>' +
      '<p><b>Pojednostavnjeno.</b> Brojke su izmišljene, ali uvjerljive; fizika (E = m·g·h) je prava. Zadnju riječ ' +
        'imaju sigurnosni brifing produkcije i voditelj odjela.</p>'
    },

    en: {
      stage: 'Work above the set from the side and from above, the energy of a drop and a week of dropped objects',

      access: 'Works from',
      access_ladder: 'ladder',
      access_platform: 'platform',
      access_lift: 'lift',
      trained: 'Trained for this access',
      item: 'Holding (0.5 / 1 / 2.5 kg)',
      item_spanner: 'spanner',
      item_clamp: 'clamp',
      item_lamp: 'lamp',
      height: 'Working height',
      traffic: 'People below',
      traffic_few: 'rarely',
      traffic_busy: 'often',
      traffic_through: 'the only way',
      zone: 'Zone below',
      zone_open: 'open',
      zone_taped: 'tape only',
      zone_closed: 'closed',
      zoneR: 'Zone radius',
      tether: 'Tools tied on',
      seedParam: 'Week',
      newWeek: 'Another week',
      newWeekHint: 'The same conditions, other random moments for the drops',

      preset_ladder: 'Ladder, 6 m',
      hint_ladder: 'A clamp from 6 m, zone open',
      preset_zone: 'Close the zone',
      hint_zone: 'The same drops, nobody under',
      preset_small: 'Zone too small',
      hint_small: '1.5 m, but it lands up to 2.3 m',
      preset_taped: 'Tape only',
      hint_taped: 'People still cut through',
      preset_layers: 'Platform and tether',
      hint_layers: 'Only what is handed up falls',
      preset_low: 'Only 2 m',
      hint_low: 'The worker\'s fall: 1570 J',

      formula: 'E = m · g · h',
      eLine: '{m} kg × 9.81 m/s² × {h} m = {e} J',
      speedLine: 'at the floor {v} m/s ({kmh} km/h)',
      band_0: 'a bad knock',
      band_1: 'injures badly without a hard hat',
      band_2: 'dangerous even with a hard hat',
      bandScale: 'Impact energy (made-up bands)',
      side: 'From the side',
      landR: 'lands up to {r} m',
      zoneTag_taped: 'tape {z} m',
      zoneTag_closed: 'zone {z} m',
      blocked_ladder: 'Not trained for the ladder: does not go up',
      blocked_platform: 'Not trained for the platform: does not go up',
      blocked_lift: 'Not trained for the lift: does not go up',
      blockedSub: 'The work waits for someone who is.',

      weekTitle: 'A week of work above the set: 5 days of 4 hours',
      weekSeed: 'week {n}',
      cDropped: 'dropped',
      cCaught: 'caught by the tether',
      cStopped: 'stopped by the toe board',
      cLanded: 'reached the floor',
      cHits: 'someone under it',
      avg: 'on average {x} a week',
      day: 'day {n}',

      planTitle: 'From above',
      planNote: 'the route between the set and video village',

      fallTitle: 'If the worker falls',
      fallLine: '80 kg × 9.81 × {h} m = {e} J',
      fallStop_ladder: 'Nothing stops the fall',
      fallStop_platform: 'Rails against the fall',
      fallStop_lift: 'Rails, and a harness clipped in the basket, against the fall',

      legLand: 'lands here',
      legTape: 'tape',
      legClosed: 'closed zone',
      legHit: 'someone under',
      legClear: 'nobody under',
      legCaught: 'tether',
      legStopped: 'toe board',
      legPerson: 'people',

      capWeek: 'This week: {d} dropped, {l} reached the floor, {n} with someone under it (on average {x} a week).',
      capNone: 'Nothing reached the floor.',
      capBlocked: 'Ladders, platforms and lifts are used only by those trained for them. Whoever is not does not go up: the work waits.',
      capHeld: 'Everything landed inside the closed zone, which nobody entered while it was kept closed.',
      capSmall: 'The zone is {z} m, but from {h} m things land up to {r} m away: what lands outside it can hit people walking along its edge.',
      capTaped: 'Tape only: people still cut through, so there are fewer hits, but not none. A closed zone is one nobody enters.',
      capOpen: 'Try a closed zone below, tools tied on or a platform with rails.',
      capPass: 'Only what slips while handed up or down reaches the floor: neither the tether nor the toe board stops that; the zone below does.',
      capEdge: 'From a ladder, what was put down and knocked off falls too: on a platform the toe board stops it.',
      capHand: 'Things still slip from the hand: a tether catches them.',
      capEnergy: '{m} kg from {h} m: {e} J, {band}.',
      capFall: 'And the worker: a fall from {h} m is {f} J; even 2 m is not low.',

      foot: 'Simplified; the numbers are made up. The production\'s safety briefing and the head of department (key grip, gaffer) have the final word.',

      explain: '<p><b>The energy of a drop.</b> Something dropped from a height <i>h</i> reaches the floor with E = m·g·h: ' +
        'a 1 kg clamp from 6 m carries about 59 J and lands at about 11 m/s (39 km/h). Twice the height, twice the ' +
        'energy; twice the mass, likewise. Even a 0.5 kg spanner from 10 m carries 49 J. The bands on the scale (10 J and ' +
        '100 J) are made up for this page, like every number on it.</p>' +
      '<p><b>Where it lands.</b> A falling object glances off the platform, a rail or a lamp and bounces off the floor, ' +
        'so it does not land straight below the worker: the circle where it can land grows with the height. The zone ' +
        'below has to cover all of it. A <i>closed</i> zone is one nobody enters while someone works above, and someone ' +
        'keeps it so; tape alone is not a closed zone, people still walk through it.</p>' +
      '<p><b>What stops it.</b> A tether catches what slips from the hand. The toe board of a platform or a lift\'s ' +
        'basket stops what was put down and knocked off with a foot; from a ladder it falls. What slips while handed up ' +
        'or down is stopped by none of these, only by the zone below. That is why the controls are layered, and none ' +
        'of them alone means it is safe.</p>' +
      '<p><b>The worker.</b> A fall from 2 m for a person of 80 kg is about 1570 J: already enough for a serious ' +
        'injury. A ladder is quick, but nothing on it stops a fall; on a platform the rails do, in a lift\'s basket the ' +
        'rails and a harness. So rails and harnesses come before speed. Ladders, platforms and lifts are used only by ' +
        'those trained for them (training for safe work under the Croatian occupational safety law, which applies to ' +
        'everyone on set); operating a lift is the work of a trained operator, and the page shows only what stops a ' +
        'fall.</p>' +
      '<p><b>The week.</b> The moments of the drops and who is under them are random, but the same for every control: ' +
        'switch on the zone or the tether and you see the same week with it. One drop rarely hits anyone; over a week ' +
        'the hits add up. "On average" is what many weeks would give.</p>' +
      '<p><b>Simplified.</b> The numbers are made up but plausible; the physics (E = m·g·h) is real. The production\'s ' +
        'safety briefing and the head of department have the final word.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
