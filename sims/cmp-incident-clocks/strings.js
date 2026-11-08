/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cmp-incident-clocks, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 /
   other). The title and subtitle come from sim.json (title, concept). Croatian terms: NOTES.md "Term pairs". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Vremenska crta incidenta i rokovi za prijavu',

      // lanes
      laneIncident: 'Incident',
      laneGhost: 'Od napada?',
      laneGhostSub: 'zabluda',
      laneEw: 'Rano upozorenje',
      laneEwSub: 'NIS2 · 24 h',
      laneNotif: 'Obavijest o incidentu',
      laneNotifSub: 'NIS2 · 72 h',
      laneGdpr: 'Povreda osobnih podataka',
      laneGdprSub: 'GDPR · 72 h',
      laneWork: 'Tko prijavljuje',
      laneWorkOffice: 'radno vrijeme 8–16',
      laneWorkOncall: 'dežurstvo 0–24',

      // marks on the stage
      mAttack: 'napad{time}',
      mDetect: 'otkriveno{time}',
      mAware: 'saznanje{time}: rokovi kreću',
      mDue: 'rok {time}',
      mFiled: '✓ predano{time}',
      mLate: '✗ {h} h kasni, predano{time}',
      mOverdue: '✗ rok je prošao',
      mGhost: 'isteklo bi{time}',
      mOffNis: 'ne teče: incident nije značajan',
      mOffGdpr: 'ne teče: osobni podaci nisu pogođeni',
      mNow: 'sada',
      gapDays: ['{n} dan', '{n} dana', '{n} dana'],

      // the table
      thClock: 'Rok',
      thStart: 'Kreće',
      thDue: 'Ističe',
      thFiled: 'Predano',
      thResult: 'Ishod',
      rowEw: 'Rano upozorenje, 24 h',
      rowNotif: 'Obavijest o incidentu, 72 h',
      rowFinal: 'Završno izvješće, mjesec dana',
      rowGdpr: 'Povreda osobnih podataka, 72 h',
      rowEwSub: 'NIS2',
      rowNotifSub: 'NIS2',
      rowFinalSub: 'NIS2',
      rowGdprSub: 'GDPR',
      resOk: '✓ na vrijeme, {h} h rezerve',
      resLate: '✗ {h} h nakon roka',
      resLateGdpr: '✗ {h} h nakon roka, uz razloge kašnjenja',
      resOverdue: '✗ rok je prošao, nije predano',
      resRunning: 'teče…',
      resWait: '–',
      resOff: '– ne teče',
      resFinal: 'mjesec dana od predane obavijesti',
      resFinalWait: 'kreće kad se preda obavijest',
      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, sati rada na prijavama i radno vrijeme su izmišljeni; ' +
        'praznici i ljetno računanje vremena izostavljeni.',

      // dates and durations
      wd0: 'pon', wd1: 'uto', wd2: 'sri', wd3: 'čet', wd4: 'pet', wd5: 'sub', wd6: 'ned',
      dayL0: 'ponedjeljak', dayL1: 'utorak', dayL2: 'srijeda', dayL3: 'četvrtak', dayL4: 'petak', dayL5: 'subota',
      dayL6: 'nedjelja',
      mo1: '1.', mo2: '2.', mo3: '3.', mo4: '4.', mo5: '5.', mo6: '6.',
      mo7: '7.', mo8: '8.', mo9: '9.', mo10: '10.', mo11: '11.', mo12: '12.',
      dateFmt: '{wd} {d}. {mon}',
      timeFmt: '{date} {hh}:00',
      clockFmt: '{hh}:00',
      hoursN: ['{n} sat', '{n} sata', '{n} sati'],
      daysN: ['{n} dan', '{n} dana', '{n} dana'],
      durDH: '{d} i {h}',

      // params
      pDay: 'Napad počinje',
      pHour: 'Sat napada',
      pDetect: 'Otkriveno nakon',
      pTriage: 'Trijaža traje',
      pSignificant: 'Značajan incident (NIS2)',
      pPersonal: 'Pogođeni osobni podaci (GDPR)',
      pReporting: 'Prijave šalje',
      oOffice: 'radno vrijeme',
      oOncall: 'dežurstvo 0–24',

      // presets
      prTuesday: 'Utorak ujutro',
      prTuesdayHint: 'Napad noću, otkriven ujutro: svaka prijava stiže na vrijeme.',
      prFoundLate: 'Otkriveno u ponedjeljak',
      prFoundLateHint: 'Napad u srijedu, otkriven pet dana kasnije: rokovi ipak kreću od saznanja.',
      prFriday: 'Petak navečer',
      prFridayHint: 'Rokovi teku kroz vikend, a prijave se šalju u radno vrijeme.',
      prOnCall: 'Petak, uz dežurstvo',
      prOnCallHint: 'Isti incident; netko tko smije poslati prijavu dostupan je 0–24.',
      prSlowTriage: 'Spora trijaža',
      prSlowTriageHint: 'Otkriveno u petak prije podne, trijaža traje 8 sati. Vrati je na 2 sata i usporedi.',
      prDataOnly: 'Samo osobni podaci',
      prDataOnlyHint: 'Incident nije značajan, ali su pogođeni osobni podaci: teče jedan rok.',

      // legend
      legNis: 'rok NIS2',
      legGdpr: 'rok GDPR',
      legLate: 'kašnjenje',
      legWeekend: 'vikend',
      legWork: 'rad na prijavi',

      // names in the summary
      nameEw: 'rano upozorenje',
      nameNotif: 'obavijest o incidentu',
      nameGdpr: 'prijava povrede osobnih podataka',

      // captions
      cStart: 'Mala tvrtka, jedan tjedan; napad još nije počeo. Rokovi za prijavu ne kreću s napadom, nego sa ' +
        'saznanjem. Pritisni → i prati kada što počinje.',
      cAttack: 'Napad počinje: {attack}. U tvrtki to još nitko ne zna i nijedan rok ne teče.',
      cDetect: 'Uzbuna: incident je otkriven {detected}, {detectAfter} nakon početka napada.',
      cDetectAtOnce: 'Uzbuna: incident je otkriven {detected}, u istom satu u kojem je napad počeo. Rokovi ipak ne ' +
        'kreću ni s napadom ni s otkrivanjem, nego sa saznanjem.',
      cGhostGone: 'Da rok od 24 sata teče od napada, istekao bi {ghostDue}, {ghostAgo} prije nego što je itko išta ' +
        'vidio. Rok ne teče od napada.',
      cGhostJust: 'Da rok od 24 sata teče od napada, istekao bi upravo sada, u trenutku otkrivanja. Rok ne teče od ' +
        'napada.',
      cGhostLeft: 'Da rokovi teku od napada, rok od 24 sata istekao bi već {ghostDue}. Ali ne teku od napada, nego od ' +
        'saznanja.',
      cAware: 'Trijaža traje {triage} i završava {aware}: tvrtka sad s razumnom sigurnošću zna što se ' +
        'dogodilo. To je saznanje.',
      cAwareBoth: 'Incident je značajan i pogođeni su osobni podaci, pa kreću oba skupa rokova: NIS2 prema nadležnom ' +
        'CSIRT-u (24 h, 72 h) i GDPR prema nadzornom tijelu (72 h).',
      cAwareNis: 'Incident je značajan, a osobni podaci nisu pogođeni: kreću rokovi NIS2, 24 i 72 sata.',
      cAwareGdpr: 'Incident nije značajan, ali su pogođeni osobni podaci: kreće samo rok GDPR-a, 72 sata.',
      cAwareNone: 'Incident nije značajan i osobni podaci nisu pogođeni: nijedan rok za prijavu ne kreće. Incident se ' +
        'ipak bilježi interno.',
      cDay1Ok: '24 sata nakon saznanja, {ewDue}. Rano upozorenje predano je {ewFiled}, na vrijeme.',
      cDay1Missed: '24 sata nakon saznanja, {ewDue}: rok za rano upozorenje je istekao. Rok je tekao i izvan radnog ' +
        'vremena, a prijavu nitko ne počinje pisati prije {ewWork}.',
      cDay1Gdpr: '24 sata nakon saznanja. Incident nije značajan, pa ranog upozorenja nema. Prijava povrede ' +
        'nadzornom tijelu ima rok {gdprDue}.',
      cDay1None: '24 sata nakon saznanja. Nijedan rok ne teče.',
      cDay3Lead: '72 sata nakon saznanja, {due72}.',
      cDay3EwLate: 'Rano upozorenje predano je tek {ewFiled}, {ewLate} nakon svojeg roka.',
      cDay3NotifOk: 'Obavijest o incidentu predana je {notifFiled}, na vrijeme.',
      cDay3NotifMissed: 'Obavijest o incidentu još nije predana, a rok je istekao.',
      cDay3GdprOk: 'Prijava povrede osobnih podataka nadzornom tijelu predana je {gdprFiled}, na vrijeme.',
      cDay3GdprMissed: 'Prijava povrede osobnih podataka nadzornom tijelu još nije predana, a 72 sata su prošla.',
      cDay3None: '72 sata nakon saznanja. Nijedan rok ne teče.',
      cFinal: 'Završno izvješće: najkasnije mjesec dana nakon predane obavijesti o incidentu ({finalFrom}), dakle ' +
        'do {finalDue}.',
      cFinalShift: 'Mjesec se broji od stvarne predaje obavijesti, pa zakašnjela obavijest pomiče i ovaj rok.',
      cFinalNone: 'Završnog izvješća nema: incident nije značajan, pa rokovi NIS2 nisu ni krenuli.',
      cReportOk: 'Svi rokovi su ispunjeni: {met} od {total}.',
      cReportMissed: 'Ispunjeno {met} od {total}; propušteno: {missed}.',
      cReportOffice: 'Rokovi u satima teku kroz noći i vikende; bez nekoga tko smije poslati prijavu izvan radnog ' +
        'vremena prvi pada rok od 24 sata.',
      cReportGhost: 'Napad je počeo {detectAfter} prije otkrivanja, a rokovi su ipak krenuli tek sa saznanjem.',
      cReportNone: 'Nijedan rok nije krenuo; incident ostaje u internoj evidenciji.',

      explain:
        '<p><b>Tri trenutka, jedan sat.</b> Napad počinje, netko ga otkrije, kratka <b>trijaža</b> ' +
        '(<i>triage</i>) utvrdi što se dogodilo. Kad tvrtka s razumnom sigurnošću zna da se dogodio značajan ' +
        'incident ili povreda osobnih podataka, to je <b>saznanje</b> (<i>awareness</i>), i tek tada kreću rokovi. ' +
        'Koliko je napad trajao prije otkrivanja na rokove ne utječe (pokušaj „Otkriveno u ponedjeljak“).</p>' +
        '<p><b>NIS2</b> (Direktiva (EU) 2022/2555, čl. 23. st. 4.; u Hrvatskoj Zakon o kibernetičkoj sigurnosti, ' +
        'NN 14/2024, i uredba Vlade donesena na temelju njega): za ' +
        '<b>značajan incident</b> (<i>significant incident</i>) bez nepotrebne odgode, a najkasnije 24 sata od ' +
        'saznanja, <b>rano upozorenje</b> (<i>early warning</i>); najkasnije 72 sata od saznanja ' +
        '<b>obavijest o incidentu</b> (<i>incident notification</i>) s početnom procjenom; najkasnije mjesec dana ' +
        'nakon obavijesti <b>završno izvješće</b> (<i>final report</i>). Prijave idu nadležnom CSIRT-u ili nadležnom ' +
        'tijelu. Po tom zakonu nadležna tijela razvrstavaju subjekte u ključne i važne i o tome ih obavješćuju; ' +
        'subjekt to ne odlučuje sam.</p>' +
        '<p><b>GDPR</b> (Opća uredba o zaštiti podataka, čl. 33. st. 1.): voditelj obrade <b>povredu osobnih ' +
        'podataka</b> prijavljuje nadzornom tijelu, u Hrvatskoj Agenciji za zaštitu osobnih podataka (AZOP), bez ' +
        'nepotrebnog odgađanja i, ako je izvedivo, najkasnije 72 sata ' +
        'nakon saznanja; zakašnjela prijava navodi razloge kašnjenja. Prijava nije potrebna ako povreda vjerojatno ' +
        'neće prouzročiti rizik za ljude; tu odluku pokazuje <i>cmp-breach-triage</i>.</p>' +
        '<p><b>Što pokazuje pozornica.</b> Rokovi u satima teku kroz noći i vikende. Ako prijave šalje netko tko radi ' +
        'samo u radnom vremenu, saznanje u petak navečer znači da rano upozorenje čeka ponedjeljak, a rok je istekao ' +
        'u subotu. Isto se dogodi kad spora trijaža gurne saznanje izvan radnog vremena. Dežurstvo s ovlašću za ' +
        'prijavu zatvara tu rupu. Jedan incident može pokrenuti oba skupa rokova, prema dva različita tijela.</p>' +
        '<p><b>Pojednostavljeno.</b> Kraj trijaže uzima se kao saznanje; smjernice Europskog odbora za zaštitu ' +
        'podataka (9/2022) traže da kratka početna istraga počne odmah, pa se trijaža koja se otegne može smatrati ' +
        'nepotrebnom odgodom. Sati rada po prijavi su izmišljeni. Izostavljeni su međuizvješće na zahtjev, izvješće o ' +
        'napretku za incident koji još traje, obavještavanje ljudi o povredi (čl. 34.) i posebna pravila za ' +
        'financijski sektor: DORA (Uredba (EU) 2022/2554) ima vlastite rokove prijave IKT incidenata, a financijske subjekte ' +
        'nadziru Hrvatska narodna banka i HANFA. Nije pravni savjet.</p>',
    },
    en: {
      stage: 'Incident timeline and reporting clocks',

      laneIncident: 'Incident',
      laneGhost: 'From the attack?',
      laneGhostSub: 'misconception',
      laneEw: 'Early warning',
      laneEwSub: 'NIS2 · 24 h',
      laneNotif: 'Incident notification',
      laneNotifSub: 'NIS2 · 72 h',
      laneGdpr: 'Personal-data breach',
      laneGdprSub: 'GDPR · 72 h',
      laneWork: 'Who files',
      laneWorkOffice: 'office hours 8–16',
      laneWorkOncall: 'on call 24/7',

      mAttack: 'attack{time}',
      mDetect: 'detected{time}',
      mAware: 'aware{time}: clocks start',
      mDue: 'due {time}',
      mFiled: '✓ filed{time}',
      mLate: '✗ {h} h late, filed{time}',
      mOverdue: '✗ deadline passed',
      mGhost: 'would end{time}',
      mOffNis: 'not running: not a significant incident',
      mOffGdpr: 'not running: no personal data affected',
      mNow: 'now',
      gapDays: ['{n} day', '{n} days'],

      thClock: 'Clock',
      thStart: 'Starts',
      thDue: 'Due',
      thFiled: 'Filed',
      thResult: 'Result',
      rowEw: 'Early warning, 24 h',
      rowNotif: 'Incident notification, 72 h',
      rowFinal: 'Final report, one month',
      rowGdpr: 'Personal-data breach, 72 h',
      rowEwSub: 'NIS2',
      rowNotifSub: 'NIS2',
      rowFinalSub: 'NIS2',
      rowGdprSub: 'GDPR',
      resOk: '✓ in time, {h} h to spare',
      resLate: '✗ {h} h after the deadline',
      resLateGdpr: '✗ {h} h late, with reasons for the delay',
      resOverdue: '✗ deadline passed, not filed',
      resRunning: 'running…',
      resWait: '–',
      resOff: '– not running',
      resFinal: 'one month after the notification was filed',
      resFinalWait: 'starts when the notification is filed',
      foot: 'Simplified, not legal advice. The firm, the hours each report takes and the office hours are made up; ' +
        'public holidays and daylight saving are left out.',

      wd0: 'Mon', wd1: 'Tue', wd2: 'Wed', wd3: 'Thu', wd4: 'Fri', wd5: 'Sat', wd6: 'Sun',
      dayL0: 'Monday', dayL1: 'Tuesday', dayL2: 'Wednesday', dayL3: 'Thursday', dayL4: 'Friday', dayL5: 'Saturday',
      dayL6: 'Sunday',
      mo1: 'Jan', mo2: 'Feb', mo3: 'Mar', mo4: 'Apr', mo5: 'May', mo6: 'Jun',
      mo7: 'Jul', mo8: 'Aug', mo9: 'Sep', mo10: 'Oct', mo11: 'Nov', mo12: 'Dec',
      dateFmt: '{wd} {d} {mon}',
      timeFmt: '{date} {hh}:00',
      clockFmt: '{hh}:00',
      hoursN: ['{n} hour', '{n} hours'],
      daysN: ['{n} day', '{n} days'],
      durDH: '{d} and {h}',

      pDay: 'Attack starts',
      pHour: 'Hour of the attack',
      pDetect: 'Detected after',
      pTriage: 'Triage takes',
      pSignificant: 'Significant incident (NIS2)',
      pPersonal: 'Personal data affected (GDPR)',
      pReporting: 'Reports filed by',
      oOffice: 'office hours',
      oOncall: 'on call 24/7',

      prTuesday: 'Tuesday morning',
      prTuesdayHint: 'Attack at night, found in the morning: every report on time.',
      prFoundLate: 'Found on Monday',
      prFoundLateHint: 'Attack on Wednesday, found five days later: the clocks still start at awareness.',
      prFriday: 'Friday evening',
      prFridayHint: 'The clocks run through the weekend; reports go out in office hours.',
      prOnCall: 'Friday, with on-call',
      prOnCallHint: 'The same incident; someone who may file a report is reachable 24/7.',
      prSlowTriage: 'Slow triage',
      prSlowTriageHint: 'Found on Friday morning, triage takes 8 hours. Set it to 2 hours and compare.',
      prDataOnly: 'Personal data only',
      prDataOnlyHint: 'Not a significant incident, but personal data is affected: one clock runs.',

      legNis: 'NIS2 clock',
      legGdpr: 'GDPR clock',
      legLate: 'late',
      legWeekend: 'weekend',
      legWork: 'work on a report',

      nameEw: 'the early warning',
      nameNotif: 'the incident notification',
      nameGdpr: 'the personal-data breach notification',

      cStart: 'A small firm, one week; the attack has not begun. Reporting clocks do not start with the attack but at ' +
        'awareness. Press → and watch when each one starts.',
      cAttack: 'The attack begins: {attack}. Nobody at the firm knows yet, and no clock is running.',
      cDetect: 'An alert: the incident is detected {detected}, {detectAfter} after the attack began.',
      cDetectAtOnce: 'An alert: the incident is detected {detected}, in the same hour the attack began. Even so, the ' +
        'clocks start neither with the attack nor with detection, but at awareness.',
      cGhostGone: 'If the 24 hours ran from the attack, they would have ended {ghostDue}, {ghostAgo} before anyone saw ' +
        'a thing. The clock does not run from the attack.',
      cGhostJust: 'If the 24 hours ran from the attack, they would end right now, at the moment of detection. The ' +
        'clock does not run from the attack.',
      cGhostLeft: 'If the clocks ran from the attack, the 24 hours would end as early as {ghostDue}. They run from ' +
        'awareness instead.',
      cAware: 'The triage takes {triage} and ends {aware}: the firm now knows with reasonable certainty what happened. ' +
        'That is awareness.',
      cAwareBoth: 'The incident is significant and personal data is affected, so both sets of clocks start: NIS2 to ' +
        'the competent CSIRT (24 h, 72 h) and GDPR to the supervisory authority (72 h).',
      cAwareNis: 'The incident is significant and no personal data is affected: the NIS2 clocks start, 24 and 72 hours.',
      cAwareGdpr: 'The incident is not significant, but personal data is affected: only the GDPR clock starts, 72 hours.',
      cAwareNone: 'The incident is not significant and no personal data is affected: no reporting clock starts. It is ' +
        'still recorded internally.',
      cDay1Ok: '24 hours after awareness, {ewDue}. The early warning went out {ewFiled}, in time.',
      cDay1Missed: '24 hours after awareness, {ewDue}: the early warning deadline has passed. The clock ran on outside ' +
        'office hours, and nobody starts on the report before {ewWork}.',
      cDay1Gdpr: '24 hours after awareness. The incident is not significant, so no early warning is due. The breach ' +
        'notification to the supervisory authority is due {gdprDue}.',
      cDay1None: '24 hours after awareness. No clock is running.',
      cDay3Lead: '72 hours after awareness, {due72}.',
      cDay3EwLate: 'The early warning went out only {ewFiled}, {ewLate} after its deadline.',
      cDay3NotifOk: 'The incident notification went out {notifFiled}, in time.',
      cDay3NotifMissed: 'The incident notification has not gone out, and the deadline has passed.',
      cDay3GdprOk: 'The personal-data breach notification to the supervisory authority went out {gdprFiled}, in time.',
      cDay3GdprMissed: 'The personal-data breach notification to the supervisory authority has not gone out, and the ' +
        '72 hours are over.',
      cDay3None: '72 hours after awareness. No clock is running.',
      cFinal: 'Final report: no later than one month after the incident notification was filed ({finalFrom}), so by ' +
        '{finalDue}.',
      cFinalShift: 'The month counts from when the notification was actually filed, so a late notification moves this ' +
        'deadline too.',
      cFinalNone: 'No final report: the incident is not significant, so the NIS2 clocks never started.',
      cReportOk: 'Every deadline met: {met} of {total}.',
      cReportMissed: '{met} of {total} met; missed: {missed}.',
      cReportOffice: 'Hour clocks run through nights and weekends; without someone who may file outside office hours, ' +
        'the 24-hour one is the first to be missed.',
      cReportGhost: 'The attack began {detectAfter} before detection, yet the clocks started only at awareness.',
      cReportNone: 'No clock started; the incident stays in the internal record.',

      explain:
        '<p><b>Three moments, one clock.</b> The attack begins, someone detects it, a short <b>triage</b> establishes ' +
        'what happened. When the firm knows with reasonable certainty that a significant incident or a personal-data ' +
        'breach has occurred, that is <b>awareness</b>, and only then do the clocks start. How long the attack ran ' +
        'before detection does not change them (try “Found on Monday”).</p>' +
        '<p><b>NIS2</b> (Directive (EU) 2022/2555, art. 23(4); in Croatia the Zakon o kibernetičkoj sigurnosti, ' +
        'NN 14/2024, and a government regulation under it): for a ' +
        '<b>significant incident</b>, without undue delay and in any event within 24 hours of becoming aware, an ' +
        '<b>early warning</b>; within 72 hours of becoming aware, an <b>incident notification</b> with an initial ' +
        'assessment; no later than one month after the notification, a <b>final report</b>. Reports go to the ' +
        'competent CSIRT or competent authority. Under that law the competent authorities categorise entities as ' +
        'essential or important (ključni i važni subjekti) and notify them; an entity does not decide this itself.</p>' +
        '<p><b>GDPR</b> (Regulation (EU) 2016/679, art. 33(1)): the controller notifies a <b>personal-data breach</b> ' +
        'to the supervisory authority, in Croatia the Agencija za zaštitu osobnih podataka (AZOP), without undue delay and, where feasible, not later than 72 hours after becoming ' +
        'aware of it; a late notification gives the reasons for the delay. No notification is needed when the breach ' +
        'is unlikely to result in a risk to people; that decision is <i>cmp-breach-triage</i>.</p>' +
        '<p><b>What the stage shows.</b> Hour clocks run through nights and weekends. If the person who files reports ' +
        'works office hours only, awareness on a Friday evening means the early warning waits for Monday, while its ' +
        'deadline passed on Saturday. The same happens when a slow triage pushes awareness out of office hours. An ' +
        'on-call rota with the authority to file closes that gap. One incident can start both sets of clocks, towards ' +
        'two different bodies.</p>' +
        '<p><b>Simplified.</b> The end of the triage is taken as awareness; the European Data Protection Board’s ' +
        'guidelines (9/2022) expect the short initial investigation to begin at once, so a triage that drags on can ' +
        'itself count as undue delay. The hours each report takes are made up. Left out: the intermediate report on ' +
        'request, the progress report for an incident still ongoing, telling people about a breach (art. 34) and the ' +
        'financial sector’s own rules: DORA (Regulation (EU) 2022/2554) has its own ICT incident reporting timings, ' +
        'and in Croatia financial entities are supervised by the Hrvatska narodna banka and HANFA. Not legal advice.</p>',
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
