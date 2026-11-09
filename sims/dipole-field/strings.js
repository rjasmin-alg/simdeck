/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of dipole-field, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept).
   Croatian terms: 50ohm-contents-hr where it has them (reaktivno blisko polje, zračeće blisko polje, daleko polje,
   silnice električnog polja, valni otpor polja, jalov); the rest are marked (check) in NOTES.md. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Silnice električnog polja kratkog dipola kroz jednu periodu, sonda i njezina polja',
      credit: 'Ideja: objašnjenje zračenja lomom silnica, s predavanja iz Antena na FER-u',

      c: 'Brzina svjetlosti c',
      c_finite: 'konačna',
      c_inf: 'beskonačna',
      r: 'Udaljenost sonde r',
      rVal: '{r} λ = {m}',
      zones: 'Označi zone',
      t: 'Vrijeme ωt',
      tNow: 'ωt = {v}°',
      play: 'Pokreni',
      pause: 'Zaustavi',
      playHint: 'Vrijeme teče u krug, jedna perioda za 5 s',
      playKey: 'vrijeme teče / staje',
      keyFwd: 'vrijeme +15°',
      keyBack: 'vrijeme −15°',

      preset_near: 'Blisko polje',
      preset_nearHint: 'Sonda na 0,08 λ: E/H ≈ 600 Ω, H 83° ispred E',
      preset_pinch: 'Petlja se odvaja',
      preset_pinchHint: 'ωt = 60°: točka odvajanja na 0,15 λ',
      preset_edge: 'Na granici λ/2π',
      preset_edgeHint: 'E/H ≈ 266 Ω, H 45° ispred E',
      preset_far: 'Daleko polje',
      preset_farHint: 'Sonda na 1,5 λ: E/H ≈ 373 Ω, u fazi',
      preset_inf: 'c beskonačna',
      preset_infHint: 'Silnice samo rastu i skupljaju se',

      legendPos: 'silnica E',
      legendNeg: 'silnica E, suprotni smjer',
      legendX: 'odvajanje petlje',
      legendProbe: 'sonda',

      cInf: 'c = ∞',
      pinchLabel: 'petlja se odvaja',
      zoneNear: 'reaktivno blisko polje',
      zoneMid: 'zračeće blisko polje',
      zoneFar: 'daleko polje',
      zoneAll: 'sve je blisko polje',
      tickNear: 'λ/2π',
      tickLambda: '{n} λ',
      lambdaNote: 'λ = 30 m (10 MHz)',
      eLabel: 'E',
      hLabel: 'H',

      rowR: 'udaljenost r',
      rowKr: 'kr',
      rowZone: 'zona',
      rowE: 'amplituda E',
      rowH: 'amplituda H',
      rowZ: 'E/H',
      rowLead: 'H ispred E',
      rowP: 'snaga kroz sferu r',
      valR: '{r} λ = {m}',
      vm: '{v} V/m',
      mam: '{v} mA/m',
      ohm: '{v} Ω',
      deg: '{v}°',
      mw: '{v} mW',
      units: 'Kratki dipol duljine λ/50 (0,6 m), struja 1 A, 10 MHz. Snaga kroz sferu: srednji tok prema van, 4πr²·⅔·½·E·H·cos(pomak H ispred E).',

      plotTime: 'Na sondi kroz jednu periodu',
      max: 'maks.',
      min: '−maks.',
      plotDist: 'E i 377 Ω·H (V/m) prema r (λ)',
      plotDeg: 'ωt (°)',
      seriesE: 'E',
      seriesHn: 'H',
      slope1: '1/r',
      slope2: '1/r²',
      slope3: '1/r³',
      dash: '—',

      cap_peak: 'ωt = {t}: naboj na krajevima dipola je najveći, a struja nula.',
      cap_zero: 'ωt = {t}: naboja na krajevima nema, a struja je najveća.',
      cap_mid: 'ωt = {t}: naboj na krajevima je {q} najvećeg, struja {i} najveće.',
      cap_pinch: 'Na {r} (točka ×) silnice se stežu: vanjski dio zatvara se u petlju koja odlazi van, unutarnji se vraća u dipol.',
      cap_lines: 'Blizu dipola silnice izlaze iz njega i vraćaju se svake pola periode; od otprilike {r} van odvajaju se zatvorene petlje i putuju van, a daleko brzinom c.',
      cap_inf: 'S beskonačnom c silnice samo rastu i skupljaju se s nabojem dipola: nijedna se ne odvaja i ništa ne odlazi.',
      p_near: 'Sonda na {r} je u reaktivnom bliskom polju: E/H = {Z}, a H je {lead} ispred E, pa energija odlazi i vraća se.',
      p_mid: 'Sonda na {r} je izvan λ/2π, u zračećem bliskom polju: E/H = {Z}, H je {lead} ispred E.',
      p_far: 'Sonda na {r} je u dalekom polju: E i H su u fazi (razlika {lead}), E/H = {Z}, blizu 377 Ω, i oba padaju kao 1/r.',
      p_inf: 'Sonda na {r}: E/H = {Z} = 377 Ω / kr, H je točno 90° ispred E, a srednji tok snage je nula.',

      explain: '<p>Kratki dipol je žica, mnogo kraća od valne duljine, u kojoj naboj titra gore-dolje: na krajevima je ' +
        'naboj ±q, a kroz žicu teče struja koja je 90° ispred naboja. Silnice ovdje su točno rješenje Maxwellovih jednadžbi za takav dipol ' +
        '(Hertz, 1889): razinske krivulje funkcije sin²θ·[cos(ωt − kr)/(kr) − sin(ωt − kr)], gdje je k = 2π/λ.</p>' +
        '<p><b>Reaktivno blisko polje</b> (r &lt; λ/2π, kr &lt; 1). Silnice izlaze iz pozitivnog kraja i vraćaju se u negativni, ' +
        'kao kod kondenzatora. Svake pola periode skupe se natrag u dipol i izađu suprotnog smjera. E pada kao 1/r³ i prati naboj, ' +
        'H pada kao 1/r² i prati struju, pa je H 90° ispred E: energija se pohranjuje u polju i vraća anteni, kao u kondenzatoru ' +
        'i zavojnici. E/H jako ovisi o udaljenosti: blizu je daleko iznad 377 Ω, a kod λ/2π ispod.</p>' +
        '<p><b>Odvajanje petlje.</b> Polje daleko od dipola kasni za r/c. Kad naboj nakon vrha počne padati, ' +
        'vanjski dio silnica ne stigne natrag: na kr = √2 (0,225 λ, otprilike četvrtina valne duljine) silnice se stegnu u točki ×, ' +
        'a ono što je vani zatvori se u petlju bez naboja koja putuje van, a daleko od dipola brzinom c. Takva petlja je zračenje.</p>' +
        '<p><b>Daleko polje</b> (kr ≫ 1). Ostaje samo dio koji pada kao 1/r: E i H su okomiti, u fazi, a E/H je valni otpor polja ' +
        'slobodnog prostora, μ0·c ≈ 377 Ω. Prijelaz nije oštar: E/H padne ispod 377 Ω kod kr = 0,71, najniži je 257 Ω kod kr = 1,17 ' +
        'pa se odozdo približava 377 Ω (367 Ω na λ, 374 Ω na 2 λ). Za stvarne žičane antene propisi uzimaju daleko polje od oko 4 λ.</p>' +
        '<p>Srednji tok snage kroz sferu oko dipola isti je na svakoj udaljenosti: u bliskom polju su E i H veliki, ali je njihov ' +
        'umnožak većinom jalov i vraća se. Da je c beskonačna, H bi uvijek bio 90° ispred E, tok bi bio nula, a silnice bi samo ' +
        'rasle i skupljale se s nabojem: nema odvajanja ni zračenja.</p>' +
        '<p>Izvori: Griffiths, <em>Introduction to Electrodynamics</em>, pogl. 11; Balanis, <em>Antenna Theory</em>, pogl. 4; ' +
        'Purcell i Morin, <em>Electricity and Magnetism</em>, dodatak H.</p>'
    },
    en: {
      stage: 'Electric field lines of a short dipole over one period, a probe and its fields',
      credit: 'Idea: explaining radiation by kinking field lines, from the antenna lectures at FER',

      c: 'Speed of light c',
      c_finite: 'finite',
      c_inf: 'infinite',
      r: 'Probe distance r',
      rVal: '{r} λ = {m}',
      zones: 'Mark the zones',
      t: 'Time ωt',
      tNow: 'ωt = {v}°',
      play: 'Play',
      pause: 'Pause',
      playHint: 'Time runs round, one period in 5 s',
      playKey: 'time runs / stops',
      keyFwd: 'time +15°',
      keyBack: 'time −15°',

      preset_near: 'Near field',
      preset_nearHint: 'Probe at 0.08 λ: E/H ≈ 600 Ω, H 83° ahead of E',
      preset_pinch: 'A loop breaks away',
      preset_pinchHint: 'ωt = 60°: the pinch at 0.15 λ',
      preset_edge: 'At λ/2π',
      preset_edgeHint: 'E/H ≈ 266 Ω, H 45° ahead of E',
      preset_far: 'Far field',
      preset_farHint: 'Probe at 1.5 λ: E/H ≈ 373 Ω, in phase',
      preset_inf: 'c infinite',
      preset_infHint: 'The lines only grow and shrink',

      legendPos: 'E field line',
      legendNeg: 'E field line, opposite sense',
      legendX: 'loop pinching off',
      legendProbe: 'probe',

      cInf: 'c = ∞',
      pinchLabel: 'a loop pinches off',
      zoneNear: 'reactive near field',
      zoneMid: 'radiating near field',
      zoneFar: 'far field',
      zoneAll: 'all of it is near field',
      tickNear: 'λ/2π',
      tickLambda: '{n} λ',
      lambdaNote: 'λ = 30 m (10 MHz)',
      eLabel: 'E',
      hLabel: 'H',

      rowR: 'distance r',
      rowKr: 'kr',
      rowZone: 'zone',
      rowE: 'E amplitude',
      rowH: 'H amplitude',
      rowZ: 'E/H',
      rowLead: 'H ahead of E',
      rowP: 'power through sphere r',
      valR: '{r} λ = {m}',
      vm: '{v} V/m',
      mam: '{v} mA/m',
      ohm: '{v} Ω',
      deg: '{v}°',
      mw: '{v} mW',
      units: 'A short dipole λ/50 long (0.6 m), 1 A, 10 MHz. Power through the sphere: the mean outward flow, 4πr²·⅔·½·E·H·cos(lead of H).',

      plotTime: 'At the probe over one period',
      max: 'max',
      min: '−max',
      plotDist: 'E and 377 Ω·H (V/m) against r (λ)',
      plotDeg: 'ωt (°)',
      seriesE: 'E',
      seriesHn: 'H',
      slope1: '1/r',
      slope2: '1/r²',
      slope3: '1/r³',
      dash: '—',

      cap_peak: 'ωt = {t}: the charge on the dipole\'s ends is at its peak and the current is zero.',
      cap_zero: 'ωt = {t}: there is no charge on the ends and the current is at its peak.',
      cap_mid: 'ωt = {t}: the charge on the ends is {q} of its peak, the current {i} of its peak.',
      cap_pinch: 'At {r} (the ×) the lines pinch: the outer part closes into a loop that travels out, the inner part goes back into the dipole.',
      cap_lines: 'Near the dipole the lines come out of it and go back in every half period; from about {r} out closed loops break away and travel out, far out at c.',
      cap_inf: 'With c infinite the lines only grow and shrink with the dipole\'s charge: none breaks away and nothing leaves.',
      p_near: 'The probe at {r} is in the reactive near field: E/H = {Z}, and H is {lead} ahead of E, so energy flows out and back.',
      p_mid: 'The probe at {r} is past λ/2π, in the radiating near field: E/H = {Z}, H is {lead} ahead of E.',
      p_far: 'The probe at {r} is in the far field: E and H are in phase (apart by {lead}), E/H = {Z}, close to 377 Ω, and both fall as 1/r.',
      p_inf: 'The probe at {r}: E/H = {Z} = 377 Ω / kr, H is exactly 90° ahead of E, and the mean power flow is zero.',

      explain: '<p>A short dipole is a wire, much shorter than the wavelength, in which charge swings up and down: the ends carry ' +
        '±q and the wire a current 90° ahead of the charge. The lines here are the exact solution of Maxwell\'s equations for such a dipole ' +
        '(Hertz, 1889): the contours of sin²θ·[cos(ωt − kr)/(kr) − sin(ωt − kr)], with k = 2π/λ.</p>' +
        '<p><b>Reactive near field</b> (r &lt; λ/2π, kr &lt; 1). The lines leave the positive end and return to the negative one, ' +
        'as in a capacitor. Every half period they shrink back into the dipole and come out the other way. E falls as 1/r³ and ' +
        'follows the charge, H falls as 1/r² and follows the current, so H is 90° ahead of E: energy is stored in the field and ' +
        'handed back to the antenna, as in a capacitor and a coil. E/H depends strongly on the distance: far above 377 Ω close in, below it near λ/2π.</p>' +
        '<p><b>A loop breaks away.</b> The field far from the dipole lags by r/c. When the charge starts to fall after its peak, ' +
        'the outer part of the lines cannot get back in time: at kr = √2 (0.225 λ, about a quarter wavelength) the lines pinch at ' +
        'the ×, and what is outside closes into a loop with no charge in it that travels out, far from the dipole at c. Such a loop is radiation.</p>' +
        '<p><b>Far field</b> (kr ≫ 1). Only the part that falls as 1/r is left: E and H are at right angles and in phase, and ' +
        'E/H is the wave impedance of free space, μ0·c ≈ 377 Ω. The change is gradual: E/H drops below 377 Ω at kr = 0.71, is ' +
        'lowest, 257 Ω, at kr = 1.17, and then approaches 377 Ω from below (367 Ω at λ, 374 Ω at 2 λ). For real wire antennas ' +
        'the regulations take the far field from about 4 λ.</p>' +
        '<p>The mean power through a sphere round the dipole is the same at every distance: in the near field E and H are large, ' +
        'but most of their product is reactive and flows back. If c were infinite, H would always be 90° ahead of E, the flow would ' +
        'be zero, and the lines would only grow and shrink with the charge: no loops break away, nothing radiates.</p>' +
        '<p>Sources: Griffiths, <em>Introduction to Electrodynamics</em>, ch. 11; Balanis, <em>Antenna Theory</em>, ch. 4; ' +
        'Purcell and Morin, <em>Electricity and Magnetism</em>, appendix H.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
