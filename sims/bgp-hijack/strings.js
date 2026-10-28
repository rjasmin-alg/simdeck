/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the bgp-hijack page, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is
   plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come from sim.json.
   Croatian: the hijack and RPKI terms are not in kit/glossary.js yet (NOTES.md "Term pairs"), so the explanation
   writes each pair out, English in italics with the Croatian in parentheses; captions and labels use the Croatian term. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Autonomni sustavi, najave i kamo ide promet za 203.0.113.10',
      sideTitle: 'Najbolji put po prefiksu; kamo AS šalje promet za {a}',
      roaTitle: 'ROA nositelja prefiksa',
      roaNone: 'nije objavljen',
      roaMax: 'najviše /{m}',
      rovWho: 'Izvorište provjeravaju: {list}',
      rovNobody: 'Izvorište ne provjerava nitko.',
      rovAll: 'svi',
      fwdHome: 'isporučuje sam',
      fwdNone: 'nema puta',
      dropped: 'odbačen',
      roundT: 'Krug {n}',
      roundStart: 'Početak',
      roundReady: 'Početak: mreža je konvergirala',
      roundDone: 'Konvergirano',
      bReal: 'pravi izvor',
      bFalse: 'lažni izvor',
      bNoPath: 'nema puta',
      bRov: 'ROV',
      own: 'vlastiti',

      pConflict: 'Najava AS64511',
      conflictNone: 'nema',
      conflictSame: 'isti /24',
      conflictMore: 'dulji /25',
      pRoa: 'ROA za 203.0.113.0/24 (AS64496, najviše /24)',
      pRov: 'Provjera izvorišta (ROV)',
      rovNone: 'nitko',
      rovHalf: 'pola',
      rovAllOpt: 'svi',
      pRovHint: 'Pola: AS-ovi O, B, C i F.',

      prNormal: 'Bez sukoba',
      prSame: 'Isti prefiks',
      prMore: 'Specifičniji prefiks',
      prRovAll: 'ROA i provjera svugdje',
      prRovHalf: 'ROA i provjera kod pola',
      prSameHint: 'AS64511 najavljuje isti /24.',
      prMoreHint: 'AS64511 najavljuje 203.0.113.0/25.',
      prRovAllHint: 'Svi AS-ovi provjeravaju izvorište.',
      prRovHalfHint: 'Provjeravaju samo O, B, C i F.',

      legReal: 'pravi izvor (krug)',
      legFalse: 'lažni izvor (trokut)',
      legCaptured: 'put prometa privučenog prema AS64511',
      legAnnounce: 'najava prefiksa',
      legDrop: 'odbačeno (petlja ili nevaljano)',
      legBadges: 'V valjan, I nevaljan, NF nije pronađen',
      legChanged: 'prosljeđivanje promijenjeno',

      capOrigin: '{o} ima prefiks {p}, a u njemu je adresa {a}. Nitko drugi još ne zna put do nje. Pritisni → za prvi krug najava.',
      capReady: 'Mreža je konvergirala: promet za {a} iz svih AS-ova ide prema {o}. U idućem krugu {x} počinje najavljivati {p}.',
      capReadyRoa: 'ROA je objavljen, a izvorište provjeravaju: {list}.',
      capReadyRoaNobody: 'ROA je objavljen, ali izvorište ne provjerava nitko.',
      capReadyNoRoaAll: 'Svi AS-ovi provjeravaju izvorište, ali ROA nije objavljen: sve će biti NotFound.',
      capReadyNoRoa: 'Izvorište provjeravaju {list}, ali ROA nije objavljen: sve će biti NotFound.',
      capStart: 'Krug {n}: {x} počinje najavljivati {p} kao svoj.',
      capNoCheck: 'BGP ne provjerava čiji je prefiks: susjedi ga primaju kao i svaki drugi.',
      capRoundOrigin: 'Krug {n}: {o} najavljuje {p} susjedima.',
      capRound1: 'Krug {n}: {s} šalje novi najbolji put susjedima.',
      capRoundN: 'Krug {n}: {s} šalju nove najbolje puteve susjedima.',
      capInvalid1: '{r} provjerava izvorište: {p} od {s} ima izvorište {xo}, a ROA dopušta {o} do /{m}. Nevaljan (I), odbačen.',
      capInvalidN: '{r} provjeravaju izvorište: {p} ima izvorište {xo}, a ROA dopušta {o} do /{m}. Nevaljan (I), odbačen.',
      capNotFound: 'Bez ROA-a {r} nema s čime usporediti: {p} je NotFound i prolazi.',
      capHome: '{o} čuje i {p}, ali {a} je u njegovoj mreži: promet isporučuje sam.',

      fwdFirst: '{x} je naučio {p} od {n}: promet za {a} šalje preko {n}.',
      fwdLonger: '{x} sad ima {p1} i {p2}. Za {a} vrijedi dulji prefiks {p2}, od {n}.',
      fwdLongerAnyway: '{x} sad ima {p1} i {p2}. Za {a} vrijedi dulji prefiks {p2} od {n}, iako je taj AS put dulji ({k2} prema {k1}).',
      fwdShorter: '{x} ima dva puta za {p}: {path} od {n} i {path2} od {n2}. Kraći AS put vodi prema {xa}.',
      fwdPulled: '{x} i dalje šalje promet za {a} preko {n}, po putu za {p}. Ali {n} sad ima dulji {hp} i šalje ga prema {xa}.',
      fwdTo: '{x} sad šalje promet za {a} preko {n} prema {d}.',
      alsoX: 'Prema {xa} sad ide i promet iz: {list}.',
      alsoOther: 'Prosljeđivanje se promijenilo i kod: {list}.',
      quiet: 'Nijedan najbolji put se nije promijenio: u idućem krugu nitko nema što poslati.',
      quietStart: 'Nijedan drugi AS nije promijenio najbolji put: u idućem krugu nitko nema što poslati.',
      quietSend: 'Prosljeđivanje se ne mijenja; novi najbolji put u idućem krugu javljaju: {list}.',

      capDone: 'Krug {n}: nitko nema što novo poslati, mreža je konvergirala.',
      doneAllReal: 'Promet za {a} iz svih AS-ova ide prema {o}.',
      doneSplit: 'Promet za {a} ide prema {o} iz {k1} ({l1}), a prema {xa} iz {k2} ({l2}).',
      donePulled: '{x} provjerava izvorište i odbacuje {hp}, a ipak mu promet ide prema {xa}: šalje ga preko {n}, koji ne provjerava.',
      asCount: ['{n} AS-a', '{n} AS-a', '{n} AS-ova'],

      listSep: ', ',
      andSep: ' i ',
      arrow: ' → ',

      explain: '<p><i>Autonomous system</i> (autonomni sustav, AS) je skup usmjernika pod jednom tehničkom upravom. ' +
        'AS64496 je nositelj prefiksa 203.0.113.0/24 i u njegovoj mreži je adresa 203.0.113.10. Ostali AS-ovi uče ' +
        'put iz BGP najava i biraju najbolji kao u simulatoru <i>BGP: odabir puta</i>: lokalna prednost, kraći AS put, ' +
        'niži ID usmjernika.</p>' +
        '<p><i>Route hijack</i> (otmica prefiksa): AS64511 najavljuje prefiks koji nije njegov, zabunom ili namjerno. ' +
        'BGP ne provjerava tko smije najavljivati koji [[network prefix]]. Ako najavi <b>isti</b> /24, natječe se ' +
        'duljinom AS puta i dobiva samo AS-ove kojima je bliži. Ako najavi <b>dulji</b> 203.0.113.0/25 ' +
        '(<i>more-specific prefix</i>, specifičniji prefiks), prosljeđivanje bira <i>longest prefix match</i> ' +
        '(najdulji podudarajući prefiks): /25 pobjeđuje /24 za adrese koje pokriva, koliko god AS put bio dug.</p>' +
        '<p><i>Route origin authorisation</i> (ROA, ovlaštenje izvorišta puta) je potpisana izjava nositelja prefiksa: ' +
        'prefiks, najveća dopuštena duljina i AS koji ga smije najavljivati. AS s uključenom <i>origin validation</i> ' +
        '(provjera izvorišta, ROV) svaku primljenu najavu označava:</p>' +
        '<ul><li><b>V</b> (Valid): neki ROA pokriva prefiks, izvorište se slaže i duljina nije veća od dopuštene;</li>' +
        '<li><b>I</b> (Invalid): ROA pokriva prefiks, ali nijedan se ne slaže (krivi AS ili predug prefiks);</li>' +
        '<li><b>NF</b> (NotFound): nijedan ROA ga ne pokriva.</li></ul>' +
        '<p>Ovdje AS koji provjerava odbacuje nevaljane najave (što se radi s njima, odluka je mreže). AS koji ne ' +
        'provjerava i dalje ih koristi, a promet iz AS-a koji provjerava ipak može završiti kod AS64511 ako ide ' +
        'preko takvog susjeda: provjera u vlastitoj mreži ne štiti sve.</p>' +
        '<p>Provjera izvorišta gleda samo prefiks i zadnji AS u putu, ne cijeli put. Mnoge mreže ne primaju IPv4 ' +
        'prefikse dulje od /24, pa je ovaj /25 primjer pravila o najduljem prefiksu, ne recept.</p>' +
        '<p>Brojevi AS-ova i adrese su iz raspona za dokumentaciju (RFC 5398, RFC 5737). Izvorni AS isporučuje ' +
        'promet za svoje adrese sam: njegovi unutarnji putevi su specifičniji od svake najave.</p>'
    },

    en: {
      stage: 'Autonomous systems, announcements and where traffic for 203.0.113.10 goes',
      sideTitle: 'Best path per prefix; where each AS sends traffic for {a}',
      roaTitle: 'The prefix holder’s ROA',
      roaNone: 'not published',
      roaMax: 'at most /{m}',
      rovWho: 'Origin validation at: {list}',
      rovNobody: 'Nobody validates the origin.',
      rovAll: 'all',
      fwdHome: 'delivers it',
      fwdNone: 'no route',
      dropped: 'dropped',
      roundT: 'Round {n}',
      roundStart: 'Start',
      roundReady: 'Start: the network has converged',
      roundDone: 'Converged',
      bReal: 'real origin',
      bFalse: 'false origin',
      bNoPath: 'no route',
      bRov: 'ROV',
      own: 'own',

      pConflict: 'AS64511 announces',
      conflictNone: 'nothing',
      conflictSame: 'same /24',
      conflictMore: 'longer /25',
      pRoa: 'ROA for 203.0.113.0/24 (AS64496, at most /24)',
      pRov: 'Origin validation (ROV)',
      rovNone: 'nobody',
      rovHalf: 'half',
      rovAllOpt: 'all',
      pRovHint: 'Half: ASes O, B, C and F.',

      prNormal: 'No conflict',
      prSame: 'Same prefix',
      prMore: 'More-specific prefix',
      prRovAll: 'ROA, everyone validates',
      prRovHalf: 'ROA, half validate',
      prSameHint: 'AS64511 announces the same /24.',
      prMoreHint: 'AS64511 announces 203.0.113.0/25.',
      prRovAllHint: 'Every AS validates the origin.',
      prRovHalfHint: 'Only O, B, C and F validate.',

      legReal: 'real origin (circle)',
      legFalse: 'false origin (triangle)',
      legCaptured: 'path of traffic drawn to AS64511',
      legAnnounce: 'announcement of a prefix',
      legDrop: 'dropped (loop or invalid)',
      legBadges: 'V valid, I invalid, NF not found',
      legChanged: 'forwarding changed',

      capOrigin: '{o} holds the prefix {p}, which contains the address {a}. Nobody else knows a route to it yet. Press → for the first round of announcements.',
      capReady: 'The network has converged: traffic for {a} from every AS goes to {o}. In the next round {x} starts announcing {p}.',
      capReadyRoa: 'A ROA is published, and the origin is validated at: {list}.',
      capReadyRoaNobody: 'A ROA is published, but nobody validates the origin.',
      capReadyNoRoaAll: 'Every AS validates the origin, but no ROA is published: everything will be NotFound.',
      capReadyNoRoa: '{list} validate the origin, but no ROA is published: everything will be NotFound.',
      capStart: 'Round {n}: {x} starts announcing {p} as its own.',
      capNoCheck: 'BGP does not check whose prefix it is: the neighbours accept it like any other.',
      capRoundOrigin: 'Round {n}: {o} announces {p} to its neighbours.',
      capRound1: 'Round {n}: {s} sends its new best path to its neighbours.',
      capRoundN: 'Round {n}: {s} send their new best paths to their neighbours.',
      capInvalid1: '{r} validates the origin: {p} from {s} has origin {xo}, but the ROA allows {o} up to /{m}. Invalid (I), dropped.',
      capInvalidN: '{r} validate the origin: {p} has origin {xo}, but the ROA allows {o} up to /{m}. Invalid (I), dropped.',
      capNotFound: 'Without a ROA, {r} has nothing to compare with: {p} is NotFound and passes.',
      capHome: '{o} hears {p} too, but {a} is in its own network: it delivers the traffic itself.',

      fwdFirst: '{x} has learned {p} from {n}: it sends traffic for {a} via {n}.',
      fwdLonger: '{x} now has {p1} and {p2}. For {a} the longer prefix {p2} wins, from {n}.',
      fwdLongerAnyway: '{x} now has {p1} and {p2}. For {a} the longer prefix {p2} from {n} wins, although its AS path is longer ({k2} against {k1}).',
      fwdShorter: '{x} has two paths for {p}: {path} from {n} and {path2} from {n2}. The shorter AS path leads to {xa}.',
      fwdPulled: '{x} still sends traffic for {a} via {n}, by its route for {p}. But {n} now has the longer {hp} and sends it on to {xa}.',
      fwdTo: '{x} now sends traffic for {a} via {n} to {d}.',
      alsoX: 'Traffic now also goes to {xa} from: {list}.',
      alsoOther: 'Forwarding also changed at: {list}.',
      quiet: 'No best path changed: in the next round nobody has anything to send.',
      quietStart: 'No other AS changed its best path: in the next round nobody has anything to send.',
      quietSend: 'Forwarding does not change; a new best path goes out in the next round from: {list}.',

      capDone: 'Round {n}: nobody has anything new to send, the network has converged.',
      doneAllReal: 'Traffic for {a} from every AS goes to {o}.',
      doneSplit: 'Traffic for {a} goes to {o} from {k1} ({l1}) and to {xa} from {k2} ({l2}).',
      donePulled: '{x} validates the origin and drops {hp}, yet its traffic goes to {xa}: it sends it via {n}, which does not validate.',
      asCount: ['{n} AS', '{n} ASes'],

      listSep: ', ',
      andSep: ' and ',
      arrow: ' → ',

      explain: '<p>An <i>autonomous system</i> (AS) is a set of routers under one technical administration. AS64496 ' +
        'holds the prefix 203.0.113.0/24, and the address 203.0.113.10 is in its network. The other ASes learn the ' +
        'route from BGP announcements and pick the best one as in the <i>BGP path selection</i> simulator: local ' +
        'preference, then the shorter AS path, then the lower router ID.</p>' +
        '<p>A <i>route hijack</i>: AS64511 announces a prefix that is not its own, by mistake or on purpose. BGP does ' +
        'not check who holds a [[network prefix]]. If it announces the <b>same</b> /24, it competes on AS-path length ' +
        'and wins only the ASes it is closer to. If it announces the <b>longer</b> 203.0.113.0/25 (a ' +
        '<i>more-specific prefix</i>), forwarding uses the <i>longest prefix match</i>: the /25 beats the /24 for the ' +
        'addresses it covers, however long its AS path.</p>' +
        '<p>A <i>route origin authorisation</i> (ROA) is a signed statement by the prefix holder: the prefix, the ' +
        'longest length allowed, and the AS that may announce it. An AS with <i>origin validation</i> (ROV) on labels ' +
        'every announcement it receives:</p>' +
        '<ul><li><b>V</b> (Valid): a ROA covers the prefix, the origin matches and the length is within the limit;</li>' +
        '<li><b>I</b> (Invalid): a ROA covers the prefix, but none matches (wrong AS or too long a prefix);</li>' +
        '<li><b>NF</b> (NotFound): no ROA covers it.</li></ul>' +
        '<p>Here a validating AS drops Invalid announcements (what to do with them is the network’s own policy). ' +
        'An AS that does not validate keeps using them, and traffic from a validating AS can still end at AS64511 if ' +
        'it passes such a neighbour: validating in your own network does not protect everyone.</p>' +
        '<p>Origin validation looks only at the prefix and the last AS in the path, not at the whole path. Many ' +
        'networks do not accept IPv4 prefixes longer than /24, so this /25 illustrates the longest-match rule; it is ' +
        'not a recipe.</p>' +
        '<p>AS numbers and addresses are from the documentation ranges (RFC 5398, RFC 5737). The origin AS delivers ' +
        'traffic for its own addresses itself: its internal routes are more specific than any announcement.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
