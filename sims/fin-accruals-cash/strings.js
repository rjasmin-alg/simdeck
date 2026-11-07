/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-accruals-cash, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers and month names are formatted in the page (index.html) and
   passed in. Month lists are one string split on "|" (an array would be read as plural forms). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Godina računa za IT: plaćeno (novac) i trošak po mjesecima, ukupno i po ugovorima',
      monthsShort: 'sij.|velj.|ožu.|tra.|svi.|lip.|srp.|kol.|ruj.|lis.|stu.|pro.',
      monthsLong: 'siječanj|veljača|ožujak|travanj|svibanj|lipanj|srpanj|kolovoz|rujan|listopad|studeni|prosinac',
      monthsLoc: 'siječnju|veljači|ožujku|travnju|svibnju|lipnju|srpnju|kolovozu|rujnu|listopadu|studenom|prosincu',
      nMonths: ['{n} mjesec', '{n} mjeseca', '{n} mjeseci'],
      eur: '{n} €',
      // params
      pSupport: 'Godišnja podrška (plaćena unaprijed)',
      pColo: 'Kolokacija (račun tromjesečno unatrag)',
      pLink: 'Internetska veza (račun za isti mjesec)',
      pLate: 'Vanjski izvođač (račun kasni)',
      fy: 'Prvi mjesec poslovne godine',
      fyHint: 'Mijenja samo imena mjeseci; ugovori počinju s godinom.',
      // presets
      prYear: 'Cijela godina',
      prYearHint: 'Sva četiri ugovora, od početka godine.',
      prPrepaid: 'Plaćeno unaprijed',
      prPrepaidHint: 'Samo godišnja podrška: 12 000 € u prvom mjesecu, 1 000 € troška mjesečno.',
      prArrears: 'Račun unatrag',
      prArrearsHint: 'Samo kolokacija: tri mjeseca troška prije prvog računa.',
      prLate: 'Račun kasni',
      prLateHint: 'Veza plaćena svaki mjesec i izvođačev rad u zadnjem mjesecu, naplaćen iduće godine.',
      prYearEnd: 'Kraj godine',
      prYearEndHint: 'Sva četiri ugovora u posljednjem mjesecu: što treba obračunati.',
      // legend
      legCash: 'plaćeno (novac)',
      legExpense: 'trošak (mjesec uporabe)',
      legPay: 'plaćen račun',
      legUse: 'korištena usluga',
      legNow: 'proknjiženi mjesec',
      // stage
      yearThis: 'Ova poslovna godina',
      yearNext: 'iduća',
      colContract: 'Ugovor',
      colBalance: 'Stanje',
      cursorStart: 'početak',
      vCash: 'Plaćeno dosad',
      vExpense: 'U trošku dosad',
      vPrepaid: 'Unaprijed plaćeni trošak',
      vAccrued: 'Obračunato, neplaćeno',
      bPrepaid: 'unaprijed plaćeno',
      bAccrued: 'obračunato',
      bSettled: 'podmireno',
      bWaiting: 'još ništa',
      iSupport: 'Godišnja podrška',
      sSupport: '{x} unaprijed za {k}',
      iColo: 'Kolokacija',
      sColo: '{fee}/mj., račun tromjesečno unatrag',
      iLink: 'Internetska veza',
      sLink: '{fee}/mj., račun za isti mjesec',
      iLate: 'Vanjski izvođač',
      sLate: '{x} za rad u {last}, račun stiže u {first}',
      noContract: 'Nijedan ugovor nije uključen.',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi. Svaki se račun plaća u mjesecu u kojem stigne.',
      // captions
      cStart: 'Prije početka godine ništa nije plaćeno ni korišteno. Svaki korak knjiži jedan mjesec: račune plaćene tog mjeseca (novac) i usluge korištene tog mjeseca (trošak).',
      cNone: 'Nijedan ugovor nije uključen: uključi barem jedan u postavkama.',
      cPrepay: '{month}: račun „{item}” od {x} plaća se odjednom, ali pokriva {k}. Trošak ovog mjeseca je samo {now}; {rest} čeka svoje mjesece kao unaprijed plaćeni trošak.',
      cSettle: '{month}: stiže račun „{item}” za {q}. tromjesečje, {x}, i plaća se. Taj je trošak već knjižen u mjesecima uporabe, pa plaćanje samo zatvara obračunati trošak.',
      cAccrue: '{month}: iskorišteno je {now} usluge „{item}”, a računa još nema. Trošak ipak pripada ovom mjesecu, pa se obračunava.',
      cRelease: '{month}: za „{item}” ništa se ne plaća, ali {now} unaprijed plaćenog troška prelazi u trošak ovog mjeseca.',
      cSame: '{month}: račun „{item}” plaća se za mjesec u kojem je usluga korištena, pa novac i trošak idu zajedno.',
      cQuiet: '{month}: ovaj se mjesec ništa ne knjiži.',
      cYearEnd: '{month}, kraj godine: trošak ove godine je {exp}, a tijekom godine plaćeno je {cash}. Razlika od {acc} obračunava se: to su usluge korištene ove godine čiji računi stižu iduće godine.',
      cYearEndEven: '{month}, kraj godine: plaćeno je jednako trošku godine, {exp}; ništa ne ostaje unaprijed plaćeno ni obračunato.',
      cNext: '{month} iduće godine: za prošlu godinu plaća se još {x}. To nije trošak nove godine, nego zatvara obračunati trošak, pa se linije susreću na {exp}.',
      cNextQuiet: '{month} iduće godine: za prošlu godinu nema više računa; linije su se susrele na {exp}.',
      gBoth: 'Dosad plaćeno {cash}, u trošku {exp}. Razlika skriva dvije stvari: {pre} unaprijed plaćenog troška i {acc} obračunatog troška.',
      gPrepaid: 'Dosad plaćeno {cash}, u trošku {exp}: novac je ispred troška za {pre}, a to je unaprijed plaćeni trošak.',
      gAccrued: 'Dosad plaćeno {cash}, u trošku {exp}: trošak je ispred novca za {acc}: toliko je obračunato, a još nije plaćeno.',
      gMeet: 'Dosad je plaćeno točno onoliko koliko je u trošku: {exp}.',
      explain: '<p><b>Trošak pripada mjesecu u kojem se usluga koristi, a ne mjesecu u kojem je plaćena.</b> To je ' +
        '<i>načelo nastanka događaja</i> (engl. <i lang="en">accrual basis</i>): trošak se priznaje kad nastane, bez ' +
        'obzira na to kad novac izađe. Novčani pogled (engl. <i lang="en">cash basis</i>) vidi samo plaćanja. MRS 1 ' +
        '(engl. IAS 1; od 2027. MRS 8) traži da se financijski izvještaji, osim izvještaja o novčanim tokovima, sastavljaju po načelu ' +
        'nastanka događaja.</p>' +
        '<p><b>Plaćeno unaprijed.</b> Godišnja podrška plaćena u prvom mjesecu nije trošak prvog mjeseca: svaki mjesec ' +
        'u trošak ide dvanaestina, a ostatak je dotad <i>unaprijed plaćeni trošak</i> (engl. <i lang="en">prepaid ' +
        'expense</i>; u knjigovodstvu: plaćeni troškovi budućeg razdoblja, aktivna vremenska razgraničenja), dakle ' +
        'imovina.</p>' +
        '<p><b>Obračunato.</b> Kolokacija se plaća tromjesečno unatrag, a izvođačev rad iz posljednjeg mjeseca godine ' +
        'naplaćuje se tek iduće godine. Usluga je ipak korištena, pa se trošak <i>obračunava</i> u mjesecu uporabe ' +
        '(pasivno vremensko razgraničenje, engl. <i lang="en">accrued expense</i>), dakle obveza. Kad račun stigne i ' +
        'plati se, ne nastaje novi trošak: plaćanje samo zatvara obračunato.</p>' +
        '<p><b>Kraj godine.</b> Trošak godine je zbroj usluga korištenih u njoj, pa račun koji stigne nakon kraja godine ' +
        'treba obračunati u njezinu posljednjem mjesecu (u praksi procjenom, prije nego što račun stigne). Bez toga bi ' +
        'ova godina izgledala jeftinije, a iduća skuplje. Ukupno se novac i trošak uvijek susretnu: razlikuje se samo ' +
        'mjesec. Zato mjesec bez računa nije mjesec bez troška, a „ispod proračuna” u ožujku često znači samo da račun ' +
        'još nije stigao.</p>' +
        '<p>Ovdje se svaki račun plaća u mjesecu u kojem stigne; rokovi plaćanja i obveze prema dobavljačima su ' +
        'izostavljeni. Iznosi su izmišljeni, ali uvjerljivi.</p>'
    },
    en: {
      stage: 'A year of IT invoices: cash paid and expense by month, in total and by contract',
      monthsShort: 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec',
      monthsLong: 'January|February|March|April|May|June|July|August|September|October|November|December',
      monthsLoc: 'January|February|March|April|May|June|July|August|September|October|November|December',
      nMonths: ['{n} month', '{n} months'],
      eur: '€{n}',
      pSupport: 'Annual support (paid in advance)',
      pColo: 'Colocation (billed quarterly in arrears)',
      pLink: 'Internet link (billed for the same month)',
      pLate: 'Contractor (late invoice)',
      fy: 'First month of the fiscal year',
      fyHint: 'Only renames the months; the contracts start with the year.',
      prYear: 'The whole year',
      prYearHint: 'All four contracts, from the start of the year.',
      prPrepaid: 'Paid in advance',
      prPrepaidHint: 'Annual support only: €12,000 in the first month, €1,000 of expense a month.',
      prArrears: 'Billed in arrears',
      prArrearsHint: 'Colocation only: three months of expense before the first invoice.',
      prLate: 'Late invoice',
      prLateHint: 'The link, paid every month, and a contractor\'s work in the last month, invoiced next year.',
      prYearEnd: 'Year end',
      prYearEndHint: 'All four contracts in the last month: what must be accrued.',
      legCash: 'paid (cash)',
      legExpense: 'expense (month of use)',
      legPay: 'invoice paid',
      legUse: 'service used',
      legNow: 'month posted',
      yearThis: 'This fiscal year',
      yearNext: 'next',
      colContract: 'Contract',
      colBalance: 'Balance',
      cursorStart: 'start',
      vCash: 'Paid so far',
      vExpense: 'Expensed so far',
      vPrepaid: 'Prepaid',
      vAccrued: 'Accrued, unpaid',
      bPrepaid: 'prepaid',
      bAccrued: 'accrued',
      bSettled: 'settled',
      bWaiting: 'nothing yet',
      iSupport: 'Annual support',
      sSupport: '{x} upfront for {k}',
      iColo: 'Colocation',
      sColo: '{fee}/month, billed quarterly in arrears',
      iLink: 'Internet link',
      sLink: '{fee}/month, billed for the same month',
      iLate: 'Contractor',
      sLate: '{x} for work in {last}, invoiced in {first}',
      noContract: 'No contract is switched on.',
      illustrative: 'Amounts are made up but plausible. Every invoice is paid in the month it arrives.',
      cStart: 'Before the year starts nothing is paid or used. Each step posts one month: the invoices paid that month (cash) and the service used that month (expense).',
      cNone: 'No contract is switched on: switch one on in the settings.',
      cPrepay: '{month}: the “{item}” invoice of {x} is paid at once but covers {k}. Only {now} is this month\'s expense; {rest} waits for its months as a prepaid expense.',
      cSettle: '{month}: the “{item}” invoice for Q{q}, {x}, arrives and is paid. That expense was already booked in the months of use, so the payment only clears the accrual.',
      cAccrue: '{month}: {now} of “{item}” is used and no invoice has come yet. The expense still belongs to this month, so it is accrued.',
      cRelease: '{month}: nothing is paid for “{item}”, but {now} of its prepayment becomes this month\'s expense.',
      cSame: '{month}: the “{item}” invoice is paid for the month the service is used, so cash and expense move together.',
      cQuiet: '{month}: nothing is posted this month.',
      cYearEnd: '{month}, year end: this year\'s expense is {exp}; {cash} of it was paid during the year. The {acc} difference is accrued: services used this year whose invoices come next year.',
      cYearEndEven: '{month}, year end: the cash paid equals the year\'s expense, {exp}; nothing is left prepaid or accrued.',
      cNext: '{month} of the next year: the last {x} for last year is paid. It is not the new year\'s expense; it clears the accrual, and the lines meet at {exp}.',
      cNextQuiet: '{month} of the next year: no invoice for last year is left; the lines met at {exp}.',
      gBoth: 'So far paid {cash}, expensed {exp}. The gap hides two things: {pre} prepaid and {acc} accrued.',
      gPrepaid: 'So far paid {cash}, expensed {exp}: cash is ahead by {pre}, paid in advance.',
      gAccrued: 'So far paid {cash}, expensed {exp}: expense is ahead by {acc}, accrued but not yet paid.',
      gMeet: 'So far the cash paid and the expense are the same: {exp}.',
      explain: '<p><b>An expense belongs to the month the service is used, not the month it is paid.</b> This is the ' +
        '<i>accrual basis</i>: an expense is recognised when it is incurred, regardless of when the money leaves. The ' +
        '<i>cash basis</i> sees only the payments. IAS 1 (from 2027, IAS 8) requires financial statements, except the cash flow ' +
        'statement, to be prepared on the accrual basis.</p>' +
        '<p><b>Paid in advance.</b> Annual support paid in the first month is not the first month\'s expense: each month ' +
        'a twelfth becomes expense, and the rest is meanwhile a <i>prepaid expense</i>, an asset.</p>' +
        '<p><b>Accrued.</b> Colocation is billed quarterly in arrears, and the contractor\'s work in the year\'s last ' +
        'month is invoiced only next year. The service was used all the same, so the expense is <i>accrued</i> in the ' +
        'month of use (an <i>accrued expense</i>, a liability). When the invoice arrives and is paid, no new expense ' +
        'arises: the payment only clears the accrual.</p>' +
        '<p><b>Year end.</b> A year\'s expense is the sum of the services used in it, so an invoice that arrives after ' +
        'the year ends must be accrued in its last month (in practice by an estimate, before the invoice arrives). ' +
        'Without that, this year would look cheaper and the next one dearer. In total, cash and expense always meet: ' +
        'only the month differs. So a month without invoices is not a month without cost, and "under budget" in March ' +
        'often just means the invoice has not arrived yet.</p>' +
        '<p>Here every invoice is paid in the month it arrives; payment terms and trade payables are left out. ' +
        'Amounts are made up but plausible.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
