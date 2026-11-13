/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of set-working-load, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Crews' loanwords (grip, key grip, rigger) and the terms
   marked (check) in NOTES.md "For the owner": radno opterećenje (WLL), prekidna sila, uže, stega, omča, škopac. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Reflektor obješen o cijev na jednom ili dva užeta, sila u svakom užetu prema radnom opterećenju i prekidnoj sili',

      lamp: 'Reflektor',
      lamp_l2: 'Reflektor 2 kW, 10 kg',
      lamp_l5: 'Reflektor 5 kW, 20 kg',
      lamp_l10: 'Reflektor 10 kW, 35 kg',
      lines: 'Visi na',
      lines_one: 'jednom užetu',
      lines_two: 'dva užeta',
      angle: 'Kut među užadima',
      drop: 'Padne prije hvatanja',
      link: 'U užetu A',
      link_rated: 'sve označeno i ispravno',
      link_small: 'manji škopac (WLL 25 kg)',
      link_worn: 'istrošena omča',
      link_unrated: 'kuka bez oznake',

      preset_single: 'Jedno uže',
      hint_single: '20 od 100 kg, puca na 500',
      preset_angle: 'Dva užeta, 120°',
      hint_angle: 'Svako nosi cijeli reflektor',
      preset_drop: 'Padne 10 cm',
      hint_drop: '223 kg na užetu od 100 kg',
      preset_small: 'Manji škopac',
      hint_small: 'Najslabija karika puca',
      preset_worn: 'Istrošena omča',
      hint_worn: 'Oznaka i dalje kaže 100 kg',
      preset_wide: 'Široko, 150°',
      hint_wide: 'Otvori kut do 160°',

      formula: 'WLL = prekidna sila ÷ 5 (ovdje)   T = W ÷ (2·cos(θ/2))   T·(1 + √(1 + 2d/δ))',
      view: 'Sa strane: cijev rešetke, užad i reflektor',
      lineName: 'Uže {id}',
      lineOf: 'uže {id}',
      piece_clamp: 'stega',
      piece_sling: 'čelična omča',
      piece_shackle: 'škopac',
      piece_smallShackle: 'manji škopac',
      piece_wornSling: 'istrošena omča',
      piece_hook: 'kuka bez oznake',
      pieceWll: 'WLL {v} kg',
      pieceNoWll: 'bez oznake',
      pieceBreaks: 'puca na {v} kg',
      weakest: 'najslabija',
      state_ok: 'u granici',
      state_over: 'iznad WLL-a',
      state_unrated: 'bez WLL-a',
      state_breaks: 'puca',
      kgN: '{kg} kg ({n} N)',
      kg: '{v} kg',
      share: '{pct} % WLL-a',
      shareNone: 'WLL: nema',
      margin: 'do pucanja × {x}',
      marginGone: 'preko prekidne sile',
      barWll: 'WLL {v}',
      barBreaks: 'puca {v}',
      readLamp: 'Reflektor',
      readRest: 'Na miru po užetu',
      readCatch: 'Hvatanje',
      readCatchRest: 'mirno spušten, bez trzaja; istegne se {mm} mm',
      readCatchDrop: 'sile na miru: padne {d} cm, zaustavi se na {mm} mm',
      readFactor: '× {f}',
      zone: 'Nitko ispod tereta',
      around: 'obilazi',
      dropMark: '{d} cm',
      foot: 'Pojednostavnjeno, brojke su izmišljene. Rigging postavljaju i provjeravaju riggeri i gripovi; svi ostali obilaze, nikad ispod. Zadnju riječ imaju sigurnosni brifing produkcije i key grip.',

      legLine: 'uže i njegova sila',
      legWeak: 'najslabija karika',
      legWll: 'radno opterećenje (WLL)',
      legBreak: 'prekidna sila',
      legOver: 'iznad WLL-a (šrafirano)',
      legBroken: 'puklo (crtkano)',
      legDrop: 'pad prije hvatanja',
      legZone: 'zona ispod tereta',

      capBreaks: 'Uže {id} puca: vuče {f} kg, a {piece} puca na {b} kg. Reflektor pada u zonu ispod.',
      capCauseDrop: 'Pao je {d} cm i zaustavio se na {mm} mm: to je {x} puta sila na miru.',
      capCauseWorn: 'Nova omča izdržala bi isti trzaj; trošenje je pojelo rezervu, a oznaka i dalje kaže 100 kg.',
      capCauseSmall: 'Uže je jako koliko i najslabiji komad: manji škopac, a ne omča od 100 kg.',
      capCauseHook: 'Nitko ne zna koliko kuka bez oznake drži.',
      capOver: 'Iznad radnog opterećenja: {f} kg na užetu od {wll} kg ({pct} %).',
      capOverHeld: 'Izdržalo je samo zbog rezerve do {b} kg, ostavljene za trošenje i trzaje; ovaj ju je trzaj potrošio.',
      capOverHeldPull: 'Drži samo zbog rezerve do {b} kg, ostavljene za trošenje i trzaje; ova sila već je troši.',
      capOk: 'Uže vuče {f} kg, {pct} % radnog opterećenja; puca na {b} kg (× {m}).',
      capOkTwo: 'Svako uže vuče {f} kg, {pct} % radnog opterećenja; puca na {b} kg (× {m}).',
      capAngleHalf: 'Na miru, pod kutom {a}° svako nosi više od pola reflektora od {w} kg.',
      capAngleStraight: 'Na miru, ravno, svako nosi točno pola reflektora od {w} kg.',
      capAngle120: 'Na miru, pod 120° svako uže nosi cijeli reflektor.',
      capAngleMore: 'Na miru, pod kutom {a}° svako uže nosi više od cijelog reflektora od {w} kg.',
      capUnrated: 'Kuka nema oznaku: nitko ne može reći koliko drži, pa joj u vješanju nije mjesto (ovdje visi da se vidi što bi bilo). Vuče {f} kg, a puca na nepoznatom teretu (ovdje {b} kg).',

      explain: '<p><b>Radno opterećenje i prekidna sila.</b> Svaki komad opreme za vješanje (stega, čelična omča, ' +
        'škopac) ima oznaku radnog opterećenja (<i>WLL</i>): najviše što smije nositi. Puca tek na teretu nekoliko ' +
        'puta većem, na prekidnoj sili. Omjer je <b>faktor sigurnosti</b>, ovdje 5: omča s oznakom 100 kg puca na ' +
        '500 kg. Taj razmak nije višak za dodatni teret: drži se za ono što se na setu ne vidi, trošenje, trzaj kad ' +
        'teret malo padne, nejednak raspored po užadima i kut koji vuče jače nego što oznaka pretpostavlja.</p>' +
        '<p><b>Kratak pad, velik trzaj.</b> Reflektor koji padne nekoliko centimetara prije nego što ga uže uhvati ' +
        'mora se zaustaviti na putu koliko se uže istegne, a to je malo. Energija pada (m·g·h) troši se na tom kratkom ' +
        'putu, pa je sila mnogo puta veća od težine: 20 kg koji padnu 10 cm vuku 223 kg. Što je uže kruće, to je trzaj jači; ' +
        'lakši reflektor istegne uže manje, pa je i njegov omjer veći.</p>' +
        '<p><b>Dva užeta pod kutom.</b> Kad dva užeta drže jedan teret, svako nosi pola samo dok vise ravno. Kad se ' +
        'razmaknu, svako mora vući i u stranu, pa nosi T = W ÷ (2·cos(θ/2)): više od pola, sve više što je kut veći, ' +
        'pod 120° cijeli teret svako, a pod 160° skoro tri puta toliko.</p>' +
        '<p><b>Najslabija karika.</b> Uže je jako koliko i njegov najslabiji komad. Manji škopac s oznakom 25 kg ' +
        'ograničava cijelo uže na 25 kg, koliko god jaka bila omča. Istrošena omča i dalje nosi oznaku 100 kg, ali puca ' +
        'mnogo ranije; kuka bez oznake ne kaže ništa, pa joj u vješanju nije mjesto.</p>' +
        '<p><b>Tko to radi.</b> Vješanje tereta postavljaju i provjeravaju riggeri i gripovi (<i>rigger</i>, ' +
        'stručnjak za vješanje tereta); oni biraju opremu, kut i način. Svi ostali obilaze zonu ispod tereta, nikad ' +
        'ispod: i kad sve drži, ono što padne pada tamo. Stranica ne prikazuje kako se vješa.</p>' +
        '<p><b>Što stranica izostavlja.</b> Užad su ravna i bez težine, reflektor miruje, pad zaustavlja samo istezanje ' +
        'užeta (bez prigušenja, bez popuštanja cijevi), dva užeta jednake su duljine; kad jedno od dva užeta pukne, ne prikazuje se što tada podnosi drugo (zamah, drugi trzaj); istrošena omča ima točno 40 % ' +
        'čvrstoće nove. Mase, oznake, krutost i faktor sigurnosti su izmišljeni, ali uvjerljivi; stvarna oprema ima ' +
        'različite faktore po vrsti i normi. Fizika (sila u užadima pod kutom, energija pada) je prava. Zadnju riječ ' +
        'imaju sigurnosni brifing produkcije i key grip.</p>'
    },

    en: {
      stage: 'A lamp hung from a pipe on one line or two, each line\'s pull against its working load limit and breaking strength',

      lamp: 'Lamp',
      lamp_l2: '2 kW lamp, 10 kg',
      lamp_l5: '5 kW lamp, 20 kg',
      lamp_l10: '10 kW lamp, 35 kg',
      lines: 'Hangs on',
      lines_one: 'one line',
      lines_two: 'two lines',
      angle: 'Angle between lines',
      drop: 'Drops before the catch',
      link: 'In line A',
      link_rated: 'all rated and sound',
      link_small: 'a smaller shackle (WLL 25 kg)',
      link_worn: 'a worn sling',
      link_unrated: 'a hook with no rating',

      preset_single: 'One line',
      hint_single: '20 of 100 kg, breaks at 500',
      preset_angle: 'Two lines, 120°',
      hint_angle: 'Each carries the whole lamp',
      preset_drop: 'Drops 10 cm',
      hint_drop: '223 kg on a 100 kg line',
      preset_small: 'Smaller shackle',
      hint_small: 'The weakest link breaks',
      preset_worn: 'Worn sling',
      hint_worn: 'The label still says 100 kg',
      preset_wide: 'Wide, 150°',
      hint_wide: 'Open the angle to 160°',

      formula: 'WLL = breaking ÷ 5 (here)   T = W ÷ (2·cos(θ/2))   T·(1 + √(1 + 2d/δ))',
      view: 'From the side: the grid pipe, the lines and the lamp',
      lineName: 'Line {id}',
      lineOf: 'line {id}',
      piece_clamp: 'clamp',
      piece_sling: 'steel sling',
      piece_shackle: 'shackle',
      piece_smallShackle: 'smaller shackle',
      piece_wornSling: 'worn sling',
      piece_hook: 'unrated hook',
      pieceWll: 'WLL {v} kg',
      pieceNoWll: 'no rating',
      pieceBreaks: 'breaks at {v} kg',
      weakest: 'weakest',
      state_ok: 'within',
      state_over: 'over the WLL',
      state_unrated: 'no WLL',
      state_breaks: 'breaks',
      kgN: '{kg} kg ({n} N)',
      kg: '{v} kg',
      share: '{pct} % of the WLL',
      shareNone: 'WLL: none',
      margin: 'to breaking × {x}',
      marginGone: 'past its breaking strength',
      barWll: 'WLL {v}',
      barBreaks: 'breaks {v}',
      readLamp: 'Lamp',
      readRest: 'At rest, per line',
      readCatch: 'The catch',
      readCatchRest: 'lowered gently, no jolt; stretches {mm} mm',
      readCatchDrop: 'the pull at rest: drops {d} cm, stopped in {mm} mm',
      readFactor: '× {f}',
      zone: 'Nobody under the load',
      around: 'walks around',
      dropMark: '{d} cm',
      foot: 'Simplified; the numbers are made up. Riggers and grips set and check the rigging; everyone else walks around it, never under it. The production\'s safety briefing and the key grip have the final word.',

      legLine: 'a line and its pull',
      legWeak: 'the weakest link',
      legWll: 'working load limit (WLL)',
      legBreak: 'breaking strength',
      legOver: 'over the WLL (hatched)',
      legBroken: 'broken (dashed)',
      legDrop: 'the drop before the catch',
      legZone: 'the zone below the load',

      capBreaks: 'Line {id} breaks: it pulls {f} kg, and its {piece} breaks at {b} kg. The lamp falls into the zone below.',
      capCauseDrop: 'It dropped {d} cm and was stopped in {mm} mm: {x} times the pull at rest.',
      capCauseWorn: 'A new sling would have held the same jolt; wear ate the margin, and the label still says 100 kg.',
      capCauseSmall: 'A line is as strong as its weakest piece: the smaller shackle, not the 100 kg sling.',
      capCauseHook: 'Nobody knows what a hook with no rating holds.',
      capOver: 'Over the working load limit: {f} kg on a line rated {wll} kg ({pct} %).',
      capOverHeld: 'It held only on the margin to {b} kg, kept for wear and jolts; this jolt used it up.',
      capOverHeldPull: 'It holds only on the margin to {b} kg, kept for wear and jolts; this pull already eats into it.',
      capOk: 'The line pulls {f} kg, {pct} % of its working load limit; it breaks at {b} kg (× {m}).',
      capOkTwo: 'Each line pulls {f} kg, {pct} % of its working load limit; it breaks at {b} kg (× {m}).',
      capAngleHalf: 'At rest, at {a}° each carries more than half of the {w} kg lamp.',
      capAngleStraight: 'At rest, hanging straight, each carries exactly half of the {w} kg lamp.',
      capAngle120: 'At rest, at 120° each line carries the whole lamp.',
      capAngleMore: 'At rest, at {a}° each line carries more than the whole {w} kg lamp.',
      capUnrated: 'The hook has no rating: nobody can say what it holds, so it has no place in hanging (here it hangs to show what would happen). It pulls {f} kg and breaks at an unknown load (here {b} kg).',

      explain: '<p><b>Working load limit and breaking strength.</b> Every piece of hanging hardware (a clamp, a steel ' +
        'sling, a shackle) is marked with a working load limit (<i>WLL</i>): the most it may carry. It breaks only at a ' +
        'load several times higher, its breaking strength. The ratio is the <b>safety factor</b>, here 5: a sling ' +
        'marked 100 kg breaks at 500 kg. That gap is not spare capacity for more load: it is kept for what nobody on ' +
        'set can see, wear, the jolt when a load drops a little, an uneven share between lines and an angle that pulls ' +
        'harder than the marking assumes.</p>' +
        '<p><b>A short drop, a big jolt.</b> A lamp that drops a few centimetres before the line catches it has to be ' +
        'stopped within the line\'s stretch, which is short. The energy of the drop (m·g·h) is spent over that short ' +
        'distance, so the pull is many times the weight: 20 kg dropping 10 cm pulls 223 kg. A stiffer line jolts harder; ' +
        'a lighter lamp stretches the line less, so its factor is larger.</p>' +
        '<p><b>Two lines at an angle.</b> When two lines hold one load, each carries half only while they hang straight. ' +
        'Spread apart, each has to pull sideways too, so it carries T = W ÷ (2·cos(θ/2)): more than half, more as the ' +
        'angle opens, the whole load each at 120°, and almost three times it at 160°.</p>' +
        '<p><b>The weakest link.</b> A line is as strong as its weakest piece. A smaller shackle marked 25 kg limits the ' +
        'whole line to 25 kg, however strong the sling. A worn sling still carries its 100 kg marking but breaks much ' +
        'earlier; a hook with no rating says nothing, so it has no place in hanging.</p>' +
        '<p><b>Who does it.</b> Riggers and grips set and check anything hung overhead; they choose the hardware, the ' +
        'angle and the method. Everyone else walks around the zone below the load, never under it: even when everything ' +
        'holds, whatever falls lands there. The page does not show how to rig.</p>' +
        '<p><b>What the page leaves out.</b> The lines are straight and weightless, the lamp hangs still, a drop is ' +
        'caught by the lines\' stretch alone (no damping, no give in the pipe), two lines are equally long; when one of two lines breaks, what the other then takes (the swing, a second jolt) is not shown; a worn sling ' +
        'has exactly 40 % of a new one\'s strength. Masses, markings, stiffness and the safety factor are made up but ' +
        'plausible; real hardware uses different factors by type and standard. The physics (the pull of lines at an ' +
        'angle, the energy of a drop) is real. The production\'s safety briefing and the key grip have the final ' +
        'word.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
