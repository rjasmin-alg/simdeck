/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cdn-anycast, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Anycast: tri PoP-a, pet AS-ova',

      // params
      pZG: 'PoP ZG najavljuje prefiks',
      pVIE: 'PoP VIE najavljuje prefiks',
      pFRA: 'PoP FRA najavljuje prefiks',
      pL0102: 'Veza AS64501–AS64502',
      pL03VIE: 'Veza AS64503–VIE',
      pL03FRA: 'Veza AS64503–FRA',
      pLp: 'AS64503: lokalna prednost za puteve od FRA',

      // presets
      'preset_three-pops': 'Tri PoP-a, jedna adresa',
      'preset_withdraw-zg': 'ZG povlači najavu',
      'preset_nearest-is-not-closest': 'Najbliži nije najbliži',
      'preset_local-pref-wins': 'Lokalna prednost pobjeđuje',
      'hint_three-pops': 'Jedna adresa na tri mjesta; svaki AS ide na kraj svog najboljeg puta.',
      'hint_withdraw-zg': 'AS64501 prelazi na VIE; adresa ostaje ista.',
      'hint_nearest-is-not-closest': 'AS64505 je u Zagrebu, a ne ide na ZG.',
      'hint_local-pref-wins': 'AS64503 daje FRA prednost 200.',

      // legend
      legPop: 'PoP (AS64500)',
      legClient: 'skupina korisnika (AS)',
      legTransit: 'tranzitni AS',
      legPath: 'odabrani put prema PoP-u',
      legDown: 'povučen PoP, prekinuta veza',
      legMoved: 'promijenio PoP zadnjom promjenom',

      // the drawing
      cityZG: 'Zagreb',
      cityVIE: 'Beč',
      cityFRA: 'Frankfurt',
      cityMUC: 'München',
      serves: ['{n} skupina korisnika', '{n} skupine korisnika', '{n} skupina korisnika'],
      bWithdrawn: '✕ povukao najavu',
      bNoPath: 'nema puta',
      bTo: '→ {pop}',

      // the side column
      addrHead: 'Odredište {addr} u prefiksu {p}: ista adresa na svakom PoP-u.',
      sideTitle: 'Što svaki AS zna o {p}',
      byOnly: 'jedini put',
      byLp: 'lokalna prednost',
      byLen: 'kraći AS put',
      byRid: 'niži ID usmjernika',
      byOrder: 'redoslijed susjeda',
      lpVal: 'LP {lp}',
      noPath: 'Nema puta: adresa je odavde nedostupna.',
      transit: 'tranzit',

      // captions
      capOverview: ['Prefiks adrese {addr} najavljuje {n} PoP.', 'Prefiks adrese {addr} najavljuju {n} PoP-a.', 'Prefiks adrese {addr} najavljuje {n} PoP-ova.'],
      capOverviewList: 'Svaka skupina korisnika ide na kraj svog najboljeg BGP puta: {list}.',
      capTo: '{x} → {pop}',
      capToNone: '{x} bez puta',
      causeWithdraw: '{pop} je povukao najavu {p}.',
      causeAnnounce: '{pop} ponovno najavljuje {p}.',
      causeLinkDown: 'Veza {l} je prekinuta.',
      causeLinkUp: 'Veza {l} ponovno radi.',
      causeLp: 'AS64503 putevima od FRA sada daje lokalnu prednost {lp}.',
      causeMany: 'Promijenilo se nekoliko postavki odjednom.',
      movedTo: 'Korisnici {x} sada idu na {pop} putem {path}; adresa {addr} ostala je ista.',
      movedBack: 'Korisnici {x} opet dolaze do adrese {addr}: na {pop}, putem {path}.',
      movedNone: '{x} više nema nijednog puta do {p}: adresa {addr} odande je nedostupna.',
      alsoMoved: 'PoP se promijenio i za {list}.',
      tcpNote: 'Kratki HTTP zahtjev to ne primjećuje; duga TCP veza prema {old} prekida se, jer {pop} o njoj nema stanja.',
      lpDecides: '{x} ima {path} od VIE i od FRA, jednako dug; lokalna prednost {lp} odlučuje prije duljine.',
      ridDecides: '{x} ima {path} od VIE i od FRA, jednako dug i jednako poželjan; odlučuje niži ID usmjernika, {r} ({pop}).',
      lpNoPath: '{x} nema puta od FRA: lokalna prednost rangira puteve, ne stvara ih.',
      nobodyMoved: 'Nijedan AS nije promijenio PoP.',
      capNearest: '{x} je u Zagrebu, uz ZG, ali jedini susjed mu je AS64503. Njegov najbolji put {path} vodi na {pop}: „najbliži” znači najbolji BGP put, a ne najmanje kilometara.',
      capNearestNone: '{x} je u Zagrebu, uz ZG, ali jedini susjed mu je AS64503, a on sada nema puta: adresa {addr} odande je nedostupna.',
      listSep: ', ',
      andSep: ' i ',

      explain: '<p><i>Anycast address</i> (<i>anycast</i> adresa) označava skup sučelja; paket poslan na nju stiže na ' +
        'jedno od njih, ono „najbliže” po mjerilu protokola usmjeravanja. U IPv4 isti učinak daje ' +
        'najava s više mjesta: svako mjesto najavljuje isti [[network prefix]]. Ovdje mreža CDN-a AS64500 najavljuje 203.0.113.0/24 iz tri ' +
        '<i>point of presence</i> (točka prisutnosti, PoP): Zagreb, Beč i Frankfurt. Na svakom su <i>edge servers</i> ' +
        '(rubni poslužitelji) s istom adresom 203.0.113.10.</p>' +
        '<p>Ostali <i>autonomous system</i> (autonomni sustav, AS) uče prefiks BGP-om i biraju najbolji put: najveća ' +
        '<i>local preference</i> (lokalna prednost, LP), zatim najkraći <i>AS path</i> (AS put), zatim niži ID usmjernika ' +
        'susjeda. AS ide na PoP na kojem njegov put završava. Kilometri se ne broje: AS64505 je u Zagrebu, a ide tamo kamo ' +
        'vode veze koje je kupio.</p>' +
        '<p>Kad PoP pošalje <i>withdrawal</i> (povlačenje) najave, svaki AS prelazi na sljedeći najbolji put. Adresa se ne ' +
        'mijenja, pa ni DNS ni korisnik ne moraju ništa učiniti. Ali promet se ne dijeli ravnomjerno: svaki PoP dobije one ' +
        'kojima je na kraju najboljeg puta. A tko se usred duge TCP veze premjesti na drugi PoP, ostaje bez veze: novi PoP ' +
        'o njoj nema stanja.</p>'
    },

    en: {
      stage: 'Anycast: three PoPs, five ASes',

      pZG: 'PoP ZG announces the prefix',
      pVIE: 'PoP VIE announces the prefix',
      pFRA: 'PoP FRA announces the prefix',
      pL0102: 'Link AS64501–AS64502',
      pL03VIE: 'Link AS64503–VIE',
      pL03FRA: 'Link AS64503–FRA',
      pLp: 'AS64503: local preference for paths from FRA',

      'preset_three-pops': 'Three PoPs, one address',
      'preset_withdraw-zg': 'ZG withdraws',
      'preset_nearest-is-not-closest': 'Nearest is not closest',
      'preset_local-pref-wins': 'Local preference wins',
      'hint_three-pops': 'One address in three places; each AS goes to the end of its best path.',
      'hint_withdraw-zg': 'AS64501 moves to VIE; the address stays the same.',
      'hint_nearest-is-not-closest': 'AS64505 is in Zagreb, yet does not reach ZG.',
      'hint_local-pref-wins': 'AS64503 gives FRA preference 200.',

      legPop: 'PoP (AS64500)',
      legClient: 'client group (AS)',
      legTransit: 'transit AS',
      legPath: 'chosen path to the PoP',
      legDown: 'withdrawn PoP, failed link',
      legMoved: 'PoP changed by the last change',

      cityZG: 'Zagreb',
      cityVIE: 'Vienna',
      cityFRA: 'Frankfurt',
      cityMUC: 'Munich',
      serves: ['{n} client group', '{n} client groups'],
      bWithdrawn: '✕ withdrawn',
      bNoPath: 'no path',
      bTo: '→ {pop}',

      addrHead: 'Destination {addr} in prefix {p}: the same address at every PoP.',
      sideTitle: 'What each AS knows about {p}',
      byOnly: 'only path',
      byLp: 'local preference',
      byLen: 'shorter AS path',
      byRid: 'lower router ID',
      byOrder: 'neighbour order',
      lpVal: 'LP {lp}',
      noPath: 'No path: the address is unreachable from here.',
      transit: 'transit',

      capOverview: ['{n} PoP announces the prefix of {addr}.', '{n} PoPs announce the prefix of {addr}.'],
      capOverviewList: 'Every client group goes to the end of its best BGP path: {list}.',
      capTo: '{x} → {pop}',
      capToNone: '{x} no path',
      causeWithdraw: '{pop} withdrew {p}.',
      causeAnnounce: '{pop} announces {p} again.',
      causeLinkDown: 'Link {l} failed.',
      causeLinkUp: 'Link {l} is up again.',
      causeLp: 'AS64503 now gives paths from FRA local preference {lp}.',
      causeMany: 'Several settings changed at once.',
      movedTo: 'Users in {x} now reach {pop} via {path}; the address {addr} is unchanged.',
      movedBack: 'Users in {x} reach the address {addr} again: at {pop}, via {path}.',
      movedNone: '{x} has no path to {p} left: the address {addr} is unreachable from there.',
      alsoMoved: 'The PoP changed for {list} too.',
      tcpNote: 'A short HTTP request does not notice; a long TCP connection to {old} breaks, because {pop} holds no state for it.',
      lpDecides: '{x} has {path} from VIE and from FRA, equally long; local preference {lp} decides before length.',
      ridDecides: '{x} has {path} from VIE and from FRA, equally long and equally preferred; the lower router ID decides, {r} ({pop}).',
      lpNoPath: '{x} has no path from FRA: local preference ranks paths, it does not create them.',
      nobodyMoved: 'No AS changed its PoP.',
      capNearest: '{x} is in Zagreb, next to ZG, but its only neighbour is AS64503. Its best path {path} leads to {pop}: "nearest" means the best BGP path, not the fewest kilometres.',
      capNearestNone: '{x} is in Zagreb, next to ZG, but its only neighbour is AS64503, which has no path now: the address {addr} is unreachable from there.',
      listSep: ', ',
      andSep: ' and ',

      explain: '<p>An <i>anycast address</i> names a set of interfaces; a packet sent to it reaches one of them, the ' +
        '"nearest" by the routing protocol\'s measure. In IPv4 the same effect comes from announcing one ' +
        '[[network prefix]] from several places: here the CDN network AS64500 announces 203.0.113.0/24 from three ' +
        '<i>points of presence</i> (PoPs): Zagreb, Vienna and Frankfurt. Each has <i>edge servers</i> and the same ' +
        'address 203.0.113.10.</p>' +
        '<p>The other <i>autonomous systems</i> (ASes) learn the prefix by BGP and pick their best path: the highest ' +
        '<i>local preference</i> (LP), then the shortest <i>AS path</i>, then the lower router ID of the neighbour. An AS ' +
        'goes to the PoP where its path ends. Kilometres do not count: AS64505 is in Zagreb, and goes wherever the links ' +
        'it bought lead.</p>' +
        '<p>When a PoP sends a <i>withdrawal</i> of its announcement, every AS moves to its next-best path. The address ' +
        'does not change, so neither DNS nor the user has to do anything. But traffic is not shared evenly: each PoP gets ' +
        'those for whom it is at the end of the best path. And whoever is moved to another PoP in the middle of a long TCP ' +
        'connection loses it: the new PoP holds no state for it.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
