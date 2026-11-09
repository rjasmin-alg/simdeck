/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of small-antenna, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept).
   Croatian terms: 50ohm-contents-hr where it has them (skraćene antene, produljna zavojnica, stupanj djelovanja, faktor
   dobrote, širina pojasa, reaktancija, prilagodba, SWR); the rest are marked (check) in NOTES.md. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Skraćeni dipol s produljnom zavojnicom: otpor, gubici, Q i širina pojasa',

      len: 'Duljina dipola L',
      lenVal: '{v} λ',
      coil: 'Produljna zavojnica',
      coilHint: 'Poništava kapacitivnu reaktanciju na 7,1 MHz.',
      qc: 'Dobrota zavojnice Q',
      qcHint: 'Gubici zavojnice: X_L / Q.',
      qcIdeal: 'bez gubitaka',
      qcOff: 'Najprije uključi zavojnicu.',
      t: 'Vrijeme ωt',
      tNow: 'ωt = {v}°',
      play: 'Pokreni',
      pause: 'Zaustavi',
      playHint: 'Struja titra, jedan period za 5 s',
      playKey: 'vrijeme teče / staje',
      keyFwd: 'vrijeme +15°',
      keyBack: 'vrijeme −15°',

      preset_full: 'Puna veličina, 0,48 λ',
      preset_fullHint: 'Gotovo rezonantan: 98 %, cijeli pojas',
      preset_bare: 'Kratki, bez zavojnice',
      preset_bareHint: '0,1 λ: −j2452 Ω, gotovo ništa ne uđe',
      preset_coil: 'Kratki sa zavojnicom',
      preset_coilHint: '55 µH, Q 200: 14 %, 28 kHz',
      preset_half: 'Pola veličine, 0,25 λ',
      preset_halfHint: '73 %, 79 kHz',
      preset_lossy: 'Loša zavojnica, Q 50',
      preset_lossyHint: 'Širi pojas, ali samo 3,9 %',
      preset_ideal: 'Zavojnica bez gubitaka',
      preset_idealHint: '93 %, ali samo 4,3 kHz',

      legendCur: 'struja sada',
      legendCoil: 'produljna zavojnica',
      legendOutline: 'poluvalni dipol',
      legendBand: 'SWR ≤ 2',
      legendLine: 'ova duljina',
      legendChu: 'Chuova granica',

      antTitle: 'Antena i napajanje',
      halfLabel: 'λ/2',
      halfMetres: '{v} m',
      lenLabel: '{v} λ',
      coilLabel: '{v} µH',
      noCoil: 'bez zavojnice',
      matchLabel: '1 : n',
      txLabel: '100 W',
      enTitle: 'Pohranjena energija',
      enMag: 'magnetska',
      enMagCoil: 'magnetska ({p} u zavojnici)',
      enEl: 'električna, oko žice',
      enCycle: 'U svakom periodu zrači {r}, a grije {h} pohranjene energije.',
      enNone: 'Bez zavojnice ništa ne preuzima magnetsku polovicu: reaktancija ostaje.',

      swrTitle: 'SWR u pojasu 40 m',
      swrOff: 'SWR ≈ {v}: izvan ljestvice',
      swrWhole: 'SWR ≤ 2 u cijelom pojasu',
      mhz: '{v}',
      mhzAxis: 'MHz',

      tradeTitle: 'Malena, učinkovita, širokopojasna: biraj dvije',
      tradeX: 'širina pojasa (SWR ≤ 2)',
      tradeY: 'stupanj djelovanja',
      tradeBand: 'pojas 40 m',
      tradeChu: 'Chu',
      tradeLen: '{v} λ',
      tradePath: 'Q {q}, sve duljine',
      tradePathIdeal: 'bez gubitaka, sve duljine',
      tradeIdeal: '∞',

      rowLen: 'duljina L',
      rowRrad: 'otpor zračenja',
      rowX: 'reaktancija antene',
      rowCoil: 'zavojnica',
      rowRcoil: 'gubici zavojnice',
      rowRwire: 'gubici žice',
      rowEta: 'stupanj djelovanja η',
      rowQ: 'Q (Q zračenja ≥ Chu)',
      rowBw: 'širina pojasa, SWR ≤ 2',
      rowSwr: 'SWR na 7,1 MHz',
      lenCell: '{v} λ = {m} m',
      ohm: '{v} Ω',
      xCap: '−j{v} Ω',
      coilCell: '{l} µH, +j{x} Ω',
      none: '—',
      rcCell: '{r} (Q {q})',
      rcIdeal: '0 (bez gubitaka)',
      pct: '{v} %',
      etaOf: '{v} od {p}',
      qCell: '{q} ({r} ≥ {c})',
      khz: '{v} kHz',
      million: '{v} milijuna',
      units: 'Bakrena žica debljine 2 mm, 7,1 MHz. Idealni transformator prilagođava otpor na 50 Ω.',

      powTitle: 'Kamo ide 100 W',
      powRad: 'zrači',
      powCoil: 'grije zavojnicu',
      powWire: 'grije žicu',
      powRef: 'vraća se',
      watt: '{v} W',
      mwatt: '{v} mW',
      uwatt: '{v} µW',

      cap_res: 'Na {len} dipol ima samo {r} otpora zračenja i {x} kapacitivne reaktancije.',
      cap_resMid: 'Na {len} dipol ima {r} otpora zračenja i {x} kapacitivne reaktancije.',
      cap_resFull: 'Na {len} dipol je gotovo rezonantan: {r} otpora zračenja i samo {x}.',
      cap_bare: 'Bez zavojnice reaktancija ostaje: SWR je {swr}, a od 100 W u antenu uđe samo {pin}.',
      cap_bareOk: 'Gotovo mu ne treba zavojnica: i bez nje SWR je {swr}.',
      cap_bareSome: 'Bez zavojnice reaktancija ostaje: SWR je {swr}, a od 100 W u antenu uđe {pin}.',
      cap_bareBand: 'Nigdje u pojasu SWR nije ispod 2.',
      cap_bareEdge: 'SWR pada ispod 2 tek prema rubu pojasa, gdje je žica bliže rezonanciji.',
      cap_coil: 'Zavojnica od {lc} je poništava, ali s Q = {qc} dodaje {rc} gubitaka: od 100 W zrači {prad}, a {pcoil} grije zavojnicu.',
      cap_coilFull: 'Zavojnica od {lc} poništava ostatak i jedva što gubi: od 100 W zrači {prad}.',
      cap_ideal: 'Zavojnica bez gubitaka je poništava; gubi samo žica ({rw}): od 100 W zrači {prad}.',
      cap_band: 'Q = {q}: SWR ostaje ispod 2 samo u {bw} od 200 kHz pojasa.',
      cap_bandWide: 'Q = {q}: SWR ostaje ispod 2 u {bw}, gotovo u cijelom pojasu od 200 kHz.',
      cap_bandWhole: 'Q = {q}: SWR ostaje ispod 2 u cijelom pojasu ({bw}).',
      cap_k: 'Na ovoj duljini η × širina pojasa = {k}, kakva god bila zavojnica: bolja zavojnica podiže stupanj djelovanja, a sužava pojas.',
      cap_kFull: 'η × širina pojasa = {k}: puna veličina ima oboje.',

      explain: '<p><b>Malen otpor zračenja.</b> Struja na otvorenom kraju žice mora pasti na nulu; u kratkom dipolu pada od napajanja do ' +
        'krajeva gotovo pravocrtno. Otpor zračenja zato pada s kvadratom duljine, oko 197·(L/λ)² Ω: 2 Ω na 0,1 λ, pola oma na 0,05 λ ' +
        '(vidi <em>Duljina dipola</em>). Dijagram zračenja pritom ostaje gotovo isti kao poluvalnom dipolu.</p>' +
        '<p><b>Velika kapacitivna reaktancija.</b> Krajevi kratkog dipola djeluju kao ploče kondenzatora: naboj se gomila na njima, a ' +
        'magnetsko polje struje premalo je da ga uravnoteži. Na 0,1 λ to je −j2452 Ω uz 2 Ω otpora: odašiljač bi gotovo svu snagu dobio ' +
        'natrag. Produljna zavojnica (električno produljivanje) preuzima magnetsku polovicu: na 7,1 MHz njezin +jX poništava −jX antene.</p>' +
        '<p><b>Gubici.</b> Zavojnica ima dobrotu Q: njezin otpor gubitaka je X_L / Q. Uz 2452 Ω i Q = 200 to je 12 Ω, šest puta više ' +
        'od otpora zračenja; stupanj djelovanja η = R_zr / (R_zr + R_gub) pada na 14 %. Što je antena kraća, to je X veći, a R_zr manji: ' +
        'η pada brzo. Gubi i sama žica (0,16 Ω na 0,1 λ), pa ni zavojnica bez gubitaka ne daje 100 %.</p>' +
        '<p><b>Q i širina pojasa.</b> U svakom periodu energija se seli iz magnetskog polja (u kratkoj anteni gotovo sva u zavojnici) u električno polje oko žice i natrag; ' +
        'samo malen dio ode zračenjem ili u toplinu. Q je omjer pohranjene i izgubljene energije (puta 2π po periodu), a SWR ostaje ispod 2 ' +
        'u pojasu od oko 0,71·f / Q. Gubici snižavaju Q, pa loša zavojnica daje širi pojas, ali ga plaća toplinom: umjetno opterećenje ima ' +
        'SWR 1 posvuda. SWR 1 ne znači da antena zrači; ovdje je SWR 1 uz 14 % zračene snage.</p>' +
        '<p><b>Nema besplatnog ručka.</b> Za danu duljinu umnožak η × širina pojasa ne ovisi o zavojnici: bolja zavojnica samo pomiče antenu ' +
        'po istom pravcu. Chuova granica (pojednostavnjena: Q ≥ 1/(ka)³ + 1/(ka), a = L/2) donja je granica za svaku antenu te veličine; ' +
        'tanka žica daleko je iznad nje. Bliže granici vode deblji zračitelj i kapacitivni šeširi na krajevima; zavojnica dalje od napajanja podiže otpor zračenja; ' +
        'ovdje ih nema. Vertikalna antena nad tlom polovica je dipola: otpori su upola manji, a gubici tla dodaju se zavojnici.</p>' +
        '<p>Izvori: Balanis, <em>Antenna Theory</em>, pogl. 4 i 8 (vlastita impedancija); Yaghjian i Best (2005), Q i širina pojasa; ' +
        'Chu (1948), McLean (1996); 50ohm, skraćene antene i produljna zavojnica.</p>'
    },
    en: {
      stage: 'A short dipole with a loading coil: resistance, losses, Q and bandwidth',

      len: 'Dipole length L',
      lenVal: '{v} λ',
      coil: 'Loading coil',
      coilHint: 'Cancels the capacitive reactance at 7.1 MHz.',
      qc: 'Coil quality Q',
      qcHint: 'The coil\'s loss: X_L / Q.',
      qcIdeal: 'lossless',
      qcOff: 'Turn the coil on first.',
      t: 'Time ωt',
      tNow: 'ωt = {v}°',
      play: 'Play',
      pause: 'Pause',
      playHint: 'The current swings, one period in 5 s',
      playKey: 'time runs / stops',
      keyFwd: 'time +15°',
      keyBack: 'time −15°',

      preset_full: 'Full size, 0.48 λ',
      preset_fullHint: 'Almost resonant: 98 %, the whole band',
      preset_bare: 'Short, no coil',
      preset_bareHint: '0.1 λ: −j2452 Ω, almost nothing gets in',
      preset_coil: 'Short with a coil',
      preset_coilHint: '55 µH, Q 200: 14 %, 28 kHz',
      preset_half: 'Half size, 0.25 λ',
      preset_halfHint: '73 %, 79 kHz',
      preset_lossy: 'A poor coil, Q 50',
      preset_lossyHint: 'A wider band, but only 3.9 %',
      preset_ideal: 'A lossless coil',
      preset_idealHint: '93 %, but only 4.3 kHz',

      legendCur: 'current now',
      legendCoil: 'loading coil',
      legendOutline: 'half-wave dipole',
      legendBand: 'SWR ≤ 2',
      legendLine: 'this length',
      legendChu: 'Chu\'s limit',

      antTitle: 'Antenna and feed',
      halfLabel: 'λ/2',
      halfMetres: '{v} m',
      lenLabel: '{v} λ',
      coilLabel: '{v} µH',
      noCoil: 'no coil',
      matchLabel: '1 : n',
      txLabel: '100 W',
      enTitle: 'Stored energy',
      enMag: 'magnetic',
      enMagCoil: 'magnetic ({p} in the coil)',
      enEl: 'electric, around the wire',
      enCycle: 'Each period it radiates {r} and heats {h} of the stored energy.',
      enNone: 'Without a coil nothing takes the magnetic half: the reactance stays.',

      swrTitle: 'SWR across the 40 m band',
      swrOff: 'SWR ≈ {v}: off the scale',
      swrWhole: 'SWR ≤ 2 across the whole band',
      mhz: '{v}',
      mhzAxis: 'MHz',

      tradeTitle: 'Small, efficient, broadband: pick two',
      tradeX: 'bandwidth (SWR ≤ 2)',
      tradeY: 'efficiency',
      tradeBand: '40 m band',
      tradeChu: 'Chu',
      tradeLen: '{v} λ',
      tradePath: 'Q {q}, every length',
      tradePathIdeal: 'lossless, every length',
      tradeIdeal: '∞',

      rowLen: 'length L',
      rowRrad: 'radiation resistance',
      rowX: 'antenna reactance',
      rowCoil: 'coil',
      rowRcoil: 'coil loss',
      rowRwire: 'wire loss',
      rowEta: 'efficiency η',
      rowQ: 'Q (radiation Q ≥ Chu)',
      rowBw: 'bandwidth, SWR ≤ 2',
      rowSwr: 'SWR at 7.1 MHz',
      lenCell: '{v} λ = {m} m',
      ohm: '{v} Ω',
      xCap: '−j{v} Ω',
      coilCell: '{l} µH, +j{x} Ω',
      none: '—',
      rcCell: '{r} (Q {q})',
      rcIdeal: '0 (lossless)',
      pct: '{v} %',
      etaOf: '{v} of {p}',
      qCell: '{q} ({r} ≥ {c})',
      khz: '{v} kHz',
      million: '{v} million',
      units: 'Copper wire 2 mm thick, 7.1 MHz. An ideal transformer matches the resistance to 50 Ω.',

      powTitle: 'Where the 100 W go',
      powRad: 'radiated',
      powCoil: 'heats the coil',
      powWire: 'heats the wire',
      powRef: 'reflected',
      watt: '{v} W',
      mwatt: '{v} mW',
      uwatt: '{v} µW',

      cap_res: 'At {len} the dipole has only {r} of radiation resistance and {x} of capacitive reactance.',
      cap_resMid: 'At {len} the dipole has {r} of radiation resistance and {x} of capacitive reactance.',
      cap_resFull: 'At {len} the dipole is almost resonant: {r} of radiation resistance and only {x}.',
      cap_bare: 'Without a coil the reactance stays: the SWR is {swr}, and of 100 W only {pin} gets in.',
      cap_bareOk: 'It hardly needs a coil: even without one the SWR is {swr}.',
      cap_bareSome: 'Without a coil the reactance stays: the SWR is {swr}, and of 100 W {pin} gets in.',
      cap_bareBand: 'Nowhere in the band is the SWR under 2.',
      cap_bareEdge: 'The SWR dips under 2 only towards the band edge, where the wire is nearer resonance.',
      cap_coil: 'A {lc} coil cancels it, but with Q = {qc} it adds {rc} of loss: of 100 W, {prad} is radiated and {pcoil} heats the coil.',
      cap_coilFull: 'A {lc} coil cancels the rest and loses hardly anything: of 100 W, {prad} is radiated.',
      cap_ideal: 'A lossless coil cancels it; only the wire loses ({rw}): of 100 W, {prad} is radiated.',
      cap_band: 'Q = {q}: the SWR stays under 2 in only {bw} of the 200 kHz band.',
      cap_bandWide: 'Q = {q}: the SWR stays under 2 over {bw}, almost the whole 200 kHz band.',
      cap_bandWhole: 'Q = {q}: the SWR stays under 2 across the whole band ({bw}).',
      cap_k: 'At this length η × bandwidth = {k}, whatever the coil: a better coil trades bandwidth for efficiency.',
      cap_kFull: 'η × bandwidth = {k}: full size gets both.',

      explain: '<p><b>A tiny radiation resistance.</b> The current must fall to zero at an open end; on a short dipole it falls from the ' +
        'feed to the ends almost in a straight line. So the radiation resistance falls with the square of the length, about ' +
        '197·(L/λ)² Ω: 2 Ω at 0.1 λ, half an ohm at 0.05 λ (see <em>Dipole length</em>). The pattern stays almost that of a half-wave ' +
        'dipole.</p>' +
        '<p><b>A large capacitive reactance.</b> The ends of a short dipole act like a capacitor\'s plates: charge piles up on them, and the ' +
        'current\'s magnetic field is too small to balance it. At 0.1 λ that is −j2452 Ω against 2 Ω: the transmitter would get almost all ' +
        'its power back. A loading coil (electrical lengthening) takes the magnetic half: at 7.1 MHz its +jX cancels the antenna\'s −jX.</p>' +
        '<p><b>Losses.</b> A coil has a quality factor Q: its loss resistance is X_L / Q. With 2452 Ω and Q = 200 that is 12 Ω, six times ' +
        'the radiation resistance; the efficiency η = R_rad / (R_rad + R_loss) falls to 14 %. The shorter the antenna, the larger X and the ' +
        'smaller R_rad: η falls fast. The wire itself loses too (0.16 Ω at 0.1 λ), so even a lossless coil does not give 100 %.</p>' +
        '<p><b>Q and bandwidth.</b> Each period the energy moves from the magnetic field (on a short antenna almost all in the coil) to the electric field around the wire and back; ' +
        'only a small part leaves as radiation or heat. Q is the stored energy against the energy lost (times 2π per period), and the SWR ' +
        'stays under 2 in a band about 0.71·f / Q wide. Losses lower Q, so a poor coil gives a wider band, but pays for it in heat: a dummy ' +
        'load has an SWR of 1 everywhere. An SWR of 1 does not mean the antenna radiates; here it is 1 with 14 % radiated.</p>' +
        '<p><b>No free lunch.</b> For a given length the product η × bandwidth does not depend on the coil: a better coil only moves the ' +
        'antenna along the same line. Chu\'s limit (simplified: Q ≥ 1/(ka)³ + 1/(ka), a = L/2) is a floor for any antenna of that size; ' +
        'a thin wire is far above it. A thicker radiator and capacitive hats at the ends come closer; a coil further from the feed raises ' +
        'the radiation resistance; none of these is modelled here. A vertical over ground is half a dipole: half the resistances, and the ground\'s loss adds to the coil\'s.</p>' +
        '<p>Sources: Balanis, <em>Antenna Theory</em>, ch. 4 and 8 (self impedance); Yaghjian and Best (2005), Q and bandwidth; ' +
        'Chu (1948), McLean (1996); 50ohm, shortened antennas and the loading coil.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
