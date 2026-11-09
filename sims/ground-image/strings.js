/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ground-image, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept).
   Croatian terms: 50ohm-contents-hr where it has them (kut zračenja, groundplane antena, dijagram zračenja, dobitak,
   dBi); skok and F2-regija as in skip-distance; the rest are marked (check) in NOTES.md. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Antena iznad tla: valovi sa strane, dijagram zračenja po elevaciji, očitanja i gdje pada jedan skok',

      ant: 'Antena',
      antH: 'vodoravni dipol',
      antV: 'okomiti dipol',
      antGP: 'λ/4 groundplane',
      h: 'Visina središta',
      hVal: '{v} λ',
      ground: 'Tlo',
      groundPerfect: 'savršeno',
      groundAverage: 'prosječno',
      groundPoor: 'loše',
      t: 'Vrijeme ωt',
      degVal: '{v}°',

      play: 'Pokreni',
      pause: 'Zaustavi',
      playHint: 'Valovi putuju; vrijeme teče ukrug kroz jednu periodu',
      playKey: 'Pokreni ili zaustavi valove',
      keyFwd: 'Vrijeme naprijed za 15°',
      keyBack: 'Vrijeme natrag za 15°',
      tNow: 'ωt = {v}°',

      preset_nvis: 'Nisko: uvis',
      preset_nvisHint: 'Vodoravni dipol na 0,15 λ: zrači uvis, kratak skok',
      preset_half: 'Na λ/2',
      preset_halfHint: 'Jedna latica na 30°, nula ravno gore',
      preset_high: 'Visoko: 2 λ',
      preset_highHint: 'Četiri latice, najniža na 7°: daleki skok',
      preset_highPoor: '2 λ, loše tlo',
      preset_highPoorHint: 'Nule se pune, dio snage ostaje u tlu',
      preset_gp: 'Groundplane',
      preset_gpHint: 'λ/4 nad savršenim tlom: 36,5 Ω, najjače uz obzor',
      preset_gpPoor: 'Groundplane, loše tlo',
      preset_gpPoorHint: 'Obzor utihne, latica se diže',

      legendWave: 'val sada (prazno: poništava se)',
      legendHere: 'ovo tlo',
      legendPerfect: 'savršeno tlo',
      legendFree: 'dipol bez tla',
      legendRay: 'dvije zrake',

      mapTitle: 'Valovi sa strane',
      wireEndOn: 'žica gleda u nas',
      mapScale: 'λ',
      image: 'zrcalna slika',
      earth: 'tlo',
      polarTitle: 'Dijagram zračenja po elevaciji',
      acrossWire: 'u ravnini okomitoj na žicu',
      ringX: '{v}× polje dipola',
      horizon: 'obzor',
      up: 'gore',
      hopTitle: 'Gdje pada jedan skok (F2-regija, 300 km)',
      hopTick: '{v} km',
      hopHere: '{v} km',

      rowHeight: 'visina',
      heightCell: '{v} λ = {m} m',
      heightGP: 'na tlu',
      rowTake: 'kut zračenja',
      takeUp: '90° (uvis)',
      rowLobes: 'latice',
      rowSpan: 'unutar −3 dB',
      spanCell: '{a}–{b}°',
      rowGain: 'dobitak',
      rowUp: 'ravno gore',
      upNull: 'nula',
      rowLost: 'gubi se u tlu',
      lostCell: '{v} %',
      rowR: 'ulazni otpor',
      ohm: '{v} Ω',
      rowHop: 'jedan skok',
      kmVal: '{v} km',
      none: '—',
      dbi: '{v} dBi',
      dbVal: '{v} dB',
      units: 'Kut zračenja je smjer najjače latice iznad obzora. Dobitak u dBi u ravnini okomitoj na vodoravnu žicu. Tla na 7 MHz (λ = 42,8 m). Ulazni otpor samo nad savršenim tlom i za groundplane s radijalima.',

      img_horizontal: 'Tlo je zrcalo: odbijeni val kao da dolazi od zrcalne slike {h} ispod tla, a slika vodoravne struje teče suprotno (protufaza).',
      img_vertical: 'Tlo je zrcalo: odbijeni val kao da dolazi od zrcalne slike {h} ispod tla, a slika okomite struje teče isto (u fazi).',
      img_groundplane: 'Radijali su zrcalo: štap od λ/4 i njegova slika zajedno su poluvalni dipol, pa napajanje vidi pola njegova otpora, {r}.',
      main_up: 'Ravno gore odbijeni val prijeđe samo {pd} više (dvostruka visina) i okrene se na tlu: zajedno su valovi manje od pola periode izvan koraka i zbrajaju se. Najjače je ravno gore: zračenje gotovo okomito uvis (NVIS).',
      main_upHigh: 'Ravno gore odbijeni val prijeđe {pd} više i okrene se na tlu; ondje se valovi ipak zbrajaju najbolje: najjače je ravno gore.',
      main_lobe: 'Na {a} iznad obzora odbijeni val prijeđe {pd} više (2h · sin Δ); s okretanjem na tlu to je cijela perioda, pa valovi stižu u korak: to je kut zračenja.',
      main_lobeReal: 'Na {a} iznad obzora odbijeni val prijeđe {pd} više (2h · sin Δ); s okretanjem na tlu to je gotovo cijela perioda, pa valovi stižu skoro u korak: to je kut zračenja.',
      main_horizon: 'Uz tlo su oba puta jednaka, a slika je u fazi: valovi se zbrajaju i najjače je uz sam obzor.',
      main_lift: 'Pod plosnatim kutom stvarno tlo ipak okreće val: uz obzor slika poništava antenu, pa se najjača latica diže na {a}.',
      lobes_many: 'Na visini {h} ima {n} između obzora i zenita: po jedna za svaku λ/2 visine.',
      lobes_other: 'Na visini {h} ima {n} između obzora i zenita: što je antena viša, to ih je više.',
      zenith_null: 'Ravno gore putovi se razlikuju za cijelu valnu duljinu, a okretanje ih poništava: nula.',
      hor_h: 'Uz tlo su putovi jednaki i okretanje ih poništava: uz obzor nema ništa.',
      gp_low: 'Nizak kut doseže daleko: nad dobrim tlom okomita antena je antena za daleke veze.',
      gain: 'Dobitak {g}.',
      ground_real: 'Ovo tlo odbija samo dio vala: nule se pune, {lost} snage ostaje u tlu, a dobitak je {g}, {below} manje nego nad savršenim tlom.',
      ground_realNoFill: 'Ovo tlo odbija samo dio vala: {lost} snage ostaje u tlu, a dobitak je {g}, {below} manje nego nad savršenim tlom.',
      hop_up: 'Jedan skok preko F2-regije (300 km) vraća se unutar {far} od antene: kratak skok.',
      hop_lobe: 'Jedan skok preko F2-regije (300 km) pod tim kutom pada oko {km} daleko ({near} do {far} unutar −3 dB).',
      lobeCount: ['{n} latica', '{n} latice', '{n} latica'],

      explain: '<p><b>Tlo je zrcalo.</b> Antena iznad tla šalje val izravno i val koji se odbije od tla. Nad savršeno vodljivim ' +
        'tlom odbijeni val izgleda točno kao da dolazi od <i>zrcalne slike</i> antene, jednako duboko ispod tla koliko je ' +
        'antena iznad njega. Struja slike vodoravne antene teče suprotno (protufaza), a okomite isto (u fazi).</p>' +
        '<p><b>Visina i latice.</b> Pod kutom Δ iznad obzora odbijeni val prijeđe 2h · sin Δ više. Za vodoravni dipol polje je ' +
        '2·|sin(2π · h/λ · sin Δ)|: najjače gdje je razlika puta λ/2, 3λ/2…, nula gdje je cijeli broj valnih duljina i uz sam ' +
        'obzor. Do h = λ/4 najjače je ravno gore; svaka nova λ/2 visine dodaje laticu koja se rodi ravno gore i spušta prema ' +
        'obzoru. Najniža je na sin Δ = λ/(4h): λ/2 daje 30°, λ daje 14,5°, 2λ daje 7,2°. Okomitom dipolu polje je ' +
        '2·|cos(2π · h/λ · sin Δ)| puta njegov vlastiti dijagram, pa je nad savršenim tlom najjače uz obzor.</p>' +
        '<p><b>Kut zračenja i skok.</b> Val pod kutom zračenja vraća se s ionosfere na udaljenosti koja ovisi o kutu (vidi ' +
        'skok-udaljenost): nizak kut daje dug skok, ravno gore daje kratak (NVIS, za veze unutar nekoliko stotina km).</p>' +
        '<p><b>Groundplane.</b> Štap od λ/4 na vodljivoj ravnini (radijali) i njegova slika zajedno su poluvalni dipol. Snaga ' +
        'ide samo u gornji poluprostor, pa je ulazni otpor pola od 73 Ω, oko 36,5 Ω, a dobitak dvostruk: 5,16 dBi uz obzor.</p>' +
        '<p><b>Stvarno tlo.</b> Odbija samo dio vala, s koeficijentom refleksije koji ovisi o kutu i polarizaciji (Fresnel). ' +
        'Odbijeni val je slabiji od izravnog, pa se nule ne mogu potpuno zatvoriti, a dio snage ostaje u tlu. Uz obzor svako ' +
        'stvarno tlo okreće val (koeficijent −1): okomita antena tu gubi polje i najjača se latica diže; najmanji odraz okomito ' +
        'polariziranog vala je oko pseudo-Brewsterova kuta (13° za prosječno, 23° za loše tlo).</p>' +
        '<p><b>Pojednostavljeno.</b> Ravno, jednoliko tlo; samo daleko polje i odraz ravnog vala, bez površinskog vala; ' +
        'konstante tla na 7 MHz (prosječno εr = 13, σ = 0,005 S/m; loše εr = 5, σ = 0,001 S/m). ' +
        'Za dipole odbijeni val djeluje natrag na napajanje kao slika, a što tlo upije gubi se; groundplane ima savršene ' +
        'radijale (36,5 Ω), a sve što ne stigne do neba gubi se u tlu. Slika valova izjednačuje svjetlinu s udaljenošću.</p>' +
        '<p>Izvori: Balanis, <em>Antenna Theory</em>, pogl. 4.7–4.8 (antena iznad tla, slika, odraz na tlu); Kraus, ' +
        '<em>Antennas</em> (tlo kao zrcalo, međusobni otpori).</p>'
    },

    en: {
      stage: 'An antenna above the ground: the waves from the side, the elevation pattern, the readings and where one hop lands',

      ant: 'Antenna',
      antH: 'horizontal dipole',
      antV: 'vertical dipole',
      antGP: 'λ/4 ground plane',
      h: 'Height of the centre',
      hVal: '{v} λ',
      ground: 'Ground',
      groundPerfect: 'perfect',
      groundAverage: 'average',
      groundPoor: 'poor',
      t: 'Time ωt',
      degVal: '{v}°',

      play: 'Play',
      pause: 'Pause',
      playHint: 'The waves travel; time runs round one period',
      playKey: 'Play or pause the waves',
      keyFwd: 'Time forward 15°',
      keyBack: 'Time back 15°',
      tNow: 'ωt = {v}°',

      preset_nvis: 'Low: straight up',
      preset_nvisHint: 'A horizontal dipole at 0.15 λ: up, a short hop',
      preset_half: 'At λ/2',
      preset_halfHint: 'One lobe at 30°, a null straight up',
      preset_high: 'High: 2 λ',
      preset_highHint: 'Four lobes, the lowest at 7°: a long hop',
      preset_highPoor: '2 λ, poor ground',
      preset_highPoorHint: 'The nulls fill in, power stays in the ground',
      preset_gp: 'Ground plane',
      preset_gpHint: 'λ/4 over a perfect ground: 36.5 Ω, strongest on the horizon',
      preset_gpPoor: 'Ground plane, poor ground',
      preset_gpPoorHint: 'The horizon goes quiet, the lobe lifts',

      legendWave: 'the wave now (blank: cancelled)',
      legendHere: 'this ground',
      legendPerfect: 'perfect ground',
      legendFree: 'dipole, no ground',
      legendRay: 'the two rays',

      mapTitle: 'The waves from the side',
      wireEndOn: 'the wire seen end-on',
      mapScale: 'λ',
      image: 'image',
      earth: 'ground',
      polarTitle: 'Elevation pattern',
      acrossWire: 'in the plane across the wire',
      ringX: '{v}× a dipole\'s field',
      horizon: 'horizon',
      up: 'up',
      hopTitle: 'Where one hop lands (F2 region, 300 km)',
      hopTick: '{v} km',
      hopHere: '{v} km',

      rowHeight: 'height',
      heightCell: '{v} λ = {m} m',
      heightGP: 'on the ground',
      rowTake: 'take-off angle',
      takeUp: '90° (up)',
      rowLobes: 'lobes',
      rowSpan: 'within −3 dB',
      spanCell: '{a}–{b}°',
      rowGain: 'gain',
      rowUp: 'straight up',
      upNull: 'null',
      rowLost: 'lost in the ground',
      lostCell: '{v} %',
      rowR: 'feed resistance',
      ohm: '{v} Ω',
      rowHop: 'one hop',
      kmVal: '{v} km',
      none: '—',
      dbi: '{v} dBi',
      dbVal: '{v} dB',
      units: 'The take-off angle is the strongest lobe\'s elevation. Gain in dBi in the plane across the horizontal wire. Grounds at 7 MHz (λ = 42.8 m). Feed resistance only over a perfect ground and for the ground plane with its radials.',

      img_horizontal: 'The ground is a mirror: the reflected wave seems to come from an image {h} below the ground, and a horizontal current\'s image flows the other way (antiphase).',
      img_vertical: 'The ground is a mirror: the reflected wave seems to come from an image {h} below the ground, and a vertical current\'s image flows the same way (in phase).',
      img_groundplane: 'The radials are a mirror: the λ/4 rod and its image make a half-wave dipole, so the feed sees half its resistance, {r}.',
      main_up: 'Straight up the reflected wave travels only {pd} farther (twice the height) and flips at the ground: together that leaves the waves less than half a period out of step, so they add. The strongest direction is straight up: near-vertical incidence (NVIS).',
      main_upHigh: 'Straight up the reflected wave travels {pd} farther and flips at the ground; the waves still add best there: the strongest direction is straight up.',
      main_lobe: 'At {a} above the horizon the reflected wave travels {pd} farther (2h · sin Δ); with the flip at the ground that is a whole period, so the waves arrive in step: the take-off angle.',
      main_lobeReal: 'At {a} above the horizon the reflected wave travels {pd} farther (2h · sin Δ); with the flip at the ground that is nearly a whole period, so the waves arrive almost in step: the take-off angle.',
      main_horizon: 'Along the ground both paths are equal and the image is in phase: the waves add, and the strongest direction is the horizon itself.',
      main_lift: 'At grazing angles a real ground flips the wave after all: along the horizon the image cancels the antenna, and the strongest lobe lifts to {a}.',
      lobes_many: 'At {h} there are {n} between the horizon and the zenith: one for every λ/2 of height.',
      lobes_other: 'At {h} there are {n} between the horizon and the zenith: the higher the antenna, the more.',
      zenith_null: 'Straight up the paths differ by a whole wavelength and the flip cancels them: a null.',
      hor_h: 'Along the ground the paths are equal and the flip cancels them: nothing on the horizon.',
      gp_low: 'A low angle reaches far: over a good ground a vertical antenna is a long-distance antenna.',
      gain: 'Gain {g}.',
      ground_real: 'This ground reflects only part of the wave: the nulls fill in, {lost} of the power stays in the ground, and the gain is {g}, {below} less than over a perfect ground.',
      ground_realNoFill: 'This ground reflects only part of the wave: {lost} of the power stays in the ground, and the gain is {g}, {below} less than over a perfect ground.',
      hop_up: 'One hop through the F2 region (300 km) comes down within {far} of the antenna: a short skip.',
      hop_lobe: 'One hop through the F2 region (300 km) at that angle lands about {km} away ({near} to {far} within −3 dB).',
      lobeCount: ['{n} lobe', '{n} lobes'],

      explain: '<p><b>The ground is a mirror.</b> An antenna above the ground sends one wave directly and one that bounces off the ' +
        'ground. Over a perfectly conducting ground the reflected wave looks exactly as if it came from an <i>image</i> of the ' +
        'antenna, as deep below the ground as the antenna is above it. A horizontal antenna\'s image carries its current the ' +
        'other way (antiphase), a vertical one\'s the same way (in phase).</p>' +
        '<p><b>Height and lobes.</b> At an angle Δ above the horizon the reflected wave travels 2h · sin Δ farther. For a ' +
        'horizontal dipole the field is 2·|sin(2π · h/λ · sin Δ)|: strongest where the extra path is λ/2, 3λ/2, …, a null where ' +
        'it is a whole number of wavelengths and on the horizon itself. Up to h = λ/4 the strongest direction is straight up; ' +
        'each further λ/2 of height adds a lobe, born straight up, which moves down towards the horizon. The lowest is at ' +
        'sin Δ = λ/(4h): λ/2 gives 30°, λ gives 14.5°, 2λ gives 7.2°. A vertical dipole\'s field is 2·|cos(2π · h/λ · sin Δ)| ' +
        'times its own pattern, so over a perfect ground it is strongest on the horizon.</p>' +
        '<p><b>Take-off angle and the hop.</b> A wave at the take-off angle comes back from the ionosphere at a distance set by ' +
        'the angle (see skip distance): a low angle makes a long hop, straight up a short one (NVIS, for links within a few ' +
        'hundred km).</p>' +
        '<p><b>The ground plane.</b> A λ/4 rod on a conducting plane (the radials) and its image make a half-wave dipole. The ' +
        'power goes only into the upper half-space, so the feed resistance is half of 73 Ω, about 36.5 Ω, and the gain doubles: ' +
        '5.16 dBi on the horizon.</p>' +
        '<p><b>A real ground</b> reflects only part of the wave, with a reflection coefficient that depends on the angle and ' +
        'the polarization (Fresnel). The reflected wave is weaker than the direct one, so the nulls cannot close completely, ' +
        'and part of the power stays in the ground. At grazing angles every real ground flips the wave (coefficient −1): a ' +
        'vertical antenna loses its field along the horizon and its strongest lobe lifts; vertically polarized waves reflect ' +
        'least near the pseudo-Brewster angle (13° for the average ground, 23° for the poor one).</p>' +
        '<p><b>Simplified.</b> A flat, uniform ground; the far field and plane-wave reflection only, no ground (surface) wave; ' +
        'ground constants at 7 MHz (average εr = 13, σ = 0.005 S/m; poor εr = 5, σ = 0.001 S/m). For the ' +
        'dipoles the reflected wave acts back on the feed as the image does, and what the ground absorbs is lost; the ground ' +
        'plane has perfect radials (36.5 Ω), and whatever does not reach the sky is lost in the ground. The wave picture evens ' +
        'out its brightness with distance.</p>' +
        '<p>Sources: Balanis, <em>Antenna Theory</em>, sections 4.7–4.8 (an antenna above the ground, the image, ground ' +
        'reflection); Kraus, <em>Antennas</em> (the ground as a mirror, mutual resistances).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
