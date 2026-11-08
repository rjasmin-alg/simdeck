/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of pipeline-hazards, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term.
   Terms missing from kit/glossary.js are written out (NOTES.md "Term pairs"). Assembly, register names and the
   stage names IF ID EX MEM WB are data (translate="no"), not strings. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Pet faza protočne strukture i dijagram taktova',
      forwarding: 'Prosljeđivanje',
      forwardingHint: 'Putovi EX/MEM → EX i MEM/WB → EX. Isti takt se preračuna.',
      program: 'Program',
      programHint: 'Novi program kreće od prvog takta.',
      progIndependent: 'Neovisne',
      progRaw: 'Ovisni par',
      progLoadUse: 'lw pa upotreba',
      progMixed: 'S grananjem',
      prIndependent: 'Neovisne instrukcije',
      prIndependentHint: 'Idealno: nakon punjenja jedna instrukcija završava u svakom taktu.',
      prRawNoFwd: 'Ovisnost bez prosljeđivanja',
      prRawNoFwdHint: 'sub čita x1 tek kad ga add upiše: dva zastoja.',
      prRawFwd: 'Ovisnost s prosljeđivanjem',
      prRawFwdHint: 'Isti par, rezultat ide iz EX/MEM ravno u EX.',
      prLoadUse: 'Load-use hazard',
      prLoadUseHint: 'Jedan zastoj ostaje i s prosljeđivanjem. Isključi ga: dva.',
      prMixed: 'Program s grananjem',
      prMixedHint: 'Zastoj, tri prosljeđivanja, izvršeno grananje. Isključi prosljeđivanje: 17 taktova.',

      legStage: 'faza (slovo i boja)',
      legBubble: 'zastoj: čeka, mjehurić ide u EX',
      legFlush: 'poništeno',
      legFwd: 'prosljeđivanje',
      legChanged: 'ovaj takt',

      stIF: 'dohvat',
      stID: 'dekodiranje, registri',
      stEX: 'izvođenje (ALU)',
      stMEM: 'pristup memoriji',
      stWB: 'upis u registre',
      slotEmpty: 'prazno',
      slotBubble: 'mjehurić',
      slotFlushed: 'poništeno',
      held: 'čeka {reg}',
      heldIF: 'čeka',
      flushedNow: 'poništava se',
      fwdIdle: 'neiskorišten',
      fwdOff: 'prosljeđivanje isključeno',
      regPass: 'registri: upis u 1. polovici, čitanje u 2.',
      colInstr: 'Instrukcija',
      colCycle: 'Takt',
      wrongPath: 'krivi put',
      cellStall: 'zastoj',
      cellFlush: 'poništeno',
      cntCycle: 'Takt',
      cntDone: 'Završeno',
      cntStalls: 'Zastoji',
      cntFlushed: 'Poništeno',
      cntCpi: 'Taktova po instrukciji',
      cntOf: '{k} / {n}',

      capStart: 'Prije prvog takta: {n} u programu, prosljeđivanje je {fwd}. Svaki korak je jedan takt; svaka instrukcija prolazi kroz IF, ID, EX, MEM i WB.',
      fwdOn: 'uključeno',
      fwdOffWord: 'isključeno',
      instrN: ['{n} instrukcija', '{n} instrukcije', '{n} instrukcija'],
      capCycle: 'Takt {n}:',
      capLoadUse: '{c} bi sad ušao u EX, ali treba {reg}, koji {p} ima tek nakon faze MEM. Jedan mjehurić: {c2} čeka u ID-u, prosljeđivanje ga ne može izbjeći.',
      capNoFwd: '{c} čeka u ID-u: treba {reg}, a {p} ga upisuje tek u fazi WB ({when}). U EX ulazi mjehurić.',
      wbNow: 'u ovom taktu',
      wbAt: 'u taktu {n}',
      capIFHeld: 'Stoji i IF.',
      capHazardSeen: 'Jedinica za hazarde vidi da {c} u ID-u treba {reg} od {p}: u idućem taktu {c2} ostaje u ID-u.',
      capEnters: '{c} ulazi u EX.',
      capFlush: '{b} se razrješava u fazi EX: grananje se izvršava, iako je predviđeno da se neće izvršiti. Poništavaju se dvije instrukcije dohvaćene iza njega; IF u idućem taktu dohvaća {target}.',
      capNotTaken: '{b} se razrješava u fazi EX: grananje se ne izvršava, kako je i predviđeno, pa se ništa ne gubi.',
      capFwd: '{c} u fazi EX dobiva {reg} od {p} prosljeđivanjem {path}.',
      capRegPass: '{p} upisuje {reg} u prvoj polovici takta (WB), a {c} ga čita u drugoj (ID).',
      capFetch: 'IF dohvaća {i}.',
      capDone: '{i} završava.',
      capNoneDone: 'U fazi WB je mjehurić: u ovom taktu ne završava nijedna instrukcija.',
      capEnd: 'Gotovo za {cycles}: 5 + ({n} − 1) + {stalls} + {flushed}. Svaka instrukcija i dalje prolazi svih 5 faza: dobiva se propusnost, instrukcija nije kraća.',
      cyclesN: ['{n} takt', '{n} takta', '{n} taktova'],
      stallsN: ['{n} zastoj', '{n} zastoja', '{n} zastoja'],
      flushedN: ['{n} poništena', '{n} poništene', '{n} poništenih'],

      explain:
        '<p><i lang="en">Pipeline</i> (protočna struktura) dijeli instrukciju u pet faza: IF (dohvat), ID (dekodiranje i ' +
        'čitanje registara), EX (ALU), MEM (pristup memoriji) i WB (upis u registre). U svakom taktu svaka faza radi na ' +
        'drugoj instrukciji. Jedna instrukcija ne postaje brža, i dalje traje pet taktova ([[latency]]), ali nakon ' +
        'punjenja jedna završava u svakom taktu ([[throughput]]).</p>' +
        '<p><b><i lang="en">Data hazard</i></b> (podatkovni hazard): instrukcija treba registar koji starija instrukcija ' +
        'još nije upisala. Registri se upisuju u prvoj polovici takta, a čitaju u drugoj, pa instrukcija čija je faza ID ' +
        'u taktu proizvođačeve faze WB već čita novu vrijednost. Bez [[forwarding]] potrošač čeka u ID-u: na udaljenosti ' +
        '1 dva zastoja, na udaljenosti 2 jedan, od 3 nijedan. <i lang="en">Stall</i> (zastoj) je ' +
        '<i lang="en">bubble</i> (mjehurić), prazna faza koja putuje kroz strukturu.</p>' +
        '<p>S [[=forwarding]] rezultat ALU-a ide izravno u fazu EX iz registara EX/MEM i MEM/WB, pa ALU → ALU ne čeka. ' +
        'Ako oba puta nose isti registar, pobjeđuje noviji (EX/MEM). Vrijednost iz memorije postoji tek nakon faze MEM: ' +
        'instrukcija odmah iza <code>lw</code> koja je koristi čeka jedan takt (<i lang="en">load-use</i> hazard). Taj ' +
        'zastoj u ovakvoj strukturi (instrukcije redom) uklanja tek prevoditelj, koji između njih umetne neovisnu instrukciju.</p>' +
        '<p><b>Grananje</b> se ovdje predviđa kao neizvršeno i razrješava u fazi EX. Ako se izvrši, dvije instrukcije ' +
        'dohvaćene iza njega su s krivog puta i poništavaju se (<i lang="en">flush</i>, poništavanje): dva izgubljena takta svaki put, ' +
        'koliko god često se grana. Osnovna struktura kod Pattersona i Hennessyja odlučuje tek u fazi MEM (tri takta), a ' +
        'razrješavanje već u fazi ID smanjuje gubitak na jedan takt; ' +
        'dinamičko predviđanje grananja pogađa smjer unaprijed: vidi simulator ' +
        '<a href="../hw-side-effects/index.html">Nuspojave sklopovlja</a>.</p>' +
        '<p>Broj taktova = 5 + (n − 1) + zastoji + poništene instrukcije. Izvan opsega: strukturni hazardi, iznimke, više ' +
        'instrukcija po taktu i priručna memorija.</p>'
    },

    en: {
      stage: 'The five pipeline stages and the cycle diagram',
      forwarding: 'Forwarding',
      forwardingHint: 'The paths EX/MEM → EX and MEM/WB → EX. Recomputes the same cycle.',
      program: 'Program',
      programHint: 'A new program starts from cycle 1.',
      progIndependent: 'Independent',
      progRaw: 'Dependent pair',
      progLoadUse: 'lw, then use',
      progMixed: 'With a branch',
      prIndependent: 'Independent instructions',
      prIndependentHint: 'The ideal: after the fill one instruction completes every cycle.',
      prRawNoFwd: 'A dependency without forwarding',
      prRawNoFwdHint: 'sub reads x1 only once add has written it: two stalls.',
      prRawFwd: 'A dependency with forwarding',
      prRawFwdHint: 'The same pair; the result goes from EX/MEM straight to EX.',
      prLoadUse: 'The load-use hazard',
      prLoadUseHint: 'One stall stays even with forwarding. Turn it off: two.',
      prMixed: 'A program with a branch',
      prMixedHint: 'A stall, three forwards, a taken branch. Turn forwarding off: 17 cycles.',

      legStage: 'stage (letter and colour)',
      legBubble: 'stall: waits, a bubble goes to EX',
      legFlush: 'flushed',
      legFwd: 'forwarding',
      legChanged: 'this cycle',

      stIF: 'fetch',
      stID: 'decode, registers',
      stEX: 'execute (ALU)',
      stMEM: 'memory access',
      stWB: 'write back',
      slotEmpty: 'empty',
      slotBubble: 'bubble',
      slotFlushed: 'flushed',
      held: 'waits for {reg}',
      heldIF: 'held',
      flushedNow: 'being flushed',
      fwdIdle: 'unused',
      fwdOff: 'forwarding off',
      regPass: 'register file: write in the 1st half, read in the 2nd',
      colInstr: 'Instruction',
      colCycle: 'Cycle',
      wrongPath: 'wrong path',
      cellStall: 'stall',
      cellFlush: 'flushed',
      cntCycle: 'Cycle',
      cntDone: 'Completed',
      cntStalls: 'Stalls',
      cntFlushed: 'Flushed',
      cntCpi: 'Cycles per instruction',
      cntOf: '{k} / {n}',

      capStart: 'Before cycle 1: {n} in the program, forwarding is {fwd}. Each step is one clock cycle; every instruction passes IF, ID, EX, MEM and WB.',
      fwdOn: 'on',
      fwdOffWord: 'off',
      instrN: ['{n} instruction', '{n} instructions'],
      capCycle: 'Cycle {n}:',
      capLoadUse: '{c} should enter EX now but needs {reg}, which {p} only has after MEM. One bubble: {c2} waits in ID; forwarding cannot avoid it.',
      capNoFwd: '{c} waits in ID: it needs {reg}, and {p} writes it only in WB ({when}). A bubble enters EX.',
      wbNow: 'in this cycle',
      wbAt: 'in cycle {n}',
      capIFHeld: 'IF is held too.',
      capHazardSeen: 'The hazard unit sees that {c} in ID needs {reg} from {p}: next cycle {c2} stays in ID.',
      capEnters: '{c} enters EX.',
      capFlush: '{b} is resolved in EX: the branch is taken, though it was predicted not taken. The two instructions fetched after it are flushed; IF fetches {target} next cycle.',
      capNotTaken: '{b} is resolved in EX: not taken, as predicted, so nothing is lost.',
      capFwd: '{c} in EX gets {reg} from {p} by forwarding {path}.',
      capRegPass: '{p} writes {reg} in the first half of the cycle (WB), and {c} reads it in the second (ID).',
      capFetch: 'IF fetches {i}.',
      capDone: '{i} completes.',
      capNoneDone: 'WB holds a bubble: no instruction completes in this cycle.',
      capEnd: 'Done in {cycles}: 5 + ({n} − 1) + {stalls} + {flushed}. Each instruction still passes all 5 stages: the gain is throughput, no instruction is shorter.',
      cyclesN: ['{n} cycle', '{n} cycles'],
      stallsN: ['{n} stall', '{n} stalls'],
      flushedN: ['{n} flushed', '{n} flushed'],

      explain:
        '<p>A pipeline splits an instruction into five stages: IF (fetch), ID (decode and read registers), EX (ALU), MEM ' +
        '(memory access) and WB (write back). In each cycle every stage works on a different instruction. No single ' +
        'instruction gets faster, it still takes five cycles ([[latency]]), but after the fill one completes every cycle ' +
        '([[throughput]]).</p>' +
        '<p><b>Data hazard</b>: an instruction needs a register an older one has not written yet. Registers are written ' +
        'in the first half of a cycle and read in the second, so an instruction whose ID falls in its producer\'s WB cycle ' +
        'already reads the new value. Without [[forwarding]] the consumer waits in ID: at distance 1 two stalls, at ' +
        'distance 2 one, from 3 none. A stall is a bubble, an empty stage that travels down the pipeline.</p>' +
        '<p>With [[=forwarding]] an ALU result goes straight to EX from the EX/MEM and MEM/WB registers, so ALU → ALU ' +
        'never waits. If both paths carry the same register, the newer one (EX/MEM) wins. A value from memory exists only ' +
        'after MEM: an instruction right after <code>lw</code> that uses it waits one cycle (the load-use hazard). Only ' +
        'the compiler removes that stall in this in-order pipeline, by putting an independent instruction between them.</p>' +
        '<p><b>Branches</b> are predicted not taken here and resolved in EX. When one is taken, the two instructions ' +
        'fetched after it are on the wrong path and are flushed: two lost cycles every time, however often it branches. ' +
        'Patterson and Hennessy\'s basic pipeline decides even later, in MEM (three cycles), and resolving in ID cuts the ' +
        'loss to one cycle; dynamic branch prediction guesses the ' +
        'direction ahead: see the simulator <a href="../hw-side-effects/index.html">Hardware side effects</a>.</p>' +
        '<p>Cycles = 5 + (n − 1) + stalls + flushed instructions. Out of scope: structural hazards, exceptions, issuing ' +
        'several instructions per cycle, and caches.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
