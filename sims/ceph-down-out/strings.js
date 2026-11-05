/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ceph-down-out, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* in a caption is an English term in italics (the page renders it):
   the glossary has no down, out, recovery, backfill or heartbeat yet (NOTES.md "Term pairs").
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'OSD-ovi, njihove grupe smještaja, mjerači vremena i premještanje podataka',
      dec: ',',
      uTiB: '{x} TiB',
      uGiB: '{x} GiB',

      // controls
      action: 'Što se događa s osd.0',
      actStop: 'zaustavi se',
      actDrain: 'pražnjenje',
      downOut: 'Interval down → out',
      noout: 'Zastavica noout',
      returnAt: 'osd.0 se vraća nakon',
      retNever: 'nikad',
      rate: 'Oporavak, MB/s',
      data: 'Podaci na osd.0',

      // presets
      pDead: 'Mrtav disk',
      pDeadHint: 'osd.0 pada i ne vraća se: 20 s do down, 620 s do out, pa oko 4,1 h oporavka.',
      pReboot: 'Kratki prekid',
      pRebootHint: 'osd.0 se vraća za 5 min, prije isteka 600 s: nema preraspodjele.',
      pSlow: 'Dugi prekid',
      pSlowHint: 'Vraća se za 15 min: već je bio izbačen, pa se podaci miču dvaput.',
      pNoout: 'Održavanje',
      pNooutHint: 'noout je postavljen, osd.0 je dolje 30 min: degradirano cijelo vrijeme, ništa se ne miče.',
      pDrain: 'Pražnjenje',
      pDrainHint: 'osd.0 se izbaci dok još radi: samo popunjavanje, nijedan PG nije degradiran.',

      // legend
      legChanged: 'promijenjeno',
      legUpIn: 'OSD radi',
      legStopped: 'ne odgovara, još up',
      legDownIn: 'pao, unutra',
      legDownOut: 'pao, izbačen',
      legGhost: 'izbačen dok radi / PG na krivom mjestu',
      legClean: 'PG čist',
      legDegraded: 'PG degradiran',

      // stage
      clockStart: 'kvar u 0:00:00',
      osdTitle: 'OSD-ovi po domaćinima',
      osdMeta: ['osd.0 drži {data} u {n} PG-u', 'osd.0 drži {data} u {n} PG-a', 'osd.0 drži {data} u {n} PG-ova'],
      procRun: 'proces radi',
      procStop: 'ne odgovara',
      timersTitle: 'Mjerači vremena',
      tGrace: '*heartbeat grace*',
      tDownOut: 'down → out',
      tIdle: 'još ne teče',
      tRunning: 'još {left}',
      tExpired: 'istekao u {t}',
      tHeld: 'noout: ne izbacuje',
      tCancelled: 'prekinut: osd.0 se vratio',
      tNone: 'nije potreban: osd.0 je izbačen ručno',
      moveTitle: 'Premještanje podataka',
      moveNone: '0 bajtova u pokretu',
      moveText: '{moved} od {total} · još {eta} uz {rate} MB/s',
      moveDone: 'gotovo: {total}',
      kRecovery: 'oporavak',
      kBackfill: 'popunjavanje',
      kCatchup: 'sustizanje propuštenih pisanja',
      totMoved: 'premješteno ukupno: {x}',
      totWasted: 'od toga bačeno: {x}',
      pgTitle: 'Svi PG-ovi bazena',
      pgMeta: 'size 3, min_size 2',
      zoomTitle: 'PG-ovi s kopijom na osd.0 ({n} od {of})',
      zoomMeta: 'tri kopije, zatim novo mjesto',
      z_clean: 'čist',
      z_wait: 'degradiran · ništa se ne miče',
      z_queued: '{k} → osd.{x} · čeka',
      z_moving: '{k} → osd.{x} · {p} %',
      z_back: 'natrag na osd.0 · čeka',
      z_backMoving: 'natrag na osd.0 · {p} %',
      z_catch: 'sustiže · čeka',
      z_catchMoving: 'sustiže · {p} %',
      cnt_clean: ['{n} čist', '{n} čista', '{n} čistih'],
      cnt_degraded: ['{n} degradiran', '{n} degradirana', '{n} degradiranih'],
      cnt_misplaced: ['{n} na krivom mjestu', '{n} na krivom mjestu', '{n} na krivom mjestu'],
      pgCount: ['{n} PG', '{n} PG-a', '{n} PG-ova'],

      // captions
      capStart: ['Bazen {pool} ima {pgs} *placement group* (grupa smještaja, PG), svaki u 3 kopije na 3 domaćina. osd.0 drži kopiju {n} PG-a, ukupno {data}. Pritisni → i osd.0 stane.', 'Bazen {pool} ima {pgs} *placement group* (grupa smještaja, PG), svaki u 3 kopije na 3 domaćina. osd.0 drži kopiju {n} PG-a, ukupno {data}. Pritisni → i osd.0 stane.', 'Bazen {pool} ima {pgs} *placement group* (grupa smještaja, PG), svaki u 3 kopije na 3 domaćina. osd.0 drži kopiju {n} PG-ova, ukupno {data}. Pritisni → i osd.0 stane.'],
      capStartNoout: 'Postavljena je zastavica *noout* (zastavica za održavanje).',
      capStartDrain: ['Bazen {pool} ima {pgs} *placement group* (grupa smještaja, PG), svaki u 3 kopije na 3 domaćina. osd.0 drži kopiju {n} PG-a, ukupno {data}. Pritisni → i administrator izbaci osd.0 (*out*) dok još radi.', 'Bazen {pool} ima {pgs} *placement group* (grupa smještaja, PG), svaki u 3 kopije na 3 domaćina. osd.0 drži kopiju {n} PG-a, ukupno {data}. Pritisni → i administrator izbaci osd.0 (*out*) dok još radi.', 'Bazen {pool} ima {pgs} *placement group* (grupa smještaja, PG), svaki u 3 kopije na 3 domaćina. osd.0 drži kopiju {n} PG-ova, ukupno {data}. Pritisni → i administrator izbaci osd.0 (*out*) dok još radi.'],
      capStop: '{t}: osd.0 prestane odgovarati (disk mu je zapeo ili je domaćin ostao bez struje), a da to nikome ne javi. Karta i dalje kaže da radi (*up*): susjedi primjećuju da ne stižu *heartbeat* (otkucaj, signal života) poruke i javljaju to monitorima tek nakon {grace} s.',
      capDown: 'osd.0 je pao (*down*), ali je još unutra (*in*): grupe smještaja su degradirane, a podaci se ne miču. Za {d} s monitori će ga izbaciti (*out*).',
      capDownNoout: 'osd.0 je pao (*down*), ali je još unutra (*in*): grupe smještaja su degradirane, a podaci se ne miču. Postavljen je *noout*, pa ga monitori neće izbaciti.',
      capDownMore: ['{n} PG radi s 2 od 3 kopije; *CRUSH* ga i dalje smješta na osd.0.', '{n} PG-a rade s 2 od 3 kopije; *CRUSH* ih i dalje smješta na osd.0.', '{n} PG-ova radi s 2 od 3 kopije; *CRUSH* ih i dalje smješta na osd.0.'],
      capWait: '{t}: pola intervala je prošlo. I dalje degradirano, i dalje 0 bajtova u pokretu: Ceph čeka da se osd.0 možda vrati.',
      capTimer: '{t}: {d} s je isteklo, ali *noout* je postavljen: osd.0 ostaje unutra. PG-ovi ostaju degradirani i ništa se ne miče; grozd radi na 2 kopije dok se osd.0 ne vrati.',
      capLater: '{t}: i dalje degradirano, premješteno 0 bajtova. *noout* drži podatke da čekaju disk koji se ne vraća: uz noout netko mora sam djelovati.',
      capOut: ['{t}: {d} s nakon što je označen kao pao, monitori izbacuju osd.0 (*out*, težina 0). *CRUSH* njegov {n} PG smješta na druge OSD-ove i počinje *recovery* (oporavak): {data} uz {rate} MB/s, oko {eta}.', '{t}: {d} s nakon što je označen kao pao, monitori izbacuju osd.0 (*out*, težina 0). *CRUSH* njegova {n} PG-a smješta na druge OSD-ove i počinje *recovery* (oporavak): {data} uz {rate} MB/s, oko {eta}.', '{t}: {d} s nakon što je označen kao pao, monitori izbacuju osd.0 (*out*, težina 0). *CRUSH* njegovih {n} PG-ova smješta na druge OSD-ove i počinje *recovery* (oporavak): {data} uz {rate} MB/s, oko {eta}.'],
      capOutHost: 'Svako novo mjesto je na ceph-01: ostala dva domaćina već drže po kopiju.',
      capDrain: '{t}: administrator izbacuje osd.0 (*out*) dok još radi. *CRUSH* njegove PG-ove smješta drugdje; sve kopije su i dalje žive, pa nijedan PG nije degradiran, samo je na krivom mjestu. Podaci se premještaju kao *backfill* (popunjavanje): {data} uz {rate} MB/s, oko {eta}.',
      capMoving: '{t}: oporavak teče: na nove OSD-ove dosad je kopirano {moved}.',
      capProgress: ['{t}: premješteno {p} % ({moved} od {total}); {n} PG je gotov.', '{t}: premješteno {p} % ({moved} od {total}); {n} PG-a su gotova.', '{t}: premješteno {p} % ({moved} od {total}); {n} PG-ova je gotovo.'],
      capProgressLeft: ['Još {n} čeka.', 'Još {n} čekaju.', 'Još {n} čeka.'],
      capDone: '{t}: svih {data} je premješteno; svaki PG je opet čist, s 3 kopije, nijedna na osd.0. Oporavak je trajao {dur}, a od kvara je prošlo {since}.',
      capDoneDrain: '{t}: osd.0 je prazan: svaki PG je čist, nijedan nema kopiju na osd.0, i nijedan nije bio degradiran.',
      capStopEmpty: '{t}: osd.0 je zaustavljen prije {grace} s i sada je označen kao pao (*down*). Ne drži nijedan PG, pa ništa nije degradirano i ništa se ne miče. Sada se smije izvaditi.',
      capReturn: 'osd.0 se vratio nakon {away}, prije isteka {d} s: nema nikakve preraspodjele, samo pisanja koja je propustio ({catch}).',
      capReturnNoout: 'osd.0 se vratio nakon {away}; *noout* ga je držao unutra: nema preraspodjele, samo pisanja koja je propustio ({catch}).',
      capReturnOut: '{t}: osd.0 se vratio nakon {away}, ali izbačen je još u {out}. Opet je unutra i *CRUSH* njegove PG-ove vraća na njega. Na druge OSD-ove kopirano je {moved}; od toga se baca {wasted}.',
      capReturnOutAll: '{t}: osd.0 se vratio nakon {away}, ali izbačen je još u {out}. Opet je unutra i *CRUSH* njegove PG-ove vraća na njega. Svih {moved} kopiranih na druge OSD-ove baca se: nijedan PG nije bio gotov.',
      capReturnOutNone: '{t}: osd.0 se vratio nakon {away}, ali izbačen je još u {out}. Opet je unutra i *CRUSH* njegove PG-ove vraća na njega. Na druge OSD-ove kopirano je {moved} i svaki PG je bio obnovljen.',
      capReturnBack: ['{n} PG koji je već bio obnovljen kopira se natrag na osd.0: podaci se miču dvaput.', '{n} PG-a koja su već bila obnovljena kopiraju se natrag na osd.0: podaci se miču dvaput.', '{n} PG-ova koji su već bili obnovljeni kopira se natrag na osd.0: podaci se miču dvaput.'],
      capReturnCatch: 'Ostali sustižu samo propuštena pisanja ({catch}).',
      capReturnCatchAll: 'Svaki PG sustiže samo pisanja koja je osd.0 propustio ({catch}).',
      capClean: '{t}: gotovo, svaki PG je opet čist. Premješteno ukupno: {total}.',
      capCleanWasted: 'Od toga {wasted} uzalud.',

      explain: '<p>OSD ima dvije zastavice. <em lang="en">up</em> / <em lang="en">down</em> kaže radi li proces; ' +
        'o tome odlučuju monitori kad susjedi javljaju da ne stižu <em lang="en">heartbeat</em> (otkucaj) poruke ' +
        '(<code>osd_heartbeat_grace</code>, zadano 20 s); OSD koji se uredno zaustavi ili sruši na živom domaćinu označen je kao pao odmah, jer to javi sam ili susjedi dobiju odbijenu vezu. <em lang="en">in</em> / <em lang="en">out</em> kaže smješta li ' +
        '<em lang="en">CRUSH</em> podatke na njega.</p>' +
        '<p>Pao, ali unutra: PG-ovi s kopijom na njemu degradirani su, ali i dalje poslužuju U/I, a ništa se ne miče, jer ' +
        'CRUSH podatke i dalje stavlja na taj OSD. Tek nakon <code>mon_osd_down_out_interval</code> (zadano 600 s) ' +
        'monitori ga izbacuju; CRUSH tada PG-ove smješta drugdje i počinje oporavak. Vrati li se OSD prije toga, ' +
        'sustiže samo pisanja koja je propustio. Vrati li se kasnije, dio kopiranoga se baca, a ono obnovljeno vraća se ' +
        'natrag.</p>' +
        '<p><em lang="en">Recovery</em> (oporavak) je posao za PG kojemu nedostaje živa kopija i ide prvi; ' +
        '<em lang="en">backfill</em> (popunjavanje) seli kopije koje žive, ali su na krivom mjestu. Pražnjenje ' +
        '(izbaciti OSD dok još radi) zato nikad ne degradira PG.</p>' +
        '<p>Tri zablude. „Ceph počne kopirati čim disk umre”: ne, prvo čeka. „<em lang="en">down</em> i ' +
        '<em lang="en">out</em> su isto”: prvo kaže da OSD ne radi, drugo da na njega više ne idu podaci. „noout čini ' +
        'grozd sigurnim tijekom održavanja”: noout samo sprječava premještanje; PG-ovi su cijelo vrijeme degradirani, ' +
        'pa drugi kvar tada pogađa PG-ove s jednom kopijom manje.</p>' +
        '<p>Model: brzina je stalna, PG-ovi se kopiraju jedan po jedan, a sustizanje računa s 10 MB/s pisanja klijenata.</p>'
    },

    en: {
      stage: 'OSDs, their placement groups, the timers and the data movement',
      dec: '.',
      uTiB: '{x} TiB',
      uGiB: '{x} GiB',

      // controls
      action: 'What happens to osd.0',
      actStop: 'it stops',
      actDrain: 'drain',
      downOut: 'Down → out interval',
      noout: 'noout flag',
      returnAt: 'osd.0 comes back after',
      retNever: 'never',
      rate: 'Recovery, MB/s',
      data: 'Data on osd.0',

      // presets
      pDead: 'Dead disk',
      pDeadHint: 'osd.0 stops for good: 20 s to down, 620 s to out, then about 4.1 h of recovery.',
      pReboot: 'Reboot',
      pRebootHint: 'osd.0 is back after 5 min, before the 600 s timer: no rebalancing.',
      pSlow: 'Slow reboot',
      pSlowHint: 'Back after 15 min: it was already out, so data moves twice.',
      pNoout: 'Maintenance',
      pNooutHint: 'noout set, osd.0 down for 30 min: degraded the whole time, nothing moves.',
      pDrain: 'Drain',
      pDrainHint: 'osd.0 is marked out while it still runs: backfill only, no PG degraded.',

      // legend
      legChanged: 'changed',
      legUpIn: 'OSD up and in',
      legStopped: 'silent, still up',
      legDownIn: 'down, in',
      legDownOut: 'down, out',
      legGhost: 'out while up / PG misplaced',
      legClean: 'PG clean',
      legDegraded: 'PG degraded',

      // stage
      clockStart: 'failure at 0:00:00',
      osdTitle: 'OSDs by host',
      osdMeta: ['osd.0 holds {data} in {n} PG', 'osd.0 holds {data} in {n} PGs'],
      procRun: 'process running',
      procStop: 'not answering',
      timersTitle: 'Timers',
      tGrace: 'heartbeat grace',
      tDownOut: 'down → out',
      tIdle: 'not running yet',
      tRunning: '{left} left',
      tExpired: 'fired at {t}',
      tHeld: 'noout: does not mark out',
      tCancelled: 'cancelled: osd.0 is back',
      tNone: 'not needed: osd.0 marked out by hand',
      moveTitle: 'Data movement',
      moveNone: '0 bytes moving',
      moveText: '{moved} of {total} · {eta} left at {rate} MB/s',
      moveDone: 'done: {total}',
      kRecovery: 'recovery',
      kBackfill: 'backfill',
      kCatchup: 'catching up missed writes',
      totMoved: 'moved in total: {x}',
      totWasted: 'of that thrown away: {x}',
      pgTitle: 'Every PG of the pool',
      pgMeta: 'size 3, min_size 2',
      zoomTitle: 'PGs with a copy on osd.0 ({n} of {of})',
      zoomMeta: 'three copies, then the new place',
      z_clean: 'clean',
      z_wait: 'degraded · nothing moves',
      z_queued: '{k} → osd.{x} · queued',
      z_moving: '{k} → osd.{x} · {p} %',
      z_back: 'back to osd.0 · queued',
      z_backMoving: 'back to osd.0 · {p} %',
      z_catch: 'catching up · queued',
      z_catchMoving: 'catching up · {p} %',
      cnt_clean: ['{n} clean', '{n} clean'],
      cnt_degraded: ['{n} degraded', '{n} degraded'],
      cnt_misplaced: ['{n} misplaced', '{n} misplaced'],
      pgCount: ['{n} PG', '{n} PGs'],

      // captions
      capStart: ['Pool {pool} has {pgs} *placement groups* (PGs), each in 3 copies on 3 hosts. osd.0 holds a copy of {n} PG, {data} in all. Press → and osd.0 stops.', 'Pool {pool} has {pgs} *placement groups* (PGs), each in 3 copies on 3 hosts. osd.0 holds a copy of {n} PGs, {data} in all. Press → and osd.0 stops.'],
      capStartNoout: 'The *noout* flag is set.',
      capStartDrain: ['Pool {pool} has {pgs} *placement groups* (PGs), each in 3 copies on 3 hosts. osd.0 holds a copy of {n} PG, {data} in all. Press → and the operator marks osd.0 *out* while it still runs.', 'Pool {pool} has {pgs} *placement groups* (PGs), each in 3 copies on 3 hosts. osd.0 holds a copy of {n} PGs, {data} in all. Press → and the operator marks osd.0 *out* while it still runs.'],
      capStop: '{t}: osd.0 stops answering (its disk hangs, or its host loses power) without telling anyone. The map still says *up*: its peers notice the missing *heartbeats* and report it to the monitors only after {grace} s.',
      capDown: 'osd.0 is *down* but still *in*: its placement groups are degraded and no data moves. In {d} s the monitors will mark it *out*.',
      capDownNoout: 'osd.0 is *down* but still *in*: its placement groups are degraded and no data moves. *noout* is set, so the monitors will not mark it out.',
      capDownMore: ['{n} PG runs on 2 of 3 copies; *CRUSH* still maps it to osd.0.', '{n} PGs run on 2 of 3 copies; *CRUSH* still maps them to osd.0.'],
      capWait: '{t}: half the interval gone. Still degraded, still 0 bytes moving: Ceph waits in case osd.0 comes back.',
      capTimer: '{t}: the {d} s are up, but *noout* is set: osd.0 stays in. The PGs stay degraded and nothing moves; the cluster runs on 2 copies until osd.0 is back.',
      capLater: '{t}: still degraded, 0 bytes moved. *noout* keeps the data waiting for a disk that is not coming back: with noout set, someone has to act.',
      capOut: ['{t}: {d} s after it was marked down, the monitors mark osd.0 *out* (weight 0). *CRUSH* maps its {n} PG to other OSDs and *recovery* starts: {data} at {rate} MB/s, about {eta}.', '{t}: {d} s after it was marked down, the monitors mark osd.0 *out* (weight 0). *CRUSH* maps its {n} PGs to other OSDs and *recovery* starts: {data} at {rate} MB/s, about {eta}.'],
      capOutHost: 'Every new place is on ceph-01: the other two hosts already hold a copy each.',
      capDrain: '{t}: the operator marks osd.0 *out* while it still runs. *CRUSH* maps its PGs elsewhere; every copy is still live, so no PG is degraded, only misplaced. The data moves by *backfill*: {data} at {rate} MB/s, about {eta}.',
      capMoving: '{t}: recovery under way: {moved} copied to the new OSDs so far.',
      capProgress: ['{t}: {p} % moved ({moved} of {total}); {n} PG done.', '{t}: {p} % moved ({moved} of {total}); {n} PGs done.'],
      capProgressLeft: ['{n} still waits.', '{n} still wait.'],
      capDone: '{t}: all {data} moved; every PG is clean again, with 3 copies, none on osd.0. Recovery took {dur}; {since} since the failure.',
      capDoneDrain: '{t}: osd.0 is empty: every PG clean, none with a copy on osd.0, and none was ever degraded.',
      capStopEmpty: '{t}: osd.0 was stopped {grace} s ago and is now marked *down*. It holds no PG, so nothing is degraded and nothing moves. It can be removed now.',
      capReturn: 'osd.0 came back after {away}, before the {d} s timer: no rebalancing at all, only the writes it missed ({catch}).',
      capReturnNoout: 'osd.0 came back after {away}; *noout* kept it in: no rebalancing, only the writes it missed ({catch}).',
      capReturnOut: '{t}: osd.0 came back after {away}, but it was out since {out}. It is in again and *CRUSH* maps its PGs back to it. {moved} was copied to other OSDs; {wasted} of it is thrown away.',
      capReturnOutAll: '{t}: osd.0 came back after {away}, but it was out since {out}. It is in again and *CRUSH* maps its PGs back to it. All {moved} copied to other OSDs is thrown away: no PG had finished.',
      capReturnOutNone: '{t}: osd.0 came back after {away}, but it was out since {out}. It is in again and *CRUSH* maps its PGs back to it. {moved} was copied to other OSDs and every PG had been rebuilt.',
      capReturnBack: ['{n} PG that was already rebuilt is copied back to osd.0: the data moves twice.', '{n} PGs that were already rebuilt are copied back to osd.0: the data moves twice.'],
      capReturnCatch: 'The others only catch up on the writes they missed ({catch}).',
      capReturnCatchAll: 'Every PG only catches up on the writes osd.0 missed ({catch}).',
      capClean: '{t}: done, every PG is clean again. Moved in total: {total}.',
      capCleanWasted: '{wasted} of it for nothing.',

      explain: '<p>An OSD has two flags. <em>up</em> / <em>down</em> says whether the process runs; the monitors decide ' +
        'it when peers report missing heartbeats (<code>osd_heartbeat_grace</code>, default 20 s); an OSD that is stopped cleanly or crashes on a live host is marked down at once, because it says so itself or its peers get a refused connection. <em>in</em> / ' +
        '<em>out</em> says whether CRUSH places data on it.</p>' +
        '<p>Down but in: the PGs with a copy on it are degraded and still serve I/O, and nothing moves, because CRUSH ' +
        'still places the data on that OSD. Only after <code>mon_osd_down_out_interval</code> (default 600 s) do the ' +
        'monitors mark it out; CRUSH then places its PGs elsewhere and recovery starts. If the OSD comes back before ' +
        'that, it only catches up on the writes it missed. If it comes back later, part of what was copied is thrown ' +
        'away and what was rebuilt moves back.</p>' +
        '<p><em>Recovery</em> is work for a PG short of a live copy, and goes first; <em>backfill</em> moves copies ' +
        'that are live but in the wrong place. Draining (marking an OSD out while it still runs) therefore never ' +
        'degrades a PG.</p>' +
        '<p>Three misconceptions. “Ceph starts copying the moment a disk dies”: no, it waits first. “Down and out are ' +
        'the same”: the first says the OSD does not run, the second that data no longer goes to it. “noout makes the ' +
        'cluster safe during maintenance”: noout only stops data from moving; the PGs are degraded the whole time, so ' +
        'a second failure then hits PGs that are already a copy short.</p>' +
        '<p>Model: the rate is fixed, PGs are copied one at a time, and the catch-up assumes 10 MB/s of client writes.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
