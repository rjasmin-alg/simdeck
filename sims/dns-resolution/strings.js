/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of dns-resolution, in both languages (docs/sim-ui.md §9). Same keys in hr and en. {name} is a
   placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term. *word* is an
   English term in italics on the Croatian page (the page's rich() turns it into <em lang="en">).
   Names, addresses, record types, flags and times are data, not strings: the page writes them with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Razrješavanje imena: poruke i predmemorija rezolvera',

      // lanes
      laneS: 'Računalo',
      laneR: 'Rezolver',
      laneRoot: 'Korijen',
      laneTld: 'Vrhovna',
      laneAuth: 'grafo.hr',
      roleS: '*stub* rezolver',
      roleR: 'rekurzivni',
      roleRoot: 'korijenski poslužitelj',
      roleTld: 'domena .hr',
      roleAuth: 'mjerodavni',

      // chips and receiver words
      kQuery: 'upit',
      kReferral: 'uputa',
      kAnswer: 'odgovor',
      noteLater: '{adv} kasnije',

      // params
      name: 'Ime',
      nWww: 'www',
      nMail: 'mail',
      nNema: 'nema',
      again: 'Drugi upit',
      againSame: 'isto ime',
      advance: 'Drugi upit nakon',
      day: '1 dan',
      ttlA: 'TTL zapisa A (grafo.hr)',
      ttlNS: 'TTL delegiranja grafo.hr (NS)',
      repeat: 'Ponovi s predmemorijom',
      repeatHint: 'Skok na drugi upit: predmemorija ostaje, vrijeme ide naprijed.',

      // presets
      presetCold: 'Hladno',
      presetColdHint: 'Prazna predmemorija: 8 poruka, 3 iterativna upita',
      presetWarm: 'Toplo',
      presetWarmHint: 'Isti upit 60 s kasnije: 2 poruke',
      presetSameZone: 'Ista zona',
      presetSameZoneHint: 'mail.grafo.hr: NS za grafo.hr još je u predmemoriji',
      presetExpired: 'TTL istekao',
      presetExpiredHint: 'Nakon 3600 s: A istekao, NS vrijedi',
      presetNx: 'Nema imena',
      presetNxHint: 'NXDOMAIN, pa ponovno iz negativne predmemorije',

      // legend
      legendQuery: 'upit',
      legendReferral: 'uputa (NS)',
      legendAnswer: 'odgovor',
      legendAa: 'mjerodavan',
      legendNeg: 'negativni zapis',
      legendChanged: 'ovaj korak',

      // message card
      msgNone: 'Još nema poruka',
      msgTitle: 'Poruka {n}',
      msgFrom: 'od',
      msgTo: 'prema',
      msgQ: 'pitanje',
      msgAns: 'odgovor',
      msgNs: 'uputa',
      msgGlue: 'adrese (*glue*)',
      msgSoa: 'SOA',
      msgNeg: 'ime ne postoji',
      msgCache: 'odgovor iz predmemorije, TTL je ono što je preostalo',
      flagRd: 'traži rekurziju',
      flagRa: 'rekurzija dostupna',
      flagAa: 'mjerodavan odgovor',
      flagsNone: 'bez zastavica',

      // cache table
      cacheTitle: 'Predmemorija rezolvera',
      cacheAt: 't = {t}',
      cacheEmpty: 'prazna',
      cacheHint: 'korijenski podaci (trajno)',
      cacheExpired: 'isteklo',
      cacheGlue: '+ adrese (*glue*)',
      cacheNx: 'NXDOMAIN (negativni zapis)',
      chartEmpty: 'Još nema poruka. Pritisni → za prvi upit.',
      earlier: ['↑ {n} ranija poruka', '↑ {n} ranije poruke', '↑ {n} ranijih poruka'],

      // captions
      capStart: 'Predmemorija rezolvera je prazna: zna samo adrese korijenskih poslužitelja. Računalo traži {name}. Pritisni →.',
      capStub: 'Korak {n}: *stub* rezolver šalje jedan rekurzivni upit (rd) za {name} *resolveru* (rekurzivnom rezolveru) {r} i čeka gotov odgovor.',
      capStubAgain: 'Korak {n}: {adv} kasnije računalo traži {name}: opet jedan rekurzivni upit.',
      capMissRoot: 'U predmemoriji nema ničega bližeg od korijena: rezolver kreće od korijenskih poslužitelja.',
      capMissZone: 'Odgovora nema, ali NS za {zone} još vrijedi (još {left}): rezolver preskače sve iznad i pita ravno {server}.',
      capExpired: 'Zapis za {name} istekao je: TTL-a nije preostalo.',
      capExpiredNeg: 'Negativni zapis za {name} istekao je: rezolver opet pita.',
      capHit: 'Odgovor je u predmemoriji (još {left}): rezolver nikoga ne pita.',
      capHitNeg: 'U predmemoriji je negativni zapis za {name} (još {left}): rezolver nikoga ne pita.',
      capAsk: 'Korak {n}: rezolver pita {server} iterativnim upitom, bez rd: poslužitelj odgovara samo iz svojih podataka.',
      capAskFirst: 'Od nekoliko poznatih poslužitelja model pita prvoga s popisa.',
      capReferralRoot: 'Korak {n}: korijenski poslužitelj ne zna adresu, ali vraća uputu: NS zapise poslužitelja za .hr. *Resolver* (rekurzivni rezolver) sam pita dalje.',
      capReferral: 'Korak {n}: {server} ne zna adresu, ali vraća uputu: NS zapise poslužitelja za {zone}, uz njihove adrese, bez aa. Rezolver sam pita dalje.',
      capReferralCached: 'Uputa ide u predmemoriju na {ttl}.',
      capAnswer: 'Korak {n}: mjerodavni poslužitelj {server} odgovara iz svoje zone: A {ip}, TTL {ttl}, sa zastavicom aa. Rezolver ga sprema u predmemoriju.',
      capNxAuth: 'Korak {n}: {server} odgovara NXDOMAIN sa zastavicom aa: imena {name} nema u zoni. Uz odgovor ide SOA, pa rezolver negativni odgovor pamti min(TTL SOA {soa}, MINIMUM {min}) = {ttl}.',
      capReply: 'Korak {n}: rezolver vraća računalu gotov odgovor: A {ip}, TTL {ttl}, s ra i bez aa: rezolver nije mjerodavan za grafo.hr, prenosi ono što je saznao.',
      capReplyNx: 'Korak {n}: rezolver vraća računalu NXDOMAIN, s ra i bez aa: imena nema.',
      capReplyCache: 'Korak {n}: isti upit {adv} kasnije: odgovor stiže iz predmemorije, TTL {left}, i nijedan paket ne ide prema korijenu.',
      capReplyCacheNx: 'Korak {n}: isti upit {adv} kasnije: NXDOMAIN stiže iz predmemorije (negativni zapis, još {left}) i nijedan paket ne ide prema poslužiteljima.',
      capOnce: ['Računalo je poslalo jedan upit; rezolver je poslao {n} upit prema poslužiteljima.', 'Računalo je poslalo jedan upit; rezolver je poslao {n} upita prema poslužiteljima.', 'Računalo je poslalo jedan upit; rezolver je poslao {n} upita prema poslužiteljima.'],
      capCompare: 'Prvi put: {a} poruka, sada {b}.',
      sec: '{v} s',

      explain: '<p>Računalo samo ne razrješava imena. Njegov <em lang="en">stub resolver</em> (<i lang="en">stub</i> rezolver) postavlja jedan ' +
        '<em lang="en">recursive query</em> (rekurzivni upit, zastavica <code>rd</code>) rezolveru čiju adresu zna, i dobiva gotov odgovor ili ' +
        'pogrešku, nikad uputu.</p>' +
        '<p>Posao obavlja [[recursive resolver]]: postavlja <em lang="en">iterative queries</em> (iterativne upite) ' +
        'hijerarhiji. Ni [[root servers]] ni poslužitelj za <code>.hr</code> ne znaju adresu, ali vraćaju <em lang="en">referral</em> ' +
        '(uputu): NS zapise zone bliže imenu, uz njihove adrese (to je [[delegation]]). Tek ' +
        '[[authoritative server]] odgovara iz vlastite zone, sa zastavicom <code>aa</code>; knjiga o mrežama isti poslužitelj ' +
        'zove mjerodavnim.</p>' +
        '<p>Svaki zapis rezolver sprema u <em lang="en">cache</em> (predmemoriju) na onoliko sekundi koliko kaže njegov TTL; TTL nije broj skokova. ' +
        'Dok vrijedi, isti upit dobiva odgovor bez ijednog paketa prema van, a TTL koji rezolver javlja jest ono što je ' +
        'preostalo. Kad istekne odgovor, ali ne i NS zapisi zone, rezolver kreće od najdubljeg poznatog poslužitelja.</p>' +
        '<p>I nepostojanje imena se pamti: [[negative caching]] traje onoliko sekundi koliko je manja od ' +
        'dviju vrijednosti iz SOA zapisa zone, TTL i MINIMUM (ovdje 900 s).</p>' +
        '<p>Kad zna nekoliko poslužitelja iste zone, model pita prvoga s popisa; stvarni rezolveri biraju po izmjerenom ' +
        'vremenu odziva.</p>'
    },
    en: {
      stage: 'Name resolution: messages and the resolver\'s cache',

      laneS: 'Host',
      laneR: 'Resolver',
      laneRoot: 'Root',
      laneTld: 'TLD',
      laneAuth: 'grafo.hr',
      roleS: 'stub resolver',
      roleR: 'recursive',
      roleRoot: 'root server',
      roleTld: 'for .hr',
      roleAuth: 'authoritative',

      kQuery: 'query',
      kReferral: 'referral',
      kAnswer: 'answer',
      noteLater: '{adv} later',

      name: 'Name',
      nWww: 'www',
      nMail: 'mail',
      nNema: 'nema',
      again: 'Second query',
      againSame: 'same name',
      advance: 'Second query after',
      day: '1 day',
      ttlA: 'TTL of the A records (grafo.hr)',
      ttlNS: 'TTL of the grafo.hr delegation (NS)',
      repeat: 'Repeat warm',
      repeatHint: 'Jump to the second query: the cache stays, time moves on.',

      presetCold: 'Cold',
      presetColdHint: 'Empty cache: 8 messages, 3 iterative queries',
      presetWarm: 'Warm',
      presetWarmHint: 'The same query 60 s later: 2 messages',
      presetSameZone: 'Same zone',
      presetSameZoneHint: 'mail.grafo.hr: the NS for grafo.hr is still cached',
      presetExpired: 'TTL expired',
      presetExpiredHint: 'After 3600 s: A expired, NS still valid',
      presetNx: 'No such name',
      presetNxHint: 'NXDOMAIN, then again from the negative cache',

      legendQuery: 'query',
      legendReferral: 'referral (NS)',
      legendAnswer: 'answer',
      legendAa: 'authoritative',
      legendNeg: 'negative entry',
      legendChanged: 'this step',

      msgNone: 'No messages yet',
      msgTitle: 'Message {n}',
      msgFrom: 'from',
      msgTo: 'to',
      msgQ: 'question',
      msgAns: 'answer',
      msgNs: 'referral',
      msgGlue: 'addresses (glue)',
      msgSoa: 'SOA',
      msgNeg: 'the name does not exist',
      msgCache: 'answered from the cache; the TTL is what is left',
      flagRd: 'recursion desired',
      flagRa: 'recursion available',
      flagAa: 'authoritative answer',
      flagsNone: 'no flags',

      cacheTitle: 'Resolver cache',
      cacheAt: 't = {t}',
      cacheEmpty: 'empty',
      cacheHint: 'root hints (permanent)',
      cacheExpired: 'expired',
      cacheGlue: '+ addresses (glue)',
      cacheNx: 'NXDOMAIN (negative entry)',
      chartEmpty: 'No messages yet. Press → for the first query.',
      earlier: ['↑ {n} earlier message', '↑ {n} earlier messages'],

      capStart: 'The resolver\'s cache is empty: it knows only the addresses of the root servers. The host wants {name}. Press →.',
      capStub: 'Step {n}: the stub resolver sends one recursive query (rd) for {name} to the resolver {r} and waits for a complete answer.',
      capStubAgain: 'Step {n}: {adv} later the host wants {name}: again one recursive query.',
      capMissRoot: 'Nothing closer than the root is cached: the resolver starts at the root servers.',
      capMissZone: 'No answer is cached, but the NS for {zone} is still valid ({left} left): the resolver skips everything above and asks {server} directly.',
      capExpired: 'The record for {name} has expired: no TTL is left.',
      capExpiredNeg: 'The negative entry for {name} has expired: the resolver asks again.',
      capHit: 'The answer is in the cache ({left} left): the resolver asks nobody.',
      capHitNeg: 'A negative entry for {name} is in the cache ({left} left): the resolver asks nobody.',
      capAsk: 'Step {n}: the resolver asks {server} with an iterative query, no rd: the server answers only from its own data.',
      capAskFirst: 'Of several known servers the model asks the first listed.',
      capReferralRoot: 'Step {n}: the root server doesn\'t know the address but returns a referral: the NS records for .hr. The resolver asks on by itself.',
      capReferral: 'Step {n}: {server} doesn\'t know the address but returns a referral: the NS records for {zone}, with their addresses, no aa. The resolver asks on by itself.',
      capReferralCached: 'The referral is cached for {ttl}.',
      capAnswer: 'Step {n}: the authoritative server {server} answers from its zone: A {ip}, TTL {ttl}, with the aa flag. The resolver caches it.',
      capNxAuth: 'Step {n}: {server} answers NXDOMAIN with the aa flag: there is no {name} in the zone. The SOA comes with it, so the resolver keeps the negative answer for min(SOA TTL {soa}, MINIMUM {min}) = {ttl}.',
      capReply: 'Step {n}: the resolver returns a complete answer to the host: A {ip}, TTL {ttl}, with ra and without aa: the resolver is not authoritative for grafo.hr, it passes on what it learned.',
      capReplyNx: 'Step {n}: the resolver returns NXDOMAIN to the host, with ra and without aa: the name does not exist.',
      capReplyCache: 'Step {n}: the same query {adv} later: the answer comes from the cache, TTL {left}, and no packet goes to the root.',
      capReplyCacheNx: 'Step {n}: the same query {adv} later: NXDOMAIN comes from the cache (negative entry, {left} left) and no packet goes to the servers.',
      capOnce: ['The host sent one query; the resolver sent {n} query to the servers.', 'The host sent one query; the resolver sent {n} queries to the servers.'],
      capCompare: 'First time: {a} messages, now {b}.',
      sec: '{v} s',

      explain: '<p>The host does not resolve names itself. Its <b>stub resolver</b> sends one <b>recursive query</b> (the ' +
        '<code>rd</code> flag) to the resolver whose address it knows, and gets a complete answer or an error, never a ' +
        'referral.</p>' +
        '<p>The [[recursive resolver]] does the work: it sends <b>iterative queries</b> to the hierarchy. The [[root servers]] ' +
        'and the server for <code>.hr</code> don\'t know the address, but return a <b>referral</b>: the NS records of the zone ' +
        'closer to the name, with their addresses (this is [[delegation]]). Only the [[authoritative server]] answers from ' +
        'its own zone, with the <code>aa</code> flag.</p>' +
        '<p>The resolver keeps every record in its [[cache]] for as many seconds as its TTL says; the TTL is not a hop count. ' +
        'While it is valid, the same query is answered without a single packet going out, and the TTL the resolver reports ' +
        'is what is left. When the answer has expired but the zone\'s NS records have not, the resolver starts from the ' +
        'deepest server it knows.</p>' +
        '<p>A name that does not exist is remembered too: [[negative caching]] lasts as long as the zone\'s SOA says, the ' +
        'lower of its TTL and MINIMUM (here 900 s).</p>' +
        '<p>When it knows several servers for a zone, the model asks the first listed; real resolvers choose by measured ' +
        'response time.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
