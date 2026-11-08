/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of multicast-igmp, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term. *text* in a caption is set in italics by the page
   (English protocol terms on the Croatian page). The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Preklopnik, usmjernik i četiri računala u jednom VLAN-u',
      and: ' i ',

      // controls
      snooping: 'Prisluškivanje IGMP-a (snooping)',
      snoopingHint: 'Preklopnik čita IGMP poruke i tok šalje samo članovima.',
      keyBy: 'Tablica preklopnika po',
      keyIp: 'adresi skupine (IP)',
      keyMac: 'MAC adresi',
      script: 'Scenarij',
      scH1: 'H1 se pridružuje',
      scH1h3: 'H1 i H3 se pridružuju',
      scLeave: 'H3 odlazi porukom Leave',
      scSilent: 'H2 utihne bez poruke Leave',
      scOverlap: 'H4 u 224.1.1.1, ista MAC adresa',

      // presets
      presetFlood: 'Bez prisluškivanja: preplavljivanje',
      presetFloodHint: 'H1 se pridruži, tok dobivaju sva četiri računala.',
      presetSnoop: 'Prisluškivanje: H1 i H3',
      presetSnoopHint: 'Tok ide samo na priključke 1 i 3.',
      presetLeave: 'H3 odlazi',
      presetLeaveHint: 'Leave, dva upita, priključak 3 ispada nakon 2 s.',
      presetSilent: 'H2 utihne',
      presetSilentHint: 'Bez poruke Leave priključak ispada tek nakon 260 s.',
      presetOverlap: 'Dvije skupine, jedna MAC adresa',
      presetOverlapHint: 'Tablica po MAC adresi šalje tok i računalu H4.',

      // legend
      legStream: 'okvir toka 239.1.1.1',
      legReport: 'izvješće o članstvu',
      legLeave: 'napuštanje (Leave)',
      legQuery: 'upit (Query)',
      legMember: 'priključak dobiva tok',
      legNon: 'priključak bez toka',
      legChanged: 'promijenjeno u ovom koraku',

      // topology
      source: 'izvor toka (uzvodno)',
      roleRouter: 'usmjernik, ispitivač',
      roleSwitch: 'preklopnik',
      snoopOn: 'prisluškivanje uključeno',
      snoopOff: 'prisluškivanje isključeno',
      notMember: 'nije član',
      hung: 'ne odgovara',
      bUse: 'prima tok',
      bNic: 'kartica odbacuje',
      bIp: 'IP odbacuje',
      bDown: 'stiže uzalud',
      bReport: 'šalje izvješće',
      bLeave: 'šalje Leave',
      bQuery: 'šalje upit',
      bFwd: 'prosljeđuje tok',
      bNoFwd: 'ne prosljeđuje',
      bFlood: 'preplavljuje',
      bFilter: 'samo članovima',
      meterCount: 'tok: stiglo {r}, korišteno {u}',

      // side boxes
      clock: 'Vrijeme',
      clockVal: 't = {t} s',
      tableTitle: 'Tablica prisluškivanja (preklopnik)',
      colGroup: 'skupina',
      colMac: 'MAC',
      colPort: 'priključak',
      colTimer: 'istječe',
      timerAt: 't = {t} s',
      timerLeave: 'nakon Leave',
      tableEmpty: 'prazna: nitko se nije prijavio',
      tableOff: 'Prisluškivanje je isključeno: preklopnik ne čita IGMP i svaki skupni okvir preplavljuje.',
      routerTitle: 'Usmjernik R: skupine na LAN-u',
      routerEmpty: 'nijedna: tok ne prosljeđuje',
      routerPending: ['još {n} upit za skupinu', 'još {n} upita za skupinu', 'još {n} upita za skupinu'],
      macTitle: 'Skupna adresa na žici',
      macLost: '5 bitova se gubi',
      macCopied: 'donja 23 bita',
      macGroupBit: 'bit skupne adrese',

      // captions
      capStartH1: 'Početak: nitko nije član skupine 239.1.1.1. Tok stiže do usmjernika R iz uzvodne mreže. Pritisni → za sljedeći korak.',
      capStartH1h3: 'Početak: nitko nije član skupine 239.1.1.1. Tok stiže do usmjernika R iz uzvodne mreže. Pritisni → za sljedeći korak.',
      capStartLeave: 'Početak: stanje s kraja primjera 2. H1 i H3 su u skupini 239.1.1.1, a tok ide na priključke 1 i 3. Pritisni →.',
      capStartSilent: 'Početak: nitko nije član skupine 239.1.1.1. R šalje opći upit svakih 125 s. Pritisni → za sljedeći korak.',
      capStartOverlap: 'Početak: H1 je u skupini 239.1.1.1 (MAC {mac}). Pritisni → za sljedeći korak.',
      capStep: 'Korak {n} (t = {t} s):',
      cTick: 'Nitko ne šalje IGMP poruke.',
      cJoin: '{h} se pridružuje skupini {g} i šalje *Membership Report* (izvješće o članstvu).',
      cReportUp: 'Preklopnik ga čita i šalje samo usmjerniku, na priključak {port}.',
      cReportFlood: 'Preklopnik ga ne čita: i izvješće je skupni okvir, pa ga preplavljuje na priključke {ports}.',
      cAdd: 'Preklopnik dodaje priključak {port} u skupinu {g}.',
      cAddMac: 'Preklopnik dodaje priključak {port} pod MAC {mac}, koji već nosi i {other}.',
      cRouterAdd: 'R sad zna da na LAN-u ima člana skupine {g}.',
      cLeave: '{h} napušta skupinu i šalje *Leave Group* na 224.0.0.2.',
      cLeaveSnoop: 'Preklopnik ga šalje usmjerniku i ne briše priključak {port} odmah: zadržava ga najdulje do t = {until} s.',
      cLeaveFlood: 'Preklopnik ga preplavljuje na priključke {ports}.',
      cGsq: 'R šalje {k}. upit za skupinu (*Group-Specific Query*) na {g}, na priključke {ports}.',
      cGq: 'R šalje opći upit (*General Query*) na 224.0.0.1, na sve priključke.',
      cAnswer: '{h} odgovara izvješćem za {g}: priključak {port} vrijedi do t = {until} s.',
      cAnswerNoSnoop: '{h} odgovara izvješćem za {g}.',
      cNoAnswer: 'S priključka {ports} nema odgovora.',
      cNoAnswerMany: 'S priključaka {ports} nema odgovora.',
      cSilent: '{h} se zamrzne i ne šalje Leave: veza ostaje, ali {h} više ništa ne prima ni ne odgovara.',
      cWait: 'Nitko ne šalje IGMP poruke; vrijeme teče.',
      cExpireLeave: 'S priključka {port} nitko nije odgovorio na dva upita u razmaku od 1 s, pa ga preklopnik briše iz skupine {g}.',
      cExpireGmi: 'Od posljednjeg izvješća s priključka {port} prošlo je 260 s (2 × 125 s + 10 s), pa ga preklopnik briše iz skupine {g}.',
      cRouterExpire: 'Ni R više nema člana skupine {g}: tok prestaje stizati na LAN.',
      cNoStream: 'R nema člana skupine {g} na LAN-u i tok ne prosljeđuje.',
      cStreamFlood: ['Okvir toka preklopnik preplavljuje na priključke {ports}: {n} kopija.', 'Okvir toka preklopnik preplavljuje na priključke {ports}: {n} kopije.', 'Okvir toka preklopnik preplavljuje na priključke {ports}: {n} kopija.'],
      cStreamSnoop: ['Tok ide samo na priključak {ports}: {n} kopija.', 'Tok ide samo na priključke {ports}: {n} kopije.', 'Tok ide samo na priključke {ports}: {n} kopija.'],
      cStreamNow: ['Tok sad ide na priključak {ports}.', 'Tok sad ide na priključke {ports}.', 'Tok sad ide na priključke {ports}.'],
      cKeeps: '{h} i dalje prima tok.',
      cNic: ['{hosts} nije član: kartica okvir odbacuje, ali ga je veza ipak nosila.', '{hosts} nisu članovi: kartice okvir odbacuju, ali su ga veze ipak nosile.', '{hosts} nisu članovi: kartice okvir odbacuju, ali su ga veze ipak nosile.'],
      cIp: '{h} okvir prima jer MAC odgovara skupini {other}, a IP sloj ga odbacuje: odredište je {g}.',
      cDown: 'Okvir i dalje stiže računalu {h}, uzalud.',

      explain: '<p><em lang="en">Multicast</em> (skupno odašiljanje) šalje jedan tok svim članovima skupine. Skupna adresa ' +
        '239.1.1.1 na žici je MAC 01-00-5E-01-01-01: 01-00-5E i donja 23 bita IP adrese. Najniži bit prvog okteta (01) ' +
        'kaže da je adresa skupna.</p>' +
        '<p>Preklopnik bez prisluškivanja takav okvir šalje kao <em lang="en">broadcast</em>: na sve priključke osim ulaznog ' +
        '([[flooding]]). Sa <em lang="en">IGMP snooping</em> (prisluškivanje IGMP-a) čita izvješća o članstvu i tok šalje samo ' +
        'na priključke s kojih je stiglo izvješće. To odlučuje preklopnik, ne usmjernik: usmjernik zna samo ima li na LAN-u ' +
        'barem jednog člana.</p>' +
        '<p>Računalo koje prestane gledati ne zaustavlja tok odmah. S porukom <em lang="en">Leave</em> priključak ispada nakon ' +
        'dva upita za skupinu (2 × 1 s), a bez nje tek kad 260 s nema izvješća (2 × 125 s + 10 s). Skupine 224.0.0.x ' +
        'preklopnik uvijek preplavljuje. 32 skupine dijele jednu MAC adresu, pa tablica po MAC adresi može poslati tok i ' +
        'računalu koje ga nije tražilo.</p>' +
        '<p>Pojmovi: <em lang="en">group</em> (skupina), <em lang="en">join</em> / <em lang="en">leave</em> (pridruživanje / ' +
        'napuštanje), <em lang="en">querier</em> (ispitivač). Izvori: RFC 1112 §6.4, RFC 2236 §3 i §8, RFC 4541 §2.1.</p>'
    },
    en: {
      stage: 'A switch, a router and four hosts in one VLAN',
      and: ' and ',

      snooping: 'IGMP snooping',
      snoopingHint: 'The switch reads IGMP messages and sends the stream to members only.',
      keyBy: 'Switch table keyed by',
      keyIp: 'group address (IP)',
      keyMac: 'MAC address',
      script: 'Script',
      scH1: 'H1 joins',
      scH1h3: 'H1 and H3 join',
      scLeave: 'H3 leaves with a Leave',
      scSilent: 'H2 goes silent without a Leave',
      scOverlap: 'H4 in 224.1.1.1, the same MAC',

      presetFlood: 'No snooping: flooding',
      presetFloodHint: 'H1 joins, all four hosts get the stream.',
      presetSnoop: 'Snooping: H1 and H3',
      presetSnoopHint: 'The stream goes to ports 1 and 3 only.',
      presetLeave: 'H3 leaves',
      presetLeaveHint: 'Leave, two queries, port 3 removed after 2 s.',
      presetSilent: 'H2 goes silent',
      presetSilentHint: 'Without a Leave the port goes only after 260 s.',
      presetOverlap: 'Two groups, one MAC',
      presetOverlapHint: 'A MAC-keyed table sends the stream to H4 too.',

      legStream: 'stream frame 239.1.1.1',
      legReport: 'Membership Report',
      legLeave: 'Leave',
      legQuery: 'Query',
      legMember: 'port gets the stream',
      legNon: 'port without the stream',
      legChanged: 'changed in this step',

      source: 'stream source (upstream)',
      roleRouter: 'router, querier',
      roleSwitch: 'switch',
      snoopOn: 'snooping on',
      snoopOff: 'snooping off',
      notMember: 'not a member',
      hung: 'not answering',
      bUse: 'gets the stream',
      bNic: 'card drops it',
      bIp: 'IP drops it',
      bDown: 'arrives for nothing',
      bReport: 'sends a report',
      bLeave: 'sends a Leave',
      bQuery: 'sends a query',
      bFwd: 'forwards the stream',
      bNoFwd: 'does not forward',
      bFlood: 'floods',
      bFilter: 'members only',
      meterCount: 'stream: {r} in, {u} used',

      clock: 'Time',
      clockVal: 't = {t} s',
      tableTitle: 'Snooping table (switch)',
      colGroup: 'group',
      colMac: 'MAC',
      colPort: 'port',
      colTimer: 'expires',
      timerAt: 't = {t} s',
      timerLeave: 'after a Leave',
      tableEmpty: 'empty: nobody has reported',
      tableOff: 'Snooping is off: the switch does not read IGMP and floods every multicast frame.',
      routerTitle: 'Router R: groups on the LAN',
      routerEmpty: 'none: it forwards no stream',
      routerPending: ['{n} more group-specific query', '{n} more group-specific queries'],
      macTitle: 'The group address on the wire',
      macLost: '5 bits are lost',
      macCopied: 'the low 23 bits',
      macGroupBit: 'group bit',

      capStartH1: 'Start: nobody is a member of 239.1.1.1. The stream reaches router R from upstream. Press → for the next step.',
      capStartH1h3: 'Start: nobody is a member of 239.1.1.1. The stream reaches router R from upstream. Press → for the next step.',
      capStartLeave: 'Start: where preset 2 ended. H1 and H3 are in 239.1.1.1, and the stream goes to ports 1 and 3. Press →.',
      capStartSilent: 'Start: nobody is a member of 239.1.1.1. R sends a general query every 125 s. Press → for the next step.',
      capStartOverlap: 'Start: H1 is in 239.1.1.1 (MAC {mac}). Press → for the next step.',
      capStep: 'Step {n} (t = {t} s):',
      cTick: 'Nobody sends an IGMP message.',
      cJoin: '{h} joins {g} and sends an unsolicited Membership Report.',
      cReportUp: 'The switch reads it and sends it to the router only, on port {port}.',
      cReportFlood: 'The switch does not read it: the report is a multicast frame too, so it is flooded to ports {ports}.',
      cAdd: 'The switch adds port {port} to {g}.',
      cAddMac: 'The switch adds port {port} under MAC {mac}, which already carries {other}.',
      cRouterAdd: 'R now knows there is a member of {g} on the LAN.',
      cLeave: '{h} leaves the group and sends a Leave Group to 224.0.0.2.',
      cLeaveSnoop: 'The switch sends it to the router and does not drop port {port} at once: it keeps it until t = {until} s at most.',
      cLeaveFlood: 'The switch floods it to ports {ports}.',
      cGsq: 'R sends group-specific query {k} to {g}, on ports {ports}.',
      cGq: 'R sends a General Query to 224.0.0.1, on every port.',
      cAnswer: '{h} answers with a report for {g}: port {port} holds until t = {until} s.',
      cAnswerNoSnoop: '{h} answers with a report for {g}.',
      cNoAnswer: 'No answer from port {ports}.',
      cNoAnswerMany: 'No answer from ports {ports}.',
      cSilent: '{h} hangs and sends no Leave: the link stays up, but {h} takes nothing and answers nothing.',
      cWait: 'Nobody sends an IGMP message; time passes.',
      cExpireLeave: 'No host on port {port} answered two group-specific queries 1 s apart, so the switch removes port {port} from {g}.',
      cExpireGmi: '260 s (2 × 125 s + 10 s) have passed since the last report from port {port}, so the switch removes it from {g}.',
      cRouterExpire: 'R has no member of {g} left either: the stream stops reaching the LAN.',
      cNoStream: 'R has no member of {g} on the LAN and does not forward the stream.',
      cStreamFlood: ['The switch floods the stream frame to port {ports}: {n} copy.', 'The switch floods the stream frame to ports {ports}: {n} copies.'],
      cStreamSnoop: ['The stream goes to port {ports} only: {n} copy.', 'The stream goes to ports {ports} only: {n} copies.'],
      cStreamNow: ['The stream now goes to port {ports}.', 'The stream now goes to ports {ports}.'],
      cKeeps: '{h} keeps the stream.',
      cNic: ['{hosts} is not a member: its card drops the frame, but the link carried it anyway.', '{hosts} are not members: their cards drop the frame, but the links carried it anyway.'],
      cIp: '{h} takes the frame because the MAC matches {other}, and its IP layer drops it: the destination is {g}.',
      cDown: 'The frame still reaches {h}, for nothing.',

      explain: '<p>Multicast sends one stream to every member of a group. The group address 239.1.1.1 is MAC ' +
        '01-00-5E-01-01-01 on the wire: 01-00-5E and the low 23 bits of the IP address. The lowest bit of the first octet ' +
        '(01) marks the address as a group address.</p>' +
        '<p>A switch without snooping sends such a frame like a broadcast: to every port but the one it came in on ' +
        '([[flooding]]). With IGMP snooping it reads the membership reports and sends the stream only to the ports a ' +
        'report came from. The switch decides this, not the router: the router only knows whether the LAN has at least ' +
        'one member.</p>' +
        '<p>A host that stops watching does not stop the stream at once. With a Leave its port goes after two ' +
        'group-specific queries (2 × 1 s); without one, only when no report has come for 260 s (2 × 125 s + 10 s). Groups ' +
        '224.0.0.x are always flooded. 32 groups share one MAC address, so a MAC-keyed table can send the stream to a host ' +
        'that never asked for it.</p>' +
        '<p>Sources: RFC 1112 §6.4, RFC 2236 §3 and §8, RFC 4541 §2.1.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
