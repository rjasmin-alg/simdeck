/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the bgp-path-selection page, in both languages (docs/sim-ui.md §9). Same keys in hr and
   en; the page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an
   array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come from sim.json.
   Croatian: the BGP terms are not in kit/glossary.js yet (NOTES.md "Term pairs"), so the explanation writes each
   pair out, English in italics with the Croatian in parentheses; captions and labels use the Croatian term. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Autonomni sustavi, veze i najave',
      sideTitle: 'Putevi do {p} u svakom AS-u',
      thFrom: 'Od',
      thPath: 'AS put',
      thLp: 'LP',
      own: 'vlastiti',
      ownPath: 'prazan',
      noPath: 'nema puta',
      gone: 'obrisan',
      rid: 'ID {r}',
      byOnly: 'jedini put',
      byLocal: 'vlastiti prefiks',
      byLp: 'odlučuje lokalna prednost',
      byLen: 'odlučuje kraći AS put',
      byRid: 'odlučuje niži ID usmjernika',
      byOrder: 'redoslijed susjeda',
      bOrigin: 'izvor',
      bWatch: 'promatrač',
      bNoPath: 'nema puta',
      chipWithdraw: '✕ povlačenje',
      roundT: 'Krug {n}',
      roundStart: 'Početak',
      roundFail: 'Otkaz veze',
      roundDone: 'Konvergirano',

      pLp: 'D: lokalna prednost za puteve od C',
      pFail: 'Otkaz veze nakon konvergencije',
      failNone: 'ne',
      failOB: 'O–B',
      failOA: 'O–A',
      pPrep: 'O produljuje AS put prema B',
      prepVal: '{n}× više',
      pWatch: 'Promatraj',
      watchC: 'C (AS64499)',
      watchD: 'D (AS64500)',

      prShortest: 'Kraći AS put',
      prLocalPref: 'Lokalna prednost',
      prRouterId: 'Neriješeno: ID usmjernika',
      prFailure: 'Otkaz veze O–B',
      prPrepend: 'Produljivanje AS puta',
      prWithdraw: 'Povlačenje (otkaz O–A)',
      prLocalPrefHint: 'D daje putevima od C lokalnu prednost 200.',
      prRouterIdHint: 'Promatra C: dva jednako duga puta.',
      prPrependHint: 'O prema B upisuje svoj ASN tri puta.',
      prWithdrawHint: 'A ostaje bez puta i povlači prefiks.',

      legAs: 'autonomni sustav (AS)',
      legAnnounce: 'najava s AS putem',
      legWithdraw: 'povlačenje',
      legDrop: 'odbačeno (petlja)',
      legBest: 'najbolji put promatrača',
      legChanged: 'najbolji put promijenjen',

      capOrigin: '{o} objavljuje prefiks {p}. Nitko ga drugi još ne zna. Pritisni → za prvi krug najava.',
      capRound1: 'Krug {n}: {s} šalje novi najbolji put svim susjedima.',
      capRoundN: 'Krug {n}: {s} šalju nove najbolje puteve svim susjedima.',
      capRoundOrigin: 'Krug {n}: {o} najavljuje {p} susjedima. AS put zasad sadrži samo njegov ASN.',
      capPrepend: 'Prema {b} upisuje svoj ASN {k} puta: put je dulji, pa manje privlačan.',
      capWithdrawLead: 'Krug {n}: {s} nema više puta, pa susjedima šalje povlačenje.',
      capWithdrawn: '{r} briše put od {s} i ponovno bira među preostalima.',
      capWithdrawnEmpty: '{r} briše put od {s} i ostaje bez puta.',
      capLoop: '{r} odbacuje {path} od {s}: u putu je njegov ASN (petlja).',
      capLoopOld: 'Time briše i stari put {old} od {s}.',
      capLpNotSent: '{s} šalje samo AS put, ne i svoju lokalnu prednost ({lp}): {r} postavlja vlastitu ({lp2}).',

      decOnly: '{x} ima jedan put: {path} od {n}.',
      decLen: '{x} ima {k} puta: {list}. Lokalna prednost je jednaka ({lp}), pa odlučuje kraći AS put: preko {n}.',
      decLp: '{x} ima {k} puta: {list}. Odlučuje lokalna prednost: {lp} za put od {n} prema {lp2}.',
      decLpLonger: '{x} ima {k} puta: {list}. Odlučuje lokalna prednost: {lp} za put od {n} prema {lp2}, iako je taj AS put dulji.',
      decRid: '{x} ima {k} puta: {list}. Lokalna prednost ({lp}) i duljina AS puta ({len}) su jednake, pa odlučuje niži ID usmjernika susjeda: {n} ({r} < {r2}).',
      decRidSome: '{x} ima {k} puta. Jednaku lokalnu prednost ({lp}) i duljinu AS puta ({len}) imaju {list}, pa odlučuje niži ID usmjernika susjeda: {n} ({r} < {r2}).',
      decNone: '{x} više nema nijednog puta do {p}.',
      pathFrom: '{path} od {n}',
      afterChanged: 'Najbolji put se promijenio: {x} ga u idućem krugu javlja susjedima.',
      afterSame: 'Najbolji put se ne mijenja, pa {x} u idućem krugu ništa ne šalje.',
      alsoChanged: 'Najbolji put promijenio je i: {list}.',
      nothingChanged: 'Nijedan najbolji put se nije promijenio: u idućem krugu nitko nema što poslati.',

      capFail: 'Mreža je konvergirala: nitko nema ništa novo za poslati. Sada otkazuje veza {l}: {a} i {b} brišu sve što su čuli preko nje.',
      failAlt: '{x} već čuva {path} od {n}, pa mu to odmah postaje najbolji put. Povlačenje ne treba: novi put javlja u idućem krugu.',
      failNoneLeft: '{x} nema drugog puta: u idućem krugu susjedima šalje povlačenje.',
      failNoChange: 'Najbolji putevi se ne mijenjaju.',

      capDone: 'Krug {n}: nitko nema ništa novo za poslati, mreža je konvergirala. {x} šalje promet za {p} putem {route}.',
      capDoneNone: 'Krug {n}: nitko nema ništa novo za poslati, mreža je konvergirala. {x} nema puta do {p}.',

      listSep: ', ',
      andSep: ' i ',
      arrow: ' → ',

      explain: '<p>BGP usmjerava promet između autonomnih sustava. <i>Autonomous system</i> (autonomni sustav, AS) je skup ' +
        'usmjernika pod jednom tehničkom upravom. Ovdje je svaki AS jedan okvir s jednim brojem (ASN). AS O objavljuje [[network prefix]] ' +
        '203.0.113.0/24, a ostali ga uče iz najava susjeda.</p>' +
        '<p>Kad AS šalje put susjedu, na početak dodaje svoj ASN: tako nastaje <i>AS path</i> (AS put), popis AS-ova do ' +
        'izvora. AS koji u primljenom putu nađe svoj ASN taj put odbacuje: to sprječava petlje.</p>' +
        '<p>Svaki AS čuva po jedan put od svakog susjeda i bira najbolji (<i>path selection</i>, odabir puta):</p>' +
        '<ol><li>najveća <i>local preference</i> (lokalna prednost, LP): postavlja je AS koji prima put, vlastitom ' +
        'politikom, i nikad je ne šalje susjednim AS-ovima;</li>' +
        '<li>zatim najkraći AS put (broji brojeve AS-ova, ASN-ove, ne usmjernike, a ne zna ništa o brzini ni opterećenju);</li>' +
        '<li>ORIGIN i MED su ovdje jednaki za sve puteve;</li>' +
        '<li>na kraju niži <i>router ID</i> (identifikator usmjernika) susjeda koji je put najavio.</li></ol>' +
        '<p>Kad se AS-u promijeni najbolji put, u idućem krugu ga javlja svim susjedima; kad ostane bez puta, šalje ' +
        '<i>withdrawal</i> (povlačenje). Novi put od istog susjeda zamjenjuje stari. Kad nitko nema ništa novo za ' +
        'poslati, mreža je konvergirala. Produljivanje AS puta (<i>prepending</i>): AS svoj ASN upiše više puta da put ' +
        'preko neke veze bude manje privlačan. Prosljeđivanje paketa zatim bira najdulji prefiks koji odgovara odredištu; ' +
        'ovdje je prefiks samo jedan.</p>' +
        '<p>Brojevi AS-ova i adrese su iz raspona za dokumentaciju (RFC 5398, RFC 5737). Krugovi su pojednostavljeni: ' +
        'bez tajmera, svi u istom taktu.</p>'
    },
    en: {
      stage: 'Autonomous systems, links and announcements',
      sideTitle: 'Paths to {p} in each AS',
      thFrom: 'From',
      thPath: 'AS path',
      thLp: 'LP',
      own: 'own',
      ownPath: 'empty',
      noPath: 'no path',
      gone: 'removed',
      rid: 'ID {r}',
      byOnly: 'only path',
      byLocal: 'own prefix',
      byLp: 'local preference decides',
      byLen: 'shorter AS path decides',
      byRid: 'lower router ID decides',
      byOrder: 'neighbour order',
      bOrigin: 'origin',
      bWatch: 'watched',
      bNoPath: 'no path',
      chipWithdraw: '✕ withdraw',
      roundT: 'Round {n}',
      roundStart: 'Start',
      roundFail: 'Link failure',
      roundDone: 'Converged',

      pLp: 'D: local preference for paths from C',
      pFail: 'Link fails after convergence',
      failNone: 'no',
      failOB: 'O–B',
      failOA: 'O–A',
      pPrep: 'O prepends its ASN towards B',
      prepVal: '{n}× extra',
      pWatch: 'Watch',
      watchC: 'C (AS64499)',
      watchD: 'D (AS64500)',

      prShortest: 'Shorter AS path',
      prLocalPref: 'Local preference',
      prRouterId: 'Tie: router ID',
      prFailure: 'Link O–B fails',
      prPrepend: 'AS path prepending',
      prWithdraw: 'Withdrawal (O–A fails)',
      prLocalPrefHint: 'D gives paths from C local preference 200.',
      prRouterIdHint: 'Watches C: two paths of equal length.',
      prPrependHint: 'O writes its ASN three times towards B.',
      prWithdrawHint: 'A is left without a path and withdraws the prefix.',

      legAs: 'autonomous system (AS)',
      legAnnounce: 'announcement with its AS path',
      legWithdraw: 'withdrawal',
      legDrop: 'dropped (loop)',
      legBest: 'watched AS\'s best path',
      legChanged: 'best path changed',

      capOrigin: '{o} originates the prefix {p}. Nobody else knows it yet. Press → for the first round of announcements.',
      capRound1: 'Round {n}: {s} sends its new best path to all neighbours.',
      capRoundN: 'Round {n}: {s} send their new best paths to all neighbours.',
      capRoundOrigin: 'Round {n}: {o} announces {p} to its neighbours. So far the AS path holds only its own ASN.',
      capPrepend: 'Towards {b} it writes its ASN {k} times: the path is longer, so less attractive.',
      capWithdrawLead: 'Round {n}: {s} has no path left, so it sends its neighbours a withdrawal.',
      capWithdrawn: '{r} removes the path from {s} and chooses again from the rest.',
      capWithdrawnEmpty: '{r} removes the path from {s} and has none left.',
      capLoop: '{r} drops {path} from {s}: its own ASN is in the path (a loop).',
      capLoopOld: 'That also deletes the old path {old} from {s}.',
      capLpNotSent: '{s} sends only the AS path, not its local preference ({lp}): {r} sets its own ({lp2}).',

      decOnly: '{x} has one path: {path} from {n}.',
      decLen: '{x} has {k} paths: {list}. Local preference is equal ({lp}), so the shorter AS path wins: via {n}.',
      decLp: '{x} has {k} paths: {list}. Local preference decides: {lp} for the path from {n} against {lp2}.',
      decLpLonger: '{x} has {k} paths: {list}. Local preference decides: {lp} for the path from {n} against {lp2}, although that AS path is longer.',
      decRid: '{x} has {k} paths: {list}. Local preference ({lp}) and AS path length ({len}) are equal, so the neighbour\'s lower router ID decides: {n} ({r} < {r2}).',
      decRidSome: '{x} has {k} paths. Equal local preference ({lp}) and AS path length ({len}): {list}, so the neighbour\'s lower router ID decides: {n} ({r} < {r2}).',
      decNone: '{x} has no path to {p} any more.',
      pathFrom: '{path} from {n}',
      afterChanged: 'Its best path changed: {x} tells its neighbours in the next round.',
      afterSame: 'Its best path does not change, so {x} sends nothing in the next round.',
      alsoChanged: 'Best path also changed at: {list}.',
      nothingChanged: 'No best path changed: in the next round nobody has anything to send.',

      capFail: 'The network has converged: nobody has anything new to send. Now the link {l} fails: {a} and {b} delete everything they heard over it.',
      failAlt: '{x} already holds {path} from {n}, so that becomes its best path at once. No withdrawal is needed: it announces the new path in the next round.',
      failNoneLeft: '{x} has no other path: in the next round it sends its neighbours a withdrawal.',
      failNoChange: 'No best path changes.',

      capDone: 'Round {n}: nobody has anything new to send, the network has converged. {x} sends traffic for {p} along {route}.',
      capDoneNone: 'Round {n}: nobody has anything new to send, the network has converged. {x} has no path to {p}.',

      listSep: ', ',
      andSep: ' and ',
      arrow: ' → ',

      explain: '<p>BGP routes between <i>autonomous systems</i> (AS): each is a set of routers under one technical ' +
        'administration. Here every AS is one box with one number (ASN). AS O originates the [[network prefix]] ' +
        '203.0.113.0/24; the others learn it from their neighbours\' announcements.</p>' +
        '<p>When an AS sends a path to a neighbour, it puts its own ASN in front: that builds the <i>AS path</i>, the list ' +
        'of ASes back to the origin. An AS that finds its own ASN in a path it receives drops it: that prevents loops.</p>' +
        '<p>Every AS keeps one path from each neighbour and picks the best (<i>path selection</i>):</p>' +
        '<ol><li>the highest <i>local preference</i> (LP): set by the AS that receives the path, by its own policy, and ' +
        'never sent to neighbouring ASes;</li>' +
        '<li>then the shortest AS path (it counts AS numbers, not routers, and knows nothing of speed or load);</li>' +
        '<li>ORIGIN and MED are equal for every path here;</li>' +
        '<li>last, the lower <i>router ID</i> of the neighbour that announced the path.</li></ol>' +
        '<p>When an AS\'s best path changes, it tells all its neighbours in the next round; when it has no path left, it ' +
        'sends a <i>withdrawal</i>. A new path from the same neighbour replaces the old one. When nobody has anything new ' +
        'to send, the network has converged. <i>Prepending</i>: an AS writes its ASN more than once so that the path ' +
        'over some link looks less attractive. Forwarding then picks the longest prefix that matches the destination; ' +
        'here there is only one prefix.</p>' +
        '<p>AS numbers and addresses are from the documentation ranges (RFC 5398, RFC 5737). Rounds are simplified: no ' +
        'timers, everyone in the same beat.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
