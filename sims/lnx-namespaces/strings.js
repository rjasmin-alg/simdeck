/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-namespaces, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (in captions a node: PIDs, commands and paths are data), [[term]] a glossary term (first
   mention; [[=term]] later ones). In captions *word* is an English word in italics and `x` is code.
   namespace, container and PID are not in the glossary yet: their pairs are written out (NOTES.md, term pairs).
   The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Pogled domaćina i pogled kontejnera: procesi, mrežna sučelja i montiranja, nad jednom jezgrom',
      // panel
      scene: 'Primjer',
      view: 'Pogled',
      viewBoth: 'oba',
      viewHost: 'domaćin',
      viewContainer: 'kontejner',
      viewHint: 'Prikazuje samo jednu ploču, veću, za projektor; korak ostaje.',
      pFull: 'Kontejner je proces',
      pFullHint: 'unshare s novim PID, mrežnim i imenskim prostorom montiranja; usporedba dvaju pogleda.',
      pNoProc: 'ps bez novog /proc',
      pNoProcHint: 'echo $$ kaže 1, a ps ipak ispisuje procese domaćina.',
      pNoFork: 'unshare bez --fork',
      pNoForkHint: 'Ljuska ostaje vani; prvi proces koji pokrene postaje PID 1.',
      pKillInit: 'Kad PID 1 umre',
      pKillInitHint: 'Iznutra se PID 1 ne da ubiti; izvana SIGKILL ruši cijeli imenski prostor.',
      pOneWay: 'Izolacija u jednom smjeru',
      pOneWayHint: 'Kontejner ne vidi domaćina, domaćin vidi kontejner.',
      // legend
      legHost: 'imenski prostor domaćina',
      legC: 'imenski prostor kontejnera',
      legPair: 'PID domaćina / PID u kontejneru',
      legRan: 'izvršio se i završio',
      legGone: 'nestalo',
      legChanged: 'promijenjeno',
      // the command strip
      sideHost: 'domaćin · terminal {n}',
      sideC: 'kontejner',
      before: '(prije prve naredbe)',
      noOutput: '(ništa nije ispisano)',
      // the panels
      panelHost: 'Pogled domaćina',
      panelC: 'Pogled kontejnera',
      secProcs: 'Procesi',
      secIfaces: 'Mrežna sučelja',
      secMounts: 'Montiranja',
      shared: 'isti kao kod domaćina',
      procFrom: '/proc prikazuje PID-ove iz: {ns}',
      nsHost: 'domaćin',
      nsC: 'kontejner',
      self: 'ova ljuska: $$ = {pid}',
      noContainer: 'Kontejnera još nema.',
      containerGone: 'Kontejnera više nema: nijedan proces više ne drži njegove imenske prostore.',
      tagRan: 'izvršio se',
      tagGone: 'nestao',
      tagNext: 'djeca → {ns}',
      up: 'uključeno',
      down: 'isključeno',
      pidsOf: 'PID-ovi iz: {ns}',
      // the kernel bar
      kernel: 'Jedna jezgra',
      kindPid: 'PID',
      kindNet: 'mreža',
      kindMnt: 'montiranja',
      nsInit: 'PID 1: {name}',
      nsNoProc: 'još bez procesa',
      nsClosed: 'PID 1 je završio: fork ne uspijeva',
      nsGone: 'nestao',
      // captions: the start
      capStart: 'Domaćin ima `systemd` (PID 1) i dvije ljuske, 4200 i 4300. Svaki [[process]] ima tri *namespace* (imenski prostor): PID, mrežni i imenski prostor montiranja; zasad su sva tri domaćinova.',
      capGoal_full: 'Terminal 1 pokreće kontejner s tri nova imenska prostora: PID, mrežnim i prostorom montiranja.',
      'capGoal_no-mount-proc': 'Terminal 1 pokreće kontejner samo s novim PID imenskim prostorom, bez novog /proc.',
      'capGoal_no-fork': 'Terminal 1 pokreće `unshare --pid` bez `--fork`.',
      'capGoal_kill-init': 'Terminal 1 pokreće kontejner; zatim se signali šalju njegovu PID-u 1 iznutra i izvana.',
      'capGoal_one-way': 'Terminal 1 pokreće kontejner; zatim kill iz kontejnera prema domaćinu i obratno.',
      // captions: unshare
      capUnshare: '`unshare` je stvorio novi PID *namespace* (imenski prostor): nova je ljuska unutra PID 1, a domaćin isti proces vidi kao {host}.',
      capAgain: 'Ovaj put s `--fork`:',
      capUnshareNet: 'Novi mrežni imenski prostor ima samo lo, i to isključen.',
      capUnshareMnt: 'Novi imenski prostor montiranja počinje kao kopija tablice domaćina, a preko /proc montiran je svjež /proc za novi PID imenski prostor.',
      capUnshareNoProc: 'Novog imenskog prostora montiranja nema, pa je /proc i dalje domaćinov.',
      capUnshareProc: 'Sad s `--mount-proc`: novi imenski prostor montiranja i svjež /proc, pa kontejner vidi samo svoju ljusku, PID 1. Mreža je i dalje domaćinova.',
      capUnshareNoFork: '`unshare` je stvorio novi PID *namespace* (imenski prostor), ali nije ušao u njega: kod PID imenskog prostora unshare samo određuje kamo će ići djeca pozivatelja. Bez `--fork` pokrenuo je bash u istom procesu (`--norc`: bez startnih datoteka, koje bi i same pokretale procese), pa je ljuska i dalje {pid} u imenskom prostoru domaćina.',
      // captions: commands
      capEchoInit: '`echo $$` ispisuje PID ljuske u njezinu vlastitom imenskom prostoru: 1. Unutra je ljuska [[init process]].',
      capEchoHost: '`echo $$` ispisuje {pid}: ljuska je ostala u PID imenskom prostoru domaćina.',
      capPsOwn: '`ps` čita /proc, a ovaj /proc pripada PID imenskom prostoru kontejnera: ispisuje samo procese kontejnera, numerirane od 1, i sebe među njima. Domaćin isti `ps` vidi kao {host}.',
      capPsHost: '`ps` čita /proc, a /proc je i dalje domaćinov: ispisuje sve procese domaćina, PID 1 je `systemd`, a sama ljuska je {host}, iako je `echo $$` ispisao 1. Za izolirani `ps` treba novi imenski prostor montiranja i svjež /proc.',
      capPsAfter: '`sleep` je nestao, a `ps` je dobio PID {pid}: PID-ovi se dodjeljuju redom, a oslobođeni se ne koriste odmah ponovno.',
      capIpC: '`ip` u kontejneru: samo lo, i to isključen. Domaćinova eth0 ovdje nema; novi mrežni imenski prostor počinje samo s vlastitim lo.',
      capIpH: 'Na domaćinu `ip` i dalje pokazuje lo i eth0: stvaranje imenskog prostora domaćinu nije ništa oduzelo.',
      capMount: '`mount` u kontejneru dodao je /mnt samo u tablicu montiranja kontejnera. Tablica je počela kao kopija domaćinove, s privatnom propagacijom, *propagation* (širenje montiranja).',
      capFindC: '`findmnt /mnt` u kontejneru nalazi tmpfs.',
      capFindH: '`findmnt /mnt` na domaćinu ne ispisuje ništa: montiranje je ostalo u imenskom prostoru montiranja kontejnera.',
      capExitInit: 'Ljuska, PID 1 kontejnera, završila je. `unshare` ju je čekao pa je završio i on. Bez ijednog procesa u njima nestali su imenski prostori kontejnera: {kinds}. Domaćin ispisuje samo ono što je ispisivao na početku.',
      capExitInitPid: 'Ljuska, PID 1 kontejnera, završila je. `unshare` ju je čekao pa je završio i on. Bez ijednog procesa u njemu nestao je PID imenski prostor kontejnera. Domaćin ispisuje samo ono što je ispisivao na početku.',
      capExitNoFork: 'bash je završio. Zatvoreni PID imenski prostor više nitko ne drži, pa je nestao.',
      capLsInit: '`ls` je prvi proces stvoren u novom imenskom prostoru, pa je ondje dobio PID 1 (na domaćinu {host}) i postao njegov init. Odmah je završio pa imenski prostor sada nema PID 1.',
      capForkFail: '`fork` nije uspio (ENOMEM): kad PID 1 nekog imenskog prostora završi, u njemu se više ne može stvoriti nijedan proces. Sam bash i dalje radi, ali ne može pokrenuti nijednu vanjsku naredbu.',
      capBg: '`sleep` radi u pozadini: unutra PID {inner}, na domaćinu {host}. Jedan proces, dva broja.',
      capKillUsr: '`kill -USR1 1` iznutra: proces koji za SIGUSR1 nema [[handler]] inače od njega umire, ali PID 1 iz vlastitog imenskog prostora prima samo signale za koje ima obrađivač, a bash ga za SIGUSR1 nema. Signal je odbačen; ništa se nije promijenilo.',
      capKillIgnored: 'Signal je zanemaren: interaktivni bash zanemaruje SIGTERM, bio PID 1 ili ne.',
      capKillKill: 'Ni SIGKILL: za njega obrađivač ne može postojati, pa iznutra nikad ne stiže do PID-a 1.',
      capKillDropped: 'Signal je odbačen: PID 1 prima samo signale za koje ima obrađivač.',
      capKillInit: 'S domaćina SIGKILL prema {host} uvijek stiže. PID 1 je završio, pa je jezgra poslala SIGKILL svim ostalim procesima u tom imenskom prostoru. Završio je i `unshare`, a imenski prostori su nestali.',
      capKillNoSuchC: '{cmd} iz kontejnera: takvog procesa nema. {pid} je PID domaćina, a procesi domaćina u imenskom prostoru kontejnera nemaju broj.',
      capKillNoSuchH: '{cmd}: takvog procesa nema. Jezgra je sleep ubila zajedno s PID-om 1 njegova imenskog prostora.',
      capKillHost: 'S domaćina {cmd} stiže do sleepa u kontejneru (unutra PID {inner}): roditeljski imenski prostor vidi procese podređenog i šalje im signale. Izolacija ide u jednom smjeru.',
      capKilled: 'Signal je stigao i proces je završio.',
      capErr: 'Naredba nije uspjela i ništa se nije promijenilo.',
      kindsPid: 'PID',
      kindsNet: 'mrežni',
      kindsMnt: 'montiranja',
      explain: '<p><em lang="en">Container</em> (kontejner) nije mali [[virtual machine]] s vlastitom jezgrom. To je obično stablo ' +
        'procesa, a [[kernel]] ista je za njega i za domaćina: ona ga samo drži u zasebnim imenskim prostorima, ' +
        '<em lang="en">namespace</em> (imenski prostor). Ova stranica pokazuje tri: PID, mrežni i imenski prostor montiranja.</p>' +
        '<p><b>PID.</b> Imenski prostor vidi svoje procese i procese podređenih imenskih prostora, svaki pod vlastitim brojem: ' +
        'proces ima PID u svom imenskom prostoru i u svakom iznad njega. Prvi proces u novom imenskom prostoru dobiva PID 1 i ' +
        'postaje njegov [[init process]]; njemu idu i siročad. Kad PID 1 završi, jezgra ubija sve ostale procese u tom ' +
        'imenskom prostoru, a novi se u njemu više ne mogu stvoriti. Iznutra PID 1 prima samo signale za koje ima [[handler]], ' +
        'pa ga ni SIGKILL iznutra ne ubija; izvana SIGKILL i SIGSTOP uvijek stižu. <code>unshare --pid</code> ne premješta ' +
        'samu ljusku, nego određuje kamo idu njezina djeca, zato treba <code>--fork</code>.</p>' +
        '<p><b>/proc.</b> <code>ps</code> čita <code>/proc</code>, a <code>/proc</code> prikazuje PID imenski prostor u kojem je ' +
        'montiran. Bez novog imenskog prostora montiranja i svježeg <code>/proc</code> (<code>--mount-proc</code>) ' +
        '<code>ps</code> u kontejneru ispisuje procese domaćina.</p>' +
        '<p><b>Mreža i montiranja.</b> Novi mrežni imenski prostor ima samo <code>lo</code>, isključen; sučelja domaćina ' +
        'u njemu ne postoje. Novi imenski prostor montiranja počinje kao kopija tablice; uz privatnu propagaciju montiranje na ' +
        'jednoj strani ne vidi se na drugoj.</p>' +
        '<p>Česte zablude: kontejner je mali virtualni stroj s vlastitom jezgrom (nije: obje ploče prikazuju istu jezgru); ' +
        '<code>ps</code> u novom PID imenskom prostoru sam od sebe vidi samo kontejner (ne vidi: treba novi <code>/proc</code>); ' +
        'izolacija je simetrična (nije: domaćin vidi i signalizira sve procese kontejnera). UTS, IPC, korisnički i cgroup ' +
        'imenski prostori, ograničenja resursa i povezivanje mreže kontejnera teme su drugih stranica.</p>'
    },
    en: {
      stage: 'The host view and the container view: processes, network interfaces and mounts, over one kernel',
      // panel
      scene: 'Example',
      view: 'View',
      viewBoth: 'both',
      viewHost: 'host',
      viewContainer: 'container',
      viewHint: 'Shows one panel alone, larger, for the projector; the step stays.',
      pFull: 'A container is a process',
      pFullHint: 'unshare with new PID, network and mount namespaces; compare the two views.',
      pNoProc: 'ps without a new /proc',
      pNoProcHint: 'echo $$ says 1, yet ps lists the host\'s processes.',
      pNoFork: 'unshare without --fork',
      pNoForkHint: 'The shell stays outside; the first process it starts becomes PID 1.',
      pKillInit: 'When PID 1 dies',
      pKillInitHint: 'From inside PID 1 cannot be killed; from outside SIGKILL takes the whole namespace down.',
      pOneWay: 'Isolation runs one way',
      pOneWayHint: 'The container cannot see the host; the host sees the container.',
      // legend
      legHost: 'host namespace',
      legC: 'container namespace',
      legPair: 'host PID / container PID',
      legRan: 'ran and ended',
      legGone: 'gone',
      legChanged: 'changed',
      // the command strip
      sideHost: 'host · terminal {n}',
      sideC: 'container',
      before: '(before the first command)',
      noOutput: '(nothing printed)',
      // the panels
      panelHost: 'Host view',
      panelC: 'Container view',
      secProcs: 'Processes',
      secIfaces: 'Network interfaces',
      secMounts: 'Mounts',
      shared: 'same as the host\'s',
      procFrom: '/proc shows the PIDs of: {ns}',
      nsHost: 'host',
      nsC: 'container',
      self: 'this shell: $$ = {pid}',
      noContainer: 'No container yet.',
      containerGone: 'The container is gone: no process holds its namespaces any more.',
      tagRan: 'ran',
      tagGone: 'gone',
      tagNext: 'children → {ns}',
      up: 'up',
      down: 'down',
      pidsOf: 'PIDs of: {ns}',
      // the kernel bar
      kernel: 'One kernel',
      kindPid: 'PID',
      kindNet: 'net',
      kindMnt: 'mount',
      nsInit: 'PID 1: {name}',
      nsNoProc: 'no process yet',
      nsClosed: 'PID 1 has exited: fork fails',
      nsGone: 'gone',
      // captions: the start
      capStart: 'The host runs `systemd` (PID 1) and two shells, 4200 and 4300. Every [[process]] belongs to one PID, one network and one mount namespace; so far all of them are the host\'s.',
      capGoal_full: 'Terminal 1 starts a container with three new namespaces: PID, network and mount.',
      'capGoal_no-mount-proc': 'Terminal 1 starts a container with only a new PID namespace, and no new /proc.',
      'capGoal_no-fork': 'Terminal 1 runs `unshare --pid` without `--fork`.',
      'capGoal_kill-init': 'Terminal 1 starts a container; then signals go to its PID 1 from inside and from outside.',
      'capGoal_one-way': 'Terminal 1 starts a container; then kill from the container towards the host, and back.',
      // captions: unshare
      capUnshare: '`unshare` created a new PID namespace: the new shell is PID 1 inside, and the host sees the same process as {host}.',
      capAgain: 'This time with `--fork`:',
      capUnshareNet: 'The new network namespace has only lo, and it is down.',
      capUnshareMnt: 'The new mount namespace starts as a copy of the host\'s table, and a fresh /proc for the new PID namespace is mounted over /proc.',
      capUnshareNoProc: 'There is no new mount namespace, so /proc is still the host\'s.',
      capUnshareProc: 'Now with `--mount-proc`: a new mount namespace and a fresh /proc, so the container sees only its own shell, PID 1. The network is still the host\'s.',
      capUnshareNoFork: '`unshare` created a new PID namespace but did not enter it: for a PID namespace, unshare only sets where the caller\'s children will go. Without `--fork` it ran bash in the same process (`--norc`: without startup files, which would start processes of their own), so the shell is still {pid} in the host\'s namespace.',
      // captions: commands
      capEchoInit: '`echo $$` prints the shell\'s PID in its own namespace: 1. Inside, the shell is the [[init process]].',
      capEchoHost: '`echo $$` prints {pid}: the shell stayed in the host\'s PID namespace.',
      capPsOwn: '`ps` reads /proc, and this /proc belongs to the container\'s PID namespace: it lists only the container\'s processes, numbered from 1, itself among them. The host sees the same `ps` as {host}.',
      capPsHost: '`ps` reads /proc, and /proc is still the host\'s: it lists every host process, PID 1 is `systemd`, and the shell itself is {host}, though `echo $$` printed 1. An isolated `ps` needs a new mount namespace and a fresh /proc.',
      capPsAfter: '`sleep` is gone, and `ps` got PID {pid}: PIDs are handed out in order, and a freed one is not reused at once.',
      capIpC: '`ip` in the container: only lo, and it is down. The host\'s eth0 is not here; a new network namespace starts with only its own lo.',
      capIpH: 'On the host `ip` still shows lo and eth0: making a namespace took nothing away from the host.',
      capMount: '`mount` in the container added /mnt to the container\'s mount table only. The table started as a copy of the host\'s, with private propagation.',
      capFindC: '`findmnt /mnt` in the container finds the tmpfs.',
      capFindH: '`findmnt /mnt` on the host prints nothing: the mount stayed in the container\'s mount namespace.',
      capExitInit: 'The shell, PID 1 of the container, has exited. `unshare` was waiting for it and exited too. With no process left in them, the container\'s namespaces are gone: {kinds}. The host lists only what it listed at the start.',
      capExitInitPid: 'The shell, PID 1 of the container, has exited. `unshare` was waiting for it and exited too. With no process left in it, the container\'s PID namespace is gone. The host lists only what it listed at the start.',
      capExitNoFork: 'bash has exited. Nothing holds the closed PID namespace any more, so it is gone.',
      capLsInit: '`ls` was the first process created in the new namespace, so it got PID 1 there ({host} on the host) and became its init. It ended at once, so the namespace has no PID 1 now.',
      capForkFail: '`fork` failed (ENOMEM): once PID 1 of a namespace has exited, no new process can be created in it. bash itself still runs; it just cannot start any external command.',
      capBg: '`sleep` runs in the background: PID {inner} inside, {host} on the host. One process, two numbers.',
      capKillUsr: '`kill -USR1 1` from inside: a process with no [[handler]] for SIGUSR1 normally dies of it, but from its own namespace PID 1 receives only signals it has a handler for, and bash has none for SIGUSR1. The signal was dropped; nothing changed.',
      capKillIgnored: 'The signal was ignored: an interactive bash ignores SIGTERM, PID 1 or not.',
      capKillKill: 'Not even SIGKILL: no [[=handler]] for it can exist, so from inside it never reaches PID 1.',
      capKillDropped: 'The signal was dropped: PID 1 receives only signals it has a [[=handler]] for.',
      capKillInit: 'From the host, SIGKILL to {host} is always delivered. PID 1 has exited, so the kernel sent SIGKILL to every other process in its namespace. `unshare` exited too, and the namespaces are gone.',
      capKillNoSuchC: '{cmd} from the container: no such process. {pid} is a host PID, and the host\'s processes have no number in the container\'s namespace.',
      capKillNoSuchH: '{cmd}: no such process. The kernel killed sleep together with its namespace\'s PID 1.',
      capKillHost: 'From the host {cmd} reaches the container\'s sleep (PID {inner} inside): a parent namespace sees and signals its child\'s processes. Isolation runs one way.',
      capKilled: 'The signal arrived and the process ended.',
      capErr: 'The command failed and nothing changed.',
      kindsPid: 'PID',
      kindsNet: 'network',
      kindsMnt: 'mount',
      explain: '<p>A container is not a small [[virtual machine]] with a kernel of its own. It is an ordinary process tree, and ' +
        'the [[kernel]] is the host\'s own: it only keeps the tree in separate namespaces. This page shows three: PID, ' +
        'network and mount.</p>' +
        '<p><b>PID.</b> A namespace sees its own processes and those of its child namespaces, each under its own number: a ' +
        'process has a PID in its own namespace and in every one above it. The first process in a new namespace gets PID 1 ' +
        'and becomes its [[init process]]; orphans go to it. When PID 1 exits, the kernel kills every other process in that ' +
        'namespace, and no new one can be created there. From inside, PID 1 receives only signals it has a [[handler]] for, so ' +
        'not even SIGKILL from inside kills it; from outside, SIGKILL and SIGSTOP always arrive. <code>unshare --pid</code> ' +
        'does not move the shell itself, it sets where its children go: hence <code>--fork</code>.</p>' +
        '<p><b>/proc.</b> <code>ps</code> reads <code>/proc</code>, and <code>/proc</code> shows the PID namespace it was ' +
        'mounted for. Without a new mount namespace and a fresh <code>/proc</code> (<code>--mount-proc</code>), ' +
        '<code>ps</code> in the container lists the host\'s processes.</p>' +
        '<p><b>Network and mounts.</b> A new network namespace has only <code>lo</code>, down; the host\'s interfaces do ' +
        'not exist in it. A new mount namespace starts as a copy of the table; with private propagation a mount on one side ' +
        'is not seen on the other.</p>' +
        '<p>Common misconceptions: a container is a small virtual machine with its own kernel (it is not: both panels come ' +
        'from one kernel); <code>ps</code> in a new PID namespace sees only the container by itself (it does not: it needs a ' +
        'new <code>/proc</code>); isolation is symmetric (it is not: the host sees and signals every process in the ' +
        'container). UTS, IPC, user and cgroup namespaces, resource limits and wiring a container\'s network are other ' +
        'pages.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
