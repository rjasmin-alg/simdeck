/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-deploy-strategies, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The glossary has none of this sim's terms (NOTES.md, Term pairs): the lane names are written out, and on the
   Croatian page the English name is in italics with the Croatian in parentheses (the page's term() helper; keys
   ending in Hr, unused on the English page, keep the tables equal). Numbers, shares and instance labels are data:
   the page puts them in translate="no" elements. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tri strategije uvođenja jedna uz drugu, minutu po minutu',
      rolling: 'rolling update',
      rollingHr: 'postupno uvođenje',
      rollingSub: 'jedna instanca u minuti',
      blueGreen: 'blue-green',
      blueGreenHr: 'plavo-zeleno',
      blueGreenSub: 'cijeli novi skup, pa prebacivanje',
      canary: 'canary',
      canaryHr: 'kanarinac',
      canarySub: '10, 10, 25, 50, 100 % prometa',
      lb: 'uravnotežitelj opterećenja',
      lbReq: '2000 zahtjeva u minuti',
      groupRolling: 'četiri instance',
      groupSurge: 'višak',
      groupBlue: 'plava (v1)',
      groupGreen: 'zelena (v2)',
      groupBase: 'osnovna (v1)',
      groupCanary: 'kanarinac (v2)',
      live: 'u prometu',
      instV1: 'instanca {id}: v1, prima {req} zahtjeva',
      instV2: 'instanca {id}: v2, prima {req} zahtjeva',
      instNotReady: 'instanca {id}: v2, nije spremna, ne prima promet',
      split: 'v2 dobiva',
      splitLabel: 'podjela prometa: v2 dobiva {p}',
      thisMinute: 'ova minuta',
      total: 'ukupno',
      checkAll: 'uzbuna: {rate} svih zahtjeva',
      checkOwn: 'provjera: {rate} kanarinčevih',
      checkNone: 'ove minute nema provjere',
      phase_idle: 'v1 poslužuje',
      phase_deploying: 'uvodi se',
      phase_rollingBack: 'vraća se',
      phase_rolledBack: 'vraćeno na v1',
      phase_done: 'gotovo',
      phase_stalled: 'zapelo',
      strip: 'neuspjeli zahtjevi po minuti',
      stripTotal: 'ukupno',
      stripRolling: 'postupno',
      stripBlueGreen: 'plavo-zeleno',
      stripCanary: 'kanarinac',
      minute: 'minuta',
      v2Error: 'v2 griješi u',
      v2Ready: 'v2 prolazi provjeru ispravnosti',
      v2ReadyHint: 'Isključeno: v2 se ruši i nikad ne postaje spreman.',
      threshold: 'Prag provjere',
      thresholdHint: 'Uzbuna i provjera kanarinca okidaju iznad praga.',
      pct: '{v} %',
      presetAll: 'Sve pogrešno',
      presetAllHint: 'v2 ne uspijeva ni u jednom zahtjevu.',
      presetSubtle: 'Greška od 3\u00a0%',
      presetSubtleHint: 'v2 griješi u 3 % zahtjeva, prag je 2 %.',
      presetBelow: 'Greška od 1,5\u00a0%',
      presetBelowHint: 'v2 griješi u 1,5 %, prag je 2 %.',
      presetCrash: 'v2 se ruši',
      presetCrashHint: 'v2 ne prolazi provjeru ispravnosti.',
      presetGood: 'Ispravno izdanje',
      presetGoodHint: 'v2 ne griješi.',
      legV1: 'v1',
      legV2: 'v2',
      legNotReady: 'nije spremna',
      legPipe: 'širina = udio prometa',
      legFailed: 'neuspjeli zahtjevi',
      legBack: 'povratak',
      legChanged: 'promijenjeno',
      capMin: 'Minuta {n}: ',
      capStart: 'Minuta 0: u sve tri trake v1 poslužuje 2000 zahtjeva u minuti. Svaka strategija sada uvodi v2, koji griješi u {err} zahtjeva.',
      capStartCrash: 'Minuta 0: u sve tri trake v1 poslužuje 2000 zahtjeva u minuti. Svaka strategija sada uvodi v2, koji se ruši i nikad ne postaje spreman.',
      capStartGood: 'Minuta 0: u sve tri trake v1 poslužuje 2000 zahtjeva u minuti. Svaka strategija sada uvodi v2, koji ne griješi.',
      rAdvance: '{lane} zamjenjuje jednu instancu: v2 dobiva {share}, {nFailed}, {rate} svih, što nije iznad praga uzbune od {thr}.',
      rTrip: '{lane} stiže do {share}: {failed} od 2000 zahtjeva ne uspije ({rate} > {thr}), uzbuna za cijelu uslugu se aktivira i povratak počinje sljedeće minute. Dosad {nTotal}.',
      rBack: '{lane} vraća se instancu po instancu: v2 još ima {share}, u ovoj minuti {nFailed}, dosad ukupno {total}.',
      rRolledBack: '{lane} opet je posve na v1, instancu po instancu, kao što je i uvedeno. Ukupno {nTotal}.',
      rDone: '{lane} stiže do 100 % bez uzbune i tu staje: gotovo. U ovoj minuti {nFailed}.',
      rStalled: '{lane} pokreće jednu v2 instancu uz četiri v1, ali ona ne postaje spremna, pa nijedna v1 ne odlazi: v1 poslužuje sve, 0 neuspjelih. U minuti {deadline} javit će da nema napretka, a samo se neće vratiti.',
      bDone: '{lane} prebacuje sav promet na zelene odjednom, bez uzbune: gotovo. Plave i dalje rade, za brzi povratak. U ovoj minuti {nFailed}.',
      bTrip: '{lane} prebacuje sav promet na zelene odjednom: {failed} od 2000 zahtjeva ne uspije ({rate} > {thr}) i uzbuna se aktivira. Pogođeni su svi korisnici, ali plave još rade.',
      bRolledBack: '{lane} vraća sav promet na plave u jednoj minuti, jer plave nisu ni stale. Ukupno {nTotal}.',
      bRefused: '{lane} odbija prebacivanje: zelene ne prolaze {healthAcc}, plave zadržavaju 100 % prometa. 0 neuspjelih.',
      cTrip: '{lane} prima {share} prometa i griješi u {rate} zahtjeva; usporedba s osnovnom inačicom to odmah vidi i promet vraća na v1. Ukupno {nTotal}.',
      cRolledBack: '{lane} je isključen iz prometa: v2 dobiva 0 %, sav promet opet ide na v1. Ukupno {nTotal}.',
      cDone: '{lane} stiže do 100 %: njegova stopa pogrešaka ({rate}) nikad nije prešla prag od {thr}. U ovoj minuti {nFailed}.',
      capWaiting: 'sve tri trake stoje, a v1 poslužuje sve: 0 neuspjelih zahtjeva. Pad uhvati {health}, ali pogrešne odgovore ne.',
      capQuiet: 'ništa se ne mijenja; svaka traka zadržava svoje stanje.',
      capUnseen: ' Sve su tri trake na 100 % s v2 koji i dalje griješi: nijedna provjera ne hvata ono što ne vidi.',
      health: 'health check',
      healthHr: 'provjera ispravnosti',
      healthAcc: 'health check',
      healthAccHr: 'provjeru ispravnosti',
      nFailed: ['{c} neuspio zahtjev', '{c} neuspjela zahtjeva', '{c} neuspjelih zahtjeva'],
      explain:
        '<p>Isti v2 uvodi se na tri načina odjednom; svaka traka svake minute dobiva 2000 zahtjeva. ' +
        '<i>Rolling update</i> (postupno uvođenje) mijenja jednu instancu u minuti: nova prima promet tek kad je spremna, ' +
        'pa v2 dobiva 25, 50, 75 i 100 %. <i>Blue-green deployment</i> (plavo-zeleno uvođenje) pokrene cijeli novi skup ' +
        'uz stari, provjeri ga i prebaci sav promet odjednom. <i>Canary</i> (kanarinac) pusti malen dio prometa na v2 ' +
        '(10 %, pa 25, 50 i 100 %) i uspoređuje njegovu stopu pogrešaka s osnovnom inačicom.</p>' +
        '<p><b>Povratak.</b> <i>Rollback</i> (povratak unatrag) plavo-zelenog traje jednu minutu jer stari skup još radi. ' +
        'Postupno uvođenje vraća se jednako polako kako je i išlo, instancu po instancu, i to tek kad uzbuna za cijelu ' +
        'uslugu okine. Samo se ne vraća: ovdje uzbuna stoji za operatera ili cjevovod koji ga sljedeće minute počne vraćati. U Kubernetesu (<code>maxSurge 1</code>, <code>maxUnavailable 0</code>) ' +
        'uvođenje s v2 koji nikad ne postane spreman stoji, javlja da nema napretka nakon ' +
        '<code>progressDeadlineSeconds</code> (600 s) i čeka da ga netko vrati (<code>rollout undo</code>). ' +
        'Kanarinac vraća 10 % prometa u jednoj minuti.</p>' +
        '<p><b>Što provjera vidi.</b> Uzbuna za cijelu uslugu gleda sve zahtjeve, pa se mala greška na malom udjelu u ' +
        'njima razvodni. Provjera kanarinca gleda samo njegove zahtjeve i zato vidi 3 % već na 10 % prometa. ' +
        '<i>Health check</i> (provjera ispravnosti) hvata v2 koji se ruši, ali ne i v2 koji odgovara pogrešno.</p>' +
        '<p><b>Zablude.</b> „Plavo-zeleno je najsigurnije”: povratak jest najbrži, ali prebacivanje pogodi sve korisnike ' +
        'odjednom. „Prošao je provjeru ispravnosti, dakle izdanje je dobro”: primjeri 2–4. „Postupno uvođenje samo se ' +
        'vraća”: ne vraća se; bez uzbune i nekoga tko na nju reagira, stoji.</p>' +
        '<p><b>Izvan opsega:</b> promjene sheme baze i unatražna kompatibilnost, vezanje sesija, zastavice značajki, ' +
        'A/B testiranje, prstenovi ažuriranja u Windowsima (zasebna stranica). Model: 2000 zahtjeva u minuti, ' +
        'instanca je spremna unutar minute, neuspjeli zahtjevi zaokružuju se na cijeli zahtjev.</p>'
    },
    en: {
      stage: 'Three deployment strategies side by side, minute by minute',
      rolling: 'rolling update',
      rollingHr: 'rolling update',
      rollingSub: 'one instance a minute',
      blueGreen: 'blue-green',
      blueGreenHr: 'blue-green',
      blueGreenSub: 'a whole new set, then a switch',
      canary: 'canary',
      canaryHr: 'canary',
      canarySub: '10, 10, 25, 50, 100 % of traffic',
      lb: 'load balancer',
      lbReq: '2,000 requests a minute',
      groupRolling: 'four instances',
      groupSurge: 'surge',
      groupBlue: 'blue (v1)',
      groupGreen: 'green (v2)',
      groupBase: 'baseline (v1)',
      groupCanary: 'canary (v2)',
      live: 'live',
      instV1: 'instance {id}: v1, takes {req} requests',
      instV2: 'instance {id}: v2, takes {req} requests',
      instNotReady: 'instance {id}: v2, not ready, takes no traffic',
      split: 'v2 gets',
      splitLabel: 'traffic split: v2 gets {p}',
      thisMinute: 'this minute',
      total: 'total',
      checkAll: 'alert: {rate} of all requests',
      checkOwn: 'check: {rate} of the canary’s',
      checkNone: 'no check this minute',
      phase_idle: 'v1 serving',
      phase_deploying: 'deploying',
      phase_rollingBack: 'rolling back',
      phase_rolledBack: 'back on v1',
      phase_done: 'done',
      phase_stalled: 'stalled',
      strip: 'failed requests per minute',
      stripTotal: 'total',
      stripRolling: 'rolling',
      stripBlueGreen: 'blue-green',
      stripCanary: 'canary',
      minute: 'minute',
      v2Error: 'v2 error rate',
      v2Ready: 'v2 passes its health check',
      v2ReadyHint: 'Off: v2 crashes and never becomes ready.',
      threshold: 'Check threshold',
      thresholdHint: 'The alert and the canary check trip over it.',
      pct: '{v} %',
      presetAll: 'Every request fails',
      presetAllHint: 'v2 fails every request.',
      presetSubtle: 'A 3\u00a0% bug',
      presetSubtleHint: 'v2 fails 3 % of requests; the threshold is 2 %.',
      presetBelow: 'A 1.5\u00a0% bug',
      presetBelowHint: 'v2 fails 1.5 %; the threshold is 2 %.',
      presetCrash: 'v2 crashes',
      presetCrashHint: 'v2 fails its health check.',
      presetGood: 'Good release',
      presetGoodHint: 'v2 makes no errors.',
      legV1: 'v1',
      legV2: 'v2',
      legNotReady: 'not ready',
      legPipe: 'width = traffic share',
      legFailed: 'failed requests',
      legBack: 'rolling back',
      legChanged: 'changed',
      capMin: 'Minute {n}: ',
      capStart: 'Minute 0: in all three lanes v1 serves 2,000 requests a minute. Each strategy now deploys v2, which fails {err} of requests.',
      capStartCrash: 'Minute 0: in all three lanes v1 serves 2,000 requests a minute. Each strategy now deploys v2, which crashes and never becomes ready.',
      capStartGood: 'Minute 0: in all three lanes v1 serves 2,000 requests a minute. Each strategy now deploys v2, which makes no errors.',
      rAdvance: 'the {lane} replaces one instance: v2 gets {share} with {nFailed}, {rate} of all, not over the {thr} alert.',
      rTrip: 'the {lane} reaches {share}: {failed} of 2,000 requests fail ({rate} > {thr}), the service-wide alert fires and rollback starts next minute. {nTotal} so far.',
      rBack: 'the {lane} rolls back one instance at a time: v2 still has {share}, {nFailed} this minute, {total} so far.',
      rRolledBack: 'the {lane} is back on v1, one instance at a time, just as it went out. {nTotal} in total.',
      rDone: 'the {lane} reaches 100 % with no alert and stops there: done. {nFailed} this minute.',
      rStalled: 'the {lane} starts one v2 beside the four v1, but it never becomes ready, so no v1 goes: v1 serves everything, 0 failed. At minute {deadline} it reports no progress; it will not roll back by itself.',
      bDone: '{lane} switches all traffic to green at once, with no alert: done. Blue keeps running for a quick way back. {nFailed} this minute.',
      bTrip: '{lane} switches all traffic to green at once: {failed} of 2,000 requests fail ({rate} > {thr}) and the alert fires. Every user was hit, but blue is still running.',
      bRolledBack: '{lane} switches back to blue in one minute, because blue never stopped. {nTotal} in total.',
      bRefused: '{lane} refuses the switch: green fails its {healthAcc}, blue keeps 100 % of traffic. 0 failed.',
      cTrip: 'the {lane} takes {share} of traffic and fails {rate} of its requests; comparing it with the baseline catches this at once and traffic goes back to v1. {nTotal} in total.',
      cRolledBack: 'the {lane} is pulled: v2 gets 0 %, all traffic is back on v1. {nTotal} in total.',
      cDone: 'the {lane} reaches 100 %: its own error rate ({rate}) never went over {thr}. {nFailed} this minute.',
      capWaiting: 'all three lanes stand still and v1 serves everything: 0 failed. A {health} catches a crash, not wrong answers.',
      capQuiet: 'nothing changes; every lane keeps its state.',
      capUnseen: ' All three lanes are at 100 % on a v2 that still fails: no check catches what it cannot see.',
      health: 'health check',
      healthHr: 'health check',
      healthAcc: 'health check',
      healthAccHr: 'health check',
      nFailed: ['{c} failed request', '{c} failed requests'],
      explain:
        '<p>The same v2 is deployed three ways at once; every lane gets 2,000 requests each minute. A ' +
        '<i>rolling update</i> replaces one instance a minute: a new one takes traffic only once it is ready, so v2 gets ' +
        '25, 50, 75 and 100 %. A <i>blue-green deployment</i> starts a whole new set beside the old one, checks it and ' +
        'switches all traffic at once. A <i>canary</i> sends a small share to v2 (10 %, then 25, 50 and 100 %) and ' +
        'compares its error rate with the baseline.</p>' +
        '<p><b>Getting back.</b> A blue-green <i>rollback</i> takes one minute, because the old set is still running. ' +
        'A rolling update goes back as slowly as it went out, one instance at a time, and only once the service-wide ' +
        'alert fires. It does not roll back by itself: here the alert stands for the operator or pipeline that starts ' +
        'undoing it the next minute. In Kubernetes (<code>maxSurge 1</code>, ' +
        '<code>maxUnavailable 0</code>) a rollout whose v2 never becomes ready stands still, reports no progress after ' +
        '<code>progressDeadlineSeconds</code> (600 s) and waits for someone to undo it (<code>rollout undo</code>). ' +
        'A canary takes its 10 % back in one minute.</p>' +
        '<p><b>What the check sees.</b> The service-wide alert looks at all requests, so a small error on a small ' +
        'share is diluted in them. The canary check looks at the canary’s own requests only, which is why it sees ' +
        '3 % at 10 % of traffic. A <i>health check</i> catches a v2 that crashes, not a v2 that answers wrongly.</p>' +
        '<p><b>Misconceptions.</b> “Blue-green is the safest”: its rollback is the fastest, but the switch hits every ' +
        'user at once. “It passed its health check, so the release is good”: presets 2–4. “A rolling update rolls ' +
        'back on its own”: it does not; without an alert and someone acting on it, it stands still.</p>' +
        '<p><b>Out of scope:</b> database schema changes and backward compatibility, session affinity, feature flags, ' +
        'A/B testing, Windows update rings (a page of their own). Model: 2,000 requests a minute, an instance is ' +
        'ready within the minute, failed requests are rounded to a whole request.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
