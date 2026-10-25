/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of distance-vector, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   Router names, metrics and the vectors on the wire are data (translate="no"), filled in by the page.
   The terms this page needs are not in kit/glossary.js yet (NOTES.md "Term pairs"), so they are written out: on the
   Croatian page the English term in italics with the Croatian in parentheses. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Usmjernici i njihove tablice usmjeravanja',
      router: 'usmjernik {r}',
      routerWord: 'usmjernik',
      netName: 'mreža N',
      colDest: 'odredište',
      colMetric: 'metrika',
      colVia: 'sljedeći skok',
      direct: 'izravno',
      empty: 'prazna tablica',
      stStart: 'Početak',
      stRound: 'Krug {k}',
      stCut: 'Prekid veze',
      stDown: 'Mreža N ne radi',
      stDone: 'gotovo',

      pMode: 'Način',
      modePlain: 'osnovni',
      modeSplit: 'podijeljeni horizont',
      modePoison: 'otrovani povratak',
      pCut: 'Veza za prekid',
      pTopo: 'Mreža',
      pStart: 'Početak',
      pEvents: 'Događaji',
      bCut: 'Prekini vezu',
      bDown: 'Isključi mrežu N',

      prCold: 'Učenje od nule',
      prCti: 'Brojanje do beskonačnosti',
      prSplit: 'Podijeljeni horizont',
      prRing: 'Prsten: novi put',
      prTri: 'Trokut bez zaštite',
      prRingSplit: 'Prsten: horizont ne pomaže',
      prColdHint: 'Krug po krug, put do N širi se od C.',
      prCtiHint: 'Korak 1: mreža N prestaje raditi.',
      prSplitHint: 'Isti kvar, s podijeljenim horizontom.',
      prRingHint: 'Korak 3: prekid veze B–C.',
      prTriHint: 'Korak 1: prekid veze C–D.',
      prRingSplitHint: 'Isti kvar u prstenu, s podijeljenim horizontom.',

      legVia: 'preko susjeda',
      legDirect: 'izravno spojena',
      legInf: '16 = nedostupno',
      legSupp: 'zadržano',
      legChanged: 'promijenjeno',
      legSel: 'veza za prekid',

      and: ' i ',
      listSep: ', ',
      hops: ['{n} skok', '{n} skoka', '{n} skokova'],
      rounds: ['{n} kruga', '{n} kruga', '{n} krugova'],

      capStartCold: 'Početak: samo usmjernik {r} zna za mrežu N — izravno je spojena, metrika 1. Ostale su tablice prazne. ' +
        'U svakom krugu svaki usmjernik šalje susjedima cijelu svoju tablicu.',
      capStartConv: 'Tablice su usklađene: svaki usmjernik zna koliko je skokova do mreže N i preko kojeg susjeda, ' +
        'ali ne zna kako izgleda cijela mreža.',
      capDown: 'Mreža N na usmjerniku {r} prestaje raditi: {r} upisuje metriku 16 (nedostupno). Susjedi to još ne znaju.',
      capDownNoop: 'Mreža N već ne radi: ništa se ne mijenja.',
      capCut: 'Veza {l} je prekinuta.',
      capCutLost: ['{rs} gubi put preko nje i upisuje 16; drugi to još ne znaju.', '{rs} gube put preko nje i upisuju 16; drugi to još ne znaju.',
        '{rs} gube put preko nje i upisuju 16; drugi to još ne znaju.'],
      capCutNone: 'Nijedan put nije išao preko nje, pa se tablice ne mijenjaju.',
      capCutNoop: 'Veza {l} je već prekinuta: ništa se ne mijenja.',
      capRound: 'Krug {k}:',
      capQuiet: 'nijedna se tablica nije promijenila.',
      capNew: ['{rs} uči put do mreže N: metrika {m}, sljedeći skok {s}.', '{rs} uče put do mreže N: metrika {m}, sljedeći skok {s}.',
        '{rs} uče put do mreže N: metrika {m}, sljedeći skok {s}.'],
      capBetter: ['{rs} prelazi na susjeda {s}: metrika {m} umjesto {old}.', '{rs} prelaze na susjeda {s}: metrika {m} umjesto {old}.',
        '{rs} prelaze na susjeda {s}: metrika {m} umjesto {old}.'],
      capNextInf: ['{rs} vjeruje svom sljedećem skoku {s}, koji javlja 16, i upisuje 16.',
        '{rs} vjeruju svom sljedećem skoku {s}, koji javlja 16, i upisuju 16.',
        '{rs} vjeruju svom sljedećem skoku {s}, koji javlja 16, i upisuju 16.'],
      capNextUp: ['{rs} vjeruje svom sljedećem skoku {s}: metrika je sada {m}.', '{rs} vjeruju svom sljedećem skoku {s}: metrika je sada {m}.',
        '{rs} vjeruju svom sljedećem skoku {s}: metrika je sada {m}.'],
      capFalseNext: ['{rs} još vjeruje susjedu {s}, koji javlja {hops} do mreže N, pa upisuje {m}',
        '{rs} još vjeruju susjedu {s}, koji javlja {hops} do mreže N, pa upisuju {m}',
        '{rs} još vjeruju susjedu {s}, koji javlja {hops} do mreže N, pa upisuju {m}'],
      capFalseBetter: ['{rs} prihvaća stari put susjeda {s}: metrika {m} umjesto {old}', '{rs} prihvaćaju stari put susjeda {s}: metrika {m} umjesto {old}',
        '{rs} prihvaćaju stari put susjeda {s}: metrika {m} umjesto {old}'],
      capFalseNew: ['{rs} uči stari put susjeda {s}: metrika {m}', '{rs} uče stari put susjeda {s}: metrika {m}', '{rs} uče stari put susjeda {s}: metrika {m}'],
      falseGone: ' — a mreža N više ne postoji.',
      falseCut: ' — a puta do mreže N više nema.',
      capCti: 'To je {term} (brojanje do beskonačnosti): lažni put se vraća, svaki krug za jedan skok dulji.',
      termCti: 'count to infinity',
      capSplitOne: 'Uz {term} (podijeljeni horizont) {s} više ne javlja susjedu {r} put koji je naučio od njega',
      capSplitMany: '{term} (podijeljeni horizont) zadržava {pairs}: usmjernik ne javlja put susjedu od kojeg ga je naučio',
      termSplit: 'Split horizon',
      capPoisonOne: 'Uz {term} (otrovani povratak) {s} javlja susjedu {r} put naučen od njega s metrikom 16',
      capPoisonMany: '{term} (otrovani povratak) šalje {pairs} s metrikom 16: put se susjedu od kojeg je naučen javlja kao nedostupan',
      horizonHelps: ', pa se stari put ne vraća onome od koga je došao.',
      horizonFails: ' — ali lažni put stiže drugim putem, kroz petlju.',
      termPoison: 'Poisoned reverse',
      termSplitLower: 'split horizon',
      termPoisonLower: 'poisoned reverse',
      capEndQuiet: 'Tablice su usklađene: to je {term} (konvergencija).',
      termConv: 'convergence',
      capEndUnreach: 'Nijedan usmjernik odsječen od mreže N više nema put do nje: loša vijest stigla je do svih nakon {rounds}.',
      capLimit: 'Simulacija staje na koraku 20; brojanje bi se nastavilo do 16.',
      noteCutAgain: 'Veza {l} je već prekinuta.',
      noteDownAgain: 'Mreža N već ne radi.',
      noteLate: 'Nakon koraka 20 nema više koraka.',

      explain: '<p>Usmjernici koji koriste <i>distance vector</i> (protokol vektora udaljenosti), poput RIP-a, ne vide cijelu mrežu. ' +
        'Svaki zna samo svoje susjede i ono što mu oni jave: u svakom krugu svaki usmjernik pošalje susjedima cijelu svoju ' +
        '<i>routing table</i> (tablica usmjeravanja). Ovdje svi šalju istodobno, iz tablice kakva je bila na početku kruga.</p>' +
        '<p>Metrika je <i>hop count</i> (broj skokova): izravno spojena mreža ima 1, a metrika m koju javi susjed postaje m + 1. ' +
        'Usmjernik prihvaća put koji još nema ili koji je strogo kraći; jednako dobra ponuda drugog susjeda ne mijenja ništa ' +
        '(dvije jednake nove ponude u istom krugu: pobjeđuje susjed ranije po abecedi). Svom <i>next hop</i> (sljedeći skok) ' +
        'vjeruje uvijek, i kad javi gore — samo tako loša vijest može putovati. Neki usmjernici u ispisu pokazuju naučeni put ' +
        'za jedan manje, jer izravno spojenoj mreži daju 0.</p>' +
        '<p>Metrika 16 znači nedostupno, pa put ne smije biti dulji od 15 skokova. Kad mreža nestane, dva se usmjernika mogu ' +
        'jedan na drugoga osloniti i javljati si stari put, svaki put skok dulji, dok ne dođu do 16. To je ' +
        '<i>count to infinity</i> (brojanje do beskonačnosti); dok traje, paketi kruže u <i>routing loop</i> ' +
        '(petlja usmjeravanja). Zato je beskonačnost tako mala.</p>' +
        '<p><i>Split horizon</i> (podijeljeni horizont): usmjernik ne javlja put susjedu od kojeg ga je naučio. ' +
        '<i>Poisoned reverse</i> (otrovani povratak): javlja ga, ali s metrikom 16. Oboje zaustavlja petlju dvaju usmjernika, ' +
        'ali ne i petlju kroz tri ili više njih: u prstenu A ima drugog susjeda, koji mu put nije dao, pa mu A stari put smije ' +
        'javiti (primjer 6). U stvarnoj mreži krugovi nisu usklađeni, pa redoslijed poruka mijenja gdje se i kada petlja pojavi.</p>' +
        '<p><i>Convergence</i> (konvergencija) je stanje u kojem se nijedna tablica više ne mijenja. Pravi RIP šalje tablicu ' +
        'svakih 30 s, put proglašava nedostupnim nakon 180 s bez vijesti i briše ga 120 s nakon toga, a ima i okidana ' +
        'ažuriranja i zadržavanje puta. To je ovdje izostavljeno: jedan korak je jedan krug.</p>'
    },
    en: {
      stage: 'Routers and their routing tables',
      router: 'router {r}',
      routerWord: 'router',
      netName: 'network N',
      colDest: 'destination',
      colMetric: 'metric',
      colVia: 'next hop',
      direct: 'direct',
      empty: 'empty table',
      stStart: 'Start',
      stRound: 'Round {k}',
      stCut: 'Link cut',
      stDown: 'Network N down',
      stDone: 'done',

      pMode: 'Mode',
      modePlain: 'plain',
      modeSplit: 'split horizon',
      modePoison: 'poisoned reverse',
      pCut: 'Link to cut',
      pTopo: 'Network',
      pStart: 'Start',
      pEvents: 'Events',
      bCut: 'Cut link',
      bDown: 'Take network N down',

      prCold: 'Cold start',
      prCti: 'Count to infinity',
      prSplit: 'Split horizon',
      prRing: 'Ring: reroute',
      prTri: 'Triangle, plain',
      prRingSplit: 'Ring: split horizon fails',
      prColdHint: 'Round by round, the route to N spreads out from C.',
      prCtiHint: 'Step 1: network N goes down.',
      prSplitHint: 'The same failure, with split horizon.',
      prRingHint: 'Step 3: link B–C is cut.',
      prTriHint: 'Step 1: link C–D is cut.',
      prRingSplitHint: 'The same failure in a ring, with split horizon.',

      legVia: 'via a neighbour',
      legDirect: 'directly connected',
      legInf: '16 = unreachable',
      legSupp: 'held back',
      legChanged: 'changed',
      legSel: 'link to cut',

      and: ' and ',
      listSep: ', ',
      hops: ['{n} hop', '{n} hops'],
      rounds: ['{n} round', '{n} rounds'],

      capStartCold: 'Start: only router {r} knows network N — it is directly connected, metric 1. The other tables are empty. ' +
        'Every round, each router sends its whole table to its neighbours.',
      capStartConv: 'The tables have converged: each router knows how many hops away network N is and through which neighbour, ' +
        'but not what the whole network looks like.',
      capDown: 'Network N on router {r} goes down: {r} writes metric 16 (unreachable). The neighbours do not know yet.',
      capDownNoop: 'Network N is already down: nothing changes.',
      capCut: 'Link {l} is cut.',
      capCutLost: ['{rs} loses its route across it and writes 16; the others do not know yet.',
        '{rs} lose their routes across it and write 16; the others do not know yet.'],
      capCutNone: 'No route went across it, so no table changes.',
      capCutNoop: 'Link {l} is already cut: nothing changes.',
      capRound: 'Round {k}:',
      capQuiet: 'no table changed.',
      capNew: ['{rs} learns a route to network N: metric {m}, next hop {s}.', '{rs} learn a route to network N: metric {m}, next hop {s}.'],
      capBetter: ['{rs} switches to neighbour {s}: metric {m} instead of {old}.', '{rs} switch to neighbour {s}: metric {m} instead of {old}.'],
      capNextInf: ['{rs} believes its next hop {s}, which reports 16, and writes 16.',
        '{rs} believe their next hop {s}, which reports 16, and write 16.'],
      capNextUp: ['{rs} believes its next hop {s}: the metric is now {m}.', '{rs} believe their next hop {s}: the metric is now {m}.'],
      capFalseNext: ['{rs} still believes neighbour {s}, which reports {hops} to network N, so it writes {m}',
        '{rs} still believe neighbour {s}, which reports {hops} to network N, so they write {m}'],
      capFalseBetter: ['{rs} takes the old route of neighbour {s}: metric {m} instead of {old}',
        '{rs} take the old route of neighbour {s}: metric {m} instead of {old}'],
      capFalseNew: ['{rs} learns the old route of neighbour {s}: metric {m}', '{rs} learn the old route of neighbour {s}: metric {m}'],
      falseGone: ' — but network N no longer exists.',
      falseCut: ' — but there is no path to network N any more.',
      capCti: 'This is {term}: the false route keeps coming back, one hop longer each round.',
      termCti: 'count to infinity',
      capSplitOne: 'With {term}, {s} no longer tells {r} about the route it learned from {r}',
      capSplitMany: '{term} holds back {pairs}: a router does not advertise a route to the neighbour it learned it from',
      termSplit: 'Split horizon',
      capPoisonOne: 'With {term}, {s} tells {r} the route it learned from {r} with metric 16',
      capPoisonMany: '{term} sends {pairs} with metric 16: a route goes back to the neighbour it came from as unreachable',
      horizonHelps: ', so the old route does not go back to where it came from.',
      horizonFails: ' — but the false route arrives another way, round the loop.',
      termPoison: 'Poisoned reverse',
      termSplitLower: 'split horizon',
      termPoisonLower: 'poisoned reverse',
      capEndQuiet: 'The tables have settled: this is {term}.',
      termConv: 'convergence',
      capEndUnreach: 'No router cut off from network N has a route to it any more: the bad news has reached everyone after {rounds}.',
      capLimit: 'The run stops at step 20; the count would go on up to 16.',
      noteCutAgain: 'Link {l} is already cut.',
      noteDownAgain: 'Network N is already down.',
      noteLate: 'There are no steps after step 20.',

      explain: '<p>Routers that run a <i>distance vector</i> protocol, such as RIP, do not see the whole network. Each one knows ' +
        'only its neighbours and what they tell it: every round, each router sends its whole <i>routing table</i> to its ' +
        'neighbours. Here they all send at once, from the table as it was at the start of the round.</p>' +
        '<p>The metric is the <i>hop count</i>: a directly connected network has 1, and a metric m reported by a neighbour ' +
        'becomes m + 1. A router accepts a route it does not have yet or one that is strictly shorter; an equally good offer ' +
        'from another neighbour changes nothing (two equal new offers in the same round: the neighbour first in name order ' +
        'wins). It always believes its <i>next hop</i>, even when the news is worse — that is the only way bad news can ' +
        'travel. Some routers print a learned route one lower, because they give a directly connected network 0.</p>' +
        '<p>Metric 16 means unreachable, so no path may be longer than 15 hops. When a network disappears, two routers can ' +
        'lean on each other and keep telling each other the old route, one hop longer each time, until they reach 16. That ' +
        'is <i>count to infinity</i>; while it lasts, packets go round a <i>routing loop</i>. This is why infinity is ' +
        'so small.</p>' +
        '<p><i>Split horizon</i>: a router does not advertise a route to the neighbour it learned it from. ' +
        '<i>Poisoned reverse</i>: it does, but with metric 16. Both stop a loop between two routers, but not a loop through ' +
        'three or more: in a ring, A has a second neighbour that never gave it the route, so A may tell it the old route ' +
        '(example 6). In a real network the rounds are not in step, so the order of the messages changes where and when ' +
        'the loop appears.</p>' +
        '<p><i>Convergence</i> is the state in which no table changes any more. Real RIP sends its table every 30 s, marks a ' +
        'route unreachable after 180 s without news and deletes it 120 s later, and it also has triggered updates and ' +
        'hold-down. All of that is left out here: one step is one round.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
