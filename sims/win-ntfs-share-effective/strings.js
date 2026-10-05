/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-ntfs-share-effective, in both languages (docs/sim-ui.md §9). Same keys in hr and en;
   the page looks them up with t(key). {name} is a placeholder, [[term]] a glossary term, *word* an English term in
   italics (the page turns it into <em lang="en">). Permission names (Read, Modify, …) are the Windows terms: in
   English on both pages, with the Croatian in parentheses at first mention. The title and subtitle come from
   sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Korisnik, njegov token, dozvole dijeljenja i NTFS dozvole mape',

      // params
      who: 'Korisnik',
      path: 'Pristup',
      pathNetwork: 'preko mreže',
      pathLocal: 'lokalno na FS1',
      shareEveryone: 'Dijeljenje: Everyone',
      shareDenyEveryone: 'Dijeljenje: Deny Change',
      ntfsProdaja: 'NTFS: Prodaja',
      denyPripravnici: 'NTFS: Pripravnici Deny Write',
      denyNone: 'nema',
      denyExplicit: 'izravno',
      denyInherited: 'naslijeđeno',
      explicitAllowIvan: 'NTFS: ivan Modify, izravno',
      voditelji: 'ana i u grupi Voditelji',
      memberShort: 'ana u Voditeljima',

      // presets
      presetClassic: 'Dijeljenje Full Control, NTFS Modify',
      presetClassicHint: 'Preko mreže odlučuje NTFS; marko nema nijednu stavku i ne dobiva ništa.',
      presetDefaultShare: 'Zadano dijeljenje: Everyone Read',
      presetDefaultShareHint: 'Preko mreže samo čitanje, lokalno izmjena.',
      presetGroupsAddUp: 'Grupe se zbrajaju',
      presetGroupsAddUpHint: 'Prodaja Read i Voditelji Write: ana dobiva oboje.',
      presetDenyWins: 'Izravna zabrana pobjeđuje',
      presetDenyWinsHint: 'Pripravnici Deny Write: ivan samo čita.',
      presetExplicitBeatsInherited: 'Izravna dozvola, naslijeđena zabrana',
      presetExplicitBeatsInheritedHint: 'Zabrana s D:\\, dozvola za ivana na mapi: ivan piše.',
      presetDenyEveryoneShare: 'Dijeljenje: Deny Everyone Change',
      presetDenyEveryoneShareHint: 'Preko mreže nitko ne piše; lokalno i dalje izmjena.',

      // legend
      legWin: 'odlučuje',
      legBeaten: 'prekasno: pravo je već odlučeno',
      legNo: 'ne odnosi se na korisnika',
      legChanged: 'promijenjeno zadnjom postavkom',

      // token card
      tokenTitle: 'Token korisnika {user}',
      tokenNetwork: 'preko mreže → {unc}',
      tokenLocal: 'prijava na FS1 → {path}',
      kUser: 'korisnik',
      kGroup: 'grupa',
      kNested: 'preko {via}',
      kWellKnown: 'dobro poznata',
      inNtfs: 'NTFS {n}',
      inShare: 'dij. {n}',

      // result card
      resTitle: 'Rezultat za {user}',
      rowShare: 'Dijeljenje',
      rowNtfs: 'NTFS',
      rowEff: 'Efektivno',
      stricter: 'strože od dvaju, pravo po pravo',
      localOnly: 'lokalno: samo NTFS',
      shareUnused: 'ne provjerava se lokalno',
      noAccess: 'bez pristupa',
      plus: '{a} + {b}',
      chipOn: '{chip}: da',
      chipOff: '{chip}: ne',
      noAce: '∅',
      subShare: 'dij.',
      subNtfs: 'NTFS',
      subBoth: 'oba',
      chipKey: 'R *Read* · X *Read & execute* · W *Write* · M *Modify* · F *Full Control* · # stavka koja odlučuje · ∅ nijedna ne daje',
      dbNtfs: 'Odlučuje NTFS.',
      dbShare: 'Odlučuje dijeljenje.',
      dbSame: 'Obje strane daju isto.',
      dbBoth: 'Svaka strana nešto oduzima.',

      // level names (Windows terms)
      lv_read: 'Read',
      lv_readExecute: 'Read & execute',
      lv_write: 'Write',
      lv_modify: 'Modify',
      lv_full: 'Full Control',
      sh_read: 'Read',
      sh_change: 'Change',
      sh_full: 'Full Control',
      // the same, in a sentence (accusative, with the Croatian at first mention)
      ph_read: '*Read* (čitanje)',
      ph_readExecute: '*Read & execute* (čitanje i izvršavanje)',
      ph_write: '*Write* (pisanje)',
      ph_modify: '*Modify* (izmjenu)',
      ph_full: '*Full Control* (potpuno upravljanje)',
      phs_read: '*Read* (čitanje)',
      phs_change: '*Change* (promjenu)',
      phs_full: '*Full Control* (potpuno upravljanje)',
      ph_none: 'ništa',

      // tables
      shareTitle: 'Dozvole dijeljenja {unc}',
      ntfsTitle: 'NTFS dozvole {path}, kanonskim redom',
      colPrincipal: 'Tko',
      colLevel: 'Dozvola',
      colOrigin: 'Podrijetlo',
      colType: 'Vrsta',
      allow: '✓ dozvola',
      deny: '⛔ zabrana',
      explicit: 'izravno',
      inherited: '↧ s {from}',
      implicitNtfs: 'nijedna stavka ne odnosi se na korisnika',
      implicitShare: 'nijedna stavka ne odnosi se na korisnika',
      wordWin: 'odlučuje',
      wordBeaten: 'prekasno',
      wordSkip: 'ne čita se',
      outGrants: 'daje',
      outDenies: 'uskraćuje',

      // display names in sentences
      uAna: 'Ana',
      uIvan: 'Ivan',
      uMarko: 'Marko',
      forIvan: 'Ivana',
      forGroup: 'grupu {g}',

      // captions
      capNone: 'Nijedan SID iz tokena korisnika {user} ne spominje se u NTFS dozvolama mape: bez pristupa (implicitna zabrana), što god davalo dijeljenje.',
      capNoneLocal: 'Nijedan SID iz tokena korisnika {user} ne spominje se u NTFS dozvolama mape: bez pristupa (implicitna zabrana).',
      capShareRead: 'Preko mreže vrijedi strože od dvaju: dijeljenje daje {share}, NTFS {ntfs} — {user} smije samo čitati.',
      capShare: 'Preko mreže vrijedi strože od dvaju: dijeljenje daje {share}, NTFS {ntfs} — {user} dobiva samo {eff}.',
      capNtfs: 'Preko mreže vrijedi strože od dvaju: dijeljenje daje {share}, NTFS {ntfs} — odlučuje NTFS, {user} dobiva {eff}.',
      capSame: 'Preko mreže dijeljenje i NTFS daju isto, {eff}: {user} dobiva to.',
      capBoth: 'Preko mreže vrijedi strože od dvaju, pravo po pravo: dijeljenje daje {share}, NTFS {ntfs} — {user} dobiva samo ono što daju oba: {eff}.',
      capLocal: 'Lokalna prijava na FS1: dozvole dijeljenja se ne provjeravaju, vrijedi samo NTFS — {user} dobiva {eff}.',
      capExplicitBeats: 'Zabrana je naslijeđena s D:\\, a dozvola za {for} zadana je izravno na mapi: izravna dozvola dolazi prije naslijeđene zabrane.',
      capExplicitDeny: 'Izravna zabrana za Pripravnike čita se prva: ono što uskraćuje ({chips}) nijedna kasnija dozvola ne vraća.',
      capInheritedDeny: 'Naslijeđena zabrana odlučuje o pisanju jer ga nijedna izravna dozvola ne daje prije nje.',
      capAddUp: 'NTFS dozvole iz više stavki zbrajaju se: {list}.',
      addUpItem: '{g} daje {chips}',
      capShareDeny: 'Zabrana na dijeljenju vrijedi za Everyone, dakle za svakoga, pa i za administratore: preko mreže nitko ne piše.',
      list2: '{a} i {b}',
      listMore: '{a}, {b}',

      explain: '<p>Pri prijavi korisnik dobiva <em lang="en">access token</em> (pristupni token): popis <em lang="en">SID</em>-ova ' +
        '(sigurnosnih identifikatora) — njegov, svake grupe kojoj pripada (i grupa u koje su te grupe ugniježđene) te dobro poznatih ' +
        'grupa Everyone i Authenticated Users. [[access control list]] niz je stavki, <em lang="en">ACE</em>; ' +
        'svaka se odnosi na jedan SID, a uspoređuju se svi SID-ovi iz tokena.</p>' +
        '<p><strong>NTFS</strong> čita stavke kanonskim redom: izravne zabrane, izravne dozvole, naslijeđene ' +
        'zabrane, naslijeđene dozvole. O svakom pravu odlučuje prva stavka koja ga spominje: <em lang="en">deny</em> (zabrana) ga ' +
        'uskraćuje, <em lang="en">allow</em> (dozvola) ga daje. Zato izravna zabrana pobjeđuje svaku dozvolu, ali izravna dozvola ' +
        'pobjeđuje naslijeđenu zabranu. Prava iz različitih stavki zbrajaju se; pravo koje nitko ne daje je uskraćeno.</p>' +
        '<p><strong>Dijeljenje</strong> ima samo tri razine: <em lang="en">Read</em> (čitanje) ≈ NTFS <em lang="en">Read &amp; execute</em> ' +
        '(čitanje i izvršavanje), <em lang="en">Change</em> (promjena) ≈ <em lang="en">Modify</em> (izmjena), <em lang="en">Full Control</em> ' +
        '(potpuno upravljanje). Dozvole svih SID-ova zbrajaju se, a zabrana za bilo koji SID uklanja svoju razinu. ' +
        'Provjerava se samo pri pristupu preko mreže.</p>' +
        '<p><strong>Efektivni pristup</strong> preko mreže stroži je od dvaju, pravo po pravo; lokalno vrijedi samo NTFS. ' +
        'Zato se dozvole dijeljenja i NTFS dozvole ne zbrajaju.</p>' +
        '<p>Ovo nije „prva stavka koja se poklapa odlučuje” kao u popisu pravila usmjernika (simulator <em>rule-first-match</em>): ' +
        'NTFS čita dalje za prava o kojima još nije odlučeno.</p>' +
        '<p>Pojednostavljeno: prava su pet dijelova (čitanje, izvršavanje, pisanje, brisanje, dozvole i vlasništvo). ' +
        '<em>Deny Write</em> uklanja samo pisanje; brisanje iz <em>Modify</em> ostaje, ali <em>Modify</em> više nije potpun.</p>'
    },

    en: {
      stage: 'The user, their token, the share permissions and the folder\'s NTFS permissions',

      who: 'User',
      path: 'Access',
      pathNetwork: 'over the network',
      pathLocal: 'locally at FS1',
      shareEveryone: 'Share: Everyone',
      shareDenyEveryone: 'Share: Deny Change',
      ntfsProdaja: 'NTFS: Prodaja',
      denyPripravnici: 'NTFS: Pripravnici Deny Write',
      denyNone: 'none',
      denyExplicit: 'explicit',
      denyInherited: 'inherited',
      explicitAllowIvan: 'NTFS: ivan Modify, explicit',
      voditelji: 'ana also in Voditelji',
      memberShort: 'ana in Voditelji',

      presetClassic: 'Share Full Control, NTFS Modify',
      presetClassicHint: 'Over the network NTFS decides; marko has no ACE and gets nothing.',
      presetDefaultShare: 'Default share: Everyone Read',
      presetDefaultShareHint: 'Read only over the network, Modify locally.',
      presetGroupsAddUp: 'Groups add up',
      presetGroupsAddUpHint: 'Prodaja Read and Voditelji Write: ana gets both.',
      presetDenyWins: 'An explicit deny wins',
      presetDenyWinsHint: 'Pripravnici Deny Write: ivan only reads.',
      presetExplicitBeatsInherited: 'Explicit allow, inherited deny',
      presetExplicitBeatsInheritedHint: 'Deny from D:\\, allow for ivan on the folder: ivan writes.',
      presetDenyEveryoneShare: 'Share: Deny Everyone Change',
      presetDenyEveryoneShareHint: 'Nobody writes over the network; locally still Modify.',

      legWin: 'decides',
      legBeaten: 'too late: the right is already decided',
      legNo: 'does not apply to the user',
      legChanged: 'changed by the last setting',

      tokenTitle: 'Token of {user}',
      tokenNetwork: 'over the network → {unc}',
      tokenLocal: 'logged on at FS1 → {path}',
      kUser: 'user',
      kGroup: 'group',
      kNested: 'via {via}',
      kWellKnown: 'well-known',
      inNtfs: 'NTFS {n}',
      inShare: 'share {n}',

      resTitle: 'Result for {user}',
      rowShare: 'Share',
      rowNtfs: 'NTFS',
      rowEff: 'Effective',
      stricter: 'the stricter of the two, right by right',
      localOnly: 'locally: NTFS only',
      shareUnused: 'not checked locally',
      noAccess: 'no access',
      plus: '{a} + {b}',
      chipOn: '{chip}: yes',
      chipOff: '{chip}: no',
      noAce: '∅',
      subShare: 'share',
      subNtfs: 'NTFS',
      subBoth: 'both',
      chipKey: 'R Read · X Read & execute · W Write · M Modify · F Full Control · # the deciding ACE · ∅ no ACE grants it',
      dbNtfs: 'NTFS decides.',
      dbShare: 'The share decides.',
      dbSame: 'Both give the same.',
      dbBoth: 'Each side takes something away.',

      lv_read: 'Read',
      lv_readExecute: 'Read & execute',
      lv_write: 'Write',
      lv_modify: 'Modify',
      lv_full: 'Full Control',
      sh_read: 'Read',
      sh_change: 'Change',
      sh_full: 'Full Control',
      ph_read: 'Read',
      ph_readExecute: 'Read & execute',
      ph_write: 'Write',
      ph_modify: 'Modify',
      ph_full: 'Full Control',
      phs_read: 'Read',
      phs_change: 'Change',
      phs_full: 'Full Control',
      ph_none: 'nothing',

      shareTitle: 'Share permissions {unc}',
      ntfsTitle: 'NTFS permissions {path}, in canonical order',
      colPrincipal: 'Principal',
      colLevel: 'Permission',
      colOrigin: 'Origin',
      colType: 'Type',
      allow: '✓ allow',
      deny: '⛔ deny',
      explicit: 'explicit',
      inherited: '↧ from {from}',
      implicitNtfs: 'no ACE applies to the user',
      implicitShare: 'no ACE applies to the user',
      wordWin: 'decides',
      wordBeaten: 'too late',
      wordSkip: 'not read',
      outGrants: 'grants',
      outDenies: 'denies',

      uAna: 'Ana',
      uIvan: 'Ivan',
      uMarko: 'Marko',
      forIvan: 'Ivan',
      forGroup: 'group {g}',

      capNone: 'None of the SIDs in {user}\'s token appears in the folder\'s NTFS permissions: no access (implicit deny), whatever the share gives.',
      capNoneLocal: 'None of the SIDs in {user}\'s token appears in the folder\'s NTFS permissions: no access (implicit deny).',
      capShareRead: 'Over the network the stricter of the two applies: the share gives {share}, NTFS gives {ntfs}, so {user} may only read.',
      capShare: 'Over the network the stricter of the two applies: the share gives {share}, NTFS gives {ntfs}, so {user} gets only {eff}.',
      capNtfs: 'Over the network the stricter of the two applies: the share gives {share}, NTFS gives {ntfs}, so NTFS decides and {user} gets {eff}.',
      capSame: 'Over the network the share and NTFS give the same, {eff}, so {user} gets that.',
      capBoth: 'Over the network the stricter of the two applies, right by right: the share gives {share}, NTFS gives {ntfs}, so {user} gets only what both give: {eff}.',
      capLocal: 'Logged on locally at FS1: the share permissions are not checked, only NTFS applies, and {user} gets {eff}.',
      capExplicitBeats: 'The deny is inherited from D:\\, and the allow for {for} is set on the folder itself: an explicit allow comes before an inherited deny.',
      capExplicitDeny: 'The explicit deny for Pripravnici is read first: what it denies ({chips}) no later allow gives back.',
      capInheritedDeny: 'The inherited deny decides Write because no explicit allow grants Write before it.',
      capAddUp: 'NTFS rights from several ACEs add up: {list}.',
      addUpItem: '{g} gives {chips}',
      capShareDeny: 'The share\'s deny is for Everyone, so for every user, administrators too: nobody writes over the network.',
      list2: '{a} and {b}',
      listMore: '{a}, {b}',

      explain: '<p>At logon the user gets an access token: a list of SIDs (security identifiers) — the user\'s own, every group ' +
        'the user is in (and the groups those are nested in), and the well-known groups Everyone and Authenticated Users. Each ' +
        'ACE (access control entry) of an [[access control list]] names one SID; every SID in the token is compared.</p>' +
        '<p><strong>NTFS</strong> reads the ACEs in canonical order: explicit deny, explicit allow, inherited deny, inherited ' +
        'allow. Each right is decided by the first ACE that mentions it: a deny refuses it, an allow grants it. So an explicit ' +
        'deny beats every allow, but an explicit allow beats an inherited deny. Rights from different ACEs add up; a right ' +
        'nobody grants is refused.</p>' +
        '<p><strong>The share</strong> has only three levels: Read ≈ NTFS Read &amp; execute, Change ≈ Modify, Full Control. ' +
        'Allows from all SIDs add up, and a deny for any SID removes its level. It is checked only over the network.</p>' +
        '<p><strong>Effective access</strong> over the network is the stricter of the two, right by right; locally only NTFS ' +
        'applies. So share and NTFS permissions do not add up.</p>' +
        '<p>This is not "the first matching rule decides" as in a router\'s access list (the <em>rule-first-match</em> ' +
        'simulator): NTFS reads on for the rights not decided yet.</p>' +
        '<p>Simplified: rights are five parts (read, execute, write, delete, permissions and ownership). Deny Write removes ' +
        'writing only; the delete part of Modify stays, but Modify is no longer complete.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
