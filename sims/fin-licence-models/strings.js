/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-licence-models, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Amounts, rates and counts are formatted in the page (index.html) and
   passed in. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Ista licenca kupljena trajno ili u pretplati: plaćeni novac, trošak i godina prijelaza',
      growth: 'Rast broja korisnika (godišnje)',
      maint: 'Održavanje, % cijene godišnje',
      rise: 'Rast cijena (godišnje)',
      horizon: 'Razdoblje usporedbe',
      horizonN: ['{n} godina', '{n} godine', '{n} godina'],
      sub: 'Pretplata, % cijene godišnje',
      metric: 'Licenca se broji',
      metricUser: 'po korisniku',
      metricCore: 'po jezgri',
      refresh: 'Zamjena poslužitelja',
      refreshNone: 'nema',
      lapse: 'Održavanje prekinuto',
      lapseNone: 'nikad',
      gap: 'Povratak nakon',
      gapN: ['{n} god.', '{n} god.', '{n} god.'],
      yearOrd: '{n}. g.',
      pCrossing: 'Godina prijelaza',
      pCrossingHint: '200 korisnika, rast 10\u00a0% godišnje, održavanje 20\u00a0%, cijene +3\u00a0%: kada pretplata postane skuplja?',
      pFlat: 'Bez rasta i poskupljenja',
      pFlatHint: 'Stalno 200 korisnika, iste cijene: u 5. godini obje su opcije platile jednako, od 6. pretplata više.',
      pLapse: 'Prekid održavanja',
      pLapseHint: 'Održavanje se ne plaća u 3. i 4. godini; povratak u 5. godini plaća propušteno i naknadu.',
      pPerCore: 'Po jezgri, sa zamjenom',
      pPerCoreHint: 'Licenca po jezgri: zamjena poslužitelja u 4. godini udvostruči jezgre po poslužitelju, a licenci je odjednom 2,4 puta više.',
      pCoreNoRefresh: 'Po jezgri, bez zamjene',
      pCoreNoRefreshHint: 'Licenca po jezgri, poslužitelji se samo dodaju: jezgre rastu u skokovima, s brojem poslužitelja.',
      pShort: 'Kratko razdoblje',
      pShortHint: 'Samo tri godine: trajna licenca se ne isplati, a dio njezine cijene još je imovina u bilanci.',
      legPerp: 'trajna licenca',
      legSub: 'pretplata',
      legBest: 'manje plaćenog novca',
      legCross: 'godina prijelaza',
      legChanged: 'promijenio se ishod',
      optPerp: 'Trajna licenca',
      optSub: 'Pretplata',
      subPerp: '{price} po licenci jednom, zatim {mf} godišnje održavanja',
      subSub: '{fee} po licenci godišnje',
      thOption: 'Opcija',
      thPaid: 'Plaćeno ukupno',
      thPaidSub: 'novac do kraja {h}. god.',
      thExp: 'U trošku',
      thExpSub: 'račun dobiti i gubitka',
      thBook: 'U bilanci',
      thBookSub: 'neamortizirano',
      thCross: 'Godina prijelaza',
      crossYear: '{n}. godina',
      crossNone: 'ne unutar {h} god.',
      crossWhat: 'od nje pretplata plaća više',
      cntTitle: 'Licence koje se broje svake godine',
      rowUsers: 'korisnici',
      rowCores: 'jezgre',
      rowCoresSub: 'poslužitelji × jezgre',
      counted: 'broji se',
      refreshMark: 'zamjena',
      cashTitle: 'Plaćeno do sada (početkom svake godine)',
      expTitle: 'Trošak u svakoj godini',
      kAmort: 'amortizacija',
      kMaint: 'održavanje',
      kBack: 'zaostalo i naknada',
      kSub: 'pretplata',
      kLapsed: 'održavanje prekinuto',
      crossLabel: 'prijelaz: {n}. god.',
      yearN: '{n}. g.',
      eur: '{n}\u00a0€',
      pct: '{n}\u00a0%',
      yrsOne: '{a}. godina',
      yrsMany: '{a}.–{b}. godina',
      capCross: 'Od {y}. godine pretplata je platila više novca od trajne licence; do kraja {h}. godine {s} prema {p}.',
      capNever: 'Do kraja {h}. godine pretplata nije platila više od trajne licence: {s} prema {p}; prijelaza nema.',
      nLapse: 'Održavanje je prekinuto ({years}) i {skip} nije plaćeno; povratak u {r}. godini stajao je {paid} (propuštene godine po cijenama {q}. godine i {fee} naknade), ukupno {extra} više nego bez prekida.',
      nUser: 'Po korisniku broj licenci prati ljude: {u1} → {uH}; po jezgri pratio bi opremu: {c1} → {cH} jezgri.',
      nCore: 'Po jezgri broj licenci prati opremu: {c1} → {cH} jezgri, a korisnici {u1} → {uH}.',
      nCoreRefresh: 'Po jezgri broj licenci prati opremu: zamjena u {r}. godini udvostruči jezgre po poslužitelju, pa {c1} → {cH} jezgri, a korisnici samo {u1} → {uH}.',
      nExpense: 'U 1. godini trajna licenca platila je {cash}, a u trošak je otišlo samo {exp}: licence su imovina koja se amortizira {life} godina; pretplata je sva odmah trošak.',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi; bez poreza i bez diskontiranja. Plaćanja početkom svake godine.',
      explain: '<p><b>Isti softver, dva načina plaćanja.</b> <i>Trajna licenca</i> (engl. <i lang="en">perpetual ' +
        'licence</i>) kupuje se jednom, po kataloškoj cijeni po licenci, i koristi bez roka; uz nju se svake godine ' +
        'plaća <i>održavanje</i> (nove verzije i podrška), obično 15 do 25\u00a0% kataloške cijene. <i>Pretplata</i> ' +
        '(engl. <i lang="en">subscription</i>) je godišnja naknada po licenci: kad se prestane plaćati, prestaje i ' +
        'pravo korištenja.</p>' +
        '<p><b>Novac i trošak nisu isto.</b> Kupljena trajna licenca je <i>nematerijalna imovina</i> (MRS 38): ' +
        'novac odlazi odjednom, a u trošak ide <i>amortizacijom</i> kroz korisni vijek (ovdje pet godina), pa dio ' +
        'cijene ostaje u bilanci. Održavanje je trošak svoje godine. Pretplata je sva trošak godine u kojoj se ' +
        'plaća i ništa ne ostavlja u bilanci.</p>' +
        '<p><b>Godina prijelaza.</b> Trajna licenca plaća puno na početku i malo kasnije, pretplata ravnomjerno; ' +
        'zbrojevi plaćenog novca sijeku se u godini od koje pretplata plaća više. Rast broja korisnika pomiče ' +
        'prijelaz kasnije, jer se svaka nova trajna licenca kupuje po punoj cijeni; kratko razdoblje ide u prilog ' +
        'pretplati.</p>' +
        '<p><b>Prekid održavanja.</b> Preskočeno održavanje štedi danas, ali nema novih verzija ni podrške. Za ' +
        'povratak se obično plaćaju sve propuštene godine, i to po novoj cijeni, uz naknadu za ponovnu aktivaciju: ' +
        'prekid na kraju stoji više.</p>' +
        '<p><b>Po korisniku ili po jezgri.</b> Licenca po korisniku raste s brojem ljudi; licenca po jezgri raste s ' +
        'opremom. Zamjena poslužitelja novima s više jezgri (manji se često više ne prodaju) povećava broj licenci, a da ' +
        'nije došao nijedan novi korisnik.</p>' +
        '<p><b>Pretpostavke.</b> 200 korisnika u 1. godini, jedan poslužitelj na 50 korisnika, 16 jezgri po ' +
        'poslužitelju, 32 nakon zamjene; trajna licenca 400\u00a0€ po korisniku ili 1\u00a0250\u00a0€ po jezgri; povratak nakon ' +
        'prekida uz 20\u00a0% naknade. Rast cijena vrijedi za nove licence, održavanje i pretplatu. Bez diskontiranja: ' +
        'vrijednost novca kroz vrijeme je zasebna tema.</p>'
    },
    en: {
      stage: 'The same licence bought outright or subscribed: cash paid, expense and the crossing year',
      growth: 'User growth (per year)',
      maint: 'Maintenance, % of list price a year',
      rise: 'Price rises (per year)',
      horizon: 'Horizon',
      horizonN: ['{n} year', '{n} years'],
      sub: 'Subscription, % of list price a year',
      metric: 'Licence counted',
      metricUser: 'per user',
      metricCore: 'per core',
      refresh: 'Hardware refresh',
      refreshNone: 'none',
      lapse: 'Maintenance lapses',
      lapseNone: 'never',
      gap: 'Back after',
      gapN: ['{n} yr', '{n} yrs'],
      yearOrd: 'yr {n}',
      pCrossing: 'The crossing year',
      pCrossingHint: '200 users growing 10% a year, maintenance 20%, prices +3%: when does the subscription cost more?',
      pFlat: 'No growth, no price rises',
      pFlatHint: 'Always 200 users at the same prices: by year 5 both have paid the same, from year 6 the subscription more.',
      pLapse: 'Maintenance lapses',
      pLapseHint: 'No maintenance in years 3 and 4; coming back in year 5 pays what was missed plus a fee.',
      pPerCore: 'Per core, with a refresh',
      pPerCoreHint: 'Licensed per core: the hardware refresh in year 4 doubles the cores per server, and the licences jump 2.4 times.',
      pCoreNoRefresh: 'Per core, no refresh',
      pCoreNoRefreshHint: 'Licensed per core, servers only added: the cores grow in steps, with the number of servers.',
      pShort: 'A short horizon',
      pShortHint: 'Only three years: the perpetual licence does not pay off, and part of its price is still an asset.',
      legPerp: 'perpetual licence',
      legSub: 'subscription',
      legBest: 'less cash paid',
      legCross: 'crossing year',
      legChanged: 'an outcome changed',
      optPerp: 'Perpetual licence',
      optSub: 'Subscription',
      subPerp: '{price} a licence once, then {mf} a year of maintenance',
      subSub: '{fee} a licence a year',
      thOption: 'Option',
      thPaid: 'Cash paid in total',
      thPaidSub: 'by the end of year {h}',
      thExp: 'Expensed',
      thExpSub: 'profit and loss',
      thBook: 'On the balance sheet',
      thBookSub: 'not yet amortised',
      thCross: 'Crossing year',
      crossYear: 'year {n}',
      crossNone: 'not within {h} years',
      crossWhat: 'the subscription costs more from then on',
      cntTitle: 'Licences counted each year',
      rowUsers: 'users',
      rowCores: 'cores',
      rowCoresSub: 'servers × cores',
      counted: 'counted',
      refreshMark: 'refresh',
      cashTitle: 'Cash paid so far (at the start of each year)',
      expTitle: 'Expense in each year',
      kAmort: 'amortisation',
      kMaint: 'maintenance',
      kBack: 'back-fees',
      kSub: 'subscription',
      kLapsed: 'maintenance lapsed',
      crossLabel: 'crossing: year {n}',
      yearN: 'yr {n}',
      eur: '€{n}',
      pct: '{n}%',
      yrsOne: 'year {a}',
      yrsMany: 'years {a}–{b}',
      capCross: 'From year {y} on the subscription has paid more cash than the perpetual licence; by the end of year {h}, {s} against {p}.',
      capNever: 'By the end of year {h} the subscription has paid no more than the perpetual licence: {s} against {p}; no crossing.',
      nLapse: 'Maintenance lapsed in {years}, {skip} not paid; coming back in year {r} cost {paid} (the missed years at year-{q} prices plus a {fee} fee), {extra} more in all than staying current.',
      nUser: 'Per user, the licences follow the people: {u1} → {uH}; per core they would follow the hardware: {c1} → {cH} cores.',
      nCore: 'Per core, the licences follow the hardware: {c1} → {cH} cores, while users went {u1} → {uH}.',
      nCoreRefresh: 'Per core, the licences follow the hardware: the refresh in year {r} doubles the cores per server, so {c1} → {cH} cores while users went only {u1} → {uH}.',
      nExpense: 'In year 1 the perpetual licence paid {cash} but expensed only {exp}: the licences are an asset amortised over {life} years; the subscription is all expense at once.',
      illustrative: 'Amounts are made up but plausible; no taxes, no discounting. Payments at the start of each year.',
      explain: '<p><b>The same software, two ways to pay.</b> A <i>perpetual licence</i> is bought once, at the list ' +
        'price per licence, and used without end; on top, a yearly <i>maintenance</i> fee (new versions and ' +
        'support) of usually 15 to 25% of the list price. A <i>subscription</i> is a yearly fee per licence: stop ' +
        'paying and the right to use it stops too.</p>' +
        '<p><b>Cash and expense are not the same.</b> A bought perpetual licence is an <i>intangible asset</i> ' +
        '(IAS 38): the cash leaves at once, and it reaches the expense through <i>amortisation</i> over its useful ' +
        'life (five years here), so part of the price stays on the balance sheet. Maintenance is an expense of its ' +
        'year. A subscription is all expense in the year it is paid and leaves nothing on the balance sheet.</p>' +
        '<p><b>The crossing year.</b> The perpetual licence pays a lot at first and little later, the subscription ' +
        'evenly; the running totals of cash cross in the year from which the subscription has paid more. User ' +
        'growth moves the crossing later, because every new perpetual licence is bought at full price; a short ' +
        'horizon favours the subscription.</p>' +
        '<p><b>Letting maintenance lapse.</b> Skipping maintenance saves money today, but brings no new versions ' +
        'and no support. Coming back usually means paying every missed year, at the new price, plus a ' +
        'reinstatement fee: the lapse ends up costing more.</p>' +
        '<p><b>Per user or per core.</b> A per-user licence grows with the people; a per-core licence grows with ' +
        'the hardware. Refreshing the servers with new ones that have more cores (the smaller ones are often no longer ' +
        'sold) raises the licence count without a single new user.</p>' +
        '<p><b>Assumptions.</b> 200 users in year 1, one server per 50 users, 16 cores per server, 32 after the ' +
        'refresh; a perpetual licence costs €400 per user or €1,250 per core; coming back after a lapse adds a 20% ' +
        'fee. Price rises apply to new licences, maintenance and the subscription. No discounting: the time value ' +
        'of money is a topic of its own.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
