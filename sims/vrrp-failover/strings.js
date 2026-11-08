/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of vrrp-failover, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key). {name} is a placeholder. *word* is an English term in italics on the Croatian page (the term
   rule; the page turns it into <em lang="en">). The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dva usmjernika dijele jedan zadani pristupnik',

      // params
      event: 'Događaj',
      evFail: 'R1 pada',
      evRestore: 'R1 se vraća',
      evShutdown: 'R1 se uredno gasi',
      evStart: 'Oba se pale',
      evCut: 'R1 i R2 se ne čuju',
      prioR1: 'Prioritet R1',
      prioR2: 'Prioritet R2',
      preempt: 'Preuzimanje prednosti',
      advInterval: 'Razmak oglasa',
      adv1: '1 s',
      adv01: '0,1 s',

      // presets
      presetFails: 'Glavni pada',
      presetBack: 'R1 se vraća',
      presetNoPreempt: 'Bez preuzimanja',
      presetTie: 'Isti prioritet',
      presetShutdown: 'Uredno gašenje',
      presetFast: 'Oglasi 0,1 s',
      presetSplit: 'Dva glavna',
      presetFailsHint: 'R2 čeka 3,61 s',
      presetTieHint: 'Viša adresa pobjeđuje',
      presetSplitHint: 'Ne čuju se, a oba dosežu preklopnik',

      // legend
      legTimer: 'brojač Master_Down',
      legAdvert: 'oglas, okvir',
      legGarp: 'ARP objava (svima)',
      legVip: 'virtualna adresa',
      legLost: 'okviri se gube',
      legChanged: 'promijenjeno u ovom koraku',

      // stage: status box
      clockTitle: 'Vrijeme',
      now: 't = {t} s',
      laneTraffic: 'promet',
      fwOk: 'Okviri prema pristupniku idu kroz {r}.',
      fwLost: 'Okviri prema pristupniku se gube.',
      fwNone: 'Pristupnika još nema.',
      lostSoFar: 'Izgubljeno: {s} s',
      changes: ['Promjena pristupnika: {n}', 'Promjene pristupnika: {n}', 'Promjena pristupnika: {n}'],
      flapNote: 'MAC skače između priključaka',

      // stage: frame card
      frameTitle: 'Okvir na žici',
      frameNone: 'Sada na žici nema okvira.',
      ethernet: 'Ethernet',
      dstMac: 'odredišni MAC',
      srcMac: 'izvorišni MAC',
      broadcastAll: 'svima',
      ipPacket: 'IP paket',
      srcIp: 'izvorišna IP',
      dstIp: 'odredišna IP',
      vrrp: 'VRRP oglas',
      prio: 'prioritet',
      vipField: 'virtualna IP',
      garpTitle: 'ARP objava',
      isAt: '{ip} je na {mac}',
      pingData: 'podaci',

      // stage: nodes
      switchName: 'preklopnik',
      swMark: 'PR',
      macTable: 'MAC tablica: MAC → priključak',
      arpTable: 'ARP tablica',
      empty: '(prazna)',
      prioLine: 'prioritet {p}',
      stMaster: 'G glavni',
      stBackup: 'P pričuvni',
      stInit: 'ne radi',
      timer: 'Master_Down: još {r} s od {d} s',
      timerSkew: 'samo Skew_Time: {r} s',
      advEvery: 'oglas svakih {a} s',
      vipLabel: 'virtualni: {ip}',
      cloud: 'Internet',
      cloudSub: 'daleke mreže',
      entrySame: 'isti MAC',
      entryFlap: 'na 3 i 4',
      gateway: 'zadani pristupnik',

      // badges and packet chips
      bSends: 'šalje',
      bHears: 'čuje',
      bDiscards: 'odbacuje',
      bLost: 'ne čuje',
      bStepdown: 'odstupa',
      bAsserts: 'ostaje glavni',
      bReceives: 'prima',
      bFails: 'pao',
      bLearns: 'uči',
      chipAdvert: 'oglas {p}',
      chipAnnounce: 'oglas + ARP objava',
      chipGarp: 'ARP objava',
      chipPing: 'ping',

      // captions
      capIntro: '{m} (prioritet {pm}) je glavni usmjernik (*master*), {k} ({pk}) pričuvni (*backup*). Domaćini šalju na zadani pristupnik {vip}, a preklopnik okvire za njegov virtualni MAC šalje na priključak {port}.',
      capIntroFail: 'Sada {r} pada.',
      capIntroShutdown: 'Sada se {r} uredno gasi.',
      capIntroCut: 'Sada se usmjernici prestaju čuti.',
      capIntroRestore: 'R1 je pao, a R2 je preuzeo i sada je glavni. R1 se upravo vraća.',
      capIntroStart: 'Oba usmjernika se pale. Glavnoga još nema: domaćini nemaju pristupnik.',
      capAdvert: '{m} šalje oglas (*advertisement*) s prioritetom {p}. {k} ga čuje i iznova pokreće brojač: {d} s.',
      capAdvertDeaf: '{m} šalje oglas s prioritetom {p}. R1 ne radi i ništa ne čuje.',
      capFail: 'R1 pada bez ijedne riječi. Okviri prema pristupniku i dalje idu na priključak {port} i gube se.',
      capFailBackup: 'R1 pada. Bio je pričuvni, pa se za domaćine ništa ne mijenja.',
      capShutdown: 'R1 se gasi i na odlasku šalje oglas s prioritetom 0: „odlazim”. R2 postavlja brojač samo na Skew_Time: {d} s.',
      capShutdownBackup: 'R1 se gasi. Bio je pričuvni: samo zaustavlja svoj brojač, bez oglasa.',
      capRestore: 'R1 se vraća kao pričuvni i pokreće brojač: {d} s. Nitko ga nije postavio za glavnog.',
      capCut: 'Od sada se oglasi između R1 i R2 gube (recimo, filtar paketa ih odbacuje), a oba usmjernika i dalje dosežu preklopnik.',
      capWaitFail: 't = {t} s: tri oglasa su izostala. {k} ima još {r} s; okviri se i dalje gube.',
      capWaitDiscard: 'R1 čuje oglase usmjernika R2 s nižim prioritetom {p} i odbacuje ih (preuzimanje prednosti je uključeno): brojač mu teče dalje, još {r} s.',
      capWaitReset: 'R1 čuje oglase usmjernika R2 i svaki put iznova pokreće brojač: {why}. R1 ostaje pričuvni.',
      whyNoPreempt: 'preuzimanje prednosti je isključeno',
      whyLower: 'njegov prioritet {p1} nije viši od prioriteta {p2}',
      capWaitCut: '{m} i dalje šalje oglase, ali {k} ih ne čuje. {k} ima još {r} s.',
      capExpire: 'Brojač usmjernika {k} istječe u t = {t} s: {k} postaje glavni. Preklopnik okvire za virtualni MAC još šalje na priključak {port}.',
      capExpireFirst: 'Brojač usmjernika {k} prvi istječe, u t = {t} s: {k} postaje glavni. Preklopnik virtualni MAC još nije vidio.',
      capExpireTie: 'Oba brojača istječu u isti tren, t = {t} s: oba usmjernika postaju glavni.',
      capAnnounce: '{k} šalje oglas i ARP objavu (*gratuitous ARP*): „{vip} je na {mac}”. Oba okvira nose virtualni MAC kao izvorište, pa ga preklopnik premješta na priključak {to}.',
      capAnnounceFirst: '{k} šalje oglas i ARP objavu (*gratuitous ARP*): „{vip} je na {mac}”. Preklopnik uči virtualni MAC na priključku {to}.',
      capAnnounceTie: 'Oba šalju oglas i ARP objavu s istim virtualnim MAC-om: preklopnik ga vidi na priključcima 3 i 4 i zadržava posljednji, {to}.',
      capFlood: 'Preklopnik ARP objavu šalje svima: A i B osvježavaju svoj zapis istim MAC-om, za njih se ništa ne mijenja.',
      capFloodEmpty: 'Preklopnik ARP objavu šalje svima. A i B nemaju zapis za {vip}, a objava ga ne dodaje: pitat će ARP-om kad im zatreba.',
      capFloodDown: 'R1 ne radi.',
      capFloodStepdown: '{o} čuje prioritet {p}, viši od svojega, i odstupa: sada je pričuvni.',
      capFloodReset: '{o} čuje prioritet {p} i ostaje pričuvni.',
      capFloodTie: 'Prioriteti su jednaki, pa odlučuje adresa: R1 (.2) čuje R2 (.3) i odstupa; R2 čuje nižu adresu, odbacuje oglas i odmah šalje svoj.',
      capFloodCut: '{o} ne čuje taj oglas i ostaje glavni: sada su glavna oba.',
      capFlap: 't = {t} s: {m} i dalje misli da je glavni i šalje oglas s istim virtualnim MAC-om. Preklopnik MAC vraća na priključak {port}. Svaki oglas ga opet premješta.',
      capFrame: 'A opet šalje na {far}, na isti MAC {mac}. Preklopnik ga sada šalje na priključak {port}, a {r} ga prosljeđuje dalje.',
      capSumFail: 'Prijelaz je trajao {lost} s: toliko su se okviri gubili. Domaćini nisu promijenili ništa; samo je preklopnik naučio novi priključak.',
      capSumFailFast: 'S oglasima svakih 0,1 s prijelaz traje samo {lost} s, ali glavni šalje deset puta više oglasa.',
      capSumBackup: 'Pao je pričuvni usmjernik: domaćini nisu izgubili ništa.',
      capSumBack: 'R1 je opet glavni: to je drugi prijelaz. Svaki prijelaz može izgubiti okvire na putu, a R1 se tek vratio; zato se preuzimanje prednosti katkad isključuje ili odgađa.',
      capSumStay: 'R2 ostaje glavni, R1 pričuvni. Nema drugog prijelaza.',
      capSumShutdown: 'Uredno gašenje stajalo je {lost} s umjesto {mdi} s: oglas s prioritetom 0 skratio je čekanje.',
      capSumTie: 'Isti prioriteti, pa pobjeđuje viša adresa: R2 (.3) je glavni, R1 (.2) pričuvni.',
      capSumStart: '{m} s višim prioritetom {p} pobijedio je: prvi je dočekao kraj svog brojača.',
      capSumCut: 'Dva glavna odgovaraju za jedan pristupnik. Preklopnik premješta MAC sa svakim oglasom, pa A-ovi okviri idu čas jednom, čas drugom usmjerniku: udvostručeni pristupnik.',

      explain: '<p>Dva usmjernika dijele jednu <b>virtualnu IP adresu</b> (192.168.1.1) i jedan <b>virtualni MAC</b> ' +
        '(00:00:5e:00:01:01). Domaćini ih imaju kao zadani pristupnik i ne znaju da su usmjernika dva. Glavni ' +
        '(<em lang="en">master</em>) šalje oglas (<em lang="en">advertisement</em>) svake sekunde; pričuvni ' +
        '(<em lang="en">backup</em>) sluša.</p>' +
        '<p>Pričuvni koji ne čuje oglas tijekom <code>3 × razmak + Skew_Time</code>, gdje je ' +
        '<code>Skew_Time = (256 − prioritet) × razmak / 256</code>, postaje glavni. Viši prioritet znači kraće ' +
        'čekanje. Uz jednake prioritete pobjeđuje viša IP adresa.</p>' +
        '<p>Novi glavni šalje <b>ARP objavu</b> (<em lang="en">gratuitous ARP</em>). Domaćini ne mijenjaju ništa jer je ' +
        'MAC isti; objava je za <b>preklopnik</b>, koji uči novi priključak. Prijelaz nije trenutačan: dok brojač ' +
        'teče, okviri se gube.</p>' +
        '<p><b>Preuzimanje prednosti</b> (<em lang="en">preemption</em>): pričuvni s višim prioritetom odbacuje oglase ' +
        'nižega i preuzima kad mu istekne brojač. Uredno gašenje šalje oglas s prioritetom 0, pa pričuvni čeka samo ' +
        'Skew_Time. Ako se usmjernici ne čuju, glavna su oba (vidi kvorum i rascjep mozga).</p>' +
        '<p>Protokol je VRRP (RFC 9568), koji glavnoga danas zove <em lang="en">Active</em>.</p>'
    },
    en: {
      stage: 'Two routers share one default gateway',

      event: 'Event',
      evFail: 'R1 fails',
      evRestore: 'R1 returns',
      evShutdown: 'R1 shuts down cleanly',
      evStart: 'Both start',
      evCut: 'R1 and R2 cannot hear each other',
      prioR1: 'R1 priority',
      prioR2: 'R2 priority',
      preempt: 'Preemption',
      advInterval: 'Advertisement interval',
      adv1: '1 s',
      adv01: '0.1 s',

      presetFails: 'Master fails',
      presetBack: 'R1 returns',
      presetNoPreempt: 'No preemption',
      presetTie: 'Equal priority',
      presetShutdown: 'Clean shutdown',
      presetFast: 'Adverts 0.1 s',
      presetSplit: 'Two Masters',
      presetFailsHint: 'R2 waits 3.61 s',
      presetTieHint: 'The higher address wins',
      presetSplitHint: 'Deaf to each other, both reach the switch',

      legTimer: 'Master_Down timer',
      legAdvert: 'advertisement, frame',
      legGarp: 'gratuitous ARP (to all)',
      legVip: 'virtual address',
      legLost: 'frames are lost',
      legChanged: 'changed in this step',

      clockTitle: 'Time',
      now: 't = {t} s',
      laneTraffic: 'traffic',
      fwOk: 'Frames to the gateway go through {r}.',
      fwLost: 'Frames to the gateway are lost.',
      fwNone: 'No gateway yet.',
      lostSoFar: 'Lost: {s} s',
      changes: ['Gateway change: {n}', 'Gateway changes: {n}'],
      flapNote: 'the MAC jumps between ports',

      frameTitle: 'Frame on the wire',
      frameNone: 'No frame on the wire now.',
      ethernet: 'Ethernet',
      dstMac: 'destination MAC',
      srcMac: 'source MAC',
      broadcastAll: 'to all',
      ipPacket: 'IP packet',
      srcIp: 'source IP',
      dstIp: 'destination IP',
      vrrp: 'VRRP advertisement',
      prio: 'priority',
      vipField: 'virtual IP',
      garpTitle: 'Gratuitous ARP',
      isAt: '{ip} is at {mac}',
      pingData: 'data',

      switchName: 'switch',
      swMark: 'SW',
      macTable: 'MAC table: MAC → port',
      arpTable: 'ARP table',
      empty: '(empty)',
      prioLine: 'priority {p}',
      stMaster: 'M Master',
      stBackup: 'B Backup',
      stInit: 'not running',
      timer: 'Master_Down: {r} s of {d} s left',
      timerSkew: 'Skew_Time only: {r} s',
      advEvery: 'advert every {a} s',
      vipLabel: 'virtual: {ip}',
      cloud: 'Internet',
      cloudSub: 'far networks',
      entrySame: 'same MAC',
      entryFlap: 'on 3 and 4',
      gateway: 'default gateway',

      bSends: 'sends',
      bHears: 'hears',
      bDiscards: 'discards',
      bLost: 'hears nothing',
      bStepdown: 'steps down',
      bAsserts: 'stays Master',
      bReceives: 'receives',
      bFails: 'failed',
      bLearns: 'learns',
      chipAdvert: 'advert {p}',
      chipAnnounce: 'advert + gratuitous ARP',
      chipGarp: 'gratuitous ARP',
      chipPing: 'ping',

      capIntro: '{m} (priority {pm}) is Master, {k} ({pk}) Backup. The hosts send to the default gateway {vip}, and the switch sends frames for its virtual MAC to port {port}.',
      capIntroFail: 'Now {r} fails.',
      capIntroShutdown: 'Now {r} shuts down cleanly.',
      capIntroCut: 'Now the routers stop hearing each other.',
      capIntroRestore: 'R1 failed and R2 took over: R2 is Master. Now R1 comes back.',
      capIntroStart: 'Both routers are starting. There is no Master yet: the hosts have no gateway.',
      capAdvert: '{m} sends an advertisement with priority {p}. {k} hears it and restarts its timer: {d} s.',
      capAdvertDeaf: '{m} sends an advertisement with priority {p}. R1 is down and hears nothing.',
      capFail: 'R1 fails without a word. Frames to the gateway still go to port {port} and are lost.',
      capFailBackup: 'R1 fails. It was the Backup, so nothing changes for the hosts.',
      capShutdown: 'R1 shuts down and on its way out sends an advertisement with priority 0: "I am leaving". R2 sets its timer to Skew_Time only: {d} s.',
      capShutdownBackup: 'R1 shuts down. It was the Backup: it just stops its timer, no advertisement.',
      capRestore: 'R1 comes back as a Backup and starts its timer: {d} s. Nobody made it Master.',
      capCut: 'From now on the advertisements between R1 and R2 are lost (a packet filter drops them, say), while both routers still reach the switch.',
      capWaitFail: 't = {t} s: three advertisements missed. {k} has {r} s left; the frames are still lost.',
      capWaitDiscard: 'R1 hears R2\'s advertisements with the lower priority {p} and discards them (preemption is on): its timer runs on, {r} s left.',
      capWaitReset: 'R1 hears R2\'s advertisements and restarts its timer each time: {why}. R1 stays Backup.',
      whyNoPreempt: 'preemption is off',
      whyLower: 'its priority {p1} is not higher than {p2}',
      capWaitCut: '{m} keeps advertising, but {k} does not hear it. {k} has {r} s left.',
      capExpire: '{k}\'s timer runs out at t = {t} s: {k} becomes Master. The switch still sends frames for the virtual MAC to port {port}.',
      capExpireFirst: '{k}\'s timer runs out first, at t = {t} s: {k} becomes Master. The switch has not seen the virtual MAC yet.',
      capExpireTie: 'Both timers run out at the same moment, t = {t} s: both routers become Master.',
      capAnnounce: '{k} sends an advertisement and a gratuitous ARP: "{vip} is at {mac}". Both frames carry the virtual MAC as their source, so the switch moves it to port {to}.',
      capAnnounceFirst: '{k} sends an advertisement and a gratuitous ARP: "{vip} is at {mac}". The switch learns the virtual MAC on port {to}.',
      capAnnounceTie: 'Both send an advertisement and a gratuitous ARP from the same virtual MAC: the switch sees it on ports 3 and 4 and keeps the last, {to}.',
      capFlood: 'The switch sends the gratuitous ARP to all: A and B refresh their entry with the same MAC, nothing changes for them.',
      capFloodEmpty: 'The switch sends the gratuitous ARP to all. A and B have no entry for {vip}, and the announcement adds none: they will ask with ARP when they need it.',
      capFloodDown: 'R1 is down.',
      capFloodStepdown: '{o} hears priority {p}, higher than its own, and steps down: it is Backup now.',
      capFloodReset: '{o} hears priority {p} and stays Backup.',
      capFloodTie: 'Equal priorities, so the address decides: R1 (.2) hears R2 (.3) and steps down; R2 hears the lower address, discards the advertisement and sends its own at once.',
      capFloodCut: '{o} does not hear that advertisement and stays Master: now both are Master.',
      capFlap: 't = {t} s: {m} still thinks it is Master and advertises from the same virtual MAC. The switch moves the MAC back to port {port}. Every advertisement moves it again.',
      capFrame: 'A sends to {far} again, to the same MAC {mac}. The switch now delivers it to port {port}, and {r} forwards it.',
      capSumFail: 'The failover took {lost} s: that is how long frames were lost. The hosts changed nothing; only the switch learned a new port.',
      capSumFailFast: 'With adverts every 0.1 s the failover takes only {lost} s, but the Master sends ten times as many advertisements.',
      capSumBackup: 'The Backup failed: the hosts lost nothing.',
      capSumBack: 'R1 is Master again: a second switch-over. Each switch-over can drop frames in flight, and R1 has only just come back; that is why preemption is sometimes switched off or delayed.',
      capSumStay: 'R2 stays Master, R1 Backup. No second switch-over.',
      capSumShutdown: 'The clean shutdown cost {lost} s instead of {mdi} s: the priority 0 advertisement cut the wait.',
      capSumTie: 'Equal priorities, so the higher address wins: R2 at .3 is Master, R1 at .2 is Backup.',
      capSumStart: '{m} with the higher priority {p} won: it was the first to reach the end of its timer.',
      capSumCut: 'Two Masters answer for one gateway. The switch moves the MAC with every advertisement, so A\'s frames go now to one router, now to the other: a duplicate gateway.',

      explain: '<p>Two routers share one <b>virtual IP address</b> (192.168.1.1) and one <b>virtual MAC</b> ' +
        '(00:00:5e:00:01:01). The hosts use it as their default gateway and do not know there are two routers. The ' +
        'Master sends an advertisement every second; the Backup listens.</p>' +
        '<p>A Backup that hears no advertisement for <code>3 × interval + Skew_Time</code>, where ' +
        '<code>Skew_Time = (256 − priority) × interval / 256</code>, becomes Master. A higher priority means a shorter ' +
        'wait. With equal priorities the higher IP address wins.</p>' +
        '<p>The new Master sends a <b>gratuitous ARP</b>. The hosts change nothing, because the MAC is the same; the ' +
        'announcement is for the <b>switch</b>, which learns the new port. Failover is not instant: while the timer ' +
        'runs, frames are lost.</p>' +
        '<p><b>Preemption</b>: a Backup with a higher priority discards the lower one\'s advertisements and takes over ' +
        'when its timer runs out. A clean shutdown sends priority 0, so the Backup waits Skew_Time only. If the ' +
        'routers cannot hear each other, both are Master (see quorum and split-brain).</p>' +
        '<p>The protocol is VRRP (RFC 9568), which now calls the Master <em>Active</em>.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
