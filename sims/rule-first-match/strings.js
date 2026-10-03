/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of rule-first-match, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* marks an English term in italics on the Croatian page (the page turns it into <em lang="en">); terms
   missing from kit/glossary.js are written out this way (NOTES.md, "Term pairs").
   Rule text (all, any, permit, deny, host, local, method names, addresses) is data, not language: the page shows it
   with translate="no". The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Popis pravila i zahtjevi koji kroz njega prolaze',

      // params
      scene: 'Popis',
      scenePg: 'pg_hba.conf',
      scenePgAppend: 'pg_hba.conf s retkom na kraju',
      sceneAcl: 'ACL na usmjerniku',
      sceneStateless: 'filtar bez stanja i odgovor',
      sceneTop: '„propusti sve” na vrhu',
      request: 'Zahtjev',
      reqAll: 'svi',
      fix: 'Popravak',
      fixHint: 'Primijeni popravak ovog popisa: izmijeni, premjesti ili dodaj redak.',
      mode: 'Jedan korak',
      modeRow: 'redak',
      modeReq: 'zahtjev',

      // presets
      presetPg: 'pg_hba.conf: ident',
      presetPgHint: 'Lozinka postoji, ali je redak 2 nikad ne traži.',
      presetPgAppend: 'Popravak na kraju',
      presetPgAppendHint: 'Ispravan redak dodan na kraj ne pomaže.',
      presetAcl: 'ACL: SSH za admina',
      presetAclHint: 'Dopuštenje stoji ispod zabrane.',
      presetStateless: 'Bez stanja: odgovor',
      presetStatelessHint: 'Odgovor se procjenjuje sam za sebe.',
      presetTop: '„Propusti sve” na vrhu',
      presetTopHint: 'Zabrane ispod njega su mrtve.',

      // legend
      legNo: 'provjeren, ne odgovara',
      legMatch: 'odgovara: odlučuje',
      legSkip: 'ne čita se',
      legShadow: 'zasjenjen redak',
      legOutcome: 'propušten ✓ / odbijen ✕',
      legChanged: 'promijenjeno',

      // queue
      queueTitle: 'Zahtjevi',
      reqN: 'Zahtjev {n}',
      cardSocket: 'lokalno, preko *socketa*',
      cardTcp: 'TCP s adrese {addr}',
      cardDb: 'baza {db}',
      cardUser: 'korisnik {user}',
      cardOs: 'OS korisnik {os}',
      dirOut: 'zahtjev klijenta',
      dirReply: 'odgovor poslužitelja',
      dirUnsolicited: 'nepozvan paket',
      now: 'na redu',

      // table
      tableTitle: 'Popis pravila: čita se odozgo',
      colNo: '#',
      colType: 'vrsta',
      colDb: 'baza',
      colUser: 'korisnik',
      colAddr: 'adresa',
      colMethod: 'metoda',
      colProto: 'protokol',
      colSrc: 'izvor',
      colSrcPort: 'izv. port',
      colDst: 'odredište',
      colDstPort: 'odr. port',
      colAction: 'akcija',
      colMark: 'zahtjev {n}',
      colMarkNone: 'provjera',
      implicitPg: '(nema zapisa: odbij)',
      implicitAcl: '(implicitno: odbij sve)',
      markSkip: 'ne čita se',
      markMatch: 'odgovara',
      shadowOf: 'zasjenjen ({r})',
      fixTag: 'popravak',
      wasLabel: 'bio {r}',

      // outcomes
      outPermit: 'propušten',
      outDeny: 'odbačen',
      outAccept: 'prihvaćena',
      outReject: 'odbijena',
      tallyTitle: 'Ishod',
      tallyEmpty: 'Još ništa nije odlučeno.',
      tallyRow: 'redak {r}',
      tallyImplicit: 'kraj popisa',
      whyName: 'OS korisnik {os} nije korisnik baze {user}',
      whyNameOk: 'OS korisnik {os} je i korisnik baze',
      whyPassword: 'lozinka je zatražena i točna',
      whyReject: 'redak odbija',
      whyTrust: 'bez provjere',

      // captions
      capStart: ['{n} zahtjev čeka.', '{n} zahtjeva čekaju.', '{n} zahtjeva čeka.'],
      capStartRule: ' Popis se čita odozgo, a odlučuje prvi redak koji odgovara u svim stupcima.',
      capShadow: ' Redak {r} je zasjenjen: redak {by} hvata sve što bi i on, pa do njega nijedan zahtjev ne dolazi.',
      capShadowMany: ' Retci {rs} su zasjenjeni: redak {by} hvata sve što bi i oni, pa do njih nijedan zahtjev ne dolazi.',
      fixEdit: ' Popravak: u retku {r} metoda je sada {m}.',
      fixMoveTop: ' Popravak: redak {was} premješten je na vrh, kao {r}.',
      fixMoveEnd: ' Popravak: redak {was} premješten je na kraj, kao {r}.',
      fixAdd: ' Popravak: dodan je redak {r}.',
      capNo: 'Zahtjev {q}, redak {r}: ne odgovara ({fields}).',
      capNext: ' Dalje na redak {r}.',
      capLast: ' To je bio zadnji redak.',
      capMatchPg: 'Zahtjev {q}: redak {r} odgovara u sva četiri stupca i on odlučuje. U sljedećem koraku provjerava se njegova metoda, {m}.',
      capAction: 'Zahtjev {q}: redak {r} odgovara i kaže {a}. Retci ispod njega se ne čitaju.',
      capMethodFail: 'Redak {r} nalaže metodu {m}: {why}. Provjera pada i veza je odbijena; sljedeći se retci ne razmatraju.',
      capMethodOk: 'Redak {r} nalaže metodu {m}: {why}. Veza je prihvaćena.',
      capLaterPermit: ' Redak {r} bi ga propustio, ali do njega se ne dolazi.',
      capLaterDeny: ' Redak {r} bi ga odbacio, ali do njega se ne dolazi.',
      capLaterAccept: ' Redak {r} bi vezu prihvatio, ali nikad ne dolazi na red.',
      capLaterReject: ' Redak {r} bi je odbio, ali nikad ne dolazi na red.',
      capImplicitPg: 'Nijedan redak ne odgovara zahtjevu {q}: u pg_hba.conf nema zapisa za tu vezu i ona je odbijena.',
      capImplicitAcl: 'Nijedno pravilo ne odgovara paketu {pkt}, pa pada na implicitnu zabranu na kraju popisa. U popisu to nigdje ne piše: zabrana je nevidljiva.',
      noteReplyAlone: ' Filtar bez stanja ne pamti da je klijent pitao: odgovor treba vlastito pravilo.',
      noteWide: ' Pravilo 20 propušta svaki paket s izvorišnog porta 443 prema cijeloj mreži, pa i ovaj nepozvani.',
      list2: '{a} i {b}',
      listMore: '{a}, {b}',

      explain:
        '<p>Popis pravila čita se <strong>odozgo prema dolje</strong>, redak po redak. Redak odgovara samo ako odgovara ' +
        '<strong>svaki</strong> njegov stupac (<code>all</code> i <code>any</code> odgovaraju svemu, adresa odgovara ako je ' +
        'unutar prefiksa retka). Odlučuje <strong>prvi</strong> redak koji odgovara, a retci ispod njega se i ne čitaju. To je ' +
        '[[first matching entry]].</p>' +
        '<p>Ako ne odgovara nijedan redak, odlučuje pravilo koje u popisu ne piše: [[ACL]] na usmjerniku na kraju ima ' +
        'implicitni <em lang="en">deny</em>, a <code>pg_hba.conf</code> vezu bez zapisa odbija. To je politika ' +
        '<em lang="en">deny by default</em> („odbij po zadanome”): propušta se samo ono što je izričito dopušteno.</p>' +
        '<p>U <code>pg_hba.conf</code>-u izabrani redak nalaže i metodu provjere. Ako ona padne, veza je odbijena: nema ' +
        'propadanja na sljedeći redak. Zato ispravan redak dodan na kraj ne pomaže; popravlja se redak koji je odlučio.</p>' +
        '<p><em lang="en">Stateless</em> (bez stanja) filtar procjenjuje svaki paket sam za sebe, pa odgovor treba ' +
        'vlastito pravilo, a takvo pravilo lako ispadne preširoko. Filtar sa stanjem odgovor prepozna sam (zaseban simulator).</p>' +
        '<p><strong>Zablude:</strong> „pobjeđuje najspecifičnije pravilo” (ne: prvo); „dodam ispravno pravilo na kraj i ' +
        'riješeno” (ne dolazi na red); „ako izabrano pravilo padne, proba se sljedeće” (ne proba se).</p>' +
        '<p><strong>Drukčija pravila:</strong> put paketa kroz više lanaca vatrozida u jezgri nije jedan popis; PAM gleda ' +
        'zastavice modula; u NTFS-u zabrana pobjeđuje bez obzira na redoslijed; neki vatrozidi na računalu primjenjuju ' +
        'pravila zabrane prije dopuštenja, bez obzira na redoslijed; usmjeravanje bira najdulji prefiks.</p>'
    },
    en: {
      stage: 'A rule list and the requests that go through it',

      scene: 'List',
      scenePg: 'pg_hba.conf',
      scenePgAppend: 'pg_hba.conf with a row at the end',
      sceneAcl: 'router ACL',
      sceneStateless: 'stateless filter and the reply',
      sceneTop: '“permit any” on top',
      request: 'Request',
      reqAll: 'all',
      fix: 'Fix',
      fixHint: 'Apply this list\'s fix: edit, move or add a row.',
      mode: 'One step',
      modeRow: 'row',
      modeReq: 'request',

      presetPg: 'pg_hba.conf: ident',
      presetPgHint: 'The password exists, but row 2 never asks for it.',
      presetPgAppend: 'Fix at the end',
      presetPgAppendHint: 'A correct row appended at the end does not help.',
      presetAcl: 'ACL: SSH for the admin',
      presetAclHint: 'The permit sits below the deny.',
      presetStateless: 'Stateless: the reply',
      presetStatelessHint: 'The reply is judged on its own.',
      presetTop: '“Permit any” on top',
      presetTopHint: 'The denies below it are dead.',

      legNo: 'tested, no match',
      legMatch: 'match: decides',
      legSkip: 'not evaluated',
      legShadow: 'shadowed row',
      legOutcome: 'permitted ✓ / denied ✕',
      legChanged: 'changed',

      queueTitle: 'Requests',
      reqN: 'Request {n}',
      cardSocket: 'local, over the socket',
      cardTcp: 'TCP from {addr}',
      cardDb: 'database {db}',
      cardUser: 'user {user}',
      cardOs: 'OS user {os}',
      dirOut: 'client request',
      dirReply: 'server reply',
      dirUnsolicited: 'unsolicited packet',
      now: 'now',

      tableTitle: 'Rule list: read from the top',
      colNo: '#',
      colType: 'type',
      colDb: 'database',
      colUser: 'user',
      colAddr: 'address',
      colMethod: 'method',
      colProto: 'protocol',
      colSrc: 'source',
      colSrcPort: 'src port',
      colDst: 'destination',
      colDstPort: 'dst port',
      colAction: 'action',
      colMark: 'request {n}',
      colMarkNone: 'check',
      implicitPg: '(no entry: reject)',
      implicitAcl: '(implicit deny)',
      markSkip: 'not evaluated',
      markMatch: 'match',
      shadowOf: 'shadowed ({r})',
      fixTag: 'fix',
      wasLabel: 'was {r}',

      outPermit: 'permitted',
      outDeny: 'denied',
      outAccept: 'accepted',
      outReject: 'rejected',
      tallyTitle: 'Outcome',
      tallyEmpty: 'Nothing decided yet.',
      tallyRow: 'row {r}',
      tallyImplicit: 'end of list',
      whyName: 'OS user {os} is not database user {user}',
      whyNameOk: 'OS user {os} is also the database user',
      whyPassword: 'the password is asked for and correct',
      whyReject: 'the row rejects',
      whyTrust: 'no check',

      capStart: ['{n} request is waiting.', '{n} requests are waiting.'],
      capStartRule: ' The list is read from the top, and the first row that matches in every column decides.',
      capShadow: ' Row {r} is shadowed: row {by} catches everything it would, so no request ever reaches it.',
      capShadowMany: ' Rows {rs} are shadowed: row {by} catches everything they would, so no request ever reaches them.',
      fixEdit: ' Fix: row {r} now uses the method {m}.',
      fixMoveTop: ' Fix: row {was} moved to the top, as {r}.',
      fixMoveEnd: ' Fix: row {was} moved to the end, as {r}.',
      fixAdd: ' Fix: row {r} added.',
      capNo: 'Request {q}, row {r}: no match ({fields}).',
      capNext: ' On to row {r}.',
      capLast: ' That was the last row.',
      capMatchPg: 'Request {q}: row {r} matches in all four columns, and it decides. The next step checks its method, {m}.',
      capAction: 'Request {q}: row {r} matches and says {a}. The rows below it are not read.',
      capMethodFail: 'Row {r} demands the method {m}: {why}. The check fails and the connection is rejected; later rows are not considered.',
      capMethodOk: 'Row {r} demands the method {m}: {why}. The connection is accepted.',
      capLaterPermit: ' Row {r} would have permitted it, but it is never reached.',
      capLaterDeny: ' Row {r} would have denied it, but it is never reached.',
      capLaterAccept: ' Row {r} would have accepted the connection, but it never gets its turn.',
      capLaterReject: ' Row {r} would have rejected it, but it never gets its turn.',
      capImplicitPg: 'No row matches request {q}: pg_hba.conf has no entry for this connection, and it is rejected.',
      capImplicitAcl: 'No rule matches {pkt}, so the packet falls through to the implicit deny at the end of the list. Nothing in the list says so: the deny is invisible.',
      noteReplyAlone: ' A stateless filter does not remember that the client asked: the reply needs a rule of its own.',
      noteWide: ' Rule 20 lets in every packet from source port 443 to the whole network, this unsolicited one too.',
      list2: '{a} and {b}',
      listMore: '{a}, {b}',

      explain:
        '<p>A rule list is read <strong>from the top down</strong>, one row at a time. A row matches only if ' +
        '<strong>every</strong> column matches (<code>all</code> and <code>any</code> match everything; an address matches ' +
        'if it lies inside the row\'s prefix). The <strong>first</strong> matching row decides, and the rows below it are ' +
        'never read: the first matching entry.</p>' +
        '<p>If no row matches, a rule that is not written in the list decides: a router ACL ends with an implicit ' +
        '<em>deny</em>, and <code>pg_hba.conf</code> rejects a connection with no entry. That is the policy of deny by ' +
        'default: only what is explicitly allowed gets through.</p>' +
        '<p>In <code>pg_hba.conf</code> the chosen row also names the authentication method. If that check fails, the ' +
        'connection is rejected: there is no fall-through to the next row. So a correct row appended at the end does ' +
        'not help; you fix the row that decided.</p>' +
        '<p>A stateless filter judges each packet on its own, so the reply needs a rule of its own, and such a rule is ' +
        'easily too wide. A stateful filter recognises the reply by itself (a separate simulator).</p>' +
        '<p><strong>Misconceptions:</strong> “the most specific rule wins” (no: the first one); “add the correct rule at the ' +
        'end and it is fixed” (it never gets its turn); “if the chosen rule fails, the next one is tried” (it is not).</p>' +
        '<p><strong>Different rules elsewhere:</strong> a packet\'s path through the kernel firewall\'s several chains is not ' +
        'one list; PAM follows its modules\' control flags; in NTFS a deny wins regardless of order; some host firewalls ' +
        'apply block rules before allow rules, regardless of order; routing picks the longest prefix.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
