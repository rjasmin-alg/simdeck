/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of set-circuit-load, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian: the voltage symbol is U (P = U · I); crews'
   loanwords (gaffer) as the owner listed them; the terms marked (check) in NOTES.md "For the owner". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Strujni krugovi lokacije i kabel na bubnju',
      hand: 'Što uključuješ (klik na utičnicu)',
      handHint: 'Klik na praznu utičnicu uključuje, na punu isključuje.',
      reel: 'Kabel na bubnju',
      reel_coiled: 'Namotan',
      reel_unwound: 'Odmotan',
      slotParam: 'Utičnica {id}',
      empty: 'prazno',
      unplugAll: 'Isključi sve',

      'preset_one-lamp': 'Jedan reflektor od 2 kW',
      'hint_one-lamp': '2000 W / 230 V = 8,7 A od 16 A',
      preset_trip: 'Dva reflektora od 2 kW na krugu',
      hint_trip: '17,4 A > 16 A: osigurač izbaci',
      preset_spread: 'Isti reflektori na dva kruga',
      hint_spread: '8,7 A na svakom krugu',
      preset_coiled: '2 kW kroz namotan kabel',
      hint_coiled: '8,7 A, osigurač drži, kabel 170 °C',
      preset_makeup: 'Kuhalo i ogledalo na 10 A',
      hint_makeup: '13 A > 10 A u sobi za masku',
      preset_camera: 'Kuhalo i ogledalo na krugu kamere',
      hint_camera: '16,5 A > 16 A: kamera bez struje',

      dev_l650: 'Reflektor 650 W',
      dev_l1000: 'Reflektor 1 kW',
      dev_l2000: 'Reflektor 2 kW',
      dev_kettle: 'Kuhalo za vodu',
      dev_mirror: 'Svjetla ogledala',
      dev_camera: 'Kamera i monitori',
      hand_l650: '650 W',
      hand_l1000: '1 kW',
      hand_l2000: '2 kW',
      hand_kettle: 'Kuhalo',
      hand_mirror: 'Ogledalo',

      room_living: 'Dnevna soba',
      room_dining: 'Blagovaonica',
      room_hall: 'Hodnik',
      room_bedroom: 'Spavaća soba',
      dept_electric: 'rasvjeta',
      dept_camera: 'kamera',
      dept_makeup: 'maska',
      planOf: 'po planu: {dept}',

      breaker: 'Osigurač {a} A',
      limitW: 'do {kw} kW',
      ofRating: '{a} A od {r} A',
      wattsOf: '{w} W od {lim} W',
      tripped: 'IZBACIO',
      offPlan: 'tuđi krug',
      fixed: 'stalno uključeno',
      drumChip: 'kabel na bubnju: {kw} kW',
      plugTitle: '{dev}: {w} W, {a} A',
      plugLabel: 'Utičnica {id}: {what}',
      plugEmptyLabel: 'Utičnica {id}: prazno, klik uključuje {dev}',

      drumTitle: 'Kabel na bubnju, 25 m, u dnevnoj sobi',
      drumNow: 'Kroz kabel: {a} A',
      drumMode_coiled: 'namotan na bubanj',
      drumMode_unwound: 'odmotan do kraja',
      drumMax: 'Podnosi do {a} A ({kw} kW)',
      drumOver: 'iznad {limit} °C: izolacija omekšava',
      drumOk: 'ispod {limit} °C',
      drumDark: 'krug je izbacio: kabelom ne teče struja',
      tempScale: '{t} °C',
      tempLimit: 'granica {limit} °C',

      board: 'Razvodna ploča',
      boardNote: 'Spajanje na mrežu zgrade ili agregat: samo ovlašteni električari. Ovdje se vidi samo opterećenje.',
      boardOn: 'uključen',
      boardOff: 'izbacio',
      formula: 'I = P / U, U = 230 V',
      total: 'Ukupna potrošnja: {kw} kW',
      foot: 'Pojednostavljeno; brojevi su ilustrativni. Konačnu riječ imaju sigurnosni brifing produkcije i šef odjela.',

      legLamp: 'reflektor (rasvjeta)',
      legMakeup: 'uređaj maske',
      legCamera: 'oprema kamere',
      legOffPlan: 'na tuđem krugu',
      legTripped: 'izbacio, bez struje',
      legChanged: 'promijenjeno',

      capStart: 'Odaberi uređaj u postavkama i klikni na praznu utičnicu. Svaki uređaj vuče struju I = P / U.',
      capDev: '{dev}: {w} W / 230 V = {a} A.',
      capCirc: '{room}: {sum} A od {r} A.',
      capUnplug: 'Isključeno: {dev}.',
      capUnplugAll: 'Sve je isključeno.',
      capReelMode: 'Kabel je sada {mode}.',
      capReset: 'Manje opterećenje: električari vraćaju osigurač ({room}).',
      capTrip: 'Osigurač je izbacio, {room}: {sum} A > {r} A. Bez struje: {depts}.',
      capCamera: 'Kamera je ostala bez struje, usred kadra.',
      capOffPlanN: ['{n} uređaj je na tuđem krugu.', '{n} uređaja su na tuđem krugu.', '{n} uređaja je na tuđem krugu.'],
      capReelOver: 'Kabel na bubnju: {temp} °C, iznad {limit} °C. Osigurač ne izbacuje: krug vuče {a} A, ispod {r} A.',
      capReelOk: 'Kabel {mode}: {temp} °C, ispod {limit} °C.',
      capOk: 'Sve radi: {kw} kW ukupno; najmanja rezerva: {room}, {spare} W.',
      and: 'i',

      explain: '<p><b>Vati i amperi.</b> Snaga reflektora (P, u vatima) podijeljena naponom mreže (U = 230 V) daje struju ' +
        'koju vuče (I, u amperima): P = U · I, pa 2 kW pri 230 V vuče oko 8,7 A. Osigurač i kabel broje ampere, ne vate.</p>' +
        '<p><b>Osigurač.</b> Svaki strujni krug ima svoj osigurač (automatski prekidač). Krug od 16 A nosi oko 3,7 kW, ' +
        'stariji krug od 10 A oko 2,3 kW. Struje svih uređaja na krugu se zbrajaju; kad zbroj prijeđe granicu, osigurač ' +
        'izbaci. Kod malog preopterećenja ne izbaci odmah nego nakon nekoliko minuta, pa reflektori ' +
        'prođu probu i ugase se usred kadra. Sve na tom krugu ostaje bez struje, i oprema drugog odjela: zato električari ' +
        'planiraju koji je krug čiji, a ostali uključuju samo gdje im se kaže. Kuhalo u hodniku ugasi kameru.</p>' +
        '<p><b>Kabel na bubnju.</b> Kabel se grije razmjerno kvadratu struje koja kroz njega teče: dvostruka struja, ' +
        'četiri puta više topline. Odmotan predaje toplinu zraku. Namotan na bubanj, zavoji griju jedan drugoga i toplina ' +
        'izlazi samo s vanjske strane bubnja; ovdje ga isti reflektor zagrije dvanaest puta više, pa podnosi oko 4,8 A umjesto ' +
        '16,8 A. Osigurač to ne vidi: 8,7 A je daleko ispod 16 A, a izolacija već omekšava. Zato se kabel odmotava do kraja ' +
        'prije nego što se na njega išta uključi; bubnjevi imaju oznaku za dva opterećenja, namotan i odmotan. Zagrijavanje ' +
        'traje desetak minuta i više; stranica pokazuje stalno stanje.</p>' +
        '<p><b>Spajanje nije na ovoj stranici.</b> Odakle dolazi struja (razvodna ploča zgrade, agregat) planiraju i spajaju ' +
        'ovlašteni električari, u dogovoru s <i lang="en">gafferom</i> (šefom rasvjete); jači osigurač nije rješenje, jer ' +
        'odgovara žicama iza njega. Stranica pokazuje opterećenje, nikad spajanje.</p>' +
        '<p><b>Pojednostavljeno.</b> Brojevi su ilustrativni (snage, granica od 70 °C, omjer namotanog i odmotanog), a ' +
        'uređaji su čisto djelatno opterećenje. Konačnu riječ imaju sigurnosni brifing produkcije i šef odjela.</p>'
    },
    en: {
      stage: 'The location\'s circuits and a cable drum',
      hand: 'What you plug in (click a socket)',
      handHint: 'Click an empty socket to plug in, a full one to unplug.',
      reel: 'Cable drum',
      reel_coiled: 'Coiled',
      reel_unwound: 'Unwound',
      slotParam: 'Socket {id}',
      empty: 'empty',
      unplugAll: 'Unplug all',

      'preset_one-lamp': 'One 2 kW lamp',
      'hint_one-lamp': '2000 W / 230 V = 8.7 A of 16 A',
      preset_trip: 'Two 2 kW lamps on one circuit',
      hint_trip: '17.4 A > 16 A: the breaker trips',
      preset_spread: 'The same lamps on two circuits',
      hint_spread: '8.7 A on each circuit',
      preset_coiled: '2 kW through a coiled cable',
      hint_coiled: '8.7 A, the breaker holds, cable 170 °C',
      preset_makeup: 'Kettle and mirror on 10 A',
      hint_makeup: '13 A > 10 A in the make-up room',
      preset_camera: 'Kettle and mirror on the camera\'s circuit',
      hint_camera: '16.5 A > 16 A: the camera goes dark',

      dev_l650: '650 W lamp',
      dev_l1000: '1 kW lamp',
      dev_l2000: '2 kW lamp',
      dev_kettle: 'Kettle',
      dev_mirror: 'Mirror lights',
      dev_camera: 'Camera and monitors',
      hand_l650: '650 W',
      hand_l1000: '1 kW',
      hand_l2000: '2 kW',
      hand_kettle: 'Kettle',
      hand_mirror: 'Mirror',

      room_living: 'Living room',
      room_dining: 'Dining room',
      room_hall: 'Hall',
      room_bedroom: 'Bedroom',
      dept_electric: 'electric',
      dept_camera: 'camera',
      dept_makeup: 'make-up',
      planOf: 'plan: {dept}',

      breaker: 'Breaker {a} A',
      limitW: 'up to {kw} kW',
      ofRating: '{a} A of {r} A',
      wattsOf: '{w} W of {lim} W',
      tripped: 'TRIPPED',
      offPlan: 'not their circuit',
      fixed: 'always on',
      drumChip: 'cable drum: {kw} kW',
      plugTitle: '{dev}: {w} W, {a} A',
      plugLabel: 'Socket {id}: {what}',
      plugEmptyLabel: 'Socket {id}: empty, click to plug in {dev}',

      drumTitle: 'Cable drum, 25 m, in the living room',
      drumNow: 'Through the cable: {a} A',
      drumMode_coiled: 'coiled on its drum',
      drumMode_unwound: 'fully unwound',
      drumMax: 'Carries up to {a} A ({kw} kW)',
      drumOver: 'above {limit} °C: the insulation softens',
      drumOk: 'below {limit} °C',
      drumDark: 'the circuit tripped: no current in the cable',
      tempScale: '{t} °C',
      tempLimit: 'limit {limit} °C',

      board: 'Distribution board',
      boardNote: 'Connecting to the building\'s supply or a generator: licensed electricians only. This page shows the load.',
      boardOn: 'on',
      boardOff: 'tripped',
      formula: 'I = P / V, V = 230 V',
      total: 'Drawing in all: {kw} kW',
      foot: 'Simplified; the numbers are illustrative. The production\'s safety briefing and the head of department have the final word.',

      legLamp: 'lamp (electric)',
      legMakeup: 'make-up\'s device',
      legCamera: 'camera equipment',
      legOffPlan: 'on another department\'s circuit',
      legTripped: 'tripped, no power',
      legChanged: 'changed',

      capStart: 'Pick a device in the settings and click an empty socket. Each device draws a current I = P / V.',
      capDev: '{dev}: {w} W / 230 V = {a} A.',
      capCirc: '{room}: {sum} A of {r} A.',
      capUnplug: 'Unplugged: {dev}.',
      capUnplugAll: 'Everything is unplugged.',
      capReelMode: 'The cable is now {mode}.',
      capReset: 'Less load: the electricians reset the breaker ({room}).',
      capTrip: 'The breaker tripped, {room}: {sum} A > {r} A. No power: {depts}.',
      capCamera: 'The camera lost power, mid-take.',
      capOffPlanN: ['{n} device is on another department\'s circuit.', '{n} devices are on another department\'s circuit.'],
      capReelOver: 'Cable drum: {temp} °C, above {limit} °C. The breaker does not trip: the circuit draws {a} A, below {r} A.',
      capReelOk: 'Cable {mode}: {temp} °C, below {limit} °C.',
      capOk: 'All live: {kw} kW in all; least to spare: {room}, {spare} W.',
      and: 'and',

      explain: '<p><b>Watts and amps.</b> A lamp\'s power (P, in watts) divided by the mains voltage (V = 230 V) is the ' +
        'current it draws (I, in amperes): P = V × I, so 2 kW at 230 V draws about 8.7 A. The breaker and the cable count ' +
        'amps, not watts.</p>' +
        '<p><b>The breaker.</b> Every circuit has its own breaker. A 16 A circuit carries about 3.7 kW, an older 10 A ' +
        'circuit about 2.3 kW. The currents of everything on a circuit add up; when the sum passes the limit, the breaker ' +
        'trips. On a small overload it does not trip at once but after a few ' +
        'minutes, so the lamps get through the rehearsal and go out mid-take. Everything on that circuit loses power, another ' +
        'department\'s equipment too: that is why the electricians plan which circuit is whose, and everyone else plugs in only ' +
        'where they are told. A kettle in the hall puts out the camera.</p>' +
        '<p><b>The cable drum.</b> A cable heats with the current through it, with its square: twice the current, four times ' +
        'the heat. Unwound, it gives the heat to the air. Coiled on its drum, the turns heat each other and the heat leaves ' +
        'only through the outside of the drum; here the same lamp heats it twelve times more, so it carries about 4.8 A ' +
        'instead of 16.8 A. The breaker does not see it: 8.7 A is far below 16 A while the insulation is already softening. ' +
        'So a cable is unwound fully before anything is plugged into it; drums are marked with two loads, wound and unwound. ' +
        'The heating takes tens of minutes; the page shows where it settles.</p>' +
        '<p><b>The connection is not on this page.</b> Where the power comes from (the building\'s board, a generator) is ' +
        'planned and connected by licensed electricians, together with the gaffer (the head of electric); a bigger breaker is no fix, because it ' +
        'matches the wiring behind it. The page shows the load, never the connection.</p>' +
        '<p><b>Simplified.</b> The numbers are illustrative (the powers, the 70 °C limit, the coiled-to-unwound ratio), and ' +
        'the devices are purely resistive. The production\'s safety briefing and the head of department have the final word.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
