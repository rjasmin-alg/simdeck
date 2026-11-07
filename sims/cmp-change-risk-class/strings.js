/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cmp-change-risk-class, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is
   plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tromjesečje promjena u tri režima: bez procesa, sve na odbor, razredi rizika',
      pct: '{n} %',
      week: '{n}. tj.',
      after: 'nakon tromjesečja',

      // the lanes
      r_none: 'Bez procesa',
      r_cab: 'Sve na odbor',
      r_classes: 'Razredi rizika',
      sub_none: 'svaka ide istog dana, ništa se ne bilježi',
      sub_cab: 'odbor za promjene: {f}',
      sub_classes: 'odbor samo za visok rizik: {f}',
      b_1: 'svaki dan',
      b_2: 'svaki drugi dan',
      b_5: 'jednom tjedno',
      b_10: 'svaka dva tjedna',
      m_lead: 'dana do produkcije',
      m_batch: 'promjena po isporuci',
      m_cfr: 'neuspjelih isporuka',
      m_unrec: 'bez zapisa',
      laneFoot: ['{n} isporuka · vraćeno promjena: {r}', '{n} isporuke · vraćeno promjena: {r}', '{n} isporuka · vraćeno promjena: {r}'],
      laneLabel: '{name}: {lead} dana do produkcije, {batch} promjena po isporuci, neuspjelih isporuka {f} od {d}, bez zapisa {u}',
      dayLabel: '{w}. tjedan, {d}. dan: {what}',
      depOk: ['isporuka s {n} promjenom', 'isporuka s {n} promjene', 'isporuka s {n} promjena'],
      depFail: ['neuspjela isporuka s {n} promjenom', 'neuspjela isporuka s {n} promjene', 'neuspjela isporuka s {n} promjena'],
      depUnrec: ' (bez zapisa)',

      // panel
      load: 'Promjena tjedno',
      board: 'Odbor se sastaje',
      standard: 'Standardne promjene',
      s_none: 'nijedna',
      s_routine: 'rutinske',
      s_medium: '+ srednji rizik',
      newQuarter: 'Novo tromjesečje',

      // presets
      pWeekly: 'Tjedni odbor',
      pWeeklyHint: 'Odbor jednom tjedno; rutinske promjene su standardne.',
      pFortnight: 'Svaka dva tjedna',
      pFortnightHint: 'Odbor se sastaje rjeđe: veći paketi, dulje čekanje.',
      pDaily: 'Odbor svaki dan',
      pDailyHint: 'Paketi se smanjuju, ali odbor zasjeda svaki radni dan.',
      pWideStandard: 'Preširoko standardno',
      pWideStandardHint: 'I promjene srednjeg rizika idu kao standardne, bez pregleda.',
      pBusy: 'Dvostruko promjena',
      pBusyHint: '16 promjena tjedno uz tjedni odbor.',

      // legend
      legDeploy: 'isporuka (blok = promjena)',
      legFailed: 'neuspjela, vraćena',
      legUnrec: 'bez zapisa',
      legMeeting: 'sjednica odbora',
      legAfter: 'nakon tromjesečja',

      // caption
      capMain: 'Sve na odbor ({f}): promjena prosječno čeka {cl} dana, a isporuka nosi {cb} promjena; neuspjelih isporuka {cf} od {cd} ({cp}). Uz razrede rizika čeka {kl} dana, svaka ide zasebno, neuspjelih {kp}.',
      nBypass: [
        '{u} hitna promjena nije mogla čekati odbor i ušla je bez zapisa; otkrivenih tek kao incident: {uf}.',
        '{u} hitne promjene nisu mogle čekati odbor i ušle su bez zapisa; otkrivenih tek kao incident: {uf}.',
        '{u} hitnih promjena nije moglo čekati odbor i ušlo je bez zapisa; otkrivenih tek kao incident: {uf}.'
      ],
      nWide: 'Promjene srednjeg rizika sada su standardne i preskaču pregled; u produkciji ih je palo {k}.',
      nNoStd: 'Ništa nije standardno: i rutinske promjene čekaju dan na pregled kolege.',
      nDaily: 'Odbor zasjeda svaki dan: {m} sjednica u tromjesečju.',

      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, promjene i stope su izmišljene.',

      explain:
        '<p><b>Upravljanje promjenama</b> (<i>change management</i>) određuje tko odobrava promjenu prije nego što ode u ' +
        'produkciju i kakav zapis ostaje iza nje. Tri trake vrte isto tromjesečje promjena male tvrtke, s istim ' +
        'skrivenim greškama, u tri režima:</p>' +
        '<ul>' +
        '<li><b>Bez procesa:</b> sve ide u produkciju istog dana, nitko ne pregledava i ništa se ne bilježi. Neuspjela ' +
        'promjena pojavi se kao incident iza kojeg ne stoji nijedan zapis, pa se uzrok najdulje traži.</li>' +
        '<li><b>Sve na odbor za promjene</b> (<i>change advisory board</i>): promjena čeka sljedeću sjednicu (dnevni red ' +
        'zatvara se dan ranije). Sve što je odobreno zajedno ide kao jedna isporuka; jedna loša promjena obori cijelu ' +
        'isporuku, sve se vraća i čeka sljedeću sjednicu. Hitni popravci ne mogu čekati sljedeću sjednicu: uđu bez zapisa.</li>' +
        '<li><b>Razredi rizika:</b> <b>standardna promjena</b> (<i>standard change</i>, unaprijed odobrena, ponovljiva, ' +
        'po poznatom postupku) ide istog dana i bilježi se; <b>normalna promjena</b> (<i>normal change</i>) treba ' +
        'pregled kolege (dan); samo promjene visokog rizika idu na odbor; <b>hitnu promjenu</b> (<i>emergency ' +
        'change</i>) odmah odobri jedna osoba, a pregleda se naknadno.</li>' +
        '</ul>' +
        '<p>Očitaj <b>vrijeme do produkcije</b> (<i>lead time</i>, od spremne promjene do rada u produkciji), ' +
        'promjene po isporuci (<i>batch size</i>), <b>udio neuspjelih isporuka</b> (<i>change failure rate</i>) i ' +
        'promjene bez zapisa. Preširoko „standardno” svakoj promjeni srednjeg rizika štedi dan, ali tada ide bez pregleda; ' +
        'dnevni odbor smanjuje pakete, ali traži sjednicu svaki dan.</p>' +
        '<p>Odakle: ISO/IEC 27001:2022, kontrola 8.32 (upravljanje promjenama); DORA, Uredba (EU) 2022/2554, čl. 9. ' +
        'st. 4. t. (e), traži od financijskih subjekata upravljanje promjenama zasnovano na procjeni rizika, u kojem ' +
        'se svaka promjena bilježi, testira, procjenjuje, odobrava i provjerava. Istraživanja isporuke softvera ' +
        'pokazala su da odobrenje vanjskog odbora nije smanjilo udio neuspjelih promjena, a produljilo je čekanje.</p>'
    },
    en: {
      stage: 'A quarter of changes under three regimes: no process, everything to the board, risk classes',
      pct: '{n}%',
      week: 'wk {n}',
      after: 'after the quarter',

      r_none: 'No process',
      r_cab: 'Everything to the board',
      r_classes: 'Risk classes',
      sub_none: 'each goes out the day it is ready, nothing recorded',
      sub_cab: 'change advisory board: {f}',
      sub_classes: 'board for high risk only: {f}',
      b_1: 'every day',
      b_2: 'every other day',
      b_5: 'once a week',
      b_10: 'every two weeks',
      m_lead: 'days to production',
      m_batch: 'changes per deployment',
      m_cfr: 'deployments failed',
      m_unrec: 'without a record',
      laneFoot: ['{n} deployment · changes rolled back: {r}', '{n} deployments · changes rolled back: {r}'],
      laneLabel: '{name}: {lead} days to production, {batch} changes per deployment, {f} of {d} deployments failed, {u} without a record',
      dayLabel: 'week {w}, day {d}: {what}',
      depOk: ['deployment of {n} change', 'deployment of {n} changes'],
      depFail: ['failed deployment of {n} change', 'failed deployment of {n} changes'],
      depUnrec: ' (no record)',

      load: 'Changes a week',
      board: 'The board meets',
      standard: 'Standard changes',
      s_none: 'none',
      s_routine: 'routine',
      s_medium: '+ medium risk',
      newQuarter: 'New quarter',

      pWeekly: 'Weekly board',
      pWeeklyHint: 'The board meets once a week; routine changes are standard.',
      pFortnight: 'Every two weeks',
      pFortnightHint: 'The board meets less often: bigger batches, longer waits.',
      pDaily: 'Board every day',
      pDailyHint: 'The batches shrink, but the board meets every working day.',
      pWideStandard: 'Standard too broad',
      pWideStandardHint: 'Medium-risk changes go out as standard too, unreviewed.',
      pBusy: 'Twice the changes',
      pBusyHint: '16 changes a week with a weekly board.',

      legDeploy: 'deployment (block = change)',
      legFailed: 'failed, rolled back',
      legUnrec: 'without a record',
      legMeeting: 'board meeting',
      legAfter: 'after the quarter',

      capMain: 'Everything to the board ({f}): a change waits {cl} days on average and a deployment carries {cb} changes; {cf} of {cd} deployments failed ({cp}). With risk classes it waits {kl} days, each goes out alone, {kp} failed.',
      nBypass: [
        '{u} urgent change could not wait for the board and went in without a record; found only as an incident: {uf}.',
        '{u} urgent changes could not wait for the board and went in without a record; found only as an incident: {uf}.'
      ],
      nWide: 'Medium-risk changes now count as standard and skip review; {k} of them failed in production.',
      nNoStd: 'Nothing is standard: routine changes wait a day for a peer review too.',
      nDaily: 'The board meets every day: {m} meetings a quarter.',

      foot: 'Simplified, not legal advice. The firm, the changes and the rates are made up.',

      explain:
        '<p><b>Change management</b> decides who approves a change before it goes live and what record it leaves. ' +
        'The three lanes run the same quarter of a small firm\'s changes, with the same hidden defects, under three ' +
        'regimes:</p>' +
        '<ul>' +
        '<li><b>No process:</b> everything goes live the day it is ready; nobody reviews and nothing is recorded. A ' +
        'failed change turns up as an incident with no record behind it, so its cause takes longest to find.</li>' +
        '<li><b>Everything to the change advisory board:</b> a change waits for the next meeting (the agenda closes the ' +
        'day before). Everything approved together goes out as one deployment; one bad change fails all of it, it is ' +
        'all rolled back and waits for the next meeting. Urgent fixes cannot wait for the next meeting: they go in ' +
        'without a record.</li>' +
        '<li><b>Risk classes:</b> a <b>standard change</b> (pre-approved, repeatable, done by a known procedure) goes ' +
        'out the same day and is recorded; a <b>normal change</b> needs a colleague\'s review (a day); only high-risk ' +
        'changes go to the board; an <b>emergency change</b> is approved at once by one person and reviewed ' +
        'afterwards.</li>' +
        '</ul>' +
        '<p>Read the <b>lead time</b> (from a change being ready to running in production), the changes per ' +
        'deployment (batch size), the <b>change failure rate</b> (the share of deployments that failed) and the ' +
        'changes without a record. A "standard" that is too broad saves each medium-risk change a day but sends it out ' +
        'unreviewed; a daily board shrinks the batches but needs a meeting every day.</p>' +
        '<p>Where it comes from: ISO/IEC 27001:2022, control 8.32 (change management); DORA, Regulation (EU) ' +
        '2022/2554, art. 9(4)(e), asks financial entities for change management based on a risk assessment, in which ' +
        'every change is recorded, tested, assessed, approved and verified. Studies of software delivery found that ' +
        'approval by an external board did not lower the change failure rate and lengthened lead time.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
