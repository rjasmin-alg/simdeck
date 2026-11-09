/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the shannon-hartley page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian terms and the explanation's points follow
   50ohm-contents-hr sections/shannon_hartley_gesetzt.md (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC
   e.V.; summarised and changed) and uvod-u-racunalne-mreze ch. 6; English written for simdeck. Terms missing from
   kit/glossary.js are written out here: NOTES.md "Term pairs". Numbers reach the strings already formatted (a
   decimal comma in Croatian); unit symbols are the same in both languages. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Kapacitet kanala kao površina pravokutnika: širina je širina pojasa B, visina log₂(1 + S/N)',
      // controls
      b: 'Širina pojasa B',
      snr: 'Omjer signal-šum S/N',
      snrHint: '0 dB: signal i šum jednako su jaki',
      snrValue: '{db} (×{lin})',
      target: 'Ciljna brzina R',
      targetHint: 'Koliki S/N treba za R na ovoj širini pojasa',
      rate: 'Brzina R',
      // units (symbols, the same in both languages)
      hz: '{v} Hz', khz: '{v} kHz', mhz: '{v} MHz',
      bps: '{v} bit/s', kbps: '{v} kbit/s', mbps: '{v} Mbit/s', gbps: '{v} Gbit/s',
      db: '{v} dB',
      // presets
      'preset_zero-db': '0 dB: C = B',
      'preset_zero-dbHint': 'Signal i šum jednako jaki: 2,4 kHz nosi najviše 2400 bit/s',
      'preset_ssb-10': 'Govorni kanal, 10 dB',
      'preset_ssb-10Hint': '2,4 kHz uz 10 dB: 8,30 kbit/s. Uz 30 dB tek 23,9 kbit/s: 20 dB više, a ni trostruko.',
      'preset_double-b': 'Dvostruka širina pojasa',
      'preset_double-bHint': '4,8 kHz uz 10 dB: 16,6 kbit/s, dvostruko. Dvostruki S/N (13 dB na 2,4 kHz) daje tek 10,5 kbit/s.',
      'preset_weak-signal': 'Slab signal, −20 dB',
      'preset_weak-signalHint': '2,5 kHz uz −20 dB: granica je 35,9 bit/s, a FT8 stvarno nosi oko 6 bit/s',
      preset_hamnet: 'HAMNET, 10 MHz',
      preset_hamnetHint: '10 MHz uz 20 dB: 66,6 Mbit/s; WLAN s 20 MHz uz 30 dB: 199 Mbit/s',
      'preset_rate-above-b': 'R mnogo veća od B',
      'preset_rate-above-bHint': '48 kbit/s na 2,4 kHz je 20 bit/s po hercu: treba 60 dB',
      // legend
      legendWidth: 'širina: širina pojasa B',
      legendHeight: 'visina: log₂(1 + S/N)',
      legendArea: 'površina: kapacitet C',
      legendExample: 'primjer sustava',
      legendTarget: 'ciljna brzina R',
      legendChanged: 'C prešao potenciju od 10',
      // stage: rectangle
      axisB: 'širina pojasa B',
      axisH: 'bit/s po Hz',
      rectC: 'C = {c}',
      rectB: 'B = {b}',
      rectH: 'log₂(1 + S/N) = {v}',
      zeroLine: '0 dB: C = B',
      targetLine: 'R = {r}: treba {db}',
      targetOver: '↑ R = {r}: R/B = {x} bit/s po Hz, treba {db}',
      // stage: formula
      formulaTitle: 'Shannon-Hartleyev zakon',
      fLin: 'S/N = 10^({db} / 10) = {lin}',
      fNeed: 'R = {r}: S/N ≥ 2^(R/B) − 1 = {lin} → {db}',
      verdict_below: '✓ ispod granice',
      verdict_limit: '= točno na granici',
      verdict_above: '✗ iznad granice',
      // stage: curve
      curveTitle: 'C/B prema S/N',
      curveX: 'S/N (dB)',
      curveNow: 'sada',
      curveNeed: 'treba',
      // stage: examples
      exTitle: 'Primjeri sustava',
      exHint: 'klik učita B i S/N',
      exSystem: 'sustav',
      exC: 'C najviše',
      ex_ft8: 'FT8/WSPR*',
      ex_ssb: 'govorni kanal (SSB)',
      ex_hamnet: 'HAMNET',
      ex_wlan: 'WLAN',
      exShort_ft8: 'FT8*', exShort_ssb: 'SSB', exShort_hamnet: 'HAMNET', exShort_wlan: 'WLAN',
      exLoad: 'Učitaj {name}: {b}, {snr}',
      exRefNote: '* S/N u referentnom pojasu 2,5 kHz, ne u 50 Hz koje FT8 zauzima: to je druga veličina i ne uvrštava se izravno. FT8 nosi 77 bitova u 12,6 s, oko 6 bit/s.',
      // captions
      captionZero: 'Uz omjer signal-šum od 0 dB kapacitet je jednak širini pojasa: {b} daje najviše {c}. Za dvostruko veću brzinu na istom pojasu treba 4,8 dB, za četverostruku već 11,8 dB.',
      captionMain: '{b} uz {snr} (S/N = {lin}): C = {b} · {bph} bit/s po Hz = {c}. To je gornja granica; stvarni sustavi ostaju ispod nje.',
      captionTarget: 'Za R = {r} na ovom pojasu treba barem {need}.',
      captionBelow: 'Uz {snr} R je ispod granice: moguće, uz dobru korekciju pogrešaka.',
      captionLimit: 'Uz {snr} R je točno na granici: dostiže se samo u limesu.',
      captionAbove: 'Uz {snr} R je iznad granice: nijedna modulacija to ne postiže.',
      captionSteep: 'R je {x}× B: potreban S/N raste oko 3 dB za svaki dodatni bit po hercu.',
      // attribution (CC BY 4.0)
      credit: 'Prema tekstu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; sažeto i prilagođeno za simdeck.',
      explain:
        '<p><em lang="en">Channel capacity</em> (kapacitet kanala) C najveća je <em lang="en">data rate</em> (brzina prijenosa podataka) koju kanal može prenijeti bez pogrešaka. Shannon-Hartleyev zakon: C = B · log₂(1 + S/N) bit/s. B je <em lang="en">bandwidth</em> (širina pojasa) u Hz, a S/N <em lang="en">signal-to-noise ratio</em> (omjer signal-šum) kao omjer snaga, ne u dB. Računa se samo <em lang="en">noise</em> (šum) unutar korištenog pojasa.</p>' +
        '<p>Iz dB: S/N = 10^(dB/10). Uz 0 dB je S/N = 1, log₂ 2 = 1 i C = B: širina pojasa u Hz jednaka je najvećoj brzini u bit/s. To je pravilo za pamćenje, a ne opće pravilo: <em lang="en">bandwidth</em> i brzina nisu ista veličina.</p>' +
        '<p>B ulazi linearno, a S/N tek pod logaritmom. Dvostruka širina pojasa daje dvostruki kapacitet; dvostruka snaga (+3 dB) donosi najviše oko jedan bit po hercu. Obrnuto, za brzinu R treba S/N = 2^(R/B) − 1, pa kad je R mnogo veća od B, potreban omjer signal-šum naglo raste. Zato brze mreže poput HAMNET-a rade u gornjem UHF i SHF području, gdje ima širokih pojasa, a uskopojasne kratkovalne veze ostaju spore.</p>' +
        '<p>C je <em lang="en">upper bound</em> (gornja granica): stvarni sustavi uvijek su ispod nje i približavaju joj se samo dobrom korekcijom pogrešaka. Nijedna modulacija, ma kako pametna, ne prelazi je.</p>' +
        '<p>Programi za slabe signale (FT8, WSPR) mjere S/N u referentnom pojasu od 2,4 ili 2,5 kHz, iako je sam signal mnogo uži. To je druga veličina i ne smije se izravno uvrstiti u formulu.</p>'
    },
    en: {
      stage: 'Channel capacity as the area of a rectangle: its width is the bandwidth B, its height log₂(1 + S/N)',
      b: 'Bandwidth B',
      snr: 'Signal-to-noise ratio S/N',
      snrHint: '0 dB: signal and noise are equally strong',
      snrValue: '{db} (×{lin})',
      target: 'Target rate R',
      targetHint: 'The S/N that R needs in this bandwidth',
      rate: 'Rate R',
      hz: '{v} Hz', khz: '{v} kHz', mhz: '{v} MHz',
      bps: '{v} bit/s', kbps: '{v} kbit/s', mbps: '{v} Mbit/s', gbps: '{v} Gbit/s',
      db: '{v} dB',
      'preset_zero-db': '0 dB: C = B',
      'preset_zero-dbHint': 'Signal and noise equally strong: 2.4 kHz carries at most 2400 bit/s',
      'preset_ssb-10': 'Voice channel, 10 dB',
      'preset_ssb-10Hint': '2.4 kHz at 10 dB: 8.30 kbit/s. At 30 dB only 23.9 kbit/s: 20 dB more for not even three times.',
      'preset_double-b': 'Double the bandwidth',
      'preset_double-bHint': '4.8 kHz at 10 dB: 16.6 kbit/s, twice as much. Double the S/N (13 dB at 2.4 kHz) gives only 10.5 kbit/s.',
      'preset_weak-signal': 'Weak signal, −20 dB',
      'preset_weak-signalHint': '2.5 kHz at −20 dB: the ceiling is 35.9 bit/s, and FT8 really carries about 6 bit/s',
      preset_hamnet: 'HAMNET, 10 MHz',
      preset_hamnetHint: '10 MHz at 20 dB: 66.6 Mbit/s; WLAN with 20 MHz at 30 dB: 199 Mbit/s',
      'preset_rate-above-b': 'R far above B',
      'preset_rate-above-bHint': '48 kbit/s in 2.4 kHz is 20 bit/s per hertz: it needs 60 dB',
      legendWidth: 'width: bandwidth B',
      legendHeight: 'height: log₂(1 + S/N)',
      legendArea: 'area: capacity C',
      legendExample: 'example system',
      legendTarget: 'target rate R',
      legendChanged: 'C crossed a power of 10',
      axisB: 'bandwidth B',
      axisH: 'bit/s per Hz',
      rectC: 'C = {c}',
      rectB: 'B = {b}',
      rectH: 'log₂(1 + S/N) = {v}',
      zeroLine: '0 dB: C = B',
      targetLine: 'R = {r}: needs {db}',
      targetOver: '↑ R = {r}: R/B = {x} bit/s per Hz, needs {db}',
      formulaTitle: 'The Shannon–Hartley law',
      fLin: 'S/N = 10^({db} / 10) = {lin}',
      fNeed: 'R = {r}: S/N ≥ 2^(R/B) − 1 = {lin} → {db}',
      verdict_below: '✓ below the bound',
      verdict_limit: '= exactly at the bound',
      verdict_above: '✗ above the bound',
      curveTitle: 'C/B against S/N',
      curveX: 'S/N (dB)',
      curveNow: 'now',
      curveNeed: 'needed',
      exTitle: 'Example systems',
      exHint: 'a click loads B and S/N',
      exSystem: 'system',
      exC: 'C at most',
      ex_ft8: 'FT8/WSPR*',
      ex_ssb: 'voice channel (SSB)',
      ex_hamnet: 'HAMNET',
      ex_wlan: 'WLAN',
      exShort_ft8: 'FT8*', exShort_ssb: 'SSB', exShort_hamnet: 'HAMNET', exShort_wlan: 'WLAN',
      exLoad: 'Load {name}: {b}, {snr}',
      exRefNote: '* S/N in a 2.5 kHz reference band, not in the 50 Hz FT8 occupies: a different quantity that does not go into the formula directly. FT8 carries 77 bits in 12.6 s, about 6 bit/s.',
      captionZero: 'At 0 dB signal-to-noise ratio the capacity equals the bandwidth: {b} gives at most {c}. Twice the rate in the same band needs 4.8 dB, four times already 11.8 dB.',
      captionMain: '{b} at {snr} (S/N = {lin}): C = {b} · {bph} bit/s per Hz = {c}. That is an upper bound; real systems stay below it.',
      captionTarget: 'R = {r} in this band needs at least {need}.',
      captionBelow: 'At {snr} R is below the bound: possible, with good error correction.',
      captionLimit: 'At {snr} R is exactly at the bound: reached only in the limit.',
      captionAbove: 'At {snr} R is above the bound: no modulation achieves it.',
      captionSteep: 'R is {x}× B: the S/N needed grows about 3 dB for every extra bit per hertz.',
      credit: 'After a text from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; summarised and adapted for simdeck.',
      explain:
        '<p><em>Channel capacity</em> C is the highest <em>data rate</em> a channel can carry without errors. The Shannon–Hartley law: C = B · log₂(1 + S/N) bit/s. B is the <em>bandwidth</em> in Hz and S/N the <em>signal-to-noise ratio</em> as a power ratio, not in dB. Only the <em>noise</em> inside the band used counts.</p>' +
        '<p>From dB: S/N = 10^(dB/10). At 0 dB, S/N = 1, log₂ 2 = 1 and C = B: the bandwidth in Hz equals the highest rate in bit/s. That is a memory rule, not a general one: bandwidth and rate are different quantities.</p>' +
        '<p>B enters linearly, S/N only under the logarithm. Twice the bandwidth gives twice the capacity; twice the power (+3 dB) adds at most about one bit per hertz. The other way round, a rate R needs S/N = 2^(R/B) − 1, so when R is far above B the signal-to-noise ratio needed explodes. That is why fast networks such as HAMNET work in the upper UHF and SHF range, where wide bands are available, and narrow short-wave links stay slow.</p>' +
        '<p>C is an <em>upper bound</em>: real systems always stay below it and approach it only with good error correction. No modulation, however clever, beats it.</p>' +
        '<p>Weak-signal software (FT8, WSPR) measures S/N in a 2.4 or 2.5 kHz reference bandwidth, even though the signal itself is much narrower. That is a different quantity and cannot go into the formula directly.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
