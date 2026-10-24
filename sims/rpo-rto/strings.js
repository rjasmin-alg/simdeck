/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of rpo-rto, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks them
   up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Vremenska crta: točke oporavka, incident i faze oporavka',

      interval: 'Razmak',
      iv15: '15 min', iv60: '1 h', iv1440: '24 h', iv10080: '7 dana',
      jobMin: 'Kopija traje',
      failedRuns: 'Neuspjelih zaredom',
      replica: 'Replika',
      kind: 'Vrsta',
      kindLoss: 'sustav stane',
      kindDamage: 'šteta se širi',
      incidentAt: 'Incident',
      damageBefore: 'Šteta ranije',
      detect: 'Otkrivanje',
      decide: 'Odluka',
      restore: 'Vraćanje',
      verify: 'Provjera',
      rpoH: 'Cilj RPO',
      rtoH: 'Cilj RTO',
      weekLabel: 'Tjedan',

      presetNightly: 'Noćna kopija',
      presetNightlyHint: 'Kopija u 01:40, incident u četvrtak u 14:05',
      presetFailing: 'Neuspjele kopije',
      presetFailingHint: 'Svake noći neuspjeh od 14. 9.',
      presetMonday: 'Tek u ponedjeljak',
      presetMondayHint: 'UPS ispao u subotu u 23:40, otkriveno u ponedjeljak u 08:10',
      presetRansom: 'Ucjenjivački softver',
      presetRansomHint: 'Kopija svaki sat; prijava napadača u 02:10, šifrirane datoteke otkrivene u 07:50',
      presetReplica: 'Replika nije kopija',
      presetReplicaHint: 'Masovno brisanje u 16:40 repliciralo se na sve replike',

      legendGood: 'dobra točka',
      legendBad: 'loša točka',
      legendReplica: 'replika',
      legendIncident: 'incident',
      legendDetect: 'otkrivanje',
      legendDecide: 'odluka',
      legendRestore: 'vraćanje',
      legendVerify: 'provjera',
      legendTarget: 'cilj',
      legendChanged: 'ishod se promijenio',

      wd: 'pon|uto|sri|čet|pet|sub|ned',
      dayShort: '{wd} {d}. {m}',
      monthsShort: '1.|2.|3.|4.|5.|6.|7.|8.|9.|10.|11.|12.',
      dayLong: '{d}. {month}',
      months: 'siječnja|veljače|ožujka|travnja|svibnja|lipnja|srpnja|kolovoza|rujna|listopada|studenoga|prosinca',
      days: ['{n} dan', '{n} dana', '{n} dana'],
      hm: '{h} h {m} min',
      hOnly: '{h} h',
      mOnly: '{m} min',

      dataLost: 'Izgubljeni podaci',
      timeDown: 'Vrijeme prekida',
      targetIs: 'cilj {v}',
      met: '✓ ispunjen',
      missed: '✗ promašen',
      rtoSum: '{sum} = {v}',
      incidentLabel: 'Incident',
      damageLabel: 'šteta počinje',
      backLabel: 'Usluga radi',
      replicaLabel: 'replika',
      lastGoodLabel: 'zadnja dobra',
      gap: '{d} izostavljeno',
      gapBad: ['i {n} loša točka', 'i {n} loše točke', 'i {n} loših točaka'],
      schedule: 'Raspored: kopija svakih {iv}, traje {job}. Najgori slučaj {worst}, prosječno {avg}.',
      rpoTargetLine: 'cilj RPO',
      rtoTargetLine: 'cilj RTO',
      dragHint: 'Povuci incident po crti',

      stGood: 'dobra',
      stFailed: 'nije uspjela',
      stUnfinished: 'nije dovršena',
      stDamaged: 'sadrži štetu',
      pointLabel: 'Kopija {when}: {state}',
      replicaPoint: 'Replika {when}: {state}',

      every15: 'Kopije svakih 15 minuta',
      every60: 'Kopije svaki sat',
      every1440: 'Sigurnosne kopije svake noći',
      every10080: 'Sigurnosne kopije svaki tjedan',

      cBoth: 'Izgubljeni podaci: {loss} (cilj {rpo}) {rpoV}. Vrijeme prekida: {down} (cilj {rto}) {rtoV}.',
      cFailed: '{every}, ali zadnja koja se može vratiti je od {date}: izgubljeno je {loss} podataka.',
      cDetect: 'Ciljna točka oporavka ({rpoTerm}) mjeri koliko podataka gubite, ciljno vrijeme oporavka ({rtoTerm}) ' +
        'koliko vremena. Ovdje je samo otkrivanje trajalo {d}, a cilj je {rto}.',
      cDamaged: ['Šteta je počela u {start}: {n} kopija poslije toga nosi je u sebi. Zadnja dobra je od {date}, izgubljeno je {loss}.',
        'Šteta je počela u {start}: {n} kopije poslije toga nose je u sebi. Zadnja dobra je od {date}, izgubljeno je {loss}.',
        'Šteta je počela u {start}: {n} kopija poslije toga nosi je u sebi. Zadnja dobra je od {date}, izgubljeno je {loss}.'],
      cUnfinished: ['Kopija od {when} još se pisala kad je sustav stao, pa se ne računa. Zadnja dobra je od {date}: izgubljeno je {loss}.',
        '{n} kopije, zadnja od {when}, još su se pisale kad je sustav stao, pa se ne računaju. Zadnja dobra je od {date}: izgubljeno je {loss}.',
        '{n} kopija, zadnja od {when}, još se pisalo kad je sustav stao, pa se ne računa. Zadnja dobra je od {date}: izgubljeno je {loss}.'],
      cReplica: 'Replika je prepisala i štetu, pa nije točka oporavka. Ostaje zadnja dobra kopija, od {date}: izgubljeno je {loss}.',
      cReplicaCopies: ['Šteta je počela u {start}: nosi je replika i {n} kopija poslije toga. Ostaje zadnja dobra kopija, od {date}: izgubljeno je {loss}.',
        'Šteta je počela u {start}: nosi je replika i {n} kopije poslije toga. Ostaje zadnja dobra kopija, od {date}: izgubljeno je {loss}.',
        'Šteta je počela u {start}: nosi je replika i {n} kopija poslije toga. Ostaje zadnja dobra kopija, od {date}: izgubljeno je {loss}.'],
      cReplicaGood: 'Replika je stala zajedno sa sustavom i ima sve do incidenta: izgubljeno je {loss}. Promijeni vrstu u „šteta se širi".',

      explain: '<p><em lang="en">Recovery point objective</em> (ciljna točka oporavka, RPO) kaže koliko podataka smijete ' +
        'izgubiti, a <em lang="en">recovery time objective</em> (ciljno vrijeme oporavka, RTO) koliko dugo usluga smije ' +
        'stajati. Na vremenskoj crti to su dvije zagrade oko incidenta: lijevo od njega izgubljeni podaci, desno izgubljeno ' +
        'vrijeme.</p>' +
        '<p>Svaka kopija jedna je [[recovery point]]: stanje podataka iz jednog trenutka na koje se oporavkom može vratiti. ' +
        'Lijeva zagrada ide od zadnje <b>dobre</b> do incidenta. Kopija koja nije uspjela, koja se još pisala ili u koju je ' +
        'šteta već ušla ne računa se. Zato „RPO = koliko često radimo kopije" vrijedi samo ako je svaka kopija dobra i ako se ' +
        'šteta otkrije na vrijeme; razmak daje tek najgori slučaj rasporeda (razmak + trajanje kopije).</p>' +
        '<p>Desna zagrada nije samo vraćanje: prije njega su otkrivanje i odluka, a poslije provjera. Otkrivanje se broji od ' +
        'incidenta, ne od trenutka kad je netko primijetio. Šteta može početi i ranije (oštećenje koje se otkrije kasno): tada ' +
        'kopije od njezina početka nisu dobre, a vrijeme prekida i dalje teče od incidenta, kad je usluga stala.</p>' +
        '<p>Replika prati sustav: kad sustav stane, sinkrona replika ima sve do incidenta (RPO 0). Brisanje, šifriranje ili oštećenje ' +
        'prepiše se u nju jednako brzo, i tada ona nije točka oporavka.</p>' +
        '<p>Dva pitanja ostaju odvojena: koliko posla smijete izgubiti određuje razmak točaka, a koliko dugo greška može ' +
        'ostati neprimijećena određuje koliko unatrag mora postojati dobra. Je li točka dobra, pokazuje tek ' +
        '[[restore test]].</p>'
    },
    en: {
      stage: 'Timeline: recovery points, the incident and the recovery phases',

      interval: 'Interval',
      iv15: '15 min', iv60: '1 h', iv1440: '24 h', iv10080: '7 days',
      jobMin: 'A copy takes',
      failedRuns: 'Failed in a row',
      replica: 'Replica',
      kind: 'Type',
      kindLoss: 'outage',
      kindDamage: 'damage spreads',
      incidentAt: 'Incident',
      damageBefore: 'Prior damage',
      detect: 'Detection',
      decide: 'Decision',
      restore: 'Restore',
      verify: 'Verification',
      rpoH: 'RPO target',
      rtoH: 'RTO target',
      weekLabel: 'Week',

      presetNightly: 'Nightly backup',
      presetNightlyHint: 'A copy at 01:40, the incident on Thursday at 14:05',
      presetFailing: 'Failing backups',
      presetFailingHint: 'Every night a failure since 14 Sep',
      presetMonday: 'Found on Monday',
      presetMondayHint: 'The UPS tripped on Saturday at 23:40, found on Monday at 08:10',
      presetRansom: 'Ransomware',
      presetRansomHint: 'A copy every hour; the attacker logged on at 02:10, encrypted files found at 07:50',
      presetReplica: 'Replica is no backup',
      presetReplicaHint: 'A mass deletion at 16:40 replicated to every replica',

      legendGood: 'good point',
      legendBad: 'bad point',
      legendReplica: 'replica',
      legendIncident: 'incident',
      legendDetect: 'detection',
      legendDecide: 'decision',
      legendRestore: 'restore',
      legendVerify: 'verification',
      legendTarget: 'target',
      legendChanged: 'verdict changed',

      wd: 'Mon|Tue|Wed|Thu|Fri|Sat|Sun',
      dayShort: '{wd} {d} {m}',
      monthsShort: 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec',
      dayLong: '{d} {month}',
      months: 'January|February|March|April|May|June|July|August|September|October|November|December',
      days: ['{n} day', '{n} days'],
      hm: '{h} h {m} min',
      hOnly: '{h} h',
      mOnly: '{m} min',

      dataLost: 'Data lost',
      timeDown: 'Time down',
      targetIs: 'target {v}',
      met: '✓ met',
      missed: '✗ missed',
      rtoSum: '{sum} = {v}',
      incidentLabel: 'Incident',
      damageLabel: 'damage begins',
      backLabel: 'Service back',
      replicaLabel: 'replica',
      lastGoodLabel: 'last good',
      gap: '{d} left out',
      gapBad: ['and {n} bad point', 'and {n} bad points'],
      schedule: 'Schedule: a copy every {iv}, taking {job}. Worst case {worst}, average {avg}.',
      rpoTargetLine: 'RPO target',
      rtoTargetLine: 'RTO target',
      dragHint: 'Drag the incident along the line',

      stGood: 'good',
      stFailed: 'failed',
      stUnfinished: 'not finished',
      stDamaged: 'carries the damage',
      pointLabel: 'Copy {when}: {state}',
      replicaPoint: 'Replica {when}: {state}',

      every15: 'Copies every 15 minutes',
      every60: 'Copies every hour',
      every1440: 'Backups every night',
      every10080: 'Backups every week',

      cBoth: 'Data lost: {loss} (target {rpo}) {rpoV}. Time down: {down} (target {rto}) {rtoV}.',
      cFailed: '{every}, but the last one that restores is from {date}: {loss} of data lost.',
      cDetect: 'The recovery point objective ({rpoTerm}) measures how much data you lose, the recovery time objective ' +
        '({rtoTerm}) how much time. Here detection alone took {d}, and the target is {rto}.',
      cDamaged: ['The damage began at {start}: {n} copy after that carries it. The last good one is from {date}, {loss} lost.',
        'The damage began at {start}: {n} copies after that carry it. The last good one is from {date}, {loss} lost.'],
      cUnfinished: ['The copy of {when} was still being written when the system stopped, so it does not count. The last good one is from {date}: {loss} lost.',
        '{n} copies, the newest of {when}, were still being written when the system stopped, so they do not count. The last good one is from {date}: {loss} lost.'],
      cReplica: 'The replica copied the damage too, so it is no recovery point. What is left is the last good copy, from {date}: {loss} lost.',
      cReplicaCopies: ['The damage began at {start}: the replica and {n} copy after that carry it. What is left is the last good copy, from {date}: {loss} lost.',
        'The damage began at {start}: the replica and {n} copies after that carry it. What is left is the last good copy, from {date}: {loss} lost.'],
      cReplicaGood: 'The replica stopped with the system and holds everything up to the incident: {loss} lost. Switch the type to "damage spreads".',

      explain: '<p>The recovery point objective (RPO) says how much data you may lose, the recovery time objective (RTO) how ' +
        'long the service may be down. On the timeline they are two brackets around the incident: data lost to its left, ' +
        'time lost to its right.</p>' +
        '<p>Each copy is a [[recovery point]]: the state of the data at one moment that a restore can bring back. The left ' +
        'bracket runs from the newest <b>good</b> one to the incident. A copy that failed, that was still being written, or ' +
        'that the damage had already reached does not count. So "RPO = how often we back up" holds only if every copy is ' +
        'good and the damage is found in time; the spacing gives only the schedule\'s worst case (interval + the time a copy ' +
        'takes).</p>' +
        '<p>The right bracket is more than the restore: detection and the decision come before it, verification after. ' +
        'Detection counts from the incident, not from when someone noticed. Damage can also begin earlier (corruption found ' +
        'late): then the copies from its start are not good, and the time down still runs from the incident, when the ' +
        'service stopped.</p>' +
        '<p>A replica follows the system: when the system stops, a synchronous replica holds everything up to the incident (RPO 0). A ' +
        'deletion, encryption or corruption is copied into it just as fast, and then it is no recovery point.</p>' +
        '<p>So two questions stay apart: how much work you may lose sets the spacing of the points; how long a fault may go ' +
        'unnoticed sets how far back a good one must exist. Whether a point is good is known only from a [[restore test]].</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
