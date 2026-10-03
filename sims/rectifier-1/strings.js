/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the "rectifier-1" page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept).
   The Croatian texts of the original (50ohm-contents-hr/contents/html/applet_gleichrichter_1.html, CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.) are kept where they fit ("1. poluperioda", "2. poluperioda"), and
   the terms of its section are used throughout (punovalni ispravljač, srednji odcjep, provodi, zaporna, pulsirajući
   istosmjerni napon); the English is translated from the German original (50ohm-contents-dl). Captions and
   explanation follow the 50ohm-contents-hr section "vollweggleichrichter". Terms missing from kit/glossary.js are
   written out here: NOTES.md "Term pairs".
   U1, U2, Ua, Ue, D1, D2, R, T and θ are names, not words; {u1}, {u2}, {ua} are U with a subscript, put in by the page. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Punovalni ispravljač s transformatorom sa srednjim odcjepom i dvije diode; desno naponi U1, U2 i Ua u vremenu',
      // presets
      presetHalf1: '1. poluperioda',
      presetHalf1Hint: 'Gornji kraj sekundara je pozitivan: D1 provodi',
      presetHalf2: '2. poluperioda',
      presetHalf2Hint: 'Donji kraj sekundara je pozitivan: D2 provodi',
      presetBoth: 'Obje poluperiode',
      presetBothHint: 'Diode provode naizmjence, izlaz je uvijek pozitivan',
      // legend
      legendHalf1: '1. poluperioda: struja kroz D1',
      legendHalf2: '2. poluperioda: struja kroz D2',
      // stage
      centreTap: 'srednji odcjep',
      conducts: 'provodi',
      blocks: 'zaporna',
      load: 'R',
      half1: '1. poluperioda',
      half2: '2. poluperioda',
      axisT: 't',
      tickHalf: 'T/2',
      tickFull: 'T',
      readTitle: 'Što se događa',
      rowHalf: 'Poluperioda',
      rowD1: 'D1',
      rowD2: 'D2',
      rowLoad: 'Struja kroz R',
      halfNone: '—',
      halfOne: '1.: gornji kraj +, donji −',
      halfTwo: '2.: donji kraj +, gornji −',
      halfBoth: 'obje, jedna za drugom',
      dNone: '—',
      dConducts: 'provodi',
      dBlocks: 'zaporna',
      d1Alt: 'provodi u 1. poluperiodi',
      d2Alt: 'provodi u 2. poluperiodi',
      loadNone: '—',
      loadDown: 'od + prema srednjem odcjepu, uvijek u istom smjeru',
      // captions
      caption0: 'Punovalni ispravljač s dvije diode i transformatorom sa srednjim odcjepom. Gornja polovica sekundara daje {u1}, donja {u2}: jednaki su, ali suprotnog predznaka prema srednjem odcjepu. Na izlazu je {ua}.',
      caption1: '1. poluperioda: gornji kraj sekundara pozitivan je prema srednjem odcjepu. Na anodi diode D1 je pozitivna poluperioda, pa samo D1 provodi i propušta je na izlaz +. D2 na anodi ima negativnu poluperiodu i ostaje zaporna.',
      caption2: '2. poluperioda: sada je donji kraj pozitivan prema srednjem odcjepu. D1 je zaporna, a D2 provodi. Struja kroz R teče u istom smjeru kao u 1. poluperiodi, od + prema srednjem odcjepu.',
      caption3: 'Obje poluperiode: diode provode naizmjence, pa se na izlazu pojavljuju dvije poluperiode po periodi, uvijek pozitivne prema srednjem odcjepu. Srednji odcjep je minus pol pulsirajućeg istosmjernog napona {ua}.',
      // attribution
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam (slike: DL9MJ), AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>Umjesto mosnog ispravljača, punovalno ispravljanje može se postići i s dvije diode te transformatorom sa srednjim odcjepom. Za razumijevanje rada treba zasebno razmotriti pozitivnu i negativnu poluperiodu.</p>' +
        '<p>Ako je na gornjem namotu pozitivna poluperioda u odnosu na srednji odcjep, na anodi diode D1, tada samo ta dioda provodi i propušta poluperiodu na izlaz označen s +. Na anodi diode D2 je u tom trenutku negativna poluperioda i ta dioda ostaje zaporna. U sljedećoj poluperiodi D1 je zaporna, a D2 provodi.</p>' +
        '<p>Na izlazu se tako pojavljuju obje poluperiode, ali uvijek u pozitivnom smjeru prema srednjem odcjepu: U<sub>a</sub> = |U<sub>1</sub>|. Srednji odcjep je minus pol izlaznog napona. Pomoć za pamćenje, kao kod mosnog ispravljača: obje katode spojene su zajedno na plus pol.</p>' +
        '<p>Svaka polovica sekundara radi samo pola vremena. Poluvalni ispravljač s jednom diodom propustio bi samo jednu poluperiodu; ovdje izlaz ima dvije poluperiode po periodi, pa ga je lakše izgladiti.</p>'
    },
    en: {
      stage: 'A full-wave rectifier with a centre-tapped transformer and two diodes; on the right the voltages U1, U2 and Ua over time',
      // presets
      presetHalf1: '1st half-period',
      presetHalf1Hint: 'The top end of the secondary is positive: D1 conducts',
      presetHalf2: '2nd half-period',
      presetHalf2Hint: 'The bottom end of the secondary is positive: D2 conducts',
      presetBoth: 'Both half-periods',
      presetBothHint: 'The diodes take turns; the output is always positive',
      // legend
      legendHalf1: '1st half-period: current through D1',
      legendHalf2: '2nd half-period: current through D2',
      // stage
      centreTap: 'centre tap',
      conducts: 'conducts',
      blocks: 'blocks',
      load: 'R',
      half1: '1st half-period',
      half2: '2nd half-period',
      axisT: 't',
      tickHalf: 'T/2',
      tickFull: 'T',
      readTitle: 'What happens',
      rowHalf: 'Half-period',
      rowD1: 'D1',
      rowD2: 'D2',
      rowLoad: 'Current through R',
      halfNone: '—',
      halfOne: '1st: top end +, bottom end −',
      halfTwo: '2nd: bottom end +, top end −',
      halfBoth: 'both, one after the other',
      dNone: '—',
      dConducts: 'conducts',
      dBlocks: 'blocks',
      d1Alt: 'conducts in the 1st half-period',
      d2Alt: 'conducts in the 2nd half-period',
      loadNone: '—',
      loadDown: 'from + to the centre tap, always the same way',
      // captions
      caption0: 'A full-wave rectifier with two diodes and a centre-tapped transformer. The top half of the secondary gives {u1}, the bottom half {u2}: equal, but of opposite sign against the centre tap. The output is {ua}.',
      caption1: '1st half-period: the top end of the secondary is positive against the centre tap. D1\'s anode sees a positive half-wave, so only D1 conducts and passes it to the + output. D2\'s anode sees a negative half-wave, and D2 stays blocked.',
      caption2: '2nd half-period: now the bottom end is positive against the centre tap. D1 blocks and D2 conducts. The current through R flows the same way as in the 1st half-period, from + to the centre tap.',
      caption3: 'Both half-periods: the diodes take turns, so the output gets two half-waves per period, always positive against the centre tap. The centre tap is the minus pole of the pulsating DC voltage {ua}.',
      // attribution
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam (figures: DL9MJ), AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>Instead of a bridge rectifier, full-wave rectification can also be done with two diodes and a transformer with a centre tap. To see how it works, look at the positive and the negative half-period separately.</p>' +
        '<p>When the top winding carries a positive half-wave against the centre tap, at the anode of diode D1, only that diode conducts and passes the half-wave on to the output marked +. At that moment the anode of D2 sees a negative half-wave, and that diode stays blocked. In the next half-period D1 blocks and D2 conducts.</p>' +
        '<p>So both half-waves appear at the output, but always in the positive direction against the centre tap: U<sub>a</sub> = |U<sub>1</sub>|. The centre tap is the minus pole of the output voltage. The same memory aid as for the bridge rectifier: both cathodes are joined at the plus pole.</p>' +
        '<p>Each half of the secondary works only half the time. A half-wave rectifier with one diode would pass only one half-period; here the output has two half-waves per period, which makes it easier to smooth.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
