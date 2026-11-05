/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ceph-min-size, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* in a caption is an English term in italics (the page renders it):
   the glossary has no placement group, OSD or acting set yet (NOTES.md "Term pairs").
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Bazen, njegove grupe smještaja i OSD-ovi',
      thsep: '.',

      // controls
      cluster: 'Grozd',
      clusterHc: '3 × 4 OSD',
      clusterDr: 'sjedište (S2)',
      size: 'size (kopija)',
      minSize: 'min_size',
      fail1: 'Prvi kvar',
      fail2: 'Drugi kvar',
      drFail: 'Kvar',
      failNone: 'nema',
      hostNamed: 'domaćin {h}',
      hostNamedStart: 'Domaćin {h}',

      // presets
      p22: '2/2 · osd.0',
      p22Hint: 'size 2, min_size 2; pada osd.0: 17 od 128 PG-ova staje.',
      p32: '3/2 · osd.0',
      p32Hint: 'size 3, min_size 2; isti kvar: 30 degradiranih, nijedan ne staje.',
      p32two: '3/2 · osd.0+4',
      p32twoHint: 'size 3, min_size 2; osd.0 i osd.4, na dva domaćina: 7 PG-ova staje.',
      p21: '2/1 · osd.0+4',
      p21Hint: 'size 2, min_size 1: pisanje na jednu kopiju, pa pada i ta.',
      pDr: 'S2 · osd.15',
      pDrHint: 'Scenarij S2: osd.15 na hq-pve-03; bazen vm-rbd, size 2, min_size 2.',
      pHost: '3/2 · ceph-01',
      pHostHint: 'size 3, min_size 2; cijeli ceph-01: svih 128 degradirano, nijedan ne staje.',

      // legend
      legChanged: 'promijenjeno u ovom koraku',
      legClean: 'čist: sve kopije žive',
      legDegraded: 'degradiran: radi s manje kopija',
      legInactive: 'neaktivan: U/I zaustavljen',
      legStale: 'nema žive kopije',
      legUp: 'OSD radi (kopija na njemu)',
      legDown: 'OSD je pao',
      legWatched: 'PG u koji klijent piše',

      // stage
      poolWord: 'bazen',
      clockWord: 'sat',
      osdTitle: 'OSD-ovi po domaćinima',
      osdMeta: 'svaka kopija PG-a na drugom domaćinu',
      outAside: 'osd.{x}: izbačen otprije',
      poolTitle: 'Svi PG-ovi bazena',
      zoomTitle: 'Kopije {n} najpogođenijih PG-ova',
      zoomMeta: 'redak = PG, ćelija = OSD s kopijom',
      client: 'klijent',
      g_clean: 'čist',
      g_degraded: 'degradiran',
      g_inactive: 'neaktivan',
      g_stale: 'bez kopije',
      cnt_clean: ['{n} čist', '{n} čista', '{n} čistih'],
      cnt_degraded: ['{n} degradiran', '{n} degradirana', '{n} degradiranih'],
      cnt_inactive: ['{n} neaktivan', '{n} neaktivna', '{n} neaktivnih'],
      cnt_stale: ['{n} bez kopije', '{n} bez kopije', '{n} bez kopije'],
      cnt_down: ['{n} ne poslužuje U/I', '{n} ne poslužuju U/I', '{n} ne poslužuje U/I'],
      pgCount: ['{n} PG', '{n} PG-a', '{n} PG-ova'],
      writesTitle: 'Pisanja klijenta',
      wNone: 'Klijent još ništa nije pisao.',
      wAck: '✓ potvrđeno: {osds}',
      wBlocked: 'čeka (U/I zaustavljen)',
      wLost: '✕ izgubljeno: bilo je samo na {osds}',
      wLine: 'W{w} → PG {pg}',
      pgNow: 'PG {pg} sada:',
      cmpTitle: 'Isti kvarovi, druge postavke',
      cmpSet: 'postavka',
      cmpInactive: 'stalo',
      cmpDegraded: 'degradirano',
      cmpStale: 'bez kopije',
      cmpWrites: 'pisanja',
      cmpNow: 'ovdje',

      // captions
      capStart: ['Bazen {pool} dijeli se na {pgs} *placement group* (grupa smještaja, PG); svaki PG spremljen je u {size} kopije, na {size} različita domaćina. PG poslužuje čitanje i pisanje dok radi barem {n} njegova kopija (min_size). Pritisni → i pada {target}.', 'Bazen {pool} dijeli se na {pgs} *placement group* (grupa smještaja, PG); svaki PG spremljen je u {size} kopije, na {size} različita domaćina. PG poslužuje čitanje i pisanje dok rade barem {n} njegove kopije (min_size). Pritisni → i pada {target}.', 'Bazen {pool} dijeli se na {pgs} *placement group* (grupa smještaja, PG); svaki PG spremljen je u {size} kopije, na {size} različita domaćina. PG poslužuje čitanje i pisanje dok radi barem {n} njegovih kopija (min_size). Pritisni → i pada {target}.'],
      capClock: '{clock}.',
      capFail: ['{target} je pao: {n} PG imao je kopiju na njemu.', '{target} je pao: {n} PG-a imala su kopiju na njemu.', '{target} je pao: {n} PG-ova imalo je kopiju na njemu.'],
      capFailNothing: '{target} je već bio pao: ništa se ne mijenja.',
      capToInactive: ['{n} od njih ostaje s manje od {min} kopije (min_size): neaktivan je i U/I prema njemu staje.', '{n} od njih ostaju s manje od {min} kopije (min_size): neaktivni su i U/I prema njima staje.', '{n} od njih ostaje s manje od {min} kopije (min_size): neaktivni su i U/I prema njima staje.'],
      capToDegraded: ['{n} je degradiran: ima manje od {size} kopije, ali barem {min}, pa i dalje poslužuje U/I.', '{n} su degradirana: imaju manje od {size} kopije, ali barem {min}, pa i dalje poslužuju U/I.', '{n} je degradirano: imaju manje od {size} kopije, ali barem {min}, pa i dalje poslužuju U/I.'],
      capStillDegraded: ['{n} koji je već bio degradiran gubi još jednu kopiju i ostaje degradiran.', '{n} koja su već bila degradirana gube još jednu kopiju i ostaju degradirana.', '{n} koji su već bili degradirani gube još jednu kopiju i ostaju degradirani.'],
      capToStale: ['{n} više nema nijedne žive kopije ∅.', '{n} više nemaju nijedne žive kopije ∅.', '{n} više nema nijedne žive kopije ∅.'],
      capLost: 'Pisanje {w} bilo je potvrđeno samo na {osds}: s tim diskom nestalo je i ono. Kopija koja se vrati s ranijeg kvara starija je od njega.',
      capWriteAck: ['{w}: klijent piše objekt u PG {pg}. Njegova jedina živa kopija ({osds}) sprema ga i tada je pisanje potvrđeno ✓.', '{w}: klijent piše objekt u PG {pg}. Sprema ga svaka od {n} žive kopije ({osds}) i tek tada je pisanje potvrđeno ✓.', '{w}: klijent piše objekt u PG {pg}. Sprema ga svaka od {n} živih kopija ({osds}) i tek tada je pisanje potvrđeno ✓.'],
      capWriteOne: 'Potvrđeno na jednom disku: ako on otkaže prije oporavka, pisanje nestaje s njim.',
      capWriteDegraded: 'PG je degradiran, ali aktivan: degradiran bazen nije zaustavljen bazen.',
      capWriteBlocked: ['{w}: klijent piše objekt u PG {pg}. Živa mu je samo {n} kopija, manje od min_size {min}: pisanje čeka. Klijent ne dobiva grešku, nego visi.', '{w}: klijent piše objekt u PG {pg}. Žive su mu samo {n} kopije, manje od min_size {min}: pisanje čeka. Klijent ne dobiva grešku, nego visi.', '{w}: klijent piše objekt u PG {pg}. Živo mu je samo {n} kopija, manje od min_size {min}: pisanje čeka. Klijent ne dobiva grešku, nego visi.'],
      capWriteStale: '{w}: klijent piše objekt u PG {pg}, a on nema nijednu živu kopiju: pisanje čeka da se vrati neki od njegovih OSD-ova.',
      capLater: ['{clock}, deset minuta poslije: {n} PG i dalje je ispod min_size. Disk virtualnog računala od {gib} GiB je {obj} objekata po {mib} MiB, raspoređenih po svih {pgs} PG-ova; njih oko {stuck} je u zaustavljenom PG-u. Svako virtualno računalo koje čita ili piše neki od njih čeka: računala „vise”.', '{clock}, deset minuta poslije: {n} PG-a i dalje su ispod min_size. Disk virtualnog računala od {gib} GiB je {obj} objekata po {mib} MiB, raspoređenih po svih {pgs} PG-ova; njih oko {stuck} je u zaustavljenim PG-ovima. Svako virtualno računalo koje čita ili piše neki od njih čeka: računala „vise”.', '{clock}, deset minuta poslije: {n} PG-ova i dalje je ispod min_size. Disk virtualnog računala od {gib} GiB je {obj} objekata po {mib} MiB, raspoređenih po svih {pgs} PG-ova; njih oko {stuck} je u zaustavljenim PG-ovima. Svako virtualno računalo koje čita ili piše neki od njih čeka: računala „vise”.'],
      capLaterNone: '{clock}, deset minuta poslije: nijedan PG nije ispod min_size. Degradirani PG-ovi i dalje poslužuju, pa virtualna računala rade dalje.',
      capSum: 'Na kraju, size {size}, min_size {min}: {i} neaktivno, {d} degradirano i {s} bez kopije, od {n} PG-ova. Tablica pokazuje iste kvarove uz druge postavke.',
      capSum22: 'size 2 ne znači „smije otkazati jedan disk”: uz min_size 2 jedan kvar zaustavlja svaki PG koji je imao kopiju na palim OSD-ovima.',
      capSum32: 'size 3 uz min_size 2 preživi jedan kvar: degradirano, ali ne zaustavljeno. Stanu samo PG-ovi koji izgube dvije kopije.',
      capSum1: 'min_size 1 ne zaustavlja U/I, ali potvrđeno pisanje može živjeti na samo jednom disku; izgubi li se taj disk, nestaje i pisanje.',

      explain: '<p>Replicirani bazen čuva svaki objekt u <code>size</code> kopija. Objekti su raspoređeni po ' +
        '<em lang="en">placement group</em> (grupa smještaja, PG), a pravilo smještaja stavlja kopije svakog PG-a na različite domaćine. ' +
        '<code>min_size</code> kaže koliko kopija mora raditi da bi PG primao čitanje i pisanje.</p>' +
        '<p>Pravila: PG s barem <code>min_size</code> živih kopija je aktivan; s manje od <code>size</code> je ' +
        'degradiran, ali i dalje radi. Ispod <code>min_size</code> je neaktivan: U/I prema njemu čeka, a klijenti ne ' +
        'dobivaju grešku, nego vise. Bez ijedne žive kopije nema ga tko poslužiti. Pisanje je potvrđeno tek kad ga ' +
        'spremi svaka živa kopija.</p>' +
        '<p>Tri zablude. „size 2 znači da smije otkazati jedan disk”: uz <code>min_size 2</code> jedan disk manje ' +
        'zaustavlja PG-ove koji su imali kopiju na njemu. „min_size 1 je sigurniji jer U/I nikad ne staje”: potvrđeno ' +
        'pisanje tada može biti na jednom jedinom disku. „Degradiran bazen je zaustavljen bazen”: ne, degradiran PG ' +
        'radi.</p>' +
        '<p>Zadani <code>min_size</code> repliciranog bazena je <code>size − ⌊size/2⌋</code>: 2 za size 3, 1 za size 2. ' +
        'Sučelje koje počinje od 3/2 i u koje se upiše samo size 2 ostavlja <code>min_size</code> na 2. Obično se ' +
        'preporučuje 3/2.</p>' +
        '<p>Ovdje nema oporavka (kad se OSD izbaci i nastaje nova kopija), pravila smještaja ni bazena s kodovima za ' +
        'ispravljanje: to su druge stranice.</p>'
    },
    en: {
      stage: 'A pool, its placement groups and the OSDs',
      thsep: ',',

      cluster: 'Cluster',
      clusterHc: '3 × 4 OSDs',
      clusterDr: 'HQ (S2)',
      size: 'size (copies)',
      minSize: 'min_size',
      fail1: 'First failure',
      fail2: 'Second failure',
      drFail: 'Failure',
      failNone: 'none',
      hostNamed: 'host {h}',
      hostNamedStart: 'Host {h}',

      p22: '2/2 · osd.0',
      p22Hint: 'size 2, min_size 2; osd.0 goes down: 17 of 128 PGs stop.',
      p32: '3/2 · osd.0',
      p32Hint: 'size 3, min_size 2; the same failure: 30 degraded, none stops.',
      p32two: '3/2 · osd.0+4',
      p32twoHint: 'size 3, min_size 2; osd.0 and osd.4, on two hosts: 7 PGs stop.',
      p21: '2/1 · osd.0+4',
      p21Hint: 'size 2, min_size 1: a write onto one copy, then that copy goes too.',
      pDr: 'S2 · osd.15',
      pDrHint: 'Scenario S2: osd.15 on hq-pve-03; pool vm-rbd, size 2, min_size 2.',
      pHost: '3/2 · ceph-01',
      pHostHint: 'size 3, min_size 2; all of ceph-01: all 128 degraded, none stops.',

      legChanged: 'changed in this step',
      legClean: 'clean: every copy up',
      legDegraded: 'degraded: runs on fewer copies',
      legInactive: 'inactive: I/O blocked',
      legStale: 'no copy up',
      legUp: 'OSD up (a copy on it)',
      legDown: 'OSD down',
      legWatched: 'the PG the client writes to',

      poolWord: 'pool',
      clockWord: 'clock',
      osdTitle: 'OSDs by host',
      osdMeta: 'each copy of a PG on another host',
      outAside: 'osd.{x}: out from before',
      poolTitle: 'Every PG of the pool',
      zoomTitle: 'Copies of the {n} hardest-hit PGs',
      zoomMeta: 'row = PG, cell = OSD with a copy',
      client: 'client',
      g_clean: 'clean',
      g_degraded: 'degraded',
      g_inactive: 'inactive',
      g_stale: 'no copy',
      cnt_clean: ['{n} clean', '{n} clean'],
      cnt_degraded: ['{n} degraded', '{n} degraded'],
      cnt_inactive: ['{n} inactive', '{n} inactive'],
      cnt_stale: ['{n} with no copy', '{n} with no copy'],
      cnt_down: ['{n} not serving I/O', '{n} not serving I/O'],
      pgCount: ['{n} PG', '{n} PGs'],
      writesTitle: 'Client writes',
      wNone: 'The client has not written yet.',
      wAck: '✓ acknowledged: {osds}',
      wBlocked: 'waiting (I/O blocked)',
      wLost: '✕ lost: it was only on {osds}',
      wLine: 'W{w} → PG {pg}',
      pgNow: 'PG {pg} now:',
      cmpTitle: 'The same failures, other settings',
      cmpSet: 'setting',
      cmpInactive: 'stopped',
      cmpDegraded: 'degraded',
      cmpStale: 'no copy',
      cmpWrites: 'writes',
      cmpNow: 'here',

      capStart: ['Pool {pool} is split into {pgs} *placement groups* (PGs); each PG is stored as {size} copies, on {size} different hosts. A PG serves reads and writes while at least {n} of its copies is up (min_size). Press → and {target} goes down.', 'Pool {pool} is split into {pgs} *placement groups* (PGs); each PG is stored as {size} copies, on {size} different hosts. A PG serves reads and writes while at least {n} of its copies are up (min_size). Press → and {target} goes down.'],
      capClock: '{clock}.',
      capFail: ['{target} is down: {n} PG had a copy on it.', '{target} is down: {n} PGs had a copy on it.'],
      capFailNothing: '{target} was down already: nothing changes.',
      capToInactive: ['{n} of them is left with fewer than {min} copies (min_size): it is inactive, and I/O to it stops.', '{n} of them are left with fewer than {min} copies (min_size): they are inactive, and I/O to them stops.'],
      capToDegraded: ['{n} is degraded: fewer than {size} copies but at least {min}, so it still serves I/O.', '{n} are degraded: fewer than {size} copies but at least {min}, so they still serve I/O.'],
      capStillDegraded: ['{n} that was degraded already loses one more copy and stays degraded.', '{n} that were degraded already lose one more copy and stay degraded.'],
      capToStale: ['{n} has no live copy left ∅.', '{n} have no live copy left ∅.'],
      capLost: 'Write {w} had been acknowledged on {osds} only: it is gone with that disk. A copy that returns from the earlier failure is older than it.',
      capWriteAck: ['{w}: the client writes an object to PG {pg}. Its one live copy ({osds}) stores it, and the write is acknowledged ✓.', '{w}: the client writes an object to PG {pg}. Each of its {n} live copies ({osds}) stores it, and only then is the write acknowledged ✓.'],
      capWriteOne: 'Acknowledged on one disk: if that disk fails before recovery, the write goes with it.',
      capWriteDegraded: 'The PG is degraded but active: a degraded pool is not a stopped pool.',
      capWriteBlocked: ['{w}: the client writes an object to PG {pg}. Only {n} copy is up, fewer than min_size {min}: the write waits. The client gets no error; it just hangs.', '{w}: the client writes an object to PG {pg}. Only {n} copies are up, fewer than min_size {min}: the write waits. The client gets no error; it just hangs.'],
      capWriteStale: '{w}: the client writes an object to PG {pg}, which has no live copy: the write waits for one of its OSDs to come back.',
      capLater: ['{clock}, ten minutes later: {n} PG is still below min_size. A {gib} GiB virtual machine disk is {obj} objects of {mib} MiB, spread over all {pgs} PGs; about {stuck} of them are in the stopped PG. Every virtual machine that reads or writes one of those waits: the machines “hang”.', '{clock}, ten minutes later: {n} PGs are still below min_size. A {gib} GiB virtual machine disk is {obj} objects of {mib} MiB, spread over all {pgs} PGs; about {stuck} of them are in the stopped PGs. Every virtual machine that reads or writes one of those waits: the machines “hang”.'],
      capLaterNone: '{clock}, ten minutes later: no PG is below min_size. The degraded PGs still serve, so the virtual machines keep running.',
      capSum: 'In the end, size {size}, min_size {min}: {i} inactive, {d} degraded and {s} with no copy, of {n} PGs. The table runs the same failures under the other settings.',
      capSum22: 'size 2 does not mean “one disk may fail”: with min_size 2, one failure stops every PG that had a copy on the failed OSDs.',
      capSum32: 'size 3 with min_size 2 rides out one failure: degraded, not stopped. Only PGs that lose two copies stop.',
      capSum1: 'min_size 1 never stops I/O, but an acknowledged write may live on one disk only; lose that disk and the write is gone.',

      explain: '<p>A replicated pool keeps every object as <code>size</code> copies. Objects are grouped into placement ' +
        'groups (PGs), and the placement rule puts the copies of each PG on different hosts. <code>min_size</code> says ' +
        'how many copies must be up for the PG to accept reads and writes.</p>' +
        '<p>The rules: a PG with at least <code>min_size</code> live copies is active; with fewer than <code>size</code> ' +
        'it is degraded but still serves. Below <code>min_size</code> it is inactive: I/O to it waits, and clients get no ' +
        'error, they hang. With no live copy at all there is nobody to serve it. A write is acknowledged only once every ' +
        'live copy has stored it.</p>' +
        '<p>Three misconceptions. “size 2 means one disk may fail”: with <code>min_size 2</code>, one disk fewer stops the ' +
        'PGs that had a copy on it. “min_size 1 is safer because I/O never stops”: an acknowledged write may then sit on a ' +
        'single disk. “A degraded pool is a stopped pool”: no, a degraded PG serves.</p>' +
        '<p>The default <code>min_size</code> of a replicated pool is <code>size − ⌊size/2⌋</code>: 2 for size 3, 1 for ' +
        'size 2. A management interface that starts at 3/2 and takes only a new size of 2 leaves <code>min_size</code> at ' +
        '2. The usual recommendation is 3/2.</p>' +
        '<p>Not here: recovery (marking the OSD out and making a new copy), placement rules, and erasure-coded pools: ' +
        'those are other pages.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
