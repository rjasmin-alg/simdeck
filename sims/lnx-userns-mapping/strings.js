/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-userns-mapping, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (in captions a node: numbers, names, paths and commands are data), an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones). In captions
   *word* is an English word in italics and `x` is code. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Kontejner i domaćin gledaju isti direktorij /data, svaki sa svojim brojevima',

      // params
      rootless: 'Kontejner bez root ovlasti (korisnički imenski prostor)',
      subuidStart: 'Početak podređenog raspona u /etc/subuid',
      script: 'Radnje',

      // presets
      'preset_root-inside': 'Root u kontejneru',
      'preset_root-inside_hint': 'root unutra stvara datoteku; na domaćinu je ona studentova (1000)',
      'preset_service-user': 'Servisni korisnik',
      'preset_service-user_hint': 'www (33) unutra je 100032 na domaćinu',
      'preset_host-file-inside': 'Datoteka domaćina unutra',
      'preset_host-file-inside_hint': 'datoteka roota domaćina unutra je nobody (65534)',
      'preset_rootful': 'S root ovlastima',
      'preset_rootful_hint': 'bez korisničkog imenskog prostora root unutra je root domaćina',

      // legend
      legIn: 'UID u kontejneru',
      legOut: 'UID na domaćinu',
      legLine: 'redak preslikavanja koji je preveo broj',
      legUnmapped: 'broj bez retka: 65534 (nobody)',
      legRefused: 'odbijeno',
      legChanged: 'promijenjeno u ovom koraku',

      // the command strip
      sideC: 'kontejner',
      sideH: 'domaćin',
      runsAs: 'kao {user} ({uid})',
      before: 'Još nije pokrenuta nijedna naredba.',
      resOk: 'uspjelo',
      resCreated: 'stvoreno',
      resLs: 'ispis je dolje, u stupcu {side}',
      resLsC: 'kontejnera',
      resLsH: 'domaćina',

      // columns
      colC: 'Kontejner',
      colC_note: 'kako ga vidi kontejner',
      colMap: 'Korisnički imenski prostor',
      colH: 'Domaćin',
      colH_note: 'kako ga vidi domaćin',
      passwd: '/etc/passwd (isječak)',
      mapHead: 'uid_map procesa {pid}',
      mapCols: 'unutra · vani · koliko',
      mapLine: 'redak {n}',
      mapRootful: 'nema korisničkog imenskog prostora: preslikavanje samog domaćina',
      subuidHead: '/etc/subuid',
      subuidUnused: 'ne koristi se',
      secProcs: 'Procesi',
      secFiles: 'Direktorij /data',
      secFilesNote: 'isti direktorij, montiran u kontejner',
      empty: 'prazno',
      noName: 'bez imena',
      newTag: 'novo',
      arrowLine: 'redak {n}',
      arrowNone: 'nijedan redak',

      // ordinals for the caption
      ord_0: 'prvom',
      ord_1: 'drugom',

      // captions
      capStart: 'U kontejneru rade tri procesa, a direktorij domaćina `/data` montiran je u njega. Kontejner ima svoj ' +
        '*user namespace* (korisnički imenski prostor): u sredini je njegov `uid_map`, po kojem jezgra prevodi svaki ' +
        'UID iz jednog pogleda u drugi.',
      capStartRootful: 'U kontejneru rade tri procesa, a direktorij domaćina `/data` montiran je u njega, ali bez ' +
        'korisničkog imenskog prostora: preslikavanje je domaćinovo, `0 0 4294967295`, pa svaki broj na obje strane ' +
        'znači isto.',
      'goal_root-inside': 'Pogledaj čija je datoteka koju stvori root u kontejneru.',
      'goal_service-user': 'Pogledaj čija je datoteka koju stvori servisni korisnik.',
      'goal_host-file-inside': 'U `/data` je datoteka roota domaćina, s dozvolama `0600`.',
      goal_rootful: 'Prekidač desno uključuje i isključuje korisnički imenski prostor: usporedi vlasnike.',
      capCreateRoot: 'Proces {proc} radi kao root, UID 0 u kontejneru. Prvi redak preslikavanja preslikava točno ' +
        'jedan broj, 0 unutra u {out} vani: to je korisnik {user} na domaćinu. Datoteka {path} na domaćinu je njegova; ' +
        'root unutra vani je običan korisnik.',
      capCreateSub: 'Proces {user} u kontejneru ima UID {in}. Po {ord} retku preslikavanja to je na domaćinu ' +
        '{start} + {in} − {first} = {out} — broj koji ne pripada nikome na domaćinu.',
      capCreateRootful: 'Bez korisničkog imenskog prostora ništa se ne prevodi: root u kontejneru je UID 0 i na ' +
        'domaćinu, pa datoteka {path} pripada rootu domaćina. Proces koji pobjegne iz ovog kontejnera root je na domaćinu.',
      capCreateSame: 'Bez korisničkog imenskog prostora ništa se ne prevodi: UID {in} u kontejneru je UID {in} i na ' +
        'domaćinu, pa datoteka {path} na domaćinu pripada broju {in}.',
      capLsHostOwn: 'Na domaćinu `ls -ln` ispisuje broj koji je na disku: {out}, korisnik {user}. Samo datoteke ' +
        'roota iz kontejnera završe na korisnikovu vlastitom broju; svaki drugi korisnik kontejnera dobiva broj iz ' +
        'podređenog raspona.',
      capLsHostSub: 'Na domaćinu `ls -ln` ispisuje broj koji je na disku: {out}. Domaćinov `/etc/passwd` nema ' +
        'takvog korisnika, pa uz broj ne stoji ime: to je broj iz podređenog raspona korisnika {user} ' +
        '(redak {line} u `/etc/subuid`).',
      capLsHostRootFile: 'Na domaćinu datoteka {path} pripada rootu (0), s dozvolama `0600`: čitati je smije samo ' +
        'njezin vlasnik.',
      capLsHostRootful: 'Na domaćinu datoteka {path} pripada rootu (0): root iz kontejnera upisao ju je kao root ' +
        'domaćina.',
      capLsHostSame: 'Na domaćinu datoteka {path} pripada broju {out}, istom kao unutra: bez korisničkog imenskog ' +
        'prostora ništa se ne prevodi.',
      capLsCUnmapped: 'Unutra `ls -ln` prevodi svakog vlasnika kroz preslikavanje. UID {owner} domaćina nije ni u jednom ' +
        'retku, pa ga kontejner vidi kao 65534 ({nobody}), zamjenski broj. To ne znači da datoteka nema vlasnika: na ' +
        'disku je njezin vlasnik i dalje {owner}.',
      capLsCSame: 'Bez korisničkog imenskog prostora kontejner vidi brojeve domaćina kakvi jesu: {path} i unutra ' +
        'pripada broju {out}.',
      capLsCMapped: 'Unutra `ls -ln` prevodi svakog vlasnika kroz preslikavanje: {path} vani pripada broju {out}, a ' +
        'unutra broju {in}.',
      capReadDenied: 'U kontejneru {proc} radi kao root, ali za domaćina je UID {out}. Njegova [[capability]] ' +
        'vrijedi samo za datoteke čiji su vlasnik i grupa preslikani u njegov imenski prostor, a UID {owner} domaćina nije. Zato ' +
        'odlučuju obični bitovi: za ostale {bits}, nema `r`, pa dobiva Permission denied.',
      capReadRoot: 'Bez korisničkog imenskog prostora root u kontejneru je root domaćina: bitovi ga ne zaustavljaju i ' +
        'čita {path}, datoteku domaćina koju smije čitati samo njegov root.',
      capWriteDenied: 'Korisnik {user} na domaćinu je UID {uid}, a datoteka pripada broju {out}: za domaćina su to ' +
        'dva različita korisnika. Bitovi za ostale su {bits}, nema `w`, pa dobiva Permission denied.',
      capEnterNs: 'Da bi promijenio datoteku, {user} mora ući u imenski prostor kontejnera, gdje je root, a {out} je ' +
        'ondje preslikan.',
      capAccessOk: 'Dozvola prolazi: {cls}.',
      capDenied: 'Permission denied: za {cls} bitovi su {bits}, nema {need}.',
      cls_owner: 'vlasnik',
      cls_others: 'ostali',
      cls_cap: 'root u kontejneru, vlasnik i grupa preslikani',
      cls_root: 'root domaćina',

      explain:
        '<p>Kontejner je [[process]] sa svojim imenskim prostorima. Kontejner bez <code>root</code> ovlasti dobiva i ' +
        '<i lang="en">user namespace</i> (korisnički imenski prostor): u njemu proces može biti <code>root</code> (UID 0), ' +
        'a jezgra svaki broj prevodi prema tablici <code>uid_map</code>. Svaki redak kaže: <i>count</i> brojeva od ' +
        '<i>inside</i> naviše unutra su brojevi od <i>outside</i> naviše vani.</p>' +
        '<p>Uobičajena tablica ima dva retka. Prvi preslikava 0 unutra u korisnikov vlastiti UID (1000). Drugi ' +
        'preslikava 1 do 65536 u podređeni raspon tog korisnika iz <code>/etc/subuid</code> ' +
        '(<code>student:100000:65536</code>): UID <i>n</i> unutra je 100000 + <i>n</i> − 1 vani. Rasponi se ne smiju ' +
        'preklapati, pa broj prevodi najviše jedan redak. Broj koji nije ni u jednom retku druga strana vidi kao 65534 ' +
        '(<code>nobody</code>).</p>' +
        '<p>Datoteke su mjesto gdje se pogledi sreću: na disku stoji broj domaćina. <code>root</code> u kontejneru ' +
        'ima [[=capability]] samo nad onim što pripada njegovu imenskom prostoru; na datoteci domaćina on je samo ' +
        'korisnik 1000. Grupe (<code>gid_map</code>, <code>/etc/subgid</code>) slijede isto pravilo.</p>' +
        '<p>Tri zablude: <code>root</code> u kontejneru bez <code>root</code> ovlasti nije <code>root</code> na ' +
        'domaćinu; datoteke koje kontejner zapiše nisu korisnikove, nego samo one koje zapiše <code>root</code> ' +
        'kontejnera; <code>nobody</code> ne znači da datoteka nema vlasnika, nego da ga ova strana ne može imenovati.</p>'
    },

    en: {
      stage: 'The container and the host look at the same directory /data, each with its own numbers',

      rootless: 'Rootless container (user namespace)',
      subuidStart: 'Start of the subordinate range in /etc/subuid',
      script: 'Actions',

      'preset_root-inside': 'Root inside',
      'preset_root-inside_hint': 'root inside creates a file; on the host it is student’s (1000)',
      'preset_service-user': 'A service user',
      'preset_service-user_hint': 'www (33) inside is 100032 on the host',
      'preset_host-file-inside': 'A host file inside',
      'preset_host-file-inside_hint': 'a file of host root is nobody (65534) inside',
      'preset_rootful': 'Rootful',
      'preset_rootful_hint': 'without a user namespace root inside is host root',

      legIn: 'UID in the container',
      legOut: 'UID on the host',
      legLine: 'map line that translated the number',
      legUnmapped: 'number on no line: 65534 (nobody)',
      legRefused: 'refused',
      legChanged: 'changed in this step',

      sideC: 'container',
      sideH: 'host',
      runsAs: 'as {user} ({uid})',
      before: 'No command has run yet.',
      resOk: 'done',
      resCreated: 'created',
      resLs: 'the listing is below, in the {side} column',
      resLsC: 'container',
      resLsH: 'host',

      colC: 'Container',
      colC_note: 'as the container sees it',
      colMap: 'User namespace',
      colH: 'Host',
      colH_note: 'as the host sees it',
      passwd: '/etc/passwd (excerpt)',
      mapHead: 'uid_map of process {pid}',
      mapCols: 'inside · outside · count',
      mapLine: 'line {n}',
      mapRootful: 'no user namespace: the host’s own map',
      subuidHead: '/etc/subuid',
      subuidUnused: 'not used',
      secProcs: 'Processes',
      secFiles: 'Directory /data',
      secFilesNote: 'one directory, mounted into the container',
      empty: 'empty',
      noName: 'no name',
      newTag: 'new',
      arrowLine: 'line {n}',
      arrowNone: 'no line',

      ord_0: 'first',
      ord_1: 'second',

      capStart: 'A container runs three processes, and the host directory `/data` is mounted into it. The ' +
        'container has its own user namespace: the middle column is its `uid_map`, which the kernel uses to ' +
        'translate every UID between the two views.',
      capStartRootful: 'A container runs three processes with the host directory `/data` mounted into it, but ' +
        'without a user namespace: the map is the host’s own, `0 0 4294967295`, so every number means the same on ' +
        'both sides.',
      'goal_root-inside': 'Watch who owns the file root creates in the container.',
      'goal_service-user': 'Watch who owns the file a service user creates.',
      'goal_host-file-inside': '`/data` holds a file of host root’s, mode `0600`.',
      goal_rootful: 'The switch on the right turns the user namespace on and off: compare the owners.',
      capCreateRoot: 'The {proc} process runs as root, UID 0 in the container. The first mapping line maps exactly ' +
        'one ID, 0 inside to {out} outside: the host user {user}. So {path} is that user’s file on the host; root ' +
        'inside is an ordinary user outside.',
      capCreateSub: 'The {user} process in the container has UID {in}. By the {ord} mapping line that is ' +
        '{start} + {in} − {first} = {out} on the host — a number that belongs to nobody there.',
      capCreateRootful: 'Without a user namespace nothing is translated: root in the container is UID 0 on the ' +
        'host too, so {path} belongs to host root. A process that breaks out of this container is root on the host.',
      capCreateSame: 'Without a user namespace nothing is translated: UID {in} in the container is UID {in} on the ' +
        'host, so {path} belongs to {in} there.',
      capLsHostOwn: 'On the host, `ls -ln` prints the number on disk: {out}, the user {user}. Only the files of ' +
        'container root land on the user’s own UID; every other container user gets a number from the subordinate ' +
        'range.',
      capLsHostSub: 'On the host, `ls -ln` prints the number on disk: {out}. The host’s `/etc/passwd` has no such ' +
        'user, so no name stands next to it: it is a number from the subordinate range of {user}, line {line} in ' +
        '`/etc/subuid`.',
      capLsHostRootFile: 'On the host, {path} belongs to root (0), mode `0600`: only its owner may read it.',
      capLsHostRootful: 'On the host, {path} belongs to root (0): root in the container wrote it as the host’s root.',
      capLsHostSame: 'On the host, {path} belongs to {out}, the same number as inside: without a user namespace ' +
        'nothing is translated.',
      capLsCUnmapped: 'Inside, `ls -ln` translates every owner through the map. Host UID {owner} is on no line, so the ' +
        'container sees 65534 ({nobody}), the overflow ID. That does not mean the file has no owner: on disk its ' +
        'owner is still {owner}.',
      capLsCSame: 'Without a user namespace the container sees the host’s numbers as they are: {path} belongs to ' +
        '{out} inside as well.',
      capLsCMapped: 'Inside, `ls -ln` translates every owner through the map: {path} belongs to {out} outside and to ' +
        '{in} inside.',
      capReadDenied: 'In the container {proc} runs as root, but to the host it is UID {out}. Its [[capability]] ' +
        'reaches only files whose owner and group are mapped into its namespace, and host UID {owner} is not. So the ordinary bits ' +
        'decide: for others {bits}, no `r`, and it gets Permission denied.',
      capReadRoot: 'Without a user namespace root in the container is host root: the bits do not stop it, and it ' +
        'reads {path}, a host file only host root may read.',
      capWriteDenied: 'The host user {user} is UID {uid}, and the file belongs to {out}: to the host these are two ' +
        'different users. The bits for others are {bits}, no `w`, so it gets Permission denied.',
      capEnterNs: 'To change the file, {user} has to enter the container’s namespace, where it is root and {out} ' +
        'is mapped.',
      capAccessOk: 'Access passes: {cls}.',
      capDenied: 'Permission denied: for {cls} the bits are {bits}, no {need}.',
      cls_owner: 'owner',
      cls_others: 'others',
      cls_cap: 'root in the container, owner and group mapped',
      cls_root: 'host root',

      explain:
        '<p>A container is a [[process]] with namespaces of its own. A rootless container also gets a user ' +
        'namespace: inside it a process can be <code>root</code> (UID 0), and the kernel translates every number by ' +
        'the table <code>uid_map</code>. Each line says: <i>count</i> IDs from <i>inside</i> upward inside are the IDs ' +
        'from <i>outside</i> upward outside.</p>' +
        '<p>The usual table has two lines. The first maps 0 inside to the user’s own UID (1000). The second maps 1 to ' +
        '65536 to the user’s subordinate range from <code>/etc/subuid</code> (<code>student:100000:65536</code>): UID ' +
        '<i>n</i> inside is 100000 + <i>n</i> − 1 outside. The ranges may not overlap, so at most one line translates ' +
        'a number. A number on no line shows on the other side as 65534 (<code>nobody</code>).</p>' +
        '<p>Files are where the two views meet: the disk holds the host’s number. <code>root</code> in the container ' +
        'has a [[=capability]] only over what its namespace owns; on a host file it is just user 1000. Groups ' +
        '(<code>gid_map</code>, <code>/etc/subgid</code>) follow the same rule.</p>' +
        '<p>Three misconceptions: root in a rootless container is not root on the host; the files a container writes ' +
        'are not the user’s, only those of container root are; <code>nobody</code> does not mean the file has no ' +
        'owner, only that this side cannot name it.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
