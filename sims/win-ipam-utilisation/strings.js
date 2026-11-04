/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-ipam-utilisation, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), *word* an English term on
   the Croatian page (the page sets it in italics, lang="en"), [[term]] a glossary term.
   Addresses, server names, counts and percentages are data, written by the page with translate="no".
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'IPAM: iskorištenost bloka i raspona kroz semestar',

      week: 'Tjedan semestra',
      lease: 'Trajanje dodjele (studenti)',
      lease1: '1 dan',
      lease8: '8 dana',
      growth: 'Novi stalni uređaji (studenti)',
      growthUnit: '/ tjedan',
      visitors: 'Posjetitelji (studenti)',
      visitorsUnit: '/ dan',
      over: 'Prag prepunjenosti',
      under: 'Prag nedovoljne iskorištenosti',
      hidden: 'Odabrano',

      presetByod: 'Dodjela 8 dana',
      presetByodHint: 'Tjedan 1: 170 od 200, prepunjen; pun u tjednu 4',
      presetShort: 'Dodjela 1 dan',
      presetShortHint: 'Isti uređaji: prag 80 % tek u tjednu 11, pun u tjednu 15',
      presetHotspot: 'Blok 9\u00a0%, raspon pun',
      presetHotspotHint: 'Zbroj skriva vruće mjesto',
      presetServers: 'Poslužitelji 2,4\u00a0%',
      presetServersHint: 'Nedovoljno iskorišten nije kvar',
      presetT70: 'Prag 70\u00a0%',
      presetT70Hint: 'Dodjela 1 dan: upozorenje u tjednu 9 umjesto 11',

      n_staff: 'Djelatnici',
      n_labs: 'Laboratoriji',
      n_phones: 'IP telefoni',
      n_students: 'Studenti (Wi-Fi)',
      n_servers: 'Poslužitelji',

      st_under: 'Nedovoljno',
      st_optimal: 'Optimalno',
      st_over: 'Prepunjen',
      full: 'pun',
      refused: 'bez adrese',

      blockKind: 'blok',
      blockOf: 'od',
      blockAddr: 'adresa zauzeto',
      failoverOnce: 'opseg u *failover* (preuzimanje u slučaju kvara) paru brojan jednom; zbroj izvještaja oba poslužitelja bio bi',
      collected: 'Prikupljeno: tjedan {w}, ponedjeljak {h} · svaka {i} h',
      failover: '*failover*',

      ipamTitle: 'Rasponi u bloku',
      thRange: 'Raspon',
      thServer: 'Poslužitelj',
      thSize: 'Veličina',
      thUsed: 'Zauzeto',
      thUtil: 'Iskorištenost',
      thStatus: 'Status',
      thTrend: 'Trend',

      detUsed: 'Od čega je zauzeto:',
      c_residents: 'stalni uređaji',
      c_inuse: 'u uporabi',
      c_today: 'dodjele posjetitelja danas',
      c_gone: 'dodjele uređaja kojih više nema',
      c_reserved: 'rezervacije',
      c_free: 'slobodno',
      c_refused: 'uređaja bez adrese',
      c_ranges: 'zauzeto u rasponima',
      c_rfree: 'slobodno u rasponima',
      c_outside: 'izvan svih raspona',
      trendTitle: 'Iskorištenost kroz semestar',
      weekAxis: 'tjedan',
      projection: 'dalje, ako se ništa ne promijeni',

      legBar: 'iskorištenost s pragovima',
      legUnder: 'nedovoljno iskorišten',
      legOptimal: 'optimalno',
      legOver: 'prepunjen',
      legFull: 'pun: novi uređaj ne dobiva adresu',
      legChanged: 'status promijenjen',

      capWeek: 'Tjedan {w}: studentski raspon ima {used} od {size} adresa zauzeto ({pct}): stalni uređaji {res}, dodjele posjetitelja {vis} ({v} dnevno × {l}).',
      capWeekNoVis: 'Tjedan {w}: studentski raspon ima {used} od {size} adresa zauzeto ({pct}): stalni uređaji {res}, posjetitelja nema.',
      capTie: 'Točno {over}: IPAM ga označava kao prepunjen tek iznad praga.',
      capTieUnder: 'Točno {under}: IPAM ga označava kao nedovoljno iskorišten tek ispod praga.',
      capUnderSt: 'Ispod praga {under}: IPAM ga označava kao nedovoljno iskorišten.',
      capAheadSame: 'Prag {over} prelazi u tjednu {fo}, u istom tjednu kad se i napuni.',
      capStartOver: 'Tjedan {w}: studentski raspon već na početku semestra ima {used} od {size} ({pct}), iznad praga {over}, pa ga IPAM odmah označava kao prepunjen. Pun je u tjednu {ff}.',
      capStartOverNoFull: 'Tjedan {w}: studentski raspon već na početku semestra ima {used} od {size} ({pct}), iznad praga {over}, pa ga IPAM odmah označava kao prepunjen.',
      capStartFull: 'Tjedan {w}: studentski raspon pun je već na početku semestra: upozorenje ne stiže na vrijeme.',
      capAhead: 'Prag {over} prelazi u tjednu {fo}, pun je u tjednu {ff}.',
      capAheadNoFull: 'Prag {over} prelazi u tjednu {fo}; do kraja semestra se ne napuni.',
      capNever: 'Do kraja semestra ne prelazi prag {over}.',
      capCross: [
        'Tjedan {w}: studentski raspon prelazi {over} i IPAM ga označava kao *over-utilized* (prepunjen) — {n} tjedan prije nego što se napuni.',
        'Tjedan {w}: studentski raspon prelazi {over} i IPAM ga označava kao *over-utilized* (prepunjen) — {n} tjedna prije nego što se napuni.',
        'Tjedan {w}: studentski raspon prelazi {over} i IPAM ga označava kao *over-utilized* (prepunjen) — {n} tjedana prije nego što se napuni.'
      ],
      capCrossNoFull: 'Tjedan {w}: studentski raspon prelazi {over} i IPAM ga označava kao *over-utilized* (prepunjen); do kraja semestra se ne napuni.',
      capCrossFull: 'Tjedan {w}: studentski raspon prelazi {over} i odmah je pun: upozorenje stiže kad je već kasno.',
      capOverSince: 'Tjedan {w}: {used} od {size} ({pct}), prepunjen od tjedna {fo}. Pun je u tjednu {ff}.',
      capOverSinceNoFull: 'Tjedan {w}: {used} od {size} ({pct}), prepunjen od tjedna {fo}; do kraja semestra se ne napuni.',
      capFull: 'Tjedan {w}: raspon je pun, {size} od {size}. Upozorenje je stiglo u tjednu {fo}.',
      capFullSame: 'Tjedan {w}: raspon je pun, {size} od {size}. Prag i puni raspon stigli su u istom tjednu.',
      capRefused: 'Uređaji bez adrese: {n}.',
      capGone: 'Uređaji kojih više nema, a još drže dodjelu: {n}.',
      capHotspot: 'Cijeli blok je iskorišten {pct} — a jedan raspon u njemu je pun. Zbroj skriva vruće mjesto.',
      capHotOver: 'Cijeli blok je iskorišten {pct}, a raspon {name} je prepunjen ({rp}). Zbroj skriva vruće mjesto.',
      capBlock: 'Blok {name}: {used} od {size} adresa zauzeto ({pct}). To je zbroj svih raspona; opseg u *failover* (preuzimanje u slučaju kvara) paru brojan je jednom.',
      capUnder: '{name}: {used} od {size} ({pct}), označen kao nedovoljno iskorišten. To nije kvar, nego podatak za planiranje.',
      capSteady: '{name}: {used} od {size} ({pct}), {status}. Ovaj raspon se tijekom semestra ne mijenja.',

      explain: '<p>IPAM redovito (zadano svaka 2 sata) prikuplja s DHCP poslužitelja koliko je adresa u svakom rasponu zauzeto i računa ' +
        '<em lang="en">utilization</em> (iskorištenost): zauzete adrese, dodjele i rezervacije, podijeljene s veličinom raspona. Za blok zbraja ' +
        'svoje raspone; opseg koji dva poslužitelja dijele kao <em lang="en">failover</em> (preuzimanje u slučaju kvara) broji jednom.</p>' +
        '<p>Dva <em lang="en">thresholds</em> (praga), zadano 20 % i 80 %, daju status: ispod donjeg <em lang="en">under-utilized</em> ' +
        '(nedovoljno iskorišten), iznad gornjeg <em lang="en">over-utilized</em> (prepunjen). Točno na pragu je optimalno. Upozorenje ' +
        'stiže prije nego što se raspon napuni: to mu je svrha.</p>' +
        '<p>Iskorištenost broji <em lang="en">leases</em> (dodjele), a ne uređaje koji su sada na mreži. Posjetitelj koji ode zadrži ' +
        'dodjelu dok ne istekne, pa uz dodjelu od 8 dana [[pool]] drži osam dana posjetitelja. Kratka dodjela vraća ' +
        'adrese brže. Kad je raspon pun, novi uređaj ne dobiva adresu.</p>' +
        '<p>Zbroj skriva vruće mjesto: blok od 65 536 adresa može biti iskorišten 9 % dok je jedan raspon u njemu pun. Nedovoljno ' +
        'iskorišten raspon nije kvar, nego podatak za planiranje.</p>' +
        '<p>Model semestra je pojednostavljen: stalni uređaji rastu jednako svaki tjedan, posjetitelja je jednako svaki dan.</p>'
    },
    en: {
      stage: 'IPAM: block and range utilisation over a term',

      week: 'Week of the term',
      lease: 'Lease duration (students)',
      lease1: '1 day',
      lease8: '8 days',
      growth: 'New resident devices (students)',
      growthUnit: '/ week',
      visitors: 'Visitors (students)',
      visitorsUnit: '/ day',
      over: 'Over-utilised threshold',
      under: 'Under-utilised threshold',
      hidden: 'Selected',

      presetByod: '8-day lease',
      presetByodHint: 'Week 1: 170 of 200, over; full at week 4',
      presetShort: '1-day lease',
      presetShortHint: 'Same devices: over 80 % only at week 11, full at week 15',
      presetHotspot: 'Block 9\u00a0%, range full',
      presetHotspotHint: 'The total hides the hot spot',
      presetServers: 'Servers at 2.4\u00a0%',
      presetServersHint: 'Under-utilised is not a fault',
      presetT70: 'Threshold 70\u00a0%',
      presetT70Hint: '1-day lease: the alert at week 9 instead of 11',

      n_staff: 'Staff',
      n_labs: 'Labs',
      n_phones: 'IP phones',
      n_students: 'Students (Wi-Fi)',
      n_servers: 'Servers',

      st_under: 'Under',
      st_optimal: 'Optimal',
      st_over: 'Over',
      full: 'full',
      refused: 'without an address',

      blockKind: 'block',
      blockOf: 'of',
      blockAddr: 'addresses used',
      failoverOnce: 'a scope in a failover pair is counted once; the sum of both servers\' reports would be',
      collected: 'Collected: week {w}, Monday {h} · every {i} h',
      failover: 'failover',

      ipamTitle: 'Ranges in the block',
      thRange: 'Range',
      thServer: 'Server',
      thSize: 'Size',
      thUsed: 'Used',
      thUtil: 'Utilisation',
      thStatus: 'Status',
      thTrend: 'Trend',

      detUsed: 'What is using it:',
      c_residents: 'resident devices',
      c_inuse: 'in use',
      c_today: 'leases of today\'s visitors',
      c_gone: 'leases of devices that have left',
      c_reserved: 'reservations',
      c_free: 'free',
      c_refused: 'devices without an address',
      c_ranges: 'used in ranges',
      c_rfree: 'free in ranges',
      c_outside: 'outside every range',
      trendTitle: 'Utilisation over the term',
      weekAxis: 'week',
      projection: 'later, if nothing changes',

      legBar: 'utilisation with thresholds',
      legUnder: 'under-utilised',
      legOptimal: 'optimal',
      legOver: 'over-utilised',
      legFull: 'full: a new device gets no address',
      legChanged: 'status changed',

      capWeek: 'Week {w}: the student range has {used} of {size} addresses in use ({pct}): resident devices {res}, visitor leases {vis} ({v} a day × {l}).',
      capWeekNoVis: 'Week {w}: the student range has {used} of {size} addresses in use ({pct}): resident devices {res}, no visitors.',
      capTie: 'Exactly {over}: IPAM marks it over-utilised only above the threshold.',
      capTieUnder: 'Exactly {under}: IPAM marks it under-utilised only below the threshold.',
      capUnderSt: 'Below {under}: IPAM marks it under-utilised.',
      capAheadSame: 'It crosses {over} at week {fo}, the same week it fills up.',
      capStartOver: 'Week {w}: the student range starts the term with {used} of {size} ({pct}), above {over}, so IPAM marks it over-utilised at once. Full at week {ff}.',
      capStartOverNoFull: 'Week {w}: the student range starts the term with {used} of {size} ({pct}), above {over}, so IPAM marks it over-utilised at once.',
      capStartFull: 'Week {w}: the student range is full from the start of the term: the alert cannot come in time.',
      capAhead: 'It crosses {over} at week {fo} and is full at week {ff}.',
      capAheadNoFull: 'It crosses {over} at week {fo} and does not fill up this term.',
      capNever: 'It does not go above {over} this term.',
      capCross: [
        'Week {w}: the student range crosses {over} and IPAM marks it over-utilised, {n} week before it is full.',
        'Week {w}: the student range crosses {over} and IPAM marks it over-utilised, {n} weeks before it is full.'
      ],
      capCrossNoFull: 'Week {w}: the student range crosses {over} and IPAM marks it over-utilised; it does not fill up this term.',
      capCrossFull: 'Week {w}: the student range crosses {over} and is full at once: the alert comes too late.',
      capOverSince: 'Week {w}: {used} of {size} ({pct}), over-utilised since week {fo}. Full at week {ff}.',
      capOverSinceNoFull: 'Week {w}: {used} of {size} ({pct}), over-utilised since week {fo}; it does not fill up this term.',
      capFull: 'Week {w}: the range is full, {size} of {size}. The alert came at week {fo}.',
      capFullSame: 'Week {w}: the range is full, {size} of {size}. The threshold and the full range came in the same week.',
      capRefused: 'Devices without an address: {n}.',
      capGone: 'Devices that have left but still hold a lease: {n}.',
      capHotspot: 'The whole block is {pct} used, and one range in it is full. The total hides the hot spot.',
      capHotOver: 'The whole block is {pct} used, and the range {name} is over-utilised ({rp}). The total hides the hot spot.',
      capBlock: 'Block {name}: {used} of {size} addresses in use ({pct}). That is the sum of every range; a scope in a failover pair is counted once.',
      capUnder: '{name}: {used} of {size} ({pct}), flagged under-utilised. Under-utilised is not a fault, it is planning data.',
      capSteady: '{name}: {used} of {size} ({pct}), {status}. This range does not change over the term.',

      explain: '<p>IPAM regularly (every 2 hours by default) collects from the DHCP servers how many addresses of each range are in use, ' +
        'and computes the utilisation: addresses in use, leases and reservations, divided by the size of the range. A block adds up its ' +
        'ranges; a scope that two servers share as a failover pair is counted once.</p>' +
        '<p>Two thresholds, 20 % and 80 % by default, give the status: below the lower one under-utilised, above the upper one ' +
        'over-utilised. Exactly at a threshold is optimal. The alert comes before the range is full: that is what it is for.</p>' +
        '<p>Utilisation counts leases, not the devices that are on the network now. A visitor who leaves keeps the lease until it ' +
        'expires, so with an 8-day lease the [[pool]] holds eight days of visitors. A short lease gives addresses back sooner. When a ' +
        'range is full, a new device gets no address.</p>' +
        '<p>The total hides the hot spot: a block of 65 536 addresses can be 9 % used while one range in it is full. An ' +
        'under-utilised range is not a fault, it is planning data.</p>' +
        '<p>The term is a simplified model: resident devices grow by the same number every week, and the same number of visitors ' +
        'come every day.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
