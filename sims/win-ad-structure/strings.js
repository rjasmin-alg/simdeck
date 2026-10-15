/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-ad-structure, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term. In captions, *English term* is set in italics
   by the page (the Croatian term rule: English in italics, Croatian in parentheses at first mention).
   Names of domains, containers, GPOs, DCs and DNs are data, not language: the page writes them with translate="no".
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Šuma, domene, OU-ovi i lokacije',
      lens: 'Pokaži granicu',
      lensNone: 'nijedna',
      lensSecurity: 'sigurnost',
      lensReplication: 'replikacija',
      lensPolicy: 'GPO',
      hidden: 'stanje pozornice',

      presetSecurity: 'Sigurnost: granica je šuma',
      presetSecurityHint: 'Enterprise Admins dosežu svaku domenu.',
      presetReplication: 'Replikacija: koje particije gdje',
      presetReplicationHint: 'Shema i konfiguracija svuda, particija domene samo u svojoj domeni.',
      presetPolicy: 'GPO: na što se može povezati',
      presetPolicyHint: 'Lokacija, domena, OU da; CN=Users ne.',
      presetAsIs: 'Quillmoor kakav jest',
      presetAsIsHint: 'ana u CN=Users dobiva samo GPO-ove domene.',

      legForest: 'šuma',
      legTree: 'stablo',
      legDomain: 'domena',
      legOu: 'OU',
      legContainer: 'spremnik',
      legSite: 'lokacija',
      legChanged: 'odabrano / premješteno',

      kForest: 'Šuma',
      kTree: 'Stablo',
      kDomain: 'Domena',
      kOu: 'OU',
      kContainer: 'Spremnik',
      kSite: 'Lokacija',
      kDc: 'Kontroler domene',
      kUser: 'korisnik',
      kComputer: 'računalo',
      kGroup: 'grupa',
      hUser: 'Korisnik',
      hComputer: 'Računalo',
      hGroup: 'Grupa',

      sitesTitle: 'Lokacije su fizičke, odvojene od domena',
      siteLink: 'veza lokacija',
      gc: 'GC',
      rodc: 'RODC',
      nUsers: ['{n} korisnik', '{n} korisnika', '{n} korisnika'],
      nComputers: ['{n} računalo', '{n} računala', '{n} računala'],

      trustPc: '⇄ povjerenje roditelj–dijete',
      trustTr: '⇄ povjerenje korijena stabla',
      bSecurity: 'sigurnosna granica: Enterprise Admins u svim domenama',
      bNotBoundary: 'nije sigurnosna granica',
      bSchemaConfig: 'shema i konfiguracija: na svim DC-ovima',
      bPartition: 'particija domene: samo njezini DC-ovi',
      gpoCan: 'GPO: da',
      gpoCannot: 'GPO: ne',
      pSC: 'shema, konfig.',
      pFull: 'puna: {d}',
      pFullRo: 'puna, samo čitanje: {d}',
      pGc: 'GC: {list}',
      holding: 'Nosiš {obj}: klikni OU ili spremnik (ili opet {again} za odustajanje).',
      refused: '✕ odbijeno',
      chipLabel: '{obj}, {kind}: klikni za premještanje',
      listSep: ', ',

      cardEmpty: 'Klikni okvir: šumu, stablo, domenu, OU, spremnik, lokaciju ili DC. Ovdje piše čemu služi.',
      cardMove: 'Objekte ana, PC07 i G-Projects premjesti povlačenjem ili klikom na objekt pa na OU.',

      fForestEa: 'Sigurnosna granica: Enterprise Admins i Schema Admins su u korijenskoj domeni, a Enterprise Admins imaju prava u svakoj domeni: {list}.',
      fForestShared: 'Sve domene dijele jednu shemu, jednu konfiguraciju i jedan globalni katalog.',
      fForestDomain: 'Domena nije sigurnosna granica: tko upravlja njezinim DC-ovima, može doći do cijele šume.',
      fForestTrees: 'Stabla: {list}.',

      fTreeName: 'Neprekinuti DNS prostor imena: ime svake domene u stablu završava imenom korijena {root}.',
      fTreeDomains: 'Domene: {list}.',
      fTreePc: 'Podređena domena {child} automatski dobiva dvosmjerno tranzitivno povjerenje roditelj–dijete s {parent}.',
      fTreeTr: 'Novo stablo: njegov korijen {root} automatski dobiva dvosmjerno tranzitivno povjerenje korijena stabla s korijenom šume {forest}.',
      fTreePath: 'Povjerenja su tranzitivna: {path}.',

      fDomRepl: 'Particija domene replicira se samo na DC-ove ove domene: {full}. Djelomičnu kopiju drži GC iz drugih domena: {partial}.',
      fDomAdmins: 'Vlastiti Domain Admins i jedno pravilo lozinki domene (iz njezina Default Domain Policy).',
      fDomSites: 'Lokacije s njezinim DC-ovima: {sites}.',
      fDomGpos: 'GPO-ovi povezani s domenom: {list}.',
      fDomTrust: 'Povjerenje s {other}: {kind}.',
      trustKind_pc: 'roditelj–dijete, dvosmjerno, tranzitivno',
      trustKind_tr: 'korijen stabla, dvosmjerno, tranzitivno',

      fOu: 'Organizacijska jedinica u domeni {domain}: nosi poveznice na GPO i delegiranje upravljanja.',
      fOuNoSid: 'Nije sigurnosni subjekt: nema SID, pa se ne može pojaviti u ACL-u.',
      fGpos: 'Vezani GPO-ovi: {list}.',
      fNoGpos: 'Na ovaj OU nije povezan nijedan GPO.',
      fCount: 'Objekata u stvarnoj domeni: {count}.',
      fCn: 'Spremnik, a ne OU: na njega se ne može povezati GPO.',
      fCnScope: 'Objekti u njemu dobivaju samo GPO-ove povezane s lokacijom i domenom.',
      fCnUsers: 'Ovdje nastaju novi korisnici i grupe, ako se ne kaže drukčije.',
      fCnComputers: 'Ovdje stižu računala koja se pridruže domeni, ako se ne kaže drukčije.',

      fSite: 'Fizička: podmreža {subnets}, veza lokacija {link}.',
      fSiteDcs: 'DC-ovi ovdje: {dcs}, iz domena: {domains}.',
      fSiteIndep: 'Lokacija ne prati domene: jedna lokacija drži DC-ove više domena, a jedna domena se proteže preko više lokacija.',
      fSiteGpo: 'GPO se može povezati i na lokaciju; ovdje nije povezan nijedan.',

      fDc: 'Kontroler domene {domain}, na lokaciji {site}.',
      fDcHolds: 'Drži: {parts}.',
      fDcRodc: 'Samo za čitanje: na njemu se ništa ne mijenja; izmjene nastaju na DC-u koji se može pisati i stižu replikacijom.',
      partSchema: 'shemu',
      partConfig: 'konfiguraciju',
      partFull: 'punu kopiju domene {d}',
      partPartial: 'djelomičnu kopiju domene {d} (GC)',

      fObjDn: 'Razlikovno ime: {dn}',
      fObjSid: 'Sigurnosni subjekt: ima SID i može biti u ACL-u.',
      fObjOne: 'Ima točno jednog roditelja. Premjesti ga povlačenjem ili klikom na njega pa na OU.',
      fObjGroup: 'Tko je član grupe ne ovisi o tome u kojem je OU-u.',
      fObjNoGpo: 'GPO se primjenjuje samo na korisnike i računala: grupa u OU-u ne dobiva nijedan (grupom se može suziti na koga se GPO primjenjuje).',
      capGroup: '{obj} je u {cn}. GPO se primjenjuje samo na korisnike i računala, pa grupa ne dobiva nijedan, gdje god bila; grupe nose dozvole.',
      fObjGpos: 'U dosegu GPO-ova povezanih s domenom, njegovim OU-om i OU-ovima iznad: {list}.',

      capStart: 'Klikni okvir da vidiš čemu služi, ili uzmi ana, PC07 ili G-Projects i stavi ga u OU. Granicu biraj u postavkama: sigurnost, replikacija ili GPO.',
      capSecurity: 'Sigurnosna granica je *forest* (šuma), a ne domena: Enterprise Admins dosežu svaku domenu ovdje, a tko upravlja DC-ovima jedne domene, može doći do cijele šume.',
      capReplication: 'Shema i konfiguracija repliciraju se na svaki DC šume. Particija domene ide samo na DC-ove te domene, a djelomičnu kopiju drži svaki *global catalog* (globalni katalog) drugih domena. Lokacije dolje pokazuju gdje su kopije.',
      capPolicy: 'GPO se povezuje na *site* (lokaciju), domenu ili *organizational unit* (organizacijsku jedinicu). CN=Users i CN=Computers su spremnici: na njih se GPO ne može povezati.',
      capForest: '*Forest* (šuma) je jedna shema, jedna konfiguracija i jedan globalni katalog za sve tri domene, i sigurnosna granica.',
      capTree: '*Tree* (stablo) je skup domena s neprekinutim DNS prostorom imena; svaka nova domena automatski dobiva dvosmjerno tranzitivno povjerenje.',
      capDomain: 'Domena je granica replikacije svoje particije, svojih Domain Admins i jednog pravila lozinki, ali nije sigurnosna granica.',
      capOu: '*Organizational unit* (organizacijska jedinica) nosi poveznice na GPO i delegiranje, ali nije sigurnosni subjekt: ne može se pojaviti u ACL-u.',
      capCn: '{cn} je spremnik, a ne OU: na njega se ne može povezati GPO, pa {obj} dobiva samo pravila s razine domene.',
      capCnEmpty: '{cn} je spremnik, a ne OU: na njega se ne može povezati GPO, pa objekti u njemu dobivaju samo pravila lokacije i domene.',
      capObjOu: '{obj} je u {ou}: uz GPO-ove domene u dosegu su mu i oni povezani s njegovim OU-om i OU-ovima iznad ({n}).',
      capObjOuNone: '{obj} je u {ou}. Na taj OU i one iznad zasad nije povezan nijedan GPO, ali OU je mjesto gdje se može povezati.',
      capSite: '*Site* (lokacija) je fizička: podmreže i veze. Ne prati domene: {site} drži DC-ove domena {domains}.',
      capDc: '{dc} drži shemu i konfiguraciju šume te particiju svoje domene; GC drži i djelomične kopije ostalih domena.',
      capHeld: 'Nosiš {obj}. Klikni OU ili spremnik domene {domain}.',
      capMoved: 'Premješteno.',
      cap_other: '{obj} pripada domeni {from}, a {target} je u domeni {to}. Prijelaz u drugu domenu je migracija, a ne premještanje: odbijeno.',
      cap_site: '{target} je lokacija: fizička je (podmreže i veze), a nije spremnik. Objekt se ne stavlja u lokaciju: odbijeno.',
      cap_notContainer: '{target} nije OU ni spremnik. Objekt se stavlja u OU ili spremnik svoje domene: odbijeno.',
      cap_unknown: 'Taj okvir ne postoji: odbijeno.',

      explain:
        '<p><em lang="en">Forest</em> (šuma) je <b>sigurnosna granica</b>: sve njezine domene dijele jednu shemu, jednu ' +
        'konfiguraciju i jedan <em lang="en">global catalog</em> (globalni katalog), a Enterprise Admins imaju prava u svakoj ' +
        'domeni. Domena to nije: tko upravlja DC-ovima jedne domene, može doći do cijele šume.</p>' +
        '<p>[[tree]] je skup domena s neprekinutim DNS prostorom imena (<span translate="no">brk.quillmoor.example</span> ispod ' +
        '<span translate="no">quillmoor.example</span>). Podređena domena dobiva dvosmjerno tranzitivno povjerenje s roditeljem, ' +
        'novo stablo s korijenom šume.</p>' +
        '<p><em lang="en">Domain</em> (domena) je granica <b>replikacije</b> svoje particije: punu kopiju drže samo DC-ovi te domene, ' +
        'a GC iz drugih domena djelomičnu. Shema i konfiguracija idu na svaki DC šume. Domena ima i svoje Domain Admins i ' +
        'jedno pravilo lozinki.</p>' +
        '<p><em lang="en">Organizational unit</em> (organizacijska jedinica, OU) je spremnik unutar jedne domene na koji se povezuje ' +
        'GPO (<b>pravila</b>) i na kojem se delegira upravljanje. Nije sigurnosni subjekt: nema SID i ne može biti u ' +
        '[[access control list]] (ACL). Prava se daju grupama. CN=Users i CN=Computers su spremnici, a ne OU-ovi: GPO se na ' +
        'njih ne može povezati, pa objekti u njima dobivaju samo GPO-ove lokacije i domene.</p>' +
        '<p>Svaki objekt ima jednog roditelja (razlikovno ime ima jednog roditelja). Prijelaz u drugu domenu je migracija. ' +
        '<em lang="en">Site</em> (lokacija) je fizička, podmreže i veze, i ne prati domene.</p>'
    },

    en: {
      stage: 'Forest, domains, OUs and sites',
      lens: 'Show the boundary',
      lensNone: 'none',
      lensSecurity: 'security',
      lensReplication: 'replication',
      lensPolicy: 'GPO',
      hidden: 'stage state',

      presetSecurity: 'Security: the forest is the boundary',
      presetSecurityHint: 'Enterprise Admins reach every domain.',
      presetReplication: 'Replication: which partition where',
      presetReplicationHint: 'Schema and configuration everywhere, a domain partition only in its domain.',
      presetPolicy: 'GPO: what it can link to',
      presetPolicyHint: 'Site, domain, OU yes; CN=Users no.',
      presetAsIs: 'Quillmoor as it is',
      presetAsIsHint: 'ana in CN=Users gets only the domain’s GPOs.',

      legForest: 'forest',
      legTree: 'tree',
      legDomain: 'domain',
      legOu: 'OU',
      legContainer: 'container',
      legSite: 'site',
      legChanged: 'selected / moved',

      kForest: 'Forest',
      kTree: 'Tree',
      kDomain: 'Domain',
      kOu: 'OU',
      kContainer: 'Container',
      kSite: 'Site',
      kDc: 'Domain controller',
      kUser: 'user',
      kComputer: 'computer',
      kGroup: 'group',
      hUser: 'User',
      hComputer: 'Computer',
      hGroup: 'Group',

      sitesTitle: 'Sites are physical, apart from the domains',
      siteLink: 'site link',
      gc: 'GC',
      rodc: 'RODC',
      nUsers: ['{n} user', '{n} users'],
      nComputers: ['{n} computer', '{n} computers'],

      trustPc: '⇄ parent–child trust',
      trustTr: '⇄ tree-root trust',
      bSecurity: 'security boundary: Enterprise Admins in every domain',
      bNotBoundary: 'not a security boundary',
      bSchemaConfig: 'schema and configuration: on every DC',
      bPartition: 'domain partition: its own DCs only',
      gpoCan: 'GPO: yes',
      gpoCannot: 'GPO: no',
      pSC: 'schema, config',
      pFull: 'full: {d}',
      pFullRo: 'full, read-only: {d}',
      pGc: 'GC: {list}',
      holding: 'Holding {obj}: click an OU or a container (or {again} again to cancel).',
      refused: '✕ refused',
      chipLabel: '{obj}, {kind}: click to move',
      listSep: ', ',

      cardEmpty: 'Click a box: the forest, a tree, a domain, an OU, a container, a site or a DC. This card says what it is for.',
      cardMove: 'Move ana, PC07 and G-Projects by dragging, or click the object and then an OU.',

      fForestEa: 'Security boundary: Enterprise Admins and Schema Admins sit in the forest root domain, and Enterprise Admins have rights in every domain: {list}.',
      fForestShared: 'All domains share one schema, one configuration and one global catalog.',
      fForestDomain: 'A domain is not a security boundary: whoever runs its DCs can reach the whole forest.',
      fForestTrees: 'Trees: {list}.',

      fTreeName: 'A contiguous DNS namespace: every domain name in the tree ends in the root’s name, {root}.',
      fTreeDomains: 'Domains: {list}.',
      fTreePc: 'The child domain {child} gets a two-way transitive parent–child trust with {parent} automatically.',
      fTreeTr: 'A new tree: its root {root} gets a two-way transitive tree-root trust with the forest root {forest} automatically.',
      fTreePath: 'Trusts are transitive: {path}.',

      fDomRepl: 'Its domain partition replicates only to this domain’s DCs: {full}. A GC of another domain holds a partial copy: {partial}.',
      fDomAdmins: 'Its own Domain Admins and one domain password policy (from its own Default Domain Policy).',
      fDomSites: 'Sites with its DCs: {sites}.',
      fDomGpos: 'GPOs linked to the domain: {list}.',
      fDomTrust: 'Trust with {other}: {kind}.',
      trustKind_pc: 'parent–child, two-way, transitive',
      trustKind_tr: 'tree-root, two-way, transitive',

      fOu: 'An organizational unit in {domain}: it carries GPO links and delegated administration.',
      fOuNoSid: 'Not a security principal: no SID, so it can’t appear on an ACL.',
      fGpos: 'Linked GPOs: {list}.',
      fNoGpos: 'No GPO is linked to this OU.',
      fCount: 'Objects in the real domain: {count}.',
      fCn: 'A container, not an OU: no GPO can be linked to it.',
      fCnScope: 'Objects in it get only site- and domain-linked GPOs.',
      fCnUsers: 'New users and groups are created here unless told otherwise.',
      fCnComputers: 'Computers joining the domain land here unless told otherwise.',

      fSite: 'Physical: subnet {subnets}, site link {link}.',
      fSiteDcs: 'DCs here: {dcs}, from the domains: {domains}.',
      fSiteIndep: 'A site does not follow domains: one site holds DCs of several domains, and one domain spans several sites.',
      fSiteGpo: 'A GPO can be linked to a site too; none is linked here.',

      fDc: 'Domain controller of {domain}, in site {site}.',
      fDcHolds: 'Holds: {parts}.',
      fDcRodc: 'Read-only: nothing is changed on it; changes are made on a writable DC and reach it by replication.',
      partSchema: 'the schema',
      partConfig: 'the configuration',
      partFull: 'a full copy of {d}',
      partPartial: 'a partial copy of {d} (GC)',

      fObjDn: 'Distinguished name: {dn}',
      fObjSid: 'A security principal: it has a SID and can be on an ACL.',
      fObjOne: 'It has exactly one parent. Move it by dragging, or click it and then an OU.',
      fObjGroup: 'Who is a member of the group does not depend on the OU it sits in.',
      fObjNoGpo: 'GPOs apply only to users and computers: a group in an OU receives none (a group can filter who a GPO applies to).',
      capGroup: '{obj} is in {cn}. GPOs apply only to users and computers, so a group receives none wherever it sits; groups carry permissions.',
      fObjGpos: 'In the scope of the GPOs linked to the domain, its OU and the OUs above it: {list}.',

      capStart: 'Click a box to see what it is for, or pick up ana, PC07 or G-Projects and put it in an OU. Pick a boundary in the settings: security, replication or GPO.',
      capSecurity: 'The security boundary is the forest, not the domain: Enterprise Admins reach every domain here, and whoever runs one domain’s DCs can reach the whole forest.',
      capReplication: 'Schema and configuration replicate to every DC of the forest. A domain partition goes only to that domain’s DCs, and every global catalog of the other domains holds a partial copy. The sites below show where the copies live.',
      capPolicy: 'A GPO links to a site, a domain or an organizational unit. CN=Users and CN=Computers are containers: no GPO can be linked to them.',
      capForest: 'The forest is one schema, one configuration and one global catalog for all three domains, and the security boundary.',
      capTree: 'A tree is a set of domains with a contiguous DNS namespace; each new domain gets a two-way transitive trust automatically.',
      capDomain: 'A domain is the boundary of its partition’s replication, of its Domain Admins and of one password policy, but it is not a security boundary.',
      capOu: 'An organizational unit carries GPO links and delegation, but it is not a security principal: it can’t appear on an ACL.',
      capCn: '{cn} is a container, not an OU: no GPO can be linked there, so {obj} gets only domain-level policy.',
      capCnEmpty: '{cn} is a container, not an OU: no GPO can be linked there, so objects in it get only site- and domain-level policy.',
      capObjOu: '{obj} is in {ou}: besides the domain’s GPOs it is also in the scope of those linked to its OU and the OUs above it ({n}).',
      capObjOuNone: '{obj} is in {ou}. No GPO is linked to that OU or those above it yet, but an OU is where one can be linked.',
      capSite: 'A site is physical: subnets and links. It does not follow domains: {site} holds DCs of the domains {domains}.',
      capDc: '{dc} holds the forest’s schema and configuration and its own domain’s partition; a GC also holds partial copies of the other domains.',
      capHeld: 'Holding {obj}. Click an OU or a container of {domain}.',
      capMoved: 'Moved.',
      cap_other: '{obj} belongs to {from}, and {target} is in {to}. Going to another domain is a migration, not a move: refused.',
      cap_site: '{target} is a site: it is physical (subnets and links), not a container. Objects are not placed in sites: refused.',
      cap_notContainer: '{target} is neither an OU nor a container. An object goes into an OU or a container of its own domain: refused.',
      cap_unknown: 'That box does not exist: refused.',

      explain:
        '<p>A forest is the <b>security boundary</b>: all its domains share one schema, one configuration and one global ' +
        'catalog, and Enterprise Admins have rights in every domain. A domain is not: whoever runs one domain’s DCs can reach ' +
        'the whole forest.</p>' +
        '<p>A [[tree]] is a set of domains with a contiguous DNS namespace (<span translate="no">brk.quillmoor.example</span> ' +
        'under <span translate="no">quillmoor.example</span>). A child domain gets a two-way transitive trust with its parent, ' +
        'a new tree one with the forest root.</p>' +
        '<p>A domain is the <b>replication</b> boundary of its partition: only the domain’s own DCs hold a full copy, a GC of ' +
        'another domain a partial one. Schema and configuration go to every DC of the forest. A domain also has its own ' +
        'Domain Admins and one password policy.</p>' +
        '<p>An organizational unit (OU) is a container inside one domain that GPOs (<b>policy</b>) link to and that ' +
        'administration is delegated on. It is not a security principal: it has no SID and cannot be on an ' +
        '[[access control list]] (ACL). Permissions go to groups. CN=Users and CN=Computers are containers, not OUs: no GPO ' +
        'can be linked to them, so objects there get only site- and domain-linked GPOs.</p>' +
        '<p>Every object has one parent (its distinguished name has one parent). Going to another domain is a migration. A ' +
        'site is physical, subnets and links, and does not follow domains.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
