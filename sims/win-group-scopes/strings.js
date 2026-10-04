/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-group-scopes, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   *text* is an English term, set in italics by the page (the Croatian term rule, COMMON.md §4).
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dvije domene, grupe i ACL dijeljene mape',

      // params
      scopeA: 'Opseg grupe A',
      scopeB: 'Opseg grupe B',
      bInBrk: 'B je u domeni brk',
      testWith: 'Testiraj:',
      testUserBtn: 'Testiraj korisnika {user}',
      aInB: 'A je članica B',
      userDomain: 'Testirani korisnik',
      aclPrincipal: 'Na ACL-u (Modify)',
      viaU: 'Preko univerzalne grupe',
      tested: 'Testirano',
      testHint: 'Provjeri pristup i osvijetli put korisnik → grupe → ACE.',
      optG: 'G',
      optDL: 'DL',
      optU: 'U',
      optGroupA: 'grupa A',
      optGroupB: 'grupa B',
      optUser: 'korisnik',

      // presets
      presetAgdlp: 'AGDLP',
      presetAgdlpHint: 'ana → globalna → lokalna grupa domene → dozvola.',
      presetCross: 'Globalna iz druge domene',
      presetCrossHint: 'ivo iz domene quillmoor ulazi u globalnu grupu domene brk.',
      presetForeignAcl: 'Lokalna na tuđem ACL-u',
      presetForeignAclHint: 'Lokalna grupa domene brk na ACL-u u domeni quillmoor.',
      presetDlIntoG: 'Lokalna u globalnoj',
      presetDlIntoGHint: 'Lokalna grupa domene ugniježđena u globalnu.',
      presetAgudlp: 'AGUDLP',
      presetAgudlpHint: 'Dvije domene računa spojene univerzalnom grupom.',

      // legend
      legG: 'globalna',
      legDL: 'lokalna grupa domene',
      legU: 'univerzalna',
      legEdge: 'je članica',
      legBroken: 'nije dopušteno',
      legPath: 'put testa',
      legWin: 'ACE daje pravo',
      legChanged: 'promijenjeno',

      // scene
      bandAccount: 'domena računa',
      bandResource: 'domena resursa, korijen šume',
      scope_G: 'globalna',
      scope_DL: 'lokalna grupa domene',
      scope_U: 'univerzalna',
      userTag: 'korisnik',
      aceBadge: 'ACE: {right}',
      shareTitle: 'Dijeljena mapa',
      notTested: 'Pritisni ▶ uz korisnika (ili tipku T).',
      granted: '{user}: {rights}',
      denied: '{user}: nema pristupa',

      // rights
      right_full: '*Full control*',
      right_modify: '*Modify*',

      // test card
      hops: ['{n} korak', '{n} koraka', '{n} koraka'],
      label_agdlp: 'AGDLP',
      label_agudlp: 'AGUDLP',
      label_other: 'radi, ali nije AGDLP',
      noPath: 'nijedan valjani lanac ne vodi do valjanog ACE-a',
      problemsTitle: 'Što nije dopušteno',
      noProblems: 'sve veze i ACE-ovi su dopušteni',
      problemEdge: '{child} → {parent}: {why}',
      problemAce: 'ACE {principal}: {why}',

      'why_g-own-domain': 'globalna grupa prima članove samo iz svoje domene',
      'why_g-members': 'globalna grupa prima samo račune i globalne grupe',
      'why_dl-only-in-dl': 'lokalna grupa domene može biti članica samo lokalne grupe domene iz svoje domene',
      'why_dl-own-domain': 'lokalna grupa domene prima lokalne grupe domene samo iz svoje domene',
      'why_dl-foreign-acl': 'lokalna grupa domene koristi se na ACL-u samo u svojoj domeni',
      why_unknown: 'nepoznat član ili grupa',
      why_self: 'grupa ne može biti članica same sebe',

      // ACL table
      rtTitle: 'ACL mape {share}',
      colPrincipal: 'Tko',
      colScope: 'Opseg',
      colDomain: 'Domena',
      colRight: 'Pravo',
      markFor: 'za {user}',
      implicit: 'nijedan ACE ne odgovara korisniku ni njegovim grupama',
      noAccess: 'nema pristupa',
      outGranted: 'pristup',
      outDenied: 'nema pristupa',
      wordWin: 'daje',
      viaNote: ['preko {n} grupe', 'preko {n} grupe', 'preko {n} grupa'],
      directNote: 'izravno',
      invalidNote: 'nevaljan ACE',
      accountScope: 'račun',

      // captions
      capUntested: 'Složi grupe i članstva, a zatim testiraj korisnika ({user}): ▶ ili tipka T.',
      'cap_g-own-domain': '*Global group* (globalna grupa) prima samo članove iz svoje domene — {child} iz domene {cdom} ne može ući u {parent} iz domene {pdom}.',
      'cap_g-members': '*Global group* (globalna grupa) prima samo račune i globalne grupe svoje domene — {child} ne može ući u {parent}.',
      'cap_dl-only-in-dl': '*Domain local group* (lokalna grupa domene) može biti članica samo lokalne grupe domene iz svoje domene — {child} ne može ući u {parent}.',
      'cap_dl-own-domain': '*Domain local group* (lokalna grupa domene) prima lokalne grupe domene samo iz svoje domene — {child} iz domene {cdom} ne može ući u {parent} iz domene {pdom}.',
      'cap_dl-foreign-acl': '*Domain local group* (lokalna grupa domene) koristi se na ACL-u samo u svojoj domeni — {principal} iz domene {pdom} ne može dobiti dozvolu na mapi u domeni {rdom}.',
      cap_unknown: 'Veza {child} → {parent} nije valjana.',
      cap_self: 'Veza {child} → {parent} nije valjana.',
      capAgdlp: '{path} → {right}: to je AGDLP.',
      capAgudlp: '{path} → {right}: to je AGUDLP. Univerzalna grupa skuplja globalne grupe iz obje domene; njezino članstvo čuva *global catalog* (globalni katalog).',
      capOther: '{path} → {right}: radi, ali nije AGDLP. AGDLP je preporuka, AD je ne provodi.',
      capDenied: '{user} nema pristup mapi.',
      capIvoAdded: 'Za test je ivo dodan u {group}.',
      pathSep: ' → ',

      explain: '<p>Svaka grupa u AD-u ima <em lang="en">group scope</em> (opseg grupe). On kaže tri stvari: ' +
        '<b>tko može biti član</b>, <b>na kojem se ACL-u</b> (<em lang="en">access control list</em>, popis za kontrolu pristupa) <b>grupa smije koristiti</b> i <b>čega grupa može biti članica</b>.</p>' +
        '<ul>' +
        '<li><em lang="en">Global group</em> (globalna grupa): članovi samo računi i globalne grupe iz <b>svoje</b> domene; ' +
        'koristi se na ACL-u u bilo kojoj domeni šume; članica univerzalnih i lokalnih grupa domene bilo gdje u šumi te globalnih grupa svoje domene.</li>' +
        '<li><em lang="en">Domain local group</em> (lokalna grupa domene): članovi računi, globalne i univerzalne grupe iz ' +
        'bilo koje domene šume te lokalne grupe domene iz svoje domene; koristi se na ACL-u <b>samo u svojoj</b> domeni; članica samo lokalnih grupa domene iz svoje domene.</li>' +
        '<li><em lang="en">Universal group</em> (univerzalna grupa): članovi računi, globalne i univerzalne grupe iz cijele ' +
        'šume; koristi se bilo gdje u šumi; članica univerzalnih i lokalnih grupa domene; njezino članstvo čuva <em lang="en">global catalog</em> (globalni katalog).</li>' +
        '</ul>' +
        '<p><b>AGDLP</b>: računi (<i>A</i>ccounts) u globalnu grupu svoje domene, globalna grupa u lokalnu grupu domene ' +
        'u domeni resursa, a dozvola (<i>P</i>ermission) samo toj lokalnoj grupi. Za više domena računa: AGUDLP, s ' +
        'univerzalnom grupom u sredini. To je preporuka za red, a ne pravilo koje AD provodi: i drugi valjani raspored radi.</p>' +
        '<p>Korisnik dobiva pravo ako od njega preko <b>valjanih</b> članstava stigne do valjanog ACE-a.</p>' +
        '<p><b>Česte zablude:</b> „lokalna grupa domene je lokalna grupa na računalu”; „svaka grupa smije na svaki ACL”; ' +
        '„AD provodi AGDLP”.</p>'
    },
    en: {
      stage: 'Two domains, groups and the share\'s ACL',

      scopeA: 'Scope of group A',
      scopeB: 'Scope of group B',
      bInBrk: 'B is in domain brk',
      testWith: 'Test:',
      testUserBtn: 'Test user {user}',
      aInB: 'A is a member of B',
      userDomain: 'User to test',
      aclPrincipal: 'On the ACL (Modify)',
      viaU: 'Through a universal group',
      tested: 'Tested',
      testHint: 'Check access and light the path user → groups → ACE.',
      optG: 'G',
      optDL: 'DL',
      optU: 'U',
      optGroupA: 'group A',
      optGroupB: 'group B',
      optUser: 'user',

      presetAgdlp: 'AGDLP',
      presetAgdlpHint: 'ana → global → domain local → permission.',
      presetCross: 'Global from another domain',
      presetCrossHint: 'ivo from quillmoor joins a global group of brk.',
      presetForeignAcl: 'Domain local on a foreign ACL',
      presetForeignAclHint: 'A domain local group of brk on an ACL in quillmoor.',
      presetDlIntoG: 'Domain local in a global',
      presetDlIntoGHint: 'A domain local group nested in a global group.',
      presetAgudlp: 'AGUDLP',
      presetAgudlpHint: 'Two account domains joined by a universal group.',

      legG: 'global',
      legDL: 'domain local',
      legU: 'universal',
      legEdge: 'is a member of',
      legBroken: 'not allowed',
      legPath: 'tested path',
      legWin: 'ACE grants',
      legChanged: 'changed',

      bandAccount: 'account domain',
      bandResource: 'resource domain, forest root',
      scope_G: 'global',
      scope_DL: 'domain local',
      scope_U: 'universal',
      userTag: 'user',
      aceBadge: 'ACE: {right}',
      shareTitle: 'Share',
      notTested: 'Press ▶ next to a user (or the T key).',
      granted: '{user}: {rights}',
      denied: '{user}: no access',

      right_full: 'Full control',
      right_modify: 'Modify',

      hops: ['{n} hop', '{n} hops'],
      label_agdlp: 'AGDLP',
      label_agudlp: 'AGUDLP',
      label_other: 'works, but not AGDLP',
      noPath: 'no valid chain reaches a valid ACE',
      problemsTitle: 'Not allowed',
      noProblems: 'every membership and ACE is allowed',
      problemEdge: '{child} → {parent}: {why}',
      problemAce: 'ACE {principal}: {why}',

      'why_g-own-domain': 'a global group takes members only from its own domain',
      'why_g-members': 'a global group takes only accounts and global groups',
      'why_dl-only-in-dl': 'a domain local group can only be a member of a domain local group of its own domain',
      'why_dl-own-domain': 'a domain local group takes domain local groups only from its own domain',
      'why_dl-foreign-acl': 'a domain local group can be used on ACLs only in its own domain',
      why_unknown: 'unknown member or group',
      why_self: 'a group cannot be a member of itself',

      rtTitle: 'ACL of {share}',
      colPrincipal: 'Who',
      colScope: 'Scope',
      colDomain: 'Domain',
      colRight: 'Right',
      markFor: 'for {user}',
      implicit: 'no ACE matches the user or their groups',
      noAccess: 'no access',
      outGranted: 'access',
      outDenied: 'no access',
      wordWin: 'grants',
      viaNote: ['via {n} group', 'via {n} groups'],
      directNote: 'directly',
      invalidNote: 'invalid ACE',
      accountScope: 'account',

      capUntested: 'Build the groups and memberships, then test the user ({user}): ▶ or the T key.',
      'cap_g-own-domain': 'A global group takes members only from its own domain — {child} from {cdom} cannot join {parent} in {pdom}.',
      'cap_g-members': 'A global group takes only accounts and global groups of its own domain — {child} cannot join {parent}.',
      'cap_dl-only-in-dl': 'A domain local group can only be a member of a domain local group of its own domain — {child} cannot join {parent}.',
      'cap_dl-own-domain': 'A domain local group takes domain local groups only from its own domain — {child} from {cdom} cannot join {parent} in {pdom}.',
      'cap_dl-foreign-acl': 'A domain local group can be used on ACLs only in its own domain — {principal} from {pdom} cannot get a permission on a share in {rdom}.',
      cap_unknown: 'The membership {child} → {parent} is not valid.',
      cap_self: 'The membership {child} → {parent} is not valid.',
      capAgdlp: '{path} → {right}: that is AGDLP.',
      capAgudlp: '{path} → {right}: that is AGUDLP. The universal group collects the global groups of both domains; its membership is kept in the global catalog.',
      capOther: '{path} → {right}: works, but not AGDLP. AGDLP is a recommendation; AD does not enforce it.',
      capDenied: '{user} has no access to the share.',
      capIvoAdded: 'For the test, ivo is added to {group}.',
      pathSep: ' → ',

      explain: '<p>Every AD group has a <b>group scope</b>. It says three things: <b>who can be a member</b>, <b>on which ' +
        'ACLs the group can be used</b> and <b>what the group can be a member of</b>.</p>' +
        '<ul>' +
        '<li><b>Global group</b>: members are accounts and global groups of <b>its own</b> domain only; usable on ACLs in ' +
        'any domain of the forest; a member of universal and domain local groups anywhere in the forest and of global groups of its own domain.</li>' +
        '<li><b>Domain local group</b>: members are accounts, global and universal groups from any domain of the forest, and domain local ' +
        'groups of its own domain; usable on ACLs <b>only in its own</b> domain; a member only of domain local groups of its own domain.</li>' +
        '<li><b>Universal group</b>: members are accounts, global and universal groups from the whole forest; usable ' +
        'anywhere in the forest; a member of universal and domain local groups; its membership is kept in the global catalog.</li>' +
        '</ul>' +
        '<p><b>AGDLP</b>: Accounts into a Global group of their domain, the global group into a Domain Local group in the ' +
        'resource\'s domain, and the Permission only to that domain local group. For several account domains: AGUDLP, ' +
        'with a universal group in the middle. It is a recommendation for order, not a rule AD enforces: other valid ' +
        'layouts work too.</p>' +
        '<p>A user gets a right if a chain of <b>valid</b> memberships leads from the user to a valid ACE.</p>' +
        '<p><b>Common misconceptions:</b> "domain local means local to a computer"; "any group can go on any ACL"; ' +
        '"AD enforces AGDLP".</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
