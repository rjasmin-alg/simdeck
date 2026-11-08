/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ipv6-address-types, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, [[term]] a glossary term. Addresses and prefixes come in as data (translate="no").
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Vrste IPv6 adresa i njihov domet',
      addrLabel: 'IPv6 adresa',
      shortLabel: 'RFC 5952:',
      listLabel: 'U primjeru:',
      err_empty: 'polje je prazno.',
      err_prefix: 'upiši adresu bez /duljine prefiksa.',
      err_zone: 'oznaka sučelja (%) ovdje nije potrebna.',
      err_dotted: 'zapis s IPv4 dijelom (točke) ova stranica ne pokriva.',
      err_chars: 'dopuštene su samo heksadekadske znamenke i dvotočke.',
      err_double: '„::“ smije biti samo jednom.',
      err_colon: 'skupina između dvotočaka je prazna.',
      err_long: 'skupina ima više od četiri znamenke.',
      err_count: 'adresa mora imati osam skupina (ili „::“ za nule).',

      thType: 'Vrsta',
      thPrefix: 'Prefiks',
      thReach: 'Domet',
      tableTitle: 'Tablica prefiksa: pobjeđuje najdulji koji se poklapa',
      row_unspecified: 'neodređena',
      row_loopback: 'povratna petlja',
      'row_link-local': 'link-local',
      row_ula: 'jedinstvena lokalna (ULA)',
      row_multicast: 'multicast',
      row_doc: 'dokumentacijska',
      row_doc2: 'dokumentacijska',
      row_gua: 'globalna unicast (GUA)',
      row_other: 'sve ostalo: nije dodijeljeno',
      reachByScope: 'po dosegu',
      markWin: 'najdulji',
      markAlso: 'kraći',
      markNear: 'najbliži',

      type_unspecified: 'neodređena adresa',
      type_loopback: 'adresa povratne petlje',
      'type_link-local': 'link-local adresa',
      type_ula: 'jedinstvena lokalna adresa',
      type_multicast: 'multicast adresa',
      type_doc: 'dokumentacijska adresa',
      type_doc2: 'dokumentacijska adresa',
      type_gua: 'globalna unicast adresa',
      type_other: 'nije dodijeljena za unicast',
      cardPrefix: 'Prefiks:',
      cardNone: 'nijedan',
      cardReach: 'Domet:',
      cardScope: 'Doseg (4. znamenka):',
      cardGroup: 'Skupina:',

      reach_host: 'računalo H',
      reach_link: 'veza L1',
      reach_site: 'lokacija',
      reach_global: 'internet',
      reach_none: 'nigdje',
      reach_admin: 'određuje administrator',

      scope_reserved: 'rezervirano',
      'scope_interface-local': 'sučelje',
      'scope_link-local': 'veza',
      'scope_realm-local': 'područje (realm)',
      'scope_admin-local': 'administrativno',
      'scope_site-local': 'lokacija',
      'scope_organization-local': 'organizacija',
      scope_global: 'globalno',
      'scope_reserved-f': 'rezervirano (F)',
      scope_unassigned: 'nedodijeljeno',

      'grp_all-nodes': 'svi čvorovi',
      'grp_all-routers': 'svi usmjernici',
      'grp_dhcp-servers': 'svi DHCP poslužitelji',
      grp_ntp: 'poslužitelji točnog vremena (NTP)',
      'grp_solicited-node': 'traženi čvor (solicited-node)',

      'note_org-scope': 'Organizacija može imati više lokacija; na ovoj slici ima jednu.',
      'note_scope-f': 'Doseg F je rezerviran; takav se paket tretira kao globalni.',
      'note_scope-0': 'Doseg 0 je rezerviran: takav se paket ne šalje, a primljen se odbacuje.',
      'note_scope-admin': 'Za ovaj doseg granicu područja postavlja administrator; slika je ne može pokazati.',
      'note_ula-l1': 'Bit L (8. bit) = 1: lokalno dodijeljen prefiks fd00::/8, onaj koji se koristi.',
      'note_ula-l0': 'Bit L (8. bit) = 0: polovica fc00::/8 je u fc00::/7, ali njezina dodjela nije definirana.',
      'note_doc-in-gua': 'Leži i u 2000::/3, ali dulji prefiks pobjeđuje. Samo za primjere: nijedno stvarno računalo je nema.',
      'note_gua-bits': 'Prva znamenka {d} = {b}: prva tri bita su 001, kao u 2000::/3.',
      'note_never-destination': 'Nikad nije odredište; računalo je stavlja kao izvor samo dok još nema adresu.',
      'note_site-local-deprecated': 'fec0::/10 bio je stari „site-local“ raspon, napušten 2004.; danas je za to ULA.',
      note_nearest: 'Najbliži je {p}: prvih {same} od {len} bitova isto, bit {diff} se razlikuje.',

      siteTitle: 'Lokacija (site)',
      l1Title: 'Veza L1',
      l2Title: 'Veza L2',
      netTitle: 'Internet',
      role_H: 'izvor',
      role_N: 'susjed',
      role_R1: 'usmjernik',
      role_H2: 'računalo',
      role_R2: 'granica lokacije',
      role_S: 'poslužitelj',
      gets: 'stiže',
      getsNot: 'ne stiže',
      stop_host: 'ne izlazi iz H',
      stop_link: 'R1 ne prosljeđuje',
      stop_site: 'R2 filtrira',
      stop_none: 'ne šalje se',
      stop_unrouted: 'R1 je odbacuje',
      adminMark: 'granicu postavlja administrator',

      stripTitle: 'Bitovi adrese',
      stripAddr: 'adresa',
      stripRef: 'prefiks',
      stripPrefix: 'prefiks {p}',
      stripNear: 'najbliži {p}',
      stripSame: '{same} od {len} bitova isto',
      stripGap: 'bitovi {a}–{b}',
      stripGapZero: 'bitovi {a}–{b}: sve nule',
      stripScope: 'doseg',
      stripL: 'L',
      stripFlags: 'zastavice',
      stripBit: 'bit {i}',

      showBits: 'Bitovi adrese',
      showBitsHint: 'Traka 128 bitova: koji su se bitovi uspoređivali s prefiksom.',

      preset_four: 'Četiri adrese',
      hint_four: 'Knjiga, pogl. 10, Primjer 2: koje je vrste svaka?',
      'preset_two-on-one': 'Dvije adrese, jedno sučelje',
      'hint_two-on-one': 'Kojom H razgovara sa susjedom N, a kojom s poslužiteljem S?',
      'preset_bits-not-digits': 'Bitovi, ne znamenke',
      'hint_bits-not-digits': 'Je li 3ffe::1 u 2000::/3? A 4000::1?',
      'preset_multicast-scopes': 'Dosezi multicasta',
      'hint_multicast-scopes': 'Četvrta znamenka određuje koliko daleko skupina seže.',
      preset_special: 'Posebne adrese',
      hint_special: '::1 i ::',

      legGua: 'globalna unicast',
      legUla: 'jedinstvena lokalna',
      legLl: 'link-local',
      legMc: 'multicast',
      legSpecial: 'posebna / nikamo',
      legChanged: 'podudarni bitovi i redak',
      legStop: 'paket staje',

      cap_doc: '{addr} leži u 2000::/3, ali dulji prefiks {prefix} pobjeđuje: dokumentacijska adresa, samo za primjere i knjige. Nijedno računalo je nema, a usmjernici je ne usmjeravaju: H paket šalje, ali ga R1 odbacuje.',
      cap_doc2: '{addr} leži u 2000::/3, ali dulji prefiks {prefix} pobjeđuje: dokumentacijska adresa, samo za primjere i knjige. Nijedno računalo je nema, a usmjernici je ne usmjeravaju: H paket šalje, ali ga R1 odbacuje.',
      cap_gua: '{addr} počinje bitovima 001, unutar {prefix}: globalna unicast adresa. Usmjernici paket prema njoj prosljeđuju i preko R2, na internet, sve do poslužitelja S.',
      'cap_link-local': '{addr} počinje s {prefix}: link-local adresa. Vrijedi samo na vezi L1; usmjernik R1 takav paket ne prosljeđuje.',
      cap_ula: '{addr} leži u {prefix}: jedinstvena lokalna adresa. R1 paket prema njoj usmjerava unutar lokacije, a R2 ga na granici lokacije filtrira.',
      cap_multicast: '{addr} leži u {prefix}: multicast adresa, za skupinu sučelja. Doseg {n} ({scope}): {rest}',
      mc_host: 'paket ne izlazi iz H.',
      mc_link: 'ostaje na vezi L1; R1 ga ne prosljeđuje.',
      mc_site: 'usmjernici ga prosljeđuju unutar lokacije; R2 ga na granici zaustavlja.',
      mc_global: 'smije preko interneta.',
      mc_none: 'takav se paket odbacuje.',
      mc_admin: 'koliko daleko ide, određuje administrator.',
      cap_loopback: '{addr} je adresa povratne petlje: H razgovara sam sa sobom. Paket nikad ne napušta H.',
      cap_unspecified: '{addr} je neodređena adresa: nikakva adresa. Nikad nije odredište; H je koristi samo kao izvor, dok još nema adresu.',
      cap_other: '{addr} se ne poklapa ni s jednim prefiksom: nije dodijeljena za unicast i nitko je ne usmjerava, pa R1 paket odbacuje. Najbliži je {prefix}, ali bit {diff} se razlikuje.',
      cap_error: '„{text}“ nije IPv6 adresa: {why} Vrsta ostaje ona za {addr}.',

      explain: '<p>Vrstu IPv6 adrese nosi njezin početak, a odlučuje <b>najdulji prefiks koji se poklapa</b>: ' +
        '<code>2001:db8:85a3::8a2e:370:7334</code> leži u <code>2000::/3</code>, ali i u duljem <code>2001:db8::/32</code>, ' +
        'rasponu rezerviranom za dokumentaciju (RFC 3849; od 2024. i <code>3fff::/20</code>). Takvu adresu usmjernici ne usmjeravaju.</p>' +
        '<p>Broj iza kose crte broji <b>bitove, ne znamenke</b>: <code>/3</code> su prva tri bita, <code>001</code>. ' +
        'Znamenka <code>3</code> je <code>0011</code>, pa je <code>3ffe::1</code> unutra; <code>4</code> je <code>0100</code>, ' +
        'pa <code>4000::1</code> nije.</p>' +
        '<p><b>Domet</b>: [[loopback]] <code>::1</code> ne izlazi iz računala; link-local adresa (<code>fe80::/10</code>) ostaje na ' +
        'svojoj vezi, usmjernik je ne prosljeđuje; jedinstvena lokalna adresa (<code>fc00::/7</code>) usmjerava se unutar ' +
        'lokacije i filtrira na njezinoj granici; globalna unicast adresa ide na internet. Neodređena adresa <code>::</code> ' +
        'nikad nije odredište. Multicastu (<code>ff00::/8</code>) domet određuje <b>doseg</b> (scope), četvrta znamenka: ' +
        '1 sučelje, 2 veza, 5 lokacija, 8 organizacija, e globalno.</p>' +
        '<p>Česte zablude: „<code>/3</code> su tri znamenke“ (ne, tri bita); „ULA se prevodi NAT-om kao privatne IPv4 adrese“ ' +
        '(ne, samo se ne usmjerava izvan lokacije); „računalo ima jednu IPv6 adresu“ (jedno sučelje ima barem link-local i ' +
        'obično još globalnu, a bira prema sugovorniku). <i>Anycast</i> nema svoj prefiks, pa ga ova tablica ne prepoznaje.</p>' +
        '<p>Adresu upiši u polje iznad tablice; Enter izlazi iz polja, pa tipke opet služe prezentaciji. Neispravan zapis ostavlja zadnju ispravnu adresu.</p>'
    },
    en: {
      stage: 'IPv6 address types and their reach',
      addrLabel: 'IPv6 address',
      shortLabel: 'RFC 5952:',
      listLabel: 'In this example:',
      err_empty: 'the field is empty.',
      err_prefix: 'type the address without a /prefix length.',
      err_zone: 'a zone index (%) is not needed here.',
      err_dotted: 'this page does not cover the form with an IPv4 part (dots).',
      err_chars: 'only hex digits and colons are allowed.',
      err_double: '"::" may appear only once.',
      err_colon: 'a group between two colons is empty.',
      err_long: 'a group has more than four digits.',
      err_count: 'an address has eight groups (or "::" for zeros).',

      thType: 'Type',
      thPrefix: 'Prefix',
      thReach: 'Reach',
      tableTitle: 'Prefix table: the longest match wins',
      row_unspecified: 'unspecified',
      row_loopback: 'loopback',
      'row_link-local': 'link-local',
      row_ula: 'unique local (ULA)',
      row_multicast: 'multicast',
      row_doc: 'documentation',
      row_doc2: 'documentation',
      row_gua: 'global unicast (GUA)',
      row_other: 'everything else: not assigned',
      reachByScope: 'by scope',
      markWin: 'longest',
      markAlso: 'shorter',
      markNear: 'nearest',

      type_unspecified: 'unspecified address',
      type_loopback: 'loopback address',
      'type_link-local': 'link-local address',
      type_ula: 'unique local address',
      type_multicast: 'multicast address',
      type_doc: 'documentation address',
      type_doc2: 'documentation address',
      type_gua: 'global unicast address',
      type_other: 'not assigned for unicast',
      cardPrefix: 'Prefix:',
      cardNone: 'none',
      cardReach: 'Reach:',
      cardScope: 'Scope (4th digit):',
      cardGroup: 'Group:',

      reach_host: 'host H',
      reach_link: 'link L1',
      reach_site: 'the site',
      reach_global: 'the internet',
      reach_none: 'nowhere',
      reach_admin: 'set by the administrator',

      scope_reserved: 'reserved',
      'scope_interface-local': 'interface',
      'scope_link-local': 'link',
      'scope_realm-local': 'realm',
      'scope_admin-local': 'admin',
      'scope_site-local': 'site',
      'scope_organization-local': 'organisation',
      scope_global: 'global',
      'scope_reserved-f': 'reserved (F)',
      scope_unassigned: 'unassigned',

      'grp_all-nodes': 'all nodes',
      'grp_all-routers': 'all routers',
      'grp_dhcp-servers': 'all DHCP servers',
      grp_ntp: 'time servers (NTP)',
      'grp_solicited-node': 'solicited node',

      'note_org-scope': 'An organisation may have several sites; this picture has one.',
      'note_scope-f': 'Scope F is reserved; such a packet is treated as global.',
      'note_scope-0': 'Scope 0 is reserved: such a packet is not sent, and dropped when received.',
      'note_scope-admin': 'For this scope the administrator sets the region\'s border; the picture cannot show it.',
      'note_ula-l1': 'L bit (8th bit) = 1: the locally assigned prefix fd00::/8, the half in use.',
      'note_ula-l0': 'L bit (8th bit) = 0: the fc00::/8 half is inside fc00::/7, but its assignment is not defined.',
      'note_doc-in-gua': 'It is inside 2000::/3 too, but the longer prefix wins. For examples only: no real host has it.',
      'note_gua-bits': 'First digit {d} = {b}: the first three bits are 001, as in 2000::/3.',
      'note_never-destination': 'Never a destination; a host puts it as the source only while it has no address yet.',
      'note_site-local-deprecated': 'fec0::/10 was the old "site-local" range, deprecated in 2004; ULA does that job now.',
      note_nearest: 'Nearest is {p}: the first {same} of {len} bits agree, bit {diff} differs.',

      siteTitle: 'Site',
      l1Title: 'Link L1',
      l2Title: 'Link L2',
      netTitle: 'Internet',
      role_H: 'source',
      role_N: 'neighbour',
      role_R1: 'router',
      role_H2: 'host',
      role_R2: 'site border',
      role_S: 'server',
      gets: 'gets it',
      getsNot: 'does not',
      stop_host: 'never leaves H',
      stop_link: 'R1 does not forward',
      stop_site: 'R2 filters',
      stop_none: 'not sent',
      stop_unrouted: 'R1 drops it',
      adminMark: 'border set by the administrator',

      stripTitle: 'Address bits',
      stripAddr: 'address',
      stripRef: 'prefix',
      stripPrefix: 'prefix {p}',
      stripNear: 'nearest {p}',
      stripSame: '{same} of {len} bits agree',
      stripGap: 'bits {a}–{b}',
      stripGapZero: 'bits {a}–{b}: all zero',
      stripScope: 'scope',
      stripL: 'L',
      stripFlags: 'flags',
      stripBit: 'bit {i}',

      showBits: 'Address bits',
      showBitsHint: 'The 128-bit strip: which bits were compared with the prefix.',

      preset_four: 'Four addresses',
      hint_four: 'Book ch. 10, Example 2: which type is each?',
      'preset_two-on-one': 'Two addresses, one interface',
      'hint_two-on-one': 'Which one does H use with neighbour N, which with server S?',
      'preset_bits-not-digits': 'Bits, not digits',
      'hint_bits-not-digits': 'Is 3ffe::1 in 2000::/3? And 4000::1?',
      'preset_multicast-scopes': 'Multicast scopes',
      'hint_multicast-scopes': 'The fourth digit sets how far the group reaches.',
      preset_special: 'Special addresses',
      hint_special: '::1 and ::',

      legGua: 'global unicast',
      legUla: 'unique local',
      legLl: 'link-local',
      legMc: 'multicast',
      legSpecial: 'special / nowhere',
      legChanged: 'matching bits and row',
      legStop: 'packet stops',

      cap_doc: '{addr} is inside 2000::/3, but the longer prefix {prefix} wins: a documentation address, for examples and books only. No host has it and routers do not route it: H sends the packet, but R1 drops it.',
      cap_doc2: '{addr} is inside 2000::/3, but the longer prefix {prefix} wins: a documentation address, for examples and books only. No host has it and routers do not route it: H sends the packet, but R1 drops it.',
      cap_gua: '{addr} starts with the bits 001, inside {prefix}: a global unicast address. Routers forward a packet to it past R2 into the internet, as far as server S.',
      'cap_link-local': '{addr} starts with {prefix}: a link-local address. It is valid only on link L1; router R1 does not forward it.',
      cap_ula: '{addr} is inside {prefix}: a unique local address. R1 routes a packet to it inside the site; R2, at the site border, filters it.',
      cap_multicast: '{addr} is inside {prefix}: a multicast address, for a group of interfaces. Scope {n} ({scope}): {rest}',
      mc_host: 'the packet does not leave H.',
      mc_link: 'it stays on link L1; R1 does not forward it.',
      mc_site: 'routers forward it inside the site; R2 stops it at the border.',
      mc_global: 'it may cross the internet.',
      mc_none: 'such a packet is dropped.',
      mc_admin: 'how far it goes is up to the administrator.',
      cap_loopback: '{addr} is the loopback address: H talks to itself. The packet never leaves H.',
      cap_unspecified: '{addr} is the unspecified address: no address at all. It is never a destination; H uses it only as a source, before it has an address.',
      cap_other: '{addr} matches none of the prefixes: it is not assigned for unicast and nobody routes it, so R1 drops the packet. Nearest is {prefix}, but bit {diff} differs.',
      cap_error: '"{text}" is not an IPv6 address: {why} The type stays that of {addr}.',

      explain: '<p>The start of an IPv6 address carries its type, and the <b>longest matching prefix</b> decides: ' +
        '<code>2001:db8:85a3::8a2e:370:7334</code> is inside <code>2000::/3</code>, but also inside the longer ' +
        '<code>2001:db8::/32</code>, the range reserved for documentation (RFC 3849; since 2024 also <code>3fff::/20</code>). ' +
        'Routers do not route such an address.</p>' +
        '<p>The number after the slash counts <b>bits, not digits</b>: <code>/3</code> is the first three bits, <code>001</code>. ' +
        'The digit <code>3</code> is <code>0011</code>, so <code>3ffe::1</code> is inside; <code>4</code> is <code>0100</code>, ' +
        'so <code>4000::1</code> is not.</p>' +
        '<p><b>Reach</b>: [[loopback]] <code>::1</code> never leaves the host; a link-local address (<code>fe80::/10</code>) stays ' +
        'on its link, a router does not forward it; a unique local address (<code>fc00::/7</code>) is routed inside the site ' +
        'and filtered at its border; a global unicast address goes to the internet. The unspecified address <code>::</code> ' +
        'is never a destination. For multicast (<code>ff00::/8</code>) the reach is the <b>scope</b>, the fourth digit: ' +
        '1 interface, 2 link, 5 site, 8 organisation, e global.</p>' +
        '<p>Common mistakes: "<code>/3</code> is three digits" (no, three bits); "ULA is NAT\'d like private IPv4 addresses" ' +
        '(no, it is just not routed beyond the site); "a host has one IPv6 address" (one interface has at least a link-local ' +
        'and usually a global one too, and picks by whom it talks to). <i>Anycast</i> has no prefix of its own, so this ' +
        'table cannot recognise it.</p>' +
        '<p>Type an address in the field above the table; Enter gives the keys back to the clicker. Text that is not an address leaves the last valid one in place.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
