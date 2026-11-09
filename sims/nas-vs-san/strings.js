/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of nas-vs-san, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   Data (client letters, file names, LBAs, wire requests and replies) is not language: the page passes it as nodes with
   translate="no". Terms missing from kit/glossary.js are written out (NOTES.md, "Term pairs").
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Isti klijenti na spremištu na razini datoteka (NAS) i na razini blokova (SAN)',

      // the scene
      panelNas: 'NAS',
      panelNasSub: 'spremište na razini datoteka',
      panelSan: 'SAN',
      panelSanSub: 'spremište na razini blokova',
      client: 'Klijent {c}',
      server: 'Poslužitelj spremišta',
      target: 'Cilj: LUN 0',
      fsBox: 'Datotečni sustav',
      fsCached: 'datotečni sustav klijenta (predmemorija)',
      dirLabel: 'direktorij',
      bitmapLabel: 'zauzeti blokovi',
      locksLabel: 'zaključavanja',
      viewLabel: 'zadnji popis s poslužitelja',
      noFsHere: 'nema vlastitog datotečnog sustava',
      notMounted: 'nije montirano',
      emptyDir: 'prazno',
      reservedBy: 'trajna rezervacija: {c}',
      wire: 'Mreža',
      wireIdle: 'U ovom koraku nema poruka na mreži.',
      wireLocal: 'unutar poslužitelja, ne na mreži: {list}',
      disk: 'njegov disk od 16 blokova',
      lun: '16 numeriranih blokova',
      lostLabel: 'izgubljeno:',

      // legend
      lgFs: 'datotečni sustav',
      lgFileOp: 'zahtjev za datoteku',
      lgBlockOp: 'zahtjev za blok (LBA)',
      lgCached: 'u predmemoriji klijenta',
      lgConflict: 'blok u sukobu',
      lgRejected: 'odbijeno',
      lgChanged: 'promijenjeno u koraku',

      // params
      pMode: 'Prikaz',
      modeBoth: 'oboje',
      pRes: 'A drži trajnu rezervaciju',
      pResHint: 'Samo SAN: cilj odbija upise drugog inicijatora.',
      pOps: 'Tijek',
      btnFA: 'A formatira LUN',
      btnMA: 'A montira',
      btnMB: 'B montira',
      btnWA: 'A piše a.txt',
      btnWB: 'B piše b.txt',
      btnRA: 'A čita a.txt',
      btnLA: 'A ispisuje popis',
      btnUA: 'A ponovno montira',
      noteFull: 'Tijek je pun (20 koraka): vrati se korak unatrag pa dodaj.',

      // presets
      prNas: 'NAS: dva klijenta',
      prNasHint: 'A i B pišu svaki svoju datoteku; poslužitelj bira blokove.',
      prSan1: 'SAN: jedan klijent',
      prSan1Hint: 'A formatira LUN i piše: na mreži je samo WRITE LBA.',
      prSan2: 'SAN: dva klijenta',
      prSan2Hint: 'Isti posao na NAS-u i na SAN-u bez klasterskog datotečnog sustava.',
      prRes: 'SAN s rezervacijom',
      prResHint: 'A drži trajnu rezervaciju; B-ov upis se odbija.',

      // captions: the operation of the step
      capStart: 'Početak. Dva klijenta, jedan disk od 16 blokova. Pitanje je samo jedno: tko vodi datotečni sustav? Pritisni → za prvi korak.',
      capStartNas: 'Početak. Kod NAS-a datotečni sustav živi na poslužitelju: klijent traži datoteku po imenu, a poslužitelj odlučuje u koje blokove ide. Pritisni →.',
      capStartSan: 'Početak. Kod SAN-a cilj nudi samo numerirane blokove (LUN); datotečni sustav vodi svaki klijent sam. Pritisni →.',
      capStep: 'Korak {n}: {op}.',
      opf: '{c} formatira LUN',
      opm: '{c} montira',
      opw: '{c} piše {f}',
      opl: '{c} ispisuje popis',
      opr: '{c} čita {f}',
      opu: '{c} ponovno montira',

      // captions: NAS outcomes
      nNoDevice: 'klijent nema blokovnog uređaja za formatiranje; datotečni sustav već je na poslužitelju.',
      nAlready: '{c} je već montirao dijeljeni resurs.',
      nMounted: '{c} dobiva popis od poslužitelja: {files}. Klijent nema vlastitog datotečnog sustava.',
      nRemounted: '{c} ponovno pita poslužitelj i vidi: {files}.',
      nNotMounted: '{c} još nije montirao dijeljeni resurs.',
      nListed: 'poslužitelj šalje svoj jedini direktorij: {files}.',
      nRead: 'poslužitelj nalazi {f} u svom direktoriju (blok {lba}) i vraća podatke od {data}.',
      nNotFound: 'poslužitelj nema {f}.',
      nWrote: 'klijent šalje samo ime; poslužitelj sam bira blok {lba} i bilježi tko je datoteku otvorio.',
      nRewrote: 'poslužitelj prepisuje blok {lba}.',
      nFull: 'na disku nema slobodnog bloka.',

      // captions: SAN outcomes
      sFormatted: '{c} upisuje prazan datotečni sustav u LBA 0–2; cilj samo sprema blokove.',
      sBusy: '{c} je montirao LUN, pa ga ne može formatirati.',
      sConflict: 'cilj odbija WRITE LBA {lba}: RESERVATION CONFLICT, rezervaciju drži A. Datotečni sustav klijenta {c} odustaje i podaci ostaju čitavi.',
      sNotMounted: '{c} još nije montirao LUN.',
      sNoFs: 'na LUN-u još nema datotečnog sustava, samo prazni blokovi.',
      sMounted: '{c} čita LBA 0–2 i gradi vlastitu sliku datotečnog sustava: {files}.',
      sRemounted: '{c} odbacuje predmemoriju, ponovno čita LBA 0–2 i vidi: {files}.',
      sLost: 'Datoteka {f} je nestala: direktorij na disku (LBA 2) zadnji je upisao {w}.',
      sAlready: '{c} je već montirao LUN.',
      sFormatConflict: 'cilj odbija WRITE LBA 0–2: RESERVATION CONFLICT, rezervaciju drži A. LUN ostaje kakav je bio.',
      sListed: 'odgovara predmemorija klijenta {c}, bez ijedne poruke na mreži: {files}.',
      sRead: '{c} u svojoj predmemoriji nalazi {f} u LBA {lba} i dobiva podatke od {data}.',
      sReadWrong: 'Tuđi podaci, a nitko nije javio grešku.',
      sNotFound: '{c} u svojoj predmemoriji nema {f}.',
      sWrote: '{c} sam bira LBA {lba} iz svoje bit tablice i šalje WRITE LBA {lba}, 1, 2.',
      sNoIdea: 'Cilj ne zna da je to datoteka.',
      sRewrote: '{c} prepisuje LBA {lba}.',
      sFull: 'u bit tablici klijenta {c} nema slobodnog bloka.',
      sClash: 'Dva klijenta, jedan LUN, dvije privatne slike slobodnih blokova: oba su izabrala blok {lba}.',

      explain: '<p><b>NAS</b> (<em lang="en">file-level storage</em>, spremište na razini datoteka): [[file system]] živi na ' +
        'poslužitelju. Klijent pristupa kroz [[share]]: obavi [[mounting]] i šalje operacije nad datotekama po imenu ' +
        '(<code>write a.txt</code>). Poslužitelj sam bira blokove u svojoj bit tablici, drži jedan [[directory]] i sva ' +
        'zaključavanja. Zato svaki klijent vidi svaku datoteku i nijedan ne može zauzeti tuđi blok.</p>' +
        '<p><b>SAN</b> (<em lang="en">block-level storage</em>, spremište na razini blokova): [[target]] izvozi ' +
        '[[block device]], <em lang="en">LUN</em> (logička jedinica) s numeriranim blokovima, i vidi samo <code>READ</code> i ' +
        '<code>WRITE LBA n</code>. Datotečni sustav vodi klijent (<em lang="en">initiator</em>, inicijator); direktorij i bit ' +
        'tablicu čuva kod sebe, a to je njegova [[cache]]. Dva klijenta s običnim datotečnim sustavom na istom LUN-u imaju dvije ' +
        'privatne bit tablice: obje kažu da je blok 10 slobodan, posljednji upis pobjeđuje, a grešku ne javlja nitko.</p>' +
        '<p>Dijeliti LUN je sigurno samo uz <em lang="en">cluster file system</em> (klasterski datotečni sustav, sa zajedničkim ' +
        'upraviteljem zaključavanja) ili uz isključiv pristup. <em lang="en">Persistent reservation</em> (trajna rezervacija) ' +
        'tjera cilj da upise drugog inicijatora odbije sa statusom RESERVATION CONFLICT.</p>' +
        '<p><b>Zablude.</b> LUN nije dijeljeni resurs. Dva poslužitelja ne mogu sigurno dijeliti isti iSCSI disk kao NFS izvoz. ' +
        '„NAS je spor, SAN je brz” promašuje bit: razlika je u tome tko vodi datotečni sustav, a ne u brzini.</p>'
    },
    en: {
      stage: 'The same clients on file-level storage (NAS) and on block-level storage (SAN)',

      panelNas: 'NAS',
      panelNasSub: 'file-level storage',
      panelSan: 'SAN',
      panelSanSub: 'block-level storage',
      client: 'Client {c}',
      server: 'Storage server',
      target: 'Target: LUN 0',
      fsBox: 'Filesystem',
      fsCached: 'the client\'s filesystem (cached)',
      dirLabel: 'directory',
      bitmapLabel: 'used blocks',
      locksLabel: 'locks',
      viewLabel: 'last listing from the server',
      noFsHere: 'no filesystem of its own',
      notMounted: 'not mounted',
      emptyDir: 'empty',
      reservedBy: 'persistent reservation: {c}',
      wire: 'Network',
      wireIdle: 'No messages on the network in this step.',
      wireLocal: 'inside the server, not on the network: {list}',
      disk: 'its disk of 16 blocks',
      lun: '16 numbered blocks',
      lostLabel: 'lost:',

      lgFs: 'filesystem',
      lgFileOp: 'file operation',
      lgBlockOp: 'block operation (LBA)',
      lgCached: 'the client\'s cached view',
      lgConflict: 'conflicting block',
      lgRejected: 'rejected',
      lgChanged: 'changed in this step',

      pMode: 'Show',
      modeBoth: 'both',
      pRes: 'A holds a persistent reservation',
      pResHint: 'SAN only: the target rejects the other initiator\'s writes.',
      pOps: 'Run',
      btnFA: 'A formats the LUN',
      btnMA: 'A mounts',
      btnMB: 'B mounts',
      btnWA: 'A writes a.txt',
      btnWB: 'B writes b.txt',
      btnRA: 'A reads a.txt',
      btnLA: 'A lists',
      btnUA: 'Remount A',
      noteFull: 'The run is full (20 steps): step back, then add.',

      prNas: 'NAS: two clients',
      prNasHint: 'A and B each write a file; the server picks the blocks.',
      prSan1: 'SAN: one client',
      prSan1Hint: 'A formats the LUN and writes: the network carries only WRITE LBA.',
      prSan2: 'SAN: two clients',
      prSan2Hint: 'The same work on NAS and on SAN without a cluster filesystem.',
      prRes: 'SAN with a reservation',
      prResHint: 'A holds a persistent reservation; B\'s write is rejected.',

      capStart: 'Start. Two clients, one disk of 16 blocks. Only one question: who runs the filesystem? Press → for the first step.',
      capStartNas: 'Start. With NAS the filesystem lives on the server: the client asks for a file by name, and the server decides which blocks it goes to. Press →.',
      capStartSan: 'Start. With SAN the target offers only numbered blocks (a LUN); each client runs the filesystem itself. Press →.',
      capStep: 'Step {n}: {op}.',
      opf: '{c} formats the LUN',
      opm: '{c} mounts',
      opw: '{c} writes {f}',
      opl: '{c} lists',
      opr: '{c} reads {f}',
      opu: '{c} remounts',

      nNoDevice: 'the client has no block device to format; the filesystem is already on the server.',
      nAlready: '{c} has already mounted the share.',
      nMounted: '{c} gets the listing from the server: {files}. The client has no filesystem of its own.',
      nRemounted: '{c} asks the server again and sees: {files}.',
      nNotMounted: '{c} has not mounted the share yet.',
      nListed: 'the server sends its one directory: {files}.',
      nRead: 'the server finds {f} in its directory (block {lba}) and returns the data from {data}.',
      nNotFound: 'the server has no {f}.',
      nWrote: 'the client sends only a name; the server itself picks block {lba} and records who has the file open.',
      nRewrote: 'the server rewrites block {lba}.',
      nFull: 'the disk has no free block.',

      sFormatted: '{c} writes an empty filesystem to LBA 0–2; the target just stores the blocks.',
      sBusy: '{c} has the LUN mounted, so it cannot format it.',
      sConflict: 'the target rejects WRITE LBA {lba}: RESERVATION CONFLICT, A holds the reservation. Client {c}\'s filesystem gives up and the data stays intact.',
      sNotMounted: '{c} has not mounted the LUN yet.',
      sNoFs: 'the LUN has no filesystem yet, only empty blocks.',
      sMounted: '{c} reads LBA 0–2 and builds its own picture of the filesystem: {files}.',
      sRemounted: '{c} drops its cache, reads LBA 0–2 again and sees: {files}.',
      sLost: '{f} is gone: the directory on disk (LBA 2) was last written by {w}.',
      sAlready: '{c} has already mounted the LUN.',
      sFormatConflict: 'the target rejects WRITE LBA 0–2: RESERVATION CONFLICT, A holds the reservation. The LUN stays as it was.',
      sListed: 'client {c}\'s cache answers, with no message on the network: {files}.',
      sRead: '{c} finds {f} at LBA {lba} in its own cache and gets the data from {data}.',
      sReadWrong: 'Someone else\'s data, and nobody reported an error.',
      sNotFound: '{c} has no {f} in its cache.',
      sWrote: '{c} itself picks LBA {lba} from its own bitmap and sends WRITE LBA {lba}, 1, 2.',
      sNoIdea: 'The target has no idea it is a file.',
      sRewrote: '{c} rewrites LBA {lba}.',
      sFull: 'client {c}\'s bitmap has no free block.',
      sClash: 'Two clients, one LUN, two private ideas of which blocks are free: both chose block {lba}.',

      explain: '<p><b>NAS</b> (file-level storage): the [[file system]] lives on the server. The client mounts a [[share]] ' +
        'and sends file operations by name (<code>write a.txt</code>); the server picks the blocks from its own bitmap ' +
        'and keeps one [[directory]] and the locks. So every client sees every file, and none can take another\'s block.</p>' +
        '<p><b>SAN</b> (block-level storage): the [[target]] exports a [[block device]], a LUN (logical unit) of numbered ' +
        'blocks, and sees only <code>READ</code> and <code>WRITE LBA n</code>. The client (the initiator) runs the filesystem ' +
        'and keeps the directory and the bitmap in its [[cache]]. Two clients with an ordinary filesystem on one LUN have two ' +
        'private bitmaps: both say block 10 is free, the last write wins, and nobody reports an error.</p>' +
        '<p>Sharing a LUN is safe only with a cluster file system (a shared lock manager) or with exclusive access. A ' +
        'persistent reservation makes the target reject the other initiator\'s writes with the status RESERVATION CONFLICT.</p>' +
        '<p><b>Misconceptions.</b> A LUN is not a network share. Two servers cannot safely share one iSCSI disk like an NFS export. ' +
        '"NAS is slow, SAN is fast" misses the point: the difference is who runs the filesystem, not speed.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
