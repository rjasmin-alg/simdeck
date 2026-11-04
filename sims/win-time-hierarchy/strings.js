/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-time-hierarchy, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* marks an English term in italics on the Croatian page (the page turns it into <em lang="en">); none of the
   page's terms is in kit/glossary.js yet, so they are written out this way, English term then the Croatian in
   parentheses at the first mention (NOTES.md, "Term pairs"). The title and subtitle come from sim.json (title,
   concept). Node ids, host names, addresses, offsets and durations are data, shown with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Hijerarhija vremena u domeni: vanjski izvor loom, emulator PDC-a, ostali kontroleri domene i dva člana domene, svaki sa svojim pomakom od stvarnog vremena; desno provjera Kerberosa za parove i dnevnik događaja',

      // node cards
      cfgLocal: 'stvarno vrijeme',
      cfgManual: 'ručni izvor: {peer}',
      cfgDomhier: 'hijerarhija domene, od {src}',
      cfgTop: 'hijerarhija domene, iznad nitko',
      cfgStopped: 'hijerarhija domene, usluga zaustavljena',
      drift: 'odmak {d} po krugu',
      bPdc: 'PDC',
      bE12: 'događaj 12',
      bStopped: 'ne sinkronizira',
      bCorrected: 'ispravak {d}',

      // side panel
      round: 'krug {n} / {of}',
      roundStart: 'početak',
      krbHead: 'Kerberos: najviše 5 minuta razlike',
      kLogon: 'prijava',
      kDc: 'DC – DC',
      kOk: 'u redu',
      kFail: 'odbijeno',
      logHead: 'Dnevnik događaja',
      logEmpty: 'ništa zabilježeno',
      logE12: '{node}: događaj 12, iznad njega nema nikoga',
      logFail: '{a} ↔ {b}: Kerberos odbija',
      logOk: '{a} ↔ {b}: Kerberos opet radi',
      logRound: 'krug {n}',

      // legend
      lgSync: 'sinkronizira se odavde',
      lgBroken: 'nema sinkronizacije (✕ prekinuto)',
      lgPdc: 'emulator PDC-a',
      lgOffset: 'pomak od stvarnog vremena',
      lgKrb: 'Kerberos u redu ✓ / odbijeno ✕',
      lgChanged: 'pomak promijenjen u ovom krugu',

      // params and presets
      pPdcSource: 'Izvor za DC01',
      srcExternal: 'loom',
      srcNone: 'nijedan',
      pPdcDrift: 'Odmak sata PDC-a',
      pStopped: 'PC-B: usluga stala',
      pPcbDrift: 'Odmak sata PC-B',
      pPdcOn: 'Uloga PDC-a',
      pRounds: 'Broj krugova',
      perRound: '{d} po krugu',
      prHealthy: 'Zdrava domena',
      prNoSource: 'PDC bez izvora',
      prStopped: 'PC-B ne sinkronizira',
      prMove: 'Premještena uloga PDC-a',
      prQuillmoor: 'Quillmoor',

      // captions
      dirAhead: 'ispred',
      dirBehind: 'iza',
      capStart: 'Početak: svi satovi pokazuju stvarno vrijeme.',
      startExt: '{pdc} ima ulogu *PDC emulator* (emulator PDC-a) i vrijeme uzima od {peer} ({addr}), postavljenog kao ručni izvor.',
      startNone: '{pdc} ima ulogu *PDC emulator* (emulator PDC-a), ali nema vanjski izvor: postavljen je na *domain hierarchy* (hijerarhija domene) kao i svi ostali.',
      startMoved: 'Uloga *PDC emulator* (emulator PDC-a) premještena je na {pdc}, ali postavke vremena nisu: {pdc} je i dalje na *domain hierarchy* (hijerarhija domene), a DC01 i dalje ima {peer} kao ručni izvor.',
      startMovedNone: 'Uloga *PDC emulator* (emulator PDC-a) je na {pdc}; nijedan DC nema vanjski izvor.',
      startTree: 'Ostali DC-ovi slijede PDC, a PC-A i PC-B svoj DC.',
      startTreeMoved: 'DC03 slijedi novi PDC, a PC-A i PC-B svoj DC.',
      startStopped: 'Na PC-B je usluga vremena zaustavljena.',
      startGo: 'Pritisni → za prvi krug sinkronizacije.',
      capMech: 'Krug {n}: svaki sat odmakne za svoj iznos, a zatim svatko uzme vrijeme svog izvora, odozgo prema dolje (izvor → tko ga slijedi): {order}.',
      capPulled: 'Satovi su opet odmakli i opet su vraćeni na vrijeme izvora; domena ostaje na vremenu izvora {peer}.',
      capPdcPulled: 'Sat na {pdc} sam odmiče {d} po krugu, a {peer} ga svaki krug vraća; svi ispod njega slijede.',
      minutes: ['{n} minutu', '{n} minute', '{n} minuta'],
      capE12: '{pdc} ima ulogu PDC-a u korijenskoj domeni šume i postavljen je na hijerarhiju domene: iznad njega nema nikoga, pa radi po svom satu i bilježi događaj 12.',
      capOldPdc: 'DC01 i dalje uzima vrijeme od {peer}, ali od DC01 više nitko ne uzima vrijeme.',
      capFree: '{pdc} nema izvor; njegov sat odmiče {d} po krugu, a svi ispod njega ga slijede: sada je {off} od stvarnog vremena.',
      capFreeZero: '{pdc} nema izvor, ali njegov sat zasad ne odmiče; svi ispod njega ga slijede.',
      capSplit: 'DC01 je na stvarnom vremenu, a ostatak domene udaljen je {d} od njega: kad razlika prijeđe 5 minuta, Kerberos između DC01 i ostalih DC-ova prestaje raditi.',
      capAgreeAhead: 'Cijela domena je {d} ispred stvarnog vremena, ali se svi međusobno slažu — *Kerberos* radi.',
      capAgreeBehind: 'Cijela domena kasni {d} za stvarnim vremenom, ali se svi međusobno slažu — *Kerberos* radi.',
      capStopped: 'Usluga vremena na {a} je zaustavljena: radi po svom satu i ne slijedi {b}; sada je {d} {dir} {b}, još unutar 5 minuta.',
      capFailLogon: '{a} je {d} {dir} svog DC-a, više od 5 minuta: *Kerberos* odbija prijavu.',
      capFailDc: '{a} je {d} {dir} {b}, više od 5 minuta: *Kerberos* između njih ne radi, pa ne mogu replicirati.',
      capStillFail: '{a} je sada {d} {dir} {b}: Kerberos odbija sve dok se sat ne ispravi.',
      capOkAgain: '{a} i {b} opet su unutar 5 minuta: Kerberos radi.',

      explain: '<p>U domeni vrijeme teče odozgo prema dolje. Članovi domene (<em lang="en">domain hierarchy</em>, ' +
        'hijerarhija domene, tip NT5DS) uzimaju vrijeme od kontrolera domene. Kontroleri domene uzimaju ga od ' +
        '<em lang="en">PDC emulator</em> (emulator PDC-a) svoje domene, a PDC-a pronalaze po ulozi. PDC korijenske domene šume ' +
        'je vrh: njemu se postavlja vanjski <em lang="en">time source</em> (izvor vremena), ovdje <code>loom</code>.</p>' +
        '<p>Bez vanjskog izvora PDC iznad sebe nema nikoga: radi po svom satu i bilježi događaj 12. Cijela domena ga ' +
        'slijedi, pa zajedno odlazi od stvarnog vremena.</p>' +
        '<p><em lang="en">Kerberos</em> uspoređuje satove strana, ne stvarno vrijeme: prijava prolazi dok je ' +
        '<em lang="en">clock skew</em> (razlika satova) između klijenta i DC-a najviše 5 minuta (pravilo Kerberosa u ' +
        'domeni). Domena koja kasni 10 minuta, ali složno, i dalje radi; jedno računalo koje 6 minuta žuri ne može se prijaviti.</p>' +
        '<p>Računalo kojemu je usluga vremena zaustavljena ne sinkronizira se: njegov <em lang="en">clock drift</em> ' +
        '(odmak sata) nitko ne ispravlja. Virtualni DC koji vrijeme uzima od hipervizora umjesto od hijerarhije slijedi sat domaćina, a ne domene.</p>' +
        '<p>Premještanje uloge PDC-a ne premješta postavke: novi PDC ostaje na hijerarhiji domene i nema nikoga iznad sebe, a stari ' +
        'i dalje uzima vrijeme od vanjskog izvora, samo što od njega više nitko ne uzima. Postavke vremena treba premjestiti s ulogom.</p>' +
        '<p>Česte zablude: Kerberos ne treba točno vrijeme, nego isto vrijeme. A svako računalo usmjereno na javni poslužitelj ' +
        'vremena slijedilo bi svoj izvor umjesto domene.</p>' +
        '<p>Pojednostavnjeno: sinkronizacija je trenutna i točna (računica NTP-a je u simulatoru „NTP: pomak i kašnjenje”), ' +
        'vrijeme teče u krugovima, a odmaci su u sekundama po krugu.</p>'
    },
    en: {
      stage: 'The time hierarchy of a domain: the external source loom, the PDC emulator, the other domain controllers and two domain members, each with its offset from true time; on the right the Kerberos check for pairs and the event log',

      cfgLocal: 'true time',
      cfgManual: 'manual peer: {peer}',
      cfgDomhier: 'domain hierarchy, from {src}',
      cfgTop: 'domain hierarchy, nobody above',
      cfgStopped: 'domain hierarchy, service stopped',
      drift: 'drift {d} per round',
      bPdc: 'PDC',
      bE12: 'event 12',
      bStopped: 'not syncing',
      bCorrected: 'corrected {d}',

      round: 'round {n} / {of}',
      roundStart: 'start',
      krbHead: 'Kerberos: at most 5 minutes apart',
      kLogon: 'logon',
      kDc: 'DC – DC',
      kOk: 'ok',
      kFail: 'refused',
      logHead: 'Event log',
      logEmpty: 'nothing logged',
      logE12: '{node}: event 12, nobody above it',
      logFail: '{a} ↔ {b}: Kerberos refuses',
      logOk: '{a} ↔ {b}: Kerberos works again',
      logRound: 'round {n}',

      lgSync: 'syncs from here',
      lgBroken: 'no sync (✕ broken)',
      lgPdc: 'PDC emulator',
      lgOffset: 'offset from true time',
      lgKrb: 'Kerberos ok ✓ / refused ✕',
      lgChanged: 'offset changed this round',

      pPdcSource: 'DC01’s source',
      srcExternal: 'loom',
      srcNone: 'none',
      pPdcDrift: 'PDC clock drift',
      pStopped: 'PC-B: service stopped',
      pPcbDrift: 'PC-B clock drift',
      pPdcOn: 'PDC role on',
      pRounds: 'Rounds',
      perRound: '{d} per round',
      prHealthy: 'Healthy domain',
      prNoSource: 'PDC without a source',
      prStopped: 'PC-B not syncing',
      prMove: 'PDC role moved',
      prQuillmoor: 'Quillmoor',

      dirAhead: 'ahead of',
      dirBehind: 'behind',
      capStart: 'Start: every clock shows true time.',
      startExt: '{pdc} holds the PDC emulator role and takes its time from {peer} ({addr}), set as a manual peer.',
      startNone: '{pdc} holds the PDC emulator role but has no external source: it is set to domain hierarchy like everyone else.',
      startMoved: 'The PDC emulator role has moved to {pdc}, but the time settings have not: {pdc} is still set to domain hierarchy, and DC01 still has {peer} as its manual peer.',
      startMovedNone: 'The PDC emulator role is on {pdc}; no DC has an external source.',
      startTree: 'The other DCs follow the PDC, and PC-A and PC-B follow their own DC.',
      startTreeMoved: 'DC03 follows the new PDC, and PC-A and PC-B follow their own DC.',
      startStopped: 'PC-B’s time service is stopped.',
      startGo: 'Press → for the first sync round.',
      capMech: 'Round {n}: every clock drifts by its own amount, then each takes the time of its source, top down (source → who follows it): {order}.',
      capPulled: 'The clocks drifted again and were set back to their sources’ time; the domain stays on {peer}’s time.',
      capPdcPulled: '{pdc}’s own clock drifts {d} per round and {peer} sets it back every round; everyone below follows.',
      minutes: ['{n} minute', '{n} minutes'],
      capE12: '{pdc} holds the PDC role of the forest root domain and is set to domain hierarchy: there is nobody above it, so it runs on its own clock and logs event 12.',
      capOldPdc: 'DC01 still takes its time from {peer}, but nobody takes time from DC01 any more.',
      capFree: '{pdc} has no source; its clock drifts {d} per round and everyone below it follows: now {off} from true time.',
      capFreeZero: '{pdc} has no source, but its clock is not drifting yet; everyone below it follows.',
      capSplit: 'DC01 is on true time and the rest of the domain is {d} away from it: past 5 minutes, Kerberos between DC01 and the other DCs stops working.',
      capAgreeAhead: 'The whole domain is {d} ahead of real time, but everyone agrees with each other — Kerberos works.',
      capAgreeBehind: 'The whole domain is {d} behind real time, but everyone agrees with each other — Kerberos works.',
      capStopped: 'The time service on {a} is stopped: it runs on its own clock and does not follow {b}; now {d} {dir} {b}, still within 5 minutes.',
      capFailLogon: '{a} is {d} {dir} its DC, more than 5 minutes: Kerberos refuses the logon.',
      capFailDc: '{a} is {d} {dir} {b}, more than 5 minutes: Kerberos between them fails, so they cannot replicate.',
      capStillFail: '{a} is now {d} {dir} {b}: Kerberos keeps refusing until the clock is corrected.',
      capOkAgain: '{a} and {b} are within 5 minutes again: Kerberos works.',

      explain: '<p>In a domain, time flows top down. Domain members (domain hierarchy, type NT5DS) take their time from a ' +
        'domain controller. Domain controllers take it from the PDC emulator of their domain, which they find by its role. ' +
        'The PDC of the forest root domain is the top: it is the one given an external time source, here <code>loom</code>.</p>' +
        '<p>Without an external source the PDC has nobody above it: it runs on its own clock and logs event 12. The whole ' +
        'domain follows it, so they all drift away from true time together.</p>' +
        '<p>Kerberos compares the parties’ clocks, not true time: a logon passes while the clock skew between client and DC ' +
        'is at most 5 minutes (the domain’s Kerberos policy). A domain that is 10 minutes late, all together, still works; ' +
        'one computer that is 6 minutes fast cannot log on.</p>' +
        '<p>A computer whose time service is stopped does not sync: nobody corrects its clock drift. A virtual DC that ' +
        'takes its time from the hypervisor instead of the hierarchy follows the host’s clock, not the domain’s.</p>' +
        '<p>Moving the PDC role does not move the settings: the new PDC stays on domain hierarchy with nobody above it, and ' +
        'the old one still takes its time from the external source, only nobody takes time from it. The time settings ' +
        'have to move with the role.</p>' +
        '<p>Common mistakes: Kerberos does not need the correct time, it needs the same time. And every computer pointed at ' +
        'a public time server would follow its own source instead of the domain.</p>' +
        '<p>Simplified: syncing is instant and exact (the NTP arithmetic is in the simulator “NTP offset and delay”), time ' +
        'moves in rounds, and drifts are in seconds per round.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
