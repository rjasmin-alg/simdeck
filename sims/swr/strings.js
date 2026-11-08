/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of swr, in both languages (docs/sim-ui.md §9). Same keys in hr and en; {name} is a
   placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). Croatian terms follow the 50ohm.de
   Croatian translation (swr, swr_2, swr_3; CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.); the term
   pairs are not in the glossary yet (NOTES.md "Term pairs"), so the explanation writes them out.
   The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Odašiljač, napojni vod i teret: upadni i povratni val, ovojnica stojnog vala i dva SWR-metra',

      r: 'Otpor tereta R',
      rHint: 'Logaritamski koraci od 1 Ω do 1000 Ω.',
      rOff: 'Kraj voda nije otpornik: odaberi „otpornik R” da bi klizač radio.',
      z0: 'Valna impedancija voda Z₀',
      end: 'Kraj voda',
      opt_load: 'otpornik R',
      opt_open: 'otvoren',
      opt_short: 'kratki spoj',
      lossDb: 'Gubitak voda (u jednom smjeru)',
      animate: 'Trenutni napon',
      animOff: 'Isključeno: sustav traži smanjeno kretanje.',

      preset_matched: 'Prilagodba',
      preset_book_100: 'Antena 100 Ω',
      preset_book_10: 'Antena 10 Ω',
      preset_swr_3: 'SWR 3: 25 W',
      preset_folded_dipole: 'Presavijeni dipol',
      preset_lossy_open: 'Otvoren, 5 dB',
      hint_matched: 'R = Z₀ = 50 Ω: SWR 1, ništa se ne reflektira, ovojnica je ravna.',
      hint_book_100: 'Primjer iz knjige: 100 Ω na 50 Ω daje SWR 2 i 11 % reflektirane snage; maksimum na anteni.',
      hint_book_10: 'Primjer iz knjige: 10 Ω na 50 Ω daje SWR 5; minimum na anteni.',
      hint_swr_3: 'Upadna snaga 100 W, povratna 25 W: SWR 3, četvrtina snage vraća se prema odašiljaču (R = 150 Ω).',
      hint_folded_dipole: 'Presavijeni dipol ima 240–300 Ω: 300 Ω na kabelu od 50 Ω daje SWR 6.',
      hint_lossy_open: 'Antena odspojena, kabel prigušuje 5 dB: na kraju SWR ∞, a SWR-metar na odašiljaču pokazuje 1,92.',

      legFwd: 'upadni val',
      legRefl: 'povratni val',
      legEnv: 'ovojnica napona',
      legInst: 'trenutni napon',
      legExt: 'maksimum / minimum napona',
      legHalf: 'razmak λ/2',
      legChanged: 'SWR prešao u drugi raspon',

      tx: 'Odašiljač',
      load: 'Teret',
      openEnd: 'otvoren kraj',
      shortEnd: 'kratki spoj',
      fwd: 'upadni val',
      refl: 'povratni val',
      reflNone: 'nema povratnog vala',
      lossNote: 'gubitak {L} dB u svakom smjeru · ovojnica nacrtana bez gubitaka',
      axisV: 'napon',
      meterTx: 'SWR-metar na odašiljaču',
      meterLoad: 'SWR-metar na teretu',
      mPv: 'upadna snaga',
      mPr: 'povratna snaga',
      mSwr: 'SWR',
      mRefl: 'reflektirano',

      capMatched: 'Prilagodba: teret od {r} Ω na vodu od {z} Ω. Γ = 0, SWR = 1: sva snaga ide u teret, ništa se ne reflektira, a ovojnica napona je ravna.',
      capHigh: 'Antena od {r} Ω na kabelu od {z} Ω: SWR = {r} / {z} = {s}. Reflektira se {pct} snage; na vodu nastaje stojni val s maksimumima razmaknutima λ/2. Na anteni je maksimum napona.',
      capLow: 'Antena od {r} Ω na kabelu od {z} Ω: SWR = {z} / {r} = {s}. Reflektira se {pct} snage; na vodu nastaje stojni val s maksimumima razmaknutima λ/2. Na anteni je minimum napona.',
      capOpen: 'Otvoren kraj voda (prazan hod): Γ = +1, sva se snaga reflektira i SWR = ∞. Na kraju je maksimum napona, a u minimumima napon pada na nulu.',
      capShort: 'Kratko spojen kraj voda: Γ = −1, sva se snaga reflektira i SWR = ∞. Na samom kraju napon je nula.',
      capLoss: 'Uz {L} dB gubitka u svakom smjeru do SWR-metra na odašiljaču vraća se samo {pct} snage, pa on pokazuje SWR {s}: bolje nego {sl} na kraju voda.',

      explain: '<p>Antena ima <em lang="en">feed-point impedance</em> (otpor napajanja), a napojni vod <em lang="en">characteristic impedance</em> (valna impedancija) Z₀, najčešće 50 Ω. ' +
        'Ako su jednaki, postoji <em lang="en">match</em> (prilagodba): sva snaga ulazi u antenu. Ako nisu, dio snage reflektira se natrag prema odašiljaču.</p>' +
        '<p>Za čisti djelatni otpor R faktor refleksije je Γ = (R − Z₀) / (R + Z₀), a reflektira se Γ² snage. ' +
        '<em lang="en">Standing wave ratio</em> (omjer stojnog vala, SWR) je s = R / Z₀ ili Z₀ / R, tako da je s ≥ 1. ' +
        'SWR-metar mjeri <em lang="en">forward</em> i <em lang="en">reflected power</em> (upadnu i povratnu snagu) i računa s = (√P<sub>V</sub> + √P<sub>R</sub>) / (√P<sub>V</sub> − √P<sub>R</sub>). ' +
        'SWR 2 znači 11 % reflektirane snage, SWR 3 znači 25 %.</p>' +
        '<p>Upadni i povratni val zbrajaju se u <em lang="en">standing wave</em> (stojni val): napon na vodu ima maksimume U<sub>max</sub> i minimume U<sub>min</sub>, susjedni maksimumi razmaknuti su λ/2, a U<sub>max</sub> / U<sub>min</sub> = s. ' +
        'Ako je R veći od Z₀, na anteni je maksimum napona; ako je manji, minimum. Otvoren ili kratko spojen kraj reflektira sve: SWR = ∞.</p>' +
        '<p>Reflektirana snaga nije sva izgubljena kao toplina: odašiljač većinu nje ponovno reflektira prema anteni. Opasnost je za izlazni stupanj odašiljača, zato moderni uređaji pri lošem SWR-u smanjuju snagu. ' +
        'Gubitak kabela vara: prigušuje i upadni i povratni val, pa SWR-metar na odašiljaču pokazuje bolji SWR nego što ga antena ima. Uz 5 dB gubitka i odspojenu antenu vidi samo desetinu snage i pokazuje 1,92.</p>' +
        '<p>Nije prikazano: reaktivni teret, Smithov dijagram, antenski tuner, transformacija impedancije duž voda i faktor skraćenja.</p>' +
        '<p>Izvor: 50ohm.de, odjeljci o SWR-u (N, E i A razred), hrvatski prijevod.</p>',
      credit: 'Prema tekstu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; prilagođeno za simdeck.'
    },

    en: {
      stage: 'Transmitter, feed line and load: the forward and reflected waves, the standing-wave envelope and two SWR meters',

      r: 'Load resistance R',
      rHint: 'Log steps from 1 Ω to 1000 Ω.',
      rOff: 'The end of the line is not a resistor: choose "resistor R" to use the slider.',
      z0: 'Characteristic impedance Z₀',
      end: 'End of the line',
      opt_load: 'resistor R',
      opt_open: 'open',
      opt_short: 'short',
      lossDb: 'Line loss (one way)',
      animate: 'Instantaneous voltage',
      animOff: 'Off: the system asks for reduced motion.',

      preset_matched: 'Matched',
      preset_book_100: '100 Ω antenna',
      preset_book_10: '10 Ω antenna',
      preset_swr_3: 'SWR 3: 25 W',
      preset_folded_dipole: 'Folded dipole',
      preset_lossy_open: 'Open, 5 dB',
      hint_matched: 'R = Z₀ = 50 Ω: SWR 1, nothing is reflected, the envelope is flat.',
      hint_book_100: 'The book\'s example: 100 Ω on 50 Ω gives SWR 2 and 11 % reflected power; a maximum at the antenna.',
      hint_book_10: 'The book\'s example: 10 Ω on 50 Ω gives SWR 5; a minimum at the antenna.',
      hint_swr_3: 'Forward power 100 W, reflected 25 W: SWR 3, a quarter of the power returns to the transmitter (R = 150 Ω).',
      hint_folded_dipole: 'A folded dipole has 240–300 Ω: 300 Ω on 50 Ω cable gives SWR 6.',
      hint_lossy_open: 'Antenna disconnected, the cable loses 5 dB: SWR ∞ at the end, yet the meter at the transmitter reads 1.92.',

      legFwd: 'forward wave',
      legRefl: 'reflected wave',
      legEnv: 'voltage envelope',
      legInst: 'instantaneous voltage',
      legExt: 'voltage maximum / minimum',
      legHalf: 'λ/2 spacing',
      legChanged: 'SWR moved to another range',

      tx: 'Transmitter',
      load: 'Load',
      openEnd: 'open end',
      shortEnd: 'short',
      fwd: 'forward wave',
      refl: 'reflected wave',
      reflNone: 'no reflected wave',
      lossNote: '{L} dB loss each way · envelope drawn without loss',
      axisV: 'voltage',
      meterTx: 'SWR meter at the transmitter',
      meterLoad: 'SWR meter at the load',
      mPv: 'forward power',
      mPr: 'reflected power',
      mSwr: 'SWR',
      mRefl: 'reflected',

      capMatched: 'Matched: a {r} Ω load on a {z} Ω line. Γ = 0, SWR = 1: all the power goes into the load, nothing is reflected, and the voltage envelope is flat.',
      capHigh: 'A {r} Ω antenna on {z} Ω cable: SWR = {r} / {z} = {s}. {pct} of the power is reflected; a standing wave forms on the line with maxima λ/2 apart. There is a voltage maximum at the antenna.',
      capLow: 'A {r} Ω antenna on {z} Ω cable: SWR = {z} / {r} = {s}. {pct} of the power is reflected; a standing wave forms on the line with maxima λ/2 apart. There is a voltage minimum at the antenna.',
      capOpen: 'Open end (no load): Γ = +1, all the power is reflected and SWR = ∞. There is a voltage maximum at the end, and at the minima the voltage drops to zero.',
      capShort: 'Shorted end: Γ = −1, all the power is reflected and SWR = ∞. Right at the end the voltage is zero.',
      capLoss: 'With {L} dB loss each way only {pct} of the power gets back to the meter at the transmitter, so it reads SWR {s}: better than the {sl} at the end of the line.',

      explain: '<p>An antenna has a <em>feed-point impedance</em>, and the feed line a <em>characteristic impedance</em> Z₀, usually 50 Ω. ' +
        'When they are equal there is a <em>match</em>: all the power goes into the antenna. When they are not, part of the power is reflected back toward the transmitter.</p>' +
        '<p>For a purely resistive R the reflection factor is Γ = (R − Z₀) / (R + Z₀), and Γ² of the power is reflected. ' +
        'The <em>standing wave ratio</em> (SWR) is s = R / Z₀ or Z₀ / R, whichever is ≥ 1. ' +
        'An SWR meter measures the <em>forward</em> and <em>reflected power</em> and computes s = (√P<sub>V</sub> + √P<sub>R</sub>) / (√P<sub>V</sub> − √P<sub>R</sub>). ' +
        'SWR 2 means 11 % reflected power, SWR 3 means 25 %.</p>' +
        '<p>The forward and reflected waves add up to a <em>standing wave</em>: the voltage on the line has maxima U<sub>max</sub> and minima U<sub>min</sub>, neighbouring maxima are λ/2 apart, and U<sub>max</sub> / U<sub>min</sub> = s. ' +
        'If R is larger than Z₀ there is a voltage maximum at the antenna; if smaller, a minimum. An open or shorted end reflects everything: SWR = ∞.</p>' +
        '<p>Reflected power is not all lost as heat: the transmitter largely reflects it back toward the antenna again. The danger is to the transmitter\'s final stage, which is why modern radios cut their power at a bad SWR. ' +
        'Cable loss deceives: it attenuates both the forward and the reflected wave, so the meter at the transmitter reads a better SWR than the antenna has. With 5 dB loss and the antenna disconnected it sees only a tenth of the power and reads 1.92.</p>' +
        '<p>Not shown: reactive loads, the Smith chart, antenna tuners, impedance transformation along the line, and the velocity factor.</p>' +
        '<p>Source: 50ohm.de, the SWR sections (classes N, E and A), Croatian translation.</p>',
      credit: 'After text from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; adapted for simdeck.'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
