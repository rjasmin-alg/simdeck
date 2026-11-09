/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of link-budget, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept).
   Croatian terms: 50ohm-contents-hr where it has them (prigušenje kabela, osjetljivost prijamnika, fading, dobitak,
   EIRP, izotropni zračitelj, polarizacija); the rest are marked (check) in NOTES.md. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Proračun veze u dBm od odašiljača do prijamnika, snaga na prijamniku prema udaljenosti i očitanja',

      ptx: 'Odašiljač',
      dish: 'Tanjuri stalne veličine',
      gt: 'Dobitak na predaji',
      gr: 'Dobitak na prijemu',
      dt: 'Tanjur na predaji',
      dr: 'Tanjur na prijemu',
      lt: 'Kabel na predaji',
      lr: 'Kabel na prijemu',
      f: 'Frekvencija (MHz)',
      dk: 'Udaljenost',
      psi: 'Polarizacija',
      sens: 'Osjetljivost prijamnika',
      fade: 'Rezerva za fading',

      dbmW: '{v} dBm = {w}',
      dbm: '{v} dBm',
      dbi: '{v} dBi',
      db: '{v} dB',
      dbPlus: '+{v} dB',
      deg: '{v}°',
      meter: '{v} m',
      cm: '{v} cm',
      km: '{v} km',
      sqm: '{v} m²',
      sqcm: '{v} cm²',
      wW: '{v} W',
      wMw: '{v} mW',
      wUw: '{v} µW',
      wNw: '{v} nW',
      wPw: '{v} pW',
      wFw: '{v} fW',
      wAw: '{v} aW',
      wTiny: '< 1 aW',
      vMv: '{v} mV',
      vUv: '{v} µV',
      vNv: '{v} nV',
      vTiny: '< 0,01 nV',

      preset_handheld: 'Dva ručna',
      preset_handheldHint: 'Pojas 2 m, 10 km: u slobodnom prostoru 61 dB margine',
      preset_band: 'Isti, 2,4 GHz',
      preset_bandHint: '24 dB manje: manja površina antene',
      preset_base: 'Bazna stanica',
      preset_baseHint: '30 m kabela, ručni nagnut za 45°',
      preset_satellite: 'Satelit',
      preset_satelliteHint: '2000 km: čuje se, ali premalo za rezervu za fading',
      preset_dishes: 'Dva tanjura',
      preset_dishesHint: 'Viša frekvencija, jači signal',

      legendLevel: 'razina u dBm',
      legendUp: 'dobitak',
      legendDown: 'gubitak',
      legendSens: 'osjetljivost prijamnika',
      legendFade: 'rezerva za fading',

      ladTitle: 'Proračun veze',
      ladTx: 'odašiljač, {w}',
      ladCableTx: 'kabel i konektori',
      ladGt: 'antena na predaji',
      ladEirp: 'EIRP',
      ladSpread: 'širenje po kugli 4πd²',
      ladArea: 'izotropna antena hvata λ²/4π',
      ladGr: 'antena na prijemu',
      ladPol: 'polarizacija',
      ladCableRx: 'kabel i konektori',
      ladRx: 'na prijamniku',
      ladMargin: 'margina',
      ladPath: 'gušenje puta {v}',
      ladSens: 'osjetljivost',
      ladNothing: 'ništa',
      ladNone: '—',
      ladInf: '−∞ dB',
      dbmTick: 'dBm',

      plotTitle: 'Snaga na prijamniku prema udaljenosti',
      plotKm: 'km',
      plotNow: 'sada',
      plotDouble: '×2: −6 dB',
      plotMax: 's rezervom',
      plotEdge: 'bez rezerve',
      plotSens: 'osjetljivost',

      rowLam: 'valna duljina λ',
      rowPath: 'gušenje puta',
      rowArea: 'površina antene na prijemu',
      rowPrx: 'snaga na prijamniku',
      rowUv: 'napon na ulazu od 50 Ω',
      rowMargin: 'margina iznad osjetljivosti',
      rowLeft: 'preostalo iznad rezerve',
      rowMax: 'najdalje s rezervom',
      rowEdge: 'najdalje bez rezerve',
      units: 'Slobodan prostor, bez tla i obzora. Kabel: debeli koaksijalni kabel od 50 Ω, dva konektora po 0,1 dB. Tanjur: η = 0,55.',

      status_works: 'Veza radi: na prijamnik stiže {prx}, {margin} iznad njegove osjetljivosti. Za fading se čuva {fade}, a ostaje još {left}.',
      status_fading: 'Prijamnik čuje signal, {margin} iznad osjetljivosti, ali to je manje od {fade} rezerve za fading: svaki fading dublji od {margin} prekida vezu.',
      status_worksBare: 'Veza radi: na prijamnik stiže {prx}, {margin} iznad njegove osjetljivosti. Za fading se ne čuva ništa.',
      status_fail: 'Veza ne radi: {prx} je {short} ispod osjetljivosti prijamnika ({sens}).',
      status_crossed: 'Polarizacije su ukrštene (90°): u teoriji ne stiže ništa. U praksi odbijanja i malo zakrenuta antena ostave nešto, oko 20 do 30 dB slabije.',
      path: 'Gušenje puta na {d} je {path}. Od toga {spread} je širenje snage po kugli 4πd², isto na svakoj frekvenciji; ostatak, {area}, dolazi od toga što izotropna antena na valnoj duljini {lam} hvata samo λ²/4π = {aiso}.',
      ant_gain: 'Antene stalnog dobitka: prijamna antena od {gr} hvata {aeff}. Na višoj frekvenciji, kraćoj valnoj duljini, hvata manje (Gλ²/4π), pa signal slabi iako prostor ništa ne upija.',
      ant_dish: 'Tanjuri stalne veličine: prijamni hvata {aeff} na svakoj frekvenciji, a predajni na kraćoj valnoj duljini usmjerava više ({gt}). Zato ovdje, ne računajući kabele, viša frekvencija daje jači signal.',
      dish_small: 'Tanjur uži od tri valne duljine samo je približno tanjur i taj dobitak ne postiže.',
      dish_near: 'Bliže od 2D²/λ = {far} tanjuri još nisu jedan drugome u dalekom polju: Friisova formula tu ne vrijedi.',
      pol: 'Antene su zakrenute za {psi}: polarizacija uzima cos²ψ, {pol}.',
      dist_works: 'Svako udvostručenje udaljenosti uzima 6 dB: s rezervom za fading veza seže do {dmax}.',
      dist_short: 'Svako udvostručenje udaljenosti uzima 6 dB: s rezervom za fading veza bi radila do {dmax}, bez rezerve do {dedge}.',
      free_note: 'To vrijedi u slobodnom prostoru; na Zemlji obzor i prepreke zaustave signal mnogo prije.',

      explain: '<p><b>Zbroj u dB.</b> Snaga na prijamniku = snaga odašiljača − prigušenje kabela + dobitak antene na predaji ' +
        '− gušenje puta + dobitak antene na prijemu − gubitak polarizacije − prigušenje kabela na prijemu. U dB se ' +
        'umnošci zbrajaju: to je Friisova formula P<sub>r</sub> = P<sub>t</sub>·G<sub>t</sub>·G<sub>r</sub>·(λ/4πd)².</p>' +
        '<p><b>Gušenje puta.</b> 20·log(4πd/λ) između dviju izotropnih antena. Prostor ništa ne upija: snaga se samo širi po ' +
        'kugli površine 4πd², pa svako udvostručenje udaljenosti daje četvrtinu snage, 6 dB. Taj dio ne ovisi o frekvenciji.</p>' +
        '<p><b>Zašto onda viša frekvencija gubi?</b> Antena na prijemu hvata snagu kao da ima površinu A = G·λ²/4π. ' +
        'Antena istog dobitka na kraćoj valnoj duljini manja je i hvata manje. Tanjur stalne veličine hvata isto na svakoj ' +
        'frekvenciji, a njegov dobitak raste s f²: dva tanjura na višoj frekvenciji daju jači signal, ako ga prigušenje kabela, koje također raste s frekvencijom, ne pojede.</p>' +
        '<p><b>Polarizacija.</b> Dvije linearne antene zakrenute za ψ primaju cos²ψ: 45° je 3 dB, 90° u teoriji ništa.</p>' +
        '<p><b>Margina.</b> Margina je razlika između snage na prijamniku i osjetljivosti prijamnika. Dio margine treba ' +
        'čuvati za fading, kad signal na trenutke oslabi. Ono što ostane iznad te rezerve određuje najveću udaljenost: ' +
        'svakih 6 dB viška udvostručuje je.</p>' +
        '<p><b>Ovdje.</b> Slobodan prostor, bez tla, obzora i prepreka; na Zemlji ih treba dodati. Prigušenje kabela ' +
        'slijedi debeli koaksijalni kabel od 50 Ω; dobitak tanjura je η·(πD/λ)² s η = 0,55.</p>' +
        '<p>Izvori: Friis, <em>A Note on a Simple Transmission Formula</em> (1946); Balanis, <em>Antenna Theory</em>, pogl. 2 ' +
        '(efektivna površina, gubitak polarizacije, Friisova formula); Kraus, <em>Antennas</em>.</p>'
    },
    en: {
      stage: 'The link budget in dBm from the transmitter to the receiver, the received power against distance, and the readouts',

      ptx: 'Transmitter',
      dish: 'Dishes of fixed size',
      gt: 'Transmit gain',
      gr: 'Receive gain',
      dt: 'Transmit dish',
      dr: 'Receive dish',
      lt: 'Transmit cable',
      lr: 'Receive cable',
      f: 'Frequency (MHz)',
      dk: 'Distance',
      psi: 'Polarization',
      sens: 'Receiver sensitivity',
      fade: 'Fade reserve',

      dbmW: '{v} dBm = {w}',
      dbm: '{v} dBm',
      dbi: '{v} dBi',
      db: '{v} dB',
      dbPlus: '+{v} dB',
      deg: '{v}°',
      meter: '{v} m',
      cm: '{v} cm',
      km: '{v} km',
      sqm: '{v} m²',
      sqcm: '{v} cm²',
      wW: '{v} W',
      wMw: '{v} mW',
      wUw: '{v} µW',
      wNw: '{v} nW',
      wPw: '{v} pW',
      wFw: '{v} fW',
      wAw: '{v} aW',
      wTiny: '< 1 aW',
      vMv: '{v} mV',
      vUv: '{v} µV',
      vNv: '{v} nV',
      vTiny: '< 0.01 nV',

      preset_handheld: 'Two handhelds',
      preset_handheldHint: '2 m band, 10 km: in free space a 61 dB margin',
      preset_band: 'Same, 2.4 GHz',
      preset_bandHint: '24 dB less: a smaller catching area',
      preset_base: 'A base station',
      preset_baseHint: '30 m of cable, the handheld at 45°',
      preset_satellite: 'A satellite',
      preset_satelliteHint: '2000 km: heard, but too little for the fade reserve',
      preset_dishes: 'Two dishes',
      preset_dishesHint: 'A higher band, a stronger signal',

      legendLevel: 'level in dBm',
      legendUp: 'gain',
      legendDown: 'loss',
      legendSens: 'receiver sensitivity',
      legendFade: 'fade reserve',

      ladTitle: 'The link budget',
      ladTx: 'transmitter, {w}',
      ladCableTx: 'cable and connectors',
      ladGt: 'transmit antenna',
      ladEirp: 'EIRP',
      ladSpread: 'spreading over a sphere 4πd²',
      ladArea: 'an isotropic antenna catches λ²/4π',
      ladGr: 'receive antenna',
      ladPol: 'polarization',
      ladCableRx: 'cable and connectors',
      ladRx: 'received',
      ladMargin: 'margin',
      ladPath: 'path loss {v}',
      ladSens: 'sensitivity',
      ladNothing: 'nothing',
      ladNone: '—',
      ladInf: '−∞ dB',
      dbmTick: 'dBm',

      plotTitle: 'Received power against distance',
      plotKm: 'km',
      plotNow: 'now',
      plotDouble: '×2: −6 dB',
      plotMax: 'with reserve',
      plotEdge: 'no reserve',
      plotSens: 'sensitivity',

      rowLam: 'wavelength λ',
      rowPath: 'path loss',
      rowArea: 'receiving antenna\'s area',
      rowPrx: 'received power',
      rowUv: 'voltage across the 50 Ω input',
      rowMargin: 'margin above sensitivity',
      rowLeft: 'left over the reserve',
      rowMax: 'longest with the reserve',
      rowEdge: 'longest with no reserve',
      units: 'Free space, no ground and no horizon. Cable: a thick 50 Ω coaxial cable, two connectors of 0.1 dB. Dish: η = 0.55.',

      status_works: 'The link works: {prx} reaches the receiver, {margin} above its sensitivity. {fade} is kept for fading, with {left} to spare.',
      status_fading: 'The receiver hears it, {margin} above its sensitivity, but that is less than the {fade} kept for fading: any fade deeper than {margin} breaks the link.',
      status_worksBare: 'The link works: {prx} reaches the receiver, {margin} above its sensitivity. Nothing is kept for fading.',
      status_fail: 'No link: {prx} is {short} below the receiver\'s sensitivity ({sens}).',
      status_crossed: 'The polarizations are crossed (90°): in theory nothing arrives. In practice reflections and a slightly turned antenna leave something, some 20 to 30 dB down.',
      path: 'Over {d} the path loss is {path}. Of that, {spread} is the power spreading over a sphere 4πd², the same at every frequency; the rest, {area}, is because an isotropic antenna at a wavelength of {lam} catches only λ²/4π = {aiso}.',
      ant_gain: 'Antennas of fixed gain: the {gr} receiving antenna catches {aeff}. At a higher frequency, a shorter wavelength, it catches less (Gλ²/4π), so the signal drops although space absorbs nothing.',
      ant_dish: 'Dishes of fixed size: the receiving dish catches {aeff} at any frequency, and the transmitting one beams more at a shorter wavelength ({gt}). So here, cables aside, a higher frequency gives a stronger signal.',
      dish_small: 'A dish less than three wavelengths across is only roughly a dish and does not reach that gain.',
      dish_near: 'Closer than 2D²/λ = {far} the dishes are not yet in each other\'s far field: Friis\'s formula does not hold here.',
      pol: 'The antennas are turned {psi} apart: the polarization takes cos²ψ, {pol}.',
      dist_works: 'Each doubling of the distance costs 6 dB: with the fade reserve kept, the link reaches {dmax}.',
      dist_short: 'Each doubling of the distance costs 6 dB: with the fade reserve kept the link would work up to {dmax}, with none kept up to {dedge}.',
      free_note: 'That holds in free space; on the ground the horizon and obstacles stop the signal long before.',

      explain: '<p><b>A sum in dB.</b> Received power = transmitter power − cable loss + transmit antenna gain − path loss ' +
        '+ receive antenna gain − polarization loss − receive cable loss. In dB products add up: this is the Friis formula ' +
        'P<sub>r</sub> = P<sub>t</sub>·G<sub>t</sub>·G<sub>r</sub>·(λ/4πd)².</p>' +
        '<p><b>Path loss.</b> 20·log(4πd/λ) between two isotropic antennas. Space absorbs nothing: the power only spreads ' +
        'over a sphere of area 4πd², so each doubling of the distance leaves a quarter of the power, 6 dB. That part does ' +
        'not depend on the frequency.</p>' +
        '<p><b>Then why does a higher band lose?</b> A receiving antenna catches power as if it had an area A = G·λ²/4π. ' +
        'An antenna of the same gain at a shorter wavelength is smaller and catches less. A dish of fixed size catches the ' +
        'same at every frequency, and its gain grows as f²: two dishes give a stronger signal at a higher band, unless the cable loss, which also grows with frequency, eats it.</p>' +
        '<p><b>Polarization.</b> Two linear antennas turned ψ apart receive cos²ψ: 45° is 3 dB, 90° in theory nothing.</p>' +
        '<p><b>Margin.</b> The margin is the received power less the receiver\'s sensitivity. Part of it must be kept for ' +
        'fading, when the signal drops for a moment. What is left above that reserve sets the longest distance: every 6 dB ' +
        'to spare doubles it.</p>' +
        '<p><b>Here.</b> Free space, with no ground, horizon or obstacles; on the Earth they have to be added. The cable ' +
        'loss follows a thick 50 Ω coaxial cable; a dish\'s gain is η·(πD/λ)² with η = 0.55.</p>' +
        '<p>Sources: Friis, <em>A Note on a Simple Transmission Formula</em> (1946); Balanis, <em>Antenna Theory</em>, ch. 2 ' +
        '(effective area, polarization loss, the Friis formula); Kraus, <em>Antennas</em>.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
