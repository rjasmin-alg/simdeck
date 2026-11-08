/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cache-mapping, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term.
   Terms missing from kit/glossary.js are written out (NOTES.md "Term pairs"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Priručna memorija s 8 linija i niz pristupa',
      trace: 'Niz adresa',
      traceHint: 'Novi niz kreće od prazne memorije.',
      ways: 'Broj putova u skupu',
      waysHint: 'Uvijek 8 linija: mijenja se samo raspodjela. Isti korak se preračuna.',
      block: 'Veličina bloka',
      waysOne: '1 · izravno',
      waysAll: '8 · potpuno',
      bytes: '{n} B',
      trPing: 'Ping-pong',
      trThree: 'Tri bloka',
      trLocality: 'Lokalnost',
      trCapacity: 'Kapacitet',
      prPing: 'Ping-pong: 0x000 i 0x080',
      prPingHint: 'Dvije adrese u istom skupu, memorija gotovo prazna. Probaj 2 puta.',
      prThree: 'Tri bloka u jednom skupu',
      prThreeHint: '2 puta ne pomažu, 4 pomažu.',
      prLocality: 'Susjedne riječi',
      prLocalityHint: 'Pogoci bez ijedne ponovljene adrese.',
      prCapacity: '10 blokova u krug',
      prCapacityHint: 'Probaj 8 putova: veća asocijativnost ovdje odmaže.',
      legValid: 'puna linija',
      legInvalid: 'prazna linija',
      legHit: 'H pogodak',
      legMiss: 'promašaj: C obvezni, P kapacitet, K sukob',
      legVictim: 'izbačeni blok',
      legChanged: 'promijenjeno u ovom koraku',
      addrNow: 'Adresa',
      addrNext: 'Sljedeća adresa',
      fTag: 'oznaka',
      fSet: 'skup',
      fOffset: 'pomak',
      bitsN: ['{n} bit', '{n} bita', '{n} bitova'],
      derive: 'blok {block} · skup {set} · oznaka {tag} · pomak {offset}',
      shapeDM: 'izravno preslikavanje',
      shapeSA: '{n}-struko skupno asocijativna',
      shapeFA: 'potpuno asocijativna',
      setsN: ['{n} skup', '{n} skupa', '{n} skupova'],
      waysN: ['{n} put', '{n} puta', '{n} putova'],
      cacheHead: '{shape}: {sets} × {ways}',
      setRow: 'skup {n}',
      wayCol: 'put {n}',
      cellTag: 'oznaka',
      cellBlock: 'blok',
      cellAge: 'starost',
      cellEmpty: 'prazno',
      cellLabel: 'skup {set}, put {way}',
      victim: 'izbačen blok {b}',
      accHead: 'Pristupi',
      colThis: 'ova',
      colFa: 'potpuno asoc.',
      faNote: 'Sivo: potpuno asocijativna s 8 linija (LRU), ista veličina. Ona razvrstava promašaje.',
      cntThis: 'ova: H {h} · C {c} · P {p} · K {k}',
      cntFa: 'potpuno asoc.: H {h} · M {m}',
      mH: 'H',
      mC: 'C',
      mP: 'P',
      mK: 'K',
      mM: 'M',
      capStart: 'Prazna priručna memorija, {shape}: {sets} × {ways}, blok {block} B. Prvi pristup: {addr}. Pritisni →.',
      capAddr: 'Adresa {addr}: blok {block}, skup {block} mod {sets} = {set}, oznaka {tag}.',
      capEmpty: 'Skup {set} je prazan',
      capHeld: ['U skupu {set} je oznaka {tags}', 'U skupu {set} su oznake {tags}', 'U skupu {set} su oznake {tags}'],
      capHit: '→ pogodak u putu {way}.',
      capCompFill: '→ obvezni promašaj, prvi pristup bloku {block}; ide u prazni put {way}.',
      capCompEvict: '→ obvezni promašaj, prvi pristup bloku {block}; izbacujemo blok {victim}.',
      capConflict: '→ promašaj zbog sukoba; izbacujemo blok {victim}.',
      capConflictWhy: 'Potpuno asocijativna bi blok {block} još imala.',
      capCapacity: '→ promašaj zbog kapaciteta; izbacujemo blok {victim}.',
      capCapacityWhy: 'Ni potpuno asocijativna s 8 linija više nema blok {block}.',
      capEnd: 'Kraj: {hits} od {n}. Potpuno asocijativna: {fa}.',
      hitsN: ['{n} pogodak', '{n} pogotka', '{n} pogodaka'],
      capEmptyLines: ['Promašaji zbog sukoba, a {n} linija je ostala prazna: memorija nije premala, problem je preslikavanje; pomaže više putova.',
        'Promašaji zbog sukoba, a {n} linije su ostale prazne: memorija nije premala, problem je preslikavanje; pomaže više putova.',
        'Promašaji zbog sukoba, a {n} linija je ostalo praznih: memorija nije premala, problem je preslikavanje; pomaže više putova.'],
      capWorse: 'Ova memorija ovdje pogađa više od potpuno asocijativne: ta s LRU uvijek izbaci baš blok koji će joj najprije trebati.',
      explain: '<p><i>Cache</i> (priručna memorija) ovdje ima 8 linija; svaka drži jedan blok od B bajtova. ' +
        'Blok = ⌊adresa / B⌋, a adresa se dijeli na tri polja: [[offset]] = adresa mod B (bajt u bloku), ' +
        '<i>set</i> (skup) = blok mod S i <i>tag</i> (oznaka) = ⌊blok / S⌋, gdje je S = 8 / broj putova.</p>' +
        '<p><b><i>Direct mapped</i> (izravno preslikavanje)</b>: 1 put i 8 skupova, svaki blok ima samo jedno mjesto. ' +
        '<b><i>Set associative</i> (skupno asocijativna)</b> s n putova: blok smije u bilo koji od n putova svog skupa. ' +
        '<b><i>Fully associative</i> (potpuno asocijativna)</b>: 1 skup, blok smije bilo gdje. Pri promašaju se puni ' +
        'najniži prazni put, a ako ga nema, izbacuje se LRU linija, ona najdulje nekorištena.</p>' +
        '<p>Svaki <i>miss</i> (promašaj) svrstava se po modelu 3C, usporedbom s potpuno asocijativnom memorijom iste ' +
        'veličine (sivi stupac): <b>C</b>, <i>compulsory miss</i> (obvezni promašaj), prvi pristup bloku; <b>P</b>, ' +
        '<i>capacity miss</i> (promašaj zbog kapaciteta), ni potpuno asocijativna ga više nema; <b>K</b>, ' +
        '<i>conflict miss</i> (promašaj zbog sukoba), potpuno asocijativna bi imala [[hit]], ali se skup napunio.</p>' +
        '<p>Tri zablude. Ping-pong nije problem veličine: memorija je gotovo prazna, a pomaže više putova. Veća ' +
        'asocijativnost ne pomaže uvijek: u primjeru 4 potpuno asocijativna s LRU ne pogađa ništa. Pogoci ne dolaze ' +
        'samo od ponovljenih adresa: u primjeru 3 susjedne adrese dijele blok, to je [[locality]].</p>' +
        '<p>Čitanje i pisanje ovdje su isti; politike pisanja, više razina i druge politike zamjene nisu dio ove simulacije.</p>'
    },
    en: {
      stage: 'A cache of 8 lines and the access trace',
      trace: 'Address trace',
      traceHint: 'A new trace starts from an empty cache.',
      ways: 'Ways per set',
      waysHint: 'Always 8 lines: only the arrangement changes. The same step is recomputed.',
      block: 'Block size',
      waysOne: '1 · direct',
      waysAll: '8 · fully',
      bytes: '{n} B',
      trPing: 'Ping-pong',
      trThree: 'Three blocks',
      trLocality: 'Locality',
      trCapacity: 'Capacity',
      prPing: 'Ping-pong: 0x000 and 0x080',
      prPingHint: 'Two addresses in the same set, the cache nearly empty. Try 2 ways.',
      prThree: 'Three blocks in one set',
      prThreeHint: '2 ways do not help, 4 do.',
      prLocality: 'Neighbouring words',
      prLocalityHint: 'Hits without a single repeated address.',
      prCapacity: '10 blocks in a loop',
      prCapacityHint: 'Try 8 ways: more associativity hurts here.',
      legValid: 'full line',
      legInvalid: 'empty line',
      legHit: 'H hit',
      legMiss: 'miss: C compulsory, P capacity, K conflict',
      legVictim: 'evicted block',
      legChanged: 'changed in this step',
      addrNow: 'Address',
      addrNext: 'Next address',
      fTag: 'tag',
      fSet: 'set',
      fOffset: 'offset',
      bitsN: ['{n} bit', '{n} bits'],
      derive: 'block {block} · set {set} · tag {tag} · offset {offset}',
      shapeDM: 'direct mapped',
      shapeSA: '{n}-way set associative',
      shapeFA: 'fully associative',
      setsN: ['{n} set', '{n} sets'],
      waysN: ['{n} way', '{n} ways'],
      cacheHead: '{shape}: {sets} × {ways}',
      setRow: 'set {n}',
      wayCol: 'way {n}',
      cellTag: 'tag',
      cellBlock: 'block',
      cellAge: 'age',
      cellEmpty: 'empty',
      cellLabel: 'set {set}, way {way}',
      victim: 'block {b} evicted',
      accHead: 'Accesses',
      colThis: 'this',
      colFa: 'fully assoc.',
      faNote: 'Grey: a fully associative cache of 8 lines (LRU), the same size. It classifies the misses.',
      cntThis: 'this: H {h} · C {c} · P {p} · K {k}',
      cntFa: 'fully assoc.: H {h} · M {m}',
      mH: 'H',
      mC: 'C',
      mP: 'P',
      mK: 'K',
      mM: 'M',
      capStart: 'Empty cache, {shape}: {sets} × {ways}, block {block} B. First access: {addr}. Press →.',
      capAddr: 'Address {addr}: block {block}, set {block} mod {sets} = {set}, tag {tag}.',
      capEmpty: 'Set {set} is empty',
      capHeld: ['Set {set} holds tag {tags}', 'Set {set} holds tags {tags}'],
      capHit: '→ hit in way {way}.',
      capCompFill: '→ compulsory miss, the first access to block {block}; it goes into the empty way {way}.',
      capCompEvict: '→ compulsory miss, the first access to block {block}; block {victim} is evicted.',
      capConflict: '→ conflict miss; block {victim} is evicted.',
      capConflictWhy: 'A fully associative cache would still hold block {block}.',
      capCapacity: '→ capacity miss; block {victim} is evicted.',
      capCapacityWhy: 'Even a fully associative cache of 8 lines no longer holds block {block}.',
      capEnd: 'End: {hits} out of {n}. Fully associative: {fa}.',
      hitsN: ['{n} hit', '{n} hits'],
      capEmptyLines: ['Conflict misses, yet {n} line stayed empty: the cache is not too small, the mapping is; more ways help.',
        'Conflict misses, yet {n} lines stayed empty: the cache is not too small, the mapping is; more ways help.'],
      capWorse: 'This cache hits more than the fully associative one here: with LRU, that one always evicts the block it will need soonest.',
      explain: '<p>The <i>cache</i> here has 8 lines; each holds one block of B bytes. Block = ⌊address / B⌋, and the ' +
        'address splits into three fields: [[offset]] = address mod B (the byte in the block), <i>set</i> = block mod S ' +
        'and <i>tag</i> = ⌊block / S⌋, where S = 8 / the number of ways.</p>' +
        '<p><b><i>Direct mapped</i></b>: 1 way and 8 sets, so every block has exactly one place. ' +
        '<b><i>Set associative</i></b> with n ways: a block may go into any of the n ways of its set. ' +
        '<b><i>Fully associative</i></b>: 1 set, a block may go anywhere. On a miss the lowest-numbered empty way is ' +
        'filled; if there is none, the LRU line, the one unused for longest, is evicted.</p>' +
        '<p>Every <i>miss</i> is classified by the 3C model, against a fully associative cache of the same size (the ' +
        'grey column): <b>C</b>, <i>compulsory miss</i>, the first access to the block; <b>P</b>, <i>capacity miss</i>, ' +
        'the fully associative cache no longer holds it either; <b>K</b>, <i>conflict miss</i>, the fully associative ' +
        'cache would have had a [[hit]], but the set was full.</p>' +
        '<p>Three misconceptions. Ping-pong is not a size problem: the cache is nearly empty, and more ways help. More ' +
        'associativity does not always help: in example 4 the fully associative LRU cache hits nothing. Hits do not come ' +
        'only from repeated addresses: in example 3 neighbouring addresses share a block, which is [[locality]].</p>' +
        '<p>Reads and writes are the same here; write policies, more levels and other replacement policies are not part ' +
        'of this simulation.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
