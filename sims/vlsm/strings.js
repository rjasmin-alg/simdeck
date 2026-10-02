/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of vlsm, in both languages (docs/sim-ui.md §9). Croatian is the original (the URM book's
   fragment vlsm.html and chapter 9); English is written for simdeck. Croatian terms follow the book: podmreža,
   prefiks, blok, poravnanje, adresna shema, mrežna i broadcast adresa, cjelina, rezerva za rast. Terms missing from
   kit/glossary.js (VLSM, subnet, block alignment, addressing plan, network and broadcast address) are written out in
   both tables; the pairs are listed in NOTES.md. Addresses are data, not words: the page puts them in translate="no"
   elements. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Raspodjela prostora 192.168.1.0/24 na šest podmreža',
      sales: 'Prodaja',
      production: 'Proizvodnja',
      management: 'Uprava',
      branch: 'Podružnica',
      guests: 'Gosti',
      link: 'Veza R1–R2',
      scheme: 'Dodjela',
      schemeLargest: 'najveće prvo',
      schemeSmallest: 'najmanje prvo',
      schemeFixed: 'ista maska',
      hostsUnit: ['{count} host', '{count} hosta', '{count} hostova'],
      presetBook: 'Primjer iz knjige',
      presetBookHint: 'Grafo d.o.o., poglavlje 9, Primjer 1: šest cjelina u 192.168.1.0/24',
      presetFixed: 'Primjer 2: ista maska za sve',
      presetFixedHint: 'Koliko adresa troši jedna zajednička maska za svih šest cjelina, naspram VLSM-a?',
      presetSmallest: 'Najmanje prvo',
      presetSmallestHint: 'Isti zahtjevi, obrnut redoslijed: zauzima li se jednako adresa, i gdje ostaje slobodan prostor?',
      presetSales100: 'Prodaja: 100 hostova',
      presetSales100Hint: 'Koji prefiks sada dobiva Prodaja, i mijenja li se redoslijed ostalih pet cjelina?',
      presetFull: 'Prostor se popuni',
      presetFullHint: 'Prodaja i Proizvodnja po 100 hostova: što stane u /24, a što ne?',
      legendHole: 'rupa (zarobljene adrese)',
      legendFree: 'slobodno, rezerva',
      legendNew: 'dodijeljeno u ovom koraku',
      colUnit: 'cjelina',
      colHosts: 'hostova',
      colPrefix: 'prefiks',
      colBlock: 'blok',
      colNet: 'mrežna adresa',
      colBc: 'broadcast adresa',
      colRange: 'za uređaje',
      noFit: 'ne stane',
      hole: 'rupa',
      free: 'rezerva',
      used: 'zauzeto',
      totalLine: 'zauzeto {used} · rupe {holes} · rezerva {reserve} · od 256',
      fixedLine: 'traženo {needed} · na raspolaganju 256 · VLSM bi trošio {vlsm}',
      addrN: ['{count} adresa', '{count} adrese', '{count} adresa'],
      noFitN: ['{count} cjelina ne stane', '{count} cjeline ne stanu', '{count} cjelina ne stane'],
      holeN: ['{count} rupu', '{count} rupe', '{count} rupa'],
      gapN: ['{count} adresa ostaje zarobljena', '{count} adrese ostaju zarobljene', '{count} adresa ostaje zarobljeno'],
      captionNeeds: 'Grafo d.o.o. ima {space}, 256 adresa, i šest cjelina. Svakoj treba vlastita podmreža, dovoljno ' +
        'velika za njezine hostove. Pritisni → za veličinu blokova.',
      captionSizes: 'Svaka cjelina dobiva najmanji blok koji je pokriva, najveći n za koji je 2^(32 − n) − 2 ≥ potrebno: ' +
        '{big} ({bigHosts}) dobiva {bigP}, {bigSize}, a {small} ({smallHosts}) {smallP}, {smallSize}.',
      captionSizesFixed: 'Bez VLSM-a: najveći zahtjev, {big} ({bigHosts}), traži {bigP}, pa svih šest cjelina dobiva ' +
        'istu masku i blok od {bigSize}. Zajedno traže {needed}, a prostor ima 256.',
      captionOrderLargest: 'Redoslijed dodjele: od najvećeg bloka prema najmanjem. Jednako veliki blokovi zadržavaju ' +
        'redoslijed s popisa.',
      captionOrderSmallest: 'Redoslijed dodjele obrnut: od najmanjeg bloka prema najvećem. Zbroj veličina ostaje isti; ' +
        'gledaj gdje počinje svaki blok.',
      captionOrderFixed: 'Svi su blokovi jednako veliki, pa se dodjeljuju redom s popisa.',
      captionPlace: '{name}, {p}, {size}: sljedeći poravnati početak je {at} ({start} je višekratnik {n}). ' +
        'Mrežna adresa {net}, broadcast {bc}.',
      captionPlaceGap: '{name}, {p}, {size}: {from} nije višekratnik {n}, pa blok počinje tek na {at}. ' +
        '{gap} u rupi ispred njega.',
      captionNoFit: '{name}, {p}, {size}: iza zauzetog dijela ostaje {left}, a blok treba {size}. Ne stane u /24.',
      captionSummary: 'Zauzeto {used} od 256, bez ijedne rupe: svaki blok počinje odmah iza prethodnog. ' +
        'Rezerva za rast, u jednom komadu: {reserve}.',
      captionSummaryHoles: 'Zauzeto {used} od 256, ali usred sheme ima {count} s ukupno {holes}, a u komadu na ' +
        'kraju ostaje samo {reserve}.',
      captionSummaryNoFit: 'Prostor je pun: {count}. Treba veći prostor ili manji zahtjevi.',
      captionHolesToo: 'Usred sheme ostaje {holes} u rupama, prekratkima za ijedan od tih blokova.',
      captionSummaryFixedFits: 'Ista maska za sve troši {needed} od 256 i sve stane, ali VLSM za iste zahtjeve troši ' +
        'samo {vlsm}.',
      captionSummaryFixed: 'Ista maska za sve traži {needed}, a /24 ima 256: {count}. VLSM za iste zahtjeve ' +
        'troši samo {vlsm}.',
      explain: '<p><em lang="en">VLSM</em> (<em lang="en">Variable Length Subnet Mask</em>, maska promjenjive duljine) ' +
        'dopušta da svaka podmreža u istom prostoru ima vlastitu duljinu prefiksa, prema vlastitoj potrebi, a ne prema ' +
        'potrebi najveće cjeline. Najmanji blok za n hostova je najveći prefiks za koji je 2<sup>32 − prefiks</sup> − 2 ≥ n ' +
        '(mrežna i broadcast adresa ne dodjeljuju se uređaju).</p>' +
        '<p>Svaki blok mora početi na višekratniku vlastite veličine, jer su mrežnoj adresi svi host bitovi nule. ' +
        '<strong>Zašto najveće prvo.</strong> Kad bi se blokovi dodjeljivali od najmanjeg, svaki bi veći blok morao ' +
        'čekati svoju rjeđu granicu poravnanja, pa bi isti ukupni prostor završio razbijen na rupe umjesto u jednom ' +
        'iskoristivom komadu. Najveće prvo znači da svaki sljedeći, manji blok upada odmah iza prethodnog, bez ' +
        'preskakanja.</p>' +
        '<p>Ono što ostane nakon svih poznatih zahtjeva nije otpad nego rezerva za rast. Vezi između dva usmjernika ' +
        'ovdje pripada /30; s /31 (RFC 3021) ista bi veza trošila dvije adrese umjesto četiri.</p>'
    },
    en: {
      stage: 'How 192.168.1.0/24 is shared out among six subnets',
      sales: 'Sales',
      production: 'Production',
      management: 'Management',
      branch: 'Branch office',
      guests: 'Guests',
      link: 'Link R1–R2',
      scheme: 'Allocation',
      schemeLargest: 'largest first',
      schemeSmallest: 'smallest first',
      schemeFixed: 'one mask',
      hostsUnit: ['{count} host', '{count} hosts'],
      presetBook: 'The book\'s example',
      presetBookHint: 'Grafo Ltd, chapter 9, Example 1: six units in 192.168.1.0/24',
      presetFixed: 'Example 2: one mask for all',
      presetFixedHint: 'How many addresses does one common mask for all six units use, compared with VLSM?',
      presetSmallest: 'Smallest first',
      presetSmallestHint: 'Same needs, reverse order: are as many addresses used, and where is the free space left?',
      presetSales100: 'Sales: 100 hosts',
      presetSales100Hint: 'Which prefix does Sales get now, and does the order of the other five units change?',
      presetFull: 'The space fills up',
      presetFullHint: 'Sales and Production with 100 hosts each: what fits into the /24, and what does not?',
      legendHole: 'hole (stranded addresses)',
      legendFree: 'free, reserve',
      legendNew: 'allocated in this step',
      colUnit: 'unit',
      colHosts: 'hosts',
      colPrefix: 'prefix',
      colBlock: 'block',
      colNet: 'network address',
      colBc: 'broadcast address',
      colRange: 'for hosts',
      noFit: 'does not fit',
      hole: 'hole',
      free: 'reserve',
      used: 'used',
      totalLine: 'used {used} · holes {holes} · reserve {reserve} · of 256',
      fixedLine: 'needed {needed} · available 256 · VLSM would use {vlsm}',
      addrN: ['{count} address', '{count} addresses'],
      noFitN: ['{count} unit does not fit', '{count} units do not fit'],
      holeN: ['{count} hole', '{count} holes'],
      gapN: ['{count} address is stranded', '{count} addresses are stranded'],
      captionNeeds: 'Grafo Ltd has {space}, 256 addresses, and six units. Each needs a subnet of its own, big enough ' +
        'for its hosts. Press → for the block sizes.',
      captionSizes: 'Each unit gets the smallest block that holds it, the largest n with 2^(32 − n) − 2 ≥ needed: ' +
        '{big} ({bigHosts}) gets {bigP}, {bigSize}, and {small} ({smallHosts}) {smallP}, {smallSize}.',
      captionSizesFixed: 'Without VLSM: the largest need, {big} ({bigHosts}), takes {bigP}, so all six units get the ' +
        'same mask and a block of {bigSize}. Together they need {needed}, and the space has 256.',
      captionOrderLargest: 'Allocation order: from the largest block to the smallest. Blocks of equal size keep the ' +
        'order of the list.',
      captionOrderSmallest: 'Allocation order reversed: from the smallest block to the largest. The sizes add up to ' +
        'the same; watch where each block starts.',
      captionOrderFixed: 'Every block is the same size, so they are allocated in the order of the list.',
      captionPlace: '{name}, {p}, {size}: the next aligned start is {at} ({start} is a multiple of {n}). ' +
        'Network address {net}, broadcast {bc}.',
      captionPlaceGap: '{name}, {p}, {size}: {from} is not a multiple of {n}, so the block starts only at {at}. ' +
        '{gap} in a hole in front of it.',
      captionNoFit: '{name}, {p}, {size}: after the used part {left} remain, and the block needs {size}. It does not ' +
        'fit into the /24.',
      captionSummary: '{used} of 256 used, without a single hole: each block starts right after the one before. ' +
        '{reserve} in one piece remain as reserve for growth.',
      captionSummaryHoles: '{used} of 256 used, but the middle of the plan has {count} with {holes} in all, and the ' +
        'piece at the end keeps only {reserve}.',
      captionSummaryNoFit: 'The space is full: {count}. It needs a bigger space or smaller needs.',
      captionHolesToo: 'The middle of the plan keeps {holes} in holes too short for any of those blocks.',
      captionSummaryFixedFits: 'One mask for all uses {needed} of 256 and everything fits, but VLSM uses only {vlsm} ' +
        'for the same needs.',
      captionSummaryFixed: 'One mask for all needs {needed}, and a /24 has 256: {count}. VLSM uses only ' +
        '{vlsm} for the same needs.',
      explain: '<p><em>VLSM</em> (<em>Variable Length Subnet Mask</em>) lets every subnet in the same space have its ' +
        'own prefix length, set by its own need rather than by the largest unit\'s. The smallest block for n hosts ' +
        'is the largest prefix with 2<sup>32 − prefix</sup> − 2 ≥ n (the network and broadcast addresses are not ' +
        'assigned to hosts).</p>' +
        '<p>Every block must start at a multiple of its own size, because a network address has every host bit ' +
        'zero. <strong>Why largest first.</strong> If blocks were allocated from the smallest, every bigger block ' +
        'would have to wait for its rarer alignment boundary, and the same total would end up broken into holes ' +
        'instead of one usable piece. Largest first means each next, smaller block falls right after the one before, ' +
        'with nothing skipped.</p>' +
        '<p>What is left after every known need is not waste but reserve for growth. The link between two routers ' +
        'gets a /30 here; with a /31 (RFC 3021) the same link would use two addresses instead of four.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
