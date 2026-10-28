/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of route-summarisation, in both languages (docs/sim-ui.md §9). Croatian follows the URM book
   (chapters 9 and 11): blok, prefiks, duljina prefiksa, poravnanje, usmjernik, tablica usmjeravanja, zapis, odredišna
   mreža, sljedeći skok, izravno spojeno, najdulji podudarajući prefiks. The book has no word for summarisation:
   "sažimanje puteva" and "sažeti put" are this page's (check), in NOTES.md under "Term pairs". No term here is in
   kit/glossary.js, so they are written out in both tables. Unit names are vlsm's (the same Grafo d.o.o.).
   Addresses, prefixes and router names are data, not words: the page puts them in translate="no" elements. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Adresni prostor s odabranim blokovima, njihov sažetak i tablica usmjeravanja usmjernika R2 prije i nakon sažimanja',
      plan: 'Adresni plan',
      planGrafo: 'Grafo d.o.o.',
      planFour: 'četiri /24',
      planHint: 'Grafo d.o.o. je adresna shema iz poglavlja 9, Primjer 1.',
      toggleLabel: '{name} {net}',
      netToggle: 'mreža {net}',
      block_sales: 'Prodaja',
      block_prod: 'Proizvodnja',
      block_mgmt: 'Uprava',
      block_branch: 'Podružnica',
      block_guest: 'Gosti',
      block_link: 'Veza R1–R2',
      'preset_head-office': 'Mreže iza R1',
      'presetHint_head-office': 'R2 sažima Prodaju, Proizvodnju i Upravu, sve tri iza R1. Koji ih prefiks pokriva, i ' +
        'pokriva li još nešto?',
      preset_exact: 'Bez viška?',
      presetHint_exact: 'Proizvodnja, Uprava i Podružnica. Ostaje li u sažetku ijedna adresa viška?',
      preset_small: 'Gosti i veza',
      presetHint_small: 'Dva najmanja bloka. Koliko adresa viška nosi njihov sažetak?',
      preset_all: 'Svih šest',
      presetHint_all: 'Svih šest cjelina tvrtke. Koliko adresa sažetak pokriva, a da ih nitko ne koristi?',
      preset_four24: 'Četiri /24',
      presetHint_four24: 'Četiri susjedne mreže /24. Što se promijeni kad isključiš 172.16.3.0/24?',
      legendOn: 'odabrani blok',
      legendOff: 'neodabrani blok',
      legendSummary: 'sažetak',
      legendOver: 'višak sažetka',
      legendRisk: 'rizik: blok iza R2',
      legendChanged: 'promijenjeno zadnjim klikom',
      spaceTitle: 'Adresni prostor {space}',
      spaceCount: '{count}',
      noSummary: 'nijedan blok nije odabran',
      sumTag: 'sažetak',
      zoomTitle: 'Sažetak izbliza',
      zoomRange: '{range}, {count}',
      bitsTitle: 'Najniža i najviša adresa, bit po bit',
      bitsLow: 'najniža',
      bitsHigh: 'najviša',
      bitsNet: 'mreža',
      bitsShared: '{n} zajedničkih bitova → prefiks /{len}',
      bitsAligned: 'iza granice same nule: mreža je poravnata',
      kindRisk: 'rizik: iza R2',
      kindR2: 'iza R2',
      kindSafe: 'na R2 pobjeđuje njezin /{len}',
      kindUnused: 'ničije',
      kindSame: 'R1 ga i tako dostiže',
      resExact: 'točno, bez viška',
      resOver: 'višak: {count}',
      resCovered: 'blokovi: {covered} od {size}',
      tblBefore: 'R2 prije',
      tblAfter: 'R2 nakon sažimanja',
      colNet: 'Odredišna mreža',
      colPrefix: 'Prefiks',
      colHop: 'Sljedeći skok',
      hopVia: 'preko {r}',
      hopConnected: 'izravno spojeno',
      tagReplaced: 'sažeto',
      tagSummary: 'sažeti put',
      routesCount: ['{n} zapis', '{n} zapisa', '{n} zapisa'],
      addrN: ['{count} adresa', '{count} adrese', '{count} adresa'],
      and: 'i',
      capNone: 'Nijedan blok nije odabran. Uključi barem jedan u postavkama: sažetak se računa čim postoji blok.',
      capOne: '{block}: jedan blok je sam svoj sažetak, {sum}, bez ijedne adrese viška.',
      capSum: '{list} sažimaju se u {sum}: {routes}',
      capRoutes: ['na R2 {k} zapis preko R1 postaje sažeti put', 'na R2 {k} zapisa preko R1 postaju jedan',
        'na R2 {k} zapisa preko R1 postaje jedan'],
      capNoRoutes: 'nijedan od njih R2 ne zna preko R1, pa R2 nema što zamijeniti',
      capExact: '. Točno: blokovi popunjavaju sažetak do zadnje adrese ({size}).',
      capOver: ', ali sažetak pokriva i {ranges} ({count}).',
      capOverIdle: '. Sažetak bi pokrio i {ranges} ({count}), ali R2 ga ne upisuje.',
      capRisk: ' {names} je iza R2: na R2 pobjeđuje njezin dulji prefiks, ali usmjernik sa samo sažetkom slao bi je ' +
        'prema R1.',
      capSame: ' Mreže koje R1 i tako dostiže ({names}) nisu problem.',
      capUnused: ' Ničijih adresa: {count}; promet za njih ide prema R1 i ondje se odbacuje ili kruži.',
      explain: '<p><em lang="en">Route summarisation</em> (sažimanje puteva) zamjenjuje nekoliko zapisa tablice ' +
        'usmjeravanja jednim, kraćim prefiksom koji ih sve pokriva: <em lang="en">summary route</em> (sažeti put). ' +
        'Tablica je kraća, a usmjernik koji ga dobije zna manje pojedinosti.</p>' +
        '<p><strong>Kako se računa.</strong> Uzmi najnižu adresu prvog bloka i najvišu adresu zadnjeg. Duljina sažetka je ' +
        'broj početnih bitova koji su im jednaki; mreža sažetka je najniža adresa s nulama iza te granice. Takva mreža ' +
        'uvijek je poravnata (<em lang="en">alignment</em> (poravnanje)): višekratnik je vlastite veličine, kao svaki blok ' +
        'u poglavlju 9.</p>' +
        '<p><strong>Što pokriva viška.</strong> Sažetak je blok veličine potencije broja dva. Susjedni blokovi ga ne ' +
        'popune uvijek do kraja, pa pokriva i adrese između njih ili iza njih. Ako je višak ničiji, promet za njega ' +
        'odlazi usmjerniku na koji sažetak pokazuje. Ako pripada mreži iza nekog drugog usmjernika, to je rizik.</p>' +
        '<p><strong>Zašto to na R2 ne smeta.</strong> Sažetak zamjenjuje samo zapise preko R1; izravno spojene ' +
        'mreže ostaju u tablici. R2 i dalje zna svoju Podružnicu, /28, i po pravilu <em lang="en">longest prefix match</em> ' +
        '(najdulji podudarajući prefiks) ona pobjeđuje /25. Usmjernik koji zna samo sažetak nema takav zapis i promet za ' +
        'Podružnicu šalje prema R1 umjesto prema R2.</p>'
    },
    en: {
      stage: 'The address space with the picked blocks, their summary, and router R2\'s routing table before and after summarising',
      plan: 'Address plan',
      planGrafo: 'Grafo Ltd',
      planFour: 'four /24s',
      planHint: 'Grafo Ltd is the addressing plan of chapter 9, Example 1.',
      toggleLabel: '{name} {net}',
      netToggle: 'network {net}',
      block_sales: 'Sales',
      block_prod: 'Production',
      block_mgmt: 'Management',
      block_branch: 'Branch office',
      block_guest: 'Guests',
      block_link: 'Link R1–R2',
      'preset_head-office': 'Networks behind R1',
      'presetHint_head-office': 'R2 summarises Sales, Production and Management, all three behind R1. Which prefix ' +
        'covers them, and does it cover anything else?',
      preset_exact: 'Nothing extra?',
      presetHint_exact: 'Production, Management and the branch office. Is a single extra address left in the summary?',
      preset_small: 'Guests and the link',
      presetHint_small: 'The two smallest blocks. How many extra addresses does their summary carry?',
      preset_all: 'All six',
      presetHint_all: 'All six units of the company. How many addresses does the summary cover that nobody uses?',
      preset_four24: 'Four /24s',
      presetHint_four24: 'Four neighbouring /24 networks. What changes when you switch off 172.16.3.0/24?',
      legendOn: 'picked block',
      legendOff: 'block not picked',
      legendSummary: 'summary',
      legendOver: 'over-covered',
      legendRisk: 'risk: block behind R2',
      legendChanged: 'changed by the last click',
      spaceTitle: 'Address space {space}',
      spaceCount: '{count}',
      noSummary: 'no block picked',
      sumTag: 'summary',
      zoomTitle: 'The summary up close',
      zoomRange: '{range}, {count}',
      bitsTitle: 'Lowest and highest address, bit by bit',
      bitsLow: 'lowest',
      bitsHigh: 'highest',
      bitsNet: 'network',
      bitsShared: '{n} shared bits → prefix /{len}',
      bitsAligned: 'only zeros after the boundary: the network is aligned',
      kindRisk: 'risk: behind R2',
      kindR2: 'behind R2',
      kindSafe: 'on R2 its /{len} wins',
      kindUnused: 'nobody\'s',
      kindSame: 'R1 reaches it anyway',
      resExact: 'exact, nothing extra',
      resOver: 'over-covered: {count}',
      resCovered: 'blocks: {covered} of {size}',
      tblBefore: 'R2 before',
      tblAfter: 'R2 after summarising',
      colNet: 'Destination network',
      colPrefix: 'Prefix',
      colHop: 'Next hop',
      hopVia: 'via {r}',
      hopConnected: 'directly connected',
      tagReplaced: 'summarised',
      tagSummary: 'summary route',
      routesCount: ['{n} route', '{n} routes'],
      addrN: ['{count} address', '{count} addresses'],
      and: 'and',
      capNone: 'No block is picked. Switch at least one on in the settings: the summary appears as soon as there is a block.',
      capOne: '{block}: one block is its own summary, {sum}, without a single extra address.',
      capSum: '{list} summarise to {sum}: {routes}',
      capRoutes: ['on R2, {k} route via R1 becomes the summary route', 'on R2, {k} routes via R1 become one'],
      capNoRoutes: 'R2 reaches none of them via R1, so R2 has nothing to replace',
      capExact: '. Exact: the blocks fill the summary to the last address ({size}).',
      capOver: ', but the summary also covers {ranges} ({count}).',
      capOverIdle: '. The summary would also cover {ranges} ({count}), but R2 does not install it.',
      capRisk: ' {names} is behind R2: on R2 its longer prefix wins, but a router with only the summary would send it ' +
        'to R1.',
      capSame: ' Networks R1 reaches anyway ({names}) are no problem.',
      capUnused: ' Nobody\'s addresses: {count}; their traffic goes to R1 and is dropped or loops there.',
      explain: '<p><em>Route summarisation</em> replaces several routing table entries with one shorter prefix that ' +
        'covers them all: the <em>summary route</em>. The table gets shorter, and a router that receives it knows ' +
        'fewer details.</p>' +
        '<p><strong>How it is computed.</strong> Take the lowest address of the first block and the highest address of ' +
        'the last. The summary\'s length is the number of leading bits they share; its network is the lowest address ' +
        'with zeros after that boundary. Such a network is always aligned (<em>alignment</em>): a multiple of its own ' +
        'size, like every block in chapter 9.</p>' +
        '<p><strong>What it over-covers.</strong> A summary is a block whose size is a power of two. Neighbouring blocks ' +
        'do not always fill it, so it also covers the addresses between or after them. If those are nobody\'s, their ' +
        'traffic goes to the router the summary points to. If they belong to a network behind some other router, that ' +
        'is a risk.</p>' +
        '<p><strong>Why R2 does not mind.</strong> The summary replaces only the routes via R1; directly connected ' +
        'networks stay in the table. R2 still knows its branch office, a /28, and by <em>longest prefix match</em> that ' +
        'beats the /25. A router that only knows the summary has no such entry and sends the branch office\'s traffic to ' +
        'R1 instead of R2.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
