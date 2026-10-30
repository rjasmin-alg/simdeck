/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of reverse-proxy-lb, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   Terms follow UL ch21: posrednik, obrnuti proxy, pozadinski poslužitelj (in kit/glossary.js); uravnotežitelj
   opterećenja (UL ch21), provjera ispravnosti, kružna raspodjela and vezana sjednica are not in the glossary yet and
   are written out (NOTES.md, "Term pairs"). The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Klijenti, obrnuti proxy i pozadinski poslužitelji, a ispod njih devet zahtjeva na vremenskoj crti',
      algo: 'Raspodjela',
      algo_rr: 'kružno',
      algo_lc: 'min. veza',
      algo_hash: 'hash',
      algo_sticky: 'kolačić',
      backends: 'Broj poslužitelja',
      slowB2: 'Spori b2',
      failAt: 'b2 otkaže',
      atSec: 'u {v} s',
      never: 'nikad',
      failMode: 'Kako b2 otkaže',
      fail_refuse: 'odbija veze',
      fail_hang: 'ne odgovara',
      failFor: 'Oporavak',
      afterSec: 'za {v} s',
      inter: 'Provjera',
      fall: 'Isključi ✗×',
      rise: 'Vrati ✓×',
      sec: '{v} s',

      'preset_round-robin': 'Kružna raspodjela',
      'hint_round-robin': 'Tri poslužitelja, svi jednako brzi',
      'preset_least-conn-slow': 'Najmanje veza, spori b2',
      'hint_least-conn-slow': 'b2 odgovara za 5 s',
      'preset_hash-remap': 'Hash: b2 ispadne',
      'hint_hash-remap': 'b2 otkaže u 4 s; provjera svake sekunde, isključi nakon 1',
      'preset_health-check': 'Provjera ispravnosti',
      'hint_health-check': 'b2 otkaže u 4 s; provjera svakih 2 s, isključi nakon 3',
      preset_sticky: 'Kolačić: b2 ispadne',
      hint_sticky: 'b2 otkaže u 4 s; provjera svakih 2 s, isključi nakon 2',

      legChip: 'zahtjev: poslužitelj koji ga je dobio',
      legErr: '502 / 504 od posrednika',
      legDown: '▼ isključen',
      legMoved: '↪ premješten',
      legChanged: 'promijenjen',

      clients: 'Klijenti',
      proxy: 'Obrnuti proxy',
      servers: 'Pozadinski poslužitelji',
      hashOf: 'hash {h}',
      cookieOf: 'kolačić {b}',
      name_rr: 'kružna raspodjela',
      name_lc: 'najmanje veza',
      name_hash: 'hash izvora',
      name_sticky: 'vezana sjednica (kolačić)',
      rule_rr: 'sljedeći ispravan po redu',
      rule_lc: 'najmanje otvorenih veza; jednako → manji broj',
      rule_hash: 'hash(klijent) mod broj ispravnih',
      rule_sticky: 'kamo kaže kolačić; bez njega kružno',
      waits: 'čeka odgovor najviše {s} s',
      checks: 'provjera svakih {i} s: ✗×{f} isključi, ✓×{r} vrati',
      service: '{s} s',
      slowTag: 'spor',
      failTag: 'otkaže u {t} s',
      failTagFor: 'ne radi {a}–{b} s',
      up: 'ispravan',
      down: 'isključen od {t} s',
      downBack: 'ispravan (isključen {a}–{b} s)',
      reqCount: ['{n} zahtjev', '{n} zahtjeva', '{n} zahtjeva'],
      errCount: '{n}× greška',
      maxOpen: ['najviše {n} veza odjednom', 'najviše {n} veze odjednom', 'najviše {n} veza odjednom'],
      requests: 'zahtjevi',
      axis: 'vrijeme (s)',
      axisShort: 's',
      chipTitle: 'r{k} od {c} u {t} s → {b}: {s}',
      chipTitleNone: 'r{k} od {c} u {t} s: nijedan poslužitelj nije ispravan, {s}',
      barTitle: 'r{k} od {c}: {a}–{e} s, {s}',
      checkPass: 'provjera u {t} s: prošla',
      checkFail: 'provjera u {t} s: nije prošla',

      list2: '{a} i {b}',
      listSep: ', ',
      capRR: 'Kružna raspodjela, zahtjeva po poslužitelju: {counts}. Svaki poslužitelj dođe na red, koliko god posao trajao: dijeli se broj ' +
        'zahtjeva, ne opterećenje.',
      capRRSlow: 'Kružna raspodjela: b2 je spor (5 s), a ipak dobiva {n} od 9 zahtjeva i drži {k}. Jednak broj ' +
        'zahtjeva nije jednako opterećenje.',
      capLCSlow: 'Najmanje veza: b2 je spor i drži veze otvorene, pa dobiva samo {n} od 9 zahtjeva; kružna raspodjela ' +
        'dala bi mu {m}.',
      capLC: 'Najmanje veza, zahtjeva po poslužitelju: {counts}. Odgovor traje 2 s, a zahtjev stiže svake sekunde, pa su odjednom zauzeta najviše ' +
        'dva poslužitelja; kad imaju jednako veza, bira se manji broj.',
      capHash: 'Hash izvora: klijent uvijek ide na isti poslužitelj ({map}), jer je hash mod {n} uvijek isti.',
      capSticky: 'Vezana sjednica: prvi odgovor postavlja kolačić s imenom poslužitelja i klijent se dalje vraća njemu ' +
        '({map}).',
      capMovedHash: 'Kad se promijeni broj ispravnih poslužitelja (b2 isključen u {d} s{back}), mijenja se i modul: {who} ' +
        'na drugi poslužitelj, iako su klijenti isti.',
      movedWho: ['{list} prelazi', '{list} prelaze', '{list} prelaze'],
      capMovedSticky: '{c} je imao kolačić za {from}; kad je {from} isključen, kružna raspodjela šalje ga na {to}, gdje ' +
        'njegove sjednice nema.',
      faultHead502: 'b2 otkaže u {f} s (odbija veze), a {down}.',
      faultHead504: 'b2 otkaže u {f} s: prihvaća veze, ali ne odgovara, a {down}.',
      faultSent502: ['Do tada mu posrednik i dalje šalje zahtjeve: {list} dobiva 502 od posrednika.',
        'Do tada mu posrednik i dalje šalje zahtjeve: {list} dobivaju 502 od posrednika.',
        'Do tada mu posrednik i dalje šalje zahtjeve: {list} dobivaju 502 od posrednika.'],
      faultSent504: ['Do tada mu posrednik i dalje šalje zahtjeve: {list} dobiva 504 od posrednika nakon {w} s čekanja.',
        'Do tada mu posrednik i dalje šalje zahtjeve: {list} dobivaju 504 od posrednika nakon {w} s čekanja.',
        'Do tada mu posrednik i dalje šalje zahtjeve: {list} dobivaju 504 od posrednika nakon {w} s čekanja.'],
      faultCut502: ['{list} je bio u tijeku kad je b2 stao i prekinut je: 502.', '{list} bili su u tijeku kad je b2 stao i prekinuti su: 502.',
        '{list} bili su u tijeku kad je b2 stao i prekinuti su: 502.'],
      faultCut504: ['{list} je bio u tijeku kad je b2 stao, a odgovor ne stiže: 504 nakon {w} s.',
        '{list} bili su u tijeku kad je b2 stao, a odgovori ne stižu: 504 nakon {w} s.',
        '{list} bili su u tijeku kad je b2 stao, a odgovori ne stižu: 504 nakon {w} s.'],
      faultTail: 'Kvar je iza posrednika, ne u njemu.',
      downFirst: 'posrednik ga isključi u {d} s, na prvoj neuspjeloj provjeri',
      downNow: 'posrednik ga isključi odmah, na provjeri u {d} s',
      backFirst: 'u {b} s opet radi, prije nego što ga provjere isključe',
      capLCSlowEven: 'Najmanje veza: b2 je spor, ali uz {b} poslužitelja i kružna raspodjela daje mu samo {m}; zahtjeva po ' +
        'poslužitelju: {counts}.',
      capStickyRace: '{c} šalje {r} prije nego što se vrati odgovor na {p}, a s njim i kolačić; bez kolačića kružna ' +
        'raspodjela šalje {r} na {b}.',
      movedBack: ', vraćen u {u} s',
      capFaultClean: 'b2 otkaže u {f} s, a {down}; nijedan zahtjev ne stigne do njega dok je pokvaren.',
      downAfter: 'posrednik ga isključi tek u {d} s, nakon {k} zaredom',
      fails: ['{n} neuspjele provjere', '{n} neuspjele provjere', '{n} neuspjelih provjera'],
      notDown: 'provjere ga ne isključe do {e} s',
      holds: ['do {n} veze odjednom', 'do {n} veze odjednom', 'do {n} veza odjednom'],

      explain: '<p>Klijent šalje zahtjev na [[reverse proxy]]: to je [[intermediary]] koji se prema klijentu ponaša kao ' +
        'poslužitelj, a prema poslužiteljima iza sebe kao klijent; svaki od njih je [[backend server]]. Klijent ' +
        'razgovara samo s posrednikom i ne zna koji ga je poslužitelj poslužio. Kad posrednik zahtjeve dijeli na više poslužitelja, radi i kao ' +
        '<i>load balancer</i> (uravnotežitelj opterećenja).</p>' +
        '<p><i>Round robin</i> (<b>kružna raspodjela</b>) šalje svakome redom: dijeli broj zahtjeva, a ne posao. ' +
        '<b>Najmanje veza</b> šalje onome tko trenutačno ima najmanje otvorenih veza, pa spor poslužitelj sam dobiva ' +
        'manje (kad ih je više jednakih, ovdje bira manji broj; stvarni uravnotežitelji to mogu riješiti i kružno). ' +
        '<b>Hash izvora</b>: [[hashing]] adrese klijenta daje broj (<i>hash</i>), a on mod broj ispravnih poslužitelja bira poslužitelj: isti klijent, isti ' +
        'poslužitelj, dok se taj broj ne promijeni, a tada se premjesti većina klijenata. <i>Sticky ' +
        'session</i> (<b>vezana sjednica</b>): prvi odgovor zapiše ime poslužitelja u kolačić i klijent se vraća ' +
        'tamo, sve dok je taj poslužitelj ispravan.</p>' +
        '<p><i>Health check</i> (provjera ispravnosti): posrednik svakih nekoliko sekundi provjeri svaki poslužitelj. ' +
        'Isključi ga tek nakon nekoliko neuspjelih provjera zaredom, a vrati nakon nekoliko uspješnih. Do tada pokvaren ' +
        'poslužitelj i dalje dobiva zahtjeve: mrtav poslužitelj ne nestaje odmah.</p>' +
        '<p><b>502</b> i <b>504</b> šalje posrednik, a [[status code]] imenuje njegovu ulogu: kvar je iza njega. ' +
        '502: poslužitelj je odbio vezu (usluga ne radi) ili ju je prekinuo. 504: veza je prihvaćena, ali odgovor nije ' +
        'stigao na vrijeme (ovdje čeka 6 s). Kod 502 ne znači da je pokvaren posrednik.</p>' +
        '<p><b>Pojednostavljeno:</b> devet zahtjeva po jedan u sekundi, odgovor za 2 s (spori b2 za 5 s), ' +
        'otkazati može samo b2, posrednik ne ponavlja neuspjeli zahtjev na drugom poslužitelju; težine, red čekanja i ' +
        'konzistentni hash nisu u modelu.</p>'
    },
    en: {
      stage: 'Clients, the reverse proxy and the backend servers, with the nine requests on a timeline below',
      algo: 'Balancing',
      algo_rr: 'round robin',
      algo_lc: 'least conn.',
      algo_hash: 'hash',
      algo_sticky: 'cookie',
      backends: 'Backend servers',
      slowB2: 'Slow b2',
      failAt: 'b2 fails',
      atSec: 'at {v} s',
      never: 'never',
      failMode: 'How b2 fails',
      fail_refuse: 'refuses',
      fail_hang: 'never answers',
      failFor: 'b2 back',
      afterSec: 'after {v} s',
      inter: 'Check',
      fall: 'Down ✗×',
      rise: 'Up ✓×',
      sec: '{v} s',

      'preset_round-robin': 'Round robin',
      'hint_round-robin': 'Three backends, all equally fast',
      'preset_least-conn-slow': 'Least connections, slow b2',
      'hint_least-conn-slow': 'b2 answers in 5 s',
      'preset_hash-remap': 'Hash: b2 drops out',
      'hint_hash-remap': 'b2 fails at 4 s; a check every second, down after 1',
      'preset_health-check': 'Health check',
      'hint_health-check': 'b2 fails at 4 s; a check every 2 s, down after 3',
      preset_sticky: 'Sticky cookie: b2 drops out',
      hint_sticky: 'b2 fails at 4 s; a check every 2 s, down after 2',

      legChip: 'request: the backend it went to',
      legErr: '502 / 504 from the proxy',
      legDown: '▼ marked down',
      legMoved: '↪ moved to another backend',
      legChanged: 'changed',

      clients: 'Clients',
      proxy: 'Reverse proxy',
      servers: 'Backend servers',
      hashOf: 'hash {h}',
      cookieOf: 'cookie {b}',
      name_rr: 'round robin',
      name_lc: 'least connections',
      name_hash: 'source hash',
      name_sticky: 'sticky session (cookie)',
      rule_rr: 'the next one up, in order',
      rule_lc: 'fewest open connections; tie → lower number',
      rule_hash: 'hash(client) mod the number up',
      rule_sticky: 'where the cookie says; without one, round robin',
      waits: 'waits at most {s} s for a response',
      checks: 'check every {i} s: ✗×{f} down, ✓×{r} up',
      service: '{s} s',
      slowTag: 'slow',
      failTag: 'fails at {t} s',
      failTagFor: 'failed {a}–{b} s',
      up: 'up',
      down: 'down since {t} s',
      downBack: 'up (down {a}–{b} s)',
      reqCount: ['{n} request', '{n} requests'],
      errCount: '{n}× error',
      maxOpen: ['at most {n} connection at once', 'at most {n} connections at once'],
      requests: 'requests',
      axis: 'time (s)',
      axisShort: 's',
      chipTitle: 'r{k} from {c} at {t} s → {b}: {s}',
      chipTitleNone: 'r{k} from {c} at {t} s: no backend up, {s}',
      barTitle: 'r{k} from {c}: {a}–{e} s, {s}',
      checkPass: 'check at {t} s: passed',
      checkFail: 'check at {t} s: failed',

      list2: '{a} and {b}',
      listSep: ', ',
      capRR: 'Round robin, requests per backend: {counts}. Every backend gets its turn however long the work takes: it shares out requests, ' +
        'not load.',
      capRRSlow: 'Round robin: b2 is slow (5 s) yet still gets {n} of 9 requests and holds {k}. Equal request ' +
        'counts are not equal load.',
      capLCSlow: 'Least connections: b2 is slow and keeps connections open, so it gets only {n} of 9 requests; round ' +
        'robin would give it {m}.',
      capLC: 'Least connections, requests per backend: {counts}. A response takes 2 s and a request comes every second, so never more ' +
        'than two backends are busy; on a tie the lower number wins.',
      capHash: 'Source hash: a client always goes to the same backend ({map}), because hash mod {n} is always the same.',
      capSticky: 'Sticky session: the first response sets a cookie naming the backend, and the client keeps coming back ' +
        'to it ({map}).',
      capMovedHash: 'When the number of backends up changes (b2 marked down at {d} s{back}), so does the modulus: {who} ' +
        'to another backend although the clients are the same.',
      movedWho: ['{list} moves', '{list} move'],
      capMovedSticky: '{c} had a cookie for {from}; once {from} is marked down, round robin sends it to {to}, where its ' +
        'session does not exist.',
      faultHead502: 'b2 fails at {f} s (refuses connections), and {down}.',
      faultHead504: 'b2 fails at {f} s: it accepts connections but never answers, and {down}.',
      faultSent502: ['Until then the proxy still sends it requests: {list} gets 502 from the proxy.',
        'Until then the proxy still sends it requests: {list} get 502 from the proxy.'],
      faultSent504: ['Until then the proxy still sends it requests: {list} gets 504 from the proxy after waiting {w} s.',
        'Until then the proxy still sends it requests: {list} get 504 from the proxy after waiting {w} s.'],
      faultCut502: ['{list} was in flight when b2 stopped and is cut off: 502.', '{list} were in flight when b2 stopped and are cut off: 502.'],
      faultCut504: ['{list} was in flight when b2 stopped and its answer never comes: 504 after {w} s.',
        '{list} were in flight when b2 stopped and their answers never come: 504 after {w} s.'],
      faultTail: 'The fault is behind the proxy, not in it.',
      downFirst: 'the proxy marks it down at {d} s, at the first failed check',
      downNow: 'the proxy marks it down at once, at the {d} s check',
      backFirst: 'it works again at {b} s, before the checks mark it down',
      capLCSlowEven: 'Least connections: b2 is slow, but with {b} backends round robin also gives it only {m}; requests ' +
        'per backend: {counts}.',
      capStickyRace: '{c} sends {r} before the response to {p}, and with it the cookie, is back; without a cookie round ' +
        'robin sends {r} to {b}.',
      movedBack: ', back up at {u} s',
      capFaultClean: 'b2 fails at {f} s, and {down}; no request reaches it while it is broken.',
      downAfter: 'the proxy marks it down only at {d} s, after {k} in a row',
      fails: ['{n} failed check', '{n} failed checks'],
      notDown: 'the checks do not mark it down before {e} s',
      holds: ['up to {n} connection at once', 'up to {n} connections at once'],

      explain: '<p>A [[reverse proxy]] is an [[intermediary]] that acts as a server towards the client and as a client ' +
        'towards the [[backend server]]. The client talks only to the proxy and does not know which backend served ' +
        'it. When the proxy spreads requests over several backends it is also a <i>load balancer</i>.</p>' +
        '<p><b>Round robin</b> sends to each in turn: it shares out the number of requests, not the work. <b>Least ' +
        'connections</b> sends to whoever has the fewest open connections right now, so a slow backend gets less by ' +
        'itself (on a tie this page picks the lower number; real balancers may break ties round robin). <b>Source ' +
        'hash</b> takes a hash of the client\'s address mod the number of backends up: same client, same backend, until ' +
        'that number changes, and then most clients move. <b>Sticky session</b>: the first response writes the ' +
        'backend\'s name into a cookie and the client goes back there as long as that backend is up.</p>' +
        '<p><b>Health check</b>: every few seconds the proxy checks each backend. It marks one down only after a few ' +
        'failed checks in a row, and up again after a few passed ones. Until then a broken backend still gets ' +
        'requests: a dead backend is not removed at once.</p>' +
        '<p><b>502</b> and <b>504</b> are sent by the proxy, and the [[status code]] names its role: the fault is ' +
        'behind it. 502: the backend refused the connection (the service is down) or cut it. 504: the connection was ' +
        'accepted but no response came in time (here, 6 s). A 502 does not mean the proxy is broken.</p>' +
        '<p><b>Simplified:</b> nine requests one per second, a response in 2 s (the slow b2 in 5 s), only b2 ' +
        'can fail, and the proxy does not retry a failed request on another backend; weights, queuing and consistent ' +
        'hashing are not in the model.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
