/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the HTTP status codes poster, in both languages (docs/sim-ui.md §9). Same keys in hr and
   en. c<n>: class name; w_<whose>: whose problem; m<code>: the card's one line; d<code>: the longer meaning on the
   detail strip (RFC 9110 §15, paraphrased); x<code>: a note for the codes with a misconception or a rule;
   note_<id>: words about one message; after_<id>: what the client does after the last response.
   Codes, reason phrases, request lines and headers are protocol data and come from sim.js (translate="no").
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Plakat statusnih kodova HTTP-a, pet klasa',
      klass: 'Klasa',
      klassHint: 'Ostale klase blijede.',
      cAll: 'sve klase',
      core: 'Pet iz knjige',
      coreHint: '200, 301, 302, 404 i 500',

      c1: 'informativni odgovor',
      c2: 'uspjeh',
      c3: 'preusmjeravanje',
      c4: 'greška klijenta',
      c5: 'greška poslužitelja',
      'w_nobody-yet': 'privremeno; konačni tek slijedi',
      'w_nobody': 'ničiji problem: uspjelo je',
      'w_client-acts': 'klijent mora nešto učiniti',
      'w_client': 'kriv je zahtjev klijenta',
      'w_server': 'kriv je poslužitelj',
      unknownAs: 'nepoznati kod {cls} čita se kao {code}',

      m100: 'nastavi, pošalji tijelo',
      m101: 'prelazim na drugi protokol',
      m200: 'zahtjev je uspio',
      m201: 'stvoren je nov resurs',
      m204: 'uspjelo; nema što vratiti',
      m206: 'šaljem samo traženi dio',
      m301: 'trajno preseljen',
      m302: 'privremeno je drugdje',
      m304: 'nije se mijenjao; uzmi svoju kopiju',
      m307: 'privremeno drugdje, ista metoda',
      m308: 'trajno preseljen, ista metoda',
      m400: 'zahtjev je neispravan',
      m401: 'prvo se prijavi',
      m403: 'prijavljen ili ne, ne',
      m404: 'toga ovdje nema',
      m405: 'ta metoda ovdje ne ide',
      m409: 'sukob sa stanjem resursa',
      m429: 'previše zahtjeva, uspori',
      m500: 'poslužitelj je zakazao',
      m502: 'loš odgovor pozadinskog poslužitelja',
      m503: 'preopterećen ili u održavanju',
      m504: 'pozadinski poslužitelj nije odgovorio',

      d100: 'Početak zahtjeva je primljen i nije odbijen; klijent smije poslati tijelo, a konačni odgovor slijedi nakon njega.',
      d101: 'Poslužitelj pristaje na drugi protokol koji je klijent zatražio zaglavljem Upgrade, na istoj vezi.',
      d200: 'Zahtjev je uspio; uz GET odgovor nosi sam resurs.',
      d201: 'Zahtjev je ispunjen i stvorio je nov resurs; gdje je, kaže zaglavlje Location.',
      d204: 'Zahtjev je ispunjen, a u odgovoru nema sadržaja koji bi trebalo poslati.',
      d206: 'Poslužitelj šalje samo dio resursa koji je klijent zatražio zaglavljem Range.',
      d301: 'Resurs je dobio nov, trajan URI; ubuduće treba tražiti ondje.',
      d302: 'Resurs je privremeno pod drugim URI-jem; ubuduće i dalje treba tražiti staru adresu.',
      d304: 'Uvjetni GET ili HEAD dao bi 200, ali uvjet nije ispunjen: klijentova kopija još vrijedi.',
      d307: 'Kao 302, ali klijent pri ponovnom slanju ne smije promijeniti metodu.',
      d308: 'Kao 301, ali klijent pri ponovnom slanju ne smije promijeniti metodu.',
      d400: 'Poslužitelj ne može obraditi zahtjev zbog nečega što vidi kao grešku klijenta, npr. pogrešne sintakse.',
      d401: 'Zahtjevu nedostaje valjana prijava; odgovor kaže kako se prijaviti (WWW-Authenticate).',
      d403: 'Poslužitelj je razumio zahtjev, ali ga odbija ispuniti; s istim podacima za prijavu ne treba ponavljati.',
      d404: 'Izvorni poslužitelj nije našao traženi resurs (ili ne želi reći da postoji).',
      d405: 'Metodu poslužitelj zna, ali je taj resurs ne podržava; zaglavlje Allow kaže koje podržava.',
      d409: 'Zahtjev je u sukobu s trenutačnim stanjem resursa, npr. izmjena starije inačice.',
      d429: 'Klijent je u zadanom vremenu poslao previše zahtjeva; Retry-After kaže koliko čekati.',
      d500: 'Poslužitelj je naišao na neočekivan uvjet koji ga je spriječio da ispuni zahtjev.',
      d502: 'Posrednik je od poslužitelja iza sebe dobio neispravan odgovor.',
      d503: 'Poslužitelj trenutačno ne može obraditi zahtjev zbog preopterećenja ili održavanja; to je privremeno.',
      d504: 'Posrednik nije na vrijeme dobio odgovor od poslužitelja iza sebe.',

      x100: 'Jedan zahtjev, dva odgovora: privremeni 1xx pa konačni.',
      x301: 'Kod kaže samo da se resurs preselio; kamo, kaže zaglavlje Location.',
      x302: 'Privremeno: Location vrijedi za ovaj zahtjev.',
      x304: 'Bez tijela: ništa se ne preuzima ponovno.',
      x307: 'POST ostaje POST.',
      x308: 'PUT ostaje PUT.',
      x401: 'Prijavi se i pokušaj ponovno: drugi zahtjev uspijeva.',
      x403: 'Prijava je bila tu; nije pomogla.',
      x404: 'Poslužitelj radi: odgovorio je.',
      x503: 'Privremeno: Retry-After kaže kad opet pokušati.',

      note_formSent: '(tijelo: podaci narudžbe)',
      note_priceList: '(tijelo: nov cjenik)',
      note_oldVersion: '(tijelo: izmjene starije inačice)',
      note_fromGateway: '(od posrednika)',
      after_switched: 'Veza dalje govori drugim protokolom.',
      after_useStored: 'Klijent prikazuje kopiju koju već ima.',
      after_noRetry: 'Isti zahtjev s istom prijavom ne treba ponavljati.',
      noBody: 'bez tijela',
      followSame: 'isti zahtjev se nastavlja',
      followNew: 'klijent šalje nov zahtjev',
      perClick: 'Za jedan klik: {req}, {resp}.',
      reqN: ['{n} zahtjev', '{n} zahtjeva', '{n} zahtjeva'],
      respN: ['{n} odgovor', '{n} odgovora', '{n} odgovora'],
      cardHint: 'Klikni karticu: zahtjev, odgovor i ono što klijent čini dalje.',
      coreMark: 'jedan od pet iz knjige',

      legCore: 'pet iz knjige',
      legReq: 'zahtjev',
      legResp: 'odgovor',
      legChanged: 'pojavio se s filtrom',
      legLetter: 'I S R C E: klasa',

      pBook: 'Pet iz knjige',
      pBookHint: '200, 301, 302, 404 i 500',
      pRedirect: 'Preusmjeravanje',
      pRedirectHint: 'GET /proizvodi → 301 → GET /katalog → 200',
      pFault: 'Čija je greška?',
      pFaultHint: '404 naspram 500 i 503',
      pCache: 'Uvjetni GET',
      pCacheHint: '304: ništa se ne preuzima ponovno',
      pAuth: '401 ili 403',
      pAuthHint: 'Prijavi se naspram: ne',

      capDefault: 'Prva znamenka kaže vrstu odgovora i čiji je problem; ostale dvije ga samo preciziraju. Klikni karticu za primjer.',
      capBook: 'Pet kodova iz knjige: 200 uspjeh, 301 i 302 preusmjeravanje, 404 greška klijenta, 500 greška poslužitelja.',
      capRedirect: '301 kaže samo da se resurs trajno preselio; kamo, kaže zaglavlje {loc}. Preglednik šalje novi zahtjev i tek na njega dobiva 200.',
      capFault: '404: poslužitelj radi i odgovorio je, samo toga nema; problem je u zahtjevu. 500 i 503: zahtjev je bio valjan, zakazao je poslužitelj.',
      capCache: 'Uvjetni GET: klijent šalje oznaku svoje kopije, poslužitelj vraća 304 bez tijela i ništa se ne preuzima ponovno.',
      capAuth: '401: tko si? Prijavi se pa pokušaj ponovno. 403: prijavljen ili ne, odgovor je ne.',
      capClass: '{cls} ({name}): {whose}.',
      capCore: 'Samo pet kodova iz knjige.',
      capCoreNone: 'U ovoj klasi nema nijednog od pet kodova iz knjige.',
      activeN: ['Svijetli {n} kod.', 'Svijetle {n} koda.', 'Svijetli {n} kodova.'],
      capSel: '{code} · {meaning}.',

      explain: '<p>Uz svaki odgovor ide [[status code]], troznamenkasti broj koji kaže kako je zahtjev prošao. ' +
        'Prva znamenka je klasa: 1xx privremeni odgovor, 2xx uspjeh, 3xx [[redirection]], 4xx greška koju čini <i lang="en">client</i> (klijent), 5xx greška koju čini <i lang="en">server</i> (poslužitelj). ' +
        'Ostale dvije znamenke ne razvrstavaju ništa: klijent koji kod ne poznaje čita ga kao x00 iste klase, pa je nepoznat 471 za njega 400.</p>' +
        '<p>Kod je kratak; ostalo nosi [[header]]. Kod 301 nema nove adrese, nju nosi zaglavlje <code>Location</code>, i zato je preusmjeravanje dvije izmjene: ' +
        '[[request and response]] na staru adresu, pa nov zahtjev na novu (Primjer 3 u knjizi). 301 i 308 su trajni, 302 i 307 privremeni; ' +
        '307 i 308 zadržavaju <i lang="en">method</i> (metodu), pa POST ostaje POST.</p>' +
        '<p>304 odgovara na uvjetni zahtjev: [[resource]] se nije promijenio, odgovor nema tijela, a klijent prikazuje kopiju iz [[cache]]. ' +
        '401 traži prijavu; 403 odbija i prijavljenog.</p>' +
        '<p>Česte zablude: 404 ne znači da <i lang="en">server</i> ne radi, jer je upravo on odgovorio; ' +
        'problem je u zahtjevu koji je poslao <i lang="en">client</i>. Preusmjeravanje nije jedna izmjena nego dvije. 401 i 403 nisu isto.</p>'
    },
    en: {
      stage: 'Poster of HTTP status codes, five classes',
      klass: 'Class',
      klassHint: 'The other classes fade.',
      cAll: 'all classes',
      core: 'The book\'s five',
      coreHint: '200, 301, 302, 404 and 500',

      c1: 'informational',
      c2: 'success',
      c3: 'redirection',
      c4: 'client error',
      c5: 'server error',
      'w_nobody-yet': 'interim; the final one follows',
      'w_nobody': 'nobody\'s problem: it worked',
      'w_client-acts': 'the client has to act',
      'w_client': 'the client\'s request is wrong',
      'w_server': 'the server failed',
      unknownAs: 'an unknown {cls} is read as {code}',

      m100: 'go on, send the body',
      m101: 'switching to another protocol',
      m200: 'the request succeeded',
      m201: 'a new resource was created',
      m204: 'done; nothing to send back',
      m206: 'here is just the part asked for',
      m301: 'moved for good',
      m302: 'elsewhere for now',
      m304: 'unchanged; use your copy',
      m307: 'elsewhere for now, same method',
      m308: 'moved for good, same method',
      m400: 'the request is malformed',
      m401: 'authenticate first',
      m403: 'authenticated or not, no',
      m404: 'nothing here by that name',
      m405: 'that method does not work here',
      m409: 'clashes with the resource\'s state',
      m429: 'too many requests, slow down',
      m500: 'the server failed',
      m502: 'bad answer from the server behind',
      m503: 'overloaded or in maintenance',
      m504: 'the server behind did not answer',

      d100: 'The start of the request has arrived and was not rejected; the client may send the body, and the final response comes after it.',
      d101: 'The server agrees to the other protocol the client asked for in its Upgrade header, on the same connection.',
      d200: 'The request succeeded; for a GET the response carries the resource itself.',
      d201: 'The request was fulfilled and created a new resource; the Location header says where it is.',
      d204: 'The request was fulfilled, and there is no content to send in the response.',
      d206: 'The server sends only the part of the resource the client asked for with its Range header.',
      d301: 'The resource has a new, permanent URI; future requests ought to go there.',
      d302: 'The resource is under another URI for now; future requests still go to the old address.',
      d304: 'A conditional GET or HEAD would have got 200, but the condition was false: the client\'s copy is still good.',
      d307: 'Like 302, but the client must not change the method when it sends the request again.',
      d308: 'Like 301, but the client must not change the method when it sends the request again.',
      d400: 'The server cannot process the request because of something it sees as a client error, such as bad syntax.',
      d401: 'The request lacks valid credentials; the response says how to authenticate (WWW-Authenticate).',
      d403: 'The server understood the request but refuses to fulfil it; repeating it with the same credentials will not help.',
      d404: 'The origin server did not find the resource asked for (or will not say that it exists).',
      d405: 'The server knows the method, but this resource does not support it; the Allow header lists the ones it does.',
      d409: 'The request conflicts with the resource\'s current state, such as changes to an older version.',
      d429: 'The client sent too many requests in a given time; Retry-After says how long to wait.',
      d500: 'The server met an unexpected condition that kept it from fulfilling the request.',
      d502: 'A gateway got an invalid response from the server behind it.',
      d503: 'The server cannot handle the request just now, overloaded or in maintenance; it is temporary.',
      d504: 'A gateway did not get a response in time from the server behind it.',

      x100: 'One request, two responses: an interim 1xx, then the final one.',
      x301: 'The code only says the resource moved; where to is in the Location header.',
      x302: 'Temporary: the Location holds for this request.',
      x304: 'No body: nothing is downloaded again.',
      x307: 'POST stays POST.',
      x308: 'PUT stays PUT.',
      x401: 'Authenticate and try again: the second request succeeds.',
      x403: 'The credentials were there; they did not help.',
      x404: 'The server is up: it answered.',
      x503: 'Temporary: Retry-After says when to try again.',

      note_formSent: '(body: the order data)',
      note_priceList: '(body: a new price list)',
      note_oldVersion: '(body: changes to an older version)',
      note_fromGateway: '(from the gateway)',
      after_switched: 'From here on the connection speaks the other protocol.',
      after_useStored: 'The client shows the copy it already has.',
      after_noRetry: 'No point repeating the request with the same credentials.',
      noBody: 'no body',
      followSame: 'the same request goes on',
      followNew: 'the client sends a new request',
      perClick: 'For one click: {req}, {resp}.',
      reqN: ['{n} request', '{n} requests'],
      respN: ['{n} response', '{n} responses'],
      cardHint: 'Click a card: the request, the response and what the client does next.',
      coreMark: 'one of the book\'s five',

      legCore: 'the book\'s five',
      legReq: 'request',
      legResp: 'response',
      legChanged: 'appeared with the filter',
      legLetter: 'I S R C E: the class',

      pBook: 'The book\'s five',
      pBookHint: '200, 301, 302, 404 and 500',
      pRedirect: 'Redirect',
      pRedirectHint: 'GET /proizvodi → 301 → GET /katalog → 200',
      pFault: 'Whose fault?',
      pFaultHint: '404 against 500 and 503',
      pCache: 'Conditional GET',
      pCacheHint: '304: nothing downloaded again',
      pAuth: '401 or 403',
      pAuthHint: 'Authenticate against: no',

      capDefault: 'The first digit says what kind of answer it is and whose problem; the other two only refine it. Click a card for an example.',
      capBook: 'The book\'s five codes: 200 success, 301 and 302 redirection, 404 client error, 500 server error.',
      capRedirect: '301 only says the resource has moved for good; where to is in the {loc} header. The browser sends a new request and only gets 200 for that one.',
      capFault: '404: the server is up and answered, there is just nothing there; the request is the problem. 500 and 503: the request was valid, the server failed.',
      capCache: 'A conditional GET: the client sends the tag of its copy, the server answers 304 with no body, and nothing is downloaded again.',
      capAuth: '401: who are you? Authenticate and try again. 403: authenticated or not, the answer is no.',
      capClass: '{cls} ({name}): {whose}.',
      capCore: 'Only the book\'s five codes.',
      capCoreNone: 'None of the book\'s five codes is in this class.',
      activeN: ['{n} code lit.', '{n} codes lit.'],
      capSel: '{code} · {meaning}.',

      explain: '<p>Every response carries a [[status code]], a three-digit number that says how the request went. ' +
        'The first digit is the class: 1xx an interim answer, 2xx success, 3xx [[redirection]], 4xx client error, 5xx server error. ' +
        'The other two digits sort nothing: a client that does not know a code reads it as the x00 of its class, so an unknown 471 is a 400 to it.</p>' +
        '<p>The code is short; the rest is in a [[header]]. A 301 carries no new address, the <code>Location</code> header does, and that is why a redirect is two exchanges: ' +
        'a [[request and response]] for the old address, then a new request for the new one (the book\'s Example 3). 301 and 308 are permanent, 302 and 307 temporary; ' +
        '307 and 308 keep the method, so POST stays POST.</p>' +
        '<p>304 answers a conditional request: the [[resource]] has not changed, the response has no body, and the client shows the copy from its [[cache]]. ' +
        '401 asks you to authenticate; 403 refuses even when you have.</p>' +
        '<p>Common mistakes: a 404 does not mean the server is down, since it is the server that answered; ' +
        'the problem is in the request the client sent. A redirect is not one exchange but two. 401 and 403 are not the same.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
