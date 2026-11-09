/* SPDX-License-Identifier: AGPL-3.0-or-later
   fft-waterfall: every visible string of the page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come
   from sim.json. Numbers arrive formatted by the page (decimal comma in Croatian). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Amplitudni spektar i vodopadni dijagram',
      // params
      fs: 'Brzina uzorkovanja (I/Q)',
      N: 'Veličina FFT-a (točaka)',
      band: 'Podešeno na',
      band2m: '2 m',
      band70cm: '70 cm',
      filter: 'Filtar ispred uzorkovanja',
      zoom: 'Prikazana širina',
      zoomVal: '{w}',
      zoomFull: '{w}, sve',
      focus: 'Uvećanje oko',
      focusOff: 'Prikazan je cijeli raspon.',
      focus_dc: 'DC',
      focus_pair: 'para',
      focus_burst: 'praska',
      focus_strong: 'jakog',
      // presets
      'preset_2m-monitor': 'Pojas 2 m: 2,5 MSPS, FFT 32 768',
      'preset_2m-monitorHint': 'Cijeli pojas od 2 MHz stane u raspon od 2,5 MHz; stupac 76,3 Hz, redak svakih 13,1 ms.',
      'preset_70cm-monitor': 'Pojas 70 cm: 12,5 MSPS, FFT 32 768',
      'preset_70cm-monitorHint': 'Pojas od 10 MHz traži 12,5 MSPS; stupac 381,5 Hz, redak svakih 2,6 ms.',
      'preset_two-carriers': 'Dva nosioca 200 Hz jedan od drugog',
      'preset_two-carriersHint': 'FFT 4096 (610 Hz): jedna grba. Prebacite na 65 536 (38 Hz): dva vrha.',
      'preset_fm-burst': 'Kratki FM prasak',
      'preset_fm-burstHint': 'Prasak od 40 ms: oštar uz FFT 4096 (redak 1,6 ms), razmazan uz 65 536 (26,2 ms).',
      preset_alias: 'Alias: 0,25 MSPS bez filtra',
      preset_aliasHint: '145,200 MHz je izvan ±125 kHz i pojavljuje se na 144,950 MHz.',
      // legend
      legendTrace: 'spektar',
      legendNoise: 'srednji šum po stupcu',
      legendBins: 'granice stupaca',
      legendGuard: 'DC zaštita (±4 stupca)',
      legendAlias: 'alias (preklopljen)',
      // stage
      specTitle: 'Amplitudni spektar najnovijeg bloka',
      wfTitle: 'Vodopadni dijagram: jedan redak po bloku, najnoviji gore',
      dbfs: 'dBFS',
      mhzAxis: 'MHz',
      noise: 'šum',
      alias: 'alias',
      dc: 'DC',
      now: 'sada',
      ago: 'prije',
      timeDown: 'vrijeme ↓',
      scale: 'snaga',
      edgesNote: 'jedan stupac = {bin}',
      groupNote: ['{n} stupac po točki zaslona', '{n} stupca po točki zaslona', '{n} stupaca po točki zaslona'],
      missing: 'Nije u rasponu: prikaz je oko sredine.',
      // units
      hz: '{v} Hz',
      khz: '{v} kHz',
      mhz: '{v} MHz',
      msps: '{v} MSPS',
      ms: '{v} ms',
      us: '{v} µs',
      sec: '{v} s',
      perSec: '{v} / s',
      // card
      cardTitle: 'Što daju fs i N',
      rowSpan: 'Prikazani raspon',
      rowBin: 'Širina stupca Δf = fs/N',
      rowBlock: 'Trajanje bloka N/fs',
      rowRate: 'Redaka u sekundi',
      rowHistory: 'Povijest od 40 redaka',
      rowChannel: 'Stupaca u kanalu od 12,5 kHz',
      rowPair: 'Dva nosioca, 200 Hz',
      rowPeak: 'Najjači signal',
      spanCell: '{w}: {lo} – {hi}',
      pairOne: '{b} stupca: jedna grba',
      pairTwo: '{b} stupca: dva vrha',
      pairOff: '{b} stupca (nisu u rasponu)',
      peakCell: '{f}, {d} dBFS',
      peakAlias: '{f} (alias), {d} dBFS',
      peakNone: 'nijedan 10 dB iznad šuma',
      cardChanged: 'promijenjeno zadnjom postavkom',
      // caption
      cap_base: '{fs} i FFT od {n} točaka: svaki stupac ({term}) širok je {bin}, a novi redak vodopada dolazi svakih {block}.',
      cap_double: 'Udvostručite FFT: stupci su upola uži, a redci dolaze upola rjeđe.',
      cap_halve: 'Prepolovite FFT: stupci su dvostruko širi, a redci dolaze dvostruko češće.',
      cap_alias: 'Bez filtra se signali izvan ±{half} preklapaju u raspon: {f} vidi se na {to}, označen kao alias.',
      cap_narrow: 'Uz filtar se vidi samo raspon od {span}; signali pojasa leže izvan njega.',
      cap_pairOne: 'Dva nosioca 200 Hz jedan od drugog razmaknuta su samo {b} stupca: stapaju se u jednu grbu.',
      cap_pairTwo: 'Dva nosioca razmaknuta su {b} stupca: vide se dva vrha, ali novi redak stiže tek svakih {block}.',
      cap_burstSharp: ['Prasak od 40 ms zauzima {n} redak vodopada: početak i kraj su oštri.', 'Prasak od 40 ms zauzima {n} retka vodopada: početak i kraj su oštri.', 'Prasak od 40 ms zauzima {n} redaka vodopada: početak i kraj su oštri.'],
      cap_burstSmear: ['Prasak od 40 ms pada u {n} redak vodopada: rubovi su razmazani po bloku od {block}.', 'Prasak od 40 ms pada u samo {n} retka vodopada: rubovi su razmazani po blokovima od {block}.', 'Prasak od 40 ms pada u {n} redaka vodopada: rubovi su razmazani po blokovima od {block}.'],
      cap_burstGone: 'Prasak od 40 ms bio je prije 15–55 ms, a povijest od 40 redaka seže samo {hist} unatrag.',
      cap_burstCut: 'Povijest od 40 redaka seže samo {hist} unatrag: na dnu vodopada vidi se tek kraj praska, koji je počeo prije 55 ms.',
      // explanation
      explain: '<p>Prijamnik uzima kompleksne (I/Q) uzorke brzinom fs. Takvo uzorkovanje pokazuje frekvencije od −fs/2 do +fs/2 ' +
        'oko podešene frekvencije: <b>prikazani raspon određuje brzina uzorkovanja</b>, a ne zaslon. Za pojas od 2 MHz treba ' +
        '2,5 MSPS, za pojas od 10 MHz 12,5 MSPS.</p>' +
        '<p>FFT od N točaka dijeli taj raspon na N frekvencijskih stupaca, <em>bin</em> (frekvencijski stupac), širine ' +
        'Δf = fs/N. Ali za N točaka treba N uzoraka, pa jedan blok traje N/fs, a vodopad dobiva fs/N redaka u sekundi. ' +
        '<b>Razlučivost po frekvenciji plaća se razlučivošću u vremenu</b>: veći FFT razdvaja bliske nosioce, ali kratki ' +
        'prasak razmaže po jednom dugom bloku.</p>' +
        '<p>Hannov prozor širi svaki nosilac na nekoliko stupaca; dva jednaka nosioca razlučuju se kad su razmaknuta barem ' +
        'oko dva stupca. Šum po stupcu pada za 3 dB pri svakom udvostručenju N-a, a nosilac ostaje na istoj razini.</p>' +
        '<p><em>Amplitude spectrum</em> (amplitudni spektar) i <em>waterfall diagram</em> (vodopadni dijagram) oba imaju ' +
        'frekvenciju na vodoravnoj osi. Vodopad vrijeme pokazuje odozgo prema dolje, a svjetlinom jakost; to nije oscilogram, ' +
        'kojem je vrijeme vodoravno. Signal izvan ±fs/2 bez filtra se preklapa u raspon na f − k·fs (<em>aliasing</em> (preklapanje spektra)). Srednji stupac nosi istosmjernu (DC) smetnju, pa se ±4 stupca oko njega ne mjere.</p>' +
        '<p class="sd-attrib">Pojmovi amplitudnog spektra i vodopadnog dijagrama prema tečaju 50ohm.de (odjeljak wasserfall, ' +
        'hrvatski prijevod), © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., ' +
        '<a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; sažeto i prerađeno za simdeck.</p>'
    },
    en: {
      stage: 'Amplitude spectrum and waterfall diagram',
      fs: 'Sample rate (I/Q)',
      N: 'FFT size (points)',
      band: 'Tuned to',
      band2m: '2 m',
      band70cm: '70 cm',
      filter: 'Filter before sampling',
      zoom: 'View width',
      zoomVal: '{w}',
      zoomFull: '{w}, all',
      focus: 'Zoom round',
      focusOff: 'The whole span is shown.',
      focus_dc: 'DC',
      focus_pair: 'pair',
      focus_burst: 'burst',
      focus_strong: 'strong',
      'preset_2m-monitor': '2 m band: 2.5 MSPS, FFT 32 768',
      'preset_2m-monitorHint': 'The whole 2 MHz band fits in a 2.5 MHz span; bins of 76.3 Hz, a row every 13.1 ms.',
      'preset_70cm-monitor': '70 cm band: 12.5 MSPS, FFT 32 768',
      'preset_70cm-monitorHint': 'A 10 MHz band needs 12.5 MSPS; bins of 381.5 Hz, a row every 2.6 ms.',
      'preset_two-carriers': 'Two carriers 200 Hz apart',
      'preset_two-carriersHint': 'FFT 4096 (610 Hz): one bump. Switch to 65 536 (38 Hz): two peaks.',
      'preset_fm-burst': 'A short FM burst',
      'preset_fm-burstHint': 'A 40 ms burst: sharp at FFT 4096 (1.6 ms rows), smeared at 65 536 (26.2 ms).',
      preset_alias: 'Alias: 0.25 MSPS, no filter',
      preset_aliasHint: '145.200 MHz is outside ±125 kHz and appears at 144.950 MHz.',
      legendTrace: 'spectrum',
      legendNoise: 'mean noise per bin',
      legendBins: 'bin edges',
      legendGuard: 'DC guard (±4 bins)',
      legendAlias: 'alias (folded in)',
      specTitle: 'Amplitude spectrum of the newest block',
      wfTitle: 'Waterfall diagram: one row per block, newest at the top',
      dbfs: 'dBFS',
      mhzAxis: 'MHz',
      noise: 'noise',
      alias: 'alias',
      dc: 'DC',
      now: 'now',
      ago: 'ago',
      timeDown: 'time ↓',
      scale: 'power',
      edgesNote: 'one bin = {bin}',
      groupNote: ['{n} bin per screen column', '{n} bins per screen column'],
      missing: 'Not in the span: the view is round the centre.',
      hz: '{v} Hz',
      khz: '{v} kHz',
      mhz: '{v} MHz',
      msps: '{v} MSPS',
      ms: '{v} ms',
      us: '{v} µs',
      sec: '{v} s',
      perSec: '{v} / s',
      cardTitle: 'What fs and N give',
      rowSpan: 'Span',
      rowBin: 'Bin width Δf = fs/N',
      rowBlock: 'Block duration N/fs',
      rowRate: 'Rows per second',
      rowHistory: 'History of 40 rows',
      rowChannel: 'Bins in a 12.5 kHz channel',
      rowPair: 'Two carriers, 200 Hz',
      rowPeak: 'Strongest signal',
      spanCell: '{w}: {lo} – {hi}',
      pairOne: '{b} bins: one bump',
      pairTwo: '{b} bins: two peaks',
      pairOff: '{b} bins (not in the span)',
      peakCell: '{f}, {d} dBFS',
      peakAlias: '{f} (alias), {d} dBFS',
      peakNone: 'none 10 dB above the noise',
      cardChanged: 'changed by the last setting',
      cap_base: '{fs} and a {n}-point FFT: each {term} is {bin} wide and a new waterfall row arrives every {block}.',
      cap_double: 'Double the FFT: bins are half as wide and rows come half as often.',
      cap_halve: 'Halve the FFT: bins are twice as wide and rows come twice as often.',
      cap_alias: 'Without the filter, signals outside ±{half} fold into the span: {f} shows at {to}, labelled alias.',
      cap_narrow: 'With the filter only a {span} span is seen; the band\'s signals lie outside it.',
      cap_pairOne: 'Two carriers 200 Hz apart are only {b} bins apart: they merge into one bump.',
      cap_pairTwo: 'The two carriers are {b} bins apart: two peaks show, but a new row comes only every {block}.',
      cap_burstSharp: ['The 40 ms burst fills {n} waterfall row: its start and end are sharp.', 'The 40 ms burst fills {n} waterfall rows: its start and end are sharp.'],
      cap_burstSmear: ['The 40 ms burst falls into {n} waterfall row: its edges are smeared over a {block} block.', 'The 40 ms burst falls into only {n} waterfall rows: its edges are smeared over {block} blocks.'],
      cap_burstGone: 'The 40 ms burst was 15–55 ms ago, and the 40-row history reaches back only {hist}.',
      cap_burstCut: 'The 40-row history reaches back only {hist}: at the bottom of the waterfall only the end of the burst shows; it began 55 ms ago.',
      explain: '<p>The receiver takes complex (I/Q) samples at a rate fs. Such sampling shows the frequencies from −fs/2 to ' +
        '+fs/2 round the tuned frequency: <b>the span is set by the sample rate</b>, not by the screen. A 2 MHz band needs ' +
        '2.5 MSPS, a 10 MHz band 12.5 MSPS.</p>' +
        '<p>An N-point FFT cuts that span into N bins of width Δf = fs/N. But N points need N samples, so one block lasts ' +
        'N/fs and the waterfall gets fs/N rows a second. <b>Resolution in frequency is paid for with resolution in ' +
        'time</b>: a bigger FFT separates close carriers, but smears a short burst over one long block.</p>' +
        '<p>The Hann window spreads each carrier over a few bins; two equal carriers are resolved when they are at least ' +
        'about two bins apart. The noise per bin falls by 3 dB with every doubling of N, while a carrier stays at the ' +
        'same level.</p>' +
        '<p>The amplitude spectrum and the waterfall diagram both have frequency on the horizontal axis. The waterfall ' +
        'shows time from the top down and strength as brightness; it is not an oscillogram, whose time runs across. ' +
        'Without the filter, a signal outside ±fs/2 folds into the span at f − k·fs (aliasing). The centre bin carries ' +
        'a DC artefact, so ±4 bins round it are not measured.</p>' +
        '<p class="sd-attrib">The amplitude spectrum and waterfall diagram after the 50ohm.de course (section wasserfall, ' +
        'Croatian translation), © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., ' +
        '<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; summarised and adapted for simdeck.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
