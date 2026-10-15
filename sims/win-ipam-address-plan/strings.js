/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-ipam-address-plan, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). Addresses, prefixes, the
   two-site range names (ZG-10) and Zagreb/Split are data: the page puts them in translate="no" elements.
   The terms of this sim are not in kit/glossary.js yet (NOTES.md, "Term pairs"), so the Croatian text writes the
   pairs out: the English term in italics, the Croatian in parentheses, at first mention. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Adresna shema',
      hidden: 'stanje pozornice',

      block: 'Adresni blok',
      growth: 'Prostor za rast',
      setTwo: 'Dvije lokacije: Zagreb i Split',
      nabava: 'Nabava, 4 hosta',
      nabavaOff: 'bez nje',
      nabavaAdd: 'dodaj kasnije',
      nabavaPlan: 'novi plan',
      nabavaOnlyGrafo: 'Nabava je odjel tvrtke Grafo.',
      strategy: 'Redoslijed dodjele',
      stLargest: 'najveći prvi',
      stListed: 'redom s popisa',

      presetGrafo: 'Grafo d.o.o.',
      presetGrafoHint: 'Šest cjelina u 192.168.1.0/24, najveći prvi',
      presetNabava: 'Dodaj Nabavu',
      presetNabavaHint: 'Novi odjel uz shemu koja je već u upotrebi',
      presetDouble: 'Rast 100 %',
      presetDoubleHint: 'Isti odjeli, dvostruko više hostova: ne stane',
      presetListed: 'Redom s popisa',
      presetListedHint: 'Gosti prvi: poravnanje ostavlja rupu',
      presetTwo: 'Dvije lokacije: Zagreb i Split',
      presetTwoHint: 'Zagreb i Split u 10.20.0.0/16',

      legRange: 'raspon (ime i prefiks)',
      legFree: 'slobodno, rezerva',
      legGap: 'rupa zbog poravnanja',
      legNoFit: 'ne stane',
      legChanged: 'promijenjeno zadnjom postavkom',

      n_sales: 'Prodaja',
      n_production: 'Proizvodnja',
      n_management: 'Uprava',
      n_branch: 'Podružnica',
      n_guests: 'Gosti',
      n_link: 'Veza R1–R2',
      n_purchasing: 'Nabava',
      s_hq: 'Sjedište',
      s_branch: 'Podružnica',
      s_wan: 'između lokacija',
      vlan: 'VLAN {v}',
      vlanOpen: 'VLAN ?',

      barTitle: 'Blok',
      windowNote: 'Prikazano je prvih {n} adresa ({net}) od {total}.',
      wholeBlock: 'cijeli blok',
      toTop: 'Na vrh popisa (ponovno: vrati): {name}',

      ipamTitle: 'IPAM: blok, rasponi, adrese',
      thTop: 'na vrh popisa',
      thRange: 'Raspon',
      thSite: 'Lokacija / VLAN',
      thNetwork: 'Mreža',
      thMask: 'Maska',
      thTotal: 'Ukupno',
      thUsable: 'Iskoristivo',
      thManaged: 'Upravlja',
      thUtil: 'Iskorišteno',
      blockKind: 'blok · privatni (RFC 1918)',
      blockUsed: 'zauzeto {used}, slobodno {free}',
      m_dhcp: 'DHCP (opseg)',
      m_ipam: 'IPAM (statički)',
      full: 'puno',
      notPlaced: 'nema mjesta',
      aNet: 'mreža',
      aFirst: 'prva',
      aLast: 'zadnja',
      aBcast: 'broadcast',
      addrTitle: 'adrese u rasponu {name}:',

      thHosts: 'Hostova',
      thNeeded: 'Uz rast',
      sumRow: 'Zbroj raspona: {sum} od {space}',

      capLargest: 'Najveći prvi, svaki raspon poravnat na vlastitu veličinu: ',
      capListed: 'Redom s popisa: ',
      capFrom: '{name} {prefix} od {at}',
      capMore: ' … ',
      capGap: ['{name} {prefix} mora čekati poravnanje i počinje tek na {at}: ispred tog raspona ostaje rupa od {n} adrese.', '{name} {prefix} mora čekati poravnanje i počinje tek na {at}: ispred tog raspona ostaje rupa od {n} adrese.', '{name} {prefix} mora čekati poravnanje i počinje tek na {at}: ispred tog raspona ostaje rupa od {n} adresa.'],
      capFree: ['Slobodna ostaje {n} adresa, od {from} do {to}.', 'Slobodne ostaju {n} adrese, od {from} do {to}.', 'Slobodno ostaje {n} adresa, od {from} do {to}.'],
      capFreeMany: 'Ukupno je slobodno {n}; najveći slobodni dio ({big}) je od {from} do {to}.',
      capFreeNone: 'Slobodnog prostora nema.',
      capAdd: ['{name} traži {prefix}, a {cursor} nije višekratnik od {size} — raspon počinje na {at} i ostavlja rupu od {n} adrese.', '{name} traži {prefix}, a {cursor} nije višekratnik od {size} — raspon počinje na {at} i ostavlja rupu od {n} adrese.', '{name} traži {prefix}, a {cursor} nije višekratnik od {size} — raspon počinje na {at} i ostavlja rupu od {n} adresa.'],
      capAddAligned: '{name} traži {prefix} i počinje odmah na {at}, višekratniku od {size}.',
      capAddReuse: '{name} traži {prefix} i stane u prvu poravnatu rupu, {at}–{end}; rasponi u upotrebi ostaju gdje jesu.',
      capNoFitSum: 'Ne stane: rasponi zajedno traže {sum}, a blok ima {space} adresa. Prvi koji ne stane: {name} {prefix}. Novi plan: veći blok ili manje rasta.',
      capNoFitSumNoGrowth: 'Ne stane: rasponi zajedno traže {sum}, a blok ima {space} adresa. Prvi koji ne stane: {name} {prefix}. Novi plan: veći blok.',
      capNoFitAlign: 'Ne stane zbog poravnanja: rasponi zajedno traže {sum} od {space}, ali {name} {prefix} nema poravnato mjesto.',
      capTryLargest: 'Pokušaj „najveći prvi”.',

      explain:
        '<p><em lang="en">IP address block</em> (adresni blok) velik je komad adresnog prostora, ovdje privatni blok iz ' +
        'RFC-a 1918. Blok se ne dodjeljuje mreži, nego sadrži <em lang="en">IP address range</em> (raspone adresa): svaki ' +
        'raspon pripada jednom bloku, rasponi istog bloka se ne preklapaju, a raspon obično odgovara jednom DHCP opsegu. ' +
        'Adrese pripadaju rasponu. IPAM tu hijerarhiju bilježi; adrese dijeli DHCP poslužitelj ili ih postavlja administrator.</p>' +
        '<p>Postupak je VLSM iz adresne sheme: svakoj cjelini najmanji raspon (podmreža) s 2<sup>32−n</sup> − 2 ≥ potrebno, najveći prvi, ' +
        'svaki poravnat na vlastitu veličinu. Tada ne nastaju rupe. Redom s popisa veći raspon čeka svoju granicu poravnanja ' +
        'i ispred sebe ostavlja rupu.</p>' +
        '<p><em lang="en">Room for growth</em> (prostor za rast): shema samo za današnje hostove puni se prvog dana; Gosti /29 ' +
        'nemaju nijednu adresu viška. Rast povećava svaki raspon za klijente (veza ima uvijek dva kraja) i shema više ne stane u blok. Tada se radi novi plan: ' +
        'veći blok, ili novi raspon u slobodni prostor bez pomicanja raspona koji su u upotrebi.</p>'
    },
    en: {
      stage: 'Address plan',
      hidden: 'stage state',

      block: 'Address block',
      growth: 'Room for growth',
      setTwo: 'Two sites: Zagreb and Split',
      nabava: 'Purchasing, 4 hosts',
      nabavaOff: 'none',
      nabavaAdd: 'add later',
      nabavaPlan: 're-plan',
      nabavaOnlyGrafo: 'Purchasing is a department of Grafo.',
      strategy: 'Allocation order',
      stLargest: 'largest first',
      stListed: 'as listed',

      presetGrafo: 'Grafo Ltd',
      presetGrafoHint: 'Six units in 192.168.1.0/24, largest first',
      presetNabava: 'Add Purchasing',
      presetNabavaHint: 'A new department next to a plan already in use',
      presetDouble: 'Growth 100 %',
      presetDoubleHint: 'The same departments, twice the hosts: does not fit',
      presetListed: 'As listed',
      presetListedHint: 'Guests first: alignment leaves a hole',
      presetTwo: 'Two sites: Zagreb and Split',
      presetTwoHint: 'Zagreb and Split in 10.20.0.0/16',

      legRange: 'range (name and prefix)',
      legFree: 'free, reserve',
      legGap: 'alignment gap',
      legNoFit: 'does not fit',
      legChanged: 'changed by the last setting',

      n_sales: 'Sales',
      n_production: 'Production',
      n_management: 'Management',
      n_branch: 'Branch',
      n_guests: 'Guests',
      n_link: 'Link R1–R2',
      n_purchasing: 'Purchasing',
      s_hq: 'Head office',
      s_branch: 'Branch',
      s_wan: 'between sites',
      vlan: 'VLAN {v}',
      vlanOpen: 'VLAN ?',

      barTitle: 'Block',
      windowNote: 'Showing the first {n} addresses ({net}) of {total}.',
      wholeBlock: 'whole block',
      toTop: 'To the top of the list (again: undo): {name}',

      ipamTitle: 'IPAM: block, ranges, addresses',
      thTop: 'to the top of the list',
      thRange: 'Range',
      thSite: 'Site / VLAN',
      thNetwork: 'Network',
      thMask: 'Mask',
      thTotal: 'Total',
      thUsable: 'Usable',
      thManaged: 'Managed by',
      thUtil: 'Utilised',
      blockKind: 'block · private (RFC 1918)',
      blockUsed: 'used {used}, free {free}',
      m_dhcp: 'DHCP (scope)',
      m_ipam: 'IPAM (static)',
      full: 'full',
      notPlaced: 'no room',
      aNet: 'network',
      aFirst: 'first',
      aLast: 'last',
      aBcast: 'broadcast',
      addrTitle: 'addresses in the range {name}:',

      thHosts: 'Hosts',
      thNeeded: 'With growth',
      sumRow: 'Ranges add up to {sum} of {space}',

      capLargest: 'Largest first, each range aligned on its own size: ',
      capListed: 'In list order: ',
      capFrom: '{name} {prefix} from {at}',
      capMore: ' … ',
      capGap: ['{name} {prefix} has to wait for its alignment and only starts at {at}: a hole of {n} address stays in front of that range.', '{name} {prefix} has to wait for its alignment and only starts at {at}: a hole of {n} addresses stays in front of that range.'],
      capFree: ['{n} address stays free, {from} to {to}.', '{n} addresses stay free, {from} to {to}.'],
      capFreeMany: '{n} free in all; the largest free piece ({big}) runs from {from} to {to}.',
      capFreeNone: 'No free space is left.',
      capAdd: ['{name} needs a {prefix}, and {cursor} isn\'t a multiple of {size}, so the range starts at {at} and leaves a {n}-address gap.', '{name} needs a {prefix}, and {cursor} isn\'t a multiple of {size}, so the range starts at {at} and leaves a {n}-address gap.'],
      capAddAligned: '{name} needs a {prefix} and starts right at {at}, a multiple of {size}.',
      capAddReuse: '{name} needs a {prefix} and fits in the first aligned gap, {at}–{end}; the ranges in use stay where they are.',
      capNoFitSum: 'Does not fit: the ranges together need {sum}, and the block has {space} addresses. First that cannot be placed: {name} {prefix}. Re-plan: a larger block or less growth.',
      capNoFitSumNoGrowth: 'Does not fit: the ranges together need {sum}, and the block has {space} addresses. First that cannot be placed: {name} {prefix}. Re-plan: a larger block.',
      capNoFitAlign: 'Does not fit because of alignment: the ranges together need {sum} of {space}, but {name} {prefix} has no aligned place left.',
      capTryLargest: 'Try “largest first”.',

      explain:
        '<p>An <em>IP address block</em> is a large chunk of address space, here a private block from RFC 1918. A block is ' +
        'not handed to a network; it holds <em>IP address ranges</em>: each range maps to one block, ranges of the same ' +
        'block never overlap, and a range usually corresponds to one DHCP scope. Addresses map to a range. IPAM records ' +
        'this hierarchy; a DHCP server or an administrator hands the addresses out.</p>' +
        '<p>The method is the VLSM of an address plan: each unit gets the smallest range (subnet) with 2<sup>32−n</sup> − 2 ≥ needed, ' +
        'largest first, each aligned on its own size. No holes appear then. In list order a larger range waits for its ' +
        'alignment boundary and leaves a hole in front of it.</p>' +
        '<p><em>Room for growth</em>: a plan made only for today\'s hosts is full on day one; Guests /29 have no spare ' +
        'address. Growth makes every client range larger (a link always has two ends), and the plan stops fitting the block. Then you re-plan: a larger ' +
        'block, or a new range in free space without moving the ranges in use.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
