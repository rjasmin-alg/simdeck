/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of dedup-chunking, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* marks an English term in italics on the Croatian page (the page turns it into <em lang="en">); the terms are
   missing from kit/glossary.js and written out this way (NOTES.md, "Term pairs").
   Data (the file's bytes, offsets, sums, hashes) is not language: the page shows it with translate="no".
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Ista datoteka odsječena na stalnu duljinu i po sadržaju, sa spremištem odsječaka',

      // params
      size: 'Veličina odsječka (S = D)',
      window: 'Klizni prozor (bajtova)',
      edit: 'Izmjena',
      editPrepend: 'umetni X na početak',
      editInsert: 'umetni ! u sredinu',
      editDelete: 'obriši bajt u sredini',
      editNone: 'bez izmjene',
      showHash: 'Prikaži sažetke',
      showHashHint: 'Isključeno: samo isti / NOVI.',

      // presets
      presetPrepend: 'Bajt na početku',
      presetPrependHint: 'Svi fiksni odsječci se pomaknu.',
      presetInsert: 'Bajt u sredini',
      presetInsertHint: 'Prije izmjene sve ostaje isto.',
      presetDelete: 'Brisanje u sredini',
      presetDeleteHint: 'Pomak unatrag djeluje isto.',
      presetNone: 'Bez izmjene',
      presetNoneHint: 'Ista datoteka, druga kopija.',
      presetSmall: 'Mali odsječci',
      presetSmallHint: 'S = D = 4, četiri odsječka po koraku.',

      // legend
      legFixed: 'fiksni odsječak',
      legCdc: 'odsječak po sadržaju',
      legSame: 'isti: već spremljen',
      legNew: 'NOVI: sprema se',
      legWindow: 'klizni prozor',
      legChanged: 'u ovom koraku',

      // rows
      rowFixed: 'Stalna duljina',
      rowCdc: 'Po sadržaju',
      rowFixedSet: 'S = {s}',
      rowCdcSet: 'D = {d}, prozor {w}, min {min}, max {max}',
      verOrig: 'izvornik',
      verEdited: 'izmijenjena datoteka',
      winLabel: 'prozor',
      spaceWord: 'razmak',
      thNo: '#',
      thStart: 'početak',
      thLen: 'duljina',
      thHash: 'sažetak',
      thStatus: 'stanje',
      stSame: 'isti',
      stNew: 'NOVI',
      tableEmpty: 'još nije odsječeno',
      tableWait: 'čeka na red',
      store: 'Spremište',
      storeEmpty: 'prazno',
      storeCount: ['{n} sažetak', '{n} sažetka', '{n} sažetaka'],
      cntOrig: ['{n} odsječak, spremljeno {b} B', '{n} odsječka, spremljeno {b} B', '{n} odsječaka, spremljeno {b} B'],
      chunksN: ['{n} odsječak', '{n} odsječka', '{n} odsječaka'],
      cntReuse: 'ponovno upotrijebljeno {k} od {n}, novih {b} B',
      cntNone: 'nije još odsječeno',

      // captions
      capStart: 'Datoteka od {n} bajtova, jedan znak je jedan bajt. Sigurnosna kopija je dijeli na *chunks* (odsječke) ' +
        'i sprema svaki samo jednom: to je *deduplication* (deduplikacija). Gore se reže na stalnu duljinu, dolje po sadržaju.',
      capOriginal: 'Prva kopija: na stalnu duljinu {nf}, po sadržaju {nc}. Spremište je prazno, pa se *hash* ' +
        '(sažetak) i bajtovi svakog odsječka kojeg još nema spremaju: {bf} B i {bc} B.',
      capOrigDup: 'Odsječak {x} pojavljuje se dvaput, a spremljen je jednom.',
      capInsert: 'Izmjena: na mjesto {at} umetnut je bajt {b}. Svaki bajt iza njega pomaknuo se za jedno mjesto.',
      capDelete: 'Izmjena: s mjesta {at} obrisan je bajt {b}. Svaki bajt iza njega pomaknuo se za jedno mjesto unatrag.',
      capNoEdit: 'Bez izmjene: ista datoteka sprema se još jednom.',
      capEditNext: 'Sad se izmijenjena datoteka reže ponovno, a svaki se odsječak traži u spremištu.',
      capFixedSame: 'Fiksni odsječak {i} ({from}–{to}): sažetak {h} već je u spremištu, ništa se ne sprema.',
      capFixedSameNoHash: 'Fiksni odsječak {i} ({from}–{to}) već je u spremištu, ništa se ne sprema.',
      capFixedShift: 'Fiksni odsječak {i} počinje na {from} kao i prije, ali sadržaj mu se pomaknuo za jedan bajt: sažetak je nov, pa se sprema.',
      capFixedEdit: 'Fiksni odsječak {i} ({from}–{to}) sadrži izmjenu: sažetak je nov, pa se sprema.',
      capFixedGroup: 'Fiksni odsječci {a}–{b}: isti {same}, novi {nw}.',
      capFixedGroupShift: 'Svi iza izmjene počinju gdje i prije, ali s pomaknutim sadržajem.',
      capCdcHash: 'Odsječak po sadržaju {i}: zbroj prozora je {sum}, a {sum} mod {d} = 0, pa je granica iza bajta {pos}.',
      capCdcMax: 'Odsječak po sadržaju {i}: zbroj prozora {sum} nije djeljiv s {d}, ali odsječak je dosegao najveću duljinu {max} B, pa se reže.',
      capCdcEnd: 'Odsječak po sadržaju {i}: ostatak datoteke iza zadnje granice zadnji je odsječak.',
      capCdcIgnored: 'Pogodak iza bajta {pos} zanemaren je: odsječak bi bio kraći od {min} B.',
      capCdcSame: 'Sažetak je već u spremištu.',
      capCdcNew: 'Sažetak je nov, sprema se {len} B.',
      capCdcGroup: 'Odsječci po sadržaju {a}–{b}: isti {same}, novi {nw}.',
      capResyncAll: 'Granica iza {txt} pronađena je ponovno: odavde se svaki odsječak poklapa sa spremljenim.',
      capResync: 'Granica iza {txt} pronađena je ponovno, odsječak se poklapa sa spremljenim.',
      capTotals: 'Ukupno. Stalna duljina: ponovno upotrijebljeno {fs} od {fn}, novih {fb} B. Po sadržaju: {cs} od {cn}, novih {cb} B.',
      capTotalsShift: 'Jedan bajt pomaknuo je sve fiksne odsječke iza sebe; granice po sadržaju vratile su se iza izmjene, pa se kraj datoteke opet našao u spremištu.',
      capTotalsNoSync: 'Jedan bajt pomaknuo je sve fiksne odsječke iza sebe. Ovdje se ni granice po sadržaju nisu vratile do kraja datoteke: rez na najvećoj duljini ovisi o tome gdje je pao prethodni rez, pa nosi pomak dalje.',
      capTotalsNone: 'Kad se ništa ne pomiče, obje metode sve pronalaze u spremištu: stalna duljina dobra je dok nema umetanja ni brisanja.',

      explain: '<p>Sigurnosna kopija ne sprema datoteke cijele, nego ih dijeli na <em lang="en">chunks</em> (odsječke), računa svakom <em lang="en">hash</em> ' +
        '(sažetak) i sprema samo odsječke čiji sažetak još nije u spremištu. To je <em lang="en">deduplication</em> (deduplikacija) na razini ' +
        'odsječaka; traženje istih cijelih datoteka drugi je postupak.</p>' +
        '<p><b>Stalna duljina:</b> granice su na 0, S, 2S, … Prepisan bajt mijenja jedan odsječak, ali umetnut ili obrisan ' +
        'bajt pomiče sve iza sebe, pa su svi odsječci od izmjene nadalje novi.</p>' +
        '<p><b>Po sadržaju:</b> <em lang="en">rolling hash</em> (klizni sažetak) računa se nad zadnjih nekoliko bajtova (prozor), a granica ' +
        'je tamo gdje je on djeljiv s D. Ovdje je to samo zbroj bajtova u prozoru; stvarni sustavi koriste bolje funkcije ' +
        '(Rabinov otisak, <em lang="en">Gear hash</em>). Granica ovisi samo o sadržaju prozora, pa se iza izmjene obično pojavljuje na istim ' +
        'bajtovima kao prije i odsječci se opet poklapaju. Rez na najvećoj duljini (max) ne ovisi o sadržaju, nego o prethodnom rezu: on može nositi pomak dalje, sve do sljedeće prave granice. Najmanja duljina (min) sprječava sitne odsječke, a najveća (max) ' +
        'reže i kad granice dugo nema, pa odsječci po sadržaju nisu svi jednako dugi.</p>'
    },
    en: {
      stage: 'The same file cut at a fixed size and by content, with the chunk store',

      size: 'Chunk size (S = D)',
      window: 'Rolling window (bytes)',
      edit: 'Edit',
      editPrepend: 'insert X at the start',
      editInsert: 'insert ! in the middle',
      editDelete: 'delete a byte in the middle',
      editNone: 'no edit',
      showHash: 'Show hashes',
      showHashHint: 'Off: same / NEW only.',

      presetPrepend: 'A byte at the start',
      presetPrependHint: 'Every fixed chunk moves.',
      presetInsert: 'A byte in the middle',
      presetInsertHint: 'Before the edit nothing changes.',
      presetDelete: 'Delete in the middle',
      presetDeleteHint: 'A shift back works the same way.',
      presetNone: 'No edit',
      presetNoneHint: 'The same file, a second backup.',
      presetSmall: 'Small chunks',
      presetSmallHint: 'S = D = 4, four chunks per step.',

      legFixed: 'fixed chunk',
      legCdc: 'content-defined chunk',
      legSame: 'same: already stored',
      legNew: 'NEW: stored now',
      legWindow: 'rolling window',
      legChanged: 'in this step',

      rowFixed: 'Fixed size',
      rowCdc: 'Content-defined',
      rowFixedSet: 'S = {s}',
      rowCdcSet: 'D = {d}, window {w}, min {min}, max {max}',
      verOrig: 'original',
      verEdited: 'edited file',
      winLabel: 'window',
      spaceWord: 'a space',
      thNo: '#',
      thStart: 'offset',
      thLen: 'length',
      thHash: 'hash',
      thStatus: 'status',
      stSame: 'same',
      stNew: 'NEW',
      tableEmpty: 'not cut yet',
      tableWait: 'waiting its turn',
      store: 'Store',
      storeEmpty: 'empty',
      storeCount: ['{n} hash', '{n} hashes'],
      cntOrig: ['{n} chunk, {b} B stored', '{n} chunks, {b} B stored'],
      chunksN: ['{n} chunk', '{n} chunks'],
      cntReuse: 'reused {k} of {n}, new bytes {b} B',
      cntNone: 'not cut yet',

      capStart: 'A file of {n} bytes, one character is one byte. A backup splits it into chunks and stores each one ' +
        'only once: that is deduplication. The top row cuts at a fixed size, the bottom row by content.',
      capOriginal: 'First backup: fixed size gives {nf}, content-defined {nc}. The store is empty, so the hash and bytes ' +
        'of every chunk not yet in it are stored: {bf} B and {bc} B.',
      capOrigDup: 'Chunk {x} occurs twice and is stored once.',
      capInsert: 'Edit: byte {b} is inserted at offset {at}. Every byte after it has moved one place on.',
      capDelete: 'Edit: byte {b} is deleted at offset {at}. Every byte after it has moved one place back.',
      capNoEdit: 'No edit: the same file is backed up again.',
      capEditNext: 'Now the edited file is cut again, and each chunk is looked up in the store.',
      capFixedSame: 'Fixed chunk {i} ({from}–{to}): hash {h} is already in the store, nothing is stored.',
      capFixedSameNoHash: 'Fixed chunk {i} ({from}–{to}) is already in the store, nothing is stored.',
      capFixedShift: 'Fixed chunk {i} starts at {from} as before, but its content has moved by one byte: the hash is new, so it is stored.',
      capFixedEdit: 'Fixed chunk {i} ({from}–{to}) holds the edit: the hash is new, so it is stored.',
      capFixedGroup: 'Fixed chunks {a}–{b}: same {same}, new {nw}.',
      capFixedGroupShift: 'Every one after the edit starts where it did, with shifted content.',
      capCdcHash: 'Content-defined chunk {i}: the window sums to {sum}, and {sum} mod {d} = 0, so the boundary falls after byte {pos}.',
      capCdcMax: 'Content-defined chunk {i}: the window sum {sum} is not a multiple of {d}, but the chunk has reached the maximum {max} B, so it is cut.',
      capCdcEnd: 'Content-defined chunk {i}: the rest of the file after the last boundary is the last chunk.',
      capCdcIgnored: 'The hit after byte {pos} is ignored: the chunk would be shorter than {min} B.',
      capCdcSame: 'The hash is already in the store.',
      capCdcNew: 'The hash is new, {len} B are stored.',
      capCdcGroup: 'Content-defined chunks {a}–{b}: same {same}, new {nw}.',
      capResyncAll: 'CDC found the boundary after {txt} again: from here on every chunk matches the stored one.',
      capResync: 'CDC found the boundary after {txt} again, and the chunk matches the stored one.',
      capTotals: 'Totals. Fixed size: reused {fs} of {fn}, new {fb} B. Content-defined: {cs} of {cn}, new {cb} B.',
      capTotalsShift: 'One byte moved every fixed chunk after it; the content-defined boundaries came back after the edit, so the end of the file was found in the store again.',
      capTotalsNoSync: 'One byte moved every fixed chunk after it. Here even the content-defined boundaries did not come back before the end of the file: a cut at the maximum length depends on where the previous cut fell, so it carries the shift on.',
      capTotalsNone: 'When nothing shifts, both methods find everything in the store: fixed size is fine as long as nothing is inserted or deleted.',

      explain: '<p>A backup does not store whole files: it splits them into chunks, computes a hash of each, and stores ' +
        'only the chunks whose hash is not in the store yet. That is block-level deduplication; finding identical whole ' +
        'files is a different method.</p>' +
        '<p><b>Fixed size:</b> the boundaries are at 0, S, 2S, … An overwritten byte changes one chunk, but an inserted or ' +
        'deleted byte moves everything after it, so every chunk from the edit on is new.</p>' +
        '<p><b>Content-defined</b> (CDC): a rolling hash is computed over the last few bytes (the window), and a boundary ' +
        'falls where it is a multiple of D. Here it is just the sum of the bytes in the window; real systems use better ' +
        'functions (a Rabin fingerprint, a Gear hash). A boundary depends only on the content of the window, so after the ' +
        'edit it usually falls on the same bytes as before and the chunks match again. A cut at the maximum length (max) depends not on the content but on the previous cut: it can carry the shift on, up to the next real boundary. A minimum length (min) prevents tiny ' +
        'chunks and a maximum (max) cuts when no boundary comes, so content-defined chunks are not all the same size.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
