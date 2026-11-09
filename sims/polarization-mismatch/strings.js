/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of polarization-mismatch, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept).
   Croatian terms: 50ohm-contents-hr where it has them (polarizacija, vertikalna i horizontalna polarizacija, desnokretna
   i lijevokretna cirkularna polarizacija, loop antena, fazni pomak, Faradayeva rotacija); the rest are marked (check)
   in NOTES.md (faktor gubitka polarizacije, omjer osi, eliptična polarizacija, križni dipoli, vodljiva ploha). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Antena na predaji i antena na prijamu, val između njih i dva pogleda iza vala',
      credit: 'Ideja: objašnjenje zračenja lomom silnica, s predavanja iz Antena na FER-u',
      nameTx: 'Tx',
      nameRx: 'Rx',

      tx: 'Antena na predaji (Tx)',
      rx: 'Antena na prijamu (Rx)',
      type_v: 'okomiti dipol',
      type_h: 'vodoravni dipol',
      type_s: 'dipol nagnut 45°',
      type_r: 'desnokretna cirkularna',
      type_l: 'lijevokretna cirkularna',
      type_loop: 'mala loop antena',
      txRot: 'Zakret antene Tx',
      rxRot: 'Zakret antene Rx',
      amp: 'Amplituda',
      ph: 'Fazni pomak',
      path: 'Put vala',
      path_direct: 'izravno',
      path_bounce: 'odbijanje',
      path_iono: 'ionosfera',
      om: 'Faradayev kut Ω',
      degVal: '{v}°',
      pctVal: '{v} %',
      t: 'Vrijeme ωt',
      tNow: 'ωt = {v}°',
      play: 'Pokreni',
      pause: 'Zaustavi',
      playHint: 'Val putuje od Tx prema Rx, jedan period za 5 s; kroz ionosferu Ω pritom polako raste',
      playKey: 'vrijeme teče / staje',
      keyFwd: 'vrijeme +15°',
      keyBack: 'vrijeme −15°',

      preset_vh: 'V i H',
      preset_vhHint: 'Okomito prema vodoravno: križna polarizacija, u teoriji ništa',
      preset_lincirc: 'V i cirkularna',
      preset_lincircHint: '−3 dB pod bilo kojim kutom',
      preset_rl: 'Desna i lijeva',
      preset_rlHint: 'S malo pogreške napajanja: oko −20 dB',
      preset_loop: 'V i petlja',
      preset_loopHint: 'Ležeća petlja je vodoravna: križno',
      preset_bounce: 'Odbijanje',
      preset_bounceHint: 'Desnokretni val vraća se lijevokretan',
      preset_faraday: 'Faraday',
      preset_faradayHint: 'Faradayeva rotacija Ω = 60°: −6 dB; pokreni i Ω luta',

      legendWave: 'polje E vala',
      legendRx: 'val koji Rx prima u cijelosti',
      legendProj: 'E duž prijamne žice (napon sada)',

      roleSend: 'odašilje',
      roleRecv: 'prima',
      voltNow: 'u = {v} %',
      scaleNote: 'Nije u mjerilu: nacrtane su 3 valne duljine',
      surface: 'vodljiva ploha',
      bounceNote: 'odbijanje zrcali val',
      iono: 'ionosfera: val se zakreće za Ω = {v}',
      ninety: '90°',

      viewTx: 'Odlazi s Tx',
      viewRx: 'Stiže na Rx',
      viewNote: 'Oba pogleda: iza vala, od Tx prema Rx',
      viewUp: 'gore',
      viewRight: 'desno',
      viewE: 'E',

      rowTx: 'odaslani val',
      rowPath: 'na putu',
      rowArr: 'val na prijamu',
      rowRx: 'Rx prima u cijelosti',
      rowPlf: 'faktor gubitka |ê·ê*|²',
      rowV: 'napon na prijamu',
      pathRow_direct: 'ništa (slobodan prostor)',
      pathRow_bounce: 'odbijanje: zrcali val',
      pathRow_iono: 'zakret za Ω = {v}',
      d_lin: 'linearna, {tilt}',
      d_circ_r: 'desnokretna cirkularna',
      d_circ_l: 'lijevokretna cirkularna',
      d_ell_r: 'eliptična desnokretna, {tilt}, omjer osi {ar}',
      d_ell_l: 'eliptična lijevokretna, {tilt}, omjer osi {ar}',
      deg: '{v}°',
      pctDb: '{p} ({d})',
      dbVal: '{v} dB',
      dbNone: '−∞ dB',
      ofBest: '{p} punog',

      plotRot: 'Snaga na prijamu dok se Rx okreće',
      plotOm: 'Snaga na prijamu dok Ω luta',
      seriesNow: 'ova Rx antena',
      seriesAlt_r: 'desnokretna cirkularna Rx',
      seriesAlt_v: 'okomiti dipol kao Rx',
      inf: '−∞',

      cap_tx_lin: 'Tx šalje linearni val pod {tilt}.',
      cap_tx_circ_r: 'Tx šalje desnokretni cirkularni val: dva križna dipola napajana s 90° razlike.',
      cap_tx_circ_l: 'Tx šalje lijevokretni cirkularni val: dva križna dipola napajana s 90° razlike.',
      cap_tx_ell_r: 'Tx šalje desnokretni eliptični val (omjer osi {ar}): dipoli nisu napajani jednakim amplitudama ili im razlika faze nije točno 90°.',
      cap_tx_ell_l: 'Tx šalje lijevokretni eliptični val (omjer osi {ar}): dipoli nisu napajani jednakim amplitudama ili im razlika faze nije točno 90°.',
      cap_bounce: 'Odbijanje ga zrcali, pa smjer vrtnje prelazi u suprotan; na prijamu: {arr}.',
      cap_bounce_lin: 'Odbijanje ga zrcali; na prijamu: {arr}.',
      cap_iono: 'Ionosfera ga zakreće za Ω = {om}; na prijamu: {arr}.',
      cap_iono_circ: 'Ionosfera ga zakreće za Ω = {om}, ali cirkularnom valu to mijenja samo fazu.',
      cap_crossed: 'Polarizacija koju Rx prima u cijelosti ({rx}) okomita je na polarizaciju vala (križna polarizacija): u teoriji Rx ne dobiva ništa ({db}).',
      cap_crossed_circ: 'Rx prima suprotan smjer vrtnje: u teoriji ne dobiva ništa ({db}); stvarnim antenama s malo pogreške ostane sasvim malo.',
      cap_crossed_loop: 'E male loop antene leži u njezinoj ravnini: ležeća je zato vodoravna, a okomiti dipol stoji duž njezine osi: križno ({db}).',
      cap_matched: 'Rx prima upravo takav val: sav napon, {db}.',
      cap_lincirc: 'Linearni i cirkularni val: Rx dobiva pola snage ({db}) pod bilo kojim kutom.',
      cap_partial: 'Polarizacija koju Rx prima u cijelosti: {rx}. Od ovog vala uzima |ê·ê*|² = {plf} snage ({db}), napon je {v} punog.',

      explain: '<p><b>Val nosi vektor polarizacije.</b> Polje E vala može titrati po pravcu (linearna polarizacija), ' +
        'kružiti (cirkularna) ili opisivati elipsu (eliptična). Smjer vrtnje gleda se iza vala, u smjeru širenja: desnokretni ' +
        'val vrti se u smjeru kazaljke na satu. Oba pogleda na stranici su takva, od Tx prema Rx.</p>' +
        '<p><b>Prijamna antena uzima projekciju.</b> Svaka antena u cijelosti prima samo jedan val: onaj s polarizacijom koju bi ' +
        'i sama odaslala, s istim smjerom vrtnje, svaki gledan iza svog vala. Zapisan u pogledu dolaznog vala, to je ' +
        'ê<sub>rx</sub>. Od vala ê<sub>w</sub> dobiva udio snage |ê<sub>w</sub>·ê<sub>rx</sub>*|²: faktor gubitka ' +
        'polarizacije. Okomito prema vodoravno: u teoriji ništa; okomito prema 45°: pola (−3 dB); linearno prema cirkularnom: ' +
        'pola pod bilo kojim kutom; desnokretno prema lijevokretnom: u teoriji ništa.</p>' +
        '<p><b>Cirkularni val su dva križna dipola</b> napajana s 90° razlike. Ako im amplitude nisu jednake ili fazni pomak ' +
        'nije točno 90°, val je eliptičan; omjer dulje i kraće osi je omjer osi. Zato desnokretno prema lijevokretnom u praksi ' +
        'gubi gotovo sve, ali ne baš sve.</p>' +
        '<p><b>Mala loop antena</b> zrači najjače u svojoj ravnini, a E leži u toj ravnini, poprijeko na smjer širenja. Ležeća ' +
        'petlja je zato vodoravno polarizirana, a uspravna, gledana sa strane, okomito. Dipol koji stoji duž osi petlje s njom ' +
        'je križan.</p>' +
        '<p><b>Odbijanje</b> od vodljive plohe obrće dio polja usporedan s plohom: val se zrcali, desnokretni se vraća ' +
        'lijevokretan (zato cirkularna antena odbacuje jednom odbijeni val), a kosi linearni val se zrcali na drugu stranu.</p>' +
        '<p><b>Faradayeva rotacija.</b> Na dugom putu kroz ionosferu, u Zemljinu magnetskom polju, ravnina linearnog vala ' +
        'zakreće se za kut Ω koji ovisi o broju elektrona na putu i pada s kvadratom frekvencije. Ω se mijenja s ionosferom, ' +
        'pa nepomična linearna antena polako gubi i nalazi signal, a cirkularna ne: njoj zakret mijenja samo fazu.</p>' +
        '<p>Kutovi su zadani u jednom pogledu. Vlasnik prijamne antene, okrenut prema Tx, vidi zrcalno: kosa antena „/“ ' +
        'njemu je „\\“.</p>' +
        '<p>Izvori: Balanis, <em>Antenna Theory</em>, pogl. 2 i 5; Kraus, <em>Antennas</em>, pogl. 2; ' +
        'Griffiths, <em>Introduction to Electrodynamics</em>, pogl. 9.</p>'
    },
    en: {
      stage: 'The transmitting and the receiving antenna, the wave between them and two views from behind the wave',
      credit: 'Idea: explaining radiation by kinking field lines, from the antenna lectures at FER',
      nameTx: 'Tx',
      nameRx: 'Rx',

      tx: 'Transmitting antenna (Tx)',
      rx: 'Receiving antenna (Rx)',
      type_v: 'vertical dipole',
      type_h: 'horizontal dipole',
      type_s: '45° slant dipole',
      type_r: 'right-hand circular',
      type_l: 'left-hand circular',
      type_loop: 'small loop',
      txRot: 'Tx turned',
      rxRot: 'Rx turned',
      amp: 'Amplitude',
      ph: 'Dipoles\' phase',
      path: 'Path',
      path_direct: 'direct',
      path_bounce: 'bounce',
      path_iono: 'ionosphere',
      om: 'Faraday angle Ω',
      degVal: '{v}°',
      pctVal: '{v} %',
      t: 'Time ωt',
      tNow: 'ωt = {v}°',
      play: 'Play',
      pause: 'Pause',
      playHint: 'The wave travels from Tx to Rx, one period in 5 s; through the ionosphere Ω slowly grows as well',
      playKey: 'time runs / stops',
      keyFwd: 'time +15°',
      keyBack: 'time −15°',

      preset_vh: 'V and H',
      preset_vhHint: 'Vertical against horizontal: cross-polarized, in theory nothing',
      preset_lincirc: 'V and circular',
      preset_lincircHint: '−3 dB at any angle',
      preset_rl: 'Right and left',
      preset_rlHint: 'With a small feed error: about −20 dB',
      preset_loop: 'V and loop',
      preset_loopHint: 'A flat loop is horizontal: crossed',
      preset_bounce: 'Bounce',
      preset_bounceHint: 'A right-hand wave comes back left-hand',
      preset_faraday: 'Faraday',
      preset_faradayHint: 'Faraday rotation Ω = 60°: −6 dB; play and Ω drifts',

      legendWave: 'the wave\'s E field',
      legendRx: 'the wave Rx takes in full',
      legendProj: 'E along the receiving wire (voltage now)',

      roleSend: 'sends',
      roleRecv: 'receives',
      voltNow: 'u = {v} %',
      scaleNote: 'Not to scale: 3 wavelengths drawn',
      surface: 'conducting surface',
      bounceNote: 'the bounce mirrors the wave',
      iono: 'ionosphere: the wave turns by Ω = {v}',
      ninety: '90°',

      viewTx: 'Leaving Tx',
      viewRx: 'Arriving at Rx',
      viewNote: 'Both views: from behind the wave, Tx towards Rx',
      viewUp: 'up',
      viewRight: 'right',
      viewE: 'E',

      rowTx: 'wave sent',
      rowPath: 'on the way',
      rowArr: 'wave arriving',
      rowRx: 'Rx takes in full',
      rowPlf: 'loss factor |ê·ê*|²',
      rowV: 'voltage at Rx',
      pathRow_direct: 'nothing (free space)',
      pathRow_bounce: 'a bounce: mirrors the wave',
      pathRow_iono: 'turned by Ω = {v}',
      d_lin: 'linear, {tilt}',
      d_circ_r: 'right-hand circular',
      d_circ_l: 'left-hand circular',
      d_ell_r: 'right-hand elliptical, {tilt}, axial ratio {ar}',
      d_ell_l: 'left-hand elliptical, {tilt}, axial ratio {ar}',
      deg: '{v}°',
      pctDb: '{p} ({d})',
      dbVal: '{v} dB',
      dbNone: '−∞ dB',
      ofBest: '{p} of full',

      plotRot: 'Power at Rx as Rx turns',
      plotOm: 'Power at Rx as Ω drifts',
      seriesNow: 'this Rx antenna',
      seriesAlt_r: 'a right-hand circular Rx',
      seriesAlt_v: 'a vertical dipole as Rx',
      inf: '−∞',

      cap_tx_lin: 'Tx sends a linear wave at {tilt}.',
      cap_tx_circ_r: 'Tx sends a right-hand circular wave: two crossed dipoles fed 90° apart.',
      cap_tx_circ_l: 'Tx sends a left-hand circular wave: two crossed dipoles fed 90° apart.',
      cap_tx_ell_r: 'Tx sends a right-hand elliptical wave (axial ratio {ar}): the dipoles are not fed equally or not exactly 90° apart.',
      cap_tx_ell_l: 'Tx sends a left-hand elliptical wave (axial ratio {ar}): the dipoles are not fed equally or not exactly 90° apart.',
      cap_bounce: 'The bounce mirrors it, so the sense of rotation turns over; at Rx: {arr}.',
      cap_bounce_lin: 'The bounce mirrors it; at Rx: {arr}.',
      cap_iono: 'The ionosphere turns it by Ω = {om}; at Rx: {arr}.',
      cap_iono_circ: 'The ionosphere turns it by Ω = {om}, which only shifts a circular wave\'s phase.',
      cap_crossed: 'The polarization Rx takes in full ({rx}) is at right angles to the wave\'s E (cross-polarized): in theory Rx gets nothing ({db}).',
      cap_crossed_circ: 'Rx takes the opposite sense of rotation: in theory it gets nothing ({db}); real antennas with small errors leave very little.',
      cap_crossed_loop: 'A small loop\'s E lies in its own plane: a flat one is therefore horizontal, and a vertical dipole stands along its axis: crossed ({db}).',
      cap_matched: 'Rx takes exactly this wave: all of the voltage, {db}.',
      cap_lincirc: 'A linear and a circular wave: Rx gets half the power ({db}) at any angle.',
      cap_partial: 'The polarization Rx takes in full: {rx}. Of this wave it gets |ê·ê*|² = {plf} of the power ({db}), a voltage of {v} of full.',

      explain: '<p><b>The wave carries a polarization vector.</b> The wave\'s E can swing along a line (linear polarization), ' +
        'go round a circle (circular) or trace an ellipse (elliptical). The sense of rotation is seen from behind the wave, ' +
        'looking where it travels: a right-hand wave turns clockwise. Both views on this page are like that, from Tx towards Rx.</p>' +
        '<p><b>The receiving antenna takes a projection.</b> Each antenna takes in full only one wave: one with the ' +
        'polarization it would send itself, the same sense of rotation, each seen from behind its own wave. Written in the ' +
        'arriving wave\'s view, that is ê<sub>rx</sub>. Of a wave ê<sub>w</sub> it gets the fraction |ê<sub>w</sub>·ê<sub>rx</sub>*|² of the power: ' +
        'the polarization loss factor. Vertical against horizontal: in theory nothing; vertical against 45°: half (−3 dB); ' +
        'linear against circular: half at any angle; right-hand against left-hand: in theory nothing.</p>' +
        '<p><b>A circular wave is two crossed dipoles</b> fed 90° apart. If their amplitudes differ or the phase is not ' +
        'exactly 90°, the wave is elliptical; the long axis over the short one is the axial ratio. That is why right-hand ' +
        'against left-hand loses almost everything in practice, but not quite everything.</p>' +
        '<p><b>A small loop</b> radiates most in its own plane, and its E lies in that plane, across the direction of travel. ' +
        'A flat loop is therefore horizontally polarized, and an upright one, seen edge-on, vertically. A dipole standing along ' +
        'the loop\'s axis is crossed with it.</p>' +
        '<p><b>A bounce</b> off a conducting surface reverses the part of the field parallel to the surface: the wave is ' +
        'mirrored, a right-hand wave comes back left-hand (so a circular antenna rejects a once-reflected wave), and a slanted linear ' +
        'wave is mirrored to the other side.</p>' +
        '<p><b>Faraday rotation.</b> On a long path through the ionosphere, in the Earth\'s magnetic field, the plane of a ' +
        'linear wave turns by an angle Ω that depends on the number of electrons on the way and falls with the square of the ' +
        'frequency. Ω changes as the ionosphere does, so a fixed linear antenna slowly loses and finds the signal, and a ' +
        'circular one does not: for it the turn only shifts the phase.</p>' +
        '<p>Angles are given in one view. The owner of the receiving antenna, facing Tx, sees it mirrored: a slant "/" is ' +
        '"\\" to them.</p>' +
        '<p>Sources: Balanis, <em>Antenna Theory</em>, ch. 2 and 5; Kraus, <em>Antennas</em>, ch. 2; ' +
        'Griffiths, <em>Introduction to Electrodynamics</em>, ch. 9.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
