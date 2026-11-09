/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of yagi, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept).
   Croatian terms: 50ohm-contents-hr where it has them (Yagi-Uda antena, zračitelj, reflektor, direktor, parazitni
   elementi, glavni i stražnji režanj, nosač, kut otvora, impedancija napajanja, omjer naprijed-natrag, dobitak, dBi, dBd,
   dijagram zračenja); the rest are marked (check) in NOTES.md. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Yagi-Uda antena: valovi odozgo, struje u elementima, dijagram zračenja u dvije ravnine, očitanja i dobitak prema broju direktora',

      refl: 'Reflektor',
      lr: 'Duljina reflektora',
      sr: 'Razmak reflektora',
      dirs: 'Broj direktora',
      ld: 'Duljina direktora',
      sd: 'Razmak direktora',
      t: 'Vrijeme ωt',
      lamVal: '{v} λ',
      degVal: '{v}°',
      nVal: '{v}',

      play: 'Pokreni',
      pause: 'Zaustavi',
      playHint: 'Valovi putuju; vrijeme teče ukrug kroz jednu periodu',
      playKey: 'Pokreni ili zaustavi valove',
      keyFwd: 'Vrijeme naprijed za 15°',
      keyBack: 'Vrijeme natrag za 15°',
      tNow: 'ωt = {v}°',

      preset_dipole: 'Sam dipol',
      preset_dipoleHint: 'Dipol od 0,475 λ: naprijed jednako kao natrag',
      preset_reflector: 'Reflektor',
      preset_reflectorHint: 'Dulji element 0,15 λ iza: 6,5 dBi',
      preset_director: 'Direktor',
      preset_directorHint: 'Kraći element 0,1 λ ispred: 6,3 dBi',
      preset_three: 'Tri elementa',
      preset_threeHint: 'Reflektor, zračitelj, direktor: 8,1 dBi, 25 Ω',
      preset_long: 'Osam elemenata',
      preset_longHint: 'Šest direktora: 12,4 dBi, uži snop',
      preset_toolong: 'Predug direktor',
      preset_toolongHint: 'Isti direktor, ali 0,52 λ: snop se okreće natrag',

      legendWave: 'val sada (+ i −; prazno gdje se poništava)',
      legendPat: 'Yagi antena (dBi)',
      legendDipole: 'dipol λ/2',
      legendMain: 'glavni režanj',
      legendBar: 'ovaj broj direktora',

      mapTitle: 'Valovi odozgo',
      mapScale: 'λ',
      curTitle: 'Struja u sredini elementa, u odnosu na zračitelj',
      ePlane: 'Vodoravna ravnina (E)',
      hPlane: 'Okomita ravnina kroz nosač (H)',
      hPlaneBeam: 'Okomita ravnina kroz snop',
      ringDbi: '{v} dBi',
      fwdDir: 'naprijed',
      backDir: 'natrag',
      up: 'gore',
      barsTitle: 'Dobitak (dBi), 0 do 8 direktora',
      roleR: 'R',
      roleDE: 'Z',
      roleD: 'D{k}',
      ampVal: '{v}×',

      rowMain: 'glavni režanj',
      rowGain: 'dobitak',
      rowDbd: 'prema dipolu λ/2',
      rowFb: 'naprijed-natrag',
      rowBwE: 'kut otvora E',
      rowBwH: 'kut otvora H',
      rowZ: 'impedancija napajanja',
      rowAlone: 'sam zračitelj',
      rowBoom: 'duljina nosača',
      mainFwd: 'naprijed (0°)',
      mainBack: 'natrag (180°)',
      mainSide: '{v}, ukoso',
      dbi: '{v} dBi',
      dbd: '{v} dBd',
      dbVal: '{v} dB',
      fbNull: '∞ (nula)',
      none: '—',
      bwAll: 'svukrug',
      zVal: '{r} {s} j{x} Ω',
      units: 'Elementi su vodoravni, debljine 0,005 λ, okomiti na nosač; zračitelj je dug 0,475 λ, blizu rezonancije. Naprijed je prema direktorima (desno). Kut otvora na −3 dB. Bez gubitaka, pa je dobitak jednak usmjerenosti.',

      main_single: 'Napaja se samo zračitelj, dipol od {le}: zrači jednako naprijed i natrag, {dbi}, a impedancija napajanja mu je {z}. Dodaj reflektor ili direktor.',
      main_fwd: 'Napaja se samo zračitelj; njegovo polje inducira {ind}, a valovi se zbrajaju naprijed.',
      main_fwdR: 'Napaja se samo zračitelj; njegovo polje inducira struju u reflektoru, a valovi se zbrajaju naprijed, dalje od njega.',
      main_back: 'Napaja se samo zračitelj; njegovo polje inducira {ind}, ali valovi se zbrajaju natrag (180°).',
      main_side: 'Napaja se samo zračitelj; njegovo polje inducira {ind}, a valovi se najjače zbrajaju {main} od smjera naprijed, ukoso.',
      cur_refl: 'Reflektor ({len}, {tune}) nosi {amp} struje zračitelja, {rel}.',
      cur_dir1: 'Direktor ({len}, {tune}) nosi {amp} struje zračitelja, {rel}.',
      cur_both: 'Reflektor ({lenR}, {tuneR}) nosi {ampR} struje zračitelja, {relR}; direktor ({lenD}, {tuneD}) {ampD}, {relD}.',
      cur_dirsSlow: 'Duž direktora ({len}, {tune}) svaka struja kasni za prethodnom prosječno {step}, više od {free} vala na razmaku {sd}: uz nosač putuje val sporiji od svjetlosti.',
      cur_dirsFast: 'Duž direktora ({len}, {tune}) svaka struja kasni za prethodnom prosječno {step}, manje od {free} vala na razmaku {sd}.',
      indR: 'struju u reflektoru',
      indD: 'struju u direktoru',
      indMany: 'struje u ostalim elementima',
      cur_dirsMixed: 'Duž direktora ({len}, {tune}) struje ne kasne korak po korak: uz nosač ne putuje val prema naprijed.',
      more_dirsSigned: 'Prvi direktor mijenja dobitak za {firstS}, posljednji za {lastS}.',
      tuneLong: 'dulji od rezonantnog',
      tuneShort: 'kraći od rezonantnog',
      tuneRes: 'blizu rezonancije',
      relLead: '{v} ispred nje',
      relLag: '{v} iza nje',
      back_null: 'Na suprotnoj strani valovi se potpuno poništavaju: nula, omjer naprijed-natrag ∞.',
      back_strong: 'Na suprotnoj strani valovi se gotovo poništavaju: omjer naprijed-natrag {fb}.',
      back_mid: 'Na suprotnoj strani valovi se većim dijelom poništavaju: omjer naprijed-natrag {fb}.',
      back_weak: 'Na suprotnoj strani valovi se tek djelomično poništavaju: omjer naprijed-natrag samo {fb}.',
      gain_down: 'Dobitak {dbi} ({dbd}); sprega spušta impedanciju napajanja na {z} (sam zračitelj: {alone}).',
      gain_up: 'Dobitak {dbi} ({dbd}); sprega mijenja impedanciju napajanja u {z} (sam zračitelj: {alone}).',
      more_dirs: 'Prvi direktor dodao je {first}, posljednji {last}.',
      more_dirsLoss: 'Prvi direktor dodao je {first}, a posljednji je oduzeo {last}.',

      explain: '<p><b>Parazitni elementi.</b> Napaja se samo zračitelj. Reflektor i direktori obične su šipke bez kabela, ' +
        'ali polje zračitelja u njima inducira struje, pa i oni zrače. Koliko jaka i u kojoj fazi bude ta struja, ovisi o ' +
        'razmaku i o duljini elementa. Računa se metodom inducirane elektromotorne sile: svaki par elemenata ima ' +
        'međusobnu impedanciju Z, a na parazitnom elementu zbroj napona Σ Z·I koje u njemu induciraju struje svih ' +
        'elemenata, i njegove vlastite, mora biti nula.</p>' +
        '<p><b>Faza dolazi od duljine.</b> Element kraći od rezonantnog (oko 0,47 λ) kapacitivan je, dulji induktivan. ' +
        'Kako se element produljuje, njegova struja sve više kasni. Element čija struja kasni za zračiteljem povlači snop ' +
        'prema sebi (direktor), a element čija struja prednjači gura ga od sebe (reflektor), kao u nizu antena. Prijelaz ' +
        'je blizu rezonantne duljine, to kraće što je razmak veći. Zato je reflektor malo dulji, a direktori malo kraći: ' +
        'isti element ispred, ali predug, okreće snop natrag.</p>' +
        '<p><b>Više direktora.</b> Duž niza direktora struje kasnijom fazom prate val koji putuje uz nosač. Svaki novi ' +
        'direktor sužava snop i dodaje dobitak, ali sve manje: dvostruko dulji nosač daje otprilike 2 dB više. Jednaki ' +
        'direktori nisu najbolji za dugi nosač; prave antene direktore prema kraju skraćuju.</p>' +
        '<p><b>Impedancija napajanja.</b> Inducirane struje svojim poljem djeluju natrag na zračitelj, pa se njegova ' +
        'impedancija napajanja mijenja: s blisko postavljenim elementima padne s 63 do 73 Ω samog dipola na 20 do 30 Ω. ' +
        'Duljinom zračitelja (ovdje stalnih 0,475 λ) poništava se jalova komponenta. Najveći dobitak i najveći omjer naprijed-natrag ne postižu se ' +
        'istim razmacima i duljinama.</p>' +
        '<p><b>Pojednostavljeno.</b> Struja na svakom elementu ima sinusni oblik (metoda inducirane elektromotorne sile; ' +
        'točnija metoda momenata daje nešto manji dobitak); svi direktori jednaki; nema gubitaka, tla ni nosača; slika ' +
        'valova crta samo daleko polje i svjetlinu izjednačuje s udaljenošću.</p>' +
        '<p>Izvori: Balanis, <em>Antenna Theory</em>, pogl. 8 (vlastita i međusobna impedancija, metoda inducirane ' +
        'elektromotorne sile) i 10 (Yagi-Uda antena); Kraus, <em>Antennas</em>, pogl. o parazitnim elementima; ' +
        '50ohm, poglavlje o Yagi-Uda anteni.</p>'
    },
    en: {
      stage: 'A Yagi-Uda antenna: the waves from above, the currents in the elements, the radiation pattern in two planes, the readings and the gain against the number of directors',

      refl: 'Reflector',
      lr: 'Reflector length',
      sr: 'Reflector spacing',
      dirs: 'Directors',
      ld: 'Director length',
      sd: 'Director spacing',
      t: 'Time ωt',
      lamVal: '{v} λ',
      degVal: '{v}°',
      nVal: '{v}',

      play: 'Play',
      pause: 'Pause',
      playHint: 'The waves travel; time runs round one period',
      playKey: 'Play or pause the waves',
      keyFwd: 'Time forward by 15°',
      keyBack: 'Time back by 15°',
      tNow: 'ωt = {v}°',

      preset_dipole: 'Dipole alone',
      preset_dipoleHint: 'A 0.475 λ dipole: forward as strong as back',
      preset_reflector: 'Reflector',
      preset_reflectorHint: 'A longer element 0.15 λ behind: 6.5 dBi',
      preset_director: 'Director',
      preset_directorHint: 'A shorter element 0.1 λ in front: 6.3 dBi',
      preset_three: 'Three elements',
      preset_threeHint: 'Reflector, driven element, director: 8.1 dBi, 25 Ω',
      preset_long: 'Eight elements',
      preset_longHint: 'Six directors: 12.4 dBi, a narrower beam',
      preset_toolong: 'Too-long director',
      preset_toolongHint: 'The same director, but 0.52 λ: the beam turns back',

      legendWave: 'the wave now (+ and −; blank where it cancels)',
      legendPat: 'the Yagi (dBi)',
      legendDipole: 'a λ/2 dipole',
      legendMain: 'main lobe',
      legendBar: 'this many directors',

      mapTitle: 'The waves from above',
      mapScale: 'λ',
      curTitle: 'Current at each element\'s centre, relative to the driven one',
      ePlane: 'Horizontal plane (E)',
      hPlane: 'Vertical plane along the boom (H)',
      hPlaneBeam: 'Vertical plane through the beam',
      ringDbi: '{v} dBi',
      fwdDir: 'forward',
      backDir: 'back',
      up: 'up',
      barsTitle: 'Gain (dBi), 0 to 8 directors',
      roleR: 'R',
      roleDE: 'DE',
      roleD: 'D{k}',
      ampVal: '{v}×',

      rowMain: 'main lobe',
      rowGain: 'gain',
      rowDbd: 'over a λ/2 dipole',
      rowFb: 'front-to-back',
      rowBwE: 'beamwidth E',
      rowBwH: 'beamwidth H',
      rowZ: 'feed impedance',
      rowAlone: 'driven alone',
      rowBoom: 'boom length',
      mainFwd: 'forward (0°)',
      mainBack: 'backward (180°)',
      mainSide: '{v}, at a slant',
      dbi: '{v} dBi',
      dbd: '{v} dBd',
      dbVal: '{v} dB',
      fbNull: '∞ (a null)',
      none: '—',
      bwAll: 'all round',
      zVal: '{r} {s} j{x} Ω',
      units: 'The elements are horizontal, 0.005 λ thick, across the boom; the driven one is 0.475 λ, near resonance. Forward is towards the directors (right). Beamwidth at −3 dB. No losses, so the gain equals the directivity.',

      main_single: 'Only the driven element, a {le} dipole, is fed: it radiates forward as strongly as back, {dbi}, and its feed impedance is {z}. Add a reflector or a director.',
      main_fwd: 'Only the driven element is fed; its field induces {ind}, and the waves add forwards.',
      main_fwdR: 'Only the driven element is fed; its field induces the reflector\'s current, and the waves add forwards, away from it.',
      main_back: 'Only the driven element is fed; its field induces {ind}, but the waves add backwards (180°).',
      main_side: 'Only the driven element is fed; its field induces {ind}, and the waves add most {main} from forward, at a slant.',
      cur_refl: 'The reflector ({len}, {tune}) carries {amp} of the driven current, {rel}.',
      cur_dir1: 'The director ({len}, {tune}) carries {amp} of the driven current, {rel}.',
      cur_both: 'The reflector ({lenR}, {tuneR}) carries {ampR} of the driven current, {relR}; the director ({lenD}, {tuneD}) {ampD}, {relD}.',
      cur_dirsSlow: 'Along the directors ({len}, {tune}) each current lags the one before by {step} on average, more than the wave\'s own {free} over {sd}: a wave slower than light runs along the boom.',
      cur_dirsFast: 'Along the directors ({len}, {tune}) each current lags the one before by {step} on average, less than the wave\'s own {free} over {sd}.',
      indR: 'the reflector\'s current',
      indD: 'the director\'s current',
      indMany: 'the currents in the others',
      cur_dirsMixed: 'Along the directors ({len}, {tune}) the currents do not fall behind step by step: no wave runs forwards along the boom.',
      more_dirsSigned: 'The first director changes the gain by {firstS}, the last one by {lastS}.',
      tuneLong: 'longer than resonant',
      tuneShort: 'shorter than resonant',
      tuneRes: 'near resonance',
      relLead: '{v} ahead of it',
      relLag: '{v} behind it',
      back_null: 'On the opposite side the waves cancel completely: a null, front-to-back ∞.',
      back_strong: 'On the opposite side the waves almost cancel: front-to-back {fb}.',
      back_mid: 'On the opposite side the waves largely cancel: front-to-back {fb}.',
      back_weak: 'On the opposite side the waves cancel only in part: front-to-back just {fb}.',
      gain_down: 'Gain {dbi} ({dbd}); the coupling pulls the feed impedance down to {z} (driven element alone: {alone}).',
      gain_up: 'Gain {dbi} ({dbd}); the coupling changes the feed impedance to {z} (driven element alone: {alone}).',
      more_dirs: 'The first director added {first}, the last one {last}.',
      more_dirsLoss: 'The first director added {first}, but the last one took {last} away.',

      explain: '<p><b>Parasitic elements.</b> Only the driven element is fed. The reflector and the directors are plain rods ' +
        'with no cable, but the driven element\'s field induces currents in them, so they radiate too. How strong that ' +
        'current is, and in which phase, depends on the spacing and on the element\'s length. It is computed by the ' +
        'induced-EMF method: every pair of elements has a mutual impedance Z, and on a parasitic element the sum of the ' +
        'voltages Σ Z·I induced by the currents of all the elements, its own included, must be zero.</p>' +
        '<p><b>The phase comes from the length.</b> An element shorter than resonant (about 0.47 λ) is capacitive, a ' +
        'longer one inductive. As an element grows longer, its current lags more and more. An element whose current lags ' +
        'the driven one pulls the beam towards itself (a director); one whose current leads pushes it away (a reflector), ' +
        'as in an array. The switch comes near the resonant length, the shorter the wider the spacing. So the reflector is ' +
        'a little longer and the directors a little shorter: the same element in front, but too long, turns the beam ' +
        'back.</p>' +
        '<p><b>More directors.</b> Along a row of directors the currents follow, lagging step by step, a wave running ' +
        'along the boom. Each new director narrows the beam and adds gain, but less each time: a boom twice as long gives ' +
        'roughly 2 dB more. Equal directors are not the best for a long boom; real antennas shorten them towards the ' +
        'end.</p>' +
        '<p><b>Feed impedance.</b> The induced currents act back on the driven element through their fields, so its feed ' +
        'impedance changes: with close elements it falls from the 63 to 73 Ω of the dipole alone to 20 to 30 Ω. The ' +
        'driven element\'s length (fixed here at 0.475 λ) tunes out the reactance. The largest gain and the largest front-to-back ratio do not ' +
        'come from the same spacings and lengths.</p>' +
        '<p><b>Simplified.</b> The current on each element has the sinusoidal shape (the induced-EMF method; the more ' +
        'exact method of moments gives a somewhat lower gain); all directors are alike; no losses, no ground, no boom; the ' +
        'wave picture draws the far field only and evens out the brightness with distance.</p>' +
        '<p>Sources: Balanis, <em>Antenna Theory</em>, ch. 8 (self and mutual impedance, the induced-EMF method) and 10 ' +
        '(the Yagi-Uda antenna); Kraus, <em>Antennas</em>, the chapter on parasitic elements; 50ohm, the Yagi-Uda ' +
        'section.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
