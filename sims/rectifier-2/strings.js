/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the "rectifier-2" page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept).
   The Croatian texts of the original (50ohm-contents-hr/contents/html/applet_gleichrichter_2.html, CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.) are kept where they fit ("1. poluperioda", "2. poluperioda"), and
   the terms of its section are used throughout (mosni ispravljač, struja opterećenja, otpor opterećenja, provodi,
   zaporna, pulsirajući istosmjerni napon); the English is translated from the German original (50ohm-contents-dl).
   Captions and explanation follow the 50ohm-contents-hr section "brueckengleichrichter". Terms missing from
   kit/glossary.js are written out here: NOTES.md "Term pairs".
   Us, Ua, Ue, D1–D4, R and θ are names, not words; {us}, {ua} are U with a subscript, put in by the page. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Mosni ispravljač s transformatorom i četiri diode; desno naponi Us i Ua u vremenu',
      // presets
      presetHalf1: '1. poluperioda',
      presetHalf1Hint: 'Gornji kraj sekundara je pozitivan: provode D1 i D2',
      presetHalf2: '2. poluperioda',
      presetHalf2Hint: 'Donji kraj sekundara je pozitivan: provode D3 i D4',
      presetBoth: 'Obje poluperiode',
      presetBothHint: 'Parovi dioda provode naizmjence, izlaz je uvijek pozitivan',
      // legend
      legendHalf1: '1. poluperioda: struja kroz D1 i D2',
      legendHalf2: '2. poluperioda: struja kroz D3 i D4',
      // stage
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
      rowPair1: 'D1, D2',
      rowPair2: 'D3, D4',
      rowLoad: 'Struja kroz R',
      halfNone: '—',
      halfOne: '1.: gornji kraj +, donji −',
      halfTwo: '2.: donji kraj +, gornji −',
      halfBoth: 'obje, jedna za drugom',
      dNone: '—',
      dConduct: 'provode',
      dBlock: 'zaporne',
      pair1Alt: 'provode u 1. poluperiodi',
      pair2Alt: 'provode u 2. poluperiodi',
      loadNone: '—',
      loadDown: 'od + prema −, uvijek u istom smjeru',
      // captions
      caption0: 'Mosni ispravljač: transformator i četiri diode. Sekundar daje izmjenični napon {us} između dva kraja (~). Sve katode okrenute su prema plus polu, sve anode prema minus polu. Na izlazu je {ua}.',
      caption1: '1. poluperioda: gornji kraj sekundara je pozitivan. Struja teče kroz D1 do plus pola, kroz otpor opterećenja R do minus pola i kroz D2 natrag na donji kraj. D3 i D4 su zaporne.',
      caption2: '2. poluperioda: sada je donji kraj pozitivan. Struja teče kroz D3 do plus pola, kroz R do minus pola i kroz D4 natrag na gornji kraj. Kroz R teče u istom smjeru kao u 1. poluperiodi, od + prema −.',
      caption3: 'Obje poluperiode: parovi dioda provode naizmjence, pa se negativna poluperioda {us} na izlazu pojavljuje okrenuta. {ua} ima dvije poluperiode po periodi, uvijek pozitivne: pulsirajući istosmjerni napon.',
      // attribution
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam (slike: DL9MJ), AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>Zbog malog utroška, mosni ispravljač je često korišten sklop za ispravljanje. Za njega je potreban transformator i 4 diode.</p>' +
        '<p>Uz prikazani polaritet napona transformatora U<sub>s</sub> može se pratiti tok struje opterećenja i uočiti da ona uvijek teče u istom smjeru kroz otpor opterećenja R. U svakoj poluperiodi provode dvije diode u nizu, a druge dvije su zaporne.</p>' +
        '<p>Kod mosnog ispravljača diode su katodama okrenute prema plus polu, a anodama prema minus polu. Možemo si zapamtiti: „crtice” dioda sastaju se na plus izlazu. Ovaj raspored ne treba miješati s diodnim prstenastim mješačem.</p>' +
        '<p>Za razliku od ispravljača sa srednjim odcjepom, ovdje cijeli sekundar radi u obje poluperiode, pa transformatoru ne treba srednji odcjep. Zato struja u svakoj poluperiodi prolazi kroz dvije diode umjesto jedne.</p>'
    },
    en: {
      stage: 'A bridge rectifier with a transformer and four diodes; on the right the voltages Us and Ua over time',
      // presets
      presetHalf1: '1st half-period',
      presetHalf1Hint: 'The top end of the secondary is positive: D1 and D2 conduct',
      presetHalf2: '2nd half-period',
      presetHalf2Hint: 'The bottom end of the secondary is positive: D3 and D4 conduct',
      presetBoth: 'Both half-periods',
      presetBothHint: 'The diode pairs take turns; the output is always positive',
      // legend
      legendHalf1: '1st half-period: current through D1 and D2',
      legendHalf2: '2nd half-period: current through D3 and D4',
      // stage
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
      rowPair1: 'D1, D2',
      rowPair2: 'D3, D4',
      rowLoad: 'Current through R',
      halfNone: '—',
      halfOne: '1st: top end +, bottom end −',
      halfTwo: '2nd: bottom end +, top end −',
      halfBoth: 'both, one after the other',
      dNone: '—',
      dConduct: 'conduct',
      dBlock: 'block',
      pair1Alt: 'conduct in the 1st half-period',
      pair2Alt: 'conduct in the 2nd half-period',
      loadNone: '—',
      loadDown: 'from + to −, always the same way',
      // captions
      caption0: 'A bridge rectifier: a transformer and four diodes. The secondary gives an AC voltage {us} between its two ends (~). All cathodes face the plus pole, all anodes the minus pole. The output is {ua}.',
      caption1: '1st half-period: the top end of the secondary is positive. The current flows through D1 to the plus pole, through the load resistor R to the minus pole, and through D2 back to the bottom end. D3 and D4 block.',
      caption2: '2nd half-period: now the bottom end is positive. The current flows through D3 to the plus pole, through R to the minus pole, and through D4 back to the top end. Through R it flows the same way as in the 1st half-period, from + to −.',
      caption3: 'Both half-periods: the diode pairs take turns, so the negative half-wave of {us} appears flipped at the output. {ua} has two half-waves per period, always positive: a pulsating DC voltage.',
      // attribution
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam (figures: DL9MJ), AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>Because it needs little effort, the bridge rectifier is a widely used rectifier circuit. It needs a transformer and 4 diodes.</p>' +
        '<p>With the polarity of the transformer voltage U<sub>s</sub> shown, you can follow the load current and see that it always flows through the load resistor R in the same direction. In each half-period two diodes in series conduct, and the other two block.</p>' +
        '<p>In a bridge rectifier the diodes have their cathodes towards the plus pole and their anodes towards the minus pole. A memory aid: the diodes\' "bars" meet at the plus output. Don\'t confuse this arrangement with the diode ring mixer.</p>' +
        '<p>Unlike the centre-tap rectifier, here the whole secondary works in both half-periods, so the transformer needs no centre tap. In return, the current passes through two diodes in each half-period instead of one.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
