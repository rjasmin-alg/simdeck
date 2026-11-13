/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-delegation, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other),
   *word* an English term in italics (the page turns it into <em lang="en">). Names of users, groups, containers,
   attributes and the Reset Password right are data, passed in as placeholders. The title and subtitle come from
   sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Stablo OU-ova domene, popis dozvola korisnika i pokušaj kao hd-mia',

      // params
      pScenario: 'Primjer',
      pScope: 'Čarobnjak se pokreće na',
      pScopeHint: 'OU na kojem administrator delegira resetiranje lozinki.',
      pTarget: 'Ploča prikazuje (između testova)',
      pTargetHint: 'Korisnik čiji se popis dozvola vidi u koracima bez testa; u koraku s testom ploča prikazuje testiranog korisnika.',

      // presets
      presetStaff: 'Delegiranje na OU=Staff',
      presetStaffHint: 'Čarobnjak, tri resetiranja lozinke i jedno otključavanje.',
      presetNarrow: 'Samo OU=Brackenridge',
      presetNarrowHint: 'Uže delegiranje: korisnik u OU=HQ ostaje izvan dosega.',
      presetProtected: 'Zaštićeni administratorski račun',
      presetProtectedHint: 'tbrennan-adm ulazi u Domain Admins: prije SDPropa ✓, poslije ✕.',
      presetMove: 'Premještanje korisnika',
      presetMoveHint: 'aashdown seli u OU=Disabled i gubi naslijeđeni unos.',
      presetQuillmoor: 'Quillmoor: helpdesk u Domain Admins',
      presetQuillmoorHint: 'Kao na imanju: helpdesk resetira i administratoru; delegiranje to zamjenjuje.',

      // legend
      legExplicit: 'izričit unos (ACE) na OU-u',
      legInherited: 'naslijeđen unos',
      legProtected: 'zaštićeni račun',
      legVerdict: 'test ✓ / ✕',
      legChanged: 'promijenjeno u ovom koraku',

      // tree
      treeTitle: 'Domena',
      users: 'korisnici',
      aceLine: '{g} · {r} · {ap}',
      passesOn: 'prenosi dalje',
      keyLong: 'izričit unos: {g}',
      inhLong: 'naslijeđen unos od {from}',
      daBadge: 'DA',
      daLong: 'član grupe Domain Admins',
      shieldLong: 'zaštićeni račun: adminCount = 1',
      groupsTitle: 'Grupe',
      members: '{g}: {m}',
      noMembers: 'nema članova',

      // panel
      tryTitle: 'Pokušaj kao {u}',
      token: 'token:',
      actReset: 'postavi novu lozinku korisniku {u}',
      actUnlock: 'otključaj račun {u}',
      tested: 'test u ovom koraku',
      preview: 'pregled: što bi bilo sada',
      aclTitle: 'Popis dozvola korisnika {u} · {c}',
      colTrustee: 'Kome',
      colRight: 'Pravo',
      colApplies: 'Odnosi se na',
      colSource: 'Izvor',
      colType: 'Vrsta',
      allow: 'dopušta',
      deny: 'zabranjuje',
      implicit: 'nijedan unos ne daje to pravo',
      wordWin: 'odlučuje',
      wordSkip: 'ne čita se',
      outOk: 'dopušteno',
      outNo: 'odbijeno',
      rightFull: 'potpuna kontrola',
      writeAttr: 'pisanje {a}',
      apUsers: 'podređeni korisnici',
      apThis: 'ovaj objekt',
      srcDefault: 'izričit (zadani)',
      srcSdh: 'izričit, iz AdminSDHolder',
      srcFrom: 'naslijeđen od {c}',
      inhOn: 'nasljeđivanje uključeno',
      inhOff: 'nasljeđivanje isključeno (adminCount = 1)',
      needs: 'treba: {r}',
      logTitle: 'Testovi',
      logEmpty: 'još nema testa',
      logReset: 'nova lozinka',
      logUnlock: 'otključavanje',

      // captions: the start of each example
      capStartStaff: '{t} je u grupi {g} i treba resetirati lozinke zaposlenika. Još ništa nije delegirano: nijedan *ACE* (unos kontrole pristupa) ne imenuje {g}, pa bi resetiranje bilo odbijeno. Sljedeći korak: administrator pokreće čarobnjak *Delegation of Control* (delegiranje ovlasti) na {ou}.',
      capStartNarrow: 'Ovaj put čarobnjak *Delegation of Control* (delegiranje ovlasti) radi samo na {ou}. Koje će korisnike {t} dosegnuti?',
      capStartProtected: '{u} je novi administratorski račun u {c}, još nije u grupi {da}. Čarobnjak će delegirati resetiranje na {ou}, a zatim račun ulazi u {da}.',
      capStartMove: 'Resetiranje lozinki već je delegirano na {ou}: {u} nasljeđuje unos za {g}. Korisnik odlazi pa ga administrator premješta u {to}.',
      capStartQuillmoor: 'Kao na imanju Quillmoor: helpdesk je član grupe {da}. Zato {t} smije postaviti lozinku bilo kome: pogledaj izričit red {da} u popisu dozvola.',

      // captions: admin actions
      capWizard: 'Čarobnjak je na {ou} dodao *ACE*: {g} smije *reset password* (postaviti novu lozinku) na svim korisnicima ispod.',
      capWizardMore: 'Drugi unos dopušta pisanje {a} (obavezna promjena lozinke pri sljedećoj prijavi). Oba se nasljeđuju kroz podređene OU-ove do svakog korisnika ispod {ou}.',
      capWizardLeaf: 'Drugi unos dopušta pisanje {a} (obavezna promjena lozinke pri sljedećoj prijavi). Oba nasljeđuje svaki korisnik u {ou}.',
      capDaAdd: '{u} ulazi u {da}, zaštićenu grupu. Na popisu dozvola računa još se ništa ne mijenja: adminCount = 1 upisat će SDProp pri sljedećem pokretanju.',
      capSdprop: 'SDProp (svakih 60 minuta na emulatoru PDC-a) je prepisao popis dozvola računa {u} iz AdminSDHoldera: nasljeđivanje je isključeno i delegiranje više ne vrijedi.',
      capSdpropOff: 'SDProp (svakih 60 minuta na emulatoru PDC-a) je prepisao popis dozvola računa {u} iz AdminSDHoldera: nasljeđivanje je isključeno, pa ni jedno buduće delegiranje na OU-u neće stići do njega.',
      capSdpropNone: 'SDProp (svakih 60 minuta na emulatoru PDC-a) nije našao novih članova zaštićenih grupa.',
      capDaRemove: 'Administrator vadi {g} iz grupe {da}. Kad se {t} ponovno prijavi, njezin token više ne sadrži {da}, pa izričit red {da} na korisnicima više ne vrijedi za nju.',
      capMove: 'Administrator premješta {u} iz {from} u {to}. Naslijeđeni unosi odmah se računaju iz novog roditelja: ništa s {ou} više ne stiže do računa.',
      capPanel: 'Ploča prikazuje {u}: {v}.',
      capPanelOk: 'resetiranje bi sada uspjelo',
      capPanelNo: 'resetiranje bi sada bilo odbijeno',

      // captions: tests
      capTryReset: '{t} postavlja novu lozinku korisniku {u}: {v}.',
      capTryUnlock: '{t} otključava račun {u}: {v}.',
      capOkInh: 'Odlučuje unos {g} · {r}, naslijeđen od {from}.',
      capOkDa: 'Odlučuje izričit red {da} (potpuna kontrola, {src}). Kao član grupe {da} helpdesk može postaviti lozinku bilo kome u domeni, i administratoru.',
      capOkEdge: '{u} je već u grupi {da}, ali adminCount je još 0: dok SDProp ne prođe, naslijeđeni unos još vrijedi.',
      capNoneYet: 'Još ništa nije delegirano.',
      capWhyOutside: '{u} je u {c}, a to nije ispod {ou}: odande se ništa ne nasljeđuje.',
      capWhyMoved: '{u} je sada u {c}: naslijeđeni unosi računaju se iz roditelja, pa su nakon premještanja unosi s {ou} zamijenjeni onima novog roditelja, a on ih nema.',
      capWhyProtected: '{u} je *protected account* (zaštićeni račun, adminCount = 1): popis dozvola je kopija AdminSDHoldera s isključenim nasljeđivanjem, pa delegiranje ni s jednog OU-a ne stiže, a {g} nije u grupi {da}.',
      capWhyUnlock: 'Otključavanje piše {a}, a zadatak čarobnjaka za resetiranje dao je samo {r} i pisanje {b}. Otključavanje se delegira zasebno.',
      capDenied: 'Odlučuje zabrana {g} · {r}.',

      explain:
        '<p><b>Delegiranje umjesto Domain Admins.</b> Helpdesk treba postavljati nove lozinke, ne upravljati domenom. ' +
        'Čarobnjak <em lang="en">Delegation of Control</em> (delegiranje ovlasti) na odabranom OU-u dodaje unose u njegov popis dozvola: ' +
        'grupa <span translate="no">Helpdesk</span> dobiva <em lang="en">extended right</em> (prošireno pravo) ' +
        '<span translate="no">Reset Password</span> i pisanje atributa <span translate="no">pwdLastSet</span>, a oba se odnose na podređene objekte korisnika.</p>' +
        '<p><b>Nasljeđivanje.</b> Unos s OU-a nasljeđuju svi korisnici ispod njega, i kroz podređene OU-ove. Korisnik izvan tog OU-a (npr. u ' +
        '<span translate="no">CN=Users</span>) nema takav unos. Premještanjem korisnik odmah dobiva unose novog roditelja i gubi stare.</p>' +
        '<p><b>Provjera pristupa.</b> Unosi se čitaju redom: izričiti prije naslijeđenih, bliži OU prije daljeg, zabrana prije dopuštenja na istoj razini. ' +
        'Prvi unos koji imenuje nekoga iz tokena i pokriva traženo pravo odlučuje. Ako ga nema, pristup je odbijen.</p>' +
        '<p><b>Zaštićeni računi.</b> Članovi grupa kao <span translate="no">Domain Admins</span> dobivaju <span translate="no">adminCount = 1</span>: ' +
        'SDProp svakih 60 minuta na emulatoru PDC-a prepisuje njihov popis dozvola iz <span translate="no">AdminSDHolder</span> i isključuje nasljeđivanje. ' +
        'Delegiranje s OU-a zato ne pokriva administratore koji u njemu sjede.</p>' +
        '<p><b>Česte zablude.</b> „Helpdesk mora biti u Domain Admins da bi resetirao lozinke” — ne, dovoljan je jedan unos na OU-u. ' +
        '„Delegiranje na OU-u pokriva i administratore u njemu” — ne, nakon SDPropa. ' +
        '„Delegiranje je članstvo u grupi” — ne, to su unosi u popisu dozvola OU-a; članstvo samo određuje tko je u grupi koju unos imenuje.</p>' +
        '<p><b>Izvan opsega.</b> Sva prava uređivača dozvola, modeli razina administracije, upravljanje lozinkama lokalnog administratora.</p>'
    },

    en: {
      stage: 'The domain\'s OU tree, a user\'s access control list and a try as hd-mia',

      pScenario: 'Example',
      pScope: 'The wizard runs on',
      pScopeHint: 'The OU on which the admin delegates password resets.',
      pTarget: 'The panel shows (between tests)',
      pTargetHint: 'The user whose ACL the panel shows in steps without a test; in a test step it shows the tested user.',

      presetStaff: 'Delegate on OU=Staff',
      presetStaffHint: 'The wizard, three password resets and one unlock.',
      presetNarrow: 'Only OU=Brackenridge',
      presetNarrowHint: 'A narrower delegation: a user in OU=HQ stays out of reach.',
      presetProtected: 'A protected admin account',
      presetProtectedHint: 'tbrennan-adm joins Domain Admins: before SDProp ✓, after ✕.',
      presetMove: 'Moving a user',
      presetMoveHint: 'aashdown moves to OU=Disabled and loses the inherited entry.',
      presetQuillmoor: 'Quillmoor: helpdesk in Domain Admins',
      presetQuillmoorHint: 'As in the estate: helpdesk resets even the administrator; delegation replaces that.',

      legExplicit: 'explicit entry (ACE) on an OU',
      legInherited: 'inherited entry',
      legProtected: 'protected account',
      legVerdict: 'test ✓ / ✕',
      legChanged: 'changed in this step',

      treeTitle: 'Domain',
      users: 'users',
      aceLine: '{g} · {r} · {ap}',
      passesOn: 'passes on',
      keyLong: 'explicit entry: {g}',
      inhLong: 'entry inherited from {from}',
      daBadge: 'DA',
      daLong: 'member of Domain Admins',
      shieldLong: 'protected account: adminCount = 1',
      groupsTitle: 'Groups',
      members: '{g}: {m}',
      noMembers: 'no members',

      tryTitle: 'Try as {u}',
      token: 'token:',
      actReset: 'set a new password for {u}',
      actUnlock: 'unlock {u}',
      tested: 'tested in this step',
      preview: 'preview: what would happen now',
      aclTitle: 'ACL of {u} · {c}',
      colTrustee: 'Trustee',
      colRight: 'Right',
      colApplies: 'Applies to',
      colSource: 'Source',
      colType: 'Type',
      allow: 'allow',
      deny: 'deny',
      implicit: 'no entry grants the right',
      wordWin: 'decides',
      wordSkip: 'not read',
      outOk: 'allowed',
      outNo: 'refused',
      rightFull: 'full control',
      writeAttr: 'write {a}',
      apUsers: 'descendant users',
      apThis: 'this object',
      srcDefault: 'explicit (default)',
      srcSdh: 'explicit, from AdminSDHolder',
      srcFrom: 'inherited from {c}',
      inhOn: 'inheritance on',
      inhOff: 'inheritance off (adminCount = 1)',
      needs: 'needs: {r}',
      logTitle: 'Tests',
      logEmpty: 'no test yet',
      logReset: 'reset',
      logUnlock: 'unlock',

      capStartStaff: '{t} is in the group {g} and should reset staff passwords. Nothing is delegated yet: no *ACE* names {g}, so a reset would be refused. Next step: the admin runs the *Delegation of Control* wizard on {ou}.',
      capStartNarrow: 'This time the *Delegation of Control* wizard runs only on {ou}. Which users will {t} reach?',
      capStartProtected: '{u} is a new admin account in {c}, not yet in {da}. The wizard will delegate resets on {ou}; then the account joins {da}.',
      capStartMove: 'Password resets are already delegated on {ou}: {u} inherits the entry for {g}. The user is leaving, so the admin moves the account to {to}.',
      capStartQuillmoor: 'As in the Quillmoor estate: the helpdesk is a member of {da}. So {t} may set anyone\'s password: look at the explicit {da} row in the ACL.',

      capWizard: 'The wizard added an *ACE* on {ou}: {g} may reset the password of every user below it.',
      capWizardMore: 'A second entry lets it write {a} (force a change at next logon). Both are inherited through the child OUs by every user below {ou}.',
      capWizardLeaf: 'A second entry lets it write {a} (force a change at next logon). Every user in {ou} inherits both.',
      capDaAdd: '{u} joins {da}, a protected group. Nothing changes on the account\'s ACL yet: SDProp writes adminCount = 1 at its next run.',
      capSdprop: 'SDProp (every 60 minutes on the PDC emulator) overwrote {u}\'s ACL from AdminSDHolder: inheritance is off and the delegation no longer applies.',
      capSdpropOff: 'SDProp (every 60 minutes on the PDC emulator) overwrote {u}\'s ACL from AdminSDHolder: inheritance is off, so no delegation on an OU, now or later, will reach it.',
      capSdpropNone: 'SDProp (every 60 minutes on the PDC emulator) found no new members of protected groups.',
      capDaRemove: 'The admin takes {g} out of {da}. Once {t} signs in again, the new token no longer holds {da}, so the explicit {da} row on users no longer matches.',
      capMove: 'The admin moves {u} from {from} to {to}. Inherited entries come from the new parent at once: nothing from {ou} reaches the account any more.',
      capPanel: 'The panel shows {u}: {v}.',
      capPanelOk: 'a reset would succeed now',
      capPanelNo: 'a reset would be refused now',

      capTryReset: '{t} sets a new password for {u}: {v}.',
      capTryUnlock: '{t} unlocks {u}: {v}.',
      capOkInh: 'The deciding entry is {g} · {r}, inherited from {from}.',
      capOkDa: 'The explicit {da} row decides (full control, {src}). As a member of {da} the helpdesk can set any password in the domain, the administrator\'s included.',
      capOkEdge: '{u} is in {da} already, but adminCount is still 0: until SDProp runs, the inherited entry still applies.',
      capNoneYet: 'Nothing is delegated yet.',
      capWhyOutside: '{u} is in {c}, which is not below {ou}: nothing is inherited from there.',
      capWhyMoved: '{u} is now in {c}: inherited entries are recomputed from the parent, so after the move the entries from {ou} were replaced by the new parent\'s, which has none.',
      capWhyProtected: '{u} is a *protected account* (adminCount = 1): its ACL is AdminSDHolder\'s copy with inheritance off, so no OU\'s delegation reaches it, and {g} is not in {da}.',
      capWhyUnlock: 'Unlocking writes {a}, and the wizard\'s reset task granted only {r} and write {b}. Unlocking is delegated separately.',
      capDenied: 'The deny {g} · {r} decides.',

      explain:
        '<p><b>Delegation instead of Domain Admins.</b> The helpdesk needs to set new passwords, not to run the domain. ' +
        'The <em>Delegation of Control</em> wizard adds entries to the chosen OU\'s ACL: the group <span translate="no">Helpdesk</span> gets the ' +
        '<em>extended right</em> <span translate="no">Reset Password</span> and write on the attribute <span translate="no">pwdLastSet</span>, ' +
        'both applying to descendant user objects.</p>' +
        '<p><b>Inheritance.</b> Every user below the OU inherits the entry, through child OUs too. A user outside the OU (e.g. in ' +
        '<span translate="no">CN=Users</span>) has no such entry. A moved user takes the new parent\'s entries at once and loses the old ones.</p>' +
        '<p><b>The access check.</b> Entries are read in order: explicit before inherited, the nearer OU before the farther, deny before allow at ' +
        'the same level. The first entry that names someone in the token and covers the right decides. If there is none, access is refused.</p>' +
        '<p><b>Protected accounts.</b> Members of groups such as <span translate="no">Domain Admins</span> get <span translate="no">adminCount = 1</span>: ' +
        'every 60 minutes on the PDC emulator SDProp overwrites their ACL from <span translate="no">AdminSDHolder</span> and turns inheritance off. ' +
        'So a delegation on an OU does not cover the admins sitting in it.</p>' +
        '<p><b>Common mistakes.</b> "The helpdesk must be in Domain Admins to reset passwords": no, one entry on the OU is enough. ' +
        '"A delegation on an OU covers the admins in it": not after SDProp. ' +
        '"Delegation is a group membership": no, it is entries in the OU\'s ACL; membership only decides who is in the group the entry names.</p>' +
        '<p><b>Out of scope.</b> Every right of the ACL editor, tiered admin models, managing local administrator passwords.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
