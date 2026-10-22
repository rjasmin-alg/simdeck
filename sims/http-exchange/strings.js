/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of http-exchange, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   [[term]] is a glossary term. Message text (methods, paths, header fields, reason phrases, bodies), host names and
   addresses are data, drawn by the page with translate="no". Terms follow UL ch21 and URM ch14: zahtjev i odgovor,
   redak zahtjeva, statusni redak, polje zaglavlja, statusni kod, virtualni poslužitelj, ishodišni poslužitelj,
   resurs, korijen dokumenata. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'HTTP razmjena: poruke između klijenta i poslužitelja, tekst trenutačne poruke i postavke poslužitelja',

      // controls
      method: 'Metoda',
      path: 'Put (resurs)',
      host: 'Polje Host',
      hostNone: '(izostavljeno)',
      send: 'Pošalji zahtjev',

      // presets
      presetRedirect: 'Preusmjeravanje 301',
      presetRedirectHint: 'URM, poglavlje 14, primjer 3: /proizvodi se trajno preselio na /katalog.',
      presetHost: 'Bez polja Host',
      presetHostHint: 'UL, poglavlje 21: isti zahtjev bez polja Host i s njim.',
      presetVhost: 'Krivi virtualni poslužitelj',
      presetVhostHint: 'UL, poglavlje 21, primjer 3: novo ime, a vidi se stara stranica.',
      presetHead: 'HEAD i GET',
      presetHeadHint: 'Isti resurs dvjema metodama: ista zaglavlja, a tijelo?',
      presetNotFound: '404 i 403',
      presetNotFoundHint: 'Resurs kojeg nema i resurs koji se ne smije čitati.',

      // legend
      legReq: 'zahtjev, klijent → poslužitelj',
      legResp: 'odgovor, poslužitelj → klijent',
      legBadge: 'razred statusnog koda',
      legChanged: 'novo ili odlučilo ishod',

      // chart
      laneClient: 'Klijent',
      laneServer: 'Poslužitelj',
      chartEmpty: 'Još nijedna poruka.',
      earlier: ['↑ {n} ranija poruka', '↑ {n} ranije poruke', '↑ {n} ranijih poruka'],
      noHost: 'bez polja Host',
      cliBrowser: 'preglednik',
      cliCli: 'HTTP klijent u naredbenom retku',
      cardNext: 'sljedeći:',
      cardNone: 'ništa',
      cardGot: 'dobio:',
      cardHeadersOnly: 'samo zaglavlja',
      cardEmpty: 'prazno tijelo',
      cardFull: 'nema mjesta za novi zahtjev',
      srvKind: 'ishodišni poslužitelj',
      srvWaits: 'čeka zahtjev',
      srvReads: 'raščlanjuje zahtjev',
      srvNoHost: 'nema Host → 400',
      srvTwoHosts: 'dva Host → 400',
      srvDefault: '(zadani)',

      // text panel
      msgPending: 'Spreman za slanje',
      msgReq: 'Zahtjev {n}: klijent → poslužitelj',
      msgResp: 'Odgovor {n}: poslužitelj → klijent',
      bandReqLine: 'redak zahtjeva',
      bandStatusLine: 'statusni redak',
      bandHeaders: 'polja zaglavlja',
      bandEmpty: 'prazan redak',
      bandBody: 'tijelo',
      noHeaders: '(nijedno)',
      noBody: '(nema tijela)',
      reads: 'Klijent čita samo broj:',
      cls1: 'obavijesni',
      cls2: 'uspjeh',
      cls3: 'preusmjeravanje',
      cls4: 'pogreška klijenta',
      cls5: 'pogreška poslužitelja',
      reasonIgnored: 'tekst iza broja ne čita',

      // server panel
      vhTitle: 'Virtualni poslužitelji na {srv}',
      colName: 'ime',
      colRoot: 'korijen dokumenata',
      resTitle: 'Resursi u {root}',
      colPath: 'put',
      colStatus: 'status',
      colContent: 'sadržaj',
      kindRedirect: 'preseljeno',
      kindForm: 'program (obrazac)',
      kindBroken: 'program koji pada',
      kindUnreadable: 'datoteka, ne smije se čitati',
      kindHidden: 'datoteka, skrivena',
      kindNone: 'nema datoteke',

      // captions
      capStart: 'Klijent, {client}, ima spreman zahtjev za {url}. Pritisni → da ga pošalje.',
      capReq: 'Klijent šalje zahtjev: [[request-line]] {line}, zatim [[header field]] Host: {host} i prazan redak.',
      capReqNoHost: 'Klijent šalje {line} bez polja Host: poruka ima samo [[request-line]] i prazan redak.',
      capReqPost: 'Klijent šalje zahtjev: [[request-line]] {line}, zatim polja zaglavlja Host: {host}, Content-Type i Content-Length te prazan redak.',
      capReqFollow: 'Korisnik ništa nije kliknuo: klijent sam sastavlja novi zahtjev {line} iz zaglavlja Location i šalje ga istom poslužitelju.',
      capReqFollowPost: 'Klijent na novoj adresi ponavlja zahtjev kao GET, bez tijela: tako klijenti iz povijesnih razloga postupaju s POST nakon 301.',
      capBodyNone: 'Zahtjev {method} ovdje nema tijela.',
      capBodyPost: 'Iza praznog retka dolazi tijelo, podaci obrasca; njegovu duljinu u bajtovima kaže Content-Length: {len}.',
      capResp301: 'Poslužitelj vraća 301 i zaglavlje Location: {loc}. Sam broj kaže samo da se resurs trajno preselio; kamo, kaže zaglavlje.',
      capResp200: 'Poslužitelj po polju Host bira [[virtual host]] {vh}, pronalazi resurs {path} i vraća 200 OK s tijelom (Content-Length: {len}).',
      capResp200Ip: 'Sad zahtjev ima polje Host: {host}. Nijedan virtualni poslužitelj nema to ime, pa odgovara prvi, zadani: {vh}, sa 200 OK. Isti zahtjev, jedan redak više, i umjesto 400 stiže stranica.',
      capResp200Default: 'Nijedan virtualni poslužitelj nema ime {host}, pa odgovara prvi, zadani: {vh}, sa svojom stranicom i kodom 200. Ako se za {host} očekivala druga stranica, kod to neće reći: vidi se samo usporedbom sadržaja.',
      capResp200Follow: ['Na drugi zahtjev stiže 200 OK sa stranicom. Korisnik vidi jedan skok; mrežom je prošao {n} zahtjev i {n} odgovor.', 'Na drugi zahtjev stiže 200 OK sa stranicom. Korisnik vidi jedan skok; mrežom su prošla {n} zahtjeva i {n} odgovora.', 'Na drugi zahtjev stiže 200 OK sa stranicom. Korisnik vidi jedan skok; mrežom je prošlo {n} zahtjeva i {n} odgovora.'],
      capRespHead: 'Isti statusni redak i ista polja zaglavlja kao za GET, i Content-Length: {len}, ali bez tijela: HEAD traži samo zaglavlja.',
      capRespPost: 'Iza {path} je program: obradio je tijelo zahtjeva i sastavio odgovor, 200 OK. Odgovor ima isti oblik kao da je došao iz datoteke.',
      capResp400: 'Zahtjev HTTP/1.1 mora imati polje Host, a ovaj ga nema: poslužitelj odgovara 400 Bad Request, iako ima zadani virtualni poslužitelj. Resurs nije ni potražio.',
      capResp400Two: 'Zahtjev ima više od jednog polja Host: 400 Bad Request. Poslužitelj resurs nije ni potražio.',
      capResp403: 'Datoteka {path} postoji, ali je poslužitelj ne smije čitati: 403 Forbidden. Zahtjev je razumio i odbija ga.',
      capResp404: 'Za {path} nema ničega: 404 Not Found. No 404 ne znači uvijek da datoteke nema: poslužitelj smije njime sakriti i resurs koji ne želi otkriti.',
      capResp404Hidden: 'Datoteka {path} postoji, ali je poslužitelj ne želi otkriti: odgovor je 404, isti kao za resurs kojeg nema. Klijent ih ne može razlikovati.',
      capResp405: 'Metoda {method} nije dopuštena za {path}: 405 Method Not Allowed. Polje Allow kaže koje jesu.',
      capResp500: 'Program iza {path} je pao: 500 Internal Server Error. Prva znamenka, 5, kaže da je kvar na strani poslužitelja, ne u zahtjevu.',
      capMore: 'Sastavi svoj zahtjev u postavkama i pošalji ga tipkom S.',
      capFull: 'Za još jedan takav zahtjev nema mjesta.',

      explain: '<p>HTTP je razgovor u dva oblika poruke: [[request and response]]. Klijent šalje zahtjev; ' +
        '[[origin server]] ga raščlanjuje, tumači u odnosu na traženi [[resource]] i vraća odgovor.</p>' +
        '<p>Poruka HTTP/1.1 ima četiri dijela: početni redak, retke zaglavlja, prazan redak i neobavezno tijelo. Svaki redak ' +
        'zaglavlja je jedno [[header field]]: ime, dvotočje i vrijednost, a ime nije osjetljivo na veličinu slova. Početni redak ' +
        'zahtjeva je [[request-line]]: metoda, cilj zahtjeva i inačica; odgovora je [[status-line]]: inačica, [[status code]] i ' +
        'neobavezan tekst.</p>' +
        '<p>Polje <b>Host</b> je obavezno: zahtjev HTTP/1.1 bez njega, ili s dva, dobiva 400. Po njemu poslužitelj bira ' +
        '[[virtual host]]; ime koje ne poznaje završava na prvom, zadanom, i dobiva <b>200 s tuđom stranicom</b>.</p>' +
        '<p>Prva znamenka koda je razred: 1xx obavijesni, 2xx uspjeh, 3xx preusmjeravanje, 4xx pogreška klijenta, 5xx ' +
        'pogreška poslužitelja. Nepoznat kod klijent čita kao x00 svog razreda. Tekst iza broja (OK, Not Found) služi ' +
        'ljudima; klijent ga ne tumači. 301 nosi novu adresu u zaglavlju Location. HEAD dobiva ista zaglavlja kao GET, bez tijela. 404 smije ' +
        'sakriti i resurs koji postoji.</p>' +
        '<p>Izvori: Uvod u računalne mreže, poglavlje 14 (primjer 3); Uvod u Linux, poglavlje 21 (primjer 3); RFC 9110 ' +
        'i RFC 9112.</p>'
    },

    en: {
      stage: 'An HTTP exchange: the messages between client and server, the text of the current message and the server\'s settings',

      // controls
      method: 'Method',
      path: 'Path (resource)',
      host: 'Host field',
      hostNone: '(left out)',
      send: 'Send the request',

      // presets
      presetRedirect: 'Redirect 301',
      presetRedirectHint: 'URM, chapter 14, example 3: /proizvodi moved permanently to /katalog.',
      presetHost: 'No Host field',
      presetHostHint: 'UL, chapter 21: the same request without the Host field and with it.',
      presetVhost: 'Wrong virtual host',
      presetVhostHint: 'UL, chapter 21, example 3: a new name, and the old page shows.',
      presetHead: 'HEAD and GET',
      presetHeadHint: 'One resource, two methods: the same headers, and the body?',
      presetNotFound: '404 and 403',
      presetNotFoundHint: 'A resource that is not there and one that may not be read.',

      // legend
      legReq: 'request, client → server',
      legResp: 'response, server → client',
      legBadge: 'status code class',
      legChanged: 'new, or decided the outcome',

      // chart
      laneClient: 'Client',
      laneServer: 'Server',
      chartEmpty: 'No messages yet.',
      earlier: ['↑ {n} earlier message', '↑ {n} earlier messages'],
      noHost: 'no Host field',
      cliBrowser: 'a browser',
      cliCli: 'a command-line HTTP client',
      cardNext: 'next:',
      cardNone: 'nothing',
      cardGot: 'got:',
      cardHeadersOnly: 'headers only',
      cardEmpty: 'empty body',
      cardFull: 'no room for another request',
      srvKind: 'origin server',
      srvWaits: 'waiting for a request',
      srvReads: 'parsing the request',
      srvNoHost: 'no Host → 400',
      srvTwoHosts: 'two Host → 400',
      srvDefault: '(default)',

      // text panel
      msgPending: 'Ready to send',
      msgReq: 'Request {n}: client → server',
      msgResp: 'Response {n}: server → client',
      bandReqLine: 'request-line',
      bandStatusLine: 'status-line',
      bandHeaders: 'header fields',
      bandEmpty: 'empty line',
      bandBody: 'body',
      noHeaders: '(none)',
      noBody: '(no body)',
      reads: 'The client reads only the number:',
      cls1: 'informational',
      cls2: 'success',
      cls3: 'redirection',
      cls4: 'client error',
      cls5: 'server error',
      reasonIgnored: 'it does not read the text after it',

      // server panel
      vhTitle: 'Virtual hosts on {srv}',
      colName: 'name',
      colRoot: 'document root',
      resTitle: 'Resources in {root}',
      colPath: 'path',
      colStatus: 'status',
      colContent: 'content',
      kindRedirect: 'moved',
      kindForm: 'program (form)',
      kindBroken: 'program that fails',
      kindUnreadable: 'file, may not be read',
      kindHidden: 'file, hidden',
      kindNone: 'no file',

      // captions
      capStart: 'The client, {client}, has a request ready for {url}. Press → to send it.',
      capReq: 'The client sends a request: the [[request-line]] {line}, then the [[header field]] Host: {host} and an empty line.',
      capReqNoHost: 'The client sends {line} without a Host field: the message has only the [[request-line]] and the empty line.',
      capReqPost: 'The client sends a request: the [[request-line]] {line}, then the header fields Host: {host}, Content-Type and Content-Length, and an empty line.',
      capReqFollow: 'The user clicked nothing: the client builds the new request {line} from the Location header itself and sends it to the same server.',
      capReqFollowPost: 'At the new address the client repeats the request as GET, without the body: for historical reasons that is what clients do with POST after a 301.',
      capBodyNone: 'This {method} request has no body.',
      capBodyPost: 'After the empty line comes the body, the form data; Content-Length gives its length in bytes: {len}.',
      capResp301: 'The server returns 301 and the header Location: {loc}. The number only says the resource moved permanently; where to is in the header.',
      capResp200: 'The server picks the [[virtual host]] {vh} by the Host field, finds the resource {path} and returns 200 OK with a body (Content-Length: {len}).',
      capResp200Ip: 'Now the request has the field Host: {host}. No virtual host has that name, so the first one, the default, answers: {vh}, with 200 OK. The same request, one line more, and a page arrives instead of 400.',
      capResp200Default: 'No virtual host has the name {host}, so the first one, the default, answers: {vh}, with its own page and code 200. If another page was expected for {host}, the code will not say so: only comparing the content shows it.',
      capResp200Follow: ['The second request gets 200 OK with the page. The user sees one jump; {n} request and {n} response crossed the network.', 'The second request gets 200 OK with the page. The user sees one jump; {n} requests and {n} responses crossed the network.'],
      capRespHead: 'The same status-line and the same header fields as for GET, Content-Length: {len} included, but no body: HEAD asks for the headers only.',
      capRespPost: 'Behind {path} is a program: it processed the request body and built the response, 200 OK. The response has the same form as if it came from a file.',
      capResp400: 'An HTTP/1.1 request must carry a Host field, and this one has none: the server answers 400 Bad Request, although it has a default virtual host. It did not even look for the resource.',
      capResp400Two: 'The request has more than one Host field: 400 Bad Request. It did not even look for the resource.',
      capResp403: 'The file {path} exists, but the server may not read it: 403 Forbidden. It understood the request and refuses it.',
      capResp404: 'There is nothing at {path}: 404 Not Found. But 404 does not always mean the file is missing: a server may also use it to hide a resource it will not reveal.',
      capResp404Hidden: 'The file {path} exists, but the server will not reveal it: the response is 404, the same as for a resource that is not there. The client cannot tell them apart.',
      capResp405: 'The method {method} is not allowed for {path}: 405 Method Not Allowed. The Allow field says which ones are.',
      capResp500: 'The program behind {path} failed: 500 Internal Server Error. The first digit, 5, says the fault is on the server\'s side, not in the request.',
      capMore: 'Build your own request in the settings and send it with S.',
      capFull: 'There is no room for another such request.',

      explain: '<p>HTTP is a conversation in two kinds of message: [[request and response]]. The client sends a request; ' +
        'the [[origin server]] parses it, interprets it against the requested [[resource]] and returns a response.</p>' +
        '<p>An HTTP/1.1 message has four parts: a start line, header lines, an empty line and an optional body. Each header ' +
        'line is one [[header field]]: name, colon and value, and the name is not case-sensitive. A request starts with the ' +
        '[[request-line]]: method, request target and version; a response with the [[status-line]]: version, [[status code]] ' +
        'and optional text.</p>' +
        '<p>The <b>Host</b> field is required: an HTTP/1.1 request without it, or with two, gets 400. The server picks the ' +
        '[[virtual host]] by it; a name it does not know ends at the first, the default, and gets <b>200 with someone ' +
        'else\'s page</b>.</p>' +
        '<p>The first digit of the code is the class: 1xx informational, 2xx success, 3xx redirection, 4xx client error, ' +
        '5xx server error. The client reads an unknown code as x00 of its class. The text after the number (OK, Not ' +
        'Found) is for people; the client does not interpret it. 301 carries the new address in the Location header. HEAD gets the same headers as GET, ' +
        'without the body. 404 may also hide a resource that exists.</p>' +
        '<p>Sources: Uvod u računalne mreže (Introduction to computer networks), chapter 14 (example 3); Uvod u Linux ' +
        '(Introduction to Linux), chapter 21 (example 3); RFC 9110 and RFC 9112.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
