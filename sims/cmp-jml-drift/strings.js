/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cmp-jml-drift, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dvije godine odjela: nepotrebna prava po osobi, otvoreni računi otišlih i tko što drži',
      dash: '—',
      monthAxis: '{n}. mj.',

      // teams and their rights (five per team)
      t_0: 'Prodaja',
      t_1: 'Financije',
      t_2: 'Podrška',
      t_3: 'Logistika',
      x_0: 'kupci (CRM)',
      x_1: 'ponude',
      x_2: 'cjenik',
      x_3: 'ugovori',
      x_4: 'popusti',
      x_5: 'glavna knjiga',
      x_6: 'plaćanja',
      x_7: 'plaće',
      x_8: 'računi',
      x_9: 'bankovni izvodi',
      x_10: 'prijave kvarova',
      x_11: 'podaci kupaca',
      x_12: 'udaljena pomoć',
      x_13: 'baza znanja',
      x_14: 'povrati',
      x_15: 'zalihe',
      x_16: 'narudžbe',
      x_17: 'otprema',
      x_18: 'dobavljači',
      x_19: 'skladište',

      // the numbers
      h_base: 'bez kontrola',
      h_mine: 'tvoje kontrole',
      m_excess: 'nepotrebnih prava po osobi',
      m_orphans: 'otvorenih računa otišlih',
      m_lines: 'redaka za pregled',
      m_removed: 'pregledi uklonili prava · zatvorili račune',
      tableLabel: '{m}. mjesec. Nepotrebnih prava po osobi: bez kontrola {bx}, s tvojim kontrolama {mx}. Otvorenih računa otišlih: bez kontrola {bo}, s tvojim kontrolama {mo}',

      // the charts
      chExcess: 'Nepotrebna prava po osobi',
      chOrphans: 'Otvoreni računi onih koji su otišli',
      chartLabel: '{what}, od 0. do {m}. mjeseca: bez kontrola {b}, s tvojim kontrolama {y}',

      // the matrix
      mxTitle: '{m}. mjesec, tvoje kontrole: tko drži koja prava',
      mxGone: '⊘ {n}',
      mxLabel: 'Matrica prava. Zaposlenih: {p}; otvorenih računa otišlih: {o}; nepotrebnih prava: {x}',
      cellNeed: '{who}: {right} (treba za posao)',
      cellExtra: '{who}: {right} (ne treba za posao)',
      cellGone: '{who}: {right} (nakon odlaska, račun otvoren)',
      who: 'osoba {id}, {team}',
      whoGone: 'osoba {id}, odlazak u {m}. mjesecu',

      // panel
      hr: 'Kadrovska zatvara račune',
      roles: 'Prava kroz uloge',
      move: 'Premještaj oduzima staro',
      review: 'Tromjesečni pregled prava',
      rv_off: 'nema',
      rv_one: 'jedan za sve',
      rv_teams: 'voditelji timova',
      care: 'Pažljivo pročitanih redaka',
      month: 'Mjesec',
      newRun: 'Nove dvije godine',

      // presets
      pDrift: 'Bez kontrola',
      pDriftHint: 'Prava se dodjeljuju na zahtjev i nikad ne oduzimaju; IT za odlazak čuje ako mu netko javi.',
      pHr: 'Kadrovska javlja odlaske',
      pHrHint: 'Račun se zatvara zadnji radni dan; nepotrebna prava i dalje rastu.',
      pBigReview: 'Pregled: jedan za sve',
      pBigReviewHint: 'Jedna osoba svako tromjesečje dobije stotine redaka i pažljivo pročita 50.',
      pTeamReview: 'Pregled po timovima',
      pTeamReviewHint: 'Svaki voditelj pregledava samo svoj tim: kraći popisi, ali četiri osobe čitaju svako tromjesečje.',
      pRoles: 'Uloge i premještaj',
      pRolesHint: 'Prava dolaze s ulogom, premještaj mijenja ulogu, odlazak javlja kadrovska.',
      pAll: 'Sve kontrole',
      pAllHint: 'Uloge, premještaj, kadrovska i pregled po timovima: popisi su kratki pa se pročitaju cijeli.',

      // legend
      legNeed: 'treba za posao',
      legExtra: 'ne treba za posao',
      legGone: 'nakon odlaska, račun otvoren',
      legBase: 'bez kontrola',
      legMine: 'tvoje kontrole',
      legReview: 'pregled prava',

      // caption
      capStart: '0. mjesec: svih 48 ljudi ima točno pet prava koja im posao traži. Pomakni mjesec i pusti odjel da radi dvije godine.',
      capNone: '{m}. mjesec bez kontrola (došlo: {j}, premješteno: {mv}, otišlo: {l}). Osoba sada prosječno drži {bx} nepotrebnih prava, a otvorenih računa ljudi koji su otišli ima {bo}.',
      capMain: '{m}. mjesec. Bez kontrola osoba prosječno drži {bx} nepotrebnih prava, a otvorenih računa ljudi koji su otišli ima {bo}. S tvojim kontrolama: {mx} i {mo}.',
      nReviewOne: 'Zadnji pregled ({rm}. mjesec): jedna osoba, redaka na popisu {pl}, pažljivo pročitanih {c}, ostali odobreni nepročitani.',
      nReviewTeams: 'Zadnji pregled ({rm}. mjesec): voditelja timova {n}, redaka ukupno {tl}, najviše {pl} po voditelju; pažljivo pročitanih {c}, ostali odobreni nepročitani.',
      nRemoved: 'Uklonjeno nepotrebnih prava: {r} od {x}.',
      nRemovedClosed: 'Uklonjeno nepotrebnih prava: {r} od {x}; zatvoreno računa otišlih: {k} od {o}.',
      nRolesNoMove: 'Uloge bez oduzimanja pri premještaju: premješteni zadrži staru ulogu, pet prava u jednom retku.',
      nCopy: 'Novi su dobili kopiju računa kolege, a s njom i kolegina nepotrebna prava (ukupno: {k}).',
      nUntold: 'Odlazaka koje IT-u nitko nije javio: {u} od {l}; ti računi ostaju otvoreni dok ih netko ne nađe.',
      nOneOff: 'Ostala su pojedinačna prava: traže se jednom, za jedan zadatak, i nitko ih ne vrati.',

      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, ljudi, sustavi i stope su izmišljeni.',

      explain:
        '<p>Svaki zaposlenik treba prava pristupa koja mu traži posao, i ništa više: to je <b>načelo najmanjih ' +
        'ovlasti</b> (<i>least privilege</i>). Odjel ovdje ima četiri tima po dvanaest ljudi; posao u svakom timu ' +
        'traži pet prava. Kroz dvije godine ljudi dolaze, premještaju se i odlaze (<b>dolazak, premještaj, odlazak</b>, ' +
        '<i>joiner, mover, leaver</i>), a ponekad zatraže jedno pravo izvan svog posla. Svaki graf prikazuje iste događaje ' +
        'dvaput: isprekidano bez kontrola, puno s kontrolama koje uključiš.</p>' +
        '<ul>' +
        '<li><b>Bez kontrola</b> prava se dodjeljuju na zahtjev i nitko ih ne oduzima. Novome se račun napravi kao ' +
        'kopija kolege, s koleginim viškom; premješteni zadrži stara prava i dobije nova. To je <b>gomilanje ovlasti</b> ' +
        '(<i>privilege creep</i>). Za odlazak IT čuje samo ako mu netko javi, pa račun bez vlasnika ostaje otvoren ' +
        '(<i>orphaned account</i>, napušteni račun).</li>' +
        '<li><b>Odlazak iz kadrovske evidencije:</b> zapis o odlasku zatvara račun zadnjeg radnog dana.</li>' +
        '<li><b>Uloge</b> (<i>role-based access</i>, pristup temeljen na ulogama): prava dolaze s ulogom posla, ne ' +
        'kopiranjem; <b>premještaj</b> tada mijenja ulogu, pa stara prava odlaze. Ostaju samo pojedinačna prava.</li>' +
        '<li><b>Pregled prava</b> (<i>access review</i>): svako tromjesečje pregledavatelj potvrdi ili oduzme svaki ' +
        'redak (osoba i pravo ili uloga). Pažljivo pročita samo zadani broj redaka, ostale odobri nepročitane ' +
        '(<i>rubber-stamping</i>); popis je svaki put istim redom, pa se pregledaju uvijek isti ljudi, a ostali ' +
        'nikad. Jedan pregledavatelj za cijeli odjel bez uloga dobije stotine redaka i ukloni malo; voditelji timova ' +
        'dijele popis, ali čita ih četvero; s ulogama je popis kratak i pročita se cijeli.</li>' +
        '</ul>' +
        '<p>Odakle: ISO/IEC 27001:2022, kontrole 5.15 (kontrola pristupa), 5.16 (upravljanje identitetom) i 5.18 ' +
        '(prava pristupa: dodjela, redovita provjera, uklanjanje pri promjeni posla ili odlasku); NIS2, Direktiva ' +
        '(EU) 2022/2555, čl. 21. st. 2. t. (i): sigurnost ljudskih potencijala, politike kontrole pristupa i ' +
        'upravljanje imovinom.</p>'
    },
    en: {
      stage: 'Two years of a department: unneeded rights per person, leavers\' open accounts and who holds what',
      dash: '—',
      monthAxis: 'mo {n}',

      t_0: 'Sales',
      t_1: 'Finance',
      t_2: 'Support',
      t_3: 'Logistics',
      x_0: 'customers (CRM)',
      x_1: 'quotes',
      x_2: 'price list',
      x_3: 'contracts',
      x_4: 'discounts',
      x_5: 'general ledger',
      x_6: 'payments',
      x_7: 'payroll',
      x_8: 'invoices',
      x_9: 'bank statements',
      x_10: 'fault tickets',
      x_11: 'customer records',
      x_12: 'remote help',
      x_13: 'knowledge base',
      x_14: 'refunds',
      x_15: 'stock',
      x_16: 'orders',
      x_17: 'shipping',
      x_18: 'suppliers',
      x_19: 'warehouse',

      h_base: 'no controls',
      h_mine: 'your controls',
      m_excess: 'unneeded rights per person',
      m_orphans: 'leavers\' accounts open',
      m_lines: 'lines to review',
      m_removed: 'reviews removed rights · closed accounts',
      tableLabel: 'Month {m}. Unneeded rights per person: no controls {bx}, your controls {mx}. Leavers\' accounts open: no controls {bo}, your controls {mo}',

      chExcess: 'Unneeded rights per person',
      chOrphans: 'Accounts of people who left, still open',
      chartLabel: '{what}, months 0 to {m}: no controls {b}, your controls {y}',

      mxTitle: 'Month {m}, your controls: who holds which rights',
      mxGone: '⊘ {n}',
      mxLabel: 'Rights matrix. Staff: {p}; leavers\' accounts open: {o}; unneeded rights: {x}',
      cellNeed: '{who}: {right} (needed for the job)',
      cellExtra: '{who}: {right} (not needed for the job)',
      cellGone: '{who}: {right} (left, account open)',
      who: 'person {id}, {team}',
      whoGone: 'person {id}, left in month {m}',

      hr: 'HR records close leavers\' accounts',
      roles: 'Roles instead of one-off grants',
      move: 'A move removes the old access',
      review: 'Quarterly access review',
      rv_off: 'none',
      rv_one: 'one for all',
      rv_teams: 'team leads',
      care: 'Lines a reviewer reads with care',
      month: 'Month',
      newRun: 'New two years',

      pDrift: 'No controls',
      pDriftHint: 'Rights are granted on request and never removed; IT hears of a leaver only if someone tells it.',
      pHr: 'HR closes leavers',
      pHrHint: 'The account closes on the last working day; unneeded rights still grow.',
      pBigReview: 'Review: one for all',
      pBigReviewHint: 'Each quarter one person gets hundreds of lines and reads 50 with care.',
      pTeamReview: 'Review by team',
      pTeamReviewHint: 'Each team lead reviews only their own team: shorter lists, but four people reading every quarter.',
      pRoles: 'Roles and moves',
      pRolesHint: 'Rights come with a role, a move swaps the role, HR records the leavers.',
      pAll: 'All controls',
      pAllHint: 'Roles, moves, HR and a review by team: the lists are short, so they are read in full.',

      legNeed: 'needed for the job',
      legExtra: 'not needed for the job',
      legGone: 'left, account open',
      legBase: 'no controls',
      legMine: 'your controls',
      legReview: 'access review',

      capStart: 'Month 0: all 48 people hold exactly the five rights their job needs. Move the month and let the department run for two years.',
      capNone: 'Month {m} with no controls ({j} joined, {mv} moved, {l} left). A person now holds {bx} rights the job does not need on average, and {bo} accounts of people who left are still open.',
      capMain: 'Month {m}. With no controls a person holds {bx} rights the job does not need on average, and {bo} accounts of people who left are still open. With your controls: {mx} and {mo}.',
      nReviewOne: 'The last review (month {rm}) gave one person {pl} lines; they read {c} with care and approved the rest unread.',
      nReviewTeams: 'The last review (month {rm}) split {tl} lines among {n} team leads, up to {pl} each; they read {c} with care and approved the rest unread.',
      nRemoved: 'It removed {r} of {x} unneeded rights.',
      nRemovedClosed: 'It removed {r} of {x} unneeded rights and closed {k} of {o} leavers\' accounts.',
      nRolesNoMove: 'Roles without removal on move: a mover keeps the old role, five rights in one line.',
      nCopy: 'New people got a copy of a colleague\'s account, and with it the colleague\'s unneeded rights ({k} in all).',
      nUntold: 'Leavers nobody told IT about: {u} of {l}; those accounts stay open until someone finds them.',
      nOneOff: 'What is left are one-off grants: asked for once, for one task, and never given back.',

      foot: 'Simplified, not legal advice. The firm, the people, the systems and the rates are made up.',

      explain:
        '<p>Everyone needs the access rights their job calls for, and no more: the <b>principle of least ' +
        'privilege</b>. The department here has four teams of twelve; each team\'s job needs five rights. Over two ' +
        'years people join, move and leave (<b>joiner, mover, leaver</b>), and now and then ask for one right outside ' +
        'their job. Each chart shows the same events twice: dashed with no controls, solid with the controls you switch on.</p>' +
        '<ul>' +
        '<li><b>No controls:</b> rights are granted on request and nobody removes them. A new account is made as a copy ' +
        'of a colleague\'s, surplus included; a mover keeps the old rights and gets the new ones. That is <b>privilege ' +
        'creep</b>. IT hears of a leaver only if someone tells it, so the account stays open with no owner (an ' +
        '<b>orphaned account</b>).</li>' +
        '<li><b>HR records:</b> the record of a departure closes the account on the last working day.</li>' +
        '<li><b>Roles</b> (role-based access): rights come with the job\'s role, not by copying; a <b>move</b> then ' +
        'swaps the role, so the old rights go. Only the one-off grants remain.</li>' +
        '<li><b>Access review:</b> each quarter a reviewer confirms or removes every line (a person and a right or a ' +
        'role). They read only the set number of lines with care and approve the rest unread (rubber-stamping); the list ' +
        'comes in the same order every time, so the same people are checked and the rest never are. One reviewer for ' +
        'the whole department without roles gets hundreds of lines and removes little; team leads split the list, but ' +
        'it takes four of them; with roles the list is short and read in full.</li>' +
        '</ul>' +
        '<p>Where it comes from: ISO/IEC 27001:2022, controls 5.15 (access control), 5.16 (identity management) and ' +
        '5.18 (access rights: provision, regular review, removal on a change of job or on leaving); NIS2, Directive ' +
        '(EU) 2022/2555, art. 21(2)(i): human resources security, access control policies and asset management.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
