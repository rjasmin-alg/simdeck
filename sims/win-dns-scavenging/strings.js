/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-dns-scavenging, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* in a caption is an
   English term in italics on the Croatian page (the page's rich() turns it into <em lang="en">). [[term]] is a
   kit/glossary.js term; terms missing from the glossary are written out (NOTES.md, "Term pairs").
   Record names, addresses, the zone and the server are data: the page writes them with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Zapisi zone kroz dane: vremenske oznake, intervali i prolazi brisanja',

      // times
      day: 'dan {d}',
      dayHour: 'dan {d}, {h}',
      dayGen: '{d}. dana',
      dayGenHour: '{d}. dana u {h}',
      days: ['{n} dan', '{n} dana', '{n} dana'],
      everyDay: 'svaki dan',
      everyHour: 'svaki sat',
      everyDays: ['svaki {n} dan', 'svaka {n} dana', 'svakih {n} dana'],
      everyHours: ['svaki {n} sat', 'svaka {n} sata', 'svakih {n} sati'],
      hours: ['{n} sat', '{n} sata', '{n} sati'],
      axisNow: 'sada',
      phStart: 'prije svega',
      phClients: 'klijenti',
      phRun: 'prolaz brisanja',
      phEnd: 'kraj',

      // record cards
      srcClient: 'klijent',
      srcDhcp: 'DHCP',
      srcManual: 'admin',
      srcStatic: 'statički',
      neverAges: 'Bez vremenske oznake: nikad ne zastarijeva.',
      tsLbl: 'oznaka:',
      wNoRefresh: 'bez osvježavanja',
      wRefresh: 'osvježavanje',
      wStale: 'zastario',
      wDeleted: 'obrisan',
      stNoRefresh: 'Osvježavanja se ne prihvaćaju do {until}.',
      stRefresh: 'Prihvaća osvježavanje; zastarijeva nakon {after}.',
      stStale: 'Zastario je nakon {since}; briše ga tek prolaz.',
      stStaleNever: 'Zastario je nakon {since}, ali ga nijedan prolaz neće obrisati.',
      goneAt: 'otišao {at}',
      nobodyRefreshes: 'nitko ga ne osvježava',
      deletedAtRun: 'briše ga prolaz {at}',
      neverDeleted: 'nijedan ga prolaz ne briše',
      notYet: 'još nije upisan',
      backAtRefresh: 'Vratit će se pri sljedećem osvježavanju.',

      // zone, server, log
      zoneTitle: 'Zona',
      aging: 'starenje',
      on: 'uključeno',
      off: 'isključeno',
      noRefresh: 'bez osvježavanja',
      refresh: 'osvježavanje',
      canAfter: 'smije se čistiti nakon',
      serverTitle: 'Poslužitelj',
      scavShort: 'brisanje',
      period: 'prolaz',
      lastRun: 'zadnji',
      nextRun: 'sljedeći',
      skippedShort: 'zona preskočena',
      deletedN: ['{n} obrisan', '{n} obrisana', '{n} obrisanih'],
      safeOk: 'osvježavanje {r} ≥ najdulji razmak klijenta ({name}, {every})',
      safeNo: 'osvježavanje {r} < {name} se osvježava tek {every}: živi zapis može nestati',
      logStart: 'Dnevnik',
      logTitle: 'Dnevnik: {at}',
      logEmpty: 'Još se ništa nije dogodilo.',
      logCreate: '{name} upisan, oznaka {at}',
      logBack: '{name} ponovno upisan, oznaka {at}',
      logRefresh: '{name}: osvježavanje prihvaćeno, oznaka {from} → {to}',
      logUpdate: '{name}: nova adresa {addr}, oznaka {at}',
      logLeave: '{name} odlazi s mreže',
      logIgnored1: '{name}: {n} ({from}), bez osvježavanja do {until}',
      logIgnored: '{name}: {n} ({from} – {to}), bez osvježavanja do {until}',
      refreshesN: ['{n} osvježavanje odbačeno', '{n} osvježavanja odbačena', '{n} osvježavanja odbačeno'],
      logSkipAging: 'prolaz: starenje je isključeno, zona preskočena',
      logSkipNotYet: 'prolaz: zona se smije čistiti tek nakon {after}',
      logDeleted: '{name} obrisan (zastario nakon {after})',
      logKept: '{name} ostaje (zastarijeva nakon {after})',
      logNothing: 'prolaz: nema zapisa koji stare',
      logEnd: 'kraj prikaza: {at}',

      // captions
      capPress: 'Pritisni → za sljedeći korak.',
      capStart: 'Dan 0, prije ijednog upisa; {fs1} je statički zapis.',
      capStartAgingOn: 'Na zoni {zone} uključeno je [[aging]]: bez osvježavanja {nr}, osvježavanje {r}.',
      capStartAgingOff: 'Na zoni {zone} isključeno je [[aging]], pa se zona ne čisti.',
      capStartScav: 'Poslužitelj {server} briše zastarjele zapise {per}.',
      capStartNoScav: 'Na poslužitelju {server} automatsko brisanje zastarjelih zapisa nije uključeno.',
      capHeadClients: '{at}, klijenti:',
      capHeadRun: '{at}, prolaz brisanja:',
      capHeadEnd: '{at}, kraj:',
      capCreate: '{name} upisuje svoj zapis; *timestamp* (vremenska oznaka) je {ts}.',
      capCreateLater: '{name} upisuje svoj zapis; oznaka je {ts}.',
      capCreateDhcp: 'DHCP poslužitelj upisuje {name} za njegov zakup; oznaka je {ts}.',
      capCreateManual: 'Administrator dodaje {name} s kvačicom „Obriši zapis kad zastari”, pa i ručni zapis dobiva oznaku {ts}.',
      capBack: '{name} se vraća: osvježavanje nije našlo zapis pa ga je ponovno upisalo, s oznakom {ts}.',
      capLeave: '{name} odlazi s mreže: od sada nitko ne osvježava njegov zapis.',
      capRefresh: '{name} osvježava zapis i *timestamp* (vremenska oznaka) se pomiče na {ts}: prvo osvježavanje nakon intervala bez osvježavanja ({prev} + {nr}).',
      capUpdate: '{name} dobiva novu adresu {addr}. To je ažuriranje, ne osvježavanje, pa se oznaka odmah pomiče na {ts}, iako je unutar intervala bez osvježavanja. Iduće prihvaćeno osvježavanje: dan {until}.',
      capIgnoredNow: '{name} se i danas osvježio, ali to se ne broji: bez osvježavanja do {until}.',
      capSkipAging: 'Poslužitelj prolazi zone, ali {zone} nema uključeno starenje i preskače se.',
      capSkipExact: 'Zona se smije čistiti tek nakon {after}. Prolaz je točno tada, a ne poslije toga, pa je preskače.',
      capSkipBefore: 'Zona se smije čistiti tek nakon {after}, pa je ovaj prolaz preskače.',
      capDelLeft: '{name} je otišao prije {ago} i tek ga sada *scavenging* (brisanje zastarjelih zapisa) uklanja: {sum} < {now}.',
      capDelLive: '{name} je zastario ({sum} < {now}) i prolaz ga briše, iako je uređaj na mreži: osvježava se tek {every}.',
      capDel: '{name} je zastario ({sum} < {now}) i prolaz ga briše.',
      capTie: '{name} još nije zastario: {sum} = {now}, a ne manje od {now}.',
      capNothing: 'Nijedan zapis nije zastario; prolaz ništa ne briše.',
      capEndStale: '{name} je zastario nakon {since} i još je u zoni.',
      capEndStaleNoScav: '{name} je zastario nakon {since}, ali je još u zoni: nijedan poslužitelj ne briše zastarjele zapise.',
      capEndStaleNoAging: '{name} je zastario nakon {since}, ali je još u zoni: zona nema uključeno starenje.',
      capEndClean: 'Nema zastarjelih zapisa u zoni.',
      capCapped: 'Prikaz staje nakon {n} koraka: skrati „Do dana” ili produlji intervale.',

      // controls
      scenario: 'Zapisi',
      scLeaver: 'PC2 ode',
      scPrinter: 'Pisač',
      scStatic: 'Statički',
      scMove: 'Nova IP',
      pNoRefresh: 'Bez osvježavanja',
      pRefresh: 'Osvježavanje',
      pPeriod: 'Razmak prolaza brisanja',
      pAging: 'Starenje na zoni',
      pScavenging: 'Brisanje na poslužitelju',
      pLease: 'Zakup (DHCP)',
      pUntil: 'Do dana',
      presetDefaults: 'Zadano 7/7/7',
      presetDefaultsHint: 'PC2 ode 1. dan, a nestaje tek 21. dan',
      presetAggressive: 'Prekratko',
      presetAggressiveHint: '1/1/1 dan: pisač nestaje između obnova zakupa',
      presetStatic: 'Statički ostaje',
      presetStaticHint: 'fs1 ostaje zauvijek, ručni old-nas nestaje 21. dan',
      presetAgingOnly: 'Bez brisanja',
      presetAgingOnlyHint: 'Starenje na zoni bez brisanja na poslužitelju: ništa ne nestaje',
      presetIpChange: 'Nova adresa',
      presetIpChangeHint: 'Ažuriranje 3. dan odmah pomiče oznaku',

      // legend
      legendTs: 'vremenska oznaka',
      legendNr: 'bez osvježavanja',
      legendRf: 'osvježavanje',
      legendSt: 'zastario',
      legendRun: 'prolaz brisanja',
      legendChanged: 'promijenjeno',

      explain: '<p>Klijenti sami upisuju svoje zapise, ali ih često ne brišu kad odu. Svaki dinamički zapis nosi ' +
        '<em lang="en">timestamp</em> (vremensku oznaku): vrijeme zadnjeg upisa. Kad je na zoni uključeno [[aging]], ' +
        'oznaka odlučuje kad zapis zastari. Statički zapisi oznaku nemaju i nikad ne zastarijevaju.</p>' +
        '<p>Nakon oznake teče <em lang="en">no-refresh interval</em> (interval bez osvježavanja): poslužitelj ne prihvaća ' +
        'osvježavanja, osim ažuriranja kojim se mijenja adresa. Slijedi <em lang="en">refresh interval</em> (interval ' +
        'osvježavanja): prvo osvježavanje u njemu pomiče oznaku. Kad prođu oba, zapis je <em lang="en">stale</em> ' +
        '(zastario).</p>' +
        '<p>Zastarjeli zapis ne nestaje sam. Briše ga tek prolaz <em lang="en">scavenging</em> (brisanje zastarjelih ' +
        'zapisa) na poslužitelju koji ga ima uključeno, i to tek kad zona smije biti očišćena. Zato zapis računala ' +
        'koje je otišlo živi do zbroja: oznaka + interval bez osvježavanja + interval osvježavanja + razmak prolaza. ' +
        'Interval osvježavanja mora biti barem jednako dug kao najdulji razmak u kojem se klijent javlja: 24 sata za klijenta, pola ' +
        'zakupa za zapise koje upisuje DHCP, inače nestaju zapisi uređaja koji su na mreži.</p>'
    },
    en: {
      stage: 'Records of the zone over days: timestamps, intervals and scavenging runs',

      // times
      day: 'day {d}',
      dayHour: 'day {d}, {h}',
      dayGen: 'day {d}',
      dayGenHour: 'day {d}, {h}',
      days: ['{n} day', '{n} days'],
      everyDay: 'every day',
      everyHour: 'every hour',
      everyDays: ['every {n} day', 'every {n} days'],
      everyHours: ['every {n} hour', 'every {n} hours'],
      hours: ['{n} hour', '{n} hours'],
      axisNow: 'now',
      phStart: 'before anything',
      phClients: 'clients',
      phRun: 'scavenging run',
      phEnd: 'end',

      // record cards
      srcClient: 'client',
      srcDhcp: 'DHCP',
      srcManual: 'admin',
      srcStatic: 'static',
      neverAges: 'No timestamp: it never goes stale.',
      tsLbl: 'timestamp:',
      wNoRefresh: 'no-refresh',
      wRefresh: 'refresh',
      wStale: 'stale',
      wDeleted: 'deleted',
      stNoRefresh: 'Refreshes are not accepted until {until}.',
      stRefresh: 'Takes a refresh; stale after {after}.',
      stStale: 'Stale since {since}; only a run deletes it.',
      stStaleNever: 'Stale since {since}, but no run will delete it.',
      goneAt: 'left on {at}',
      nobodyRefreshes: 'nobody refreshes it',
      deletedAtRun: 'the run on {at} deletes it',
      neverDeleted: 'no run deletes it',
      notYet: 'not registered yet',
      backAtRefresh: 'It comes back at its next refresh.',

      // zone, server, log
      zoneTitle: 'Zone',
      aging: 'aging',
      on: 'on',
      off: 'off',
      noRefresh: 'no-refresh',
      refresh: 'refresh',
      canAfter: 'can be scavenged after',
      serverTitle: 'Server',
      scavShort: 'scavenging',
      period: 'runs',
      lastRun: 'last',
      nextRun: 'next',
      skippedShort: 'zone skipped',
      deletedN: ['{n} deleted', '{n} deleted'],
      safeOk: 'refresh {r} ≥ the longest client gap ({name}, {every})',
      safeNo: 'refresh {r} < {name} refreshes only {every}: a live record can vanish',
      logStart: 'Log',
      logTitle: 'Log: {at}',
      logEmpty: 'Nothing has happened yet.',
      logCreate: '{name} registered, timestamp {at}',
      logBack: '{name} registered again, timestamp {at}',
      logRefresh: '{name}: refresh accepted, timestamp {from} → {to}',
      logUpdate: '{name}: new address {addr}, timestamp {at}',
      logLeave: '{name} leaves the network',
      logIgnored1: '{name}: {n} ({from}), no refresh until {until}',
      logIgnored: '{name}: {n} ({from} – {to}), no refresh until {until}',
      refreshesN: ['{n} refresh ignored', '{n} refreshes ignored'],
      logSkipAging: 'run: aging is off, zone skipped',
      logSkipNotYet: 'run: the zone can be scavenged only after {after}',
      logDeleted: '{name} deleted (stale after {after})',
      logKept: '{name} kept (stale after {after})',
      logNothing: 'run: no aging records',
      logEnd: 'end of the demo: {at}',

      // captions
      capPress: 'Press → for the next step.',
      capStart: 'Day 0, before any registration; {fs1} is a static record.',
      capStartAgingOn: 'The zone {zone} has [[aging]] on: no-refresh {nr}, refresh {r}.',
      capStartAgingOff: 'The zone {zone} has [[aging]] off, so it is never scavenged.',
      capStartScav: 'The server {server} scavenges stale records {per}.',
      capStartNoScav: 'Automatic scavenging of stale records is not on at the server {server}.',
      capHeadClients: '{at}, clients:',
      capHeadRun: '{at}, scavenging run:',
      capHeadEnd: '{at}, the end:',
      capCreate: '{name} registers its record; the *timestamp* is {ts}.',
      capCreateLater: '{name} registers its record; the timestamp is {ts}.',
      capCreateDhcp: 'The DHCP server registers {name} for its lease; the timestamp is {ts}.',
      capCreateManual: 'The admin adds {name} with "Delete this record when it becomes stale" ticked, so this manual record gets the timestamp {ts}.',
      capBack: '{name} is back: its refresh found no record and registered it again, timestamp {ts}.',
      capLeave: '{name} leaves the network: from now on nobody refreshes its record.',
      capRefresh: '{name} refreshes its record and the *timestamp* moves to {ts}, the first refresh after the no-refresh interval ({prev} + {nr}).',
      capUpdate: '{name} gets a new address, {addr}. That is an update, not a refresh, so the timestamp moves to {ts} at once, inside the no-refresh interval. The next refresh to count: day {until}.',
      capIgnoredNow: '{name} refreshed today too, but it does not count: no refresh until {until}.',
      capSkipAging: 'The server runs through its zones, but {zone} has aging off and is skipped.',
      capSkipExact: 'The zone can be scavenged only after {after}. The run comes exactly then, not after, so it skips the zone.',
      capSkipBefore: 'The zone can be scavenged only after {after}, so this run skips it.',
      capDelLeft: '{name} left {ago} ago, and only now does *scavenging* remove it: {sum} < {now}.',
      capDelLive: '{name} is stale ({sum} < {now}) and the run deletes it, though the device is on the network: it refreshes only {every}.',
      capDel: '{name} is stale ({sum} < {now}) and the run deletes it.',
      capTie: '{name} is not stale yet: {sum} = {now}, not less than {now}.',
      capNothing: 'No record is stale; the run deletes nothing.',
      capEndStale: '{name} went stale after {since} and is still in the zone.',
      capEndStaleNoScav: '{name} went stale after {since} but is still in the zone: no server scavenges.',
      capEndStaleNoAging: '{name} went stale after {since} but is still in the zone: the zone has aging off.',
      capEndClean: 'No stale records in the zone.',
      capCapped: 'The demo stops after {n} steps: shorten "Until day" or lengthen the intervals.',

      // controls
      scenario: 'Records',
      scLeaver: 'PC2 leaves',
      scPrinter: 'Printer',
      scStatic: 'Static',
      scMove: 'New IP',
      pNoRefresh: 'No-refresh',
      pRefresh: 'Refresh',
      pPeriod: 'Scavenging period',
      pAging: 'Zone aging',
      pScavenging: 'Server scavenging',
      pLease: 'DHCP lease',
      pUntil: 'Until day',
      presetDefaults: 'Defaults 7/7/7',
      presetDefaultsHint: 'PC2 leaves on day 1 and is gone only on day 21',
      presetAggressive: 'Too short',
      presetAggressiveHint: '1/1/1 day: the printer vanishes between lease renewals',
      presetStatic: 'Static stays',
      presetStaticHint: 'fs1 stays for good, the manual old-nas goes on day 21',
      presetAgingOnly: 'Aging only',
      presetAgingOnlyHint: 'Aging on the zone, no scavenging on the server: nothing goes',
      presetIpChange: 'New address',
      presetIpChangeHint: 'An update on day 3 moves the timestamp at once',

      // legend
      legendTs: 'timestamp',
      legendNr: 'no-refresh',
      legendRf: 'refresh',
      legendSt: 'stale',
      legendRun: 'scavenging run',
      legendChanged: 'changed',

      explain: '<p>Clients register their own records but often do not delete them when they leave. Every dynamic ' +
        'record carries a timestamp: when it was last written. With [[aging]] on for the zone, the timestamp decides ' +
        'when the record goes stale. Static records have none and ' +
        'never go stale.</p>' +
        '<p>After the timestamp runs the no-refresh interval: the server does not accept refreshes, only updates that ' +
        'change the address. Then comes the refresh interval: the first refresh in it moves the timestamp. When both ' +
        'have passed, the record is stale.</p>' +
        '<p>A stale record does not go by itself. Only a scavenging run deletes it, on a server that has scavenging ' +
        'on, and only once the zone may be scavenged. So the record of a machine that left lives up to timestamp + ' +
        'no-refresh + refresh + the scavenging period. The refresh interval must be at least as long as the longest ' +
        'gap between a client\'s refreshes: 24 hours for a client, half the lease for records the DHCP server ' +
        'registers. Otherwise the records of devices that are on the network vanish.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
