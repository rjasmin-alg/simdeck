/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-special-bits, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (in captions a node: numbers, names, paths and commands are data), [[term]] a glossary term
   (first mention; [[=term]] later ones). In captions *word* is an English word in italics and `x` is code.
   The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Proces, datoteka s posebnim bitom i odluka jezgre',

      // params
      actor: 'Korisnik u ulozi studenta',
      sticky: 'Sticky bit na /tmp',
      script: 'Radnje',
      actor_student: 'student',
      actor_ana: 'ana',
      actor_root: 'root',

      // presets
      preset_passwd: 'passwd',
      preset_passwd_hint: 'setuid i vlasnik root: stvarni UID 1000, efektivni 0',
      'preset_owner-not-root': 'Vlasnik nije root',
      'preset_owner-not-root_hint': 'isti bit na programu korisnice ana: efektivni UID 1001',
      'preset_sticky-tmp': 'Sticky bit na /tmp',
      'preset_sticky-tmp_hint': 'student smije pisati u aninu datoteku, ali je ne smije obrisati',
      'preset_setgid-dir': 'setgid na direktoriju',
      'preset_setgid-dir_hint': 'nova datoteka u /srv/projekt dobiva grupu projekt',
      'preset_script-ignored': 'Skripta sa setuid',
      'preset_script-ignored_hint': 'Linux bit na skripti zanemaruje: efektivni UID ostaje 1000',

      // legend
      legReal: 'stvarni ID',
      legEff: 'efektivni ID, istaknut kad se razlikuje',
      legLetter: 'slovo posebnog bita',
      legOk: 'dopušteno',
      legNo: 'odbijeno',
      legRule: 'pravilo koje je odlučilo',
      legChanged: 'promijenjeno u ovom koraku',

      // the command strip
      before: 'Još se ništa nije dogodilo.',
      opens: 'otvara {path} za {need}',
      need_r: 'čitanje',
      need_w: 'pisanje',
      stripProc: 'proces {cmd}',
      resOk: 'uspjelo',
      resLook: 'samo pogled',

      // left: the process
      colProc: 'Proces',
      noProc: 'Još nema procesa.',
      real: 'stvarni',
      eff: 'efektivni',
      differs: '≠ stvarni',
      groupsLbl: 'dodatne grupe',
      users: 'Korisnici i grupe',
      inGroups: 'grupe {list}',

      // middle: the bit carrier
      colBit: 'Posebni bit',
      octalLbl: 'oktalno',
      digitHead: 'prva znamenka',
      bitName_setuid: 'setuid',
      bitName_setgid: 'setgid',
      bitName_sticky: 'sticky (ograničeno brisanje)',
      keyHead: 'slovo umjesto x',
      keyWithX: 'bit i x',
      keyNoX: 'bit bez x',
      entries: 'Sadržaj',
      empty: 'prazno',
      newTag: 'novo',
      removedTag: 'obrisano',
      scriptNote: 'skripta, prvi redak',

      // right: target and decision
      colTarget: 'Cilj i odluka',
      noAction: 'Korak 1 počinje radnjom.',
      allowed: 'dopušteno',
      refused: 'odbijeno',
      look: 'samo pogled: ništa se ne odlučuje',
      ruleN: 'pravilo {n}',
      rule_1: 'setuid: EUID postaje vlasnik datoteke',
      rule_2: 'setgid: EGID postaje grupa datoteke',
      rule_3: 'provjera po EUID-u i EGID-u; EUID 0 je preskače',
      rule_4: 'sticky: brišu samo vlasnik datoteke, vlasnik direktorija i ovlašteni',
      rule_5: 'setgid na direktoriju: nova datoteka dobiva njegovu grupu',
      rule_6: 'četvrta znamenka 4 + 2 + 1; slovo umjesto x',
      rule_7: 'pisanje ili chown brišu setuid i setgid',
      rule_8: 'skripta: setuid i setgid se zanemaruju',
      chkX: 'pokretanje: {check}, treba x',
      chkOn: '{path}: {check}, treba {need}',
      clsBits: 'bitovi {cls} {bits}',
      clsRoot: 'EUID 0, bez provjere',
      clsg_owner: 'vlasnika',
      clsg_group: 'grupe',
      clsg_others: 'ostalih',
      cls_owner: 'vlasnik',
      cls_group: 'grupa',
      cls_others: 'ostali',
      chkSetuid: 'EUID ← vlasnik datoteke {uid}',
      chkSetgid: 'EGID ← grupa datoteke {gid}',
      chkIgnored: 'skripta: bit se zanemaruje, EUID = RUID',
      chkNone: 'bez posebnog bita: EUID = RUID',
      chkGroup: 'grupa nove datoteke: {group}',
      chkFromDir: 'od direktorija, setgid',
      chkFromProc: 'EGID procesa',
      stickyHead: 'sticky bit: prvi test koji prođe',
      test_fileOwner: 'EUID je vlasnik datoteke ({uid})',
      test_dirOwner: 'EUID je vlasnik direktorija ({uid})',
      test_privileged: 'EUID 0 (ovlast)',
      notTested: 'ne provjerava se',
      by_dirWrite: 'bez sticky bita: dovoljno je pisati u direktorij',
      goneLine: 'nema je: obrisana u koraku {n}',

      // captions
      goal_passwd: '`passwd` mijenja lozinku, a lozinke su u `/etc/shadow`, koju običan korisnik ne smije ni čitati. ' +
        'Pokreni ga i gledaj četiri broja procesa lijevo.',
      'goal_owner-not-root': 'Isti bit, ali program `/opt/ana/report` pripada korisnici `ana`. Koji će efektivni UID ' +
        'proces dobiti?',
      'goal_sticky-tmp': 'U `/tmp` pisati smije svatko. Smije li zato svatko i brisati tuđe datoteke?',
      'goal_setgid-dir': 'Zajednički direktorij grupe `projekt`, napravljen s `chmod 2770`. Koju grupu dobiva datoteka ' +
        'koja u njemu nastane?',
      'goal_script-ignored': 'Skripta s istim bitom i istim vlasnikom kao `passwd`. Pokreni je i usporedi brojeve.',
      capExecSuid: '{prog} ima bit setuid i vlasnik mu je {owner}: proces koji je pokrenuo {user} ima stvarni UID ' +
        '{ruid}, ali efektivni {euid}. Dozvole se provjeravaju po efektivnom.',
      capExecSuid_f: '{prog} ima bit setuid i vlasnik mu je {owner}: proces koji je pokrenula {user} ima stvarni UID ' +
        '{ruid}, ali efektivni {euid}. Dozvole se provjeravaju po efektivnom.',
      capNotRoot: 'Bit ne znači „pokreni kao root“, nego „pokreni kao vlasnik“.',
      capLower: 'Čak i root ovdje dobiva manje: efektivni UID je vlasnikov, {euid}.',
      capExecSame: 'Datoteka {prog} pripada upravo onome tko je pokreće ({user}): bit setuid ne mijenja ništa, stvarni ' +
        'i efektivni UID su {uid}.',
      capExecScript: '{prog} ima bit setuid i vlasnik mu je {owner}, ali to je skripta (`#!/bin/sh`): Linux bitove ' +
        'setuid i setgid na skriptama zanemaruje. Tumač radi s efektivnim UID-om {euid}, onim pozivatelja.',
      capPlainProg: '{prog} nema posebnog bita: stvarni i efektivni UID su {uid}.',
      capScriptStill: 'Bit na skripti nije pomogao: efektivni UID je {euid}.',
      capOpenRoot: 'Efektivni UID je 0 pa se provjera dozvola preskače: proces smije {verb} {path} iako mu način ' +
        '{ls} to ne bi dopustio.',
      capOpenRootAnyway: 'Efektivni UID je 0 pa se provjera dozvola preskače: proces smije {verb} {path}; bitovi {ls} ' +
        'se ni ne čitaju.',
      capOpenRootReal: 'Stvarni UID i dalje je {ruid}.',
      capOpenOwner: 'Efektivni UID {euid} vlasnik je datoteke {path}: odlučuju bitovi vlasnika {bits}, a oni dopuštaju ' +
        '{need}.',
      capOpenVia: 'Proces koji je pokrenuo {user} (stvarni UID {ruid}) to smije samo zato što mu je efektivni UID {euid}.',
      capOpenVia_f: 'Proces koji je pokrenula {user} (stvarni UID {ruid}) to smije samo zato što mu je efektivni UID {euid}.',
      capOpenClass: '{path} ne pripada efektivnom UID-u {euid}: odlučuju bitovi {cls} {bits}, a oni dopuštaju {need}.',
      capWriteNotDelete: 'Pisati u datoteku smije. Smije li je i obrisati, odlučuje direktorij {dir}.',
      capNotRootDenied: 'Efektivni UID {euid} nije 0: setuid je dao identitet vlasnika programa, ne roota.',
      capOpenDeniedGroup: 'Efektivni UID {euid} nije vlasnik ({owner}), ali grupa {group} jedna je od grupa procesa: ' +
        'odlučuju bitovi grupe {bits}, bez {need}. *Permission denied.*',
      capOpenDenied: 'Efektivni UID {euid} nije vlasnik ({owner}), a grupa {group} nije ni jedna od grupa procesa: ' +
        'ostaju bitovi ostalih {bits}, bez {need}. *Permission denied.*',
      capDenied: 'Odbijeno: bitovi {cls} {bits}, a treba {need}.',
      capCreateDir: '{user} smije pisati u {dir} ({check}). Nova datoteka pripada efektivnom UID-u {euid}, a grupa ' +
        'joj je {group}, grupa direktorija, jer {dir} ima bit setgid; nije EGID procesa ({egid}).',
      capCreateProc: '{user} smije pisati u {dir} ({check}). Nova datoteka pripada efektivnom UID-u {euid}, a grupa ' +
        'joj je {group}, EGID procesa: {dir} nema bit setgid.',
      capCreateMode: 'Način {ls}: pisati u nju smije svatko.',
      capUnlinkDenied: '{user} smije pisati u {dir} ({check}), ali {dir} ima sticky bit: efektivni UID {euid} nije ' +
        'vlasnik datoteke ({fowner}) ni direktorija ({downer}) i nema ovlasti. *Operation not permitted*; ' +
        'preimenovanje bi bilo odbijeno jednako.',
      capUnlinkBy_fileOwner: '{dir} ima sticky bit, a prvi od tri testa prolazi: efektivni UID {euid} vlasnik je ' +
        'datoteke. Unos {name} nestaje iz direktorija.',
      capUnlinkBy_dirOwner: '{dir} ima sticky bit. Prvi test pada (vlasnik datoteke je {fowner}), drugi prolazi: ' +
        'efektivni UID {euid} vlasnik je direktorija. Do trećeg testa, ovlasti, provjera ni ne dolazi.',
      capUnlinkBy_privileged: '{dir} ima sticky bit. Efektivni UID {euid} nije vlasnik ni datoteke ni direktorija, ' +
        'ali prolazi treći test: ovlast.',
      capUnlinkBy_dirWrite: '{dir} nema sticky bit: dovoljno je smjeti pisati u direktorij ({check}). Vlasnika ' +
        'datoteke ({fowner}) nitko ne pita.',
      capGone: '{path} više ne postoji: obrisana je u koraku {n}.',
      capStatSticky: 'Na mjestu `x` za ostale stoji `t`: sticky bit, oktalno 1 ispred ostalih znamenki, {oct}. Malo ' +
        'slovo jer je postavljen i `x`. Pisati u `/tmp` smije svatko.',
      capStatPlain: '`/tmp` je sada {oct}, bez `t`: tko smije pisati u direktorij, smije u njemu i brisati.',
      verb_r: 'čitati',
      verb_w: 'pisati u',

      explain:
        '<p>Devet bitova dozvola kaže tko smije što. Ispred njih stoje još tri, četvrta oktalna znamenka: 4 je ' +
        '[[set-user-ID on execution]], 2 je [[set-group-ID on execution]], 1 je <i lang="en">restricted deletion ' +
        'flag</i> (zastavica ograničenog brisanja), poznatija kao <i lang="en">sticky bit</i>. ' +
        '<code>passwd</code> je <code>4755</code>, <code>/tmp</code> <code>1777</code>, zajednički direktorij ' +
        '<code>2770</code>.</p>' +
        '<p>Svaki [[process]] ima dva korisnička broja: <i lang="en">real user ID</i> (stvarni korisnički ' +
        'identifikator, tko ga je pokrenuo) i <i lang="en">effective user ID</i> (efektivni korisnički ' +
        'identifikator, po kojem se provjerava [[file permission]]), a tako i dva grupna. Obično su jednaki. Kad se ' +
        'pokrene program s bitom setuid, efektivni UID novog procesa postaje vlasnik datoteke; stvarni ostaje ' +
        'pozivatelj. Bit setgid jednako mijenja efektivni GID u grupu datoteke. Efektivni UID 0 zaobilazi provjere ' +
        'dozvola.</p>' +
        '<p>Na direktoriju bitovi znače drugo. Uz setgid nova datoteka dobiva grupu direktorija, ne grupu procesa. ' +
        'Uz sticky bit brisati ili preimenovati datoteku smije samo vlasnik datoteke, vlasnik direktorija ili proces s ' +
        'ovlastima; samo pravo pisanja u direktorij nije dovoljno.</p>' +
        '<p>U <code>ls -l</code> slovo stoji na mjestu <code>x</code>: <code>s</code> ili <code>t</code> kad je ' +
        '<code>x</code> postavljen, <code>S</code> ili <code>T</code> kad nije. <code>S</code> nije isto što i ' +
        '<code>s</code>: setgid bez <code>x</code> za grupu ne mijenja EGID pri pokretanju.</p>' +
        '<p>Sustav se od tih bitova brani. Kad u datoteku piše proces bez ovlasti, setuid se briše (setgid samo ako je ' +
        'postavljen i <code>x</code> za grupu ili proces nije u grupi datoteke), a slično vrijedi i za <code>chown</code> ili <code>chgrp</code>. Linux ' +
        'bitove setuid i setgid na skriptama (<code>#!</code>) zanemaruje. Uži put od setuida na rootu je ' +
        '[[capability]]: program dobiva samo jednu ovlast, a ne sve.</p>' +
        '<p>Na mnogim sustavima <code>student</code> ne može ni preusmjeriti izlaz (<code>&gt;&gt;</code>) u aninu ' +
        'datoteku u <code>/tmp</code>, iako mu bitovi dopuštaju pisanje: to je zasebna zaštita jezgre ' +
        '(<code>protected_regular</code>), ne sticky bit. Ovdje se datoteka samo otvara za pisanje.</p>'
    },

    en: {
      stage: 'The process, the file with the special bit and the kernel’s decision',

      actor: 'Who acts as student',
      sticky: 'Sticky bit on /tmp',
      script: 'Actions',
      actor_student: 'student',
      actor_ana: 'ana',
      actor_root: 'root',

      preset_passwd: 'passwd',
      preset_passwd_hint: 'setuid and owned by root: real UID 1000, effective 0',
      'preset_owner-not-root': 'Owner is not root',
      'preset_owner-not-root_hint': 'the same bit on a program of ana’s: effective UID 1001',
      'preset_sticky-tmp': 'Sticky bit on /tmp',
      'preset_sticky-tmp_hint': 'student may write ana’s file but may not delete it',
      'preset_setgid-dir': 'setgid on a directory',
      'preset_setgid-dir_hint': 'a new file in /srv/projekt gets group projekt',
      'preset_script-ignored': 'A setuid script',
      'preset_script-ignored_hint': 'Linux ignores the bit on a script: the effective UID stays 1000',

      legReal: 'real ID',
      legEff: 'effective ID, highlighted when it differs',
      legLetter: 'special-bit letter',
      legOk: 'allowed',
      legNo: 'refused',
      legRule: 'the rule that decided',
      legChanged: 'changed in this step',

      before: 'Nothing has happened yet.',
      opens: 'opens {path} for {need}',
      need_r: 'reading',
      need_w: 'writing',
      stripProc: 'process {cmd}',
      resOk: 'done',
      resLook: 'a look only',

      colProc: 'Process',
      noProc: 'No process yet.',
      real: 'real',
      eff: 'effective',
      differs: '≠ real',
      groupsLbl: 'supplementary groups',
      users: 'Users and groups',
      inGroups: 'groups {list}',

      colBit: 'The special bit',
      octalLbl: 'octal',
      digitHead: 'first digit',
      bitName_setuid: 'setuid',
      bitName_setgid: 'setgid',
      bitName_sticky: 'sticky (restricted deletion)',
      keyHead: 'letter in place of x',
      keyWithX: 'bit and x',
      keyNoX: 'bit without x',
      entries: 'Contents',
      empty: 'empty',
      newTag: 'new',
      removedTag: 'removed',
      scriptNote: 'a script, first line',

      colTarget: 'Target and decision',
      noAction: 'Step 1 starts with an action.',
      allowed: 'allowed',
      refused: 'refused',
      look: 'a look only: nothing is decided',
      ruleN: 'rule {n}',
      rule_1: 'setuid: the EUID becomes the file’s owner',
      rule_2: 'setgid: the EGID becomes the file’s group',
      rule_3: 'checked by EUID and EGID; EUID 0 skips it',
      rule_4: 'sticky: only the file’s owner, the directory’s owner or a privileged process deletes',
      rule_5: 'setgid on a directory: a new file gets its group',
      rule_6: 'fourth digit 4 + 2 + 1; a letter in place of x',
      rule_7: 'a write or chown clears setuid and setgid',
      rule_8: 'a script: setuid and setgid are ignored',
      chkX: 'exec: {check}, needs x',
      chkOn: '{path}: {check}, needs {need}',
      clsBits: '{cls} bits {bits}',
      clsRoot: 'EUID 0, no check',
      clsg_owner: 'owner',
      clsg_group: 'group',
      clsg_others: 'others',
      cls_owner: 'owner',
      cls_group: 'group',
      cls_others: 'others',
      chkSetuid: 'EUID ← the file’s owner {uid}',
      chkSetgid: 'EGID ← the file’s group {gid}',
      chkIgnored: 'a script: the bit is ignored, EUID = RUID',
      chkNone: 'no special bit: EUID = RUID',
      chkGroup: 'group of the new file: {group}',
      chkFromDir: 'from the directory, setgid',
      chkFromProc: 'the process’s EGID',
      stickyHead: 'sticky bit: the first test that passes',
      test_fileOwner: 'EUID owns the file ({uid})',
      test_dirOwner: 'EUID owns the directory ({uid})',
      test_privileged: 'EUID 0 (privilege)',
      notTested: 'not tested',
      by_dirWrite: 'no sticky bit: writing the directory is enough',
      goneLine: 'gone: removed at step {n}',

      goal_passwd: '`passwd` changes a password, and passwords are in `/etc/shadow`, which an ordinary user may not ' +
        'even read. Run it and watch the process’s four numbers on the left.',
      'goal_owner-not-root': 'The same bit, but the program `/opt/ana/report` belongs to `ana`. Which effective UID ' +
        'will the process get?',
      'goal_sticky-tmp': 'Anyone may write in `/tmp`. Does that let anyone delete other people’s files too?',
      'goal_setgid-dir': 'The shared directory of group `projekt`, made with `chmod 2770`. Which group does a file ' +
        'created in it get?',
      'goal_script-ignored': 'A script with the same bit and the same owner as `passwd`. Run it and compare the numbers.',
      capExecSuid: '{prog} has the setuid bit and is owned by {owner}: the process {user} started has real UID ' +
        '{ruid} but effective UID {euid}. Permissions are checked against the effective one.',
      capExecSuid_f: '{prog} has the setuid bit and is owned by {owner}: the process {user} started has real UID ' +
        '{ruid} but effective UID {euid}. Permissions are checked against the effective one.',
      capNotRoot: 'The bit does not mean “run as root” but “run as the owner”.',
      capLower: 'Even root gets less here: the effective UID is the owner’s, {euid}.',
      capExecSame: '{prog} belongs to the very user who runs it ({user}): the setuid bit changes nothing, real and ' +
        'effective UID are both {uid}.',
      capExecScript: '{prog} has the setuid bit and is owned by {owner}, but it is a script (`#!/bin/sh`): Linux ' +
        'ignores setuid and setgid on scripts. The interpreter runs with effective UID {euid}, the caller’s.',
      capPlainProg: '{prog} has no special bit: real and effective UID are both {uid}.',
      capScriptStill: 'The bit on the script did not help: the effective UID is {euid}.',
      capOpenRoot: 'The effective UID is 0, so the permission check is skipped: the process may {verb} {path} ' +
        'although its mode {ls} would not allow it.',
      capOpenRootAnyway: 'The effective UID is 0, so the permission check is skipped: the process may {verb} {path}; ' +
        'the bits {ls} are not even read.',
      capOpenRootReal: 'The real UID is still {ruid}.',
      capOpenOwner: 'Effective UID {euid} owns {path}: the owner bits {bits} decide, and they allow {need}.',
      capOpenVia: 'The process {user} started (real UID {ruid}) may do so only because its effective UID is {euid}.',
      capOpenVia_f: 'The process {user} started (real UID {ruid}) may do so only because its effective UID is {euid}.',
      capOpenClass: '{path} does not belong to effective UID {euid}: the {cls} bits {bits} decide, and they allow {need}.',
      capWriteNotDelete: 'Writing the file is allowed. Whether it may be deleted is up to the directory {dir}.',
      capNotRootDenied: 'Effective UID {euid} is not 0: setuid gave the program owner’s identity, not root’s.',
      capOpenDeniedGroup: 'Effective UID {euid} is not the owner ({owner}), but group {group} is one of the process’s ' +
        'groups: the group bits {bits} decide, without {need}. *Permission denied.*',
      capOpenDenied: 'Effective UID {euid} is not the owner ({owner}), and group {group} is none of the process’s ' +
        'groups: the others bits {bits} are left, without {need}. *Permission denied.*',
      capDenied: 'Refused: the {cls} bits {bits}, and it needs {need}.',
      capCreateDir: '{user} may write in {dir} ({check}). The new file belongs to the effective UID {euid}, and its ' +
        'group is {group}, the directory’s group, because {dir} has the setgid bit; not the process’s EGID ({egid}).',
      capCreateProc: '{user} may write in {dir} ({check}). The new file belongs to the effective UID {euid}, and its ' +
        'group is {group}, the process’s EGID: {dir} has no setgid bit.',
      capCreateMode: 'Mode {ls}: anyone may write to it.',
      capUnlinkDenied: '{user} may write in {dir} ({check}), but {dir} has the sticky bit: effective UID {euid} owns ' +
        'neither the file ({fowner}) nor the directory ({downer}) and is not privileged. *Operation not permitted*; ' +
        'a rename would be refused the same way.',
      capUnlinkBy_fileOwner: '{dir} has the sticky bit, and the first of the three tests passes: effective UID ' +
        '{euid} owns the file. The entry {name} leaves the directory.',
      capUnlinkBy_dirOwner: '{dir} has the sticky bit. The first test fails (the file’s owner is {fowner}), the ' +
        'second passes: effective UID {euid} owns the directory. The third test, privilege, is never reached.',
      capUnlinkBy_privileged: '{dir} has the sticky bit. Effective UID {euid} owns neither the file nor the ' +
        'directory, but passes the third test: privilege.',
      capUnlinkBy_dirWrite: '{dir} has no sticky bit: being allowed to write the directory is enough ({check}). ' +
        'Nobody asks the file’s owner ({fowner}).',
      capGone: '{path} no longer exists: it was removed at step {n}.',
      capStatSticky: 'In place of the others’ `x` stands a `t`: the sticky bit, octal 1 in front of the other digits, ' +
        '{oct}. Lowercase because the `x` is set too. Anyone may write in `/tmp`.',
      capStatPlain: '`/tmp` is now {oct}, without the `t`: whoever may write the directory may also delete in it.',
      verb_r: 'read',
      verb_w: 'write to',

      explain:
        '<p>The nine permission bits say who may do what. In front of them stand three more, the fourth octal digit: ' +
        '4 is [[set-user-ID on execution]], 2 is [[set-group-ID on execution]], 1 is the restricted deletion flag, ' +
        'better known as the sticky bit. <code>passwd</code> is <code>4755</code>, <code>/tmp</code> ' +
        '<code>1777</code>, a shared directory <code>2770</code>.</p>' +
        '<p>Every [[process]] has two user numbers: the real user ID (who started it) and the effective user ID (the ' +
        'one each [[file permission]] is checked against), and two group numbers likewise. Usually they are equal. ' +
        'When a program with the setuid bit is run, the new process’s effective UID becomes the file’s owner; the real ' +
        'one stays the caller. The setgid bit sets the effective GID to the file’s group the same way. An effective ' +
        'UID of 0 bypasses the permission checks.</p>' +
        '<p>On a directory the bits mean something else. With setgid, a new file gets the directory’s group, not the ' +
        'process’s. With the sticky bit, only the file’s owner, the directory’s owner or a privileged process may ' +
        'delete or rename a file; the right to write the directory is not enough.</p>' +
        '<p>In <code>ls -l</code> the letter stands in place of the <code>x</code>: <code>s</code> or <code>t</code> ' +
        'when the <code>x</code> is set, <code>S</code> or <code>T</code> when not. <code>S</code> is not the same ' +
        'as <code>s</code>: setgid without the group’s <code>x</code> does not change the EGID on exec.</p>' +
        '<p>The system guards these bits. When an unprivileged process writes to the file, setuid is cleared (setgid ' +
        'only if the group’s <code>x</code> is set too or the writer is not in the file’s group), and much the same for <code>chown</code> or ' +
        '<code>chgrp</code>. Linux ignores setuid and setgid on scripts (<code>#!</code>). A narrower path than ' +
        'setuid root is a [[capability]]: the program gets one privilege, not all of them.</p>' +
        '<p>On many systems <code>student</code> cannot even redirect output (<code>&gt;&gt;</code>) into ana’s file ' +
        'in <code>/tmp</code>, although the bits allow writing: that is a separate kernel protection ' +
        '(<code>protected_regular</code>), not the sticky bit. Here the file is only opened for writing.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
