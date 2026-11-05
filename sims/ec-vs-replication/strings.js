/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ec-vs-replication, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   The title and subtitle are not here: they come from sim.json (title, concept).
   Terms missing from the glossary are written out in both tables (NOTES.md, "Term pairs"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Jedan objekt, spremljen kopijama i kodiranjem s brisanjem, na nizu poslužitelja',

      // controls
      scheme: 'Odabrana shema',
      schemeRep: 'kopije',
      schemeEc: 'kodiranje (EC)',
      n: 'Kopije n',
      k: 'Podatkovni k',
      m: 'Zaštitni m',
      minSize: 'min_size odabrane sheme',
      minDefault: 'zadano',
      minCustom: 'ručno',
      minCustomVal: 'min_size',
      hosts: 'Poslužitelji',
      failedCtl: 'Ispali poslužitelji',

      // presets
      pThree: 'Tri kopije',
      pThreeHint: '300 % prostora, 33 % iskoristivo; podaci prežive 2 kvara, U/I prestaje nakon drugog.',
      pEc42: 'EC 4+2, dva kvara',
      pEc42Hint: '150 % prostora; s dva ispala poslužitelja objekt je cijel, ali min_size 5 zaustavlja U/I.',
      pEc83: 'EC 8+3',
      pEc83Hint: '137,5 % prostora, prežive 3 kvara, ali treba 11 poslužitelja, a obnova čita 8 × više.',
      pSame: 'Isti hardver, 60 TiB',
      pSameHint: '60 TiB podataka: tri kopije trebaju 180 TiB diskova, 4+2 samo 90 TiB.',
      pMinK: 'min_size = k',
      pMinKHint: '4+2 s min_size 4: U/I teče i nakon dva kvara, ali bez ijednog rezervnog dijela.',

      // legend
      legRep: 'puna kopija (R)',
      legData: 'podatkovni dio (d)',
      legCoding: 'zaštitni dio (c)',
      legDown: 'ispali poslužitelj',
      legRebuild: 'obnova: novi dio i što čita',
      legStop: 'U/I stoji',
      legChanged: 'promijenjeno zadnjim klikom',

      // grids
      hostHead: 'h{n}',
      hostDown: 'h{n}',
      hostAria: 'Poslužitelj h{n}: {state}. Klikni za ispad ili povratak.',
      stateUp: 'radi',
      stateDown: 'ispao',
      gridRep: 'Kopije {n}×',
      gridEc: 'Kodiranje {k}+{m}',
      tagCur: 'odabrano',
      tagAlt: 'usporedba',
      metaRep: '{n} × {piece} = {raw} za objekt od {obj}',
      metaEc: ['{w} dio po {piece} = {raw} za objekt od {obj}', '{w} dijela po {piece} = {raw} za objekt od {obj}', '{w} dijelova po {piece} = {raw} za objekt od {obj}'],
      rowPieces: 'dijelovi',
      rowRebuild: 'obnova',
      asideLive: '{live} od {w} živo',
      asideHoles: ['{n} dio nema mjesta', '{n} dijela nemaju mjesta', '{n} dijelova nema mjesta'],
      rebuildNone: 'ništa za obnovu',
      rebuildLost: 'nema od čega obnoviti',
      rebuildNoHost: 'nema slobodnog poslužitelja',
      rebuildText: 'čita {read} za {write}',
      stOk: '✓ sve kopije na mjestu',
      stOkEc: '✓ svi dijelovi na mjestu',
      stDegraded: 'U/I teče (min_size {min})',
      stStopped: 'U/I stoji: {live} < min_size {min}',
      stLost: '✕ podaci izgubljeni: {live} < {need}',

      // table
      tblTitle: 'Usporedba',
      tblRaw: 'Prostor (sirovo)',
      tblEff: 'Iskoristivo',
      tblPool: 'Diskovi za 60 TiB podataka',
      tblSurvive: 'Kvarova, podaci cijeli',
      tblIo: 'Kvarova, U/I teče',
      tblRebuild: 'Obnova diska od 8 TB čita',
      tblHosts: 'Treba poslužitelja',
      tblNow: 'Sada',
      colCur: 'odabrano',
      colAlt: 'usporedba',
      colTwin: 'isti udio',
      nowOk: 'ispravno',
      nowDegraded: 'degradirano',
      nowStopped: 'U/I stoji',
      nowLost: 'izgubljeno',

      // units
      mib: '{n} MiB',
      tib: '{n} TiB',
      tb: '{n} TB',
      pct: '{n} %',

      // captions
      cOkEc: '*Erasure coding* (kodiranje s brisanjem) {cur} troši {curPct} prostora umjesto {altPct} ({curPool} umjesto {altPool} diskova za 60 TiB podataka), ali za obnovu jednog izgubljenog diska čita {times} više podataka.',
      cOkRep: 'Replikacija {cur} troši {curPct} prostora, a {alt} troši {altPct}: za 60 TiB podataka to je {curPool} umjesto {altPool} diskova. Obnova diska od 8 TB čita {curRead} umjesto {altRead}.',
      cDegraded: ['{f} poslužitelj s dijelom je ispao: {name} ima živih dijelova {live} od {w} i U/I teče (min_size {min}).',
        '{f} poslužitelja s dijelovima su ispala: {name} ima živih dijelova {live} od {w} i U/I teče (min_size {min}).',
        '{f} poslužitelja s dijelovima je ispalo: {name} ima živih dijelova {live} od {w} i U/I teče (min_size {min}).'],
      nRebuild: ['Obnova jednog dijela čita {read} s {src} poslužitelja da bi zapisala {write}.',
        'Obnova jednog dijela čita {read} s {src} poslužitelja da bi zapisala {write}.',
        'Obnova jednog dijela čita {read} s {src} poslužitelja da bi zapisala {write}.'],
      cHoles: '{name} treba {w} poslužitelja, a ima ih {hosts}: dijelovi bez mjesta nedostaju od početka.',
      sDegraded: 'Objekt je odmah degradiran; U/I teče jer je živih {live} ≥ min_size {min}.',
      sStopped: 'Objekt je cijel, ali U/I stoji jer je živih {live} < min_size {min}.',
      sLost: 'Živih je {live}, a treba barem {need}: objekt se ne može ni spremiti.',
      cStopped: ['{f} poslužitelj s dijelom je ispao: objekt {name} je još cijel (živih dijelova {live} od {w}, treba {need}), ali čitanja i pisanja stoje jer je min_size {min}.',
        '{f} poslužitelja s dijelovima su ispala: objekt {name} je još cijel (živih dijelova {live} od {w}, treba {need}), ali čitanja i pisanja stoje jer je min_size {min}.',
        '{f} poslužitelja s dijelovima je ispalo: objekt {name} je još cijel (živih dijelova {live} od {w}, treba {need}), ali čitanja i pisanja stoje jer je min_size {min}.'],
      cLost: 'Živih dijelova ostalo je {live} od {w}, a {name} treba barem {need}: objekt je izgubljen (nedostaje {miss}, a podnosi najviše {tol}).',
      nHoles: 'Dijelovi bez mjesta ({holes}) nedostaju od početka.',
      nNoMargin: 'min_size je jednak broju dijelova koje podaci trebaju: pisanje prolazi bez ijednog rezervnog dijela, pa nakon još jednog kvara potvrđeni podaci su nečitljivi dok se disk ne vrati, a izgubljeni ako se ne vrati.',
      nNoSpare: 'Nema slobodnog poslužitelja na koji bi se dio obnovio.',
      nTwin: ['{twin} ima isti iskoristivi udio ({eff}), ali podaci prežive {tt} kvar, a ne {t}.', '{twin} ima isti iskoristivi udio ({eff}), ali podaci prežive {tt} kvara, a ne {t}.', '{twin} ima isti iskoristivi udio ({eff}), ali podaci prežive {tt} kvarova, a ne {t}.'],

      explain: '<p><em lang="en">Replication</em> (replikacija) sprema <i>n</i> punih kopija objekta: troši <i>n</i> × prostora, podaci prežive ' +
        '<i>n</i> − 1 kvar, a za obnovu jedne kopije čita se jedna preživjela kopija. <em lang="en">Erasure coding</em> (kodiranje s brisanjem) dijeli ' +
        'objekt na <i>k</i> podatkovnih dijelova (<em lang="en">data shards</em>) i dodaje <i>m</i> zaštitnih (<em lang="en">coding shards</em>): troši (<i>k</i> + <i>m</i>)/<i>k</i> prostora i ' +
        'preživi <i>m</i> kvarova, ali za obnovu jednog dijela veličine S/<i>k</i> mora pročitati <i>k</i> dijelova. ' +
        'Za cijeli disk to je <i>k</i> puta više čitanja nego kod kopija.</p>' +
        '<p>Preživjeti kvar nije isto što i raditi kroz kvar: ispod <code>min_size</code> živih dijelova objekt je još ' +
        'cijel, ali čitanja i pisanja čekaju. Zadano je <i>k</i> + 1 za kodiranje (<i>k</i> kad je <i>m</i> = 1) i size − ⌊size/2⌋ za kopije. ' +
        '<code>min_size</code> = <i>k</i> drži U/I dulje, ali tada pisanje prolazi bez rezerve.</p>' +
        '<p>Isti udio nije ista sigurnost: 2+1, 4+2 i 6+3 imaju 67 % iskoristivog prostora, a preživljavaju 1, 2 i 3 kvara. Svaki dio ' +
        'mora biti na drugom poslužitelju (<em lang="en">failure domain</em>, domena kvara), pa 4+2 treba barem šest poslužitelja.</p>' +
        '<p>Na Ceph klasteru od 9 poslužitelja u 3 ormara, s 4+2 i 1024 grupe smještaja (<em lang="en">placement groups</em>), ispad jednog ormara zaustavlja ' +
        '271 grupu uz min_size 4, a 783 uz min_size 5.</p>'
    },
    en: {
      stage: 'One object, stored as replicas and with erasure coding, on a row of hosts',

      // controls
      scheme: 'Chosen scheme',
      schemeRep: 'replicas',
      schemeEc: 'erasure coding',
      n: 'Replicas n',
      k: 'Data shards k',
      m: 'Coding shards m',
      minSize: 'min_size of the chosen scheme',
      minDefault: 'default',
      minCustom: 'custom',
      minCustomVal: 'min_size',
      hosts: 'Hosts',
      failedCtl: 'Failed hosts',

      // presets
      pThree: 'Three copies',
      pThreeHint: '300 % raw, 33 % usable; data survives 2 failures, I/O stops after the second.',
      pEc42: 'EC 4+2, two failures',
      pEc42Hint: '150 % raw; with two hosts down the object is complete, but min_size 5 stops I/O.',
      pEc83: 'EC 8+3',
      pEc83Hint: '137.5 % raw, survives 3 failures, but needs 11 hosts and a rebuild reads 8 × as much.',
      pSame: 'Same hardware, 60 TiB',
      pSameHint: '60 TiB of data: three copies need 180 TiB of disk, 4+2 only 90 TiB.',
      pMinK: 'min_size = k',
      pMinKHint: '4+2 with min_size 4: I/O goes on after two failures, but without a single spare piece.',

      // legend
      legRep: 'full replica (R)',
      legData: 'data shard (d)',
      legCoding: 'coding shard (c)',
      legDown: 'failed host',
      legRebuild: 'rebuild: the new piece and what it reads',
      legStop: 'I/O stops',
      legChanged: 'changed by the last click',

      // grids
      hostHead: 'h{n}',
      hostDown: 'h{n}',
      hostAria: 'Host h{n}: {state}. Click to fail or restore it.',
      stateUp: 'up',
      stateDown: 'down',
      gridRep: 'Replicas {n}×',
      gridEc: 'Erasure coding {k}+{m}',
      tagCur: 'chosen',
      tagAlt: 'compared',
      metaRep: '{n} × {piece} = {raw} for an object of {obj}',
      metaEc: ['{w} piece of {piece} = {raw} for an object of {obj}', '{w} pieces of {piece} = {raw} for an object of {obj}'],
      rowPieces: 'pieces',
      rowRebuild: 'rebuild',
      asideLive: '{live} of {w} live',
      asideHoles: ['{n} piece has no host', '{n} pieces have no host'],
      rebuildNone: 'nothing to rebuild',
      rebuildLost: 'nothing to rebuild from',
      rebuildNoHost: 'no free host',
      rebuildText: 'reads {read} for {write}',
      stOk: '✓ every copy in place',
      stOkEc: '✓ every piece in place',
      stDegraded: 'I/O continues (min_size {min})',
      stStopped: 'I/O stops: {live} < min_size {min}',
      stLost: '✕ data lost: {live} < {need}',

      // table
      tblTitle: 'Comparison',
      tblRaw: 'Raw space',
      tblEff: 'Usable',
      tblPool: 'Disk for 60 TiB of data',
      tblSurvive: 'Failures, data intact',
      tblIo: 'Failures, I/O continues',
      tblRebuild: 'Rebuilding an 8 TB disk reads',
      tblHosts: 'Hosts needed',
      tblNow: 'Now',
      colCur: 'chosen',
      colAlt: 'compared',
      colTwin: 'same share',
      nowOk: 'clean',
      nowDegraded: 'degraded',
      nowStopped: 'I/O stops',
      nowLost: 'lost',

      // units
      mib: '{n} MiB',
      tib: '{n} TiB',
      tb: '{n} TB',
      pct: '{n} %',

      // captions
      cOkEc: 'Erasure coding {cur} uses {curPct} of raw space instead of {altPct} ({curPool} instead of {altPool} of disk for 60 TiB of data), but rebuilding one lost disk reads {times} as much data.',
      cOkRep: '{cur} replication uses {curPct} of raw space, {alt} uses {altPct}: for 60 TiB of data that is {curPool} instead of {altPool} of disk. Rebuilding an 8 TB disk reads {curRead} instead of {altRead}.',
      cDegraded: ['{f} host holding a piece is down: {name} has {live} of {w} pieces and I/O continues (min_size {min}).',
        '{f} hosts holding pieces are down: {name} has {live} of {w} pieces and I/O continues (min_size {min}).'],
      nRebuild: ['Rebuilding one piece reads {read} from {src} host to write {write}.',
        'Rebuilding one piece reads {read} from {src} hosts to write {write}.'],
      cHoles: '{name} needs {w} hosts and there are {hosts}: the pieces with no host are missing from the start.',
      sDegraded: 'The object starts degraded; I/O continues because {live} live ≥ min_size {min}.',
      sStopped: 'The object is complete, but I/O stops because {live} live < min_size {min}.',
      sLost: 'Only {live} are live and it needs at least {need}: the object cannot even be stored.',
      cStopped: ['{f} host holding a piece is down: the {name} object is still complete ({live} of {w} pieces, it needs {need}), but reads and writes stop, because min_size is {min}.',
        '{f} hosts holding pieces are down: the {name} object is still complete ({live} of {w} pieces, it needs {need}), but reads and writes stop, because min_size is {min}.'],
      cLost: '{live} of {w} pieces are left and {name} needs at least {need}: the object is lost ({miss} missing, it tolerates at most {tol}).',
      nHoles: 'The pieces with no host ({holes}) are missing from the start.',
      nNoMargin: 'min_size equals the pieces the data needs: a write is accepted with no spare piece, so after one more failure acknowledged data is unreadable until that disk returns, and lost if it does not.',
      nNoSpare: 'There is no free host to rebuild the piece on.',
      nTwin: ['{twin} has the same usable share ({eff}), but its data survives {tt} failure, not {t}.', '{twin} has the same usable share ({eff}), but its data survives {tt} failures, not {t}.'],

      explain: '<p>Replication stores <i>n</i> full copies of an object: it uses <i>n</i> × the space, the data ' +
        'survives <i>n</i> − 1 failures, and rebuilding one copy reads one surviving copy. Erasure coding cuts the ' +
        'object into <i>k</i> data shards and adds <i>m</i> coding shards: it uses (<i>k</i> + <i>m</i>)/<i>k</i> of the ' +
        'space and survives <i>m</i> failures, but rebuilding one shard of S/<i>k</i> has to read <i>k</i> shards. For a ' +
        'whole disk that is <i>k</i> times the reading of replication.</p>' +
        '<p>Surviving a failure is not the same as working through it: below <code>min_size</code> live pieces the object ' +
        'is still complete, but reads and writes wait. The default is <i>k</i> + 1 for erasure coding (<i>k</i> when <i>m</i> = 1) and ' +
        'size − ⌊size/2⌋ for replicas. <code>min_size</code> = <i>k</i> keeps I/O going longer, but then a write lands ' +
        'with no spare.</p>' +
        '<p>The same share is not the same safety: 2+1, 4+2 and 6+3 all have 67 % usable space and survive 1, 2 and 3 ' +
        'failures. Every piece must sit on another host (the failure domain), so 4+2 needs at least six hosts.</p>' +
        '<p>On a Ceph cluster of 9 hosts in 3 racks, with 4+2 and 1024 placement groups, losing one rack stops 271 groups ' +
        'with min_size 4 and 783 with min_size 5.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
