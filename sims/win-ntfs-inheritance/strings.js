/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-ntfs-inheritance, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other),
   [[term]] a glossary term, *word* an English term in italics (the page turns it into <em lang="en">). Permission
   names (Read, Modify, …) are the Windows terms, as in win-ntfs-share-effective. The title and subtitle come from
   sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Stablo mapa i popis dozvola odabranog objekta',

      // params
      pScript: 'Primjer',
      pUser: 'Čiji pristup',
      pShowFlags: 'Zastavice OI / CI / IO',
      pShowFlagsHint: 'Umjesto riječi „odnosi se na” prikaži zastavice nasljeđivanja.',
      pDisable: 'Isključi nasljeđivanje i',
      optConvert: 'pretvori',
      optRemove: 'ukloni',
      offDisable: 'Vrijedi samo u primjeru „Isključi i pretvori”.',

      // presets
      presetBasic: 'Nasljeđivanje niz stablo',
      presetBasicHint: 'Grafičari Modify na D:\\Projekti stiže do logo.psd.',
      presetExplicit: 'Izričito dopuštenje, naslijeđena zabrana',
      presetExplicitHint: 'Zabrana pisanja na Projekti, dopuštenje na Kampanja2026: vanjski piše.',
      presetDisable: 'Isključi i pretvori',
      presetDisableHint: 'Kampanja2026 zadržava unose; promjena na Projekti više ne stiže.',
      presetCopyMove: 'Kopiranje i premještanje',
      presetCopyMoveHint: 'Kopija dobiva dozvole Arhive, premještena datoteka zadržava stare.',
      presetCross: 'Premještanje na drugi volumen',
      presetCrossHint: 'Na E:\\Arhiva premještanje radi kao kopija.',

      // legend
      legExplicit: 'izričit unos',
      legInherited: 'naslijeđen unos (od mape)',
      legAllow: 'dopuštenje',
      legDeny: 'zabrana',
      legOff: 'nasljeđivanje isključeno',
      legChanged: 'promijenjeno u ovom koraku',

      // tree
      treeTitle: 'Mape i datoteke',
      treeHint: 'klikni objekt za njegov popis',
      treeAccess: 'pristup: {user}',
      nExplicit: ['{n} izričit unos', '{n} izričita unosa', '{n} izričitih unosa'],
      nInherited: ['{n} naslijeđen unos', '{n} naslijeđena unosa', '{n} naslijeđenih unosa'],
      keptTag: 'stari',
      keptLong: 'zadržao stare naslijeđene unose',
      offLong: 'nasljeđivanje isključeno',
      noAccessShort: '—',
      noAccess: 'bez pristupa',

      // table
      daclTitle: 'Dozvole: {path}',
      inheritOn: 'nasljeđivanje uključeno',
      inheritOff: 'nasljeđivanje isključeno: od roditelja ne stiže ništa',
      topOfTree: 'vrh stabla na ovom volumenu',
      picked: 'odabran klikom u stablu',
      backToStep: 'natrag na objekt iz koraka',
      colTrustee: 'Tko',
      colRights: 'Dozvola',
      colApplies: 'Odnosi se na',
      colSource: 'Izvor',
      colType: 'Vrsta',
      allow: 'dopuštenje',
      deny: 'zabrana',
      explicit: 'izričit',
      inheritedFrom: 'od {from}',
      keptFrom: 'od {from}, zadržan',
      ap_this: 'samo ova mapa',
      ap_tsf: 'ova mapa, podmape i datoteke',
      ap_sf: 'samo podmape i datoteke',
      ap_files: 'samo datoteke',
      ap_object: 'ovaj objekt',
      implicit: 'nijedan se unos ne odnosi na korisnika',
      emptyDacl: 'popis je prazan: nitko nema pristup (vlasnik i dalje može mijenjati dozvole)',
      wordWin: 'odlučuje',
      wordBeaten: 'prekasno',
      wordSkip: 'ne ovdje',
      outGrants: 'daje',
      outDenies: 'uskraćuje',

      // level names (Windows terms)
      lv_read: 'Read',
      lv_readExecute: 'Read & execute',
      lv_write: 'Write',
      lv_modify: 'Modify',
      lv_full: 'Full Control',
      plus: '{a} + {b}',

      // effective access
      effTitle: '{user} na {name}',
      chipOn: '{chip}: da',
      chipOff: '{chip}: ne',
      noAce: '∅',
      chipKey: 'R *Read* · X *Read & execute* · W *Write* · M *Modify* · F *Full Control* · # unos koji odlučuje · ∅ nijedan ne daje',

      // captions
      capStart: '{path}: {counts}. Pritisni → za sljedeći korak.',
      counts: '{e}, {i}',
      join: '{a}, {b}',
      sep: '{a} · {b}',
      nRemoved: ['{n} unos uklonjen', '{n} unosa uklonjena', '{n} unosa uklonjeno'],
      capAdd: 'Na {path} dodan je izričit unos: {ace}.',
      aceText: '{trustee}: {type} {rights}',
      typeAllow: 'dopuštenje',
      typeDeny: 'zabrana',
      capReached: ['Nasljeđivanje ga je prenijelo na {n} objekt ispod.', 'Nasljeđivanje ga je prenijelo na {n} objekta ispod.', 'Nasljeđivanje ga je prenijelo na {n} objekata ispod.'],
      capRemove: 'S {path} uklonjen je unos za {trustee}; promjena se proširila na sve ispod što nasljeđuje.',
      capBlocked: '{name} ima isključeno nasljeđivanje: promjena tamo ne stiže.',
      capResorted: 'Zabrana je otišla na vrh popisa: izričite zabrane čitaju se prije svih dopuštenja.',
      capConvert: 'Isključeno nasljeđivanje s pretvaranjem: unosi su ostali, ali sad su izričiti i promjene roditelja više ne stižu.',
      capRemoveAll: 'Isključeno nasljeđivanje s uklanjanjem: naslijeđeni unosi su nestali, a izričitih nema — popis je prazan i nitko nema pristup.',
      capCopy: 'Kopija u {dest} novi je objekt: nema izričitih unosa, a nasljeđuje samo preko nove mape.',
      capLostExplicit: 'Izričit unos izvornika ({trustee}) nije prešao.',
      capMoveSame: 'Premještanje unutar istog volumena: {name} zadržava svoje unose, pa i one naslijeđene od {old}; od {dest} ne dobiva ništa dok se dozvole ne prošire ponovno.',
      capMoveCross: 'Premještanje na drugi volumen je kopija pa brisanje: {name} dobiva samo ono što daje {dest}, stari unosi su nestali.',
      capKeptDropped: '{name} sad ima unose od {dest}: promjena na mapi proširila se ponovno i zamijenila stare.',
      capAllFrom: '{name} nema vlastitih unosa: sve što vidiš naslijeđeno je od {from}.',
      capAllInherited: '{name} nema vlastitih unosa: sve što vidiš naslijeđeno je.',
      capKept: '{name} i dalje nosi stare unose iz {old}, iako je u {dest}.',
      capOff: '{name} ima isključeno nasljeđivanje: svi su unosi izričiti.',
      capOffEmpty: '{name} ima isključeno nasljeđivanje, a popis mu je prazan: nitko nema pristup.',
      capSelect: '{path}: {counts}.',
      capExplicitBeats: 'Izričito dopuštenje ({trustee}) stoji prije naslijeđene zabrane, pa ona dolazi prekasno: {user} smije pisati.',
      capNearer: 'Oba su unosa naslijeđena: dopuštenje s bliže mape ({near}) stoji prije zabrane s {far}, pa {user} smije pisati.',
      capInheritedDeny: 'Naslijeđena zabrana od {from} odlučuje o pisanju: {user} ne smije pisati.',
      capUpward: 'Dopuštenje na {name} ne ide prema gore.',
      capRejected: 'Korak odbijen ({reason}); ništa se nije promijenilo.',
      rej_missing: 'objekt ne postoji',
      rej_noSuchAce: 'takvog unosa nema',
      rej_alreadyOff: 'nasljeđivanje je već isključeno',
      rej_destNotFolder: 'odredište nije mapa',
      rej_notFile: 'ovdje se kopiraju i premještaju samo datoteke',
      rej_sameFolder: 'datoteka je već u toj mapi',
      rej_nameTaken: 'ime je u odredištu već zauzeto',
      rej_unknownOp: 'nepoznata operacija',

      explain: '<p>Dozvole objekta na NTFS-u čine [[access control list]] (<em lang="en">DACL</em>): niz unosa, <em lang="en">ACE</em> ' +
        '(<em lang="en">access control entry</em>). Unos je <em lang="en">explicit</em> (izričit) kad je zadan na samom objektu, a ' +
        '<em lang="en">inherited</em> (naslijeđen) kad ga je objekt dobio od mape iznad sebe. <em lang="en">Inheritance</em> ' +
        '(nasljeđivanje) se ne čita pri provjeri: unosi se prepisuju u objekte ispod čim se mapa promijeni. Na objektu je unos samo označen kao naslijeđen; od koje je mape došao, prozor s dozvolama izračuna gledajući mape iznad.</p>' +
        '<p>„Odnosi se na” odlučuje tko dobiva unos: samo ova mapa, podmape, datoteke ili kombinacija (zastavice OI, CI, IO). ' +
        'Unos „samo podmape i datoteke” prikazan je na mapi, ali za nju samu ne vrijedi.</p>' +
        '<p><strong>Redoslijed:</strong> izričite zabrane, izričita dopuštenja, pa naslijeđeni unosi razinu po razinu — s roditelja, ' +
        'pa s djeda — a unutar razine zabrane prije dopuštenja. Provjera čita redom i o svakom pravu odlučuje prvi unos koji ga spominje. ' +
        'Zato „zabrana uvijek pobjeđuje” vrijedi samo među unosima iste razine (oba izričita ili oba naslijeđena od iste mape): izričito dopuštenje pobjeđuje naslijeđenu zabranu, a dopuštenje naslijeđeno od bliže mape zabranu od dalje.</p>' +
        '<p><strong>Isključivanje nasljeđivanja</strong> pita: pretvoriti naslijeđene unose u izričite ili ih ukloniti. Uz pretvaranje ' +
        'unosi ostaju, sad izričiti (i poredani kao izričiti), ali promjene na roditelju više ne stižu.</p>' +
        '<p><strong>Kopija</strong> je novi objekt i nasljeđuje od nove mape; izričiti unosi ne prelaze. <strong>Premještanje unutar istog ' +
        'volumena</strong> ne stvara novi objekt: datoteka zadržava sve unose, i stare naslijeđene, dok se dozvole mape ne prošire ponovno. ' +
        'Premještanje na drugi volumen je kopija pa brisanje.</p>' +
        '<p>Na Linuxu istu ulogu ima zadana ACL mape (<em lang="en">default ACL</em>), ali ona se primjenjuje samo pri stvaranju: ' +
        'kasnija promjena mape ne mijenja postojeće datoteke.</p>'
    },
    en: {
      stage: 'Folder tree and the permission list of the chosen object',

      pScript: 'Example',
      pUser: 'Whose access',
      pShowFlags: 'Flags OI / CI / IO',
      pShowFlagsHint: 'Show the inheritance flags instead of "applies to" in words.',
      pDisable: 'Disable inheritance and',
      optConvert: 'convert',
      optRemove: 'remove',
      offDisable: 'Only used by the example "Disable and convert".',

      presetBasic: 'Inheritance down the tree',
      presetBasicHint: 'Grafičari Modify on D:\\Projekti reaches logo.psd.',
      presetExplicit: 'Explicit allow, inherited deny',
      presetExplicitHint: 'Deny Write on Projekti, allow on Kampanja2026: vanjski writes.',
      presetDisable: 'Disable and convert',
      presetDisableHint: 'Kampanja2026 keeps its entries; a change on Projekti no longer arrives.',
      presetCopyMove: 'Copy and move',
      presetCopyMoveHint: 'The copy gets Arhiva\'s permissions, the moved file keeps its old ones.',
      presetCross: 'Move to another volume',
      presetCrossHint: 'To E:\\Arhiva a move behaves like a copy.',

      legExplicit: 'explicit entry',
      legInherited: 'inherited entry (from a folder)',
      legAllow: 'allow',
      legDeny: 'deny',
      legOff: 'inheritance disabled',
      legChanged: 'changed in this step',

      treeTitle: 'Folders and files',
      treeHint: 'click an object for its list',
      treeAccess: 'access: {user}',
      nExplicit: ['{n} explicit entry', '{n} explicit entries'],
      nInherited: ['{n} inherited entry', '{n} inherited entries'],
      keptTag: 'old',
      keptLong: 'kept its old inherited entries',
      offLong: 'inheritance disabled',
      noAccessShort: '—',
      noAccess: 'no access',

      daclTitle: 'Permissions: {path}',
      inheritOn: 'inheritance enabled',
      inheritOff: 'inheritance disabled: nothing arrives from the parent',
      topOfTree: 'top of the tree on this volume',
      picked: 'picked in the tree',
      backToStep: 'back to the step\'s object',
      colTrustee: 'Who',
      colRights: 'Permission',
      colApplies: 'Applies to',
      colSource: 'Source',
      colType: 'Type',
      allow: 'allow',
      deny: 'deny',
      explicit: 'explicit',
      inheritedFrom: 'from {from}',
      keptFrom: 'from {from}, kept',
      ap_this: 'this folder only',
      ap_tsf: 'this folder, subfolders and files',
      ap_sf: 'subfolders and files only',
      ap_files: 'files only',
      ap_object: 'this object',
      implicit: 'no entry applies to the user',
      emptyDacl: 'the list is empty: nobody has access (the owner can still change the permissions)',
      wordWin: 'decides',
      wordBeaten: 'too late',
      wordSkip: 'not here',
      outGrants: 'grants',
      outDenies: 'denies',

      lv_read: 'Read',
      lv_readExecute: 'Read & execute',
      lv_write: 'Write',
      lv_modify: 'Modify',
      lv_full: 'Full Control',
      plus: '{a} + {b}',

      effTitle: '{user} on {name}',
      chipOn: '{chip}: yes',
      chipOff: '{chip}: no',
      noAce: '∅',
      chipKey: 'R Read · X Read & execute · W Write · M Modify · F Full Control · # the deciding entry · ∅ none grants it',

      capStart: '{path}: {counts}. Press → for the next step.',
      counts: '{e}, {i}',
      join: '{a}, {b}',
      sep: '{a} · {b}',
      nRemoved: ['{n} entry removed', '{n} entries removed'],
      capAdd: 'An explicit entry was added on {path}: {ace}.',
      aceText: '{trustee}: {type} {rights}',
      typeAllow: 'allow',
      typeDeny: 'deny',
      capReached: ['Inheritance carried it to {n} object below.', 'Inheritance carried it to {n} objects below.'],
      capRemove: 'The entry for {trustee} was removed from {path}; the change spread to everything below that inherits.',
      capBlocked: '{name} has inheritance disabled: the change does not arrive there.',
      capResorted: 'The deny went to the top of the list: explicit denies are read before every allow.',
      capConvert: 'Inheritance disabled with convert: the entries stayed, but they are explicit now and parent changes no longer arrive.',
      capRemoveAll: 'Inheritance disabled with remove: the inherited entries are gone and there are no explicit ones — the list is empty and nobody has access.',
      capCopy: 'The copy in {dest} is a new object: it has no explicit entries and inherits only through its new folder.',
      capLostExplicit: 'The original\'s explicit entry ({trustee}) did not come along.',
      capMoveSame: 'A move within the same volume: {name} keeps its entries, also those inherited from {old}; it gets nothing from {dest} until permissions are propagated again.',
      capMoveCross: 'A move to another volume is a copy and a delete: {name} gets only what {dest} passes down, its old entries are gone.',
      capKeptDropped: '{name} now has the entries of {dest}: the change on the folder propagated again and replaced the old ones.',
      capAllFrom: '{name} has no entries of its own: everything you see is inherited from {from}.',
      capAllInherited: '{name} has no entries of its own: everything you see is inherited.',
      capKept: '{name} still carries the old entries from {old}, although it is in {dest}.',
      capOff: '{name} has inheritance disabled: all its entries are explicit.',
      capOffEmpty: '{name} has inheritance disabled and an empty list: nobody has access.',
      capSelect: '{path}: {counts}.',
      capExplicitBeats: 'The explicit allow ({trustee}) comes before the inherited deny, so the deny is too late: {user} may write.',
      capNearer: 'Both entries are inherited: the allow from the nearer folder ({near}) comes before the deny from {far}, so {user} may write.',
      capInheritedDeny: 'The deny inherited from {from} decides Write: {user} may not write.',
      capUpward: 'The allow on {name} does not travel up.',
      capRejected: 'Step rejected ({reason}); nothing changed.',
      rej_missing: 'no such object',
      rej_noSuchAce: 'no such entry',
      rej_alreadyOff: 'inheritance is already disabled',
      rej_destNotFolder: 'the destination is not a folder',
      rej_notFile: 'only files are copied and moved here',
      rej_sameFolder: 'the file is already in that folder',
      rej_nameTaken: 'the name is taken in the destination',
      rej_unknownOp: 'unknown operation',

      explain: '<p>An object\'s permissions on NTFS are an [[access control list]] (DACL): a list of ACEs (access control entries). ' +
        'An entry is explicit when it was set on the object itself, and inherited when the object got it from a folder above it. ' +
        'Inheritance is not looked up during the check: the entries are written into the objects below whenever the folder changes. ' +
        'On the object an entry is only marked inherited; which folder it came from the permissions dialog works out by looking at the folders above.</p>' +
        '<p>"Applies to" decides who receives an entry: this folder only, subfolders, files or a combination (flags OI, CI, IO). ' +
        'An entry for "subfolders and files only" is listed on the folder but does not count for the folder itself.</p>' +
        '<p><strong>Order:</strong> explicit denies, explicit allows, then the inherited entries level by level — from the parent, then ' +
        'from the grandparent — with denies before allows within a level. The check reads in order and the first entry that mentions a ' +
        'right decides it. So "deny always wins" holds only among entries of the same level (both explicit, or both inherited from the same folder): an explicit allow beats an inherited deny, and an allow inherited from a nearer folder beats a deny from a farther one.</p>' +
        '<p><strong>Disabling inheritance</strong> asks whether to convert the inherited entries into explicit ones or to remove them. ' +
        'With convert the entries stay, now explicit (and sorted as explicit ones), but changes on the parent no longer arrive.</p>' +
        '<p>A <strong>copy</strong> is a new object and inherits from its new folder; explicit entries do not come along. A <strong>move ' +
        'within the same volume</strong> creates no new object: the file keeps all its entries, the old inherited ones too, until the ' +
        'folder\'s permissions are propagated again. A move to another volume is a copy and a delete.</p>' +
        '<p>On Linux a folder\'s default ACL plays the same role, but it applies only when a file is created: changing the folder later ' +
        'does not change existing files.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
