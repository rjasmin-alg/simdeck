/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of http-caching, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   Header values, ETags, paths and status lines are data (the page marks them translate="no"), not strings here.
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Preglednik, rubni poslužitelj CDN-a i ishodišni poslužitelj',
      sec: '{v}\u00a0s',
      bytes: '{n} B',
      whoBrowser: 'preglednik',
      whoBrowserX: 'preglednik {x}',
      whoEdge: 'rubni poslužitelj',
      whoOrigin: 'ishodišni poslužitelj',

      laneBrowser: 'Preglednik',
      tagPrivate: 'privatna predmemorija',
      laneEdge: 'Rubni poslužitelj CDN-a',
      tagShared: 'zajednička predmemorija',
      laneOrigin: 'Ishodišni poslužitelj',

      empty: 'ništa spremljeno',
      emptyNone: 'još nije dobio odgovor',
      emptyNoStore: 'no-store: ne sprema',
      emptyPrivate: 'private: zajednička predmemorija ne sprema',
      fresh: 'svjež',
      stale: 'zastario',
      wStored: 'spremljen',
      wRevalidated: 'provjeren',
      wChanged: 'promijenjena',
      storedAt: 'zapisan ili provjeren u {t}',
      arrivedAge: 'stigao s Age {a}',
      ageOf: 'star {a}, {d} {l}',
      ageNoCache: 'star {a} · no-cache: provjera prije svake upotrebe',
      file: 'datoteka',
      sends: 'šalje',
      nextChange: 'idući korak ({t}): datoteka postaje {tag}',

      noBody: 'bez tijela',
      rowChanged: 'datoteka promijenjena:',
      rowHit: 'iz predmemorije, bez zahtjeva',
      chartEmpty: 'Još nema poruka. Pritisni → za prvi zahtjev.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],

      capStart: 'Još nitko nije pitao za {url}. Ishodišni poslužitelj uz svaki odgovor šalje {cc}. Pritisni → za prvi zahtjev.',
      capMiss: '{who} nema ništa spremljeno i šalje običan GET.',
      capHit: '{who}: zapis je star {age}, a {dir}: još je svjež. Prikazuje ga iz svoje predmemorije, bez ijedne poruke na mreži (Age: {a}).',
      capStale: '{who}: zapis je star {age}, a {dir}: više nije svjež. Šalje If-None-Match: {tag}.',
      capNoCache: '{who}: zapis postoji, ali uz no-cache smije se upotrijebiti tek nakon provjere. Šalje If-None-Match: {tag}.',
      capEdgeMiss: 'Rubni poslužitelj nema ništa spremljeno i prosljeđuje zahtjev kakav jest.',
      capEdgePrivate: 'Rubni poslužitelj nema ništa: uz private zajednička predmemorija ne smije spremiti odgovor. Prosljeđuje zahtjev kakav jest.',
      capEdge304: 'Zapis na rubnom poslužitelju star je {age}, a {dir}: svjež je i ima isti ETag. Rubni poslužitelj sam odgovara 304 bez tijela, uz Age: {a}; ishodišni poslužitelj nitko ne pita.',
      capEdge200: 'Zapis na rubnom poslužitelju star je {age}, a {dir}: svjež je. Rubni poslužitelj odgovara 200 s tijelom iz svoje predmemorije, uz Age: {a}; ishodišni poslužitelj nitko ne pita.',
      capEdge200Diff: 'Zapis na rubnom poslužitelju star je {age}, a {dir}: svjež je, ali s oznakom {tag}, a ne {mine}. Rubni poslužitelj odgovara 200 s tijelom iz svoje predmemorije, uz Age: {a}; ishodišni poslužitelj nitko ne pita.',
      capEdgeStale: 'Zapis na rubnom poslužitelju star je {age}, a {dir}: nije svjež, pa rubni poslužitelj pita ishodišni s If-None-Match: {tag}.',
      capEdgeNoCache: 'Zapis na rubnom poslužitelju ima no-cache: rubni poslužitelj pita ishodišni s If-None-Match: {tag}.',
      capOrigin304: 'Ishodišni poslužitelj još uvijek ima ETag {tag}: odgovara 304 Not Modified, bez tijela.',
      capOriginNew: 'Ishodišni poslužitelj sada ima ETag {tag}: odgovara 200 s novim tijelom ({size}).',
      capOrigin200: 'Ishodišni poslužitelj odgovara 200 s cijelim tijelom ({size}) i oznakom ETag {tag}.',
      capBothFresh: 'Rubni poslužitelj osvježava svoj zapis i šalje 304 dalje: i {who} ima isti ETag. Oba su zapisa opet svježa, a tijelo nije ponovno poslano.',
      capBothChecked: 'Rubni poslužitelj šalje 304 dalje: i {who} ima isti ETag. Oba zadržavaju zapise bez ponovnog slanja tijela, a uz no-cache idući put opet pitaju.',
      capEdgeAfter200: 'Zapis na rubnom poslužitelju potvrđen je; {who} ima drukčiji ETag, pa dobiva 200 s tijelom s rubnog poslužitelja.',
      capEdgeAfter200Miss: 'Zapis na rubnom poslužitelju potvrđen je i {who} dobiva 200 s tijelom s rubnog poslužitelja.',
      capNoStore: 'Uz no-store nitko ništa ne sprema: idući zahtjev opet ide do ishodišnog poslužitelja.',
      capStaleOnArrival: '{who} sprema odgovor s Age: {a}, a {dir}: zapis je zastario čim je stigao.',
      capStillStale: '{who} osvježava zapis s Age: {a}, a {dir}: zapis je i dalje zastario, pa će i idući put pitati.',
      capNowHolds: '{who} sada ima {tag}.',
      capFreshAgain: '{who} osvježava svoj zapis: opet je svjež, a tijelo nije ponovno poslano.',
      capChange: '{t}: Datoteka na ishodišnom poslužitelju mijenja se: {old} → {tag}. Nijedna predmemorija za to ne zna.',
      capHidden: 'Tko ima svjež zapis, i dalje daje staru inačicu: {list}.',
      capHolder: '{who} još {left}',
      capNobody: 'Nitko nema svjež zapis, pa će idući zahtjev doći do promjene.',
      capEnd: 'Kraj. Promijeni Cache-Control i gledaj iste zahtjeve iznova, ili pritisni O.',
      capEndFull: 'Kraj. Promijeni Cache-Control i gledaj iste zahtjeve iznova.',

      pCc: 'Što ishodišni poslužitelj šalje',
      pInterval: 'Razmak između zahtjeva',
      pBrowsers: 'Preglednici',
      oneBrowser: 'jedan',
      twoBrowsers: 'dva (A i B)',
      bChange: 'Promijeni datoteku',
      pChanges: 'Promjene datoteke',
      noteFirst: 'O: prvi zahtjev još nije poslan, pa promjena ne bi ništa pokazala.',
      noteAlready: 'O: datoteka se već mijenja prije idućeg zahtjeva.',
      noteFull: 'O: više koraka ne stane u demonstraciju (najviše 20).',
      noteSet: 'O: datoteka na ishodišnom poslužitelju promijenit će se u idućem koraku.',

      prMaxAge: 'Svjež pa zastario (max-age)',
      prMaxAgeHint: 'Korak 3: zapis star točno 60 s više nije svjež → 304',
      prChanged: 'Promijenjena datoteka',
      prChangedHint: 'U 20 s stiže v2, a preglednik u 30 s još daje v1',
      prNoCache: 'no-cache: provjeri svaki put',
      prNoCacheHint: 'Spremljeno je, ali svaki zahtjev ide do ishodišnog poslužitelja: 304',
      prNoStore: 'no-store: ne spremaj',
      prNoStoreHint: 'Nitko ne sprema: svaki put cijelo tijelo',
      prEdge: 'Rubni poslužitelj i dva preglednika',
      prEdgeHint: 'B u 120 s dobiva kopiju s rubnog poslužitelja; zatim probaj private',

      legFresh: 'svjež zapis',
      legStale: 'zastario zapis',
      legEmpty: 'ništa spremljeno',
      legBody: 'poruka; 200 s tijelom',
      legNoBody: '304 bez tijela',
      legChanged: 'zapisan ili provjeren u ovom koraku',

      explain: '<p>[[cache]] čuva kopiju odgovora da idući zahtjev za isti URL ne bi morao ići sve do izvora, a to je ' +
        '[[origin server]]. Ovdje postoje dvije vrste: svaki preglednik ima svoju <i>private cache</i> (privatna predmemorija), a ' +
        'rubni poslužitelj CDN-a je <i>shared cache</i> (zajednička predmemorija) koju dijele mnogi korisnici.</p>' +
        '<p>Koliko se dugo zapis smije upotrebljavati, kaže <code>Cache-Control</code>, [[header field]] u odgovoru. Zapis je ' +
        '<i>fresh</i> (svjež) dok mu je starost manja od <code>max-age</code> (zajednička predmemorija uzima <code>s-maxage</code> ' +
        'ako ga ima); od te starosti nadalje on je <i>stale</i> (zastario). Svjež se zapis upotrebljava bez pitanja, a ' +
        'odgovor nosi <code>Age</code>: koliko je davno ishodišni poslužitelj odgovor napravio ili potvrdio. Zapis s rubnog ' +
        'poslužitelja zato stiže već star.</p>' +
        '<p>Zastario se zapis ne baca. Predmemorija šalje <i>conditional request</i> (uvjetni zahtjev): <code>If-None-Match</code> ' +
        's oznakom zapisa, <i>entity tag</i> (oznaka inačice), <code>ETag</code>. Ako se datoteka nije promijenila, odgovor je ' +
        '<code>304 Not Modified</code> bez tijela i zapis je opet svjež; ako jest, stiže <code>200</code> s novim tijelom i novom ' +
        'oznakom. To je <i>revalidation</i> (ponovna provjera).</p>' +
        '<p><code>no-cache</code> ne znači „ne spremaj”: zapis se sprema, ali se provjerava prije svake upotrebe. ' +
        '<code>no-store</code> znači da ga nitko ne sprema, a <code>private</code> da ga smije spremiti samo preglednik, nikad ' +
        'rubni poslužitelj. Ni ponovno učitavanje ne donosi uvijek novu inačicu: dok je zapis svjež, promjena na ishodišnom ' +
        'poslužitelju ostaje skrivena, kao DNS zapis dok mu ne istekne TTL.</p>' +
        '<p>Izvan opsega: zapisi datirani poljem <code>Last-Modified</code> i provjeravani s <code>If-Modified-Since</code> (ista ' +
        'ideja, s datumom umjesto oznake), <code>Vary</code>, heurističko određivanje svježine i brisanje sadržaja s rubnog ' +
        'poslužitelja.</p>'
    },
    en: {
      stage: 'Browser, CDN edge and origin server',
      sec: '{v}\u00a0s',
      bytes: '{n} B',
      whoBrowser: 'the browser',
      whoBrowserX: 'browser {x}',
      whoEdge: 'the edge',
      whoOrigin: 'the origin',

      laneBrowser: 'Browser',
      tagPrivate: 'private cache',
      laneEdge: 'CDN edge',
      tagShared: 'shared cache',
      laneOrigin: 'Origin server',

      empty: 'nothing stored',
      emptyNone: 'no response yet',
      emptyNoStore: 'no-store: not stored',
      emptyPrivate: 'private: a shared cache does not store it',
      fresh: 'fresh',
      stale: 'stale',
      wStored: 'stored',
      wRevalidated: 'revalidated',
      wChanged: 'changed',
      storedAt: 'written or revalidated at {t}',
      arrivedAge: 'arrived with Age {a}',
      ageOf: 'age {a}, {d} {l}',
      ageNoCache: 'age {a} · no-cache: check before every use',
      file: 'file',
      sends: 'sends',
      nextChange: 'next step ({t}): the file becomes {tag}',

      noBody: 'no body',
      rowChanged: 'file changed:',
      rowHit: 'from cache, no request',
      chartEmpty: 'No messages yet. Press → for the first request.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],

      capStart: 'Nobody has asked for {url} yet. The origin server sends {cc} with every response. Press → for the first request.',
      capMiss: '{who} has nothing stored and sends a plain GET.',
      capHit: '{who}: its copy is {age} old and {dir}: still fresh. It shows it from its own cache, with no message on the network (Age: {a}).',
      capStale: '{who}: its copy is {age} old and {dir}: it is no longer fresh. It sends If-None-Match: {tag}.',
      capNoCache: '{who}: it has a copy, but with no-cache it may use it only after checking. It sends If-None-Match: {tag}.',
      capEdgeMiss: 'The edge has nothing stored and forwards the request as it is.',
      capEdgePrivate: 'The edge holds nothing: with private, a shared cache may not store the response. It forwards the request as it is.',
      capEdge304: 'The edge\'s copy is {age} old and {dir}: fresh, with the same ETag. The edge answers 304 itself, with no body and Age: {a}; nobody asks the origin.',
      capEdge200: 'The edge\'s copy is {age} old and {dir}: fresh. The edge answers 200 with the body from its cache and Age: {a}; nobody asks the origin.',
      capEdge200Diff: 'The edge\'s copy is {age} old and {dir}: fresh, but tagged {tag}, not {mine}. The edge answers 200 with the body from its cache and Age: {a}; nobody asks the origin.',
      capEdgeStale: 'The edge\'s copy is {age} old and {dir}: not fresh, so the edge asks the origin with If-None-Match: {tag}.',
      capEdgeNoCache: 'The edge\'s copy has no-cache: the edge asks the origin with If-None-Match: {tag}.',
      capOrigin304: 'The origin\'s ETag is still {tag}: it answers 304 Not Modified, with no body.',
      capOriginNew: 'The origin now has ETag {tag}: it answers 200 with the new body ({size}).',
      capOrigin200: 'The origin answers 200 with the whole body ({size}) and ETag {tag}.',
      capBothFresh: 'The edge refreshes its copy and passes 304 on: {who} has the same ETag. Both copies are fresh again, and the body was not sent again.',
      capBothChecked: 'The edge passes 304 on: {who} has the same ETag. Both keep their copies without the body being sent again, and with no-cache they ask again next time.',
      capEdgeAfter200: 'The edge\'s copy is confirmed; {who} has a different ETag, so it gets 200 with the body from the edge.',
      capEdgeAfter200Miss: 'The edge\'s copy is confirmed, and {who} gets 200 with the body from the edge.',
      capNoStore: 'With no-store nobody stores anything: the next request goes all the way to the origin again.',
      capStaleOnArrival: '{who} stores it with Age: {a}, and {dir}: the copy is stale the moment it arrives.',
      capStillStale: '{who} refreshes its copy with Age: {a}, and {dir}: it is still stale, so next time it asks again.',
      capNowHolds: '{who} now holds {tag}.',
      capFreshAgain: '{who} refreshes its copy: fresh again, and the body was not sent again.',
      capChange: '{t}: The file at the origin changes: {old} → {tag}. No cache is told.',
      capHidden: 'Whoever holds a fresh copy keeps handing out the old version: {list}.',
      capHolder: '{who} for another {left}',
      capNobody: 'Nobody holds a fresh copy, so the next request will reach the change.',
      capEnd: 'End. Change Cache-Control to replay the same requests, or press O.',
      capEndFull: 'End. Change Cache-Control to replay the same requests.',

      pCc: 'What the origin sends',
      pInterval: 'Time between requests',
      pBrowsers: 'Browsers',
      oneBrowser: 'one',
      twoBrowsers: 'two (A and B)',
      bChange: 'Change the file',
      pChanges: 'File changes',
      noteFirst: 'O: the first request has not been made yet, so a change would show nothing.',
      noteAlready: 'O: the file already changes before the next request.',
      noteFull: 'O: no more steps fit in the demo (20 at most).',
      noteSet: 'O: the file at the origin will change in the next step.',

      prMaxAge: 'Fresh, then stale (max-age)',
      prMaxAgeHint: 'Step 3: a copy exactly 60 s old is no longer fresh → 304',
      prChanged: 'The file changes',
      prChangedHint: 'v2 arrives at 20 s; at 30 s the browser still shows v1',
      prNoCache: 'no-cache: check every time',
      prNoCacheHint: 'Stored, but every request goes to the origin: 304',
      prNoStore: 'no-store: do not store',
      prNoStoreHint: 'Nobody stores: the whole body every time',
      prEdge: 'The edge and two browsers',
      prEdgeHint: 'At 120 s B is served by the edge; then try private',

      legFresh: 'fresh copy',
      legStale: 'stale copy',
      legEmpty: 'nothing stored',
      legBody: 'message; 200 with a body',
      legNoBody: '304 with no body',
      legChanged: 'written or revalidated this step',

      explain: '<p>A [[cache]] keeps a copy of a response so that the next request for the same URL need not go all the way ' +
        'to the [[origin server]]. There are two kinds here: each browser has its own <i>private cache</i>, and the CDN edge is a ' +
        '<i>shared cache</i> that many users share.</p>' +
        '<p>How long a copy may be used is said by <code>Cache-Control</code>, a [[header field]] in the response. A copy is ' +
        '<i>fresh</i> while its age is less than <code>max-age</code> (a shared cache takes <code>s-maxage</code> if there is ' +
        'one); from that age on it is <i>stale</i>. A fresh copy is used without asking anyone, and the response carries ' +
        '<code>Age</code>: how long ago the origin made or confirmed it. So a copy from the edge arrives already aged.</p>' +
        '<p>A stale copy is not thrown away. The cache sends a <i>conditional request</i>: <code>If-None-Match</code> with the ' +
        'copy\'s <i>entity tag</i>, the <code>ETag</code>. If the file has not changed, the answer is <code>304 Not ' +
        'Modified</code> with no body, and the copy is fresh again; if it has, a <code>200</code> comes with the new body and the ' +
        'new tag. This is <i>revalidation</i>.</p>' +
        '<p><code>no-cache</code> does not mean "do not cache": the copy is stored, but checked before every use. ' +
        '<code>no-store</code> means nobody stores it, and <code>private</code> that only the browser may store it, never the ' +
        'edge. Nor does reloading always bring the new version: while a copy is fresh, a change at the origin stays hidden, like ' +
        'a DNS record until its TTL runs out.</p>' +
        '<p>Out of scope: copies dated by <code>Last-Modified</code> and checked with <code>If-Modified-Since</code> (the same ' +
        'idea, with a date instead of a tag), <code>Vary</code>, heuristic freshness and purging content from the edge.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
