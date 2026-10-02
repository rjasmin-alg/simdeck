/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the hardware side-effects page, in both languages (docs/sim-ui.md §9). Same keys in hr and
   en; the page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array
   is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term. The title and subtitle come from
   sim.json (title, concept). English terms missing from the glossary are written out (NOTES.md, "Term pairs"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Žrtva i drugi program na istom računalu',
      speed: 'Optimizacija za brzinu',
      speedHint: 'Više rada unaprijed, dijeljenja i predmemoriranja',
      density: 'Optimizacija za prostor',
      densityHint: 'Gušći čip: manje ćelije, retci bliže',
      mitigate: 'Zaštite (sklopovlje, OS, prevoditelj)',
      mitigateHint: 'Manja šansa, ali sporije i skuplje',
      trust: 'Ostali kod na računalu',
      trustHostile: 'može biti zlonamjeran',
      trustTrusted: 'sav je pouzdan',

      presetSafe: 'Sve isključeno',
      presetSafeHint: 'Sigurno, ali sporo, veliko i skupo',
      presetSpeed: 'Samo brzina',
      presetSpeedHint: 'Rad unaprijed na najvišoj razini: tragovi u predmemoriji',
      presetSpace: 'Samo prostor',
      presetSpaceHint: 'Najgušći čip: smetnja u susjednom retku',
      presetBoth: 'Oboje na maksimumu',
      presetBothHint: 'Najbrže i najmanje, najveća šansa curenja',
      presetMitigated: 'Oboje + zaštite',
      presetMitigatedHint: 'Manja šansa, plaćena vremenom i energijom',
      presetTrusted: 'Sav kod pouzdan',
      presetTrustedHint: 'Isti tragovi, ali nikome ne koriste: zaključak',

      legendOne: 'tajni bit 1',
      legendZero: 'bit 0',
      legendTrace: 'trag tajnog bita',

      checkResult: 'Rezultat žrtve: ispravan',
      checkSoftware: 'Sve programske provjere: prolaze',
      checkHardware: 'Sklopovlje: radi po specifikaciji',
      otherSees: 'Drugi program vidi {k} od {n} tajnih bitova',

      axisSpeed: 'Brzina → trag koji preživi poništavanje',
      exampleSpeed: 'stvarni primjer: Spectre, Meltdown',
      axisSpace: 'Prostor → smetnja u susjednom retku',
      exampleSpace: 'stvarni primjer: Rowhammer',
      rowSecret: 'tajni podaci žrtve',
      rowCache: 'dijeljena predmemorija: topla nakon poništavanja',
      rowVictim: 'redak žrtve u memoriji',
      rowNeighbour: 'susjedni redak drugog programa',
      ahead: 'rad unaprijed: {n} od {max}, rezultati poništeni',
      aheadNone: 'nema rada unaprijed',
      spacing: 'razmak redaka: {v} %',
      perBit: 'šansa po bitu',
      traces: 'tragovi',
      curveX: 'razina',

      meter: 'Šansa za curenje (bilo koja vrsta)',
      riskHostile: 'Rizik: {p}, jer neki kod može biti zlonamjeran',
      riskTrusted: 'Rizik: 0 %, jer je sav kod pouzdan',
      illustrative: 'ilustrativni model, nije izmjeren',
      costHead: 'Cijena (1× = oboje na maksimumu, bez zaštita)',
      costTime: 'vrijeme po zadatku',
      costArea: 'površina čipa',
      costEnergy: 'energija po zadatku',

      limitsHead: 'Granice brzine i veličine',
      limitLight: 'brzina svjetlosti, širenje signala',
      limitHeat: 'toplina, gustoća snage',
      limitQuantum: 'kvantni efekti, curenje struje',
      limitAtoms: 'veličina atoma',
      limitTrust: 'povjerenje: netko može biti zlonamjeran',
      physical: 'fizička',
      notPhysical: 'nije fizička',

      captionSafe: 'Obje optimizacije isključene: nema traga, ali zadatak traje {time} dulje, čip je {area} veći i troši {energy} više energije.',
      captionLeak: 'Rezultat žrtve je ispravan i sve provjere prolaze, a ipak tajni bitovi ostavljaju tragove: {ts} kroz brzinu, {td} kroz prostor.',
      captionChance: 'Ilustrativna šansa za curenje: {p}.',
      captionNoTrace: 'Šansa za curenje je {p}, ali još nijedan tajni bit nije ostavio trag.',
      captionMit: 'Zaštite je smanjuju, a zadatak traje {time} dulje.',
      captionHostile: 'Sklopovlje i programi rade ispravno; optimizaciju koči samo to što drugi kod može biti zlonamjeran.',
      captionTrusted: 'Sav kod je pouzdan: isti tragovi nikome ne koriste, pa je puna optimizacija sigurna.',
      quote: 'Sve ostale granice brzine su fizičke. Ova je granica povjerenja.',

      explain:
        '<h3>Pitanje</h3>' +
        '<p>Kako napad može uspjeti na računalu čije sklopovlje radi ispravno i čiji programi rade ispravno, a da ništa u programima to ne može primijetiti?</p>' +
        '<h3>Odgovor</h3>' +
        '<p>Napad živi u nuspojavama između dijelova od kojih svaki radi po specifikaciji. Specifikacija kaže kakav je rezultat, ali ne i što ' +
        'usput ostaje u dijeljenom stanju: u [[cache]] ili u susjednim retcima memorije. Programska provjera vidi samo rezultat, a on je ispravan. ' +
        'Drugi program, koji dijeli isto sklopovlje, vidi trag i iz njega zaključuje nešto o tajni. Ovo je <em lang="en">side channel</em> (sporedni kanal).</p>' +
        '<h3>Brzina → trag (Spectre)</h3>' +
        '<p>Brz procesor radi unaprijed, prije nego što zna treba li mu taj rad (<em lang="en">speculative execution</em>, spekulativno izvršavanje), ' +
        'i dijeli [[=cache]] među programima. Nepotreban rad se poništi i rezultat ostaje ispravan, ali ono što je usput dotaknuo ostaje toplo. ' +
        '<b>Spectre i Meltdown</b> (2018): tragovi rada unaprijed koji prežive poništavanje.</p>' +
        '<h3>Prostor → smetnja (Rowhammer)</h3>' +
        '<p>Gušći čip ima manje ćelije i retke bliže jedan drugome, pa ono što se događa u jednom retku malo poremeti susjedne. ' +
        '<b>Rowhammer</b> (2014): aktivnost u jednom retku DRAM-a mijenja bitove u susjednim retcima (simulator ' +
        '<a href="../rowhammer/index.html">Rowhammer</a>).</p>' +
        '<h3>Kompromis</h3>' +
        '<p>Što je više optimizacije za brzinu i prostor, to je veća šansa da trag preživi. Sve isključeno: sigurno, ali sporo, veliko i ' +
        'troši više energije. Zaštite postoje u sklopovlju, operacijskom sustavu i prevoditeljima, i svaka usporava rad.</p>' +
        '<h3>Zaključak: granica koja nije fizička</h3>' +
        '<p>Sve ostale granice brzine i veličine su fizičke: brzina svjetlosti i širenje signala, toplina i gustoća snage, kvantni efekti i ' +
        'curenje struje u malim ćelijama, veličina atoma. Spectre i Rowhammer otkrili su granicu druge vrste. Sklopovlje radi i programi rade; ' +
        'optimizaciju moramo kočiti samo zato što netko drugi na istom računalu može biti zlonamjeran. Tu granicu nameću programi i pravila ' +
        '(izolacija, zaštite, namjerno usporavanje), a ne fizika. <b>Sve ostale granice brzine su fizičke. Ova je granica povjerenja.</b></p>' +
        '<h3>Model</h3>' +
        '<p>Ilustrativan, nije izmjeren. Šansa po bitu na svakoj osi = 80 % × (razina / 10)², sa zaštitama četiri puta manja. Šansa za curenje ' +
        '= 1 − (1 − p(brzina)) × (1 − p(prostor)). Vrijeme i energija rastu linearno sa svakom razinom ispod najviše, a površina s kvadratom veličine ćelije.</p>'
    },
    en: {
      stage: 'The victim and another program on one computer',
      speed: 'Optimise for speed',
      speedHint: 'More running ahead, sharing and caching',
      density: 'Optimise for space',
      densityHint: 'A denser chip: smaller cells, rows closer',
      mitigate: 'Mitigations (hardware, OS, compiler)',
      mitigateHint: 'A lower chance, but slower and costlier',
      trust: 'Other code on the machine',
      trustHostile: 'may be hostile',
      trustTrusted: 'is all trusted',

      presetSafe: 'Everything off',
      presetSafeHint: 'Safe, but slow, large and costly',
      presetSpeed: 'Speed only',
      presetSpeedHint: 'Running ahead at its maximum: traces in the cache',
      presetSpace: 'Space only',
      presetSpaceHint: 'The densest chip: disturbance in the next row',
      presetBoth: 'Both at maximum',
      presetBothHint: 'Fastest and smallest, the highest leak chance',
      presetMitigated: 'Both + mitigations',
      presetMitigatedHint: 'A lower chance, paid for in time and energy',
      presetTrusted: 'All code trusted',
      presetTrustedHint: 'The same traces, but of use to nobody: the conclusion',

      legendOne: 'secret bit 1',
      legendZero: 'bit 0',
      legendTrace: 'trace of a secret bit',

      checkResult: 'Victim\'s result: correct',
      checkSoftware: 'Every software check: passes',
      checkHardware: 'Hardware: works as specified',
      otherSees: 'The other program sees {k} of {n} secret bits',

      axisSpeed: 'Speed → a trace that survives the rollback',
      exampleSpeed: 'real-world example: Spectre, Meltdown',
      axisSpace: 'Space → disturbance in the next row',
      exampleSpace: 'real-world example: Rowhammer',
      rowSecret: 'the victim\'s secret data',
      rowCache: 'shared cache: warm after the rollback',
      rowVictim: 'the victim\'s row in memory',
      rowNeighbour: 'the other program\'s row next to it',
      ahead: 'running ahead: {n} of {max}, results rolled back',
      aheadNone: 'no running ahead',
      spacing: 'row spacing: {v} %',
      perBit: 'chance per bit',
      traces: 'traces',
      curveX: 'level',

      meter: 'Chance of a leak (either kind)',
      riskHostile: 'Risk: {p}, because some code may be hostile',
      riskTrusted: 'Risk: 0 %, because all code is trusted',
      illustrative: 'illustrative model, not measured',
      costHead: 'Cost (1× = both at maximum, no mitigations)',
      costTime: 'time per task',
      costArea: 'chip area',
      costEnergy: 'energy per task',

      limitsHead: 'Limits on speed and size',
      limitLight: 'speed of light, signal propagation',
      limitHeat: 'heat, power density',
      limitQuantum: 'quantum effects, leakage current',
      limitAtoms: 'the size of atoms',
      limitTrust: 'trust: someone may be hostile',
      physical: 'physical',
      notPhysical: 'not physical',

      captionSafe: 'Both optimisations off: no trace, but a task takes {time} the time, the chip is {area} larger and uses {energy} the energy.',
      captionLeak: 'The victim\'s result is correct and every check passes, yet the secret bits leave traces: {ts} through speed, {td} through space.',
      captionChance: 'Illustrative chance of a leak: {p}.',
      captionNoTrace: 'The chance of a leak is {p}, but no secret bit has left a trace yet.',
      captionMit: 'Mitigations lower it, and a task takes {time} the time.',
      captionHostile: 'Hardware and software work correctly; the only thing holding the optimisation back is that other code may be hostile.',
      captionTrusted: 'All code is trusted: the same traces are of use to nobody, so full optimisation is safe.',
      quote: 'Every other limit on speed is physical. This one is a limit of trust.',

      explain:
        '<h3>The question</h3>' +
        '<p>How can an attack succeed on a computer whose hardware works correctly and whose software works correctly, with nothing in the software able to spot it?</p>' +
        '<h3>The answer</h3>' +
        '<p>The attack lives in side effects between parts that each work as specified. The specification says what the result is, not what ' +
        'is left behind in shared state on the way: in the [[cache]], or in neighbouring rows of memory. A software check sees only the result, ' +
        'and the result is correct. Another program sharing the same hardware sees the trace and infers something about the secret from it. ' +
        'This is a <em>side channel</em>.</p>' +
        '<h3>Speed → trace (Spectre)</h3>' +
        '<p>A fast processor runs ahead before it knows whether it needs the work (<em>speculative execution</em>), and shares the ' +
        '[[=cache]] between programs. Work that was not needed is rolled back and the result stays correct, but what it touched on the way ' +
        'stays warm. <b>Spectre and Meltdown</b> (2018): traces of running ahead that survive the rollback.</p>' +
        '<h3>Space → disturbance (Rowhammer)</h3>' +
        '<p>A denser chip has smaller cells and rows closer together, so what happens in one row disturbs its neighbours a little. ' +
        '<b>Rowhammer</b> (2014): activity in one DRAM row changes bits in the rows next to it (the ' +
        '<a href="../rowhammer/index.html">Rowhammer</a> simulator).</p>' +
        '<h3>The trade-off</h3>' +
        '<p>The more a machine is optimised for speed and space, the higher the chance that a trace survives. Everything off: safe, but slow, ' +
        'large and costlier in energy. Mitigations exist in hardware, in the operating system and in compilers, and every one costs performance.</p>' +
        '<h3>Conclusion: a limit that is not physical</h3>' +
        '<p>Every other limit on speed and size is physical: the speed of light and signal propagation, heat and power density, quantum effects ' +
        'and leakage in small cells, the size of atoms. Spectre and Rowhammer revealed a limit of a different kind. The hardware works and the ' +
        'software works; we must hold an optimisation back only because someone else on the same machine may be hostile. That limit is ' +
        'enforced by software and policy (isolation, mitigations, slowing down on purpose), not by physics. ' +
        '<b>Every other limit on speed is physical. This one is a limit of trust.</b></p>' +
        '<h3>The model</h3>' +
        '<p>Illustrative, not measured. The chance per bit on each axis = 80 % × (level / 10)², a quarter of that with mitigations. The chance ' +
        'of a leak = 1 − (1 − p(speed)) × (1 − p(space)). Time and energy grow linearly with every level below the maximum, and area with the square of the cell size.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
