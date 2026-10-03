/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the "from resonant circuit to antenna" page, in both languages (docs/sim-ui.md §9). Same
   keys in hr and en. {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). The original applet has no text (six figures in a loop,
   50ohm-contents-hr/contents/html/applet_schwingkreis_antenne.html, CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des
   DARC e.V.); captions and explanation are written for simdeck in both languages, with the Croatian terms of the
   50ohm-contents-hr text (titrajni krug, zavojnica, kondenzator, dipol, napojna točka). Terms missing from
   kit/glossary.js are written out here: NOTES.md "Term pairs".
   L, C, E, f₀, + and − are names, not words. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Titrajni krug koji se korak po korak otvara u dipol, s električnim poljem; desno svih šest oblika i što se mijenja',
      // controls
      flip: 'Pola periode kasnije',
      flipHint: 'Isti trenutak pola periode kasnije: naboji i polje obrnuti.',
      // presets
      presetClosed: 'Zatvoreni titrajni krug',
      presetClosedHint: 'Polje je samo između ploča kondenzatora',
      presetOpened: 'Ploče razmaknute u V',
      presetOpenedHint: 'Polje izlazi iz kondenzatora',
      presetOpen: 'Otvoreni titrajni krug',
      presetOpenHint: 'Ploče u jednom pravcu, polje daleko vani',
      presetDipole: 'Dipol',
      presetDipoleHint: 'Samo ravna žica, napajana u sredini',
      // legend
      legendE: 'električno polje E, od + prema −',
      // stage
      nameL: 'L',
      nameC: 'C',
      nameE: 'E',
      feed: 'napojna točka',
      shapesTitle: 'Šest oblika, od titrajnog kruga do antene',
      shapeN: 'Korak {n}',
      readTitle: 'Što se promijenilo',
      rowCoil: 'Zavojnica',
      rowCap: 'Kondenzator',
      rowField: 'Polje',
      rowF0: 'f₀ = 1 / (2π √(L·C))',
      turns: ['{n} zavoj', '{n} zavoja', '{n} zavoja'],
      coilNone: 'nema je: odmotana u ravnu žicu',
      cap0: 'ploče blizu jedna drugoj',
      cap1: 'ploče razmaknute',
      cap2: 'ploče rastvorene u V',
      cap3: 'ploče u jednom pravcu',
      cap4: 'ostale samo male pločice na krajevima žice',
      cap5: 'nema ga: krajevi žice nose naboj',
      fieldInside: 'samo između ploča',
      fieldBulge: 'izlazi iz kondenzatora u prostor',
      fieldSpace: 'u prostoru oko cijele žice',
      f0Start: 'polazni zatvoreni krug',
      f0Both: 'L i C manji: f₀ viša',
      f0C: 'C manji, L otprilike isti: f₀ viša',
      // captions
      caption0: 'Zatvoreni titrajni krug: zavojnica L i kondenzator C. Električno polje E zatvoreno je između bliskih ploča kondenzatora i gotovo ništa ne izlazi van.',
      caption1: 'Ploče se razmiču, zavojnica ima manje zavoja. Polje je i dalje između ploča, ali zauzima više prostora. Manji L i C znače višu rezonantnu frekvenciju.',
      caption2: 'Ploče se rastvaraju u V. Silnice polja izbočuju se iz kondenzatora u okolni prostor.',
      caption3: 'Ploče su u jednom pravcu: otvoreni titrajni krug. Polje se proteže daleko izvan kruga.',
      caption4: 'Zavojnica je odmotana u ravnu žicu, od ploča su ostale male pločice na krajevima. Polje obuhvaća cijelu žicu.',
      caption5: 'Ostala je samo ravna žica, prekinuta i napajana u sredini: dipol. Polje se širi u prostor oko njega, a dio se odvaja i putuje kao elektromagnetski val.',
      captionFlip: ' Pola periode kasnije naboji su zamijenjeni i polje pokazuje obrnuto.',
      // attribution
      credit: 'Prema apletu i slikama s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam (slike: DL9MJ), AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>U zatvorenom titrajnom krugu energija titra između električnog polja kondenzatora i magnetskog polja zavojnice. Električno polje gotovo je cijelo između bliskih ploča, pa krug u okolni prostor gotovo ništa ne zrači. Zato je dobar titrajni krug, ali loša antena.</p>' +
        '<p>Razmaknemo li ploče i rastvorimo ih, polje izlazi iz kondenzatora i zahvaća sve više prostora oko kruga. S manje zavoja i manjom petljom induktivitet je manji, s razmaknutim pločama manji je i kapacitet, pa je prema Thomsonovoj formuli f₀ = 1 / (2π √(L·C)) rezonantna frekvencija viša.</p>' +
        '<p>Na kraju ostaje ravna žica: induktivitet i kapacitet sada su raspodijeljeni duž nje. Napajana u sredini, to je dipol. Električno i magnetsko polje oko njega šire se u prostor, a dio energije odvaja se od žice i putuje kao elektromagnetski val: antena zrači.</p>' +
        '<p>Polje na slikama pokazuje jedan trenutak. Krug titra, pa se polje svake pola periode okrene (preklopnik „Pola periode kasnije”).</p>'
    },
    en: {
      stage: 'A resonant circuit opened up step by step into a dipole, with its electric field; on the right all six shapes and what changes',
      // controls
      flip: 'Half a period later',
      flipHint: 'The same instant half a period later: charges and field reversed.',
      // presets
      presetClosed: 'Closed resonant circuit',
      presetClosedHint: 'The field is only between the capacitor\'s plates',
      presetOpened: 'Plates opened to a V',
      presetOpenedHint: 'The field comes out of the capacitor',
      presetOpen: 'Open resonant circuit',
      presetOpenHint: 'Plates in one line, the field far outside',
      presetDipole: 'Dipole',
      presetDipoleHint: 'Just a straight wire, fed in the middle',
      // legend
      legendE: 'electric field E, from + to −',
      // stage
      nameL: 'L',
      nameC: 'C',
      nameE: 'E',
      feed: 'feed point',
      shapesTitle: 'Six shapes, from resonant circuit to antenna',
      shapeN: 'Step {n}',
      readTitle: 'What changed',
      rowCoil: 'Coil',
      rowCap: 'Capacitor',
      rowField: 'Field',
      rowF0: 'f₀ = 1 / (2π √(L·C))',
      turns: ['{n} turn', '{n} turns'],
      coilNone: 'gone: unwound into a straight wire',
      cap0: 'plates close together',
      cap1: 'plates pulled apart',
      cap2: 'plates opened to a V',
      cap3: 'plates in one line',
      cap4: 'only small plates left at the wire\'s ends',
      cap5: 'gone: the wire\'s ends carry the charge',
      fieldInside: 'only between the plates',
      fieldBulge: 'comes out of the capacitor into space',
      fieldSpace: 'in the space round the whole wire',
      f0Start: 'the closed circuit we start from',
      f0Both: 'L and C smaller: f₀ higher',
      f0C: 'C smaller, L about the same: f₀ higher',
      // captions
      caption0: 'A closed resonant circuit: coil L and capacitor C. The electric field E is shut in between the capacitor\'s close plates, and next to nothing gets out.',
      caption1: 'The plates move apart, the coil has fewer turns. The field is still between the plates but takes up more space. Smaller L and C mean a higher resonant frequency.',
      caption2: 'The plates open into a V. The field lines bulge out of the capacitor into the space around it.',
      caption3: 'The plates are in one line: an open resonant circuit. The field reaches far beyond the circuit.',
      caption4: 'The coil is unwound into a straight wire; of the plates, only small plates at the ends are left. The field takes in the whole wire.',
      caption5: 'Only a straight wire is left, cut and fed in the middle: a dipole. Its field spreads into the space around it, and part of it breaks away and travels as an electromagnetic wave.',
      captionFlip: ' Half a period later the charges have swapped and the field points the other way.',
      // attribution
      credit: 'After an applet and figures from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam (figures: DL9MJ), AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>In a closed resonant circuit the energy swings between the capacitor\'s electric field and the coil\'s magnetic field. The electric field sits almost entirely between the close plates, so the circuit radiates next to nothing into the space around it. That makes it a good resonant circuit but a poor antenna.</p>' +
        '<p>Pull the plates apart and open them up, and the field comes out of the capacitor and takes in more and more of the space around the circuit. With fewer turns and a smaller loop the inductance is smaller, with the plates apart so is the capacitance, so by Thomson\'s formula f₀ = 1 / (2π √(L·C)) the resonant frequency rises.</p>' +
        '<p>In the end a straight wire is left: its inductance and capacitance are now spread along it. Fed in the middle, it is a dipole. The electric and magnetic fields around it spread into space, and part of the energy breaks away from the wire and travels as an electromagnetic wave: the antenna radiates.</p>' +
        '<p>The field in the pictures shows one instant. The circuit oscillates, so the field turns round every half period (the "Half a period later" switch).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
