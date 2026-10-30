/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-alert-states, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The glossary has none of this sim's terms (NOTES.md, Term pairs): the state names are written out, and on the
   Croatian page the English name is in italics with the Croatian in parentheses (the page's term() helper).
   Values from the rule (expr, for:, keep_firing_for:, activeAt, numbers) are data: the page puts them in
   translate="no" elements. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Metrika, uzorci i stanje uzbune kroz vrijeme',
      laneMetric: 'Metrika',
      laneMetricSub: 'stvarna vrijednost, CPU %',
      laneSeen: 'Pravilo vidi',
      laneSeenSub: 'zadnji uzorak; ✓ uvjet istinit',
      laneState: 'Uzbuna',
      laneStateSub: 'stanje po vrednovanju',
      minute: 'minuta',
      cardRule: 'Pravilo uzbunjivanja',
      cardAlert: 'Stanje uzbune',
      cardNotes: 'Obavijesti koje bi otišle',
      inactive: 'inactive',
      pending: 'pending',
      firing: 'firing',
      inactiveHr: 'neaktivna',
      pendingHr: 'na čekanju',
      firingHr: 'aktivna',
      aIdle: 'Uvjet nije ispunjen.',
      aPending: 'Uvjet traje {k} od {for} min; aktivira se u minuti {at} ako potraje.',
      aFiring: 'Aktivna od minute {at}.',
      aKept: 'Uvjet je lažan od minute {since}; razrješava se u minuti {at}.',
      lastSample: 'Zadnji uzorak: {v} iz minute {t}.',
      noSample: 'Još nema uzorka.',
      nFired: ['aktivacija', 'aktivacije', 'aktivacija'],
      nResolved: ['razrješenje', 'razrješenja', 'razrješenja'],
      nNote: 'Jedna obavijest kad uzbuna postane aktivna i jedna kad se razriješi.',
      series: 'Metrika',
      serSustained: 'trajna',
      serFlapping: 'treperava',
      serShort: 'skok 2 min',
      serOne: 'skok 1 min',
      threshold: 'Prag u izrazu',
      forMin: 'Trajanje for',
      keepFiringFor: 'keep_firing_for',
      scrape: 'Interval prikupljanja',
      min: '{v} min',
      presetSustained: 'Trajno opterećenje',
      presetSustainedHint: 'Minuta 3: na čekanju; minuta 8: aktivna.',
      presetFlapLong: 'Treperenje, for: 5m',
      presetFlapLongHint: 'Uvjet nikad ne potraje pet minuta.',
      presetFlap0: 'Treperenje, for: 0',
      presetFlap0Hint: 'Svaki skok je nova uzbuna.',
      presetKeep: 'Treperenje, keep_firing_for',
      presetKeepHint: 'for: 1m i keep_firing_for: 3m.',
      presetShort: 'Kratki skok',
      presetShortHint: 'Dvije minute iznad praga.',
      presetMissed: 'Neviđeni skok',
      presetMissedHint: 'Prikupljanje svake 2 min; probaj 1 min.',
      legScraped: 'uzorak',
      legMissed: 'nije prikupljeno',
      legChanged: 'promjena u koraku',
      capStart: 'Minuta 0: još nema nijednog uzorka. Pravilo je {expr} uz {for}. Pritisni → za sljedeću minutu.',
      capMin: 'Minuta {t}: ',
      capScraped: 'Prikupljen uzorak: {v}.',
      capHeld: 'Nema prikupljanja: pravilo i dalje vidi {v} iz minute {s}.',
      capMissed: 'Stvarnu vrijednost {v} ne vidi.',
      evPending: 'uvjet je istinit, pa uzbuna prelazi u {pending}, uz {active}. Ako uvjet potraje bez prekida, aktivira se u minuti {at}.',
      evHeld: 'uvjet je i dalje istinit, {k} od {for} min.',
      evFired: 'uvjet je istinit {n} bez prekida (od minute {since}), pa uzbuna prelazi iz {pending} u {firing}.',
      evFired0: 'uvjet je istinit, a {for0} ne čeka: uzbuna je odmah {firing}, bez stanja {pending}.',
      evFiring: 'uvjet je i dalje istinit, uzbuna ostaje {firing}.',
      evReset: 'uvjet je lažan {n}: uzbuna se iz {pending} vraća u {inactive}, a odbrojavanje za {forc} kreće od nule kad uvjet opet postane istinit.',
      evResolved: 'uvjet je lažan, pa uzbuna iz stanja {firing} prelazi u {inactive}: razriješena je i odlazi obavijest o razrješenju.',
      evKept: 'uvjet je lažan, ali {kff} drži uzbunu u stanju {firing}: razriješit će se u minuti {at} ako uvjet ostane lažan.',
      evIdle: 'uvjet je lažan, uzbuna ostaje {inactive}.',
      minutes: ['{n} minutu', '{n} minute', '{n} minuta'],
      afterTrue: ['nakon {n} istinitog vrednovanja', 'nakon {n} istinita vrednovanja', 'nakon {n} istinitih vrednovanja'],
      legMetric: 'metrika',
      legKept: 'keep_firing_for',
      explain: '<p>Poslužitelj za nadzor svakih <code>scrape_interval</code> prikupi uzorak metrike, a svakih ' +
        '<code>evaluation_interval</code> vrednuje pravila uzbunjivanja (zadano oboje 1 min). Pravilo pita svoj izraz ' +
        '(<code>expr</code>) nad zadnjim prikupljenim uzorkom: ono što se dogodi između dva prikupljanja ne vidi nikad.</p>' +
        '<p>Kad izraz postane istinit, uzbuna je <i>pending</i> (na čekanju) i dobiva <code>activeAt</code>. Tek kad je ' +
        'izraz istinit pri svakom vrednovanju kroz cijelo trajanje <code>for</code>, uzbuna postaje <i>firing</i> ' +
        '(aktivna). Jedno lažno vrednovanje vraća je u <i>inactive</i> (neaktivna) i odbrojavanje kreće od nule. Zato ' +
        'metrika koja stalno skače preko praga i natrag, <i>flapping</i> (treperenje), uz dugi <code>for</code> nikad ' +
        'ne aktivira uzbunu.</p>' +
        '<p>Kratki <code>for</code> nije besplatan: uz <code>for: 0</code> svaki skok je uzbuna i svaki pad ' +
        'razrješenje, buka koju ljudi brzo nauče ne čitati. <code>keep_firing_for</code> (Prometheus od inačice 2.42) ' +
        'drži aktivnu uzbunu još neko vrijeme nakon što uvjet postane lažan, pa treperenje daje jednu dugu uzbunu ' +
        'umjesto mnogo kratkih.</p>' +
        '<p>Što se s obavijestima događa dalje (grupiranje, čekanje, ponavljanje, utišavanje) nije dio ove stranice.</p>'
    },
    en: {
      stage: 'Metric, samples and alert state over time',
      laneMetric: 'Metric',
      laneMetricSub: 'the real value, CPU %',
      laneSeen: 'The rule sees',
      laneSeenSub: 'the last sample; ✓ condition true',
      laneState: 'Alert',
      laneStateSub: 'state per evaluation',
      minute: 'minute',
      cardRule: 'Alerting rule',
      cardAlert: 'Alert state',
      cardNotes: 'Notifications that would go out',
      inactive: 'inactive',
      pending: 'pending',
      firing: 'firing',
      inactiveHr: 'inactive',
      pendingHr: 'pending',
      firingHr: 'firing',
      aIdle: 'The condition is false.',
      aPending: 'Condition held {k} of {for} min; fires at minute {at} if it holds.',
      aFiring: 'Firing since minute {at}.',
      aKept: 'False since minute {since}; resolves at minute {at}.',
      lastSample: 'Last sample: {v} from minute {t}.',
      noSample: 'Nothing scraped yet.',
      nFired: ['fired', 'fired'],
      nResolved: ['resolved', 'resolved'],
      nNote: 'One notification when the alert starts firing and one when it resolves.',
      series: 'Metric',
      serSustained: 'sustained',
      serFlapping: 'flapping',
      serShort: 'spike 2 min',
      serOne: 'spike 1 min',
      threshold: 'Threshold in expr',
      forMin: 'for duration',
      keepFiringFor: 'keep_firing_for',
      scrape: 'Scrape interval',
      min: '{v} min',
      presetSustained: 'Sustained load',
      presetSustainedHint: 'Minute 3: pending; minute 8: firing.',
      presetFlapLong: 'Flapping, for: 5m',
      presetFlapLongHint: 'The condition never holds for five minutes.',
      presetFlap0: 'Flapping, for: 0',
      presetFlap0Hint: 'Every rise is a new alert.',
      presetKeep: 'Flapping, keep_firing_for',
      presetKeepHint: 'for: 1m and keep_firing_for: 3m.',
      presetShort: 'Short spike',
      presetShortHint: 'Two minutes over the threshold.',
      presetMissed: 'Spike between scrapes',
      presetMissedHint: 'Scrape every 2 min; try 1 min.',
      legScraped: 'sample',
      legMissed: 'not scraped',
      legChanged: 'changed in this step',
      capStart: 'Minute 0: nothing scraped yet. The rule is {expr} with {for}. Press → for the next minute.',
      capMin: 'Minute {t}: ',
      capScraped: 'Scraped sample: {v}.',
      capHeld: 'No scrape: the rule still sees {v} from minute {s}.',
      capMissed: 'It does not see the real value, {v}.',
      evPending: 'the condition is true, so the alert goes {pending}, with {active}. If it holds without a break, it fires at minute {at}.',
      evHeld: 'the condition is still true, {k} of {for} min.',
      evFired: 'the condition has held for {n} without a break (since minute {since}), so the alert goes from {pending} to {firing}.',
      evFired0: 'the condition is true and {for0} does not wait: the alert goes straight to {firing}, never {pending}.',
      evFiring: 'the condition is still true; the alert stays {firing}.',
      evReset: 'the condition is false {n}: the alert goes from {pending} back to {inactive}, and the {forc} timer starts from zero when the condition is true again.',
      evResolved: 'the condition is false, so the alert goes from {firing} to {inactive}: it is resolved and a resolved notification goes out.',
      evKept: 'the condition is false, but {kff} keeps the alert {firing}: it resolves at minute {at} if the condition stays false.',
      evIdle: 'the condition is false; the alert stays {inactive}.',
      minutes: ['{n} minute', '{n} minutes'],
      afterTrue: ['after {n} true evaluation', 'after {n} true evaluations'],
      legMetric: 'metric',
      legKept: 'keep_firing_for',
      explain: '<p>The monitoring server scrapes a sample of the metric every <code>scrape_interval</code> and evaluates ' +
        'its alerting rules every <code>evaluation_interval</code> (both 1 min by default). A rule asks its expression ' +
        '(<code>expr</code>) about the latest scraped sample: what happens between two scrapes it never sees.</p>' +
        '<p>When the expression becomes true, the alert is <i>pending</i> and gets an <code>activeAt</code>. Only when ' +
        'the expression has been true at every evaluation for the whole <code>for</code> duration does the alert go ' +
        '<i>firing</i>. One false evaluation sends it back to <i>inactive</i> and the count starts from zero: a metric ' +
        'that is <i>flapping</i> never fires a rule with a long <code>for</code>.</p>' +
        '<p>A short <code>for</code> is not free: with <code>for: 0</code> every rise is an alert and every fall a ' +
        'resolution, noise people soon learn not to read. <code>keep_firing_for</code> (Prometheus 2.42 and later) keeps ' +
        'a firing alert up for a while after the condition turns false, so a flapping metric gives one long alert ' +
        'instead of many short ones.</p>' +
        '<p>What happens to the notifications next (grouping, waiting, repeats, silences) is not part of this page.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
