/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of set-fatigue-turnaround, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian: crews' loanwords (turnaround, wrap, grip,
   1st AD) as the owner listed them; the terms marked (check) in NOTES.md "For the owner". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tjedan snimanja: dani, noći i vožnja kući',
      length: 'Planirani dan (poziv → wrap)',
      lengthHint: 'Prekovremeno po danu i put do seta: − / + na pozornici.',
      minRest: 'Najmanje 11 h odmora za svakoga',
      onTime: 'Wrap na vrijeme',
      shorter: 'Kraći idući dan',
      far: 'Tko živi daleko (60 min i više)',
      far_none: 'Svojim autom',
      far_room: 'Soba blizu',
      far_driver: 'Vozač',
      who: 'Čiji tjedan',
      oParam: 'Prekovremeno: {day}',
      tParam: 'Put do seta: {who}',

      preset_planned: 'Planirani tjedan',
      hint_planned: 'dani od 11 h, turnaround 13 h',
      preset_overrun: 'Svaki dan 2 h preko',
      hint_overrun: 'turnaround 11 h, san 5 h 45',
      'preset_min-rest': 'Najmanje 11 h odmora',
      'hint_min-rest': 'pozivi kasne, vožnja i dalje preko 17 h',
      preset_shorter: 'Kraći idući dan',
      hint_shorter: 'samo je ponedjeljak dugačak',
      preset_room: 'Soba blizu lokacije',
      hint_room: '15 min do seta: 8 h sna',
      preset_driver: 'Vozač za one daleko',
      hint_driver: 'nije za volanom, dug ostaje',

      crew_grip: 'Grip',
      crew_makeup: 'Maskerka',
      crew_ac: 'Asistent kamere',
      day0: 'Pon', day1: 'Uto', day2: 'Sri', day3: 'Čet', day4: 'Pet',
      dayIn0: 'u ponedjeljak', dayIn1: 'u utorak', dayIn2: 'u srijedu', dayIn3: 'u četvrtak', dayIn4: 'u petak',

      weekOf: 'Tjedan: {who}',
      travelTo: '{t} do seta',
      roomedTo: 'soba blizu: {t} do seta',
      axis: 'sati budnosti, s dugom sna',
      line17: '17 h ≈ 0,5 ‰',
      over: 'preko {d}',
      overNone: 'bez prekovremenog',
      less: 'manje',
      more: 'više',
      atMin: 'već je najmanje',
      atMax: 'već je najviše',
      stepLabel: '{what}: {dir}',
      ta: 'turnaround {d}',
      sleep: 'san {d}',
      weekend: 'vikend',
      risk_low: 'nizak',
      risk_raised: 'povišen',
      risk_high: 'visok',
      passenger: 'putnik',
      badgeLabel: '{day}: {eff} budnosti s dugom, rizik {risk}',
      badgeLabelPass: '{day}: {eff} budnosti s dugom, putnik',
      crewHead: 'Ekipa: vožnja kući, sati budnosti s dugom',
      showWeek: 'Pokaži tjedan: {who}',
      farMark: 'daleko',
      debtFri: 'dug do petka {d}',
      debtNone: 'bez duga',
      foot: 'Pojednostavljeno; brojevi su ilustrativni. Konačnu riječ imaju sigurnosni brifing produkcije i šef odjela.',

      legWork: 'planirani dan',
      legOver: 'prekovremeno',
      legSleep: 'san',
      legDebt: 'dug sna',
      legDrive: 'vožnja kući: ○ nizak ◐ povišen ● visok ▭ putnik',
      legChanged: 'promijenjeno',

      capWorst: '{who}: najgora vožnja kući je {dayIn}, {awake} budnosti + {debt} duga = {eff}.',
      capWorstNoDebt: '{who}: najgora vožnja kući je {dayIn}, nakon {eff} budnosti.',
      capHigh: '17 h i više: istraživanja to uspoređuju s 0,5 ‰ alkohola u krvi.',
      capRaised: 'Blizu crte od 17 h.',
      capLow: 'Ispod 16 h na ovoj ilustrativnoj ljestvici; to nije sigurna granica.',
      capDriven: '{who} se vozi kao putnik: nije za volanom, a umor je isti ({eff} {dayIn}).',
      capDebt: 'Do petka dug sna naraste na {debt}.',
      capNoDebt: 'Spava dovoljno cijeli tjedan.',
      capNight: 'Prva noć: turnaround {ta}; kad se oduzmu pakiranje, put u oba smjera i vrijeme kod kuće, za san ostaje {sleep}.',
      capMinRest: 'Odmor od najmanje 11 h gura pozive kasnije: petak završava u {clock}.',
      capMinRestSat: 'Odmor od najmanje 11 h gura pozive kasnije: petak završava tek u subotu u {clock}.',
      capRoom: 'Soba blizu lokacije: {t} do seta umjesto {set}.',

      explain: '<p><b>Turnaround.</b> Turnaround je odmor između wrapa jednog dana i poziva (<i lang="en">call</i>) ' +
        'idućega. Svaki sat koji dan ode preko plana ide iz njega. A turnaround nije san: grip nakon wrapa još rastavlja i ' +
        'utovaruje, asistent kamere pakira kameru i predaje kartice, maskerka dolazi sat prije ekipe; zatim put kući, ' +
        'večera i tuš, a ujutro buđenje i put natrag. Na pozornici je svaki dan jedan redak, od buđenja do idućeg ' +
        'poziva.</p>' +
        '<p><b>Dug sna.</b> Tko spava manje nego što mu treba (ovdje 8 h), ostaje dužan; dug se zbraja kroz tjedan i ne ' +
        'vraća se jednom duljom noći. Stranica svaki sat duga broji kao sat dulje budnosti, pa redak puže udesno kako dug ' +
        'raste.</p>' +
        '<p><b>Vožnja kući.</b> Vrijeme reakcije raste sa satima budnosti. Istraživanja (Dawson i Reid, 1997; Williamson ' +
        'i Feyer, 2000) nakon 17 do 19 sati budnosti mjere učinak kakav daje alkohol u krvi od 0,5 ‰, granica za vozače u ' +
        'mnogim zemljama. Zato je najopasniji dio dugog dana često vožnja kući, najviše za one koji žive daleko: ustaju ' +
        'ranije i voze dulje.</p>' +
        '<p><b>Što prekida lanac.</b> Najmanje 11 h odmora: EU traži najmanje 11 uzastopnih sati dnevnog odmora (Direktiva ' +
        '2003/88/EZ, čl. 3); ovdje se računa od odlaska svakog člana ekipe sa seta, pa idući poziv kasni i tjedan klizi. ' +
        'Odmor čuva san, ali ne skraćuje dugi dan prije vožnje. Wrap na vrijeme: 1st AD zove wrap u planirano vrijeme, a što ' +
        'ostane, snima se drugi dan. Kraći idući dan: dan poslije prekovremenog počinje toliko kasnije. Soba blizu lokacije ' +
        'ili vozač za one koji žive daleko: soba vraća san, vozač skida umornoga s volana, ali dug ostaje. Pravila o odmoru ' +
        'i Zakon o zaštiti na radu vrijede za sve na setu, bez obzira na vrstu ugovora.</p>' +
        '<p><b>Pojednostavljeno.</b> Brojevi su ilustrativni (trajanja, potreba za snom, granica od 16 h, zbrajanje duga i ' +
        'budnosti); unutarnji sat, drijemanje i vikend nisu na stranici. Konačnu riječ imaju sigurnosni brifing produkcije ' +
        'i šef odjela.</p>'
    },
    en: {
      stage: 'A shooting week: days, nights and the drive home',
      length: 'Planned day (call → wrap)',
      lengthHint: 'Overrun per day and travel to set: − / + on the stage.',
      minRest: 'At least 11 h of rest for everyone',
      onTime: 'Wrap on time',
      shorter: 'Shorter next day',
      far: 'Those who live far (60 min or more)',
      far_none: 'Own car',
      far_room: 'Room nearby',
      far_driver: 'A driver',
      who: 'Whose week',
      oParam: 'Overrun: {day}',
      tParam: 'Travel to set: {who}',

      preset_planned: 'The planned week',
      hint_planned: '11 h days, 13 h turnaround',
      preset_overrun: 'Every day 2 h over',
      hint_overrun: 'turnaround 11 h, sleep 5 h 45',
      'preset_min-rest': 'At least 11 h of rest',
      'hint_min-rest': 'calls move later, the drive still past 17 h',
      preset_shorter: 'Shorter next day',
      hint_shorter: 'only Monday is long',
      preset_room: 'A room near the location',
      hint_room: '15 min to set: 8 h of sleep',
      preset_driver: 'A driver for those far away',
      hint_driver: 'not at the wheel, the debt stays',

      crew_grip: 'Grip',
      crew_makeup: 'Make-up artist',
      crew_ac: 'Camera assistant',
      day0: 'Mon', day1: 'Tue', day2: 'Wed', day3: 'Thu', day4: 'Fri',
      dayIn0: 'on Monday', dayIn1: 'on Tuesday', dayIn2: 'on Wednesday', dayIn3: 'on Thursday', dayIn4: 'on Friday',

      weekOf: 'Week: {who}',
      travelTo: '{t} to set',
      roomedTo: 'room nearby: {t} to set',
      axis: 'hours awake, counting sleep owed',
      line17: '17 h ≈ 0.5 ‰',
      over: 'over {d}',
      overNone: 'no overrun',
      less: 'less',
      more: 'more',
      atMin: 'at the minimum',
      atMax: 'at the maximum',
      stepLabel: '{what}: {dir}',
      ta: 'turnaround {d}',
      sleep: 'sleep {d}',
      weekend: 'weekend',
      risk_low: 'low',
      risk_raised: 'raised',
      risk_high: 'high',
      passenger: 'passenger',
      badgeLabel: '{day}: {eff} awake counting the debt, risk {risk}',
      badgeLabelPass: '{day}: {eff} awake counting the debt, passenger',
      crewHead: 'Crew: the drive home, hours awake counting the debt',
      showWeek: 'Show the week: {who}',
      farMark: 'far',
      debtFri: 'owed by Friday {d}',
      debtNone: 'nothing owed',
      foot: 'Simplified; the numbers are illustrative. The production\'s safety briefing and the head of department have the final word.',

      legWork: 'planned day',
      legOver: 'overrun',
      legSleep: 'sleep',
      legDebt: 'sleep owed',
      legDrive: 'drive home: ○ low ◐ raised ● high ▭ passenger',
      legChanged: 'changed',

      capWorst: '{who}: the worst drive home is {dayIn}, {awake} awake + {debt} owed = {eff}.',
      capWorstNoDebt: '{who}: the worst drive home is {dayIn}, after {eff} awake.',
      capHigh: '17 h or more: research compares that with 0.5 ‰ blood alcohol.',
      capRaised: 'Close to the 17 h line.',
      capLow: 'Under 16 h on this page\'s illustrative scale; not a safe line.',
      capDriven: '{who} rides as a passenger: not at the wheel, and just as tired ({eff} {dayIn}).',
      capDebt: 'By Friday the sleep owed grows to {debt}.',
      capNoDebt: 'Enough sleep all week.',
      capNight: 'First night: turnaround {ta}; once packing up, travel both ways and time at home come out of it, {sleep} is left to sleep.',
      capMinRest: 'The minimum rest pushes the calls later: Friday wraps at {clock}.',
      capMinRestSat: 'The minimum rest pushes the calls later: Friday wraps only on Saturday, at {clock}.',
      capRoom: 'A room near the location: {t} to set instead of {set}.',

      explain: '<p><b>Turnaround.</b> Turnaround is the rest between one day\'s wrap and the next day\'s call. Every hour ' +
        'the day runs over comes out of it. And turnaround is not sleep: after wrap the grip still de-rigs and loads the ' +
        'truck, the camera assistant packs the camera and hands over the cards, the make-up artist comes in an hour before ' +
        'the crew; then the drive home, a meal and a shower, and in the morning waking up and the drive back. On the stage ' +
        'each day is one row, from waking to the next call.</p>' +
        '<p><b>Sleep debt.</b> Whoever sleeps less than they need (here 8 h) owes the rest; the debt adds up through the ' +
        'week and is not paid back by one longer night. The page counts each hour owed as an hour longer awake, so a row ' +
        'creeps right as the debt grows.</p>' +
        '<p><b>The drive home.</b> Reaction time worsens with hours awake. Research (Dawson and Reid, 1997; Williamson and ' +
        'Feyer, 2000) measures, after 17 to 19 hours awake, impairment like that of a blood alcohol level of 0.05 % ' +
        '(0.5 ‰), the driving limit in many countries. So the most dangerous part of a long day is often the drive home, ' +
        'most of all for those who live far: they get up earlier and drive longer.</p>' +
        '<p><b>What breaks the chain.</b> A minimum rest: the EU asks for at least 11 consecutive hours of daily rest ' +
        '(Directive 2003/88/EC, art. 3); here it counts from each crew member\'s release, so the next call moves later and ' +
        'the week slides. Rest protects sleep, but does not shorten the long day before the drive. Wrap on time: the 1st AD ' +
        'calls wrap at the planned time and what is left is shot another day. A shorter next day: the day after an overrun ' +
        'starts that much later. A room near the location or a driver for those who live far: the room gives sleep back, ' +
        'the driver takes the tired person off the wheel, but the debt stays. The rest rules and ' +
        'the Croatian law on safety at work (Zakon o zaštiti na radu) apply to everyone on set, whatever their contract.</p>' +
        '<p><b>Simplified.</b> The numbers are illustrative (the durations, the sleep need, the 16 h line, adding debt to ' +
        'time awake); the body clock, naps and the weekend are not on the page. The production\'s safety briefing and the ' +
        'head of department have the final word.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
