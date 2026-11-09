/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of polarization, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept).
   Croatian terms: 50ohm-contents-hr where it has them (polarizacija, vertikalna i horizontalna polarizacija, smjer
   polarizacije, gubitak zbog polarizacije, dijagram zračenja, napon praznog hoda); the rest are marked (check) in
   NOTES.md. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dva kratka dipola, A i B, val između njih i pogled duž spojnice',
      credit: 'Ideja: objašnjenje zračenja lomom silnica, s predavanja iz Antena na FER-u',

      from: 'Odašilje',
      from_a: 'A',
      from_b: 'B',
      a: 'Kut antene A od okomice',
      el: 'Elevacija antene B',
      b: 'Kut antene B',
      degVal: '{v}°',
      t: 'Vrijeme ωt',
      tNow: 'ωt = {v}°',
      play: 'Pokreni',
      pause: 'Zaustavi',
      playHint: 'Val putuje od odašiljača prema prijamniku, jedna perioda za 5 s',
      playKey: 'vrijeme teče / staje',
      keyFwd: 'vrijeme +15°',
      keyBack: 'vrijeme −15°',

      preset_matched: 'Okomito na okomito',
      preset_matchedHint: 'Puni napon, 0 dB',
      preset_slant: 'B nagnut 45°',
      preset_slantHint: 'Napon 71 %, snaga −3 dB',
      preset_crossed: 'Križna polarizacija',
      preset_crossedHint: 'B vodoravan: polje je tu, napona nema',
      preset_endon: 'B iznad A',
      preset_endonHint: 'U smjeru žice A ne zrači',
      preset_up: 'Vodoravni dipol prema gore',
      preset_upHint: 'A i B poprijeko: puni napon',
      preset_recip: 'Recipročnost',
      preset_recipHint: 'B odašilje: isti napon 76 %',

      legendPattern: 'dijagram zračenja antene A',
      legendWave: 'polje E vala',
      legendWire: 'prijamna žica',
      legendProj: 'dio E duž prijamne žice',

      roleSend: 'odašilje',
      roleRecv: 'prima',
      patternLabel: 'dijagram antene A (za predaju i prijam)',
      planeLabel: 'okomita ravnina kroz A i B',
      sight: 'spojnica',
      axisUp: 'gore',
      axisAcross: 'poprijeko',
      scaleNote: 'Nije u mjerilu: 1 km = 33 λ, nacrtana su 3 λ',
      nothing: 'u ovom smjeru nema polja',
      voltNow: 'u = {v} mV',

      viewTitle: 'Pogled duž spojnice, s B prema A',
      viewUp: 'gore',
      viewRight: 'poprijeko',
      viewE: 'E',
      viewA: 'A (skraćeno, sin θ)',
      viewB: 'B',
      viewNone: 'nema polja',

      rowTheta: 'kut žice A prema spojnici θ',
      rowGain: 'dijagram antene A, sin θ',
      rowTau: 'smjer E (pogled iz B)',
      rowTauA: 'žica A (pogled iz B)',
      rowB: 'kut antene B',
      rowMis: 'kut između E i prijamne žice',
      rowPlf: 'faktor polarizacije cos²',
      rowE: 'polje na prijamniku',
      rowV: 'napon na prijamniku',
      rowP: 'snaga u odnosu na najbolju',
      deg: '{v}°',
      pctDb: '{p} ({d})',
      dbVal: '{v} dB',
      dbNone: '−∞ dB',
      dash: '—',
      mvm: '{v} mV/m',
      mv: '{v} mV',
      mvPct: '{v} mV, {p}',
      anti: 'protufazno',
      units: 'Dva kratka dipola λ/50 (0,6 m), 1 A, 10 MHz, 1 km razmaka. Napon: napon praznog hoda, vršni.',

      plotTitle: 'Napon i snaga na prijamniku dok se B okreće',
      seriesV: 'napon',
      seriesP: 'snaga',
      plotOne: '1',
      plotMinus: '−1',

      cap_a: 'A odašilje. Prema B njegova žica stoji pod {theta} prema spojnici, pa polje ima {gain} najvećeg i leži pod {tau} u pogledu iz B.',
      cap_a_end: 'A odašilje, a B je na osi žice A: u tom smjeru žica nema poprečnog dijela, pa nema ni polja ni napona, kako god okrenuli B.',
      cap_b: 'B odašilje i uvijek je okomit na spojnicu, pa njegovo polje stiže do A puno, pod {b}.',
      cap_b_end: 'A leži duž spojnice: polje antene B prelazi preko nje pod pravim kutom, pa A ne prima ništa.',
      cap_match: 'Prijamna žica leži duž E i uzima cijelo polje: {v} najboljeg napona ({pDb}).',
      cap_matchB: 'Žica A leži duž E, ali je gledana iz B skraćena na {gain} (sin θ): napon je {v} najboljeg ({pDb}).',
      cap_cross: 'Prijamna žica je okomita na E (križna polarizacija): nema napona, iako polje postoji.',
      cap_cos: 'Prijamna žica i E zatvaraju {mis}: uzima cos {misc} polja, pa je napon {v} najboljeg, a snaga {pDb}.',
      cap_cosB: 'Žica A, gledana iz B skraćena na {gain} (sin θ), i E zatvaraju {mis}: A uzima sin θ · cos {misc} polja, pa je napon {v} najboljeg, a snaga {pDb}.',
      cap_anti: 'Napon je protufazan: žica je okrenuta za više od 90° od E.',
      cap_recip: 'Recipročnost: kad bi odašiljao A, B bi dobio isti napon.',

      explain: '<p><b>Zašto je val polariziran.</b> Silnice naboja koji titra po žici lome se kad se naboj ubrzava, a lom putuje od žice brzinom c. ' +
        'Daleko ostaje samo poprečni dio loma: dio ubrzanja naboja okomit na spojnicu. Ubrzanje je uzduž žice, pa je polje E vala ' +
        'u ravnini žice i spojnice, okomito na spojnicu. Okomit dipol šalje <em>vertikalnu polarizaciju</em>, vodoravan ' +
        '<em>horizontalnu</em>: val nosi smjer antene.</p>' +
        '<p><b>Dijagram zračenja, sin θ.</b> Gledano pod kutom θ prema žici, poprečni je dio ubrzanja sin θ cijeloga. ' +
        'Uzduž žice (θ = 0) poprečnoga dijela nema: nema ni zračenja. Okomiti dipol ne zrači ravno gore; vodoravni dipol ' +
        'postavljen poprijeko zrači gore jednako kao prema B, u svim smjerovima okomitima na njega.</p>' +
        '<p><b>Zakon kosinusa.</b> Prijamni dipol pod kutom ψ prema E dobiva napon razmjeran cos ψ (napon praznog hoda je ' +
        'umnožak polja i duljine žice duž polja), a snagu razmjernu cos² ψ: faktor gubitka zbog polarizacije. Pri 45° ostaje ' +
        'pola snage (−3 dB), pri 90° (križna polarizacija) u teoriji ništa. Dipol okrenut za 180° daje istu snagu, ali u protufazi.</p>' +
        '<p><b>Recipročnost.</b> Ista antena najbolje prima ono što bi najbolje odaslala: u istom smjeru i s istom polarizacijom. ' +
        'Kad odašilje B, polje stiže do A puno, ali A od njega uzima samo svoj poprečni dio; kad odašilje A, polje je slabije, ' +
        'a B, uvijek okomit na spojnicu, nije skraćen. Napon je u oba slučaja isti.</p>' +
        '<p>Izvori: Balanis, <em>Antenna Theory</em>, pogl. 2 i 4; Griffiths, <em>Introduction to Electrodynamics</em>, pogl. 11; ' +
        'Purcell i Morin, <em>Electricity and Magnetism</em>, dodatak H.</p>'
    },
    en: {
      stage: 'Two short dipoles, A and B, the wave between them and a view along the line of sight',
      credit: 'Idea: explaining radiation by kinking field lines, from the antenna lectures at FER',

      from: 'Sends',
      from_a: 'A',
      from_b: 'B',
      a: 'A\'s angle from vertical',
      el: 'B\'s elevation',
      b: 'B\'s angle',
      degVal: '{v}°',
      t: 'Time ωt',
      tNow: 'ωt = {v}°',
      play: 'Play',
      pause: 'Pause',
      playHint: 'The wave travels from the sender to the receiver, one period in 5 s',
      playKey: 'time runs / stops',
      keyFwd: 'time +15°',
      keyBack: 'time −15°',

      preset_matched: 'Vertical to vertical',
      preset_matchedHint: 'Full voltage, 0 dB',
      preset_slant: 'B tilted 45°',
      preset_slantHint: 'Voltage 71 %, power −3 dB',
      preset_crossed: 'Cross-polarized',
      preset_crossedHint: 'B horizontal: the field is there, no voltage',
      preset_endon: 'B above A',
      preset_endonHint: 'Along its wire A sends nothing',
      preset_up: 'A horizontal dipole, upwards',
      preset_upHint: 'A and B across: full voltage',
      preset_recip: 'Reciprocity',
      preset_recipHint: 'B sends: the same voltage, 76 %',

      legendPattern: 'A\'s radiation pattern',
      legendWave: 'the wave\'s E field',
      legendWire: 'receiving wire',
      legendProj: 'part of E along the receiving wire',

      roleSend: 'sends',
      roleRecv: 'receives',
      patternLabel: 'A\'s pattern (sending and receiving)',
      planeLabel: 'vertical plane through A and B',
      sight: 'line of sight',
      axisUp: 'up',
      axisAcross: 'across',
      scaleNote: 'Not to scale: 1 km = 33 λ, 3 λ drawn',
      nothing: 'no field this way',
      voltNow: 'u = {v} mV',

      viewTitle: 'Along the line of sight, from B towards A',
      viewUp: 'up',
      viewRight: 'across',
      viewE: 'E',
      viewA: 'A (foreshortened, sin θ)',
      viewB: 'B',
      viewNone: 'no field',

      rowTheta: 'A\'s wire to the line of sight θ',
      rowGain: 'A\'s pattern, sin θ',
      rowTau: 'direction of E (B\'s view)',
      rowTauA: 'A\'s wire (B\'s view)',
      rowB: 'B\'s angle',
      rowMis: 'angle between E and receiving wire',
      rowPlf: 'polarization factor cos²',
      rowE: 'field at the receiver',
      rowV: 'voltage at the receiver',
      rowP: 'power against the best case',
      deg: '{v}°',
      pctDb: '{p} ({d})',
      dbVal: '{v} dB',
      dbNone: '−∞ dB',
      dash: '—',
      mvm: '{v} mV/m',
      mv: '{v} mV',
      mvPct: '{v} mV, {p}',
      anti: 'in antiphase',
      units: 'Two short dipoles λ/50 (0.6 m), 1 A, 10 MHz, 1 km apart. Voltage: open circuit, peak.',

      plotTitle: 'Voltage and power at the receiver as B turns',
      seriesV: 'voltage',
      seriesP: 'power',
      plotOne: '1',
      plotMinus: '−1',

      cap_a: 'A sends. Towards B its wire is at {theta} to the line of sight, so the field is {gain} of its largest and lies at {tau} in B\'s view.',
      cap_a_end: 'A sends, and B is on A\'s axis: this way the wire has no transverse part, so there is no field and no voltage, however B is turned.',
      cap_b: 'B sends, and it is always across the line of sight, so its field reaches A in full, at {b}.',
      cap_b_end: 'A lies along the line of sight: B\'s field crosses it at right angles, so A picks up nothing.',
      cap_match: 'The receiving wire lies along E and takes all of the field: {v} of the best voltage ({pDb}).',
      cap_matchB: 'A\'s wire lies along E, but seen from B it is foreshortened to {gain} (sin θ): the voltage is {v} of the best ({pDb}).',
      cap_cross: 'The receiving wire is at right angles to E (cross-polarized): no voltage, although the field is there.',
      cap_cos: 'The receiving wire and E are {mis} apart: it takes cos {misc} of the field, so the voltage is {v} of the best case and the power {pDb}.',
      cap_cosB: 'A\'s wire, foreshortened to {gain} (sin θ) as seen from B, and E are {mis} apart: A takes sin θ · cos {misc} of the field, so the voltage is {v} of the best case and the power {pDb}.',
      cap_anti: 'The voltage is in antiphase: the wire is turned more than 90° from E.',
      cap_recip: 'Reciprocity: with A sending, B would get the same voltage.',

      explain: '<p><b>Why the wave is polarized.</b> The field lines of a charge oscillating along a wire kink where it accelerates, and the kink travels out ' +
        'at c. Far away only the transverse part of the kink is left: the part of the charge\'s acceleration at right angles to the ' +
        'line of sight. The acceleration is along the wire, so the wave\'s E lies in the plane of the wire and the line of sight, at right ' +
        'angles to the line. A vertical dipole sends <em>vertical polarization</em>, a horizontal one <em>horizontal</em>: the ' +
        'wave carries the antenna\'s direction.</p>' +
        '<p><b>The pattern, sin θ.</b> Seen at an angle θ to the wire, the transverse part of the acceleration is sin θ of the whole. ' +
        'Along the wire (θ = 0) there is no transverse part: no radiation. A vertical dipole sends nothing straight up; a horizontal ' +
        'dipole lying across sends upwards as well as towards B, in every direction at right angles to it.</p>' +
        '<p><b>The cos law.</b> A receiving dipole at an angle ψ to E picks up a voltage proportional to cos ψ (the open-circuit ' +
        'voltage is the field times the length of wire along it), and a power proportional to cos² ψ: the polarization loss factor. ' +
        'At 45° half the power is left (−3 dB), at 90° (cross-polarized) in theory nothing. A dipole turned through 180° gets the ' +
        'same power in antiphase.</p>' +
        '<p><b>Reciprocity.</b> The same antenna receives best what it would send best: from the same direction and with the same ' +
        'polarization. When B sends, its field reaches A in full, but A takes only its own transverse part of it; when A sends, the ' +
        'field is weaker and B, always across the line of sight, is not foreshortened. The voltage is the same either way.</p>' +
        '<p>Sources: Balanis, <em>Antenna Theory</em>, ch. 2 and 4; Griffiths, <em>Introduction to Electrodynamics</em>, ch. 11; ' +
        'Purcell and Morin, <em>Electricity and Magnetism</em>, appendix H.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
