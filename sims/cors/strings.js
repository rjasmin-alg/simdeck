/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cors, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks them up
   with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The glossary has no origin, same-origin policy, preflight or credentials yet (NOTES.md, Term pairs): the Croatian
   table writes those pairs out, the English term in italics with the Croatian in parentheses at first mention.
   URLs, header fields, methods and bodies are data (translate="no" in the page), never in these tables. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Skripta, preglednik i poslužitelj',

      laneScript: 'Skripta stranice',
      laneBrowser: 'Preglednik',
      laneServer: 'Poslužitelj',
      laneOther: 'Program izvan preglednika',
      cardPage: 'stranica:',
      cardGot: 'dobila:',
      cardGotOther: 'dobio:',
      cardWaiting: 'čeka',
      cardNotUsed: 'ne sudjeluje',
      cardError: 'mrežna greška',
      cardConsole: 'konzola: greška CORS',
      gateLabel: 'rampa:',
      gateOpen: 'podignuta',
      gateClosed: 'spuštena',
      gateNone: 'nema provjere',
      gateIdle: '—',
      clsSame: 'isto ishodište',
      clsSimple: 'jednostavan zahtjev',
      clsPreflight: 'treba prethodni zahtjev',
      clsOther: 'nije preglednik',
      srvLog: ['{n} zahtjev u dnevniku', '{n} zahtjeva u dnevniku', '{n} zahtjeva u dnevniku'],
      srvLogEmpty: 'dnevnik prazan',

      chipError: 'greška',
      reNoBody: 'bez tijela',
      noteSame: 'isto ishodište: bez CORS-a',
      noteSimple: 'jednostavan: šalje odmah',
      notePreflight: 'prvo OPTIONS',
      noteOther: 'bez ishodišta, bez provjera',
      noteNotSent: 'stvarni zahtjev se ne šalje',
      chartEmpty: 'Još nema poruka. Pritisni →.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],

      oriTitle: 'Ishodišta',
      oriPart: 'dio',
      oriPage: 'stranica',
      oriTarget: 'odredište',
      oriScheme: 'shema',
      oriHost: 'ime',
      oriPort: 'port',
      oriSame: 'Isto ishodište: sva tri dijela jednaka.',
      oriCross: 'Drugo ishodište: razlikuje se označeni dio.',
      oriNoPage: 'Program izvan preglednika nema stranicu ni ishodište.',

      msgIntent: 'Skripta traži od preglednika',
      msgPreflight: 'Prethodni zahtjev i odgovor',
      msgActual: 'Zahtjev i odgovor',
      msgNone: 'Još ništa nije poslano.',
      fetchCredentials: 's kolačićima',
      noBody: '(bez tijela)',
      verdictOk: 'Preglednik predaje tijelo skripti.',
      verdictBlocked: 'Preglednik zadržava tijelo.',
      verdictFree: 'Nema provjere: tijelo ide dalje.',
      verdictPreOk: 'Prethodni zahtjev prošao.',
      verdictPreFail: 'Prethodni zahtjev odbijen.',

      logTitle: 'Dnevnik poslužitelja',
      logEmpty: 'Poslužitelj još nije primio nijedan zahtjev.',
      logWrite: 'zapisano',
      logNoOrigin: 'bez Origin',
      srvDeclares: 'Poslužitelj šalje:',
      srvNoAcao: 'bez Access-Control-Allow-Origin',

      outside: 'Program izvan preglednika',
      targetOrigin: 'Odredište se razlikuje u',
      tgtSame: 'ničemu',
      tgtHost: 'imenu',
      tgtPort: 'portu',
      tgtScheme: 'shemi',
      method: 'Metoda',
      jsonBody: 'Tijelo u JSON-u',
      credentials: 'Kolačići (vjerodajnice)',
      acao: 'Poslužitelj: Allow-Origin',
      acaoNone: 'nema',
      acaoExact: 'ishodište stranice',
      acac: 'Šalje Allow-Credentials',
      allowPut: 'Dopušta PUT (OPTIONS)',

      presetSame: 'Isto ishodište',
      presetSameHint: 'Nema CORS-a: skripta čita tijelo.',
      presetBlocked: 'Jednostavan, blokiran',
      presetBlockedHint: 'Poslužitelj odgovara 200, preglednik blokira.',
      presetAllowed: 'Jednostavan, dopušten',
      presetAllowedHint: 'Allow-Origin je ishodište stranice.',
      presetPreflight: 'Prethodni zahtjev',
      presetPreflightHint: 'PUT s JSON-om; isključi dopuštenje PUT i PUT se ne šalje.',
      presetStar: 'Kolačići i *',
      presetStarHint: '* ne vrijedi kad se šalju kolačići.',
      presetOther: 'Izvan preglednika',
      presetOtherHint: 'Isti zahtjev, bez preglednika: tijelo se ispisuje.',

      legActual: 'stvarni zahtjev',
      legPreflight: 'prethodni zahtjev',
      legGate: 'spuštena rampa',
      legDiff: 'razlika u ishodištu',
      legChanged: 'odlučilo u ovom koraku',

      capStart: 'Skripta na {page} traži od preglednika {req}. Pritisni →: preglednik najprije razvrstava zahtjev.',
      capStartOther: 'Program izvan preglednika šalje {req}. Nema stranicu, pa nema ni ishodište.',
      capSame: 'Stranica i odredište imaju isto ishodište {origin}: shema, ime i port se poklapaju. CORS se ne primjenjuje: preglednik šalje zahtjev i predat će odgovor.',
      capSimple: 'Drugo ishodište ({parts}). {method} sa samo dopuštenim poljima zaglavlja je jednostavan zahtjev: preglednik ga šalje odmah, s poljem Origin, a odgovor provjerava poslije.',
      capPreflight: 'Drugo ishodište ({parts}), a {reason}: nije na popisu dopuštenih. Prije stvarnog zahtjeva preglednik pita poslužitelj prethodnim zahtjevom OPTIONS.',
      capOther: 'Ovaj program nije preglednik: nema ishodište stranice, ne šalje Origin ni korisnikove kolačiće i ništa ne provjerava.',
      reasonMethod: 'metoda {method}',
      reasonHeader: 'polje zaglavlja {field}',
      reasonBoth: 'metoda {method} i polje zaglavlja {field}',
      partScheme: 'shema',
      partHost: 'ime',
      partPort: 'port',
      capPreOk: 'Odgovor na prethodni zahtjev dopušta ishodište {origin}{what}. Preglednik sada šalje stvarni zahtjev.',
      capPreOkMethod: ', metodu {method}',
      capPreOkHeader: ' i polje {field}',
      capPreFailAcao: 'Odgovor na prethodni zahtjev nema Access-Control-Allow-Origin. Preglednik staje: {method} se nikad ne šalje i poslužitelj ga ne vidi. Skripta dobiva mrežnu grešku.',
      capPreFailStar: 'Skripta traži kolačiće (vjerodajnice), a odgovor na prethodni zahtjev kaže Access-Control-Allow-Origin: *. To tada ne vrijedi. Preglednik staje: {method} se nikad ne šalje.',
      capPreFailAcac: 'Skripta traži kolačiće (vjerodajnice), a odgovor na prethodni zahtjev nema Access-Control-Allow-Credentials: true. Preglednik staje: {method} se nikad ne šalje.',
      capPreFailOther: 'Odgovor na prethodni zahtjev dopušta drugo ishodište. Preglednik staje: {method} se nikad ne šalje.',
      capPreFailMethod: 'Odgovor dopušta samo {allowed}, ne {method}. Preglednik staje: {method} se nikad ne šalje, u dnevniku poslužitelja je samo OPTIONS.',
      capPreFailHeader: 'Odgovor ne dopušta polje zaglavlja {field}. Preglednik staje: {method} se nikad ne šalje, u dnevniku poslužitelja je samo OPTIONS.',
      capPreFailStatus: 'Odgovor na prethodni zahtjev nije uspješan (2xx). Preglednik staje.',
      capFreeSame: 'Poslužitelj odgovara {code}. Isto ishodište, nema se što provjeriti: preglednik odmah predaje tijelo {body} skripti.',
      capFreeOther: 'Poslužitelj odgovara {code} s istim poljima zaglavlja kao pregledniku. Program ispisuje tijelo {body}: nema preglednika, nema provjere.',
      capFreeOtherNoAcao: 'Poslužitelj odgovara {code}, bez Access-Control-Allow-Origin, isto kao što bi odgovorio pregledniku. Program svejedno ispisuje tijelo {body}: nema preglednika, nema provjere. Da radi iz naredbenog retka, ne znači da je poslužitelj dobro postavljen.',
      capReq: 'Zahtjev je stigao do poslužitelja i upisan je u njegov dnevnik. Poslužitelj odgovara {code}; sada preglednik provjerava polja zaglavlja odgovora.',
      capReqWrite: 'Zahtjev je stigao do poslužitelja i {method} je izvršen: zapis je spremljen. Poslužitelj odgovara {code}; sada preglednik provjerava polja zaglavlja odgovora.',
      capOkStar: 'Access-Control-Allow-Origin: * i nema kolačića: svako ishodište smije čitati. Preglednik predaje tijelo {body} skripti.',
      capOkExact: 'Access-Control-Allow-Origin je točno ishodište stranice {origin}. Preglednik predaje tijelo {body} skripti.',
      capOkCred: 'Allow-Origin je točno {origin} i Allow-Credentials je true: s kolačićima oboje treba. Preglednik predaje tijelo {body} skripti.',
      capBlockAcao: 'Poslužitelj je zahtjev primio i odgovorio 200, ali u odgovoru nema Access-Control-Allow-Origin. Preglednik skripti ne predaje tijelo: politiku provodi preglednik, ne poslužitelj.',
      capBlockAcaoWrite: ' A {method} je na poslužitelju već izvršen.',
      capBlockStar: 'Šalju se kolačići, a odgovor kaže Access-Control-Allow-Origin: *. Tada * ne vrijedi: mora pisati točno {origin}. Poslužitelj je odgovorio 200 i vidio kolačić, ali preglednik blokira tijelo.',
      capBlockAcac: 'Ishodište se poklapa, ali uz kolačiće odgovor mora imati i Access-Control-Allow-Credentials: true. Preglednik blokira tijelo, iako je poslužitelj odgovorio 200.',
      capBlockOther: 'Access-Control-Allow-Origin navodi drugo ishodište, {acao}. Preglednik blokira tijelo.',

      explain: '<p><i>Origin</i> (ishodište) čine shema, ime računala i port: <code translate="no">https://app.example</code> ' +
        'i <code translate="no">https://api.example</code> su različita ishodišta. Prema <i>same-origin policy</i> (pravilo istog ' +
        'ishodišta) skripta stranice ne smije čitati odgovor s drugog ishodišta, osim ako ga poslužitelj izričito dopusti ' +
        'poljem zaglavlja <code translate="no">Access-Control-Allow-Origin</code>. To je CORS.</p>' +
        '<p>Pravilo <b>provodi preglednik</b>, ne poslužitelj. Poslužitelj samo izjavljuje što dopušta; jednostavan zahtjev ' +
        '(GET, HEAD ili POST s običnim poljima) stiže do njega i izvrši se, a preglednik tek odgovor ne preda skripti. Zato ' +
        'CORS ne štiti poslužitelj, nego korisnikove podatke u pregledniku. Program izvan preglednika ne provjerava ništa, ' +
        'ali nema ni korisnikove kolačiće.</p>' +
        '<p>Za sve ostalo (PUT, vlastito polje zaglavlja, <code translate="no">application/json</code>) preglednik najprije ' +
        'šalje <i>preflight request</i> (prethodni zahtjev) <code translate="no">OPTIONS</code>, i stvarni zahtjev šalje tek ' +
        'ako odgovor dopušta metodu i polja. Uz <i>credentials</i> (vjerodajnice), tj. kolačiće, <code translate="no">*</code> ' +
        'ne vrijedi: odgovor mora navesti točno ishodište i <code translate="no">Access-Control-Allow-Credentials: true</code>.</p>'
    },
    en: {
      stage: 'Script, browser and server',

      laneScript: 'Page script',
      laneBrowser: 'Browser',
      laneServer: 'Server',
      laneOther: 'Program outside a browser',
      cardPage: 'page:',
      cardGot: 'got:',
      cardGotOther: 'got:',
      cardWaiting: 'waiting',
      cardNotUsed: 'not in this run',
      cardError: 'network error',
      cardConsole: 'console: CORS error',
      gateLabel: 'gate:',
      gateOpen: 'open',
      gateClosed: 'closed',
      gateNone: 'no check',
      gateIdle: '—',
      clsSame: 'same origin',
      clsSimple: 'simple request',
      clsPreflight: 'needs a preflight',
      clsOther: 'not a browser',
      srvLog: ['{n} request in the log', '{n} requests in the log'],
      srvLogEmpty: 'log empty',

      chipError: 'error',
      reNoBody: 'no body',
      noteSame: 'same origin: no CORS',
      noteSimple: 'simple: sent at once',
      notePreflight: 'OPTIONS first',
      noteOther: 'no origin, no checks',
      noteNotSent: 'actual request not sent',
      chartEmpty: 'No messages yet. Press →.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],

      oriTitle: 'Origins',
      oriPart: 'part',
      oriPage: 'page',
      oriTarget: 'target',
      oriScheme: 'scheme',
      oriHost: 'host',
      oriPort: 'port',
      oriSame: 'Same origin: all three parts match.',
      oriCross: 'Cross-origin: the marked part differs.',
      oriNoPage: 'A program outside a browser has no page and no origin.',

      msgIntent: 'The script asks the browser for',
      msgPreflight: 'Preflight request and answer',
      msgActual: 'Request and response',
      msgNone: 'Nothing sent yet.',
      fetchCredentials: 'with cookies',
      noBody: '(no body)',
      verdictOk: 'The browser hands the body to the script.',
      verdictBlocked: 'The browser keeps the body.',
      verdictFree: 'No check: the body goes on.',
      verdictPreOk: 'Preflight passed.',
      verdictPreFail: 'Preflight refused.',

      logTitle: 'Server log',
      logEmpty: 'The server has not received any request yet.',
      logWrite: 'written',
      logNoOrigin: 'no Origin',
      srvDeclares: 'The server sends:',
      srvNoAcao: 'no Access-Control-Allow-Origin',

      outside: 'Program outside a browser',
      targetOrigin: 'Target differs in',
      tgtSame: 'nothing',
      tgtHost: 'host',
      tgtPort: 'port',
      tgtScheme: 'scheme',
      method: 'Method',
      jsonBody: 'JSON body',
      credentials: 'Cookies (credentials)',
      acao: 'Server: Allow-Origin',
      acaoNone: 'none',
      acaoExact: 'page origin',
      acac: 'Sends Allow-Credentials',
      allowPut: 'Allows PUT (OPTIONS)',

      presetSame: 'Same origin',
      presetSameHint: 'No CORS: the script reads the body.',
      presetBlocked: 'Simple, blocked',
      presetBlockedHint: 'The server answers 200, the browser blocks.',
      presetAllowed: 'Simple, allowed',
      presetAllowedHint: 'Allow-Origin is the page origin.',
      presetPreflight: 'Preflight',
      presetPreflightHint: 'PUT with JSON; turn off the PUT permission and the PUT is never sent.',
      presetStar: 'Cookies and *',
      presetStarHint: '* does not count when cookies are sent.',
      presetOther: 'Outside a browser',
      presetOtherHint: 'The same request without a browser: the body is printed.',

      legActual: 'actual request',
      legPreflight: 'preflight',
      legGate: 'gate closed',
      legDiff: 'origin part differs',
      legChanged: 'decided this step',

      capStart: 'The script on {page} asks the browser for {req}. Press →: the browser classifies the request first.',
      capStartOther: 'A program outside a browser sends {req}. It has no page, so it has no origin.',
      capSame: 'Page and target have the same origin {origin}: scheme, host and port match. CORS does not apply: the browser sends the request and will hand over the answer.',
      capSimple: 'Cross-origin ({parts}). {method} with only safelisted header fields is a simple request: the browser sends it at once, with an Origin field, and checks the answer afterwards.',
      capPreflight: 'Cross-origin ({parts}), and {reason}: not on the safelist. Before the actual request the browser asks the server with a preflight request, OPTIONS.',
      capOther: 'This program is not a browser: it has no page origin, sends neither Origin nor the user\'s cookies, and checks nothing.',
      reasonMethod: 'the method {method}',
      reasonHeader: 'the header field {field}',
      reasonBoth: 'the method {method} and the header field {field}',
      partScheme: 'scheme',
      partHost: 'host',
      partPort: 'port',
      capPreOk: 'The preflight answer allows the origin {origin}{what}. The browser now sends the actual request.',
      capPreOkMethod: ', the method {method}',
      capPreOkHeader: ' and the field {field}',
      capPreFailAcao: 'The preflight answer has no Access-Control-Allow-Origin. The browser stops: the {method} is never sent and the server never sees it. The script gets a network error.',
      capPreFailStar: 'The script asked for cookies (credentials), and the preflight answer says Access-Control-Allow-Origin: *. That does not count then. The browser stops: the {method} is never sent.',
      capPreFailAcac: 'The script asked for cookies (credentials), and the preflight answer has no Access-Control-Allow-Credentials: true. The browser stops: the {method} is never sent.',
      capPreFailOther: 'The preflight answer allows another origin. The browser stops: the {method} is never sent.',
      capPreFailMethod: 'The answer allows only {allowed}, not {method}. The browser stops: the {method} is never sent, and the server log has only the OPTIONS.',
      capPreFailHeader: 'The answer does not allow the header field {field}. The browser stops: the {method} is never sent, and the server log has only the OPTIONS.',
      capPreFailStatus: 'The preflight answer is not a success (2xx). The browser stops.',
      capFreeSame: 'The server answers {code}. Same origin, nothing to check: the browser hands the body {body} to the script at once.',
      capFreeOther: 'The server answers {code} with the same header fields it sends a browser. The program prints the body {body}: no browser, no check.',
      capFreeOtherNoAcao: 'The server answers {code} without Access-Control-Allow-Origin, as it would answer a browser. The program prints the body {body} anyway: no browser, no check. Working from the command line does not mean the server is set up right.',
      capReq: 'The request reached the server and is in its log. The server answers {code}; now the browser checks the response header fields.',
      capReqWrite: 'The request reached the server and the {method} was carried out: the record is saved. The server answers {code}; now the browser checks the response header fields.',
      capOkStar: 'Access-Control-Allow-Origin: * and no cookies: any origin may read. The browser hands the body {body} to the script.',
      capOkExact: 'Access-Control-Allow-Origin is exactly the page origin {origin}. The browser hands the body {body} to the script.',
      capOkCred: 'Allow-Origin is exactly {origin} and Allow-Credentials is true: with cookies both are needed. The browser hands the body {body} to the script.',
      capBlockAcao: 'The server received the request and answered 200, but the response has no Access-Control-Allow-Origin. The browser does not hand the body to the script: the browser enforces the policy, not the server.',
      capBlockAcaoWrite: ' And the {method} was already carried out on the server.',
      capBlockStar: 'Cookies are sent, and the response says Access-Control-Allow-Origin: *. Then * does not count: it must say exactly {origin}. The server answered 200 and saw the cookie, but the browser blocks the body.',
      capBlockAcac: 'The origin matches, but with cookies the response must also carry Access-Control-Allow-Credentials: true. The browser blocks the body, although the server answered 200.',
      capBlockOther: 'Access-Control-Allow-Origin names another origin, {acao}. The browser blocks the body.',

      explain: '<p>An origin is scheme, host and port: <code translate="no">https://app.example</code> and ' +
        '<code translate="no">https://api.example</code> are different origins. Under the <i>same-origin policy</i> a page\'s ' +
        'script may not read a response from another origin unless the server allows it explicitly with the header field ' +
        '<code translate="no">Access-Control-Allow-Origin</code>. That is CORS.</p>' +
        '<p>The <b>browser enforces</b> the rule, not the server. The server only declares what it allows; a simple request ' +
        '(GET, HEAD or POST with plain header fields) reaches it and is carried out, and only then does the browser keep the ' +
        'answer from the script. So CORS does not protect the server, it protects the user\'s data in the browser. A program ' +
        'outside a browser checks nothing, but it does not have the user\'s cookies either.</p>' +
        '<p>For anything else (PUT, a custom header field, <code translate="no">application/json</code>) the browser first sends a ' +
        '<i>preflight request</i>, <code translate="no">OPTIONS</code>, and sends the actual request only if the answer allows the ' +
        'method and the fields. With <i>credentials</i> (cookies) <code translate="no">*</code> does not count: the answer must ' +
        'name the exact origin and carry <code translate="no">Access-Control-Allow-Credentials: true</code>.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
