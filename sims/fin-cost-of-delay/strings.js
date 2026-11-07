/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-cost-of-delay, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers are formatted in the page (index.html) and passed in.
   Project names are passed into sentences in quotes („…” / "…"), so Croatian needs no case endings for them. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Red čekanja jednog tima, vrijednost koju projekti gube dok ne budu isporučeni i usporedba pet pravila redoslijeda',
      n: 'Projekata u redu',
      proj: 'Projekt',
      order: 'Redoslijed',
      cdOf: '„{p}”: vrijednost izgubljena tjedno',
      dOf: 'Trajanje',
      vOf: 'Koliko glasno traže',
      sortBtn: 'Poredaj po omjeru',
      p_portal: 'Portal za korisnike',
      p_invoice: 'Sparivanje računa',
      p_erp: 'Nadogradnja ERP-a',
      p_dash: 'Prodajna nadzorna ploča',
      p_sso: 'Jedinstvena prijava',
      ask_portal: 'prodaja',
      ask_invoice: 'računovodstvo',
      ask_erp: 'uprava',
      ask_dash: 'marketing',
      ask_sso: 'podrška',
      v1: 'tiho',
      v2: 'mirno',
      v3: 'odlučno',
      v4: 'glasno',
      v5: 'vrlo glasno',
      asks: '{who}, {how}',
      headQueue: 'Red čekanja jednog tima',
      colAsk: 'traži',
      colCd: '€ tjedno',
      colD: 'tjedana',
      colRatio: '€ tjedno ÷ tjedni',
      colDone: 'gotov u tj.',
      colLost: 'izgubljeno',
      upLabel: '„{p}” jedno mjesto naprijed',
      downLabel: '„{p}” jedno mjesto natrag',
      upFirst: '„{p}” je već na prvom mjestu u redu',
      downLast: '„{p}” je već na zadnjem mjestu u redu',
      selLabel: '„{p}”: uredi u postavkama',
      headChart: 'Vrijednost koja se još gubi, € tjedno; površina je ukupni gubitak',
      xUnit: 'tjedan',
      bandLabel: '{p} {v}',
      headRules: 'Isti projekti, drugi redoslijed: ukupno izgubljeno',
      r_mine: 'Tvoj redoslijed',
      r_loud: 'Tko najglasnije traži',
      r_big: 'Najduži prvi',
      r_small: 'Najkraći prvi',
      r_value: 'Najvrjedniji prvi',
      r_ratio: 'Vrijednost tjedno ÷ trajanje',
      ruleLabel: 'Poredaj: {r}, ukupno {v}',
      extra: '+{v}',
      bestMark: '★ najmanje',
      sameAs: '= {r}',
      foot: 'Šrafirano: gubitak dok se projekt radi, {b} u svakom redoslijedu. Ispunjeno: gubitak dok čeka, {w} u ovom redoslijedu.',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi.',
      eur: '{n} €',
      weeks: ['{n} tjedan', '{n} tjedna', '{n} tjedana'],
      pLoud: 'Najglasniji prvi',
      pLoudHint: 'Redom kako traže, od najglasnijeg: prvi ide ERP, koji uprava traži najglasnije. Gubi se 329 000 €, 116 000 € više nego što treba.',
      pBig: 'Najduži prvi',
      pBigHint: 'Najduži projekt prvi, „jer je najvažniji”: 321 000 €.',
      pQuick: 'Brze pobjede',
      pQuickHint: 'Najkraći prvi: 222 000 €, blizu najmanjeg mogućeg gubitka, ali ne i najmanji.',
      pRatio: 'Po omjeru',
      pRatioHint: 'Vrijednost tjedno ÷ trajanje, od najvećeg: 213 000 €, najmanje što se može.',
      pSameValue: 'Jednaka vrijednost',
      pSameValueHint: 'Svi gube 3 000 € tjedno: sad je najkraći prvi isto što i omjer (159 000 €).',
      pSameSize: 'Jednako trajanje',
      pSameSizeHint: 'Svi traju 4 tjedna: sad je najvrjedniji prvi isto što i omjer (144 000 €).',
      legWait: 'gubi dok čeka',
      legBuild: 'gubi dok se radi',
      legBest: 'najbolji redoslijed',
      legMine: 'tvoj redoslijed',
      legStar: 'najmanji mogući gubitak',
      legChanged: 'ishod se promijenio',
      capBest: 'Ovim redoslijedom gubi se {total} dok svi projekti ne budu gotovi i nijedan redoslijed ovih projekata ne ' +
        'gubi manje: projekti su poredani po vrijednosti izgubljenoj tjedno ÷ trajanju, od najvećeg.',
      capWorse: 'Ovim redoslijedom gubi se {total} dok svi projekti ne budu gotovi. Poredani po vrijednosti izgubljenoj ' +
        'tjedno ÷ trajanju, isti bi projekti izgubili {best}, {extra} manje.',
      nSwap: 'Najveća pojedinačna ušteda: „{b}” ispred „{a}” štedi {s}.',
      nTie: '„{a}” i „{b}” imaju isti omjer: svejedno je koji ide prvi, zbroj se ne mijenja.',
      explain: '<p><i lang="en">Cost of delay</i> (<b>trošak kašnjenja</b>) je vrijednost koju projekt ne donosi za ' +
        'svaki tjedan dok nije gotov: ušteda koje nema, prodaja koja izostaje, vrijeme ljudi koje se i dalje gubi. ' +
        'Ovdje svaki projekt gubi svoju vrijednost tjedno od danas do isporuke, pa je njegov gubitak vrijednost ' +
        'tjedno × tjedan isporuke.</p>' +
        '<p>Jedan tim radi projekte jedan za drugim, pa ono što ide prvo odgađa sve iza sebe. Zamjena dvaju susjeda, ' +
        'A pa B u B pa A, mijenja zbroj za (vrijednost tjedno od B × tjedni od A) − (vrijednost ' +
        'tjedno od A × tjedni od B), pa B treba ići prvi točno kad mu je vrijednost tjedno ÷ trajanje veća. Redoslijed po ' +
        '<b>vrijednosti tjedno ÷ trajanju</b>, od najvećeg, zato gubi najmanje (Smithovo pravilo iz 1956.; u ' +
        'agilnom planiranju <i lang="en">weighted shortest job first</i>, ponderirano najkraći posao prvi, ili CD3).</p>' +
        '<p>Jednostavna pravila su posebni slučajevi. <b>Najkraći prvi</b> je uvijek najbolji kad svi projekti gube ' +
        'jednako tjedno, a <b>najvrjedniji prvi</b> kad svi jednako traju; inače su najbolji samo slučajno. ' +
        '<b>Najduži prvi</b> i <b>tko najglasnije traži</b> ne gledaju ni jedno ni drugo. Šrafirani dio svake trake, gubitak dok se sam projekt ' +
        'radi, jednak je u svakom redoslijedu; pomiče se samo čekanje.</p>' +
        '<p>Iznosi su izmišljeni. Stvarna vrijednost tjedno je procjena; neki projekti gube brže kako se bliži rok, ' +
        'timovi rade više projekata odjednom, a projekti ovise jedni o drugima. To je izvan ovog modela, kao i ' +
        'diskontiranje, koje kroz nekoliko mjeseci jedva išta mijenja.</p>'
    },
    en: {
      stage: 'One team\'s queue, the value the projects lose until they are delivered, and five ordering rules compared',
      n: 'Projects in the queue',
      proj: 'Project',
      order: 'Order',
      cdOf: '"{p}": value lost per week',
      dOf: 'Duration',
      vOf: 'How loudly they ask',
      sortBtn: 'Sort by the ratio',
      p_portal: 'Customer portal',
      p_invoice: 'Invoice matching',
      p_erp: 'ERP upgrade',
      p_dash: 'Sales dashboard',
      p_sso: 'Single sign-on',
      ask_portal: 'sales',
      ask_invoice: 'accounting',
      ask_erp: 'the board',
      ask_dash: 'marketing',
      ask_sso: 'helpdesk',
      v1: 'quietly',
      v2: 'calmly',
      v3: 'firmly',
      v4: 'loudly',
      v5: 'very loudly',
      asks: '{who}, {how}',
      headQueue: 'One team\'s queue',
      colAsk: 'asked by',
      colCd: '€ a week',
      colD: 'weeks',
      colRatio: '€ a week ÷ weeks',
      colDone: 'done in wk',
      colLost: 'lost',
      upLabel: 'Move "{p}" one place earlier',
      downLabel: 'Move "{p}" one place later',
      upFirst: '"{p}" is already first in the queue',
      downLast: '"{p}" is already last in the queue',
      selLabel: '"{p}": edit in the settings',
      headChart: 'Value still being lost, € a week; the area is the total lost',
      xUnit: 'week',
      bandLabel: '{p} {v}',
      headRules: 'The same projects in another order: total lost',
      r_mine: 'Your order',
      r_loud: 'Who asks loudest',
      r_big: 'Longest first',
      r_small: 'Shortest first',
      r_value: 'Most valuable first',
      r_ratio: 'Value per week ÷ duration',
      ruleLabel: 'Sort: {r}, total {v}',
      extra: '+{v}',
      bestMark: '★ least',
      sameAs: '= {r}',
      foot: 'Hatched: lost while the project is being built, {b} in any order. Solid: lost while it waits, {w} in this order.',
      illustrative: 'The amounts are made up but plausible.',
      eur: '€{n}',
      weeks: ['{n} week', '{n} weeks'],
      pLoud: 'Loudest first',
      pLoudHint: 'In the order they ask, loudest first: the board and the ERP go first. €329,000 lost, €116,000 more than needed.',
      pBig: 'Longest first',
      pBigHint: 'The longest project first, "because it matters most": €321,000.',
      pQuick: 'Quick wins',
      pQuickHint: 'Shortest first: €222,000, close to the least but not the least.',
      pRatio: 'By the ratio',
      pRatioHint: 'Value per week ÷ duration, largest first: €213,000, the least possible.',
      pSameValue: 'Equal value',
      pSameValueHint: 'All lose €3,000 a week: now shortest first is the same as the ratio (€159,000).',
      pSameSize: 'Equal duration',
      pSameSizeHint: 'All take 4 weeks: now most valuable first is the same as the ratio (€144,000).',
      legWait: 'lost while waiting',
      legBuild: 'lost while being built',
      legBest: 'the best order',
      legMine: 'your order',
      legStar: 'the least possible loss',
      legChanged: 'the outcome changed',
      capBest: 'This order loses {total} until every project is done, and no order of these projects loses less: the ' +
        'projects are in order of value lost per week ÷ duration, largest first.',
      capWorse: 'This order loses {total} until every project is done. Ordered by value lost per week ÷ duration, the ' +
        'same projects would lose {best}, {extra} less.',
      nSwap: 'The biggest single saving: "{b}" before "{a}" saves {s}.',
      nTie: '"{a}" and "{b}" have the same ratio: either can go first, the total does not change.',
      explain: '<p><i>Cost of delay</i> is the value a project fails to deliver for every week it is not done: savings ' +
        'not made, sales not taken, staff time still wasted. Here each project loses its value per week from today ' +
        'until it is delivered, so its loss is value per week × the week it is delivered.</p>' +
        '<p>One team does the projects one after another, so whatever goes first delays everything behind it. ' +
        'Swapping two neighbours, A then B into B then A, changes the total by (B\'s value per week × A\'s weeks) − ' +
        '(A\'s value per week × B\'s weeks), so B should go first exactly when its value per week ÷ duration is ' +
        'larger. Ordering by <b>value per week ÷ duration</b>, largest first, therefore loses the least (Smith\'s rule ' +
        'of 1956; in agile planning <i>weighted shortest job first</i>, or CD3).</p>' +
        '<p>The simple rules are special cases. <b>Shortest first</b> is always best when every project loses the same ' +
        'per week, and <b>most valuable first</b> when they all take equally long; otherwise they are best only by ' +
        'chance. <b>Longest first</b> and <b>who asks loudest</b> look at neither. The hatched part of each band, lost while the project itself is being ' +
        'built, is the same in every order; only the waiting moves.</p>' +
        '<p>The amounts are made up. Real values per week are estimates; some projects lose value faster as a ' +
        'deadline nears, teams work on several projects at once, and projects depend on each other. Those are outside ' +
        'this model, and so is discounting, which barely matters over a few months.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
