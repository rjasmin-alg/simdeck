/* SPDX-License-Identifier: AGPL-3.0-or-later
   fsk-psk-ask: every visible string of the page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come
   from sim.json. Numbers arrive formatted by the page (decimal comma in Croatian). The glossary has none of this
   sim's terms yet, so the Croatian term pairs are written out (NOTES.md, "Term pairs"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Isti bitovi kao ASK, FSK i PSK, s odlukama prijamnika',
      // params
      bits: 'Bitovi',
      scheme: 'Prikaz',
      schemeAll: 'sva tri',
      ook: 'OOK: za 0 nositelj isključen',
      afsk: 'AFSK 1200/2200 Hz (APRS)',
      noise: 'Šum',
      seed: 'Sjeme šuma',
      newNoise: 'Novi šum',
      pct: '{v} %',
      // presets
      'preset_three-ways': 'Tri načina',
      'preset_three-waysHint': '1011 0010 bez šuma: isti bitovi kao promjena amplitude, frekvencije i faze.',
      'preset_cw-ook': 'CW: uključen i isključen nositelj',
      'preset_cw-ookHint': 'ASK s A0 = 0 na 1110 1000: nositelj se uključuje i isključuje.',
      'preset_aprs-afsk': 'APRS: AFSK 1200 bit/s',
      'preset_aprs-afskHint': 'Oznaka 1200 Hz je jedan titraj po bitu, razmak 2200 Hz oko 1,83 titraja.',
      'preset_bpsk-phase': 'BPSK: skokovi faze',
      'preset_bpsk-phaseHint': '0101: na svakoj granici simbola skok od 180°; dvije točke nasuprot na kružnici.',
      'preset_noise-race': 'Utrka u šumu',
      'preset_noise-raceHint': 'Šum 40 %, sjeme 7: ASK griješi prvi, zatim FSK, PSK posljednji.',
      // legend
      legendOne: 'bit 1',
      legendZero: 'bit 0',
      legendBoundary: 'granica simbola',
      legendError: 'pogrešna odluka',
      legendJump: 'skok faze',
      legendChanged: 'promijenjen bit',
      // stage
      bitsRow: 'Poslani bitovi (klik mijenja bit)',
      symbolsHead: 'Simboli',
      bitCell: 'Bit {k}: {v}. Kliknite da ga promijenite.',
      nameAsk: 'ASK',
      nameFsk: 'FSK',
      namePsk: 'PSK',
      kindAsk: 'amplituda',
      kindFsk: 'frekvencija',
      kindPsk: 'faza',
      ruleAsk: '1: A = {a1}, 0: A = {a0}',
      ruleFsk: '1: {f1}, 0: {f0} titraja po bitu',
      ruleAfsk: '1: 1200\u00a0Hz, 0: 2200\u00a0Hz; bit {us}\u00a0µs',
      rulePsk: '1: 180°, 0: 0°',
      wrong: 'pogrešno {k} od {n}',
      axisI: 'I',
      axisQ: 'Q',
      axisF0: 'f0',
      axisF1: 'f1',
      decWrong: 'bit {k}: poslan {sent}, primljen {got}',
      // captions
      capAll: 'Isti bitovi, tri načina: ASK mijenja amplitudu, FSK frekvenciju, a PSK fazu nositelja. Kod PSK-a se na granici simbola titraj nastavlja pomaknut za 180°.',
      capAllNone: 'Isti bitovi, tri načina: ASK mijenja amplitudu, FSK frekvenciju, a PSK fazu nositelja. Ovdje se susjedni bitovi ne razlikuju, pa se faza PSK-a nigdje ne pomiče.',
      capAsk: 'ASK: 1 je nositelj amplitude {a1}, 0 nositelj amplitude {a0}. Frekvencija i faza se ne mijenjaju.',
      capOok: ' Uz OOK je nositelj za 0 isključen, kao kod CW-a.',
      capFsk: 'FSK: 1 se šalje frekvencijom f1 ({f1} titraja po bitu), 0 frekvencijom f0 ({f0}); amplituda je stalna.',
      capAfsk: 'AFSK kao kod APRS-a, 1200 bit/s: oznaka (1) od 1200 Hz je jedan titraj po bitu, razmak (0) od 2200 Hz oko 1,83 titraja. „A“ znači audio, ne amplituda.',
      capPsk: ['PSK: 0 je faza 0°, 1 je faza 180°; amplituda i frekvencija se ne mijenjaju. Na {n} granici simbola titraj se nastavlja pomaknut za 180°.',
        'PSK: 0 je faza 0°, 1 je faza 180°; amplituda i frekvencija se ne mijenjaju. Na {n} granice simbola titraj se nastavlja pomaknut za 180°.',
        'PSK: 0 je faza 0°, 1 je faza 180°; amplituda i frekvencija se ne mijenjaju. Na {n} granica simbola titraj se nastavlja pomaknut za 180°.'],
      capPskNone: 'PSK: 0 je faza 0°, 1 je faza 180°; amplituda i frekvencija se ne mijenjaju. Ovdje se susjedni bitovi ne razlikuju, pa faza ne skače.',
      capNoiseAll: 'Šum {pct}, sjeme {seed}: ASK griješi u {ask}, FSK u {fsk}, a PSK u {psk} ',
      capNoiseOne: 'Šum {pct}, sjeme {seed}: prijamnik je krivo primio {k} ',
      ofBits: ['od {n} bita.', 'od {n} bita.', 'od {n} bitova.'],
      capWhy: ' Razmak dvaju simbola: ASK {ask}, FSK {fsk}, PSK {psk}; što su simboli bliže, šum ih lakše zamijeni.',
      // footer
      explain: '<p>Bitovi se na visokofrekvencijski nositelj utiskuju promjenom jedne od triju veličina: amplitude, frekvencije ili faze. ' +
        'Utvrđene amplitude, frekvencije ili faze između kojih se prebacuje zovu se <i>symbols</i> (simboli). Ovdje svaki postupak ima dva ' +
        'simbola, pa jedan simbol nosi jedan bit.</p>' +
        '<p><i>Amplitude shift keying</i> (amplitudska manipulacija, ASK) izmjenjuje dvije amplitude: velika je 1, mala 0 (može i obrnuto). ' +
        'Kad je mala amplituda nula, nositelj se samo uključuje i isključuje: to je <i>on-off keying</i> (OOK, uključen/isključen nositelj), ' +
        'kao kod CW-a.</p>' +
        '<p><i>Frequency shift keying</i> (frekvencijska manipulacija, FSK) prebacuje između dviju frekvencija uz stalnu amplitudu: ' +
        'oznaka (<i>mark</i>, 1) i razmak (<i>space</i>, 0). <i>Audio frequency shift keying</i> (audiofrekvencijska manipulacija, AFSK) je FSK na zvučnim frekvencijama koji se ' +
        'šalje kroz obični govorni primopredajnik; „A“ znači audio, ne amplituda. APRS na 144,800 MHz radi s 1200 bit/s, oznakom ' +
        '1200 Hz i razmakom 2200 Hz.</p>' +
        '<p><i>Phase shift keying</i> (fazna manipulacija, PSK) mijenja samo fazu; amplituda i frekvencija ostaju iste. Kod BPSK-a je 0 ' +
        'faza 0°, a 1 faza 180°: na granici simbola na kojoj se susjedni bitovi razlikuju titraj se nastavlja pomaknut za pola perioda. PSK ne mijenja frekvenciju.</p>' +
        '<p>Prijamnik u modelu odlučuje za svaki bit posebno: ASK po ovojnici prema sredini između dviju amplituda, FSK po tome koja od ' +
        'dviju frekvencija ima više energije, PSK po predznaku korelacije s referentnim nositeljem. U dijagramu simbola ASK-ove točke leže ' +
        'na pozitivnoj osi I, PSK-ove nasuprot na kružnici, FSK-ove (bez AFSK-a) na dvjema osima. Isti šum ne djeluje jednako: uz OOK ' +
        'i bez AFSK-a ASK-ovi su simboli najbliži (razmak 1), FSK-ovi dalje (√2), PSK-ovi najdalje (2), pa ASK griješi prvi, a PSK posljednji. Šum je ograničen na pojas ' +
        'koji propušta ulazni filtar prijamnika.</p>' +
        '<p class="sd-attrib">' + 'Pravila prema tečaju 50ohm.de (odjeljci ask_fsk_afsk, psk, afsk), © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., ' +
        '<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; prilagođeno za simdeck.' + '</p>'
    },
    en: {
      stage: 'The same bits as ASK, FSK and PSK, with the receiver\'s decisions',
      bits: 'Bits',
      scheme: 'Show',
      schemeAll: 'all three',
      ook: 'OOK: carrier off for 0',
      afsk: 'AFSK 1200/2200 Hz (APRS)',
      noise: 'Noise',
      seed: 'Noise seed',
      newNoise: 'New noise',
      pct: '{v} %',
      'preset_three-ways': 'Three ways',
      'preset_three-waysHint': '1011 0010 without noise: the same bits as amplitude, frequency and phase changes.',
      'preset_cw-ook': 'CW: carrier on and off',
      'preset_cw-ookHint': 'ASK with A0 = 0 on 1110 1000: a keyed carrier.',
      'preset_aprs-afsk': 'APRS: AFSK at 1200 bit/s',
      'preset_aprs-afskHint': 'A 1200 Hz mark is one cycle a bit, a 2200 Hz space about 1.83 cycles.',
      'preset_bpsk-phase': 'BPSK: phase jumps',
      'preset_bpsk-phaseHint': '0101: a 180° jump at every symbol boundary; two points opposite on the circle.',
      'preset_noise-race': 'Race in the noise',
      'preset_noise-raceHint': 'Noise 40 %, seed 7: ASK makes errors first, then FSK, PSK last.',
      legendOne: 'bit 1',
      legendZero: 'bit 0',
      legendBoundary: 'symbol boundary',
      legendError: 'wrong decision',
      legendJump: 'phase jump',
      legendChanged: 'flipped bit',
      bitsRow: 'Bits sent (click to flip)',
      symbolsHead: 'Symbols',
      bitCell: 'Bit {k}: {v}. Click to flip it.',
      nameAsk: 'ASK',
      nameFsk: 'FSK',
      namePsk: 'PSK',
      kindAsk: 'amplitude',
      kindFsk: 'frequency',
      kindPsk: 'phase',
      ruleAsk: '1: A = {a1}, 0: A = {a0}',
      ruleFsk: '1: {f1}, 0: {f0} cycles a bit',
      ruleAfsk: '1: 1200\u00a0Hz, 0: 2200\u00a0Hz; bit {us}\u00a0µs',
      rulePsk: '1: 180°, 0: 0°',
      wrong: '{k} of {n} wrong',
      axisI: 'I',
      axisQ: 'Q',
      axisF0: 'f0',
      axisF1: 'f1',
      decWrong: 'bit {k}: sent {sent}, received {got}',
      capAll: 'Same bits, three ways: ASK changes the carrier\'s amplitude, FSK its frequency and PSK its phase. With PSK the oscillation continues shifted by 180° at the symbol boundary.',
      capAllNone: 'Same bits, three ways: ASK changes the carrier\'s amplitude, FSK its frequency and PSK its phase. Here no two neighbouring bits differ, so PSK\'s phase never shifts.',
      capAsk: 'ASK: a 1 is the carrier at amplitude {a1}, a 0 at amplitude {a0}. Frequency and phase stay the same.',
      capOok: ' With OOK the carrier is off for a 0, as in CW.',
      capFsk: 'FSK: a 1 is sent at f1 ({f1} cycles a bit), a 0 at f0 ({f0}); the amplitude stays the same.',
      capAfsk: 'AFSK as in APRS, 1200 bit/s: a 1200 Hz mark (1) is one cycle a bit, a 2200 Hz space (0) about 1.83 cycles. The A is audio, not amplitude.',
      capPsk: ['PSK: a 0 is phase 0°, a 1 phase 180°; amplitude and frequency stay the same. At {n} symbol boundary the oscillation continues shifted by 180°.',
        'PSK: a 0 is phase 0°, a 1 phase 180°; amplitude and frequency stay the same. At {n} symbol boundaries the oscillation continues shifted by 180°.'],
      capPskNone: 'PSK: a 0 is phase 0°, a 1 phase 180°; amplitude and frequency stay the same. Here no two neighbouring bits differ, so the phase does not jump.',
      capNoiseAll: 'Noise {pct}, seed {seed}: ASK gets {ask}, FSK {fsk} and PSK {psk} ',
      capNoiseOne: 'Noise {pct}, seed {seed}: the receiver got {k} ',
      ofBits: ['of {n} bit wrong.', 'of {n} bits wrong.'],
      capWhy: ' Distance between the two symbols: ASK {ask}, FSK {fsk}, PSK {psk}; the closer the symbols, the easier noise swaps them.',
      explain: '<p>Bits are put on a radio-frequency carrier by changing one of three things: its amplitude, its frequency or its ' +
        'phase. The fixed amplitudes, frequencies or phases the transmitter switches between are called symbols. Here each scheme has two ' +
        'symbols, so one symbol carries one bit.</p>' +
        '<p>Amplitude shift keying (ASK) switches between two amplitudes: the large one is 1, the small one 0 (it may be the other way ' +
        'round). When the small amplitude is zero, the carrier is simply switched on and off: that is on-off keying (OOK), as in CW.</p>' +
        '<p>Frequency shift keying (FSK) switches between two frequencies at a constant amplitude: the mark (1) and the space (0). AFSK is ' +
        'FSK at audio frequencies, sent through an ordinary voice transceiver; the A is audio, not amplitude. APRS on 144.800 MHz uses ' +
        '1200 bit/s with a 1200 Hz mark and a 2200 Hz space.</p>' +
        '<p>Phase shift keying (PSK) changes only the phase; amplitude and frequency stay the same. In BPSK a 0 is phase 0° and a 1 ' +
        'phase 180°: at a symbol boundary where neighbouring bits differ, the oscillation continues shifted by half a period. PSK does not change the frequency.</p>' +
        '<p>The model\'s receiver decides each bit on its own: ASK by the envelope against the midpoint of the two amplitudes, FSK by which ' +
        'of the two frequencies has more energy, PSK by the sign of the correlation with a reference carrier. In the symbol view, ASK\'s ' +
        'points lie on the positive I axis, PSK\'s opposite each other on the circle, FSK\'s (without AFSK) on the two axes. The same noise does not hurt ' +
        'them equally: with OOK and without AFSK, ASK\'s symbols are closest (distance 1), FSK\'s further apart (√2), PSK\'s furthest (2), so ASK fails first and PSK ' +
        'last. The noise is limited to the band the receiver\'s input filter passes.</p>' +
        '<p class="sd-attrib">' + 'Rules after the 50ohm.de course (sections ask_fsk_afsk, psk, afsk), © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., ' +
        '<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; adapted for simdeck.' + '</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
