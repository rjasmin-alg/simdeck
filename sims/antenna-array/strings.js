/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of antenna-array, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept).
   Croatian terms: 50ohm-contents-hr where it has them (dijagram zračenja, dobitak, dBi, dBd, fazni pomak, širina snopa na
   polovici snage, omjer naprijed-natrag, izotropni zračitelj); the rest are marked (check) in NOTES.md. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Antene u nizu: valovi odozgo, dijagram zračenja u vodoravnoj i okomitoj ravnini, i očitanja',

      n: 'Broj antena',
      d: 'Razmak',
      lag: 'Fazni pomak (svaka kasni za prethodnom)',
      t: 'Vrijeme ωt',
      dVal: '{v} λ',
      degVal: '{v}°',
      nVal: '{v}',

      play: 'Pokreni',
      pause: 'Zaustavi',
      playHint: 'Valovi putuju; vrijeme teče ukrug kroz jednu periodu',
      playKey: 'Pokreni ili zaustavi valove',
      keyFwd: 'Vrijeme naprijed za 15°',
      keyBack: 'Vrijeme natrag za 15°',
      tNow: 'ωt = {v}°',

      preset_broadside: 'Bočno zračenje',
      preset_broadsideHint: 'Dvije antene, λ/2, u fazi: snop okomito na liniju',
      preset_endfire: 'Uzdužno zračenje',
      preset_endfireHint: 'Dvije antene, λ/2, u protufazi: snop duž linije',
      preset_cardioid: 'Kardioida',
      preset_cardioidHint: 'λ/4 i 90°: nula straga',
      preset_steer: 'Zakretanje snopa',
      preset_steerHint: 'Četiri antene, 90° pomaka: snop na 60°',
      preset_grating: 'Rešetkasti snopovi',
      preset_gratingHint: 'Razmak 1,5 λ: još dva snopa pune jakosti',
      preset_eight: 'Osam antena',
      preset_eightHint: 'Uži snop, 12,4 dBi',

      legendWave: 'val sada (+ i −; prazno gdje se poništava)',
      legendArray: 'niz',
      legendDipole: 'jedan dipol, ista snaga',
      legendAf: 'faktor niza',
      legendMain: 'glavni snop',
      legendGrating: 'rešetkasti snop',

      mapTitle: 'Valovi odozgo, blizu antena',
      mapScale: 'λ',
      feedTitle: 'Struja u svakoj anteni: kasni za',
      polarTitle: 'Daleko polje, vodoravna ravnina',
      vertTitle: 'Okomita ravnina kroz snop',
      vertSub: 'dipol × faktor niza = niz',
      ringX: '{v}× polje dipola',
      front: 'snop',
      backDir: 'natrag',
      up: 'gore',

      rowMain: 'glavni snop',
      rowBw: 'širina snopa',
      rowGrating: 'rešetkasti',
      rowSide: 'bočna latica',
      rowFb: 'naprijed-natrag',
      rowD: 'usmjerenost',
      rowOver: 'prema dipolu',
      overCell: '+{v} dB',
      mainAll: 'svuda okolo',
      mainOver: '{v} ({db})',
      gratingNone: 'nema',
      gratingSome: '{k}: {list}',
      fbNull: '∞ (nula)',
      fbBoth: '0 dB (obje strane)',
      none: '—',
      bwAll: 'svuda',
      dbi: '{v} dBi',
      dbVal: '{v} dB',
      units: 'Antene su okomiti poluvalni dipoli u vodoravnoj liniji. Kutovi se mjere od desnog kraja linije (0°), širina snopa na −3 dB, bočna latica prema glavnoj. Polje niza crta se u odnosu na jedan dipol iste snage.',

      main_single: 'Jedan dipol u vodoravnoj ravnini zrači jednako na sve strane. Dodaj još jednu antenu.',
      main_broadside: 'Sve struje su u fazi. Okomito na liniju valovi od svih antena putuju jednako daleko pa stižu u korak i zbrajaju se: snop na 90°.',
      main_endfire: 'Susjedne struje razlikuju se u fazi za {lag}, a duž linije njihovi se putovi razlikuju za {path}: to točno nadoknađuje razliku faze, pa prema {main} valovi stižu u korak.',
      main_steered: 'Susjedne struje razlikuju se u fazi za {lag}. U smjeru {main} od linije njihovi se putovi razlikuju za {path}, što točno nadoknađuje tu razliku: ondje valovi stižu u korak. Snop se okreće prema anteni koja kasni.',
      main_over: 'Susjedne struje razlikuju se u fazi za {lag}, više nego što val dobije na cijelom razmaku ({span}): ni u jednom smjeru valovi ne stižu u korak. Najjači je smjer {main}, {db} ispod pune jakosti.',
      side_mirror: 'Linija ne razlikuje svoje dvije strane: isti snop gleda i na {mirror}.',
      back_null: 'Natrag se razlika puta zbraja s faznim pomakom u pola periode: valovi se poništavaju, nula straga.',
      back_nullMany: 'Natrag se faze {n} valova jednoliko raspoređuju po krugu i poništavaju: nula straga.',
      back_grating: 'Natrag razlika puta i fazni pomak zajedno daju cijelu periodu: i straga je snop pune jakosti, rešetkasti.',
      back_both: 'Linija ne razlikuje svoje dvije strane: snop ide na obje.',
      back_twin: 'I natrag razlika puta i fazni pomak zajedno daju cijelu periodu: straga je jednako jako (prvi rešetkasti snop, na samoj liniji).',
      back_mirror: 'I straga je jednako jako.',
      back_some: 'Straga je polje {fb} slabije.',
      grating_some: 'Na razmaku {d} razlika puta može nadoknaditi i cijelu periodu više: {k} pune jakosti ({list}), rešetkasti snopovi.',
      grating_soon: 'Duž linije raste latica od {side}: na većem razmaku i ona postaje snop pune jakosti.',
      dir_line: 'Širina snopa {bw}, usmjerenost {dbi}: {od} više od jednog dipola iste snage.',
      dir_lineAll: 'Usmjerenost {dbi}: {od} više od jednog dipola iste snage.',
      dir_single: 'Usmjerenost {dbi}, kao svaki poluvalni dipol.',
      gratingCount: ['još {n} snop', 'još {n} snopa', 'još {n} snopova'],

      explain: '<p><b>Dvije antene zajedno.</b> Dvije jednake antene napajane istim signalom zbrajaju svoja polja. U svakom smjeru ' +
        'valovi se razlikuju u dvije stvari: u putu (razlika d·cos φ, gdje je d razmak, a φ kut od linije) i u fazi struje kojom ih ' +
        'napajamo (<i>fazni pomak</i> α). Gdje oboje zajedno daje cijelu periodu, valovi se pojačavaju; gdje daje pola periode, ' +
        'poništavaju se.</p>' +
        '<p><b>Faktor niza.</b> Za n antena s istim strujama i pomakom α između susjednih: AF = |sin(nψ/2) / sin(ψ/2)|, ' +
        'ψ = k·d·cos φ − α, k = 2π/λ. Za dvije antene to je 2·|cos(ψ/2)|. Dijagram niza je dijagram jedne antene pomnožen ' +
        'faktorom niza: u vodoravnoj ravnini okomiti dipol zrači jednako na sve strane, pa je ondje dijagram sam faktor niza; ' +
        'u okomitoj ravnini (desno dolje) vidi se množenje.</p>' +
        '<p><b>Tri klasična para.</b> λ/2 u fazi: snop okomito na liniju (bočno zračenje), nule duž linije. λ/2 u protufazi: ' +
        'snop duž linije (uzdužno zračenje), nula okomito. λ/4 uz 90° pomaka: kardioida, nula straga, jer se ondje λ/4 puta i ' +
        '90° kašnjenja zbrajaju u pola periode.</p>' +
        '<p><b>Zakretanje snopa.</b> Glavni snop je ondje gdje je ψ = 0: cos φ₀ = α / (360° · d/λ). Promjena faze, bez ' +
        'pomicanja antena, zakreće snop prema anteni koja kasni. Kad je α veći od 360° · d/λ, toga smjera nema.</p>' +
        '<p><b>Rešetkasti snopovi.</b> Kad je razmak veći od λ, i ψ = ±2π, ±4π… padaju u stvarne smjerove: dodatni snopovi ' +
        'jednako jaki kao glavni. Za bočni snop pojavljuju se na d = λ, za zakrenut već na d = λ / (1 + |cos φ₀|).</p>' +
        '<p><b>Više antena.</b> Uži snop i veća usmjerenost: za dugi niz u fazi širina snopa je oko 51° · λ / (n·d), a bočne ' +
        'latice ostaju oko 13 dB ispod glavne. Usmjerenost se ovdje računa iz međusobnih otpora zračenja parova dipola.</p>' +
        '<p><b>Pojednostavljeno.</b> Struje su zadane jednake (stvarni niz treba mrežu napajanja koja ih nametne, jer međusobna ' +
        'sprega mijenja impedancije); nema tla; slika valova crta samo daleko polje i svjetlinu izjednačuje s udaljenošću.</p>' +
        '<p>Izvori: Balanis, <em>Antenna Theory</em>, pogl. 6 (nizovi, faktor niza, rešetkasti snopovi) i 8.6 (međusobna ' +
        'impedancija); Kraus, <em>Antennas</em>, pogl. o nizovima točkastih izvora.</p>'
    },
    en: {
      stage: 'Antennas in a line: the waves from above, the radiation pattern in the horizontal and vertical planes, and the readings',

      n: 'Number of elements',
      d: 'Spacing',
      lag: 'Phase step (each lags the one before)',
      t: 'Time ωt',
      dVal: '{v} λ',
      degVal: '{v}°',
      nVal: '{v}',

      play: 'Play',
      pause: 'Pause',
      playHint: 'The waves travel; time runs round one period',
      playKey: 'Play or pause the waves',
      keyFwd: 'Time forward by 15°',
      keyBack: 'Time back by 15°',
      tNow: 'ωt = {v}°',

      preset_broadside: 'Broadside',
      preset_broadsideHint: 'Two elements, λ/2, in phase: a beam across the line',
      preset_endfire: 'End-fire',
      preset_endfireHint: 'Two elements, λ/2, in antiphase: a beam along the line',
      preset_cardioid: 'Cardioid',
      preset_cardioidHint: 'λ/4 and 90°: a null at the back',
      preset_steer: 'Steering',
      preset_steerHint: 'Four elements, a 90° step: the beam at 60°',
      preset_grating: 'Grating lobes',
      preset_gratingHint: 'Spacing 1.5 λ: two more full-size beams',
      preset_eight: 'Eight elements',
      preset_eightHint: 'A narrower beam, 12.4 dBi',

      legendWave: 'the wave now (+ and −; blank where it cancels)',
      legendArray: 'the array',
      legendDipole: 'one dipole, same power',
      legendAf: 'array factor',
      legendMain: 'main beam',
      legendGrating: 'grating lobe',

      mapTitle: 'The waves from above, near the array',
      mapScale: 'λ',
      feedTitle: 'The current in each element: lags by',
      polarTitle: 'Far field, horizontal plane',
      vertTitle: 'Vertical plane through the beam',
      vertSub: 'dipole × array factor = array',
      ringX: '{v}× the dipole\'s field',
      front: 'beam',
      backDir: 'back',
      up: 'up',

      rowMain: 'main beam',
      rowBw: 'beamwidth',
      rowGrating: 'grating lobes',
      rowSide: 'side lobe',
      rowFb: 'front-to-back',
      rowD: 'directivity',
      rowOver: 'over a dipole',
      overCell: '+{v} dB',
      mainAll: 'all round',
      mainOver: '{v} ({db})',
      gratingNone: 'none',
      gratingSome: '{k}: {list}',
      fbNull: '∞ (a null)',
      fbBoth: '0 dB (both sides)',
      none: '—',
      bwAll: 'all round',
      dbi: '{v} dBi',
      dbVal: '{v} dB',
      units: 'The elements are vertical half-wave dipoles in a horizontal line. Angles count from the line\'s right end (0°), the beamwidth at −3 dB, the side lobe against the main one. The array\'s field is drawn against one dipole fed the same power.',

      main_single: 'One dipole radiates the same all round in the horizontal plane. Add another element.',
      main_broadside: 'All the currents are in phase. Across the line the waves from every element travel equally far, so they arrive in step and add up: a beam at 90°.',
      main_endfire: 'Neighbouring currents differ in phase by {lag}, and along the line their paths differ by {path}: that makes up exactly for the phase, so towards {main} the waves arrive in step.',
      main_steered: 'Neighbouring currents differ in phase by {lag}. In the direction {main} from the line their paths differ by {path}, which makes up exactly for it: there the waves arrive in step. The beam turns towards the element that lags.',
      main_over: 'Neighbouring currents differ in phase by {lag}, more than the wave gains over a whole spacing ({span}): in no direction do the waves arrive in step. The strongest direction is {main}, {db} below full strength.',
      side_mirror: 'A line cannot tell its two sides apart: the same beam also points to {mirror}.',
      back_null: 'Backwards the path difference adds to the phase step to make half a period: the waves cancel, a null at the back.',
      back_nullMany: 'Backwards the phases of the {n} waves spread evenly round the circle and cancel: a null at the back.',
      back_grating: 'Backwards the path difference and the phase step together make a whole period: there is a full-size beam at the back too, a grating lobe.',
      back_both: 'A line cannot tell its two sides apart: the beam goes both ways.',
      back_twin: 'Backwards too, the path difference and the phase step together make a whole period: the back is as strong as the front (the first grating lobe, on the line itself).',
      back_mirror: 'The back is just as strong.',
      back_some: 'The back is {fb} weaker.',
      grating_some: 'At a spacing of {d} the path can also make up a whole extra period: {k} at full strength ({list}), grating lobes.',
      grating_soon: 'Along the line a lobe of {side} is growing: at a larger spacing it becomes a full-size beam too.',
      dir_line: 'Beamwidth {bw}, directivity {dbi}: {od} more than one dipole fed the same power.',
      dir_lineAll: 'Directivity {dbi}: {od} more than one dipole fed the same power.',
      dir_single: 'Directivity {dbi}, like any half-wave dipole.',
      gratingCount: ['{n} more beam', '{n} more beams'],

      explain: '<p><b>Two antennas together.</b> Two identical antennas fed from one signal add their fields. In each direction ' +
        'their waves differ in two things: the path (a difference of d·cos φ, with d the spacing and φ the angle from the line) ' +
        'and the phase of the current that feeds them (the <i>phase step</i> α). Where the two together make a whole period, ' +
        'the waves reinforce; where they make half a period, they cancel.</p>' +
        '<p><b>The array factor.</b> For n elements with equal currents and a step α between neighbours: ' +
        'AF = |sin(nψ/2) / sin(ψ/2)|, ψ = k·d·cos φ − α, k = 2π/λ. For two elements it is 2·|cos(ψ/2)|. The array\'s pattern is ' +
        'one element\'s pattern multiplied by the array factor: in the horizontal plane a vertical dipole radiates the same all ' +
        'round, so there the pattern is the array factor alone; the vertical plane (bottom right) shows the multiplication.</p>' +
        '<p><b>Three classic pairs.</b> λ/2 in phase: a beam across the line (broadside), nulls along it. λ/2 in antiphase: a ' +
        'beam along the line (end-fire), a null across it. λ/4 with a 90° step: a cardioid with a null at the back, where λ/4 ' +
        'of path and 90° of lag add up to half a period.</p>' +
        '<p><b>Steering.</b> The main beam is where ψ = 0: cos φ₀ = α / (360° · d/λ). Changing the phase, without moving an ' +
        'element, turns the beam towards the lagging element. When α is more than 360° · d/λ that direction does not exist.</p>' +
        '<p><b>Grating lobes.</b> With a spacing over λ, ψ = ±2π, ±4π… also fall in real directions: extra beams as strong as ' +
        'the main one. For a broadside beam they appear at d = λ, for a steered one already at d = λ / (1 + |cos φ₀|).</p>' +
        '<p><b>More elements.</b> A narrower beam and a higher directivity: for a long array in phase the beamwidth is about ' +
        '51° · λ / (n·d), and the side lobes stay about 13 dB below the main one. The directivity here comes from the mutual ' +
        'radiation resistances of each pair of dipoles.</p>' +
        '<p><b>Simplified.</b> The currents are set equal (a real array needs a feed network to force them, because mutual ' +
        'coupling changes the impedances); there is no ground; the wave picture draws only the far-field term and evens out ' +
        'its brightness with distance.</p>' +
        '<p>Sources: Balanis, <em>Antenna Theory</em>, ch. 6 (arrays, the array factor, grating lobes) and 8.6 (mutual ' +
        'impedance); Kraus, <em>Antennas</em>, the chapter on arrays of point sources.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
