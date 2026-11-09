/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of xss, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks them
   up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   HTML, paths, cookies and host names are data: the page puts them in translate="no" elements.
   The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Komentari na blogu: napadač, poslužitelj i preglednik žrtve',
      // params
      kind: 'Vrsta',
      kindStored: 'pohranjeni',
      kindReflected: 'reflektirani',
      encoding: 'Izlaz',
      encNone: 'bez kodiranja',
      encHtml: 'HTML-kodiran',
      encText: 'textContent',
      payload: 'Unos',
      payScript: '<script>',
      payImg: '<img onerror>',
      payPlain: 'običan',
      payOwn: 'vlastiti',
      payloadHint: 'Ili upiši svoj unos u polje na pozornici.',
      httpOnly: 'HttpOnly kolačić',
      csp: 'CSP: bez skripti u stranici',
      cspHint: 'Druga linija obrane, ne zamjena za kodiranje.',
      // presets
      presetStoredRaw: 'Pohranjeni',
      presetStoredRawHint: 'Komentar sa <script>, bez kodiranja izlaza.',
      presetReflected: 'Reflektirani',
      presetReflectedHint: 'Unos u poveznici, ništa se ne sprema.',
      presetImg: '<img onerror>',
      presetImgHint: 'Bez <script>, ali s rukovateljem događajem.',
      presetEncoded: 'HTML-kodiranje',
      presetEncodedHint: 'Isti komentar, HTML-kodiran.',
      presetHttpOnly: 'HttpOnly',
      presetHttpOnlyHint: 'Skripta se izvodi, ali kolačić ne vidi.',
      // legend
      legendInput: 'unos',
      legendLive: 'živi čvor',
      legendText: 'doslovan tekst',
      legendRan: 'kod se izveo',
      legendCookie: 'kolačić odlazi',
      legendChanged: 'u ovom koraku',
      // lanes
      markA: 'N',
      markS: 'P',
      markV: 'Ž',
      laneA: 'Napadač',
      laneS: 'Poslužitelj',
      laneV: 'Preglednik žrtve',
      aHas: 'ima:',
      aNothing: 'ništa',
      sOutput: 'izlaz:',
      sComments: ['{n} komentar', '{n} komentara', '{n} komentara'],
      sSavesNothing: 'tražilica ne sprema ništa',
      vCookie: 'kolačić:',
      vReads: 'skripta čita:',
      vEmpty: 'prazno',
      on: 'uključen',
      off: 'isključen',
      chartEmpty: 'Još nema poruka.',
      earlier: ['↑ {n} ranija poruka', '↑ {n} ranije poruke', '↑ {n} ranijih poruka'],
      rowLink: 'poveznica',
      fieldsHtml: 'HTML stranice',
      noteSaved: 'sprema #{id}',
      noteReflect: 'q → stranica, ništa ne sprema',
      noteRan: '▶ kod se izvodi',
      noteCsp: '⛔ CSP odbija kod',
      noteArmed: '◇ kod čeka klik',
      noteMarkup: 'unos je oznaka',
      noteText: 'unos je tekst',
      noteCookieEmpty: 'document.cookie prazan',
      noteRead: 'čita kolačić, ne šalje',
      noteFix: 's kodiranjem: tekst',
      // input card
      formStored: 'Obrazac za komentar',
      formReflected: 'Tražilica bloga',
      fieldLabelStored: 'Komentar',
      fieldLabelReflected: 'Traži',
      fieldHint: 'Upiši svoj unos; izbor „Unos” prelazi na „vlastiti”.',
      storeTitle: 'Spremljeni komentari',
      linkTitle: 'Poveznica koju napadač šalje',
      markupMark: '⚠ sadrži oznake',
      reachEvery: 'Dobiva ga svaki posjetitelj stranice {path} i svaki sljedeći.',
      reachLink: 'Dobiva ga samo onaj tko otvori ovu poveznicu; pretraga bilo čega drugog je čista.',
      reachNone: 'Tko ga dobiva: vidi se kad unos stigne na poslužitelj.',
      // panes
      textTitle: 'Odgovor kao tekst',
      textSub: 'što preglednik prima',
      treeTitle: 'Stablo stranice (DOM)',
      treeSub: 'što preglednik izgradi',
      fixTitle: 'isti unos, HTML-kodiran',
      dataLine: 'podaci, upisani kao textContent:',
      paneEmpty: 'Još nema odgovora.',
      // log
      logTitle: 'Dnevnik preglednika žrtve',
      logEmpty: 'Žrtva još nije otvorila stranicu.',
      logRan: '▶ izvodi se {what}: {code}',
      logCsp: '⛔ CSP odbija {what}: {code}',
      logArmed: '◇ {what} čeka klik ili prelazak mišem: {code}',
      logMarkup: 'unos je postao oznaka {tags}; ništa se ne izvodi',
      logText: 'unos je tekst; ništa se ne izvodi',
      logSent: '⇢ šalje {sid} na {host}',
      logCookieEmpty: 'document.cookie → "" (kolačić je HttpOnly)',
      logRead: 'document.cookie → {sid}; kod ga ne šalje',
      logNothingRan: 'ništa se nije izvelo; ništa ne odlazi',
      logRanNoCookie: 'kod ne čita kolačić; ništa ne odlazi',
      logFix: 's HTML-kodiranjem: doslovan tekst, ništa se ne izvodi',
      whatScript: '<script>',
      whatHandler: '{event} na <{tag}>',
      whatUrl: 'javascript: adresa na <{tag}>',
      // captions
      capStart: 'Članak na blogu ima dva komentara. Napadač u obrazac upisuje {input}. Pritisni → za sljedeći korak.',
      capStartRefl: 'Tražilica bloga ispisuje traženi pojam u stranicu s rezultatima. Napadač gradi poveznicu s pojmom {input}. Pritisni →.',
      capPost: 'Korak 1: napadač šalje komentar poslužitelju ({req}).',
      capLink: 'Korak 1: napadač šalje žrtvi poveznicu (poruka, objava); unos je u parametru q adrese.',
      capStore: 'Korak 2: poslužitelj sprema komentar #{id} točno kako je stigao. Od sada je u stranici za svakog posjetitelja.',
      capClick: 'Korak 2: žrtva otvori poveznicu; preglednik šalje unos poslužitelju u adresi.',
      capOpen: 'Korak 3: žrtva, prijavljena na blog, otvara članak; preglednik uz zahtjev šalje i kolačić sesije.',
      capReflect: 'Korak 3: poslužitelj prepisuje q u stranicu s rezultatima i ništa ne sprema. Tko otvori blog bez ove poveznice, dobiva čistu stranicu.',
      capRespNone: 'Korak 4: odgovor stiže i preglednik ga raščlanjuje. Unos je u HTML zalijepljen bez kodiranja.',
      capRespHtml: 'Korak 4: odgovor stiže i preglednik ga raščlanjuje. Unos je HTML-kodiran: < i > stižu kao &lt; i &gt;.',
      capRespText: 'Korak 4: odgovor stiže s praznim mjestom {slot}; skripta same stranice u njega upisuje unos kao textContent, kao podatak.',
      capCspHeader: 'Odgovor nosi i CSP: skripte u samoj stranici nisu dopuštene.',
      capRanLead: 'Bez kodiranja izlaza komentar postaje čvor u stablu stranice, a ne tekst.',
      capRanLeadRefl: 'Bez kodiranja izlaza traženi pojam postaje čvor u stablu stranice, a ne tekst.',
      capRan: 'Kod se izvodi u pregledniku žrtve, s njezinim pravima.',
      capRanImg: 'Nema <script>: dovoljan je rukovatelj događajem onerror na slici koja se ne može učitati.',
      capRanHandler: 'Nema <script>: dovoljan je rukovatelj događajem {event}.',
      capCsp: 'CSP ne dopušta kod u stranici, pa ga preglednik odbija. To je druga linija obrane: propust je i dalje tu.',
      capArmed: 'Kod u čvoru čeka da žrtva klikne ili prijeđe mišem.',
      capMarkup: 'Unos je postao oznaka, ali u njoj se ništa ne izvodi. Isti put propušta i skripte.',
      capTextHtml: 'HTML-kodiranje: isti unos sada se prikazuje kao doslovan tekst, skripta se ne izvodi.',
      capTextContent: 'textContent: unos ulazi u stablo kao jedan tekstni čvor; ništa se ne raščlanjuje, skripta se ne izvodi.',
      capTextPlain: 'Unos nema oznaka, pa ostaje tekst i bez kodiranja. Isti put ipak propušta svaki unos s oznakama.',
      capStolen: 'Korak 6: steal() čita document.cookie i šalje {sid} na {host}. Napadač sada ima sesiju žrtve i nastupa u njezino ime.',
      capHttpOnly: 'Korak 6: kolačić je HttpOnly, pa document.cookie skripti vraća prazno i sesija ne odlazi. Skripta se ipak izvodi u ime žrtve.',
      capRead: 'Korak 6: kod čita document.cookie i vidi {sid}, ali ga nikamo ne šalje. Napadačev steal() bi ga poslao: zato HttpOnly.',
      capNothingRan: 'Korak 6: ništa se nije izvelo, pa se ništa ne čita i ne šalje.',
      capRanNoCookie: 'Korak 6: kod se izveo s pravima žrtve, ali ne čita kolačić.',
      capFix: 'Korak 7, ispravak. HTML-kodiranje: isti unos sada se prikazuje kao doslovan tekst, skripta se ne izvodi.',
      explain: '<p><i>Cross-site scripting</i> (skriptiranje među stranicama, XSS): unos jednog korisnika završi u stranici ' +
        'drugog kao kod. Preglednik o tome što je kod, a što tekst, odlučuje po strukturi HTML-a dok ga raščlanjuje; ' +
        'unos s oznakama zalijepljen bez kodiranja postaje oznaka, čvor u stablu stranice (<i>DOM</i>).</p>' +
        '<p><i>Stored XSS</i> (pohranjeni XSS): unos je spremljen i izvodi se svakom sljedećem posjetitelju. ' +
        '<i>Reflected XSS</i> (reflektirani XSS): poslužitelj vraća unos iz zahtjeva i ništa ne sprema, pa pogađa samo ' +
        'onoga tko otvori podmetnutu poveznicu.</p>' +
        '<p>Popravak je <i>output encoding</i> (kodiranje izlaza) prema mjestu gdje unos ide: u tijelu HTML-a ' +
        'znakovi &lt; &gt; &amp; " \' postaju &amp;lt; &amp;gt; &amp;amp; &amp;quot; &amp;#x27;. Vrijednost atributa i ' +
        'JavaScript traže svoje kodiranje, a adresa i više od toga: <code>javascript:</code> u <code>href</code> ' +
        'nijedno kodiranje ne mijenja, pa se dopuštaju samo adrese http i https. ' +
        'Upisati unos kao textContent umjesto innerHTML znači da ga preglednik uopće ne raščlanjuje.</p>' +
        '<p>Brisanje <code>&lt;script&gt;</code> iz unosa nije dovoljno: onerror, onload i <code>javascript:</code> adrese ' +
        'izvode kod i bez njega. Ni sama provjera ulaza nije popravak; <i>sanitization</i> (čišćenje unosa) pomaže tek kad ' +
        'stranica mora prikazati dopušteni HTML. XSS nije samo nagrđena stranica: kod radi s pravima žrtve.</p>' +
        '<p>Kolačić s oznakom HttpOnly skripta ne može pročitati, ali može slati zahtjeve u ime žrtve. ' +
        'CSP koji zabranjuje kod u stranici zaustavlja ubačeni kod i kad kodiranje izostane; to je druga linija obrane.</p>'
    },
    en: {
      stage: 'Blog comments: the attacker, the server and the victim\'s browser',
      // params
      kind: 'Kind',
      kindStored: 'stored',
      kindReflected: 'reflected',
      encoding: 'Output',
      encNone: 'raw',
      encHtml: 'HTML-encoded',
      encText: 'textContent',
      payload: 'Input',
      payScript: '<script>',
      payImg: '<img onerror>',
      payPlain: 'plain',
      payOwn: 'your own',
      payloadHint: 'Or type your own input in the field on the stage.',
      httpOnly: 'HttpOnly cookie',
      csp: 'CSP: no inline scripts',
      cspHint: 'Defence in depth, not a substitute for encoding.',
      // presets
      presetStoredRaw: 'Stored',
      presetStoredRawHint: 'A comment with <script>, no output encoding.',
      presetReflected: 'Reflected',
      presetReflectedHint: 'The input is in a link; nothing is saved.',
      presetImg: '<img onerror>',
      presetImgHint: 'No <script>, but an event handler.',
      presetEncoded: 'HTML encoding',
      presetEncodedHint: 'The same comment, HTML-encoded.',
      presetHttpOnly: 'HttpOnly',
      presetHttpOnlyHint: 'The script runs but cannot see the cookie.',
      // legend
      legendInput: 'input',
      legendLive: 'live node',
      legendText: 'literal text',
      legendRan: 'code ran',
      legendCookie: 'cookie leaves',
      legendChanged: 'this step',
      // lanes
      markA: 'A',
      markS: 'S',
      markV: 'V',
      laneA: 'Attacker',
      laneS: 'Server',
      laneV: 'Victim\'s browser',
      aHas: 'has:',
      aNothing: 'nothing',
      sOutput: 'output:',
      sComments: ['{n} comment', '{n} comments'],
      sSavesNothing: 'search saves nothing',
      vCookie: 'cookie:',
      vReads: 'script reads:',
      vEmpty: 'empty',
      on: 'on',
      off: 'off',
      chartEmpty: 'No messages yet.',
      earlier: ['↑ {n} earlier message', '↑ {n} earlier messages'],
      rowLink: 'link',
      fieldsHtml: 'the page\'s HTML',
      noteSaved: 'saves #{id}',
      noteReflect: 'q → page, saves nothing',
      noteRan: '▶ code runs',
      noteCsp: '⛔ CSP refuses code',
      noteArmed: '◇ code waits for a click',
      noteMarkup: 'input is markup',
      noteText: 'input is text',
      noteCookieEmpty: 'document.cookie empty',
      noteRead: 'reads the cookie, sends nothing',
      noteFix: 'encoded: text',
      // input card
      formStored: 'Comment form',
      formReflected: 'Blog search',
      fieldLabelStored: 'Comment',
      fieldLabelReflected: 'Search',
      fieldHint: 'Type your own input; the "Input" choice switches to "your own".',
      storeTitle: 'Saved comments',
      linkTitle: 'The link the attacker sends',
      markupMark: '⚠ contains markup',
      reachEvery: 'Every visitor of {path} gets it, and every later one.',
      reachLink: 'Only whoever opens this link gets it; a search for anything else is clean.',
      reachNone: 'Who gets it: shown once the input reaches the server.',
      // panes
      textTitle: 'Response as text',
      textSub: 'what the browser receives',
      treeTitle: 'Page tree (DOM)',
      treeSub: 'what the browser builds',
      fixTitle: 'the same input, HTML-encoded',
      dataLine: 'data, set as textContent:',
      paneEmpty: 'No response yet.',
      // log
      logTitle: 'The victim\'s browser log',
      logEmpty: 'The victim has not opened the page yet.',
      logRan: '▶ runs {what}: {code}',
      logCsp: '⛔ CSP refuses {what}: {code}',
      logArmed: '◇ {what} waits for a click or hover: {code}',
      logMarkup: 'the input became markup {tags}; nothing runs',
      logText: 'the input is text; nothing runs',
      logSent: '⇢ sends {sid} to {host}',
      logCookieEmpty: 'document.cookie → "" (the cookie is HttpOnly)',
      logRead: 'document.cookie → {sid}; the code does not send it',
      logNothingRan: 'nothing ran; nothing leaves',
      logRanNoCookie: 'the code does not read the cookie; nothing leaves',
      logFix: 'HTML-encoded: literal text, nothing runs',
      whatScript: '<script>',
      whatHandler: '{event} on <{tag}>',
      whatUrl: 'a javascript: URL on <{tag}>',
      // captions
      capStart: 'The blog post has two comments. The attacker types {input} into the form. Press → for the next step.',
      capStartRefl: 'The blog\'s search writes the search term into its results page. The attacker builds a link with the term {input}. Press →.',
      capPost: 'Step 1: the attacker sends the comment to the server ({req}).',
      capLink: 'Step 1: the attacker sends the victim a link (a message, a post); the input is in the URL\'s q parameter.',
      capStore: 'Step 2: the server saves comment #{id} exactly as it arrived. From now on it is in the page for every visitor.',
      capClick: 'Step 2: the victim opens the link; the browser sends the input to the server in the URL.',
      capOpen: 'Step 3: the victim, logged in to the blog, opens the post; the browser sends the session cookie with the request.',
      capReflect: 'Step 3: the server copies q into the results page and saves nothing. Whoever opens the blog without this link gets a clean page.',
      capRespNone: 'Step 4: the response arrives and the browser parses it. The input was pasted into the HTML without encoding.',
      capRespHtml: 'Step 4: the response arrives and the browser parses it. The input is HTML-encoded: < and > arrive as &lt; and &gt;.',
      capRespText: 'Step 4: the response arrives with an empty slot {slot}; the page\'s own script puts the input in as textContent, as data.',
      capCspHeader: 'The response also carries a CSP: no scripts inside the page.',
      capRanLead: 'Without output encoding the comment becomes a node in the page tree, not text.',
      capRanLeadRefl: 'Without output encoding the search term becomes a node in the page tree, not text.',
      capRan: 'The code runs in the victim\'s browser, with the victim\'s rights.',
      capRanImg: 'No <script>: an onerror handler on an image that fails to load is enough.',
      capRanHandler: 'No <script>: an {event} event handler is enough.',
      capCsp: 'The CSP does not allow code inside the page, so the browser refuses it. That is defence in depth: the flaw is still there.',
      capArmed: 'The code in the node waits for the victim to click or hover.',
      capMarkup: 'The input became markup, but nothing in it runs. The same path lets scripts through.',
      capTextHtml: 'HTML encoding: the same input is now shown as literal text and the script does not run.',
      capTextContent: 'textContent: the input enters the tree as one text node; nothing is parsed and the script does not run.',
      capTextPlain: 'The input has no markup, so it stays text even without encoding. The same path still lets any input with markup through.',
      capStolen: 'Step 6: steal() reads document.cookie and sends {sid} to {host}. The attacker now holds the victim\'s session and acts as the victim.',
      capHttpOnly: 'Step 6: the cookie is HttpOnly, so document.cookie returns nothing to the script and the session does not leave. The script still runs as the victim.',
      capRead: 'Step 6: the code reads document.cookie and sees {sid}, but sends it nowhere. The attacker\'s steal() would send it: hence HttpOnly.',
      capNothingRan: 'Step 6: nothing ran, so nothing is read or sent.',
      capRanNoCookie: 'Step 6: the code ran with the victim\'s rights but does not read the cookie.',
      capFix: 'Step 7, the fix. HTML encoding: the same input is now shown as literal text and the script does not run.',
      explain: '<p><i>Cross-site scripting</i> (XSS): one user\'s input ends up in another user\'s page as code. The browser ' +
        'decides what is code and what is text by the structure of the HTML while it parses it; input with markup pasted ' +
        'in without encoding becomes markup, a node in the page tree (<i>DOM</i>).</p>' +
        '<p><i>Stored XSS</i>: the input is saved and runs for every later visitor. <i>Reflected XSS</i>: the server sends ' +
        'the input back from the request and saves nothing, so it hits only whoever opens the crafted link.</p>' +
        '<p>The fix is <i>output encoding</i> for the place the input goes: in the HTML body the characters &lt; &gt; &amp; ' +
        '" \' become &amp;lt; &amp;gt; &amp;amp; &amp;quot; &amp;#x27;. Attribute values and JavaScript need their own encoding, ' +
        'and a URL more than that: no encoding changes <code>javascript:</code> in an <code>href</code>, so only http and ' +
        'https addresses are allowed. Setting the input as ' +
        'textContent instead of innerHTML means the browser never parses it.</p>' +
        '<p>Removing <code>&lt;script&gt;</code> from the input is not enough: onerror, onload and <code>javascript:</code> URLs ' +
        'run code without it. Input validation alone is not the fix either; <i>sanitization</i> helps only when the page ' +
        'must show allowed HTML. XSS is not just a defaced page: the code runs with the victim\'s rights.</p>' +
        '<p>A script cannot read a cookie marked HttpOnly, but it can still send requests as the victim. A CSP that ' +
        'forbids inline code stops injected code even when encoding is missed; it is defence in depth.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
