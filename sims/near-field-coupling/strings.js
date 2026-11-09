/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of near-field-coupling, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept).
   Croatian terms: 50ohm-contents-hr where it has them (reaktivno blisko polje, zračeće blisko polje, daleko polje,
   magnetska antena, spregnute zavojnice, jalov, dijagram zračenja); the rest are marked (check) in NOTES.md. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Napon na prijamnoj petlji prema udaljenosti, log–log, dvije petlje i struja i napon kroz jednu periodu',

      f: 'Frekvencija f',
      r: 'Udaljenost r',
      geom: 'Prijamna petlja',
      geom_side: 'pored, u ravnini',
      geom_axis: 'na osi',
      c: 'Brzina svjetlosti c',
      c_finite: 'konačna',
      c_inf: 'beskonačna',
      t: 'Vrijeme ωt',
      tNow: 'ωt = {v}°',
      play: 'Pokreni',
      pause: 'Zaustavi',
      playHint: 'Vrijeme teče u krug, jedna perioda za 5 s',
      playKey: 'vrijeme teče / staje',
      keyFwd: 'vrijeme +15°',
      keyBack: 'vrijeme −15°',

      preset_card: 'Beskontaktna kartica',
      preset_cardHint: '14 MHz na 5 cm: duboko u bliskom polju, 1/r³',
      preset_charger: '140 kHz',
      preset_chargerHint: 'Kao bežični punjač: blisko polje do 341 m, a napon ipak pada kao 1/r³',
      preset_cross: 'Kod λ/2π',
      preset_crossHint: '14 MHz na 3,55 m: 1/r³ prelazi u 1/r',
      preset_far: 'Radioveza',
      preset_farHint: '14 MHz na 1 km: daleko polje, 1/r',
      preset_axis: 'Na osi',
      preset_axisHint: '450 MHz na 10 cm: blizu 2,9 puta jače nego pored, daleko gotovo ništa',
      preset_inf: 'c beskonačna',
      preset_infHint: 'Ništa ne zrači: 1/r³ do kraja',

      legendSide: 'napon, petlja pored',
      legendAxis: 'napon, petlja na osi',
      legendAsym: 'članovi 1/r³ i 1/r (ili 1/r²)',
      legendRx: 'prijamna petlja',

      plotTitle: 'Napon na prijamnoj petlji (amplituda) prema udaljenosti r',
      plotTitleShort: 'Napon V prema udaljenosti r',
      zoneNear: 'reaktivno blisko polje',
      zoneMid: 'zračeće blisko polje',
      zoneFar: 'daleko polje',
      zoneAll: 'sve je blisko polje',
      tickCross: 'λ/2π',
      tickLambda: 'λ',
      slope1: '1/r',
      slope2: '1/r²',
      slope3: '1/r³',
      cInf: 'c = ∞',

      schKey: 'I: odašiljačka petlja, V: prijamna; magnetske silnice blizu petlje, nije u mjerilu.',
      schI: 'I',
      schV: 'V',

      rowF: 'frekvencija',
      rowCross: 'granica λ/2π',
      rowR: 'udaljenost r',
      rowZone: 'zona',
      rowV: 'napon V',
      rowN: 'pada kao 1/rⁿ, n',
      rowPh: 'faza V prema I',
      rowRatio: 'na osi ÷ pored',
      rowP: 'odlazi (zrači)',
      rowQ: 'titra tamo-amo',
      valF: '{f}, λ = {l}',
      valR: '{m} = {rl} λ',
      deg: '{v}°',
      times: '{v} puta',
      units: 'Dvije petlje promjera 1 cm, osi paralelne; 1 A u odašiljačkoj, prijamna otvorena. Snage su kroz sferu polumjera r oko odašiljačke petlje.',

      plotTime: 'Struja i napon kroz jednu periodu',
      plotDeg: 'ωt (°)',
      max: 'maks.',
      min: '−maks.',
      seriesI: 'struja I',
      seriesV: 'napon V',

      cap_main: 'Na {r} napon je {V} i pada kao 1/rⁿ uz n = {n}: dvostruko dalje, {div} puta manje.',
      p_near: 'Reaktivno blisko polje (r < λ/2π = {cross}): petlje su spregnute kao namoti labavog transformatora, napon prati struju bez kašnjenja ({ph}), a od {Q} jalove snage koja titra kroz sferu odlazi samo {P}.',
      p_nearEdge: 'Reaktivno blisko polje, blizu granice λ/2π = {cross}: dio 1/r se već osjeća i faza se pomaknula na {ph}; od {Q} jalove snage odlazi {P}.',
      p_mid: 'Iza λ/2π = {cross} preuzima dio koji zrači i pada kao 1/r; jalova snaga ({Q}) sad je manja od one koja odlazi ({P}).',
      p_midAxis: 'Iza λ/2π = {cross} na osi preuzima dio 1/r²: dijela 1/r, koji zrači, na osi nema.',
      p_far: 'Daleko polje: ostaje samo zračenje, 1/r, a faza napona okreće se 360° po valnoj duljini (kašnjenje r/c).',
      p_farAxis: 'Daleko polje na osi: tu je nula dijagrama zračenja, nema dijela 1/r, ostaje 1/r².',
      p_inf: 'S beskonačnom c ništa ne zrači: 1/r³ na svakoj udaljenosti, bez kašnjenja, a snaga koja odlazi je nula.',
      p_nearShort: 'Reaktivno blisko polje (r < λ/2π = {cross}): petlje su spregnute kao labavi transformator.',
      cap_axisNear: 'Na osi je sprega {ratio} jača nego pored, a daleko polje tu je nula: mjerač blizu antene ne mjeri njezin dijagram zračenja.',

      explain: '<p>Mala petlja (<em>magnetska antena</em>) kroz koju teče izmjenična struja ima oko sebe magnetsko polje. ' +
        'Druga petlja u tom polju dobiva napon, V = −dΦ/dt. Polje male petlje ima tri dijela: ' +
        'dio koji pada kao 1/r³ (statičko polje petlje, kao kod magneta), dio 1/r² i dio 1/r, koji jedini zrači. ' +
        'Sva tri su jednaka na kr = 1, tj. na r = λ/2π.</p>' +
        '<p><b>Reaktivno blisko polje</b> (r &lt; λ/2π). Prevladava 1/r³: dvije petlje su spregnute kao dva namota labavog ' +
        'transformatora. Dvostruko dalje, napon je 8 puta manji; deset puta dalje, tisuću puta manji. Napon prati struju bez ' +
        'kašnjenja (±90°, jer V ovisi o brzini promjene struje). Energija polja titra tamo-amo između petlje i prostora oko nje: ' +
        'otvorena prijamna petlja ne uzima ništa, pa se sve vraća, a odlazi samo mali dio koji zrači. ' +
        'Opterećena prijamna petlja uzela bi snagu iz te pohranjene energije: tako radi bežični punjač.</p>' +
        '<p><b>Zašto onda kartica radi tek na nekoliko centimetara?</b> Na 13,56 MHz blisko polje seže do 3,5 m, ' +
        'a na 140 kHz do 341 m. Domet ne određuje granica zone, nego strmi pad 1/r³: 60 dB po dekadi udaljenosti. ' +
        'Radioveza koristi dio 1/r, koji pada samo 20 dB po dekadi.</p>' +
        '<p><b>Iza λ/2π</b> preuzima zračenje, 1/r, a faza napona kasni za r/c. Promijenite frekvenciju: granica λ/2π se pomiče, ' +
        'a s njom i lom krivulje. S beskonačnom c zračenja nema, a blisko polje ostaje isto: sprega u bliskom polju nije slabo zračenje.</p>' +
        '<p><b>Na osi petlje</b> blisko polje je dvostruko jače nego u ravnini petlje, a daleko polje je nula (dijagram male petlje ' +
        'ima nulu duž osi). Mjerač držan blizu antene zato pogrešno pokazuje njezin dijagram zračenja; sprega na osi i sprega pored ' +
        'jednake su na r = 0,375 λ.</p>' +
        '<p>Model: obje petlje kao točkasti magnetski dipoli (polumjer 5 mm, od 5 cm dalje greška ispod 3 %). ' +
        'Nema opterećenja, rezonancije, više zavoja ni feritne jezgre. Izvori: Balanis, <em>Antenna Theory</em>, pogl. 5; ' +
        'Griffiths, <em>Introduction to Electrodynamics</em>, pogl. 7 i 11.</p>'
    },
    en: {
      stage: 'The voltage on the receiving loop against distance, log–log, the two loops, and the current and voltage over one period',

      f: 'Frequency f',
      r: 'Distance r',
      geom: 'Receiving loop',
      geom_side: 'beside, in its plane',
      geom_axis: 'on its axis',
      c: 'Speed of light c',
      c_finite: 'finite',
      c_inf: 'infinite',
      t: 'Time ωt',
      tNow: 'ωt = {v}°',
      play: 'Play',
      pause: 'Pause',
      playHint: 'Time runs round, one period in 5 s',
      playKey: 'time runs / stops',
      keyFwd: 'time +15°',
      keyBack: 'time −15°',

      preset_card: 'Contactless card',
      preset_cardHint: '14 MHz at 5 cm: deep in the near field, 1/r³',
      preset_charger: '140 kHz',
      preset_chargerHint: 'Like a wireless charger: near field out to 341 m, yet the voltage falls as 1/r³',
      preset_cross: 'At λ/2π',
      preset_crossHint: '14 MHz at 3.55 m: 1/r³ turns into 1/r',
      preset_far: 'Radio link',
      preset_farHint: '14 MHz at 1 km: far field, 1/r',
      preset_axis: 'On the axis',
      preset_axisHint: '450 MHz at 10 cm: 2.9 times stronger than beside close in, almost nothing far out',
      preset_inf: 'c infinite',
      preset_infHint: 'Nothing radiates: 1/r³ all the way',

      legendSide: 'voltage, loop beside',
      legendAxis: 'voltage, loop on the axis',
      legendAsym: 'the 1/r³ and 1/r (or 1/r²) terms',
      legendRx: 'receiving loop',

      plotTitle: 'Voltage on the receiving loop (amplitude) against distance r',
      plotTitleShort: 'Voltage V against distance r',
      zoneNear: 'reactive near field',
      zoneMid: 'radiating near field',
      zoneFar: 'far field',
      zoneAll: 'all of it is near field',
      tickCross: 'λ/2π',
      tickLambda: 'λ',
      slope1: '1/r',
      slope2: '1/r²',
      slope3: '1/r³',
      cInf: 'c = ∞',

      schKey: 'I: transmitting, V: receiving loop; magnetic field lines close in, not to scale.',
      schI: 'I',
      schV: 'V',

      rowF: 'frequency',
      rowCross: 'boundary λ/2π',
      rowR: 'distance r',
      rowZone: 'zone',
      rowV: 'voltage V',
      rowN: 'falls as 1/rⁿ, n',
      rowPh: 'phase of V against I',
      rowRatio: 'on the axis ÷ beside',
      rowP: 'leaves (radiated)',
      rowQ: 'swings out and back',
      valF: '{f}, λ = {l}',
      valR: '{m} = {rl} λ',
      deg: '{v}°',
      times: '{v} times',
      units: 'Two loops 1 cm across, axes parallel; 1 A in the transmitting one, the receiving one open. Powers are through a sphere of radius r round the transmitting loop.',

      plotTime: 'Current and voltage over one period',
      plotDeg: 'ωt (°)',
      max: 'max',
      min: '−max',
      seriesI: 'current I',
      seriesV: 'voltage V',

      cap_main: 'At {r} the voltage is {V} and falls as 1/rⁿ with n = {n}: twice as far, {div} times less.',
      p_near: 'Reactive near field (r < λ/2π = {cross}): the loops couple like the windings of a loose transformer, the voltage follows the current with no delay ({ph}), and of the {Q} that swings out and back through the sphere only {P} leaves.',
      p_nearEdge: 'Reactive near field, close to the boundary λ/2π = {cross}: the 1/r part already shows and the phase has moved to {ph}; of the {Q} of reactive power, {P} leaves.',
      p_mid: 'Past λ/2π = {cross} the radiated part, falling as 1/r, takes over; the reactive power ({Q}) is now less than what leaves ({P}).',
      p_midAxis: 'Past λ/2π = {cross} the 1/r² part takes over on the axis: the 1/r part, which radiates, is not there.',
      p_far: 'Far field: only radiation is left, 1/r, and the voltage\'s phase turns 360° per wavelength (the delay r/c).',
      p_farAxis: 'Far field on the axis: this is the pattern\'s null, there is no 1/r part, 1/r² is left.',
      p_inf: 'With c infinite nothing radiates: 1/r³ at every distance, no delay, and the power that leaves is zero.',
      p_nearShort: 'Reactive near field (r < λ/2π = {cross}): the loops couple like a loose transformer.',
      cap_axisNear: 'On the axis the coupling is {ratio} stronger than beside, yet the far field there is zero: a meter close to an antenna does not read its pattern.',

      explain: '<p>A small loop (a <em>magnetic antenna</em>) carrying an alternating current has a magnetic field round it. ' +
        'A second loop in that field gets a voltage, V = −dΦ/dt. The small loop\'s field has three parts: one that falls as 1/r³ ' +
        '(the loop\'s static field, like a magnet\'s), one as 1/r², and one as 1/r, the only one that radiates. ' +
        'All three are equal at kr = 1, that is at r = λ/2π.</p>' +
        '<p><b>Reactive near field</b> (r &lt; λ/2π). The 1/r³ part rules: the two loops couple like the two windings of a loose ' +
        'transformer. Twice as far, the voltage is 8 times less; ten times as far, a thousand times less. The voltage follows the ' +
        'current with no delay (±90°, because V depends on how fast the current changes). The field\'s energy swings out and back ' +
        'between the loop and the space round it: an open receiving loop takes nothing, so it all comes back, and only the small ' +
        'radiated part leaves. A loaded receiving loop would draw power out of that stored energy: that is how a wireless charger works.</p>' +
        '<p><b>So why does a card work only at a few centimetres?</b> At 13.56 MHz the near field reaches 3.5 m, and at 140 kHz ' +
        '341 m. The reach is not set by the zone boundary but by the steep 1/r³ fall: 60 dB per decade of distance. A radio link ' +
        'uses the 1/r part, which falls only 20 dB per decade.</p>' +
        '<p><b>Past λ/2π</b> radiation takes over, 1/r, and the voltage\'s phase lags by r/c. Change the frequency: the boundary ' +
        'λ/2π moves, and the bend in the curve with it. With c infinite there is no radiation, and the near field stays the same: ' +
        'near-field coupling is not weak radiation.</p>' +
        '<p><b>On the loop\'s axis</b> the near field is twice as strong as in the loop\'s plane, while the far field is zero (a small ' +
        'loop\'s pattern has a null along its axis). So a meter held close to an antenna misreads its pattern; the coupling on the ' +
        'axis and beside are equal at r = 0.375 λ.</p>' +
        '<p>Model: both loops as point magnetic dipoles (radius 5 mm; from 5 cm out the error is under 3 %). No load, resonance, ' +
        'several turns or ferrite core. Sources: Balanis, <em>Antenna Theory</em>, ch. 5; Griffiths, <em>Introduction to ' +
        'Electrodynamics</em>, ch. 7 and 11.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
