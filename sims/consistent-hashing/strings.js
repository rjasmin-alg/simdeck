/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of consistent-hashing, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other),
   [[term]] a glossary term. *word* in a caption is an English term in italics (the page renders it).
   Terms missing from kit/glossary.js are written out (NOTES.md, Term pairs).
   The title and subtitle come from sim.json (title, concept). Node names A … J and key names are data. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Isti ključevi raspoređeni na dva načina',
      vnodes: 'Točaka po čvoru na prstenu',
      vnodesHint: 'Više točaka (virtualni čvorovi) ujednačuje lukove.',
      from: 'Čvorova prije promjene',
      nodes: 'Čvorova sada',
      add: 'Dodaj čvor',
      remove: 'Ukloni čvor',
      pModAdd: 'mod n: dodaj peti čvor',
      pModAddHint: '4 → 5 čvorova: koliko se ključeva premjesti uz ostatak dijeljenja',
      pRing1: 'Prsten, 1 točka po čvoru',
      pRing1Hint: '4 → 5 čvorova na prstenu s jednom točkom po čvoru: lukovi su nejednaki',
      pRing100: 'Prsten, 100 točaka po čvoru',
      pRing100Hint: '4 → 5 čvorova na prstenu sa 100 točaka po čvoru: oko petine ključeva, ravnomjerno',
      pRemove: 'Ukloni čvor: 5 → 4',
      pRemoveHint: 'Na prstenu se premještaju samo ključevi uklonjenog čvora',
      legNode: 'točka čvora (slovo)',
      legVnode: 'virtualna točka',
      legArc: 'luk čvora',
      legKey: 'ključ',
      legMoved: 'premješten zadnjom promjenom',
      legGone: 'uklonjen čvor',
      modTitle: 'Ostatak dijeljenja: hash(ključ) mod {n}',
      ringTitle: 'Prsten: prva točka u smjeru kazaljke',
      loadsTitle: 'Ključeva po čvoru',
      gone: 'uklonjen',
      plus: '+{n}',
      ringCentre: '1000 ključeva',
      ringNodes: ['{n} čvor', '{n} čvora', '{n} čvorova'],
      ringPer: ['× {n} točka', '× {n} točke', '× {n} točaka'],
      ringZero: '0 = 2³²',
      ringAria: 'Prsten raspršivanja: {nodes}, {pts} po čvoru, 1000 ključeva, premješteno: {m}.',
      barAria: 'Čvor {node}: {keys}; premješteno ovamo: {arr}.',
      goneAria: 'Čvor {node} uklonjen; imao je {keys}.',
      boxMod: 'mod n',
      boxRing: 'prsten',
      boxIdeal: 'idealno {num}/{den}',
      boxIdealPlus: 'idealno za +1 čvor: {num}/{den}',
      boxIdealMinus: 'idealno za −1 čvor: {num}/{den}',
      boxMoved: 'premješteno',
      boxOf: 'od 1000 · {pct}',
      boxNone: 'još nema promjene',
      pct: '{n} %',
      cNone: '{nodes}, {pts} po čvoru na prstenu. Dodaj ili ukloni čvor (+ / −) i gledaj koliko se ključeva premjesti.',
      cAdd: 'Dodan čvor {new}. Uz *mod n* premješta se {mod} od 1000 ključeva ({modPct}); na prstenu samo oni s lukova koje {new} preuzima: {ring} ({ringPct}).',
      cAddMany: 'Dodani čvorovi {list}. Uz *mod n* premješta se {mod} od 1000 ključeva ({modPct}); na prstenu samo oni koje preuzimaju novi čvorovi: {ring} ({ringPct}).',
      cModAdd: 'Uz *mod n* peti čvor premješta {mod} od 1000 ključeva: ključ ostaje samo ako je *hash* mod 4 jednak *hash* mod 5. Na prstenu (*consistent hashing*) premješta samo one koje preuzima: {ring}.',
      cRemove: 'Uklonjen čvor {gone}. Uz *mod n* premješta se {mod} od 1000 ključeva ({modPct}); na prstenu samo {ringK} koje je {gone} držao, svaki sljedećoj točki u smjeru kazaljke.',
      cRemoveMany: 'Uklonjeni čvorovi {list}. Uz *mod n* premješta se {mod} od 1000 ključeva ({modPct}); na prstenu samo {ringK} koje su oni držali.',
      nManyFrom: ['{pts} po čvoru: uzima se od {k} čvora; opterećenje od {minN} do {maxN}.', '{pts} po čvoru: uzima se od {k} čvora; opterećenje od {minN} do {maxN}.', '{pts} po čvoru: uzima se od {k} čvorova; opterećenje od {minN} do {maxN}.'],
      nManyTo: ['{pts} po čvoru: ključevi idu na {k} čvor; opterećenje od {minN} do {maxN}.', '{pts} po čvoru: ključevi idu na {k} čvora; opterećenje od {minN} do {maxN}.', '{pts} po čvoru: ključevi idu na {k} čvorova; opterećenje od {minN} do {maxN}.'],
      nUneven: 'Jedna točka po čvoru: lukovi su nejednaki, {max} nosi {maxK}, a {min} samo {minK}. Virtualni čvorovi to ujednačuju.',
      nEven: 'Opterećenje na prstenu: od {minN} do {maxK} po čvoru.',
      pts: ['{n} točka', '{n} točke', '{n} točaka'],
      nodesN: ['{n} čvor', '{n} čvora', '{n} čvorova'],
      keysN: ['{n} ključ', '{n} ključa', '{n} ključeva'],
      atMax: 'Najviše je 10 čvorova.',
      atMin: 'Najmanje su 2 čvora.',
      explain: '<p>Ključ se smješta na čvor tako da se izračuna njegov <em lang="en">hash</em> (sažetak), broj od 0 do 2³² − 1, ' +
        'isti svaki put i za svakoga.</p>' +
        '<p><b>Ostatak dijeljenja.</b> Čvor je <code>hash mod n</code>. Kad n naraste s 4 na 5, ključ ostaje samo ako mu je ' +
        'ostatak pri dijeljenju s 4 jednak ostatku pri dijeljenju s 5: to vrijedi za oko petinu ključeva, pa se oko ' +
        '<b>n/(n+1)</b>, ovdje 80 %, premjesti.</p>' +
        '<p><b>Prsten.</b> <em lang="en">Consistent hashing</em> (dosljedno raspršivanje) slaže sažetke u krug, ' +
        '[[ring]]. I čvorovi dobivaju sažetak svojeg imena, točku na prstenu; ključ pripada prvoj točki u smjeru kazaljke. ' +
        'Novi čvor preuzima samo ključeve s lukova ispred svojih točaka, oko <b>1/(n+1)</b> svih; uklonjeni predaje samo ' +
        'svoje, sljedećima na prstenu.</p>' +
        '<p><b>Virtualni čvorovi.</b> S jednom točkom po čvoru lukovi su slučajno dugi i opterećenje nejednako. ' +
        'Sa 100 točaka po čvoru (<em lang="en">virtual nodes</em>, virtualni čvorovi) svaki čvor ima mnogo kratkih ' +
        'lukova, pa se razlike izravnaju, a ključeve uklonjenog čvora dijele svi ostali.</p>' +
        '<p><b>Zablude.</b> Ne premješta svako raspršivanje 1/n podataka: <code>mod n</code> premješta gotovo sve. ' +
        'Jedna točka po čvoru nije ravnomjerna. I dosljedno raspršivanje premješta podatke, samo najmanje što mora.</p>' +
        '<p>Sažetak je FNV-1a (32 bita) s završnim miješanjem iz MurmurHash3; ključevi su <code translate="no">key-0</code> … ' +
        '<code translate="no">key-999</code>, točke <code translate="no">A-0</code>, <code translate="no">A-1</code>, ….</p>'
    },
    en: {
      stage: 'The same keys placed two ways',
      vnodes: 'Points per node on the ring',
      vnodesHint: 'More points (virtual nodes) even out the arcs.',
      from: 'Nodes before the change',
      nodes: 'Nodes now',
      add: 'Add node',
      remove: 'Remove node',
      pModAdd: 'mod n: add a fifth node',
      pModAddHint: '4 → 5 nodes: how many keys move with the remainder',
      pRing1: 'Ring, 1 point per node',
      pRing1Hint: '4 → 5 nodes on the ring with one point per node: the arcs are uneven',
      pRing100: 'Ring, 100 points per node',
      pRing100Hint: '4 → 5 nodes on the ring with 100 points per node: about a fifth of the keys, evenly',
      pRemove: 'Remove a node: 5 → 4',
      pRemoveHint: 'On the ring only the removed node\'s keys move',
      legNode: 'node point (letter)',
      legVnode: 'virtual point',
      legArc: 'arc of a node',
      legKey: 'key',
      legMoved: 'moved by the last change',
      legGone: 'removed node',
      modTitle: 'Remainder: hash(key) mod {n}',
      ringTitle: 'Ring: first point clockwise',
      loadsTitle: 'Keys per node',
      gone: 'removed',
      plus: '+{n}',
      ringCentre: '1000 keys',
      ringNodes: ['{n} node', '{n} nodes'],
      ringPer: ['× {n} point', '× {n} points'],
      ringZero: '0 = 2³²',
      ringAria: 'Hash ring: {nodes}, {pts} per node, 1000 keys, {m} moved.',
      barAria: 'Node {node}: {keys}; moved here: {arr}.',
      goneAria: 'Node {node} removed; it held {keys}.',
      boxMod: 'mod n',
      boxRing: 'ring',
      boxIdeal: 'ideal {num}/{den}',
      boxIdealPlus: 'ideal for +1 node: {num}/{den}',
      boxIdealMinus: 'ideal for −1 node: {num}/{den}',
      boxMoved: 'moved',
      boxOf: 'of 1000 · {pct}',
      boxNone: 'no change yet',
      pct: '{n}%',
      cNone: '{nodes}, {pts} per node on the ring. Add or remove a node (+ / −) and watch how many keys move.',
      cAdd: 'Node {new} joined. With *mod n* {mod} of 1000 keys move ({modPct}); on the ring only the keys on the arcs {new} takes over: {ring} ({ringPct}).',
      cAddMany: 'Nodes {list} joined. With *mod n* {mod} of 1000 keys move ({modPct}); on the ring only the keys the new nodes take over: {ring} ({ringPct}).',
      cModAdd: 'With *mod n* the fifth node moves {mod} of 1000 keys: a key stays only if hash mod 4 equals hash mod 5. On the ring (*consistent hashing*) it moves only the keys it takes over: {ring}.',
      cRemove: 'Node {gone} left. With *mod n* {mod} of 1000 keys move ({modPct}); on the ring only the {ringK} {gone} held, each to the next point clockwise.',
      cRemoveMany: 'Nodes {list} left. With *mod n* {mod} of 1000 keys move ({modPct}); on the ring only the {ringK} they held.',
      nManyFrom: ['{pts} per node: taken from {k} node; loads {minN} to {maxN}.', '{pts} per node: taken from {k} nodes; loads {minN} to {maxN}.'],
      nManyTo: ['{pts} per node: the keys go to {k} node; loads {minN} to {maxN}.', '{pts} per node: the keys go to {k} nodes; loads {minN} to {maxN}.'],
      nUneven: 'One point per node: the arcs are uneven, {max} carries {maxK} and {min} only {minK}. Virtual nodes even this out.',
      nEven: 'Load on the ring: {minN} to {maxK} per node.',
      pts: ['{n} point', '{n} points'],
      nodesN: ['{n} node', '{n} nodes'],
      keysN: ['{n} key', '{n} keys'],
      atMax: 'At most 10 nodes.',
      atMin: 'At least 2 nodes.',
      explain: '<p>A key is placed on a node by computing its hash, a number from 0 to 2³² − 1, the same every time and ' +
        'for everyone.</p>' +
        '<p><b>Remainder.</b> The node is <code>hash mod n</code>. When n grows from 4 to 5, a key stays only if its ' +
        'remainder by 4 equals its remainder by 5: that holds for about a fifth of the keys, so about <b>n/(n+1)</b>, ' +
        'here 80%, move.</p>' +
        '<p><b>Ring.</b> Consistent hashing lays the hashes out in a circle, a [[ring]]. Nodes get the hash of their ' +
        'name too, a point on the ring; a key belongs to the first point clockwise. A new node takes over only the keys ' +
        'on the arcs before its points, about <b>1/(n+1)</b> of all; a removed node hands over only its own, to the next ' +
        'ones on the ring.</p>' +
        '<p><b>Virtual nodes.</b> With one point per node the arcs have random lengths and the load is uneven. With ' +
        '100 points per node (virtual nodes) every node has many short arcs, the differences even out, and a removed ' +
        'node\'s keys are shared by all the others.</p>' +
        '<p><b>Misconceptions.</b> Not every hashing moves 1/n of the data: <code>mod n</code> moves almost all of it. ' +
        'One point per node is not balanced. Consistent hashing moves data too, only the least it has to.</p>' +
        '<p>The hash is FNV-1a (32 bits) with MurmurHash3\'s final mix; the keys are <code translate="no">key-0</code> … ' +
        '<code translate="no">key-999</code>, the points <code translate="no">A-0</code>, <code translate="no">A-1</code>, ….</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
