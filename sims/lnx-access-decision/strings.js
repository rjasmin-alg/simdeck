/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-access-decision, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (a node in captions: names, entries and bits are shown as code), [[term]] a glossary term
   (first mention; [[=term]] later ones). The title and subtitle come from sim.json. User and group names, paths,
   entries (user::rwx) and bit strings are data, not words; the file and user names are listed here so the controls
   can show them. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Provjera pristupa: proces, unosi datoteke redom, traženo pravo i ishod',
      // panel
      scene: 'Datoteka',
      fProjekt: '/srv/projekt',
      fPlan: 'plan.txt',
      fProba: 'proba',
      fDruga: 'druga.txt',
      fTajna: 'tajna',
      who: 'Proces pokreće',
      uStudent: 'student',
      uAna: 'ana',
      uMarko: 'marko',
      uNobody: 'nobody',
      uRoot: 'root',
      want: 'Traži',
      wantR: 'r čitanje',
      wantW: 'w pisanje',
      wantX: 'x izvršavanje',
      mask: 'Maska (mask::)',
      maskHint: 'Promijeni je i na zadnjem koraku: ishod se može promijeniti, a koraci ostaju isti.',
      mRwx: 'rwx',
      mRw: 'rw-',
      mR: 'r--',
      mNone: '---',
      pProjekt: 'student i /srv/projekt',
      pOwner: 'Vlasnik bez prava',
      pNamed: 'Imenovani korisnik',
      pMask: 'Maska uzima x',
      pRoot: 'root i dozvole 000',
      // legend
      legNo: 'ne odgovara',
      legHit: 'odgovara procesu',
      legWin: 'odlučuje',
      legSkip: 'nije čitano',
      legCut: 'bit koji maska uklanja',
      legVerdict: 'ishod',
      // stage: the process
      procTitle: 'Proces',
      euid: 'EUID',
      groups: 'grupe',
      privYes: 'EUID 0: povlašteni proces',
      privNo: 'EUID nije 0: odlučuju klase',
      // the order of the classes
      orderTitle: 'Redoslijed je stalan:',
      oOwner: 'vlasnik',
      oUsers: 'imenovani korisnici',
      oGroups: 'grupe',
      oOther: 'ostali',
      oNone: 'nema unosa',
      // the table
      tableTitle: 'Unosi datoteke',
      ownerIs: 'vlasnik:',
      groupIs: 'grupa:',
      colClass: 'klasa',
      colEntry: 'unos',
      colWho: 'opisuje',
      colPerms: 'upisano',
      colEff: 'vrijedi',
      rOwner: 'vlasnik',
      rUser: 'imenovani korisnik',
      rGroupObj: 'grupa datoteke',
      rGroup: 'imenovana grupa',
      rMask: 'maska',
      rOther: 'ostali',
      whoOther: 'svakoga',
      markHit: 'odgovara',
      markWin: 'odlučuje',
      markBeaten: 'nema bit',
      markSkip: 'nije čitano',
      maskOn: 'primijenjena',
      notRead: 'Povlašteni proces: unosi se ne čitaju.',
      // stage: the request and the verdict
      wantTitle: 'Traži',
      wR: 'čitanje',
      wW: 'pisanje',
      wX: 'izvršavanje',
      wXdir: 'pretraživanje',
      calcTitle: 'Što vrijedi',
      calcWait: 'Još se traži klasa koja odgovara.',
      noMask: 'maska se ne primjenjuje',
      hasBit: 'ima {b}',
      lacksBit: 'nema {b}',
      ovTitle: 'Povlastica',
      ovRW: 'čitanje i pisanje: uvijek',
      ovDir: 'direktorij, i pretraživanje: uvijek',
      ovX: 'izvršavanje: samo ako u dozvolama postoji barem jedan x',
      verdictTitle: 'Ishod',
      granted: 'dopušteno',
      denied: 'odbijeno',
      waiting: 'čeka',
      byClass: 'odlučila klasa: {cls}',
      byPriv: 'odlučila povlastica',
      // captions
      cStart: '{user} traži {want} nad {path}. Prvo tko je proces, a onda klase, uvijek istim redom.',
      cIdNo: 'Proces ima EUID {uid} i grupe {groups}. EUID nije 0, pa odlučuju klase: prva koja odgovara procesu.',
      cIdRoot: 'Proces ima EUID 0. Povlašteni proces ne prolazi kroz klase kao ostali.',
      cOwnerNo: 'Vlasnik je {owner}, a proces pripada korisniku {user}: klasa vlasnika ne odgovara.',
      cOwnerYes: '{user} je vlasnik, pa odlučuje unos {entry}. Grupa i ostali se više ne gledaju.',
      cUsersNo: 'Nijedan unos {tag} ne imenuje korisnika {user}.',
      cUsersYes: 'Unos {entry} imenuje korisnika {user}: odlučuje ta klasa. Grupe i ostali se ne čitaju.',
      cGroupsNo: 'Nijedna grupa procesa ({groups}) nije ni grupa datoteke ni imenovana grupa.',
      cGroupsYes: 'Proces je u grupi {group}: odgovara {entry}. Odlučuje klasa grupa, a klasa ostali se više ne čita.',
      cGroupsYesMany: 'Proces je u grupi {group}: odgovaraju {entries}. Dovoljno je da jedan od njih ima traženi bit; klasa ostali se više ne čita.',
      cOtherEmpty: '{user} nije vlasnik ni član grupe {group}, pa odlučuje treća skupina bitova — a ona je prazna.',
      cOther: '{user} nije ni vlasnik, ni imenovan, ni u grupi datoteke: odlučuje {entry}, bez maske.',
      cMaskClips: 'Unos kaže {entry}, ali maska {mask} stoji između upisanog i onoga što vrijedi.',
      cMaskSame: 'Maska {mask} ne uzima ništa od {entry}: vrijedi {eff}.',
      cOverride: 'Povlastica preskače klase: čitanje i pisanje dopušta uvijek, a izvršavanje samo ako u {ls} postoji barem jedan x.',
      cOverrideDir: 'Povlastica preskače klase: na direktoriju dopušta čitanje, pisanje i pretraživanje.',
      cGranted: 'Klasa „{cls}” ima {want}: dopušteno.',
      cDenied: 'Klasa „{cls}” nema {want}: odbijeno. Kasniji redak to ne može promijeniti.',
      cOwnerLocked: 'Odbijeno, iako bi drugi to smjeli: {user} je vlasnik, a vlasnik ima {perms}. Prava klasa se ne zbrajaju.',
      cDeniedOther: 'Klasa „ostali” nema {want}: odbijeno.',
      cNoFallThrough: 'Odbijeno, iako ostali imaju {want}: klasa grupa je već odgovarala, pa ostali ne dolaze na red.',
      cMaskDenied: 'Odbijeno: unos ima {want}, ali ga je maska uklonila.',
      cRootRW: 'Dopušteno: povlašteni proces čita i piše bez obzira na bitove.',
      cRootDir: 'Dopušteno: direktorij povlašteni proces smije i pretraživati.',
      cRootX: 'Dopušteno: u {ls} postoji barem jedan x, pa povlastica daje i izvršavanje.',
      cRootNoX: 'Odbijeno, i to korisniku root: u {ls} nema nijednog x, pa ni povlastica ne daje izvršavanje.',
      explain:
        '<p>Kad proces traži pristup datoteci, jezgra ne zbraja prava. Klase gleda <b>stalnim redom</b> — vlasnik, ' +
        'imenovani korisnici, grupe, ostali — i <b>prva klasa koja odgovara procesu odlučuje</b>; ništa iza nje se ne čita. ' +
        'Vlasnik s <code>---</code> zato ne smije čitati ni kad svi ostali smiju, a proces koji je u grupi datoteke dobiva ' +
        'prava grupe, ne ostalih. Proces se uspoređuje po svom <i lang="en">effective UID</i> (efektivni korisnički ' +
        'identifikator) i po svim svojim grupama.</p>' +
        '<p>Bez dodatnih unosa klase su tri skupine bitova koje pokazuje <code>ls -l</code>: to je [[file permission]]. Uz njih ' +
        '[[access control list]] dodaje ' +
        'imenovane korisnike i grupe, a s njima i <i lang="en">mask</i> (maska): ona ograničava imenovane korisnike, grupu datoteke ' +
        'i imenovane grupe, nikad vlasnika ni ostale. Ono što vrijedi, <i lang="en">effective rights</i> (efektivna prava), ' +
        'jest unos <b>i</b> maska. Kad ACL postoji, <code>ls -l</code> na mjestu grupe pokazuje masku, a ne <code>group::</code>, ' +
        'i iza devet znakova stavlja <code>+</code>; što koji unos doista daje, pokazuje tek <code>getfacl</code> ' +
        '(<code>#effective:rw-</code>).</p>' +
        '<p>Proces s EUID 0 klase ne prolazi: [[capability]] mu dopušta čitanje i pisanje uvijek, na direktoriju i ' +
        'pretraživanje, a izvršavanje obične datoteke samo ako dozvole (s maskom na mjestu grupe) imaju barem jedan ' +
        '<code>x</code>.</p>' +
        '<p>Česte zablude: „ostali imaju <code>r</code>, pa vlasnik sigurno smije čitati” (prava se ne zbrajaju); „grupa ' +
        'nema prava, pa se gleda dalje” (prva klasa koja odgovara je konačna); „vrijedi ono što piše u unosu” (između stoji ' +
        'maska).</p>' +
        '<p>Izgleda kao prvo podudaranje u popisu pravila (simulator <a href="../rule-first-match/index.html">Odlučuje prvi ' +
        'pogodak</a>), ali ovdje „redci” nisu popis koji administrator slaže: to su klase, uvijek istim redom, a ' +
        'unutar klase grupa vrijedi svaki unos koji odgovara.</p>' +
        '<p>Izvan ovog simulatora: dozvola pretraživanja (<code>x</code>) na svakom direktoriju staze, koja se provjerava ' +
        'prije same datoteke (<a href="../lnx-permissions-rwx/index.html">devet bitova</a>); posebni bitovi (slovo ' +
        '<code>s</code> u <code>drwxrws---</code> je setgid, a uključuje i <code>x</code>); nasljeđivanje zadane ACL-e; i ' +
        'druga provjera po oznakama (<a href="../lnx-selinux-decision/index.html">SELinux</a>).</p>'
    },
    en: {
      stage: 'The access check: the process, the file\'s entries in order, the requested right and the verdict',
      scene: 'File',
      fProjekt: '/srv/projekt',
      fPlan: 'plan.txt',
      fProba: 'proba',
      fDruga: 'druga.txt',
      fTajna: 'tajna',
      who: 'Process run by',
      uStudent: 'student',
      uAna: 'ana',
      uMarko: 'marko',
      uNobody: 'nobody',
      uRoot: 'root',
      want: 'Asks for',
      wantR: 'r read',
      wantW: 'w write',
      wantX: 'x execute',
      mask: 'Mask (mask::)',
      maskHint: 'Change it at the last step too: the verdict can change, the steps stay the same.',
      mRwx: 'rwx',
      mRw: 'rw-',
      mR: 'r--',
      mNone: '---',
      pProjekt: 'student and /srv/projekt',
      pOwner: 'An owner with no rights',
      pNamed: 'A named user',
      pMask: 'The mask takes x',
      pRoot: 'root and mode 000',
      legNo: 'does not match',
      legHit: 'matches the process',
      legWin: 'decides',
      legSkip: 'not read',
      legCut: 'bit the mask removes',
      legVerdict: 'verdict',
      procTitle: 'Process',
      euid: 'EUID',
      groups: 'groups',
      privYes: 'EUID 0: a privileged process',
      privNo: 'EUID is not 0: the classes decide',
      orderTitle: 'The order is fixed:',
      oOwner: 'owner',
      oUsers: 'named users',
      oGroups: 'groups',
      oOther: 'other',
      oNone: 'no entries',
      tableTitle: 'Entries of the file',
      ownerIs: 'owner:',
      groupIs: 'group:',
      colClass: 'class',
      colEntry: 'entry',
      colWho: 'describes',
      colPerms: 'written',
      colEff: 'applies',
      rOwner: 'owner',
      rUser: 'named user',
      rGroupObj: 'owning group',
      rGroup: 'named group',
      rMask: 'mask',
      rOther: 'other',
      whoOther: 'everyone',
      markHit: 'matches',
      markWin: 'decides',
      markBeaten: 'lacks the bit',
      markSkip: 'not read',
      maskOn: 'applied',
      notRead: 'A privileged process: the entries are not read.',
      wantTitle: 'Asks for',
      wR: 'read',
      wW: 'write',
      wX: 'execute',
      wXdir: 'search',
      calcTitle: 'What applies',
      calcWait: 'Still looking for the class that matches.',
      noMask: 'the mask does not apply',
      hasBit: 'has {b}',
      lacksBit: 'no {b}',
      ovTitle: 'Privilege',
      ovRW: 'read and write: always',
      ovDir: 'a directory, search too: always',
      ovX: 'execute: only if the mode has at least one x',
      verdictTitle: 'Verdict',
      granted: 'granted',
      denied: 'denied',
      waiting: 'waiting',
      byClass: 'decided by the class: {cls}',
      byPriv: 'decided by the privilege',
      cStart: '{user} asks for {want} on {path}. First who the process is, then the classes, always in the same order.',
      cIdNo: 'The process has EUID {uid} and the groups {groups}. EUID is not 0, so the classes decide: the first one that matches the process.',
      cIdRoot: 'The process has EUID 0. A privileged process does not go through the classes like the others.',
      cOwnerNo: 'The owner is {owner}, and the process belongs to {user}: the owner class does not match.',
      cOwnerYes: '{user} is the owner, so the entry {entry} decides. Group and other are not looked at any more.',
      cUsersNo: 'No {tag} entry names the user {user}.',
      cUsersYes: 'The entry {entry} names the user {user}: this class decides. Groups and other are not read.',
      cGroupsNo: 'None of the process\'s groups ({groups}) is the owning group or a named group.',
      cGroupsYes: 'The process is in the group {group}: {entry} matches. The groups class decides, and other is not read any more.',
      cGroupsYesMany: 'The process is in the group {group}: {entries} match. One of them having the bit is enough; other is not read any more.',
      cOtherEmpty: '{user} is neither the owner nor in group {group}, so the third triplet decides — and it is empty.',
      cOther: '{user} is not the owner, not named, not in the file\'s groups: {entry} decides, with no mask.',
      cMaskClips: 'The entry says {entry}, but the mask {mask} stands between what is written and what applies.',
      cMaskSame: 'The mask {mask} takes nothing from {entry}: {eff} applies.',
      cOverride: 'The privilege skips the classes: it always allows read and write, and execute only if {ls} has at least one x.',
      cOverrideDir: 'The privilege skips the classes: on a directory it allows read, write and search.',
      cGranted: 'The class “{cls}” has {want}: granted.',
      cDenied: 'The class “{cls}” has no {want}: denied. A later row cannot change that.',
      cOwnerLocked: 'Denied, although others would be allowed: {user} is the owner, and the owner has {perms}. The classes\' rights do not add up.',
      cDeniedOther: 'The class “other” has no {want}: denied.',
      cNoFallThrough: 'Denied, although other has {want}: the groups class already matched, so other never comes up.',
      cMaskDenied: 'Denied: the entry has {want}, but the mask removed it.',
      cRootRW: 'Granted: a privileged process reads and writes whatever the bits say.',
      cRootDir: 'Granted: a privileged process may search a directory too.',
      cRootX: 'Granted: {ls} has at least one x, so the privilege allows execute too.',
      cRootNoX: 'Denied, even to root: {ls} has no x at all, so not even the privilege allows execute.',
      explain:
        '<p>When a process asks for access to a file, the kernel does not add rights up. It looks at the classes <b>in a ' +
        'fixed order</b> — owner, named users, groups, other — and <b>the first class that matches the process decides</b>; ' +
        'nothing after it is read. An owner with <code>---</code> therefore may not read even when everyone else may, and a ' +
        'process in the file\'s group gets the group\'s rights, not other\'s. The process is compared by its effective UID ' +
        'and by all of its groups.</p>' +
        '<p>Without extra entries the classes are the three triplets <code>ls -l</code> shows: the [[file permission]]. On top ' +
        'of them an [[access control list]] adds ' +
        'named users and groups, and with them the mask: it limits named users, the owning group and named groups, never ' +
        'the owner or other. What applies, the effective rights, is the entry <b>and</b> the mask. With an ACL, ' +
        '<code>ls -l</code> shows the mask in the group\'s place, not <code>group::</code>, and puts a <code>+</code> after ' +
        'the nine letters; what each entry really gives only <code>getfacl</code> shows (<code>#effective:rw-</code>).</p>' +
        '<p>A process with EUID 0 does not go through the classes: a [[capability]] lets it read and write always, search a ' +
        'directory too, and execute a regular file only if the mode (with the mask in the group\'s place) has at least one ' +
        '<code>x</code>.</p>' +
        '<p>Common mistakes: “other has <code>r</code>, so the owner can surely read” (rights do not add up); “the group ' +
        'has no rights, so the check moves on” (the first class that matches is final); “the entry is what applies” (the ' +
        'mask stands in between).</p>' +
        '<p>It looks like first match in a rule list (the <a href="../rule-first-match/index.html">First match wins</a> ' +
        'simulator), but here the “rows” are not a list an administrator orders: they are classes, always in the same ' +
        'order, and within the groups class every matching entry counts.</p>' +
        '<p>Outside this simulator: the search permission (<code>x</code>) on every directory of the path, checked before ' +
        'the file itself (<a href="../lnx-permissions-rwx/index.html">nine bits</a>); the special bits (the ' +
        '<code>s</code> in <code>drwxrws---</code> is setgid, and includes <code>x</code>); default ACL inheritance; and the ' +
        'second, label-based check (<a href="../lnx-selinux-decision/index.html">SELinux</a>).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
