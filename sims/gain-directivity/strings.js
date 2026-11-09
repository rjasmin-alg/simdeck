/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of gain-directivity, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept).
   Croatian terms: 50ohm-contents-hr where it has them (izotropni zračitelj, dobitak, dBi, dBd, EIRP, ERP, dijagram
   zračenja, širina snopa na polovici snage, omjer naprijed-natrag); the rest are marked (check) in NOTES.md. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dijagram zračenja u dvije ravnine, dobitak i snaga od odašiljača do EIRP i ERP',

      hbw: 'Vodoravni snop',
      vbw: 'Okomiti snop',
      fb: 'Stražnja latica',
      sll: 'Bočne latice',
      eff: 'Učinkovitost η',
      cable: 'Kabel',
      ptx: 'Snaga odašiljača',
      scale: 'Mjerilo dijagrama',
      scaleField: 'polje',
      scalePower: 'snaga',
      scaleDb: 'dB',
      degVal: '{v}°',
      dbDown: '−{v} dB',
      dbVal: '{v} dB',
      pctVal: '{v} %',
      watt: '{v} W',
      mwatt: '{v} mW',

      preset_iso: 'Izotropni',
      preset_isoHint: 'Mjerilo za dBi: D = 1',
      preset_collinear: 'Stisnut okomito',
      preset_collinearHint: 'Svuda okolo jači od dipola: 4,5 dBi',
      preset_beam: 'Usmjerena',
      preset_beamHint: '8,4 dBi; čitanje dijagrama u dB',
      preset_whip: 'Kratka, s gubicima',
      preset_whipHint: 'Usmjerenost 1,76 dBi, dobitak −8,2 dBi',
      preset_dish: 'Velika, 10 W',
      preset_dishHint: '20 dBi: EIRP kao 100 W u maloj anteni',

      legendGain: 'dobitak u svakom smjeru',
      legendDir: 'bez gubitaka (usmjerenost)',
      legendIso: 'izotropni zračitelj',
      legendDipole: 'poluvalni dipol',
      legendHalf: 'pola snage (−3 dB)',

      hTitle: 'Vodoravna ravnina, odozgo',
      vTitle: 'Okomita ravnina, sa strane',
      front: 'naprijed',
      back: 'natrag',
      up: 'gore',
      ringX: '{v}×',
      ringDbi: '{v} dBi',
      fbLabel: 'F/B {v}',
      sideLabel: '{v}',

      rowD: 'usmjerenost D',
      rowG: 'dobitak G = η·D',
      rowBw: 'širina snopa (−3 dB)',
      rowFb: 'omjer naprijed-natrag',
      rowSide: 'bočne latice',
      dCell: '{d} = {b}',
      gCell: '{a} = {b}',
      bwCell: '{h} vodoravno, {v} okomito',
      bwAll: 'svuda',
      bwFlat: 'nestisnuto',
      none: '—',
      dbi: '{v} dBi',
      dbd: '{v} dBd',
      units: 'Dobitak u odnosu na izotropni zračitelj iste dovedene snage; crtkano: poluvalni dipol (2,15 dBi).',

      ladTitle: 'Snaga od odašiljača do EIRP i ERP',
      ladTx: 'odašiljač',
      ladCable: 'kabel',
      ladLoss: 'gubici u anteni',
      ladRad: 'izračeno (isto za svaki oblik)',
      ladGain: 'usmjerenost D',
      ladEirp: 'EIRP',
      ladDip: 'prema dipolu',
      ladErp: 'ERP',
      ladLevel: '{db} dBW = {w}',
      ladStep: '{v} dB',
      dbwTick: 'dBW',

      shape_iso: 'Izotropni zračitelj šalje jednako u svakom smjeru: D = 1, {dbi}. Takvu antenu nije moguće izraditi, ali ona je mjerilo za dBi. Poluvalni dipol (crtkano) uzima snagu odozgo i odozdo i stavlja je na obzor: ondje je 2,15 dB jači.',
      shape_omni: 'Stisnut samo odozgo i odozdo, dijagram je i dalje jednak svuda okolo, ali na obzoru je sada {d} puta jači od prosjeka po kugli: {dbi}, {dbd}. Ta je snaga došla odozgo, gdje je sada nula.',
      shape_omniLow: 'Stisnut samo odozgo i odozdo, dijagram je svuda okolo {d} puta jači od prosjeka po kugli: {dbi}. To je još manje od poluvalnog dipola: {dbd}.',
      shape_beam: 'Najjači smjer je {d} puta jači od prosjeka po cijeloj kugli: usmjerenost {dbi}. Antena ne dodaje snagu: ista {prad} odlazi za svaki oblik, stisnuti dijagram samo je šalje više naprijed.',
      shape_bidir: 'Prednja i stražnja latica jednako su jake: dvosmjerni dijagram, {dbi}. Pola snage odlazi natrag.',
      shape_broad: 'Prednja i stražnja latica zajedno pokrivaju sve okolo: ni u jednom smjeru snaga ne pada na pola. Usmjerenost je samo {dbi}.',
      shape_broadFb: 'Glavna latica je toliko široka da i iza antene ima još dosta snage: omjer naprijed-natrag samo je {fb}.',
      loss_some: 'Antena gubi dio snage (žica, zavojnica, tlo): izrači se samo {eff} dovedene, pa je dobitak G = η·D = {gdbi}.',
      loss_below: 'Antena izrači samo {eff} dovedene snage, ostalo grije žicu, zavojnicu i tlo: dobitak G = η·D = {gdbi}, manji i od izotropnog zračitelja.',
      cable_some: 'Kabel uzima {cable}: do antene stiže {pant} od {ptx}.',
      eirp: 'EIRP = snaga odašiljača − gubitak u kabelu + dobitak u dBi = {eirp}; ERP se mjeri prema dipolu, 2,15 dB manje: {erp}.',
      scale_field: 'U linearnom mjerilu polja bočna latica na {side} ima {pct} polja glavne latice.',
      scale_power: 'U linearnom mjerilu snage bočna latica na {side} ima samo {pct} snage glavne latice: gotovo se ne vidi.',
      scale_db: 'U dB vide se i stražnja latica ({fb} slabija) i bočne latice ({side}).',
      scale_dbNoSide: 'U dB vidi se i stražnja latica, {fb} slabija od glavne.',
      scale_dbTail: 'U dB vidi se i što glavna latica šalje natrag, {fb} slabije od naprijed.',
      scale_dbFloor: 'Gubici su sve spustili: i u dB stražnja i bočne latice ovdje su ispod dna dijagrama ({floor}).',

      explain: '<p><b>Usmjerenost.</b> Antena ne stvara snagu: koliko joj se dovede (manje gubici), toliko ode kroz kuglu oko nje. ' +
        'Izotropni zračitelj tu snagu dijeli jednako na sve smjerove. Usmjerenost D kaže koliko je najjači smjer jači od tog prosjeka: ' +
        'D = 4π·U<sub>max</sub> / P<sub>izračeno</sub>. Stisnuti dijagram (uža latica) znači veći D, a ukupna snaga ostaje ista.</p>' +
        '<p><b>Dobitak.</b> G = η·D: učinkovitost η je udio dovedene snage koji se izrači; ostatak grije žicu, zavojnicu ili tlo. ' +
        'Kratka antena može imati usmjerenost 1,76 dBi, a dobitak −8 dBi.</p>' +
        '<p><b>dBi i dBd.</b> dBi se mjeri prema izotropnom zračitelju, dBd prema poluvalnom dipolu, koji je sam 2,15 dBi: ' +
        'dBd = dBi − 2,15. Ista antena u dBd izgleda 2,15 dB slabije.</p>' +
        '<p><b>EIRP i ERP.</b> EIRP = P<sub>odašiljača</sub> − gubitak u kabelu + G (dBi): snaga koju bi izotropni zračitelj trebao ' +
        'izračiti da bi u glavnom smjeru dao isto polje. ERP je isto prema dipolu, s G u dBd: ERP = EIRP − 2,15 dB. U dB se sve zbraja; ' +
        '100 W je 20 dBW (50 dBm), 3 dB je pola snage.</p>' +
        '<p><b>Čitanje dijagrama.</b> Glavna latica je najjači smjer; širina snopa je kut između smjerova gdje snaga padne na pola ' +
        '(−3 dB); omjer naprijed-natrag uspoređuje glavnu i stražnju laticu; bočne latice su manji vrhovi sa strane. U linearnom ' +
        'mjerilu latica 20 dB slabija ima 10 % polja i 1 % snage, pa se jedva vidi; u dB jasno se vidi. Gruba provjera: ' +
        'D ≈ 41 000 / (širina vodoravno × širina okomito), u stupnjevima.</p>' +
        '<p><b>Ovdje.</b> Dijagram se oblikuje rukom (širine, stražnja i bočne latice); kako ga struje u više elemenata stvaraju, ' +
        'pokazuju stranice o antenskim nizovima i Yagi anteni. Usmjerenost se računa integracijom oblika po kugli; dipol je stvarni ' +
        'poluvalni dipol tanke žice.</p>' +
        '<p>Izvori: Balanis, <em>Antenna Theory</em>, pogl. 2 (usmjerenost, dobitak, učinkovitost) i 4.6 (poluvalni dipol); ' +
        'Kraus, <em>Antennas</em>, pogl. o usmjerenosti.</p>'
    },
    en: {
      stage: 'The radiation pattern in two planes, the gain, and the power from the transmitter to EIRP and ERP',

      hbw: 'Horizontal beam',
      vbw: 'Vertical beam',
      fb: 'Back lobe',
      sll: 'Side lobes',
      eff: 'Efficiency η',
      cable: 'Cable loss',
      ptx: 'Transmitter power',
      scale: 'Pattern scale',
      scaleField: 'field',
      scalePower: 'power',
      scaleDb: 'dB',
      degVal: '{v}°',
      dbDown: '−{v} dB',
      dbVal: '{v} dB',
      pctVal: '{v} %',
      watt: '{v} W',
      mwatt: '{v} mW',

      preset_iso: 'Isotropic',
      preset_isoHint: 'The yardstick for dBi: D = 1',
      preset_collinear: 'Squeezed vertically',
      preset_collinearHint: 'Stronger than the dipole all round: 4.5 dBi',
      preset_beam: 'A small beam',
      preset_beamHint: '8.4 dBi; reading the pattern in dB',
      preset_whip: 'Short and lossy',
      preset_whipHint: 'Directivity 1.76 dBi, gain −8.2 dBi',
      preset_dish: 'A large beam, 10 W',
      preset_dishHint: '20 dBi: the EIRP of 100 W in the small beam',

      legendGain: 'gain in each direction',
      legendDir: 'without losses (directivity)',
      legendIso: 'isotropic radiator',
      legendDipole: 'half-wave dipole',
      legendHalf: 'half power (−3 dB)',

      hTitle: 'Horizontal plane, from above',
      vTitle: 'Vertical plane, from the side',
      front: 'front',
      back: 'back',
      up: 'up',
      ringX: '{v}×',
      ringDbi: '{v} dBi',
      fbLabel: 'F/B {v}',
      sideLabel: '{v}',

      rowD: 'directivity D',
      rowG: 'gain G = η·D',
      rowBw: 'beamwidth (−3 dB)',
      rowFb: 'front-to-back ratio',
      rowSide: 'side lobes',
      dCell: '{d} = {b}',
      gCell: '{a} = {b}',
      bwCell: '{h} horizontal, {v} vertical',
      bwAll: 'all round',
      bwFlat: 'not squeezed',
      none: '—',
      dbi: '{v} dBi',
      dbd: '{v} dBd',
      units: 'Gain against an isotropic radiator fed the same power; dashed: a half-wave dipole (2.15 dBi).',

      ladTitle: 'Power from the transmitter to EIRP and ERP',
      ladTx: 'transmitter',
      ladCable: 'cable',
      ladLoss: 'losses in the antenna',
      ladRad: 'radiated (same for any shape)',
      ladGain: 'directivity D',
      ladEirp: 'EIRP',
      ladDip: 'against the dipole',
      ladErp: 'ERP',
      ladLevel: '{db} dBW = {w}',
      ladStep: '{v} dB',
      dbwTick: 'dBW',

      shape_iso: 'The isotropic radiator sends the same in every direction: D = 1, {dbi}. It cannot be built, but it is the yardstick for dBi. The half-wave dipole (dashed) takes power from above and below and puts it on the horizon: 2.15 dB stronger there.',
      shape_omni: 'Squeezed only from above and below, the pattern is still the same all round, but on the horizon it is now {d} times the average over the sphere: {dbi}, {dbd}. That power came from overhead, where there is now a null.',
      shape_omniLow: 'Squeezed only from above and below, the pattern is {d} times the average over the sphere all round: {dbi}. That is still less than a half-wave dipole: {dbd}.',
      shape_beam: 'The strongest direction is {d} times the average over the whole sphere: a directivity of {dbi}. The antenna adds no power: the same {prad} leaves for every shape; squeezing only sends more of it forwards.',
      shape_bidir: 'The front and back lobes are equally strong: a bidirectional pattern, {dbi}. Half the power goes backwards.',
      shape_broad: 'The front and back lobes together cover all round: in no direction does the power fall to half. The directivity is only {dbi}.',
      shape_broadFb: 'The main lobe is so broad that its own tail still reaches the back: the front-to-back ratio is only {fb}.',
      loss_some: 'The antenna loses part of the power (the wire, a coil, the ground): only {eff} of what reaches it is radiated, so the gain is G = η·D = {gdbi}.',
      loss_below: 'The antenna radiates only {eff} of the power that reaches it; the rest heats the wire, the coil and the ground: the gain G = η·D = {gdbi} is below even the isotropic radiator.',
      cable_some: 'The cable takes {cable}: {pant} of {ptx} reaches the antenna.',
      eirp: 'EIRP = transmitter power − cable loss + gain in dBi = {eirp}; ERP counts from the dipole, 2.15 dB less: {erp}.',
      scale_field: 'On the linear field scale a side lobe at {side} has {pct} of the main lobe\'s field.',
      scale_power: 'On the linear power scale a side lobe at {side} has only {pct} of the main lobe\'s power: almost invisible.',
      scale_db: 'In dB the back lobe ({fb} down) and the side lobes ({side}) both show.',
      scale_dbNoSide: 'In dB the back lobe shows too, {fb} below the main lobe.',
      scale_dbTail: 'In dB what the main lobe sends backwards shows too, {fb} below the front.',
      scale_dbFloor: 'The losses pulled everything down: even in dB the back and side lobes are below the plot\'s floor ({floor}) here.',

      explain: '<p><b>Directivity.</b> An antenna makes no power: what reaches it (less the losses) leaves through the sphere ' +
        'around it. An isotropic radiator shares that power equally over all directions. Directivity D says how much stronger the ' +
        'strongest direction is than that average: D = 4π·U<sub>max</sub> / P<sub>rad</sub>. A squeezed pattern (a narrower lobe) ' +
        'means a larger D, while the total stays the same.</p>' +
        '<p><b>Gain.</b> G = η·D: the efficiency η is the share of the power reaching the antenna that is radiated; the rest heats ' +
        'the wire, a coil or the ground. A short antenna can have a directivity of 1.76 dBi and a gain of −8 dBi.</p>' +
        '<p><b>dBi and dBd.</b> dBi counts from the isotropic radiator, dBd from a half-wave dipole, which is itself 2.15 dBi: ' +
        'dBd = dBi − 2.15. The same antenna looks 2.15 dB weaker in dBd.</p>' +
        '<p><b>EIRP and ERP.</b> EIRP = P<sub>tx</sub> − cable loss + G (dBi): the power an isotropic radiator would need to give ' +
        'the same field in the main direction. ERP is the same against the dipole, with G in dBd: ERP = EIRP − 2.15 dB. In dB ' +
        'everything adds up; 100 W is 20 dBW (50 dBm), 3 dB is half the power.</p>' +
        '<p><b>Reading a pattern.</b> The main lobe is the strongest direction; the beamwidth is the angle between the directions ' +
        'where the power falls to half (−3 dB); the front-to-back ratio compares the main lobe with the back lobe; side lobes are ' +
        'the smaller peaks to the side. On a linear scale a lobe 20 dB down has 10 % of the field and 1 % of the power, so it ' +
        'hardly shows; in dB it shows clearly. A rough check: D ≈ 41 000 / (horizontal × vertical beamwidth), in degrees.</p>' +
        '<p><b>Here.</b> The pattern is shaped by hand (the widths, a back lobe and side lobes); how the currents in several ' +
        'elements make it is on the pages about antenna arrays and the Yagi. The directivity is computed by integrating the shape ' +
        'over the sphere; the dipole is a real thin-wire half-wave dipole.</p>' +
        '<p>Sources: Balanis, <em>Antenna Theory</em>, ch. 2 (directivity, gain, efficiency) and 4.6 (the half-wave dipole); ' +
        'Kraus, <em>Antennas</em>, the chapter on directivity.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
