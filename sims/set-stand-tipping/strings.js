/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of set-stand-tipping, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Crews' loanwords (grip, key grip) as the owner listed
   them; stativ, vreća s pijeskom, okvir and zastavica and the other terms marked (check) in NOTES.md "For the owner". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Stativ sa strane i odozgo, momenti oko ruba prevrtanja i brzina vjetra',

      head: 'Na stativu',
      head_lamp: 'Reflektor 2 kW',
      head_flag: 'Mala zastavica 0,45 × 0,6 m',
      head_frame: 'Okvir 1,2 × 1,2 m',
      head_bigframe: 'Okvir 1,8 × 1,8 m',
      height: 'Visina glave',
      arm: 'Glava od stupa',
      reach: 'Raspon nogu',
      cm: '{v} cm',
      orient: 'Teret prema',
      orient_leg: 'nozi',
      orient_gap: 'razmaku',
      bags: 'Vreće (15 kg)',
      bagOn: 'Gdje su vreće',
      bagOn_load: 'noga pod teretom',
      bagOn_back: 'noga iza',
      bagOn_ground: 'na tlu',
      wind: 'Udar vjetra',
      hold: 'Grip drži',
      limit: 'Granica dana',

      preset_arm: 'Reflektor na kraku',
      hint_arm: 'Bez vjetra, teret između dviju nogu: prevrće se',
      preset_flag: 'Zastavica, 7 m/s',
      hint_flag: '30 od 157 N·m: stoji',
      preset_bigframe: 'Okvir 1,8 m, 7 m/s',
      hint_bigframe: '357 od 190 N·m: prevrće se',
      preset_riser: 'Okvir na 4 m',
      hint_riser: 'Spusti ga na 2 m',
      preset_ground: 'Vreće na tlu',
      hint_ground: 'Ne drže ništa dok se noga ne podigne',
      preset_limit: 'Iznad granice',
      hint_limit: '9 m/s > 8 m/s: okviri idu dolje',

      formula: 'M = F × h   F = ½·ρ·Cd·A·v²',
      side: 'Sa strane: vjetar puše slijeva',
      overTitle: 'Moment prevrtanja',
      restTitle: 'Moment stabilnosti',
      partWind: 'vjetar {f} N × {h} m',
      partOffset: 'težina glave {w} N × {d} m',
      partStandHead: 'stativ i glava {w} N × {l} m',
      partBag: 'vreća {n}: {w} N × {l} m',
      partBagsGround: ['{n} vreća na tlu: 0', '{n} vreće na tlu: 0', '{n} vreća na tlu: 0'],
      partHold: 'ruka gripa 120 N × 1,2 m',
      verdictStands: 'Stoji',
      verdictTips: 'Prevrće se',
      share: '{pct} % onoga što ga drži',
      readWind: 'Vjetar gura glavu',
      readWindSub: '{a} m² pri {v} m/s ({kmh} km/h)',
      readCrit: 'Prevrne se pri',
      readCritVal: '{v} m/s',
      readCritSub: '{kmh} km/h',
      readCritNone: 'već bez vjetra',
      readLean: 'Može se nagnuti',
      readLeanSub: 'prije nego što sam padne',
      scaleTitle: 'Brzina vjetra, m/s',
      scaleLimit: 'granica dana {v}',
      scaleCrit: 'prevrtanje',
      banner: 'Iznad granice dana: okviri i zastavice idu dolje',
      planTitle: 'Odozgo',
      planNote: 'Crtkano: rub preko kojeg se prevrće.',
      foot: 'Pojednostavnjeno, brojke su izmišljene. Zadnju riječ imaju sigurnosni brifing produkcije i key grip.',

      legWind: 'vjetar',
      legEdge: 'rub prevrtanja',
      legBagLeg: 'vreća na nozi',
      legBagGround: 'vreća na tlu',
      legOver: 'prevrće (vjetar, glava)',
      legRest: 'drži (stativ, vreće, ruka)',
      legTip: 'prevrće se (crtkano: gdje je stajao)',
      legLimit: 'granica dana',
      legCg: 'težište',

      capTips: 'Prevrće se: {o} N·m prevrtanja nadjačava {r} N·m stabilnosti.',
      capStands: 'Stoji: {o} od {r} N·m stabilnosti ({pct} %).',
      capCauseWind: 'Vjetar gura glavu s {f} N na {h} m visine, {m} N·m.',
      capCauseOffset: 'Težina glave, {w} N na {d} m od stupa, daje {m} N·m.',
      capHeldTo: 'Držao bi do {v} m/s.',
      capNoWind: 'Prevrće se i bez vjetra.',
      capTipsAt: 'Prevrnuo bi se pri {v} m/s ({kmh} km/h).',
      capLimit: '{v} m/s je iznad granice dana ({lim} m/s): okviri idu dolje, iako stativ još drži.',
      capLimitTipped: '{v} m/s je iznad granice dana ({lim} m/s): okviri i zastavice već su trebali biti dolje.',
      capBelowLimit: 'Ovaj se stativ prevrće ispod granice dana ({lim} m/s): granica ne jamči da stativ drži.',
      capBelowLimitStands: 'To je ispod granice dana ({lim} m/s): granica ne jamči da stativ drži.',
      capGround: 'Vreće na tlu ne drže ništa dok se noga već ne podigne.',
      capHold: 'Ruka gripa dodaje 144 N·m samo dok drži: to je vrijeme da se okvir spusti.',

      explain: '<p><b>Dva momenta.</b> Stativ se prevrće preko <i>ruba prevrtanja</i>, crte između dviju nogu na ' +
        'strani na koju ga gura vjetar. Prevrće ga <b>moment prevrtanja</b>: sila vjetra na glavi puta njezina visina ' +
        '(M = F × h) i težina glave puta njezin pomak od stupa. Drži ga <b>moment stabilnosti</b>: težina stativa, ' +
        'glave i vreća puta njihova udaljenost od ruba. Kad je prvi veći, stativ se prevrne.</p>' +
        '<p><b>Vjetar raste s kvadratom brzine.</b> Sila vjetra na plohu je F = ½·ρ·Cd·A·v²: dvostruko veća ploha, ' +
        'dvostruko veća sila; dvostruko jači vjetar, <b>četiri puta</b> veća sila. Okvir od 1,8 m teži 7 kg, ali pri ' +
        '7 m/s hvata 119 N. Udar vjetra kratko je jači od prosjeka, i baš tada se stativ prevrne: zato je velik ' +
        'okvir visoko u udaru tipična nezgoda.</p>' +
        '<p><b>Visina.</b> Izvlačenje stativa produljuje krak vjetra (h) i podiže težište. Na ravnom tlu visina težišta ' +
        'ne mijenja moment stabilnosti, ali s višim težištem stativ padne već pri manjem nagibu: dovoljni su udarac, ' +
        'njihanje ili meko tlo pod nogom.</p>' +
        '<p><b>Noge i vreće.</b> Širi raspon nogu udaljava rub. Kad teret i vjetar gledaju prema jednoj nozi, rub je, ' +
        'mjereno u smjeru vjetra, dvostruko dalje od stupa nego kad gledaju u razmak između dviju nogu. Vreća s ' +
        'pijeskom drži svojom udaljenošću od ruba: što je dalje od ruba, to više drži, pa kad teret gleda u razmak, ' +
        'najviše drži vreća na nozi iza. Ekipe okreću stativ tako da je teret nad nogom i vreću vješaju na tu nogu, ' +
        'blizu stupa, da visi s noge i ne leži na tlu; tada jedna vreća drži jednako kao na bilo kojoj drugoj nozi. ' +
        'Vreća koja leži na tlu pokraj noge ne drži ništa dok se noga već ne podigne.</p>' +
        '<p><b>Kad vjetar raste.</b> Grip koji drži stup dodaje moment samo dok drži; okvir se zatim spušta. ' +
        'Granica vjetra za okvire i zastavice dogovara se prije snimanja; iznad nje okviri idu dolje, i kad ovaj ' +
        'stativ još drži, jer sljedeći udar može biti jači. A stativ se može prevrnuti i ispod granice: granica nije ' +
        'jamstvo. Okvire i stative postavljaju grip i key grip; vezivanje okvira užadima njihov je posao i ovdje se ' +
        'ne prikazuje.</p>' +
        '<p><b>Što stranica izostavlja.</b> Ravno i čvrsto tlo, stalan vjetar na visini glave (udar je samo veća ' +
        'brzina, bez trzaja), okvir okrenut ravno prema vjetru, površina samog stativa zanemarena, bez klizanja i ' +
        'savijanja. Mase, površine, granice i brzine su izmišljene, ali uvjerljive; fizika (momenti oko ruba, sila s ' +
        'kvadratom brzine) je prava. Zadnju riječ imaju sigurnosni brifing produkcije i key grip.</p>'
    },

    en: {
      stage: 'The stand from the side and from above, the moments about the tipping edge and the wind speed',

      head: 'On the stand',
      head_lamp: '2 kW lamp',
      head_flag: 'Small flag 0.45 × 0.6 m',
      head_frame: 'Frame 1.2 × 1.2 m',
      head_bigframe: 'Frame 1.8 × 1.8 m',
      height: 'Head height',
      arm: 'Head offset',
      reach: 'Legs\' reach',
      cm: '{v} cm',
      orient: 'Load toward',
      orient_leg: 'a leg',
      orient_gap: 'a gap',
      bags: 'Sandbags (15 kg)',
      bagOn: 'Where the bags go',
      bagOn_load: 'leg under load',
      bagOn_back: 'back leg',
      bagOn_ground: 'on the ground',
      wind: 'Gust',
      hold: 'A grip holds it',
      limit: 'Day\'s limit',

      preset_arm: 'Lamp on a long arm',
      hint_arm: 'No wind, load between two legs: it tips',
      preset_flag: 'Flag, 7 m/s',
      hint_flag: '30 of 157 N·m: it stands',
      preset_bigframe: '1.8 m frame, 7 m/s',
      hint_bigframe: '357 against 190 N·m: it tips',
      preset_riser: 'Frame at 4 m',
      hint_riser: 'Lower it to 2 m',
      preset_ground: 'Bags on the ground',
      hint_ground: 'They hold nothing until a leg lifts',
      preset_limit: 'Over the limit',
      hint_limit: '9 m/s > 8 m/s: frames come down',

      formula: 'M = F × h   F = ½·ρ·Cd·A·v²',
      side: 'From the side: the wind blows from the left',
      overTitle: 'Overturning moment',
      restTitle: 'Restoring moment',
      partWind: 'wind {f} N × {h} m',
      partOffset: 'head\'s weight {w} N × {d} m',
      partStandHead: 'stand and head {w} N × {l} m',
      partBag: 'bag {n}: {w} N × {l} m',
      partBagsGround: ['{n} bag on the ground: 0', '{n} bags on the ground: 0'],
      partHold: 'a grip\'s hand 120 N × 1.2 m',
      verdictStands: 'Stands',
      verdictTips: 'Tips',
      share: '{pct} % of what holds it',
      readWind: 'Wind on the head',
      readWindSub: '{a} m² at {v} m/s ({kmh} km/h)',
      readCrit: 'Tips at',
      readCritVal: '{v} m/s',
      readCritSub: '{kmh} km/h',
      readCritNone: 'even without wind',
      readLean: 'It can lean',
      readLeanSub: 'before it falls by itself',
      scaleTitle: 'Wind speed, m/s',
      scaleLimit: 'day\'s limit {v}',
      scaleCrit: 'tips',
      banner: 'Above the day\'s limit: frames and flags come down',
      planTitle: 'From above',
      planNote: 'Dashed: the edge it tips over.',
      foot: 'Simplified; the numbers are made up. The production\'s safety briefing and the key grip have the final word.',

      legWind: 'wind',
      legEdge: 'tipping edge',
      legBagLeg: 'bag on a leg',
      legBagGround: 'bag on the ground',
      legOver: 'overturns (wind, head)',
      legRest: 'holds (stand, bags, hand)',
      legTip: 'tipping (dashed: where it stood)',
      legLimit: 'day\'s limit',
      legCg: 'centre of gravity',

      capTips: 'It tips: {o} N·m overturning beats {r} N·m restoring.',
      capStands: 'It stands: {o} of {r} N·m restoring ({pct} %).',
      capCauseWind: 'The wind pushes the head with {f} N at {h} m up, {m} N·m.',
      capCauseOffset: 'The head\'s weight, {w} N at {d} m from the column, gives {m} N·m.',
      capHeldTo: 'It would have held up to {v} m/s.',
      capNoWind: 'It tips even without wind.',
      capTipsAt: 'It would tip at {v} m/s ({kmh} km/h).',
      capLimit: '{v} m/s is above the day\'s limit ({lim} m/s): frames come down, even while the stand holds.',
      capLimitTipped: '{v} m/s is above the day\'s limit ({lim} m/s): frames and flags should already be down.',
      capBelowLimit: 'This stand tips below the day\'s limit ({lim} m/s): the limit does not promise that a stand holds.',
      capBelowLimitStands: 'That is below the day\'s limit ({lim} m/s): the limit does not promise that a stand holds.',
      capGround: 'Bags on the ground hold nothing until a leg has already lifted.',
      capHold: 'The grip\'s hand adds 144 N·m only while they hold on: it buys time to lower the frame.',

      explain: '<p><b>Two moments.</b> A stand tips over its <i>tipping edge</i>, the line between two feet on the side ' +
        'the wind pushes it toward. The <b>overturning moment</b> tips it: the wind\'s push on the head times its ' +
        'height (M = F × h), and the head\'s weight times its offset from the column. The <b>restoring moment</b> holds ' +
        'it: the weight of the stand, the head and the bags times their distance from the edge. When the first is ' +
        'larger, the stand tips.</p>' +
        '<p><b>Wind grows with the square of the speed.</b> The wind\'s push on a surface is F = ½·ρ·Cd·A·v²: twice ' +
        'the area, twice the push; twice the wind speed, <b>four times</b> the push. The 1.8 m frame weighs 7 kg but ' +
        'catches 119 N at 7 m/s. A gust is briefly stronger than the average, and that is when a stand goes: a large ' +
        'frame high up in a gust is the classic accident.</p>' +
        '<p><b>Height.</b> Raising the riser lengthens the wind\'s lever (h) and lifts the centre of gravity. On level ' +
        'ground the centre of gravity\'s height does not change the restoring moment, but a higher one falls at a smaller lean: ' +
        'a knock, a rocking gust or soft ground under a foot is enough.</p>' +
        '<p><b>Legs and bags.</b> A wider leg spread moves the edge out. With the load and the wind toward one leg, the ' +
        'edge is, measured in the wind\'s direction, twice as far from the column as with them toward the gap between ' +
        'two legs. A sandbag holds by its distance from the edge: the farther from the edge, the more it holds, so with ' +
        'the load toward a gap the bag on the leg behind holds most. Crews turn the stand so the load is over a leg and ' +
        'hang the bag on that leg, close to the column, so that it hangs from the leg and does not rest on the ground; ' +
        'one bag there holds as much as on any other leg. A bag lying on the ground beside a leg holds nothing until ' +
        'the leg has already lifted.</p>' +
        '<p><b>When the wind rises.</b> A grip holding the column adds a moment only while they hold on; then the ' +
        'frame comes down. The wind limit for frames and flags is agreed before the shoot; above it frames come down, ' +
        'even while this stand still holds, because the next gust may be stronger. And a stand can tip below the ' +
        'limit: the limit is not a promise. Grips and the key grip set frames and stands; tying a frame off with lines ' +
        'is their work and is not shown here.</p>' +
        '<p><b>What the page leaves out.</b> Level, firm ground; a steady wind at the head\'s height (a gust is only a ' +
        'higher speed, without the jolt); the frame face-on to the wind; the stand\'s own surface ignored; no sliding ' +
        'or bending. Masses, areas, limits and speeds are made up but plausible; the physics (moments about the edge, ' +
        'the push with the square of the speed) is real. The production\'s safety briefing and the key grip have the ' +
        'final word.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
