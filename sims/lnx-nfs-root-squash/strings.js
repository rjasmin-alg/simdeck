/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-nfs-root-squash, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term
   (first mention; [[=term]] later ones). Host names, numbers, paths, option words, commands and the system's error
   messages are data: the page puts them in translate="no" elements. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Zahtjev s klijenta stiže na NFS izvoz; poslužitelj odlučuje',

      // params
      ro: 'ro: izvoz samo za čitanje',
      squash: 'Preslikavanje korisnika',
      script: 'Zahtjevi',

      // presets
      'preset_book-ro': 'Iz knjige: ro',
      'preset_book-ro_hint': 'cat prolazi, a sudo touch dobiva Read-only file system',
      'preset_root-squashed': 'root_squash',
      'preset_root-squashed_hint': 'root s klijenta postaje nobody (65534)',
      'preset_uid-collision': 'Isti broj, drugo ime',
      'preset_uid-collision_hint': 'student (1000) s klijenta je na poslužitelju ana (1000)',
      'preset_no-root-squash': 'no_root_squash',
      'preset_no-root-squash_hint': 'root s klijenta je root i na izvozu',
      'preset_bin-not-squashed': 'bin nije preslikan',
      'preset_bin-not-squashed_hint': 'root_squash dira samo broj 0',
      'preset_all-squash': 'all_squash',
      'preset_all-squash_hint': 'svaki korisnik postaje nobody',

      // legend
      legUser: 'korisnik s klijenta i broj koji nosi',
      legEnvelope: 'zahtjev: samo brojevi',
      legMap: 'preslikavanje broja',
      legFile: 'datoteka na poslužitelju',
      legRefused: 'odbijeno',
      legNew: 'nova datoteka',
      legChanged: 'promijenjeno',

      // client
      client: 'Klijent',
      mounted: 'montirano',
      passwd: '/etc/passwd (isječak)',
      runs: 'pokreće',
      viaSudo: 'preko sudo',
      binProcess: 'proces korisnika bin',
      idle: 'Još nije poslan nijedan zahtjev.',

      // request and phases
      request: 'Zahtjev',
      noNames: 'bez imena korisnika',
      op_read: 'čitaj',
      op_write: 'piši u',
      op_create: 'stvori',
      phases: 'Što poslužitelj radi',
      ph_send: 'klijent šalje brojeve',
      ph_export: 'izvoz: ro ili rw?',
      ph_map: 'preslikavanje',
      ph_perm: 'dozvole s preslikanim brojem',
      ph_apply: 'izvršenje',
      st_ok: 'prolazi',
      st_refused: 'odbijeno',
      st_skipped: 'ne dolazi na red',
      exportWrite: 'pisanje na izvozu {opt}',
      exportRead: 'čitanje: {opt} ga dopušta',
      mapSame: 'ostaje {ids}',
      checkRoot: 'root: bitovi ga ne zaustavljaju',
      checkLine: '{target}: {cls} {bits}, treba {need}',
      targetDir: 'direktorij',
      cls_owner: 'vlasnik',
      cls_group: 'grupa',
      cls_others: 'ostali',
      applyRead: 'vraća sadržaj',
      applyWrite: 'upisano',
      applyCreate: 'nova datoteka, vlasnik {owner}',

      // server
      server: 'Poslužitelj',
      exportfs: 'na snazi (exportfs -v)',
      outOfScope: 'sivo: opcije koje ovdje ne odlučuju',
      files: 'Sadržaj izvoza',
      colName: 'ime',
      colOwner: 'vlasnik',
      colGroup: 'grupa',
      colMode: 'dozvole',
      newTag: 'novo',

      // result
      result: 'Klijent vidi',
      exitStatus: 'izlazni status: {n}',
      onServer: 'Na poslužitelju',
      ownerIs: '{name}: vlasnik {owner}',
      wroteTo: 'datoteka {name} je izmijenjena',
      nothingChanged: 'ništa se nije promijenilo',

      // file contents (what a read returns)
      content_proba_txt: 'podatak s posluzitelja',
      content_tajna: 'Anina bilješka',
      content_plan_txt: 'plan za petak',

      // captions: the mapping, then the result
      capStart: 'Klijent {cli} montirao je {path} s poslužitelja {srv}. Svaki zahtjev nosi samo brojeve, uid i gid, ' +
        'a poslužitelj ih čita prema svojem popisu korisnika. Pritisni → za prvi zahtjev.',
      map_notReached: 'Izvoz je {ro}: poslužitelj odbija svako pisanje, koji god broj zahtjev nosio, pa ni sudo na ' +
        'klijentu tu ništa ne mijenja.',
      map_notReachedPlain: 'Izvoz je {ro}: poslužitelj odbija svako pisanje, koji god broj zahtjev nosio, pa ni ' +
        'dozvole datoteke tu ništa ne mijenjaju.',
      map_squashedRoot: 'Zahtjev nosi samo broj: {uid}. Poslužitelj ga zbog {opt} preslikava u 65534 ({nobody}), ' +
        'pa je za njega {root} s klijenta samo jedan od „ostalih“.',
      map_squashedAll: 'Zahtjev nosi {uid}. Zbog {opt} poslužitelj svaki broj preslikava u 65534 ({nobody}), pa ni ' +
        '{user} na izvozu više nema svoj broj.',
      map_rootKept: 'Zahtjev nosi {uid}, a {opt} ga ostavlja kakav jest: {root} s klijenta je {root} i na izvozu.',
      map_collision: 'Zahtjev nosi samo broj: {uid}. Na poslužitelju taj broj ima {sname}, pa je {user} s klijenta ' +
        'ondje {sname}. Nitko nije provalio; brojevi su se poklopili.',
      map_keptSystem: 'Zahtjev nosi {uid}. {opt} dira samo broj 0, pa {user} ostaje {user} i na poslužitelju.',
      map_kept: 'Zahtjev nosi {uid}; poslužitelj ga ne mijenja i čita kao {sname}.',
      res_erofs: 'Klijent dobiva {msg} i izlazni status 1: odluka je donesena na poslužitelju.',
      res_eacces: 'Dozvole odlučuju s preslikanim brojem: bitovi za {cls} na {target} su {bits}, nema {need}, pa ' +
        'klijent dobiva {msg}.',
      res_ok: 'Dozvole odlučuju s preslikanim brojem: bitovi za {cls} na {target} su {bits}, pa zahtjev prolazi.',
      res_root: 'Dozvole ga ne zaustavljaju.',
      res_created: 'Nova datoteka {name} na poslužitelju pripada broju {owner} ({sname}).',
      targetFile: 'datoteci {name}',
      targetDirIn: 'direktoriju izvoza',
      capCls_owner: 'vlasnika',
      capCls_group: 'grupu',
      capCls_others: '„ostale“',

      explain:
        '<p>NFS poslužitelj stavlja direktorij na raspolaganje kao [[export]], a klijent ga ugrađuje u svoje ' +
        'stablo, i to je [[mounting]]. Svaki zahtjev koji klijent pošalje nosi korisnika samo kao <b>broj</b>: korisnički i grupni ' +
        'identifikator (UID i GID), nikad ime. Poslužitelj taj broj čita prema <b>svojem</b> popisu korisnika, pa je ' +
        'student 1000 s klijenta na poslužitelju onaj tko ondje ima 1000.</p>' +
        '<p>Poslužitelj odlučuje redom. Najprije izvoz: na izvozu <code>ro</code> svako je pisanje odbijeno porukom ' +
        '<code>Read-only file system</code>, i sudo na klijentu tu ne pomaže. Zatim preslikavanje: <code>root_squash</code> ' +
        '(zadano) broj 0 pretvara u anonimnog korisnika 65534 (<code>nobody</code>), <code>no_root_squash</code> ga ' +
        'ostavlja, a <code>all_squash</code> u njega pretvara svaki broj. Na kraju odlučuje [[file permission]] s ' +
        'preslikanim brojem: vlasnika, grupe ili ostalih. Nova datoteka dobiva preslikani broj za vlasnika.</p>' +
        '<p>Tri zablude: <i>root</i> s klijenta nije <i>root</i> na poslužitelju; NFS ne provjerava imena; ' +
        '<code>root_squash</code> ne čini izvoz sigurnim, jer ne dira druge osjetljive brojeve (<code>bin</code>, ' +
        'grupa <code>staff</code>) ni poklapanje brojeva između strojeva.</p>' +
        '<p>SMB odgovara drukčije: [[share]] se traži imenom, a korisnik se prijavljuje imenom i lozinkom.</p>'
    },
    en: {
      stage: 'A client\'s request reaches an NFS export; the server decides',

      ro: 'ro: read-only export',
      squash: 'User mapping',
      script: 'Requests',

      'preset_book-ro': 'From the book: ro',
      'preset_book-ro_hint': 'cat works, sudo touch gets Read-only file system',
      'preset_root-squashed': 'root_squash',
      'preset_root-squashed_hint': 'the client\'s root becomes nobody (65534)',
      'preset_uid-collision': 'Same number, another name',
      'preset_uid-collision_hint': 'the client\'s student (1000) is ana (1000) on the server',
      'preset_no-root-squash': 'no_root_squash',
      'preset_no-root-squash_hint': 'the client\'s root is root on the export too',
      'preset_bin-not-squashed': 'bin is not squashed',
      'preset_bin-not-squashed_hint': 'root_squash only touches the number 0',
      'preset_all-squash': 'all_squash',
      'preset_all-squash_hint': 'every user becomes nobody',

      legUser: 'client user and the number it carries',
      legEnvelope: 'request: numbers only',
      legMap: 'number mapped',
      legFile: 'file on the server',
      legRefused: 'refused',
      legNew: 'new file',
      legChanged: 'changed',

      client: 'Client',
      mounted: 'mounted',
      passwd: '/etc/passwd (excerpt)',
      runs: 'runs',
      viaSudo: 'through sudo',
      binProcess: 'a process running as bin',
      idle: 'No request sent yet.',

      request: 'Request',
      noNames: 'no user names',
      op_read: 'read',
      op_write: 'write to',
      op_create: 'create',
      phases: 'What the server does',
      ph_send: 'the client sends numbers',
      ph_export: 'export: ro or rw?',
      ph_map: 'mapping',
      ph_perm: 'permissions with the mapped number',
      ph_apply: 'carried out',
      st_ok: 'passes',
      st_refused: 'refused',
      st_skipped: 'not reached',
      exportWrite: 'a write on a {opt} export',
      exportRead: 'a read: {opt} allows it',
      mapSame: 'stays {ids}',
      checkRoot: 'root: the bits do not stop it',
      checkLine: '{target}: {cls} {bits}, needs {need}',
      targetDir: 'directory',
      cls_owner: 'owner',
      cls_group: 'group',
      cls_others: 'others',
      applyRead: 'returns the content',
      applyWrite: 'written',
      applyCreate: 'new file, owner {owner}',

      server: 'Server',
      exportfs: 'in force (exportfs -v)',
      outOfScope: 'grey: options that do not decide here',
      files: 'The export\'s contents',
      colName: 'name',
      colOwner: 'owner',
      colGroup: 'group',
      colMode: 'mode',
      newTag: 'new',

      result: 'The client sees',
      exitStatus: 'exit status: {n}',
      onServer: 'On the server',
      ownerIs: '{name}: owner {owner}',
      wroteTo: 'the file {name} changed',
      nothingChanged: 'nothing changed',

      content_proba_txt: 'podatak s posluzitelja',
      content_tajna: 'ana\'s note',
      content_plan_txt: 'plan for Friday',

      capStart: 'Client {cli} has mounted {path} from server {srv}. Every request carries only numbers, uid and gid, ' +
        'and the server reads them by its own list of users. Press → for the first request.',
      map_notReached: 'The export is {ro}: the server refuses every write, whatever number the request carries, so ' +
        'sudo on the client changes nothing.',
      map_notReachedPlain: 'The export is {ro}: the server refuses every write, whatever number the request carries, ' +
        'so the file\'s permission bits change nothing.',
      map_squashedRoot: 'The request carries only a number: {uid}. Because of {opt} the server maps it to 65534 ' +
        '({nobody}), so to the server the client\'s {root} is just one of the \'others\'.',
      map_squashedAll: 'The request carries {uid}. Because of {opt} the server maps every number to 65534 ' +
        '({nobody}), so even {user} loses their own number on the export.',
      map_rootKept: 'The request carries {uid}, and {opt} leaves it as it is: the client\'s {root} is {root} on the ' +
        'export too.',
      map_collision: 'The request carries only a number: {uid}. On the server that number is {sname}\'s, so the ' +
        'client\'s {user} is {sname} there. Nobody broke in; the numbers matched.',
      map_keptSystem: 'The request carries {uid}. {opt} only touches the number 0, so {user} stays {user} on the ' +
        'server too.',
      map_kept: 'The request carries {uid}; the server keeps it and reads it as {sname}.',
      res_erofs: 'The client gets {msg} and exit status 1: the decision was made on the server.',
      res_eacces: 'The permissions decide with the mapped number: the bits for {cls} on {target} are {bits}, no ' +
        '{need}, so the client gets {msg}.',
      res_ok: 'The permissions decide with the mapped number: the bits for {cls} on {target} are {bits}, so the ' +
        'request passes.',
      res_root: 'The permissions do not stop it.',
      res_created: 'The new file {name} on the server belongs to number {owner} ({sname}).',
      targetFile: 'the file {name}',
      targetDirIn: 'the export\'s directory',
      capCls_owner: 'the owner',
      capCls_group: 'the group',
      capCls_others: '\'others\'',

      explain:
        '<p>An NFS server makes a directory available as an [[export]], and the client attaches it to its own tree by ' +
        '[[mounting]]. Every request the client sends carries the user only as a <b>number</b>: the user and group ' +
        'identifiers (UID and GID), never a name. The server reads that number by <b>its own</b> list of users, so ' +
        'student 1000 on the client is whoever has 1000 on the server.</p>' +
        '<p>The server decides in order. First the export: on an <code>ro</code> export every write is refused with ' +
        '<code>Read-only file system</code>, and sudo on the client does not help. Then the mapping: ' +
        '<code>root_squash</code> (the default) turns the number 0 into the anonymous user 65534 ' +
        '(<code>nobody</code>), <code>no_root_squash</code> keeps it, and <code>all_squash</code> maps every number to it. ' +
        'Last, the ordinary [[file permission]] decides with the mapped number: owner, group or others. A new ' +
        'file gets the mapped number as its owner.</p>' +
        '<p>Three misconceptions: <i>root</i> on the client is not <i>root</i> on the server; NFS does not check ' +
        'names; <code>root_squash</code> does not make an export safe, because it leaves other sensitive numbers ' +
        '(<code>bin</code>, group <code>staff</code>) and numbers that match across machines alone.</p>' +
        '<p>SMB answers differently: a [[share]] is asked for by name, and the user logs in with a name and a ' +
        'password.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
