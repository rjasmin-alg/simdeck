/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of set-stop-for-safety, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   Roles use the English loanwords crews say (owner, 2026-11-08), as in set-chain-of-command; the forms marked (check) in
   NOTES.md wait for the colleague who trains film crews. Sentences avoid declining a role name: "{from} → {to}",
   "{who}: …". The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Ekipa na setu, opasnost i poruka koja putuje do zaustavljanja rada',

      // people (crew.js ids)
      r_prod: 'Produkcija',
      r_dir: 'Redatelj',
      r_ad1: '1st AD',
      r_trainee: 'Pripravnik',
      r_actor: 'Day player',
      r_dop: 'DoP',
      r_snd: 'Snimatelj zvuka',
      r_pmast: 'Rekviziter',
      r_op: 'Operater kamere',
      r_gaf: 'Gaffer',
      r_kg: 'Key grip',
      r_boom: 'Boom operator',
      r_prop: 'Pomoćni rekviziter',
      r_el: 'Električar',
      r_gr: 'Grip',

      // hazards
      h_stand: 'Stativ bez vreće',
      h_exit: 'Kabel u izlazu',
      h_smoke: 'Dim kod zavjese',
      h_smell: 'Miris paljevine',
      hl_stand: 'stativ bez vreće s pijeskom iznad prolaza',
      hl_exit: 'kabel preko požarnog izlaza',
      hl_smoke: 'dim iz reflektora blizu zavjese',
      hl_smell: 'miris paljevine kod novog reflektora',
      acc_stand: 'stativ pada na prolaz.',
      acc_exit: 'netko se spotiče o kabel u izlazu.',
      acc_smoke: 'zavjesa se zapalila.',

      // who notices, what they do
      n_trainee: 'Pripravnik',
      n_dayplayer: 'Day player',
      n_own: 'Ekipa odjela',
      a_silent: 'Šuti',
      a_colleague: 'Kaže kolegi',
      a_break: 'Šefu na pauzi',
      a_stop: '„Stop!” odmah',

      // tags on the chart
      tagSaw: 'vidi opasnost',
      tagHalt: '■ STOP',
      tagCheck: 'provjerava…',
      tagRun: '▶ radi',
      tagLost: '✕ nije moj odjel',
      tagBlame: '! ukor',
      tagFixing: 'popravlja',
      tagFixed: '✓ popravljeno',
      tagClear: '✓ ništa opasno',
      tagAccident: '⚠ nesreća',

      // minute line
      lineTitle: 'Minute',
      fuseAt: '⚠ {m}. min',
      breakAt: 'pauza',
      checkSpan: 'provjera',

      // scoreboard
      thAction: 'Što učini',
      thOn: 'Svatko smije',
      thOff: 'Samo odjel',
      o_accident: '⚠ nesreća {t}',
      o_restart: '▶ radi od {t} (stop {h})',
      o_halt: '■ stop {t}',
      o_fixed: '✓ popravljeno {t}',
      o_blame: '! ukor {t}',
      o_clear: '✓ ništa opasno {t}',
      o_lost: '✕ izgubljeno {t}',
      o_check: '? provjera do {u}',
      o_waitBreak: '… pauza {t}',
      o_waiting: '… na putu',
      o_quiet: '—',

      foot: 'Pojednostavljeno; minute su ilustrativne (jedan korak ≈ jedna minuta). Konačnu riječ imaju sigurnosni brifing produkcije i šef odjela.',

      // controls
      hazard: 'Opasnost',
      noticer: 'Tko je vidi',
      action: 'Što učini',
      anyone: 'Svatko smije stati',
      anyoneKey: 'Brifing: svatko smije / samo odjel',
      breakMin: 'Pauza u minuti',

      // presets
      presetStop: '„Stop!” odmah',
      presetStopHint: 'Pripravnik vidi stativ bez vreće i odmah viče „Stop!”',
      presetBreak: 'Reći ću na pauzi',
      presetBreakHint: 'Isti stativ, poruka čeka pauzu',
      presetColleague: 'Nije moj odjel',
      presetColleagueHint: 'Kabel u izlazu, rečeno kolegi, bez pravila iz brifinga',
      presetSmoke: 'Prvo provjeriti',
      presetSmokeHint: 'Dim kod zavjese: bez pravila 1st AD prvo provjerava',
      presetFalse: 'Lažna uzbuna',
      presetFalseHint: 'Stop koji nije trebao: nitko nije kriv',

      // legend
      legendLine: 'lanac',
      legendCall: '„Stop!”',
      legendBreak: 'na pauzi',
      legendLost: 'izgubljeno',
      legendFuse: 'nesreća',

      // captions
      capStart: '{who} vidi: {hazard}. {act} Pritisni →.',
      capStartFalse: '{who} osjeti: {hazard}. {act} Pritisni →.',
      act_silent: 'Ne kaže ništa.',
      act_colleague: 'Kaže kolegi do sebe.',
      act_break: 'Reći će svom šefu na pauzi, u {b}. minuti.',
      act_stop: 'Odmah viče „Stop!”',
      capMinute: 'Minuta {m}:',
      cap_call: '{from} → {to}: „Stop!”',
      cap_say: '{from} → {to}: kaže kolegi.',
      cap_break: 'Pauza: {from} → {to}.',
      cap_send: '{from} šalje svoju ekipu: {to}.',
      cap_halt: '1st AD zaustavlja rad.',
      cap_check: 'Bez pravila 1st AD prvo provjerava (zove: {head}, {n} min); rad za to vrijeme teče.',
      cap_lost: '{who}: „Nije moj odjel.” Poruka je izgubljena.',
      cap_fixed: '{who}: popravljeno.',
      cap_clear: '{who}: provjereno, ništa opasno.',
      cap_restart: '1st AD nastavlja rad; stajalo se {n} min.',
      cap_restartFalse: '1st AD nastavlja rad; stajalo se {n} min, a nitko nije kriv što je zaustavio.',
      cap_blame: 'lažna uzbuna: {who} dobiva ukor. Idući put možda prešuti.',
      q_quiet: 'nitko ništa ne zna; opasnost ostaje.',
      q_wait: 'poruka čeka pauzu u {b}. minuti; opasnost ne čeka.',
      q_lost: 'poruka je izgubljena; opasnost ostaje.',
      q_check: '1st AD još provjerava; rad teče.',
      q_halted: 'rad stoji; odjel kojemu opasnost pripada popravlja.',
      q_run: 'rad teče.',
      q_fixed: 'popravljeno bez zaustavljanja.',
      q_clear: 'provjereno, ništa opasno; rad teče.',
      q_lostFalse: 'poruka je izgubljena; ovaj put nije bilo ništa.',
      q_after: 'nesreća se dogodila.',
      q_none: 'ništa se ne događa.',
      endSafe: 'Na vrijeme: rad je stao prije nesreće.',
      endFixed: 'Na vrijeme, ali samo jer je popravak stigao prije nesreće.',
      endAccident: 'Prekasno: opasnost nije čekala. Pogledaj tablicu: koji bi put stigao na vrijeme?',
      endFalse: 'Lažna uzbuna: nekoliko minuta stajanja, nitko nije kriv.',
      endBlame: 'Bez pravila, tko zaustavi bez potrebe dobije ukor; idući put možda šuti.',
      endQuiet: 'Lažna uzbuna koju nitko nije spomenuo: ovaj put ništa.',
      endClear: 'Odjel je provjerio bez zaustavljanja: ništa opasno.',
      endLostFalse: 'Poruka se izgubila; ovaj put nije bilo ništa, idući put možda bude.',
      and: ' i ',

      explain: '<p><b>Tko zaustavlja rad.</b> 1st AD (prvi asistent režije) vodi plato i zaustavlja rad. Svaki šef odjela ' +
        'odgovara za posao svog odjela: key grip za stative, gaffer za reflektore i kabele. Sigurnosni brifing na početku ' +
        'dana kaže jedno pravilo naglas: tko vidi opasnost, kaže to odmah, naglas ili radiovezom, i rad stoji dok se ne ' +
        'popravi.</p>' +
        '<p><b>Zašto odmah.</b> Poruka koja ide lancem („reći ću šefu na pauzi”, „nije moj odjel”) gubi minute na svakom ' +
        'koraku, a ponekad se izgubi i sama poruka. Opasnost ne čeka: na crti minuta crvena oznaka je trenutak u kojem ' +
        'opasnost postaje nesreća. Stop koji stigne u toj minuti stigao je prekasno.</p>' +
        '<p><b>Bez pravila.</b> Ako zaustaviti smije samo odjel kojemu opasnost pripada, kolega iz drugog odjela poruku ' +
        'zadrži za sebe, a 1st AD prvo provjerava dojavu pripravnika ili glumca. Lažna uzbuna tada donosi ukor, pa idući ' +
        'put netko prešuti. S pravilom nitko nije kriv za stop koji se pokaže nepotrebnim: cijena je nekoliko minuta.</p>' +
        '<p><b>Poslije stopa.</b> Odjel kojemu opasnost pripada popravlja ju (stativ dobiva vreću ili se miče, kabel ide ' +
        'drugim putem, reflektor se gasi i odmiče), a 1st AD nastavlja rad.</p>' +
        '<p><b>Za sve na setu.</b> Zakon o zaštiti na radu vrijedi za svakoga na setu, bez obzira na ugovor: poslodavac ' +
        'procjenjuje rizike (procjena rizika) i osposobljava za rad na siguran način, a radnik smije prekinuti rad ili se ' +
        'udaljiti kad prijeti ozbiljna i neposredna opasnost, bez posljedica za sebe.</p>' +
        '<p><b>Česte zablude.</b> „Nije moj odjel”: vlasnik opasnost možda nije vidio. „Reći ću na pauzi”: pauza dođe ' +
        'poslije nesreće. „Rekao sam kolegi, dovoljno je”: kolega koji misli da nije njegovo poruku zadrži. „Nepotreban ' +
        'stop je greška”: to je cijena pravila, ne krivnja.</p>' +
        '<p><b>Pojednostavljeno.</b> Produkcija je izmišljena, a minute su ilustrativne. Konačnu riječ uvijek imaju ' +
        'sigurnosni brifing produkcije i šef odjela.</p>'
    },
    en: {
      stage: 'The crew on set, a hazard, and the message travelling to the halt',

      r_prod: 'Production',
      r_dir: 'Director',
      r_ad1: '1st AD',
      r_trainee: 'Trainee',
      r_actor: 'Day player',
      r_dop: 'DoP',
      r_snd: 'Sound mixer',
      r_pmast: 'Props master',
      r_op: 'Camera operator',
      r_gaf: 'Gaffer',
      r_kg: 'Key grip',
      r_boom: 'Boom operator',
      r_prop: 'Props assistant',
      r_el: 'Electrician',
      r_gr: 'Grip',

      h_stand: 'Stand, no sandbag',
      h_exit: 'Cable in the exit',
      h_smoke: 'Smoke by a curtain',
      h_smell: 'Burning smell',
      hl_stand: 'a stand without its sandbag over a walkway',
      hl_exit: 'a cable across the fire exit',
      hl_smoke: 'smoke from a lamp near a curtain',
      hl_smell: 'a burning smell at a new lamp',
      acc_stand: 'the stand falls onto the walkway.',
      acc_exit: 'someone trips on the cable in the exit.',
      acc_smoke: 'the curtain has caught fire.',

      n_trainee: 'Trainee',
      n_dayplayer: 'Day player',
      n_own: 'Own crew',
      a_silent: 'Says nothing',
      a_colleague: 'Tells a colleague',
      a_break: 'Boss at the break',
      a_stop: '“Stop!” now',

      tagSaw: 'saw it',
      tagHalt: '■ STOP',
      tagCheck: 'checking…',
      tagRun: '▶ working',
      tagLost: '✕ not my department',
      tagBlame: '! told off',
      tagFixing: 'fixing',
      tagFixed: '✓ fixed',
      tagClear: '✓ nothing wrong',
      tagAccident: '⚠ accident',

      lineTitle: 'Minutes',
      fuseAt: '⚠ min {m}',
      breakAt: 'break',
      checkSpan: 'check',

      thAction: 'What they do',
      thOn: 'Anyone may stop',
      thOff: 'Only the department',
      o_accident: '⚠ accident {t}',
      o_restart: '▶ working from {t} (stop {h})',
      o_halt: '■ stop {t}',
      o_fixed: '✓ fixed {t}',
      o_blame: '! told off {t}',
      o_clear: '✓ nothing wrong {t}',
      o_lost: '✕ lost {t}',
      o_check: '? check until {u}',
      o_waitBreak: '… break {t}',
      o_waiting: '… on its way',
      o_quiet: '—',

      foot: 'Simplified; the minutes are illustrative (one step ≈ one minute). The production\'s safety briefing and the head of department have the final word.',

      hazard: 'Hazard',
      noticer: 'Who sees it',
      action: 'What they do',
      anyone: 'Anyone may stop',
      anyoneKey: 'Briefing: anyone may stop / only the department',
      breakMin: 'Break at minute',

      presetStop: '“Stop!” now',
      presetStopHint: 'The trainee sees the stand without its bag and calls “Stop!” at once',
      presetBreak: 'I\'ll say it at the break',
      presetBreakHint: 'The same stand; the message waits for the break',
      presetColleague: 'Not my department',
      presetColleagueHint: 'Cable in the exit, told to a colleague, without the briefing\'s rule',
      presetSmoke: 'Check first',
      presetSmokeHint: 'Smoke by a curtain: without the rule the 1st AD checks first',
      presetFalse: 'False alarm',
      presetFalseHint: 'A stop that was not needed: nobody is blamed',

      legendLine: 'chain',
      legendCall: '“Stop!”',
      legendBreak: 'at the break',
      legendLost: 'lost',
      legendFuse: 'accident',

      capStart: '{who} sees it: {hazard}. {act} Press →.',
      capStartFalse: '{who} notices it: {hazard}. {act} Press →.',
      act_silent: 'They say nothing.',
      act_colleague: 'They tell the colleague beside them.',
      act_break: 'They will tell their boss at the break, in minute {b}.',
      act_stop: 'They call “Stop!” at once.',
      capMinute: 'Minute {m}:',
      cap_call: '{from} → {to}: “Stop!”',
      cap_say: '{from} → {to}: tells a colleague.',
      cap_break: 'Break: {from} → {to}.',
      cap_send: '{from} sends their crew: {to}.',
      cap_halt: 'The 1st AD stops the work.',
      cap_check: 'Without the rule the 1st AD checks first (calls: {head}, {n} min); work goes on meanwhile.',
      cap_lost: '{who}: “Not my department.” The message is lost.',
      cap_fixed: '{who}: fixed.',
      cap_clear: '{who}: checked, nothing wrong.',
      cap_restart: 'the 1st AD restarts the work; it stood for {n} min.',
      cap_restartFalse: 'the 1st AD restarts the work; it stood for {n} min, and nobody is blamed for stopping it.',
      cap_blame: 'false alarm: {who} is told off. Next time they may keep quiet.',
      q_quiet: 'nobody knows; the hazard stays.',
      q_wait: 'the message waits for the break in minute {b}; the hazard does not wait.',
      q_lost: 'the message is lost; the hazard stays.',
      q_check: 'the 1st AD is still checking; work goes on.',
      q_halted: 'work stands; the department that owns the hazard is fixing it.',
      q_run: 'work goes on.',
      q_fixed: 'fixed without a stop.',
      q_clear: 'checked, nothing wrong; work goes on.',
      q_lostFalse: 'the message is lost; this time it was nothing.',
      q_after: 'the accident has happened.',
      q_none: 'nothing happens.',
      endSafe: 'In time: the work stopped before the accident.',
      endFixed: 'In time, but only because the fix came before the accident.',
      endAccident: 'Too late: the hazard did not wait. Look at the table: which way would have been in time?',
      endFalse: 'False alarm: a few minutes stood, nobody is blamed.',
      endBlame: 'Without the rule, whoever stops for nothing is told off; next time they may stay silent.',
      endQuiet: 'A false alarm nobody mentioned: nothing, this time.',
      endClear: 'The department checked it without a stop: nothing wrong.',
      endLostFalse: 'The message was lost; this time it was nothing, next time it may be something.',
      and: ' and ',

      explain: '<p><b>Who stops the work.</b> The 1st AD (first assistant director) runs the floor and calls the halt. ' +
        'Each head of department answers for their department\'s work: the key grip for the stands, the gaffer for the ' +
        'lamps and cables. The safety briefing at the start of the day says one rule out loud: whoever sees danger says so ' +
        'at once, out loud or on the radio, and work stops until it is fixed.</p>' +
        '<p><b>Why at once.</b> A message passed along the chain (“I\'ll tell my boss at the break”, “not my department”) ' +
        'loses minutes at every hop, and sometimes the message itself is lost. The hazard does not wait: on the minute ' +
        'line the red mark is the moment it becomes an accident. A stop that arrives in that minute is too late.</p>' +
        '<p><b>Without the rule.</b> If only the department that owns the hazard may stop it, a colleague from another ' +
        'department keeps the message to themselves, and the 1st AD checks a report from a trainee or an actor first. A ' +
        'false alarm then earns a telling-off, so next time someone stays quiet. With the rule nobody is blamed for a stop ' +
        'that turns out unnecessary: the price is a few minutes.</p>' +
        '<p><b>After the stop.</b> The department that owns the hazard fixes it (the stand gets its bag or is moved, the ' +
        'cable takes another route, the lamp is switched off and moved away), and the 1st AD restarts the work.</p>' +
        '<p><b>For everyone on set.</b> In Croatia the occupational safety law (Zakon o zaštiti na radu) applies to ' +
        'everyone on set, whatever their contract: the employer assesses the risks and trains people to work safely, and ' +
        'a worker may stop work or leave in serious and imminent danger without consequences for them.</p>' +
        '<p><b>Common mistakes.</b> “Not my department”: the owner may not have seen it. “I\'ll say it at the break”: the ' +
        'break comes after the accident. “I told a colleague, that\'s enough”: a colleague who thinks it is not theirs ' +
        'keeps it. “An unnecessary stop is a mistake”: it is the price of the rule, not a fault.</p>' +
        '<p><b>Simplified.</b> The production is made up and the minutes are illustrative. The production\'s safety ' +
        'briefing and the head of department always have the final word.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
