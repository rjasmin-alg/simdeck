/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-gpo-security-filtering, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. *term* in a caption is an English term, drawn in italics (the Croatian term rule: English in
   italics, Croatian in parentheses at the first mention). GPO, group, user and computer names are data, not words.
   The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'GPO, njegova delegacija, WMI filtar i put odluke za tri korisnika na PC07',
      gpoKind: 'GPO',
      gpoUser: 'postavke korisnika: mapiranje pogona',
      linkedTo: 'povezan na {ou}',
      pcKind: 'računalo',
      pcDesktop: 'stolno računalo (kućište 3)',
      pcLaptop: 'prijenosno računalo (kućište 9)',
      pcToken: 'token (izgrađen pri pokretanju):',
      wmiTitle: 'WMI filtar',
      wmiNone: 'nema WMI filtra',
      wmiOn: 'na {pc}:',
      wmiTrue: 'istina',
      wmiFalse: 'laž',
      tableTitle: 'Delegacija GPO-a',
      colPrincipal: 'Grupa ili korisnik',
      colRead: 'čitanje',
      colApply: 'primjena',
      colType: 'Vrsta',
      typeAllow: 'dopusti',
      typeDeny: 'zabrani',
      colMark: '{user} na {pc}',
      colMarkNone: 'Za koga',
      markHit: 'odgovara',
      markWin: 'zabranjuje',
      markBeaten: 'nadjačano',
      markSkip: 'uklonjeno',
      tagAdded: 'dodano',
      tagRemoved: 'uklonjeno',
      noteRead: '{who}: čitanje',
      noteApply: '{who}: primjena',
      noteBoth: '{who}: čitanje i primjena',
      noteDeny: '{who}: zabrana',
      pathTitle: 'Put odluke · korisnici na {pc}',
      colUser: 'Korisnik',
      chkScope: 'Veza na OU',
      chkPcRead: '{pc} čita GPO',
      chkAllow: 'čitanje i primjena',
      chkDeny: 'Bez zabrane',
      chkWmi: 'WMI filtar',
      colResult: 'Ishod',
      noGroups: 'bez grupa',
      noFilter: 'bez filtra',
      notReached: 'nije provjereno',
      nobody: 'nitko',
      resApplied: 'primijenjen',
      resInaccessible: 'nedostupan',
      resSecurity: 'odbijen (sigurnost)',
      resWmi: 'odbijen (WMI filtar)',
      resScope: 'izvan dosega veze',
      resWaiting: 'čeka',
      aclMode: 'Delegacija',
      aclDefault: 'zadano (Authenticated Users)',
      aclSales: 'samo Sales',
      aclSalesDc: 'Sales + čitanje za Domain Computers',
      denyManagers: 'Managers: zabrana primjene',
      wmi: 'WMI filtar',
      wmiOptNone: 'bez filtra',
      wmiOptLaptops: 'samo prijenosna računala',
      pc07Laptop: 'PC07 je prijenosno računalo',
      presetDefault: 'Zadano filtriranje',
      presetDefaultHint: 'Authenticated Users: čitanje i primjena.',
      presetSalesBroken: 'Samo Sales',
      presetSalesBrokenHint: 'Uklonjeni Authenticated Users, dodana grupa Sales.',
      presetSalesFixed: 'Sales i čitanje za računala',
      presetSalesFixedHint: 'Domain Computers dobivaju samo čitanje.',
      presetDenyManagers: 'Zabrana za Managers',
      presetDenyManagersHint: 'boss je u grupama Sales i Managers.',
      presetWmi: 'WMI: samo prijenosna',
      presetWmiHint: 'PC07 je stolno računalo.',
      legDiamond: 'provjera',
      legPass: 'prolazi',
      legStop: 'zaustavlja, s razlogom',
      legRow: 'redak dozvole',
      legDeny: 'redak zabrane',
      legChanged: 'ovaj korak',
      list2: '{a} i {b}',
      listMore: '{a}, {b}',
      capStart: 'GPO {gpo} povezan je na {ou} sa zadanim filtriranjem: *Authenticated Users* (prijavljeni korisnici) imaju čitanje i primjenu. U svakom koraku jedan se korisnik prijavljuje na {pc}, a GPO prolazi put odluke slijeva nadesno.',
      capStartChange: 'U koraku 1 administrator mijenja GPO.',
      capAdmin: 'Korak 1: administrator mijenja GPO.',
      capAdminSales: 'Uklanja *Authenticated Users* i grupi Sales daje čitanje i primjenu: uobičajen način da se GPO suzi na grupu.',
      capAdminSalesDc: 'Uklanja *Authenticated Users*; grupa Sales dobiva čitanje i primjenu, a Domain Computers samo čitanje, bez primjene.',
      capAdminDeny: 'Grupa Managers dobiva zabranu primjene (*Deny*).',
      capAdminWmi: 'Dodaje WMI filtar {wmi}; on se izvršava na računalu.',
      capApplied: 'Korak {n}: {user} na {pc}. {pc} čita GPO preko {pcVia}, {user} ima čitanje i primjenu preko {via}, zabrane nema: GPO se primjenjuje.',
      capWmiTrue: 'WMI filtar vraća istinu: {pc} je prijenosno računalo.',
      capInaccSales: 'Korak {n}: uklonjeni su *Authenticated Users* (prijavljeni korisnici): računalo više ne može pročitati GPO, pa ga ne dobiva ni {user} iz grupe Sales.',
      capInacc: 'Korak {n}: {user} na {pc}: {pc} i dalje ne može pročitati GPO, pa je nedostupan i ovdje; prava korisnika {user} nisu ni provjerena.',
      capInaccFix: 'Popravak: čitanje (bez primjene) za Domain Computers ili *Authenticated Users*.',
      capNoApply: 'Korak {n}: {user} nema i čitanje i primjenu: odbijen (sigurnost). Zabrana nije potrebna: bez dozvole primjene GPO se jednostavno ne primjenjuje.',
      capDeny: 'Korak {n}: {user} ima čitanje i primjenu preko {via}, ali zabrana za {deny} pobjeđuje: odbijen (sigurnost). Zabrana služi za iznimku unutar dopuštene grupe.',
      capWmiFirst: 'Korak {n}: WMI filtar vraća laž na {pc} (stolno računalo): GPO se preskače za sve korisnike na njemu.',
      capWmiAgain: 'Korak {n}: {user} na {pc}: isti WMI odgovor. Filtar pita računalo, ne korisnika, pa nije važno tko se prijavljuje.',
      capAlsoWmi: 'I WMI filtar vratio bi laž, ali sigurnost se provjerava prije njega.',
      capScope: 'Korak {n}: {user} nije u {ou}: GPO nije ni na njegovu popisu.',
      explain: '<p><em lang="en">Security filtering</em> (sigurnosno filtriranje): GPO povezan na OU primjenjuje se na korisnika ili računalo ' +
        'samo ako njegov token ima dvije dozvole na GPO-u, <em lang="en">Read</em> (čitanje) i <em lang="en">Apply Group Policy</em> ' +
        '(primjena pravila grupe). Zadano ih imaju <em lang="en">Authenticated Users</em> (prijavljeni korisnici), dakle svi. Zabrana ' +
        '(<em lang="en">deny</em>) na bilo kojoj od njih pobjeđuje dopuštenje.</p>' +
        '<p>Od sigurnosnog ažuriranja MS16-072 (lipanj 2016.) klijent popis GPO-ova za postavke korisnika dohvaća kao ' +
        '<em lang="en">computer account</em> (račun računala). Ako računalo ne može čitati GPO, on je nedostupan za sve korisnike na ' +
        'njemu. Zato „ukloni <em lang="en">Authenticated Users</em>, dodaj Sales” ruši GPO za sve, a popravak je samo čitanje (bez primjene) za ' +
        '<em lang="en">Domain Computers</em> ili <em lang="en">Authenticated Users</em>.</p>' +
        '<p>Filtriranje na grupu radi se bez zabrane: tko nema primjenu, GPO ne dobiva. Zabrana je za iznimku unutar grupe koja ima ' +
        'primjenu.</p>' +
        '<p><em lang="en">WMI filter</em> (WMI filtar, jedan po GPO-u) izvršava se na računalu: kad vrati laž, GPO se preskače za računalo ' +
        'i za sve korisnike na njemu. Sigurnost se provjerava prije njega. Filtriranje samo uklanja GPO-ove s popisa; redoslijed onih ' +
        'koji ostanu ne mijenja se. Računalo dodano u grupu dobiva njezina prava tek nakon ponovnog pokretanja, kad se izgradi novi ' +
        'token.</p>' +
        '<p>U izvještaju klijenta odbijeni GPO-ovi nose razlog <em lang="en">Denied (Security)</em>, <em lang="en">Denied (WMI Filter)</em> ' +
        'ili <em lang="en">Inaccessible</em>.</p>'
    },
    en: {
      stage: 'A GPO, its delegation, a WMI filter and the decision path for three users on PC07',
      gpoKind: 'GPO',
      gpoUser: 'user settings: drive map',
      linkedTo: 'linked to {ou}',
      pcKind: 'computer',
      pcDesktop: 'desktop (chassis 3)',
      pcLaptop: 'laptop (chassis 9)',
      pcToken: 'token since startup:',
      wmiTitle: 'WMI filter',
      wmiNone: 'no WMI filter',
      wmiOn: 'on {pc}:',
      wmiTrue: 'true',
      wmiFalse: 'false',
      tableTitle: 'GPO delegation',
      colPrincipal: 'Group or user',
      colRead: 'Read',
      colApply: 'Apply Group Policy',
      colType: 'Type',
      typeAllow: 'allow',
      typeDeny: 'deny',
      colMark: '{user} on {pc}',
      colMarkNone: 'Applies to',
      markHit: 'matches',
      markWin: 'denies',
      markBeaten: 'overridden',
      markSkip: 'removed',
      tagAdded: 'added',
      tagRemoved: 'removed',
      noteRead: '{who}: Read',
      noteApply: '{who}: Apply',
      noteBoth: '{who}: Read + Apply',
      noteDeny: '{who}: deny',
      pathTitle: 'Decision path · users on {pc}',
      colUser: 'User',
      chkScope: 'Linked to the OU',
      chkPcRead: '{pc} reads the GPO',
      chkAllow: 'Read and Apply',
      chkDeny: 'No deny',
      chkWmi: 'WMI filter',
      colResult: 'Result',
      noGroups: 'no groups',
      noFilter: 'no filter',
      notReached: 'not reached',
      nobody: 'nobody',
      resApplied: 'Applied',
      resInaccessible: 'Inaccessible',
      resSecurity: 'Denied (Security)',
      resWmi: 'Denied (WMI Filter)',
      resScope: 'not in the link scope',
      resWaiting: 'waiting',
      aclMode: 'Delegation',
      aclDefault: 'default (Authenticated Users)',
      aclSales: 'Sales only',
      aclSalesDc: 'Sales + Domain Computers Read',
      denyManagers: 'Managers: deny Apply',
      wmi: 'WMI filter',
      wmiOptNone: 'none',
      wmiOptLaptops: 'laptops only',
      pc07Laptop: 'PC07 is a laptop',
      presetDefault: 'Default filtering',
      presetDefaultHint: 'Authenticated Users: Read and Apply.',
      presetSalesBroken: 'Sales only',
      presetSalesBrokenHint: 'Authenticated Users removed, Sales added.',
      presetSalesFixed: 'Sales and Read for computers',
      presetSalesFixedHint: 'Domain Computers get Read only.',
      presetDenyManagers: 'Deny for Managers',
      presetDenyManagersHint: 'boss is in Sales and Managers.',
      presetWmi: 'WMI: laptops only',
      presetWmiHint: 'PC07 is a desktop.',
      legDiamond: 'check',
      legPass: 'passes',
      legStop: 'stops, with the reason',
      legRow: 'permission row',
      legDeny: 'deny row',
      legChanged: 'this step',
      list2: '{a} and {b}',
      listMore: '{a}, {b}',
      capStart: 'The GPO {gpo} is linked to {ou} with the default filtering: *Authenticated Users* has Read and Apply. In each step one user logs on to {pc} and the GPO goes through the decision path, left to right.',
      capStartChange: 'In step 1 the administrator changes the GPO.',
      capAdmin: 'Step 1: the administrator changes the GPO.',
      capAdminSales: 'Authenticated Users is removed and Sales gets Read and Apply: the usual way to narrow a GPO to a group.',
      capAdminSalesDc: 'Authenticated Users is removed; Sales gets Read and Apply, Domain Computers Read only, no Apply.',
      capAdminDeny: 'Managers get a Deny on Apply.',
      capAdminWmi: 'A WMI filter {wmi} is added; it runs on the computer.',
      capApplied: 'Step {n}: {user} on {pc}. {pc} reads the GPO through {pcVia}, {user} has Read and Apply through {via}, nothing denies: the GPO applies.',
      capWmiTrue: 'The WMI filter is true: {pc} is a laptop.',
      capInaccSales: 'Step {n}: Authenticated Users was removed: the computer can no longer read the GPO, so even {user} from Sales doesn\'t get it.',
      capInacc: 'Step {n}: {user} on {pc}: {pc} still cannot read the GPO, so it is inaccessible here too; {user}\'s own rights are not even checked.',
      capInaccFix: 'The fix: Read (without Apply) for Domain Computers or Authenticated Users.',
      capNoApply: 'Step {n}: {user} doesn\'t have both Read and Apply: Denied (Security). No Deny is needed: without the Apply permission the GPO simply doesn\'t apply.',
      capDeny: 'Step {n}: {user} has Read and Apply through {via}, but the Deny for {deny} wins: Denied (Security). A Deny is for an exception inside an allowed group.',
      capWmiFirst: 'Step {n}: the WMI filter is false on {pc} (a desktop): the GPO is skipped for every user on it.',
      capWmiAgain: 'Step {n}: {user} on {pc}: the same WMI answer. The filter asks the computer, not the user, so who logs on makes no difference.',
      capAlsoWmi: 'The WMI filter would be false too, but security is checked first.',
      capScope: 'Step {n}: {user} is not in {ou}: the GPO is not even in their list.',
      explain: '<p><em>Security filtering</em>: a GPO linked to an OU applies to a user or computer only when its token has two ' +
        'permissions on the GPO, <em>Read</em> and <em>Apply Group Policy</em>. By default <em>Authenticated Users</em> has both, so ' +
        'everyone does. A <em>deny</em> on either one wins over any allow.</p>' +
        '<p>Since the security update MS16-072 (June 2016) the client fetches the GPO list for user settings as the ' +
        '<em>computer account</em>. If the computer cannot read the GPO, it is inaccessible for every user on it. So “remove ' +
        'Authenticated Users, add Sales” breaks the GPO for everyone, and the fix is Read only (no Apply) for Domain Computers or ' +
        'Authenticated Users.</p>' +
        '<p>Filtering to a group needs no Deny: whoever lacks Apply doesn\'t get the GPO. A Deny is for an exception inside a group ' +
        'that has Apply.</p>' +
        '<p>A <em>WMI filter</em> (one per GPO) runs on the computer: when it is false, the GPO is skipped for the computer and for ' +
        'every user on it. Security is checked before it. Filtering only removes GPOs from the list; the ones that remain keep their ' +
        'order. A computer added to a group gets that group\'s rights only after a restart, when its new token is built.</p>' +
        '<p>In the client\'s report a filtered GPO carries the reason <em>Denied (Security)</em>, <em>Denied (WMI Filter)</em> or ' +
        '<em>Inaccessible</em>.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
