/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of dipole-length, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept).
   Croatian terms: 50ohm-contents-hr where it has them (dijagram zračenja, izotropni zračitelj, dobitak, dBi, širina
   snopa na polovici snage, skraćene antene); the rest are marked (check) in NOTES.md. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dipol napajan u sredini: struja duž žice, dijagram zračenja i otpor',

      len: 'Duljina dipola L',
      lenVal: '{v} λ',
      t: 'Vrijeme ωt',
      tNow: 'ωt = {v}°',
      play: 'Pokreni',
      pause: 'Zaustavi',
      playHint: 'Struja titra, jedan period za 5 s',
      playKey: 'vrijeme teče / staje',
      keyFwd: 'vrijeme +15°',
      keyBack: 'vrijeme −15°',

      preset_short: 'Kratki dipol, 0,1 λ',
      preset_shortHint: 'Dijagram gotovo isti, otpor 2 Ω',
      preset_half: 'Poluvalni dipol, λ/2',
      preset_halfHint: 'Trbuh struje u sredini, 73 Ω, 2,15 dBi',
      preset_full: 'Punovalni dipol, λ',
      preset_fullHint: 'U sredini čvor struje: vrlo velik otpor',
      preset_ext: 'Produženi dipol, 1,25 λ',
      preset_extHint: 'Blizu najveće usmjerenosti, 5,2 dBi',
      preset_three: 'Tri poluvala, 3λ/2',
      preset_threeHint: 'Srednji dio obrnut: dijagram se cijepa',
      preset_two: 'Dvije valne duljine, 2 λ',
      preset_twoHint: 'Okomito na žicu nula',

      legendNow: 'struja sada',
      legendRev: 'obrnuta struja',
      legendEnv: 'stojni val struje',
      legendPattern: 'dijagram zračenja',
      legendIso: 'izotropni zračitelj iste snage',
      legendShort: 'kratki dipol',

      wireTitle: 'Struja duž žice',
      feedLabel: 'napajanje: {p}',
      feedZero: 'napajanje: 0',
      endZero: 'I = 0',
      crestLabel: 'trbuh',
      scaleHalf: 'λ/2',
      revLabel: 'obrnuto',

      patTitle: 'Dijagram zračenja u ravnini žice',
      patIso: 'izotropni',
      patAxis: 'žica',
      patMain: '{v} od žice',

      rowLen: 'duljina L',
      rowMetres: 'na 7,1 MHz',
      rowFeed: 'struja na napajanju / trbuh',
      rowRrad: 'otpor zračenja',
      rowRin: 'otpor na napajanju',
      rowD: 'usmjerenost D',
      rowMain: 'glavna latica od žice',
      rowBw: 'širina snopa (−3 dB)',
      lenCell: '{v} λ',
      metres: '{v} m',
      ohm: '{v} Ω',
      kohm: '{v} kΩ',
      ohmInf: '∞',
      ohmHuge: '> 10 kΩ',
      pctRev: '{p}, obrnuto',
      dCell: '{d} ({b})',
      dbi: '{v} dBi',
      deg: '{v}°',
      units: 'Tanka žica, sinusna struja. Struja u odnosu na trbuh stojnog vala; otpor zračenja prema najvećoj struji na žici.',

      plotTitle: 'Otpor prema duljini',
      seriesRad: 'otpor zračenja',
      seriesIn: 'na napajanju',
      seriesShort: '197·(L/λ)²',
      tickLen: '{v} λ',

      cur_short: 'Struja je stojni val s nulama na otvorenim krajevima. Trbuh ne stane na žicu kraću od λ/2: na napajanju struja je {feed} trbuha i pada do nule prema krajevima.',
      cur_half: 'Struja je stojni val s nulama na otvorenim krajevima. Na λ/2 napajanje je točno na trbuhu: struja je ondje najveća.',
      cur_mid: 'Trbusi su sada na žici, λ/4 od svakog kraja; napajanje klizi niz val, na {feed} trbuha.',
      cur_full: 'Napajanje je u čvoru stojnog vala: struja je ondje nula. Svaka polovina nosi cijeli poluval.',
      cur_rev: 'Svaka je polovina dulja od λ/2, pa srednjih {w}, između nula λ/2 od krajeva, nosi struju u suprotnom smjeru (šrafirano).',
      cur_revFeed: 'Na napajanju struja je {feed} trbuha.',
      cur_revZero: 'Napajanje je opet u čvoru.',
      pat_short: 'Dijagram je osmica okomito na žicu, s nulama uzduž nje: gotovo isti kao sin θ kratkog dipola, D = {dbi}, širina snopa {bw}.',
      pat_one: 'Dijagram je osmica okomito na žicu, s nulama uzduž nje, malo spljoštena: D = {dbi}, širina snopa {bw} (kratki dipol: 1,76 dBi, 90°).',
      pat_narrow: 'Polovine nose struju u istom smjeru, pa se polja zbrajaju okomito na žicu: osmica je sve uža, D = {dbi}, širina snopa {bw} (poluvalni dipol: 2,15 dBi, 78°).',
      pat_side: 'Snop okomito na žicu je sve uži: D = {dbi}, širina {bw}; obrnuta struja dodaje bočne latice, {side} slabije.',
      pat_split: 'Obrnuti dio cijepa dijagram u latice: najjača je {main} od žice, D = {dbi}; okomito na žicu polje je {bs} slabije.',
      pat_null: 'Obrnuti dio cijepa dijagram u latice: najjača je {main} od žice, D = {dbi}; okomito na žicu je nula, jer polje obrnutog srednjeg dijela točno poništava polje vanjskih dijelova.',
      res_short: 'Otpor zračenja je samo {r} (formula kratkog dipola 197·(L/λ)² daje {rs}): ista struja na napajanju zrači {pct} snage poluvalnog dipola.',
      res_loss: 'Zato i mali otpor gubitaka u žici, zavojnici ili tlu odnosi velik dio snage.',
      res_mid: 'Otpor zračenja na napajanju je {r} i približava se 73 Ω poluvalnog dipola; formula kratkog dipola (197·(L/λ)² = {rs}) ovdje više ne vrijedi.',
      res_high: 'Otpor zračenja je {r} (prema trbuhu); napajanje je blizu čvora struje, pa je otpor na napajanju velik: {rin} u modelu tanke žice, manje na stvarnoj žici.',
      res_half: 'Otpor zračenja na napajanju je {r}, blizu impedancije uobičajenih vodova.',
      res_long: 'Otpor zračenja je {r} (prema trbuhu); na napajanju je struja manja, pa je otpor ondje veći: {rin}.',
      res_crest: 'Otpor zračenja je {r}; napajanje je opet na trbuhu, pa je i otpor na napajanju {rin}.',
      res_open: 'Otpor zračenja je {r} (prema trbuhu), ali na napajanju je struja (gotovo) nula, pa je otpor ondje vrlo velik: {rin} u modelu tanke žice, nekoliko kΩ na stvarnoj žici.',

      explain: '<p><b>Stojni val struje.</b> Na otvorenom kraju žice struja ne može teći dalje, pa je ondje nula. Val struje koji ide prema kraju ' +
        'odbija se i s dolaznim tvori stojni val: nule (čvorovi) su svakih λ/2 od kraja, trbusi između njih. Dipol napajan u sredini dio je ' +
        'tog vala, odrezan na duljinu L; napajanje je ondje gdje ga rez zatekne.</p>' +
        '<p><b>Kratki dipol.</b> Kraći od λ/2, dipol ne obuhvaća trbuh: struja pada od napajanja do krajeva gotovo pravocrtno (trokut). ' +
        'Dijagram se jedva mijenja (sin θ, 1,76 dBi prema 2,15 dBi), ali otpor zračenja pada s kvadratom duljine, oko 197·(L/λ)² Ω: ' +
        'pri 0,1 λ to su 2 Ω. Ista struja zrači mnogo manje snage, a otpor gubitaka u žici, zavojnici ili tlu odnosi sve veći dio. ' +
        'Česta brojka 790·(L/λ)² Ω vrijedi za jednoliku struju (Hertzov dipol, npr. s kapacitivnim šeširima na krajevima): četiri puta više, ' +
        'jer je prosjek trokuta pola vrha.</p>' +
        '<p><b>Poluvalni dipol.</b> Na λ/2 napajanje je na trbuhu: 73 Ω, 2,15 dBi, širina snopa 78°. Stvarni se dipol reže nekoliko posto ' +
        'kraće (debljina žice, krajevi), da mu reaktancija bude nula; to ovaj model tanke žice ne prikazuje.</p>' +
        '<p><b>Dulje.</b> Na λ napajanje je u čvoru: otpor na napajanju vrlo je velik, iako antena dobro zrači (199 Ω prema trbuhu); polovine ' +
        'i dalje nose struju u istom smjeru, pa se polja zbrajaju okomito na žicu i snop se suzuje (3,8 dBi). Preko λ dio struje teče obrnuto. ' +
        'Do oko 1,4 λ to samo dodaje male bočne latice uz sve uži snop okomito na žicu (najveća usmjerenost, 5,2 dBi, oko 1,27 λ); na 3λ/2 obrnuti dio okomito na žicu poništava dio polja ' +
        'i najjače latice nagnu se prema žici.</p>' +
        '<p>Izvori: Balanis, <em>Antenna Theory</em>, pogl. 4 (4.5–4.6); Kraus, <em>Antennas</em>, pogl. o tankim linearnim antenama.</p>'
    },
    en: {
      stage: 'A centre-fed dipole: the current along the wire, the radiation pattern and the resistance',

      len: 'Dipole length L',
      lenVal: '{v} λ',
      t: 'Time ωt',
      tNow: 'ωt = {v}°',
      play: 'Play',
      pause: 'Pause',
      playHint: 'The current swings, one period in 5 s',
      playKey: 'time runs / stops',
      keyFwd: 'time +15°',
      keyBack: 'time −15°',

      preset_short: 'Short dipole, 0.1 λ',
      preset_shortHint: 'Pattern almost the same, resistance 2 Ω',
      preset_half: 'Half-wave dipole, λ/2',
      preset_halfHint: 'Current crest at the feed, 73 Ω, 2.15 dBi',
      preset_full: 'Full-wave dipole, λ',
      preset_fullHint: 'A current zero at the feed: very high resistance',
      preset_ext: 'Extended dipole, 1.25 λ',
      preset_extHint: 'Near the highest directivity, 5.2 dBi',
      preset_three: 'Three half-waves, 3λ/2',
      preset_threeHint: 'The middle reversed: the pattern splits',
      preset_two: 'Two wavelengths, 2 λ',
      preset_twoHint: 'A null broadside',

      legendNow: 'current now',
      legendRev: 'reversed current',
      legendEnv: 'standing wave of current',
      legendPattern: 'radiation pattern',
      legendIso: 'isotropic radiator, same power',
      legendShort: 'short dipole',

      wireTitle: 'Current along the wire',
      feedLabel: 'feed: {p}',
      feedZero: 'feed: 0',
      endZero: 'I = 0',
      crestLabel: 'crest',
      scaleHalf: 'λ/2',
      revLabel: 'reversed',

      patTitle: 'Pattern in the plane through the wire',
      patIso: 'isotropic',
      patAxis: 'wire',
      patMain: '{v} from the wire',

      rowLen: 'length L',
      rowMetres: 'at 7.1 MHz',
      rowFeed: 'current at the feed / crest',
      rowRrad: 'radiation resistance',
      rowRin: 'feed resistance',
      rowD: 'directivity D',
      rowMain: 'main lobe from the wire',
      rowBw: 'beamwidth (−3 dB)',
      lenCell: '{v} λ',
      metres: '{v} m',
      ohm: '{v} Ω',
      kohm: '{v} kΩ',
      ohmInf: '∞',
      ohmHuge: '> 10 kΩ',
      pctRev: '{p}, reversed',
      dCell: '{d} ({b})',
      dbi: '{v} dBi',
      deg: '{v}°',
      units: 'Thin wire, sinusoidal current. Current against the crest of the standing wave; radiation resistance against the largest current on the wire.',

      plotTitle: 'Resistance against length',
      seriesRad: 'radiation resistance',
      seriesIn: 'at the feed',
      seriesShort: '197·(L/λ)²',
      tickLen: '{v} λ',

      cur_short: 'The current is a standing wave, zero at the open ends. On a wire shorter than λ/2 the crest does not fit: at the feed the current is {feed} of the crest and falls to zero towards the ends.',
      cur_half: 'The current is a standing wave, zero at the open ends. At λ/2 the feed sits exactly at the crest: the current there is at its maximum.',
      cur_mid: 'The crests now lie on the wire, λ/4 from each end; the feed slides down the wave, to {feed} of the crest.',
      cur_full: 'The feed sits at a zero of the standing wave: no current there. Each half carries a whole half wave.',
      cur_rev: 'Each half is longer than λ/2, so the middle {w}, between the zeros λ/2 from each end, carries current the other way (hatched).',
      cur_revFeed: 'At the feed the current is {feed} of the crest.',
      cur_revZero: 'The feed sits at a zero again.',
      pat_short: 'The pattern is a figure eight across the wire, with nulls along it: almost the short dipole\'s sin θ, D = {dbi}, beamwidth {bw}.',
      pat_one: 'The pattern is a figure eight across the wire, with nulls along it, a little flattened: D = {dbi}, beamwidth {bw} (a short dipole: 1.76 dBi, 90°).',
      pat_narrow: 'The halves carry current the same way, so their fields add broadside: the figure eight narrows, D = {dbi}, beamwidth {bw} (a half-wave dipole: 2.15 dBi, 78°).',
      pat_side: 'The broadside beam keeps narrowing: D = {dbi}, beamwidth {bw}; the reversed current adds side lobes, {side} down.',
      pat_split: 'The reversed segment splits the pattern into lobes: the strongest at {main} from the wire, D = {dbi}; broadside the field is {bs} down.',
      pat_null: 'The reversed segment splits the pattern into lobes: the strongest at {main} from the wire, D = {dbi}; broadside there is a null, as the reversed middle\'s field exactly cancels the outer segments\'.',
      res_short: 'The radiation resistance is only {r} (the short-dipole formula 197·(L/λ)² gives {rs}): the same feed current radiates {pct} of a half-wave dipole\'s power.',
      res_loss: 'So even a small loss resistance in the wire, a coil or the ground takes a large share of the power.',
      res_mid: 'The radiation resistance at the feed is {r}, approaching the half-wave dipole\'s 73 Ω; the short-dipole formula (197·(L/λ)² = {rs}) no longer holds here.',
      res_high: 'The radiation resistance is {r} (against the crest); the feed is near a current zero, so the feed resistance is high: {rin} in the thin-wire model, less on a real wire.',
      res_half: 'The radiation resistance at the feed is {r}, close to the impedance of common feed lines.',
      res_long: 'The radiation resistance is {r} (against the crest); at the feed the current is smaller, so the resistance there is larger: {rin}.',
      res_crest: 'The radiation resistance is {r}; the feed sits at a crest again, so the feed resistance is {rin} too.',
      res_open: 'The radiation resistance is {r} (against the crest), but at the feed the current is (almost) zero, so the resistance there is very high: {rin} in the thin-wire model, some kΩ on a real wire.',

      explain: '<p><b>A standing wave of current.</b> At an open end the current cannot flow on, so it is zero there. The current wave running ' +
        'towards the end reflects and makes a standing wave with the incoming one: zeros (nodes) every λ/2 from the end, crests between ' +
        'them. A centre-fed dipole is a piece of that wave cut to length L; the feed is wherever the cut leaves it.</p>' +
        '<p><b>The short dipole.</b> Shorter than λ/2, the dipole holds no crest: the current falls from the feed to the ends almost in a ' +
        'straight line (a triangle). The pattern hardly changes (sin θ, 1.76 dBi against 2.15 dBi), but the radiation resistance falls with ' +
        'the square of the length, about 197·(L/λ)² Ω: 2 Ω at 0.1 λ. The same current radiates far less power, and the loss resistance of ' +
        'the wire, a coil or the ground takes a growing share. The often quoted 790·(L/λ)² Ω is for a uniform current (a Hertzian dipole, ' +
        'e.g. with capacitive hats at the ends): four times as much, because a triangle\'s average is half its peak.</p>' +
        '<p><b>The half-wave dipole.</b> At λ/2 the feed sits at the crest: 73 Ω, 2.15 dBi, a 78° beamwidth. A real dipole is cut a few ' +
        'per cent shorter (the wire\'s thickness, the ends) to make its reactance zero; this thin-wire model does not show that.</p>' +
        '<p><b>Longer.</b> At λ the feed is at a zero: the feed resistance is very high although the antenna radiates well (199 Ω against ' +
        'the crest); the halves still carry current the same way, so their fields add broadside and the beam narrows (3.8 dBi). Beyond λ ' +
        'part of the current flows the other way. Up to about 1.4 λ that only adds small side lobes beside a still narrowing broadside beam (the highest directivity, 5.2 dBi, is near 1.27 λ); ' +
        'at 3λ/2 the reversed segment cancels part of the broadside field and the strongest lobes slant towards the wire.</p>' +
        '<p>Sources: Balanis, <em>Antenna Theory</em>, ch. 4 (4.5–4.6); Kraus, <em>Antennas</em>, the chapter on thin linear antennas.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
