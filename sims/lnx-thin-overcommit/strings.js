/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-thin-overcommit, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is
   plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   Terms not in kit/glossary.js yet (thin provisioning, thin pool, overcommit, discard) are written out in the
   explanation: NOTES.md "Term pairs". Volume names and sizes are data and come in as placeholders.
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tanki bazen kao mreža ćelija od 1 GiB, Data% bazena, obećano i stvarno, i traka po tankom volumenu',
      gib: '{n} GiB',
      pct: '{p} %',

      // params
      pool: 'Veličina bazena',
      n: 'Broj tankih volumena',
      virt: 'Veličina svakog volumena',
      w1: 'thin1 piše',
      w2: 'thin2 piše',
      w3: 'thin3 piše',
      w4: 'thin4 piše',
      autoextend: 'Automatsko proširenje',
      threshold: 'Prag',
      percent: 'Raste za',
      vgFree: 'Slobodno u grupi volumena',
      deleted1: 'thin1 briše',
      discard: 'Odbacivanje blokova (discard)',
      errorWhenFull: 'Pogreška bez čekanja',

      // presets
      pOk: 'Sve stane',
      pOkHint: 'Tri volumena po 50 GiB u bazenu od 100 GiB; svaki piše 20 GiB i sve stane.',
      pFills: 'Jedan napuni bazen',
      pFillsHint: 'thin1 i thin2 pišu mnogo; thin3 ostaje bez mjesta, iako mu datotečni sustav pokazuje 40 GiB slobodno.',
      pAuto: 'Proširenje',
      pAutoHint: 'Prag 70 %, +20 %, u grupi volumena 50 GiB: bazen naraste dvaput, treći put nema dovoljno.',
      pDeleted: 'Obrisano',
      pDeletedHint: 'thin1 briše 30 GiB datoteka; bazen ih i dalje drži. Uključi odbacivanje blokova.',
      pError: 'Pogreška',
      pErrorHint: 'Kao „Jedan napuni bazen”, ali odbijeno pisanje pada odmah, bez čekanja.',

      // legend
      legOwned: 'ćelija volumena',
      legFree: 'slobodna ćelija',
      legKept: 'obrisano, još u bazenu',
      legPromised: 'obećano, nepokriveno',
      legRefused: 'odbijeno',
      legQueued: 'čeka',
      legThreshold: 'prag',
      legChanged: 'promijenjeno',

      // the pool grid
      poolTitle: 'Tanki bazen',
      cellNote: '1 ćelija = 1 GiB',
      poolCount: 'Data% {p} · {used} od {size} GiB',
      poolRow: 'bazen',
      extRow: '+{p} %',
      vgLine: 'Slobodno u grupi volumena: {vg}',

      // meters and the banner
      mData: 'Data%',
      mTick: 'prag {p} %',
      mPromised: 'obećano',
      banner: 'obećano {promised} / stvarno {real}',
      warn: 'LVM je upozorio: zbroj veličina tankih volumena veći je od bazena.',
      noWarn: 'Zbroj veličina tankih volumena stane u bazen.',

      // the volume bars
      volTitle: 'Tanki volumeni',
      volSize: 'veličina {v}',
      volFs: 'DS: zauzeto {used}, slobodno {free}',
      volPool: 'u bazenu {a} (Data% {p})',
      volKept: 'obrisano, a još u bazenu: {k}',
      volRefused: '✕ odbijeno {r}',
      volQueued: '⏱ čeka {r}',

      // captions
      cFits: 'Obećano je {promised}, a bazen ima {real}. Upisano je {used}, pa je bazen popunjen {p}: svi su zadovoljni, dok god stvarni zapisi stanu u bazen.',
      cNoOvercommit: 'Obećano je {promised}, a bazen ima {real}: obećanja stanu u bazen, pa se on ne može napuniti. Upisano je {used} ({p}).',
      cFullNow: 'Bazen je točno pun ({used} od {real}). Sljedeći novi blok bilo kojeg volumena bit će odbijen.',
      cFullQueue: 'Bazen je pun. {lv} vjeruje da ima {free} slobodno, ali za svaki novi blok treba mjesto u bazenu, kojega više nema — pisanje čeka 60 sekundi, a onda pada.',
      cFullError: 'Bazen je pun. {lv} vjeruje da ima {free} slobodno, ali za svaki novi blok treba mjesto u bazenu, kojega više nema — pisanje pada odmah, bez čekanja.',
      cWasFullQueue: 'Bazen se bio napunio: {lv} je vjerovao da ima {free} slobodno, ali za nove blokove nije bilo mjesta u bazenu — pisanje je čekalo 60 sekundi, a onda palo.',
      cWasFullError: 'Bazen se bio napunio: {lv} je vjerovao da ima {free} slobodno, ali za nove blokove nije bilo mjesta u bazenu — pisanje je palo odmah, bez čekanja.',
      cFullExact: 'Bazen je pun ({used} od {real}), ali i svaki volumen je pun do svoje veličine: obećano je točno koliko bazen ima, pa nitko ne ostaje bez mjesta.',
      nAlsoRefused: ['I {lvs} ostaje bez mjesta.', 'I {lvs} ostaju bez mjesta.', 'I {lvs} ostaju bez mjesta.'],
      nRewrite: 'Čitanje i prepisivanje već dodijeljenih blokova rade, ali datotečni sustav nakon pogrešaka pisanja obično prelazi samo na čitanje.',
      nKept: 'thin1 je obrisao datoteke, ali bazen i dalje drži {d}: bez odbacivanja blokova bazen ne zna da su slobodni.',
      nDiscarded: 'Odbacivanje blokova vratilo je bazenu {d} koje je thin1 obrisao; sljedeći volumeni ih ponovno koriste.',
      nDiscardedOnly: 'Odbacivanje blokova vratilo je bazenu {d} koje je thin1 obrisao.',
      nGrew: ['Bazen je automatski narastao {n} put, na {size}.', 'Bazen je automatski narastao {n} puta, na {size}.', 'Bazen je automatski narastao {n} puta, na {size}.'],
      nShort: 'Pri {at} prag je prijeđen, ali proširenje treba {want}, a grupa volumena ima {vg}: bazen ne raste.',
      nGrewShort: ['Bazen je automatski narastao {n} put, na {size}; zatim treba {want}, a grupa volumena ima {vg}: više ne raste.', 'Bazen je automatski narastao {n} puta, na {size}; zatim treba {want}, a grupa volumena ima {vg}: više ne raste.', 'Bazen je automatski narastao {n} puta, na {size}; zatim treba {want}, a grupa volumena ima {vg}: više ne raste.'],
      and: ' i ',

      explain:
        '<p><em lang="en">Thin provisioning</em> (tanko dodjeljivanje): tanki [[logical volume]] ima samo obećanu ' +
        'veličinu. Prostor mu daje zajednički tanki bazen (<em lang="en">thin pool</em>), i to tek kad se blok prvi put ' +
        'upiše; bazenu prostor daje [[volume group]]. Zato zbroj veličina volumena smije biti veći od bazena ' +
        '(<em lang="en">overcommit</em>, prekomjerno dodjeljivanje); LVM upozorava, ali dopušta.</p>' +
        '<p><code translate="no">lvs</code> pokazuje Data% bazena (zauzeto prema veličini bazena) i Data% svakog volumena ' +
        '(prema njegovoj obećanoj veličini). Kad se bazen napuni, novi blok ne može dobiti nijedan volumen, ma koliko ' +
        'slobodnog prostora pokazivao njegov [[file system]]. Pisanje čeka do 60 sekundi da bazen naraste, a onda pada; ' +
        's <code translate="no">--errorwhenfull y</code> pada odmah. Čitanje i prepisivanje već dodijeljenih blokova rade ' +
        'dalje, ali datotečni sustav koji dobije pogreške pisanja obično prelazi samo na čitanje, a nespremljeni podaci ' +
        'mogu se izgubiti. LVM u dnevnik sustava upozorava pri 80, 85, 90 i 95 % popunjenosti bazena. Automatsko proširenje (<code translate="no">thin_pool_autoextend_threshold</code> i ' +
        '<code translate="no">_percent</code> u <code translate="no">lvm.conf</code>, uz nadzor LVM-a) povećava bazen iz ' +
        'slobodnog prostora grupe volumena, ali samo dok ga ima.</p>' +
        '<p>Brisanje datoteka ne vraća prostor bazenu: datotečni sustav zna da su blokovi slobodni, bazen ne. Vraća ga tek ' +
        'odbacivanje blokova (<em lang="en">discard</em>: <code translate="no">fstrim</code> ili opcija montiranja ' +
        '<code translate="no">discard</code>).</p>' +
        '<p>Česte zablude: slobodan prostor u datotečnom sustavu nije stvaran prostor; brisanje datoteka ne oslobađa ' +
        'bazen; volumen koji se napuni ne šteti samo sebi, nego svima u bazenu.</p>' +
        '<p>Pojednostavljeno: blok je ovdje 1 GiB (stvarni su 64 KiB i više); volumeni pišu jedan za drugim, pa bazen ' +
        'napuni posljednji (u stvarnosti se pisanja isprepliću); proširenje se provjerava nakon svakog bloka, a stvarni nadzor ' +
        'periodički. Metapodaci bazena (i oni se mogu napuniti, s još gorim posljedicama) i tanke snimke nisu prikazani.</p>'
    },

    en: {
      stage: 'The thin pool as a grid of 1-GiB cells, the pool\'s Data%, promised against real, and a bar per thin volume',
      gib: '{n} GiB',
      pct: '{p}%',

      // params
      pool: 'Pool size',
      n: 'Thin volumes',
      virt: 'Size of each volume',
      w1: 'thin1 writes',
      w2: 'thin2 writes',
      w3: 'thin3 writes',
      w4: 'thin4 writes',
      autoextend: 'Autoextend',
      threshold: 'Threshold',
      percent: 'Grow by',
      vgFree: 'Free in the volume group',
      deleted1: 'thin1 deletes',
      discard: 'Discard',
      errorWhenFull: 'Error without waiting',

      // presets
      pOk: 'All fits',
      pOkHint: 'Three 50-GiB volumes in a 100-GiB pool; each writes 20 GiB and everything fits.',
      pFills: 'One fills the pool',
      pFillsHint: 'thin1 and thin2 write a lot; thin3 runs out of room although its filesystem shows 40 GiB free.',
      pAuto: 'Autoextend',
      pAutoHint: 'Threshold 70%, +20%, 50 GiB free in the volume group: the pool grows twice, the third time there is not enough.',
      pDeleted: 'Deleted',
      pDeletedHint: 'thin1 deletes 30 GiB of files; the pool still holds them. Turn discard on.',
      pError: 'Error at once',
      pErrorHint: 'As "One fills the pool", but a refused write fails at once, without waiting.',

      // legend
      legOwned: 'a volume\'s cell',
      legFree: 'free cell',
      legKept: 'deleted, still in the pool',
      legPromised: 'promised, unbacked',
      legRefused: 'refused',
      legQueued: 'queued',
      legThreshold: 'threshold',
      legChanged: 'changed',

      // the pool grid
      poolTitle: 'Thin pool',
      cellNote: '1 cell = 1 GiB',
      poolCount: 'Data% {p} · {used} of {size} GiB',
      poolRow: 'pool',
      extRow: '+{p}%',
      vgLine: 'Free in the volume group: {vg}',

      // meters and the banner
      mData: 'Data%',
      mTick: 'threshold {p}%',
      mPromised: 'promised',
      banner: 'promised {promised} / real {real}',
      warn: 'LVM warned: the thin volumes\' sizes add up to more than the pool.',
      noWarn: 'The thin volumes\' sizes fit in the pool.',

      // the volume bars
      volTitle: 'Thin volumes',
      volSize: 'size {v}',
      volFs: 'FS: used {used}, free {free}',
      volPool: 'in the pool {a} (Data% {p})',
      volKept: 'deleted, still in the pool: {k}',
      volRefused: '✕ refused {r}',
      volQueued: '⏱ queued {r}',

      // captions
      cFits: '{promised} is promised and the pool has {real}. {used} is written, so the pool is {p} full: everyone is fine, as long as what is really written fits in the pool.',
      cNoOvercommit: '{promised} is promised and the pool has {real}: the promises fit in the pool, so it cannot fill. {used} is written ({p}).',
      cFullNow: 'The pool is exactly full ({used} of {real}). The next new block of any volume will be refused.',
      cFullQueue: 'The pool is full. {lv} believes it has {free} free, but every new block needs room in the pool, and there is none — the write waits 60 seconds, then fails.',
      cFullError: 'The pool is full. {lv} believes it has {free} free, but every new block needs room in the pool, and there is none — the write fails at once, without waiting.',
      cWasFullQueue: 'The pool had filled: {lv} believed it had {free} free, but new blocks found no room in the pool — the write waited 60 seconds, then failed.',
      cWasFullError: 'The pool had filled: {lv} believed it had {free} free, but new blocks found no room in the pool — the write failed at once, without waiting.',
      cFullExact: 'The pool is full ({used} of {real}), but so is every volume, to its own size: exactly what the pool holds was promised, so nobody runs out of room.',
      nAlsoRefused: ['Writes to {lvs} are refused too.', 'Writes to {lvs} are refused too.'],
      nRewrite: 'Reading and rewriting blocks already allocated still work, but a filesystem that gets write errors usually goes read-only.',
      nKept: 'thin1 deleted files, but the pool still holds {d}: without discard the pool does not know they are free.',
      nDiscarded: 'Discard gave the pool back the {d} thin1 deleted; the next volumes reuse it.',
      nDiscardedOnly: 'Discard gave the pool back the {d} thin1 deleted.',
      nGrew: ['The pool autoextended {n} time, to {size}.', 'The pool autoextended {n} times, to {size}.'],
      nShort: 'At {at} the threshold was crossed, but growing needs {want} and the volume group has {vg}: the pool does not grow.',
      nGrewShort: ['The pool autoextended {n} time, to {size}; then it needs {want} and the volume group has {vg}: it grows no more.', 'The pool autoextended {n} times, to {size}; then it needs {want} and the volume group has {vg}: it grows no more.'],
      and: ' and ',

      explain:
        '<p>Thin provisioning: a thin [[logical volume]] has only a promised size. Its space comes from a shared thin ' +
        'pool in the [[volume group]], and only when a block is first written. So the volumes\' sizes may add up to ' +
        'more than the pool (overcommit); LVM warns, but allows it.</p>' +
        '<p><code translate="no">lvs</code> shows the pool\'s Data% (used against the pool\'s size) and each volume\'s ' +
        'Data% (against its promised size). When the pool is full, no volume can get a new block, however much free ' +
        'space its [[file system]] shows. The write waits up to 60 seconds for the pool to grow, then fails; with ' +
        '<code translate="no">--errorwhenfull y</code> it fails at once. Reading and rewriting blocks already ' +
        'allocated go on, but a filesystem that gets write errors usually goes read-only, and unsaved data can be lost. ' +
        'LVM warns in the system log at 80, 85, 90 and 95% pool use. Autoextend (<code translate="no">thin_pool_autoextend_threshold</code> and ' +
        '<code translate="no">_percent</code> in <code translate="no">lvm.conf</code>, with LVM monitoring on) grows the ' +
        'pool from the volume group\'s free space, but only while there is some.</p>' +
        '<p>Deleting files does not give space back to the pool: the filesystem knows the blocks are free, the pool does ' +
        'not. Only discard does (<code translate="no">fstrim</code>, or the <code translate="no">discard</code> mount ' +
        'option).</p>' +
        '<p>Common mistakes: a filesystem\'s free space is not real space; deleting files does not free the pool; a ' +
        'volume that fills up hurts not only itself but everyone in the pool.</p>' +
        '<p>Simplified: a block here is 1 GiB (real ones are 64 KiB and up); the volumes write one after another, so the ' +
        'last one fills the pool (real writers interleave); autoextend is checked after every block, while real ' +
        'monitoring checks periodically. Pool metadata (which can fill too, and worse) and thin snapshots are not ' +
        'shown.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
