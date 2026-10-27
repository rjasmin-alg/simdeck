/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of link-state-spf, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   Router names, costs, distances and sequence numbers are data (translate="no"), filled in by the page.
   Most terms this page needs are not in kit/glossary.js yet (NOTES.md "Term pairs"), so they are written out: on the
   Croatian page the English term in italics with the Croatian in parentheses. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Pet usmjernika s bazama stanja veza, Dijkstrina tablica izvora i njegova tablica usmjeravanja',
      router: 'usmjernik {r}',
      lsdbHead: 'LSDB',
      lsdbOf: 'LSDB usmjernika {r}',
      ownLinks: 'Vlastite veze:',
      colRouter: 'usmjernik',
      colDist: 'udaljenost',
      colVia: 'sljedeći skok',
      colState: 'stanje',
      colDest: 'odredište',
      colCost: 'cijena',
      stFinal: 'konačan',
      stTent: 'privremen',
      stNone: 'nepoznat',
      spfTitle: 'SPF na usmjerniku {r}',
      spfWait: 'SPF počinje kad LSDB usmjernika {r} bude potpun.',
      rtTitle: 'Tablica usmjeravanja usmjernika {r}',
      rtOld: 'prije promjene',
      rtEmpty: 'prazna: SPF još nije gotov',

      phStart: 'Početak',
      phConv: 'Usklađena mreža',
      phChange: 'Promjena',
      phOrig: 'Novi LSA-ovi',
      phFlood: 'Preplavljivanje, krug {k}',
      phSpf: 'SPF, odabir {k}',
      phTable: 'Tablica usmjeravanja',
      phDone: 'gotovo',
      chgCost: 'B–C: cijena {from} → {to}',
      chgFail: '{l} u kvaru',

      pSource: 'Izvor SPF-a',
      pCost: 'Cijena veze B–C',
      pFail: 'Kvar veze',
      failNone: 'nema',
      pFlood: 'Prikaži preplavljivanje',
      pFloodHint: 'Isključeno: baze su odmah potpune, počinje SPF.',

      prA: 'SPF iz A',
      prCost: 'Promjena cijene',
      prFail: 'Kvar veze',
      prE: 'SPF iz E',
      prAHint: 'Dva kruga preplavljivanja, zatim Dijkstra iz A.',
      prCostHint: 'B–C s 1 na 5: dva jednako dobra puta do D.',
      prFailHint: 'C–D u kvaru: novi LSA-ovi, novi izračun.',
      prEHint: 'Ista baza, drugo stablo.',

      legCost: 'cijena veze',
      legLsa: 'LSA na vezi, u boji izvora',
      legDup: 'već viđena kopija: odbačena',
      legTent: 'privremen',
      legFinal: 'konačan',
      legTree: 'stablo najkraćih puteva',
      legEcmp: 'jednako dobri putevi',
      legChanged: 'novo u ovom koraku',

      and: ' i ',
      listSep: ', ',
      copies: ['{n} kopija LSA', '{n} kopije LSA', '{n} kopija LSA'],

      capStartCold: 'Pet usmjernika; broj na vezi je njezina cijena, {term} (metrika). Svaki usmjernik zna samo svoje veze; ' +
        'baze stanja veza (LSDB) su prazne.',
      termMetric: 'metric',
      capStartFull: 'Preplavljivanje je preskočeno: svaki LSDB već drži svih pet LSA-ova, isto na svakom usmjerniku. ' +
        'Od koraka 1 usmjernik {r} računa najkraće puteve.',
      capStartConv: 'Mreža je usklađena: svaki LSDB drži svih pet LSA-ova s rednim brojem 1, a tablica usmjeravanja usmjernika {r} ' +
        'izračunata je iz njih. U koraku 1: {change}.',
      chgCostLong: 'cijena veze B–C mijenja se s {from} na {to}',
      chgFailLong: 'veza {l} otkazuje',
      capChange: 'Korak {n}: {change}. To vide samo usmjernici na krajevima: {ends}. Ostali još imaju staru sliku mreže.',
      capChangeHidden: 'Preplavljivanje je skriveno: njihovi novi LSA-ovi (redni broj {seq}) odmah stižu u svaki LSDB.',
      capOrigCold: 'Korak {n}: svaki usmjernik piše jedan {term} (oglas o stanju veze, LSA) s popisom samo svojih veza i ' +
        'njihovih cijena, redni broj 1, i sprema ga u svoj LSDB.',
      termLsa: 'link-state advertisement',
      capOrigChange: 'Korak {n}: {ends} pišu nove LSA-ove s rednim brojem {seq}. Kopije s rednim brojem {old} u ostalim bazama sada su zastarjele.',
      capFlood: 'Krug {k}: {copies} na vezama. Kopiju koja mu je nova usmjernik sprema i šalje na sve ostale veze ({fresh}); ' +
        'kopiju koju već ima odbacuje i ne šalje dalje ({dups}).',
      capFloodFirst: 'Krug {k}: {copies} na vezama. Svaka je primatelju nova: sprema je i u idućem krugu šalje na sve ostale veze. ' +
        'To je {term} (preplavljivanje).',
      termFlood: 'flooding',
      capFloodNewer: 'Veći redni broj znači noviji LSA: on zamjenjuje staru kopiju.',
      capFloodDone: 'Sada svaki usmjernik drži svih pet LSA-ova. Pet baza stanja veza je identično; svaki će usmjernik pokrenuti SPF ' +
        'na vlastitoj kopiji.',
      capFloodDoneChange: 'Sada svaki LSDB drži nove LSA-ove usmjernika {ends}; baze su opet identične i svaki usmjernik ponovno pokreće SPF.',
      capSpfFirst: 'Korak {n}: {r} pokreće SPF na vlastitom LSDB-u i sam je konačan s udaljenošću 0.',
      capPick: 'Korak {n}: {r} postaje konačan s udaljenošću {d}.',
      relNew: '{v} dobiva udaljenost {d} preko {u}, sljedeći skok {nh}.',
      relNewTwo: '{v} dobiva udaljenost {d} preko {u}, sljedeće skokove {nh}.',
      relBetterTwo: 'Put {path} košta {d}, manje od {old} preko {oldLink}, pa {v} dobiva novu udaljenost i sljedeće skokove {nh}.',
      relBetterSame: 'Put {path} košta {d}, manje od {old} preko {oldLink}, pa {v} dobiva novu udaljenost i isti sljedeći skok: {nh}.',
      relBetterNew: 'Put {path} košta {d}, manje od {old} preko {oldLink}, pa {v} dobiva novu udaljenost i novi sljedeći skok: {nh}.',
      relEqual: 'Put {path} također košta {d}: {v} sada ima oba sljedeća skoka, {nh}. To je {term} (višestruki putevi jednake cijene).',
      termEcmp: 'equal-cost multipath',
      relEqualSame: 'Put {path} također košta {d}; sljedeći skok ostaje {nh}.',
      relWorse: 'Preko {u} bi {v} koštao {d}, ne manje od {old}: ništa se ne mijenja.',
      capNoNews: 'Svi su njegovi susjedi već konačni: ništa se ne mijenja.',
      capAllFinal: 'Svi su usmjernici konačni: stablo najkraćih puteva je gotovo.',
      capTable: 'Korak {n}: tablica usmjeravanja usmjernika {r}. Za svako odredište cijena i sljedeći skok: prvi usmjernik iza {r} ' +
        'na najkraćem putu.',
      capTableOne: 'Svaki sljedeći skok je {h}.',
      capTableEcmp: 'Za {ds} dva sljedeća skoka: jednako dobri putevi.',
      capTableChanged: 'Promijenjeni retci: {ds}.',
      capTableSame: 'Nijedan se redak nije promijenio.',

      explain: '<p>Usmjernici s protokolom stanja veze (<i>link state</i>, npr. OSPF) ne razmjenjuju tablice usmjeravanja. ' +
        'Svaki usmjernik napiše jedan <i>link-state advertisement</i> (oglas o stanju veze, LSA) s popisom samo svojih veza i ' +
        'njihovih cijena, i taj oglas <i>flooding</i> (preplavljivanje) prenese svima: usmjernik koji primi LSA noviji od svoje ' +
        'kopije (veći redni broj) spremi ga i pošalje na sve ostale veze, a kopiju koju već ima odbaci.</p>' +
        '<p>Kad preplavljivanje završi, svi usmjernici imaju istu <i>link-state database</i> (bazu stanja veza, LSDB), istu kartu ' +
        'cijele mreže. Iz nje svaki usmjernik sam, Dijkstrinim algoritmom (<i>shortest path first</i>, SPF), izračuna najkraće ' +
        'puteve od sebe do svih ostalih. Isti LSDB, različita stabla: SPF iz E daje druge sljedeće skokove nego SPF iz A.</p>' +
        '<p>Dijkstra: izvor ima udaljenost 0. U svakom koraku privremeni usmjernik s najmanjom udaljenošću postaje konačan ' +
        '(kod jednakih udaljenosti ovdje ide prvi po abecedi), a susjed kojemu je put preko njega kraći dobiva novu udaljenost i ' +
        'sljedeći skok. Jednako dobar put dodaje drugi sljedeći skok (<i>equal-cost multipath</i>, ECMP).</p>' +
        '<p>Pobjeđuje najmanji zbroj cijena, <i>metric</i> (metrika), ne najmanji broj skokova: A–C je jedan skok, ali s cijenom 5 ' +
        'gubi od A–B–C s cijenom 3. Ovdje su cijene zadane ručno (1–10); usmjernici ih često sami računaju kao referentnu ' +
        'brzinu podijeljenu brzinom sučelja.</p>' +
        '<p>Promjena cijene ili kvar veze: usmjernici na krajevima te veze pišu nove LSA-ove s rednim brojem većim za jedan, oni se ' +
        'preplave, i svaki usmjernik ponovno računa SPF. Za razliku od protokola vektora udaljenosti, nitko ne čeka da mu susjed ' +
        'javi svoju tablicu.</p>'
    },

    en: {
      stage: 'Five routers with their link-state databases, the source\'s Dijkstra table and its routing table',
      router: 'router {r}',
      lsdbHead: 'LSDB',
      lsdbOf: 'LSDB of router {r}',
      ownLinks: 'Own links:',
      colRouter: 'router',
      colDist: 'distance',
      colVia: 'next hop',
      colState: 'state',
      colDest: 'destination',
      colCost: 'cost',
      stFinal: 'final',
      stTent: 'tentative',
      stNone: 'unknown',
      spfTitle: 'SPF at router {r}',
      spfWait: 'SPF starts once the LSDB of {r} is complete.',
      rtTitle: 'Routing table of router {r}',
      rtOld: 'before the change',
      rtEmpty: 'empty: SPF has not finished',

      phStart: 'Start',
      phConv: 'Converged network',
      phChange: 'Change',
      phOrig: 'New LSAs',
      phFlood: 'Flooding, round {k}',
      phSpf: 'SPF, pick {k}',
      phTable: 'Routing table',
      phDone: 'done',
      chgCost: 'B–C: cost {from} → {to}',
      chgFail: '{l} fails',

      pSource: 'SPF source',
      pCost: 'Cost of link B–C',
      pFail: 'Failed link',
      failNone: 'none',
      pFlood: 'Show flooding',
      pFloodHint: 'Off: the databases are complete at once and SPF starts.',

      prA: 'SPF from A',
      prCost: 'Cost change',
      prFail: 'Link fails',
      prE: 'SPF from E',
      prAHint: 'Two flooding rounds, then Dijkstra from A.',
      prCostHint: 'B–C from 1 to 5: two equal paths to D.',
      prFailHint: 'C–D fails: new LSAs, a new run.',
      prEHint: 'Same database, a different tree.',

      legCost: 'link cost',
      legLsa: 'LSA on a link, in its origin\'s colour',
      legDup: 'copy already held: dropped',
      legTent: 'tentative',
      legFinal: 'final',
      legTree: 'shortest-path tree',
      legEcmp: 'equal-cost paths',
      legChanged: 'new this step',

      and: ' and ',
      listSep: ', ',
      copies: ['{n} LSA copy', '{n} LSA copies'],

      capStartCold: 'Five routers; the number on a link is its cost, the {term}. Each router knows only its own links; ' +
        'the link-state databases (LSDB) are empty.',
      termMetric: 'metric',
      capStartFull: 'Flooding is skipped: every LSDB already holds all five LSAs, the same on every router. ' +
        'From step 1, router {r} computes the shortest paths.',
      capStartConv: 'The network has converged: every LSDB holds all five LSAs with sequence number 1, and the routing table ' +
        'of {r} was computed from them. At step 1: {change}.',
      chgCostLong: 'the cost of link B–C changes from {from} to {to}',
      chgFailLong: 'link {l} fails',
      capChange: 'Step {n}: {change}. Only the routers at the link ends see it: {ends}. The others still hold the old picture.',
      capChangeHidden: 'Flooding is hidden: their new LSAs (sequence number {seq}) reach every LSDB at once.',
      capOrigCold: 'Step {n}: each router writes one {term} (LSA) that lists only its own links and their costs, ' +
        'sequence number 1, and stores it in its own LSDB.',
      termLsa: 'link-state advertisement',
      capOrigChange: 'Step {n}: {ends} write new LSAs with sequence number {seq}. The copies with sequence number {old} in the ' +
        'other databases are now out of date.',
      capFlood: 'Round {k}: {copies} on the links. A router stores a copy that is new to it and sends it on all its other links ' +
        '({fresh}); a copy it already holds is dropped, not sent on ({dups}).',
      capFloodFirst: 'Round {k}: {copies} on the links. Each one is new to its receiver, which stores it and sends it on all its ' +
        'other links next round. This is {term}.',
      termFlood: 'flooding',
      capFloodNewer: 'A higher sequence number means a newer LSA: it replaces the old copy.',
      capFloodDone: 'Every router now holds all five LSAs. The five link-state databases are identical; each router will run ' +
        'SPF on its own copy.',
      capFloodDoneChange: 'Every LSDB now holds the new LSAs of {ends}; the databases are identical again and every router reruns SPF.',
      capSpfFirst: 'Step {n}: {r} starts SPF on its own LSDB and is itself final with distance 0.',
      capPick: 'Step {n}: {r} becomes final with distance {d}.',
      relNew: '{v} gets distance {d} via {u}, next hop {nh}.',
      relNewTwo: '{v} gets distance {d} via {u}, next hops {nh}.',
      relBetterTwo: 'The path {path} costs {d}, less than {old} via {oldLink}, so {v} gets the new distance and the next hops {nh}.',
      relBetterSame: 'The path {path} costs {d}, less than {old} via {oldLink}, so {v} gets the new distance and the same next hop: {nh}.',
      relBetterNew: 'The path {path} costs {d}, less than {old} via {oldLink}, so {v} gets the new distance and a new next hop: {nh}.',
      relEqual: 'The path {path} costs {d} too: {v} now has both next hops, {nh}. This is {term}.',
      termEcmp: 'equal-cost multipath',
      relEqualSame: 'The path {path} costs {d} too; the next hop stays {nh}.',
      relWorse: 'Via {u}, {v} would cost {d}, not less than {old}: no change.',
      capNoNews: 'All its neighbours are final already: nothing changes.',
      capAllFinal: 'Every router is final: the shortest-path tree is complete.',
      capTable: 'Step {n}: the routing table of {r}. For each destination the cost and the next hop: the first router after ' +
        '{r} on the shortest path.',
      capTableOne: 'Every next hop is {h}.',
      capTableEcmp: '{ds}: two next hops, equal-cost paths.',
      capTableChanged: 'Rows that changed: {ds}.',
      capTableSame: 'No row changed.',

      explain: '<p>Routers that run a <i>link state</i> protocol, such as OSPF, do not exchange routing tables. Each router ' +
        'writes one <i>link-state advertisement</i> (LSA) that lists only its own links and their costs, and ' +
        '<i>flooding</i> carries it to everyone: a router that receives an LSA newer than its copy (a higher sequence number) ' +
        'stores it and sends it on all its other links, and drops a copy it already holds.</p>' +
        '<p>When flooding is over, every router holds the same <i>link-state database</i> (LSDB), the same map of the whole ' +
        'network. From it each router, on its own, computes the shortest paths from itself to all the others with ' +
        'Dijkstra\'s algorithm (<i>shortest path first</i>, SPF). Same LSDB, different trees: SPF from E gives other next ' +
        'hops than SPF from A.</p>' +
        '<p>Dijkstra: the source has distance 0. At each step the tentative router with the smallest distance becomes final ' +
        '(on equal distances, here the first in alphabetical order), and a neighbour for which the path through it is shorter ' +
        'gets the new distance and next hop. An equally good path adds a second next hop (<i>equal-cost multipath</i>, ECMP).</p>' +
        '<p>The smallest sum of costs, the <i>metric</i>, wins, not the fewest hops: A–C is one hop, but at cost 5 it loses to ' +
        'A–B–C at cost 3. Here the costs are set by hand (1–10); routers often compute them as a reference bandwidth divided ' +
        'by the interface bandwidth.</p>' +
        '<p>A cost change or a failed link: the routers at its ends write new LSAs with the sequence number one higher, these ' +
        'are flooded, and every router runs SPF again. Unlike a distance vector protocol, nobody waits for a neighbour to pass ' +
        'on its table.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
