/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of dns-ttl-cache, in both languages (docs/sim-ui.md §9). Same keys in hr and en. {name} is a
   placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term.
   Names, addresses and resolver ids are data, not strings: the page writes them with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Vremenska os, mjerodavni poslužitelj i predmemorije triju rezolvera',

      // time
      tMin: '{v} min',
      sec: '{v} s',
      tuesday: 'utorak 09:00',
      axisNow: 'sada',
      markChange: 'promjena',
      markAdd: 'novo ime',
      markLower: 'TTL ↓',

      // zone card
      zoneTitle: 'Mjerodavni poslužitelj',
      zoneTtl: 'TTL zapisa',
      zoneNeg: 'negativni odgovor',
      zoneMissing: 'još ne postoji',

      // resolver cards
      office: 'ured {n}',
      cacheLbl: 'predmemorija',
      cacheEmpty: 'prazna',
      fetchedAt: 'dohvaćeno {at}',
      ttlLeft: 'još {left} od {ttl}',
      clientGets: 'klijent dobiva',
      notAsked: 'još nije pitao',
      wOld: 'stara',
      wNew: 'nova',
      wNx: 'nema imena',
      fromCache: 'iz predmemorije',
      fromAuth: 'upravo pitao mjerodavni',
      refetches: ['{n} upit', '{n} upita', '{n} upita'],
      oldUntil: 'stara do {at}',

      // params
      scenario: 'Scenarij',
      scMove: 'selidba adrese',
      scNew: 'novo ime',
      oldTtl: 'TTL zone (prije)',
      lower: 'Sniziti TTL prije selidbe',
      lowerAt: 'Sniženje u',
      newTtl: 'Sniženi TTL',
      stepMin: 'Korak',

      // presets
      presetNaive: 'Bez pripreme',
      presetNaiveHint: 'TTL 3600 s, adresa se mijenja u 0: stari odgovori još do 55 min',
      presetLowered: 'TTL snižen na vrijeme',
      presetLoweredHint: 'TTL 300 s od −70 min: svi prelaze u roku od 5 min',
      presetLate: 'Sniženo prekasno',
      presetLateHint: 'TTL snižen u −10 min: R2 drži staru adresu do +40 min',
      presetNeg: 'Negativni odgovor',
      presetNegHint: 'Ime pitano prije nego što je dodano: NXDOMAIN se pamti 900 s',

      // legend
      legendOld: 'stara adresa',
      legendNew: 'nova adresa',
      legendNx: 'NXDOMAIN u predmemoriji',
      legendBar: 'preostali TTL',
      legendChanged: 'promijenjeno u ovom koraku',

      // captions
      capStart: 'Početak, t = {t}. Zona daje {name} → {addr} uz TTL {ttl}. U utorak u 09:00 (t = 0) adresa postaje {new}. Sva tri rezolvera već imaju zapis u predmemoriji.',
      capStartLower: 'TTL zapisa snizit će se na {ttl} u {at}.',
      capStartLowered: 'TTL zapisa snižen je na {ttl} u {at}.',
      capStartNew: 'Početak, t = {t}: klijent rezolvera R1 pita za {name}, kojeg još nema. R1 dobiva NXDOMAIN i pamti ga {neg} = min(MINIMUM {min}, TTL SOA {soa}). Ime se dodaje u 0.',
      capPress: 'Pritisni →.',
      capStep: 't = {t}.',
      capEditTtl: 'Zona: TTL zapisa snižen na {ttl}. To vrijedi samo za ono što se odsad dohvati.',
      capKeepLong: 'Zapisi koji su već vani zadržavaju svoj TTL: {list}.',
      capEditAddr: 'Zona: {name} sad ima adresu {addr}. Predmemorije to ne znaju.',
      capEditAdd: 'Zona: dodano je ime {name} → {addr}.',
      capSwitch: '{r}-u je istekao zapis dohvaćen u {at} (TTL {ttl}), pa je pitao mjerodavni poslužitelj i sad daje novu adresu {addr}.',
      capSwitchNx: '{r}-u je istekao negativni zapis dohvaćen u {at} ({ttl}), pa je pitao ponovno i sad dobiva {addr}.',
      capSwitchMany: '{list}: istekli su zapisi s TTL-om {ttl}, pa su pitali mjerodavni poslužitelj i sad daju novu adresu {addr}.',
      capFirstAsk: '{r} prvi put pita za {name}: ime je već u zoni, pa odmah dobiva {addr}.',
      capNxStill: '{r} i dalje kaže da imena nema (negativni zapis, još {left}), iako je ime dodano.',
      capShorter: '{r} je ponovno pitao i dobio kraći TTL, {ttl}.',
      capBefore: 'Promjena je za {in}. Zapisi vrijede do: {list}. Što se dohvati prije 0, daje staru adresu cijeli svoj TTL.',
      capStillOld: 'Staru adresu još daju: {list}. Ranije se ne može: zapis u predmemoriji ne može se opozvati.',
      capAllNew: 'Sva tri rezolvera daju novu adresu; zadnji je prešao u {at}.',
      capAllNewNx: 'Sva tri rezolvera sad nalaze {name}.',
      until: '{r} do {at}',

      explain: '<p>Rezolverova [[cache]] čuva odgovor koji je jednom dobio onoliko sekundi koliko kaže ' +
        '<em lang="en">record TTL</em> (TTL zapisa) u trenutku dohvaćanja. Dok zapis vrijedi, rezolver nikoga ne pita. Kad ' +
        'istekne (na nula preostalih sekundi), pita mjerodavni poslužitelj zone <code>lab.example</code> (knjiga o Linuxu ' +
        'ga zove [[authoritative server]]) i dobiva ono što zona kaže <strong>sada</strong>: trenutačnu adresu i ' +
        'trenutačni TTL.</p>' +
        '<p>Zato promjena u zoni ne stiže odmah. Zapis koji je netko već dohvatio ne može se opozvati: čeka se da istekne. ' +
        'S TTL-om 3600 s neki klijenti još do sat vremena dobivaju staru adresu, i to nije kvar nego točno ono što piše u ' +
        'zoni.</p>' +
        '<p>Lijek je raniji od promjene: TTL se snizi, na primjer na 300 s, <strong>najmanje jedan puni stari TTL</strong> ' +
        'prije selidbe, da svi stari zapisi isteknu i vrate se s kratkim rokom. Tada prozor traje najviše pet minuta. ' +
        'Sniziti TTL na dan selidbe ne pomaže: sniženje vrijedi samo za ono što se dohvati odsad. Nakon selidbe TTL se ' +
        'vrati na staru vrijednost.</p>' +
        '<p>Pamti se i to da imena nema: [[negative caching]] traje min(MINIMUM, TTL zapisa SOA), ovdje 900 s. Ime ' +
        'pitano prije nego što je dodano zato može do petnaest minuta od pitanja izgledati kao da ne postoji, ali samo kod ' +
        'rezolvera koji je pitao.</p>' +
        '<p>Model: svaki ured pita stalno, pa [[resolver]] pita ponovno točno kad mu zapis istekne; klijent na slici ' +
        'pita na svakom koraku. Mjerodavni poslužitelj uvijek odgovara.</p>'
    },
    en: {
      stage: 'Time axis, the authoritative server and the caches of three resolvers',

      tMin: '{v} min',
      sec: '{v} s',
      tuesday: 'Tuesday 09:00',
      axisNow: 'now',
      markChange: 'change',
      markAdd: 'new name',
      markLower: 'TTL ↓',

      zoneTitle: 'Authoritative server',
      zoneTtl: 'record TTL',
      zoneNeg: 'negative answer',
      zoneMissing: 'does not exist yet',

      office: 'office {n}',
      cacheLbl: 'cache',
      cacheEmpty: 'empty',
      fetchedAt: 'fetched {at}',
      ttlLeft: '{left} left of {ttl}',
      clientGets: 'client gets',
      notAsked: 'has not asked yet',
      wOld: 'old',
      wNew: 'new',
      wNx: 'no such name',
      fromCache: 'from the cache',
      fromAuth: 'just asked the authoritative server',
      refetches: ['{n} query', '{n} queries'],
      oldUntil: 'old until {at}',

      scenario: 'Scenario',
      scMove: 'address move',
      scNew: 'new name',
      oldTtl: 'Zone TTL (before)',
      lower: 'Lower the TTL before the move',
      lowerAt: 'Lowered at',
      newTtl: 'Lowered TTL',
      stepMin: 'Step',

      presetNaive: 'No preparation',
      presetNaiveHint: 'TTL 3600 s, the address changes at 0: old answers for up to 55 min',
      presetLowered: 'TTL lowered in time',
      presetLoweredHint: 'TTL 300 s from −70 min: everyone switches within 5 min',
      presetLate: 'Lowered too late',
      presetLateHint: 'TTL lowered at −10 min: R2 keeps the old address until +40 min',
      presetNeg: 'Negative answer',
      presetNegHint: 'A name asked for before it was added: NXDOMAIN is kept for 900 s',

      legendOld: 'old address',
      legendNew: 'new address',
      legendNx: 'NXDOMAIN cached',
      legendBar: 'TTL left',
      legendChanged: 'changed this step',

      capStart: 'Start, t = {t}. The zone gives {name} → {addr} with TTL {ttl}. On Tuesday at 09:00 (t = 0) the address becomes {new}. All three resolvers already have the record cached.',
      capStartLower: 'The record TTL will be lowered to {ttl} at {at}.',
      capStartLowered: 'The record TTL was lowered to {ttl} at {at}.',
      capStartNew: 'Start, t = {t}: a client of R1 asks for {name}, which does not exist yet. R1 gets NXDOMAIN and keeps it for {neg} = min(MINIMUM {min}, SOA TTL {soa}). The name is added at 0.',
      capPress: 'Press →.',
      capStep: 't = {t}.',
      capEditTtl: 'Zone: record TTL lowered to {ttl}. This holds only for what is fetched from now on.',
      capKeepLong: 'Records already out there keep their TTL: {list}.',
      capEditAddr: 'Zone: {name} now has the address {addr}. The caches do not know.',
      capEditAdd: 'Zone: the name {name} → {addr} is added.',
      capSwitch: '{r}\'s record fetched at {at} (TTL {ttl}) expired, so it asked the authoritative server and now answers with the new address {addr}.',
      capSwitchNx: '{r}\'s negative entry fetched at {at} ({ttl}) expired, so it asked again and now gets {addr}.',
      capSwitchMany: '{list}: their records with TTL {ttl} expired, so they asked the authoritative server and now answer with the new address {addr}.',
      capFirstAsk: '{r} asks for {name} for the first time: the name is in the zone already, so it gets {addr} at once.',
      capNxStill: '{r} still says there is no such name (negative entry, {left} left), although the name has been added.',
      capShorter: '{r} asked again and got the shorter TTL, {ttl}.',
      capBefore: 'The change is in {in}. The records last until: {list}. Whatever is fetched before 0 hands out the old address for its full TTL.',
      capStillOld: 'Still handing out the old address: {list}. No earlier switch is possible: a cached record cannot be recalled.',
      capAllNew: 'All three resolvers give the new address; the last one switched at {at}.',
      capAllNewNx: 'All three resolvers now find {name}.',
      until: '{r} until {at}',

      explain: '<p>An answer a resolver has received stays in its [[cache]] for as many seconds as the ' +
        'record TTL said when it was fetched. While it lasts, the resolver asks nobody. When it expires (at zero seconds ' +
        'left), it asks the [[authoritative server]] for the zone <code>lab.example</code> and gets what the zone says ' +
        '<strong>now</strong>: the current address and the current TTL.</p>' +
        '<p>That is why a change in the zone does not arrive at once. A record someone has already fetched cannot be ' +
        'recalled: you wait for it to expire. With a TTL of 3600 s some clients get the old address for up to an hour, and ' +
        'that is not a fault but exactly what the zone says.</p>' +
        '<p>The remedy comes before the change: lower the TTL, say to 300 s, <strong>at least one full old TTL</strong> ' +
        'before the move, so every old record expires and comes back with the short lifetime. The window is then five ' +
        'minutes at most. Lowering it on the day of the move does not help: the lower TTL holds only for what is fetched ' +
        'from then on. After the move the TTL goes back up.</p>' +
        '<p>That a name does not exist is remembered too: [[negative caching]] lasts min(MINIMUM, the SOA record\'s TTL), ' +
        '900 s here. A name asked for before it was added can look missing for up to fifteen minutes after the question, but ' +
        'only at the resolver that asked.</p>' +
        '<p>The model: every office asks all the time, so the [[resolver]] asks again exactly when its record expires; ' +
        'the client in the picture asks at every step. The authoritative server always answers.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
