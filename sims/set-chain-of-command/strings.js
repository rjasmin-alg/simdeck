/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of set-chain-of-command, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   Roles use the English loanwords crews say (owner, 2026-11-08); the Croatian forms marked (check) in NOTES.md wait for
   the colleague who trains film crews. Sentences avoid declining a role name: "{from} → {to}", "{who}: …".
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Ekipa na setu i zahtjevi koji putuju kroz nju',

      // people (crew.js ids)
      r_prod: 'Produkcija',
      r_dir: 'Redatelj',
      r_ad1: '1st AD',
      r_trainee: 'Pripravnik',
      r_actor: 'Glumica',
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
      // what a head decides
      d_money: 'novac i raspored',
      d_shot: 'što je kadar',
      d_floor: 'red rada, komande, sat, stop',
      d_look: 'izgled: kamera i svjetlo',
      d_sound: 'zvuk',
      d_props: 'rekvizita',
      d_lamps: 'reflektori i struja',
      d_stands: 'stativi i rigging',
      twoOrders: '2 naloga',

      // requests
      q_lamp: 'Pomakni reflektor',
      q_overtime: 'Pola sata preko',
      q_actor: 'Glumici treba 5 minuta',
      q_exit: 'Stativ u izlazu',
      q_prop: 'Novi rekvizit, iduća scena',
      safetyMark: 'sigurnost',

      // table
      thReq: 'Zahtjev',
      thFrom: 'Tko traži → kome',
      thYes: 'Tko mora reći da',
      thState: 'Stanje',
      thTime: 'Odgovor',
      st_idle: 'još nije poslan',
      st_moving: 'drži ga: {who}',
      st_done: 'odgovoren',
      st_unapproved: 'bez odobrenja',
      st_lost: 'izgubljen: {who}',
      minutes: '{n} min',
      none: '—',
      noRequests: 'Nijedan zahtjev nije uključen: uključi barem jedan u postavkama.',

      // scoreboard
      thWay: 'Ishod',
      wayDirect: 'Izravno',
      wayChain: 'Kroz lanac',
      sc_done: 'odgovor s odobrenjem',
      sc_unapproved: 'napravljeno bez odobrenja',
      sc_lost: 'izgubljeno',
      sc_two: 'ljudi s dva naloga',
      sc_mean: 'prosječno do odgovora',
      sc_links: 'mogućih veza za {n} ljudi',
      meanMin: '{n} min',
      outOf: '{a} od {b}',

      foot: 'Pojednostavljeno; brojevi su ilustrativni (jedan korak ≈ jedna minuta). Konačnu riječ imaju sigurnosni brifing produkcije i šef odjela.',

      // controls
      mode: 'Kako zahtjevi idu',
      modeDirect: 'Najbližemu',
      modeChain: 'Kroz šefa i 1st AD-a',
      modeKey: 'Prebaci: najbližemu ↔ kroz lanac',
      crewSize: 'Ljudi na setu',
      crewHint: 'Mijenja samo brojač mogućih veza.',

      // presets
      presetDirect: 'Svima najbližemu',
      presetDirectHint: 'Pet zahtjeva, svaki onome tko stoji najbliže',
      presetChain: 'Svima kroz lanac',
      presetChainHint: 'Isti zahtjevi kroz šefa odjela i 1st AD-a',
      presetExit: 'Stativ u izlazu',
      presetExitHint: 'Sigurnost ide ravno 1st AD-u; pritisni M za izravni put',
      presetOvertime: 'Pola sata preko',
      presetOvertimeHint: 'O vremenu i novcu odlučuje produkcija',

      // legend
      legendLine: 'veza u lancu (jedna prema gore)',
      legendCall: 'sigurnosni poziv, odmah',
      legendLost: 'izgubljen zahtjev',
      legendTwo: 'bez odobrenja, dva naloga',

      // captions
      capStartDirect: ['{n} zahtjev čeka na početku. Ide onome tko stoji najbliže, bez obzira na odjel. Pritisni →.',
        '{n} zahtjeva čekaju na početku (tko ima dva, šalje jedan po minuti). Svaki ide onome tko stoji najbliže, bez obzira na odjel. Pritisni →.',
        '{n} zahtjeva čeka na početku (tko ima dva, šalje jedan po minuti). Svaki ide onome tko stoji najbliže, bez obzira na odjel. Pritisni →.'],
      capStartChain: ['{n} zahtjev čeka na početku. Ide svojom vezom prema gore, pa preko 1st AD-a do onoga tko odlučuje. Pritisni →.',
        '{n} zahtjeva čekaju na početku (tko ima dva, šalje jedan po minuti). Svaki ide svojom vezom prema gore, pa preko 1st AD-a do onoga tko odlučuje. Pritisni →.',
        '{n} zahtjeva čeka na početku (tko ima dva, šalje jedan po minuti). Svaki ide svojom vezom prema gore, pa preko 1st AD-a do onoga tko odlučuje. Pritisni →.'],
      capNone: 'Nijedan zahtjev nije uključen.',
      capMinute: 'Minuta {m}:',
      capLost: ['zahtjev {list} je izgubljen: tko ga je čuo, o njemu ne odlučuje i ne radi ga.',
        'zahtjevi {list} su izgubljeni: tko ih je čuo, o njima ne odlučuje i ne radi ih.',
        'zahtjevi {list} su izgubljeni: tko ih je čuo, o njima ne odlučuje i ne radi ih.'],
      capUnapproved: '{who} odmah radi zahtjev {num}, a nitko tko odlučuje nije rekao da.',
      capCounter: '{head} zove svog čovjeka natrag na posao: {who} sad ima dva naloga.',
      capCall: 'zahtjev {num} je sigurnost: {from} → {to} odmah, ispred svega.',
      capWait: '{who}: zahtjev {num} čeka jednu minutu, prvo ide {behind}.',
      capDone: ['zahtjev {list} ima odgovor.', 'zahtjevi {list} imaju odgovor.', 'zahtjevi {list} imaju odgovor.'],
      capYes: '{who} kaže da na zahtjev {num}.',
      capHop: 'zahtjev {num}: {from} → {to}.',
      capQuietDirect: 'ništa se više ne događa: izgubljeni zahtjevi se ne vraćaju.',
      capQuietNone: 'ništa se više ne događa.',
      capQuietChain: 'svi zahtjevi imaju odgovor.',
      capEndDirect: 'Brzo, ali nitko tko odlučuje nije rekao da. Pritisni M za isti dan kroz lanac.',
      capEndChain: 'Sporije, ali svaki zahtjev ima odgovor onoga tko odlučuje i nitko nema dva naloga. Pritisni M za izravni put.',
      and: ' i ',

      explain: '<p><b>Tko o čemu odlučuje.</b> Redatelj odlučuje što je kadar. Produkcija (producent i production manager, ' +
        'kod nas često direktor filma) odlučuje o novcu i rasporedu. 1st AD (prvi asistent režije) vodi plato: red rada, ' +
        'komande, sat i zaustavljanje rada. Svaki šef odjela odlučuje kako njegov odjel radi svoj dio i govori u ime odjela: ' +
        'DoP za izgled kadra (s njim gaffer za reflektore i struju i key grip za stative i rigging), snimatelj zvuka za zvuk, ' +
        'rekviziter za rekvizitu.</p>' +
        '<p><b>Kroz lanac.</b> Zahtjev ide svom šefu odjela, pa preko 1st AD-a onome tko o njemu odlučuje, pa šefu odjela ' +
        'koji ga radi, a on ga daje svom čovjeku. Svatko ima jednog šefa i jednu vezu prema gore. Veze na slici su putovi ' +
        'poruka na platou, ne činovi: produkcija i redatelj ne rade za 1st AD-a, nego preko njega govore platou. Kod 1st AD-a se poruke ' +
        'skupljaju, pa jedna ponekad pričeka minutu. Sigurnost ne čeka: tko vidi opasnost, kaže ju odmah i naglas 1st AD-u, ' +
        'koji zaustavlja rad i zove odjel kojemu oprema pripada.</p>' +
        '<p><b>Izravno najbližemu.</b> Brže je, ali onaj tko je čuo često ne odlučuje: zahtjev se izgubi, ili ga netko ' +
        'iz pravog odjela napravi bez odobrenja i njegov ga šef zove natrag, pa ista osoba ima dva naloga koji si ' +
        'proturječe. Kad svatko smije govoriti svakome, n ljudi ima n(n−1)/2 mogućih veza (40 ljudi: 780), a kroz šefove ' +
        'odjela n − 1 (40 ljudi: 39).</p>' +
        '<p><b>Česte zablude.</b> „Izravno je brže, dakle bolje”: brže stiže, ali bez odobrenja. „1st AD samo usporava”: ' +
        'čekanje je minuta, a zauzvrat nitko ne dobije dva naloga. „Sigurnost mora čekati lanac”: ne, ide ravno 1st AD-u ' +
        'i ispred svega.</p>' +
        '<p><b>Pojednostavljeno.</b> Produkcija je izmišljena, a minute su ilustrativne. Na pravom setu redatelj i DoP ' +
        'razgovaraju izravno cijeli dan, a mnogo poruka ide radiovezom. Konačnu riječ uvijek imaju sigurnosni brifing ' +
        'produkcije i šef odjela.</p>'
    },
    en: {
      stage: 'The crew on set and the requests travelling through it',

      r_prod: 'Production',
      r_dir: 'Director',
      r_ad1: '1st AD',
      r_trainee: 'Trainee',
      r_actor: 'Actor',
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
      d_money: 'money and schedule',
      d_shot: 'what the shot is',
      d_floor: 'order of work, calls, clock, halt',
      d_look: 'the look: camera and light',
      d_sound: 'sound',
      d_props: 'props',
      d_lamps: 'lamps and power',
      d_stands: 'stands and rigging',
      twoOrders: '2 orders',

      q_lamp: 'Move a lamp',
      q_overtime: '30 minutes over',
      q_actor: 'Actor needs 5 minutes',
      q_exit: 'Stand in the exit',
      q_prop: 'New prop, next scene',
      safetyMark: 'safety',

      thReq: 'Request',
      thFrom: 'Who asks → whom',
      thYes: 'Who must say yes',
      thState: 'State',
      thTime: 'Answer',
      st_idle: 'not sent yet',
      st_moving: 'held by: {who}',
      st_done: 'answered',
      st_unapproved: 'no yes',
      st_lost: 'lost: {who}',
      minutes: '{n} min',
      none: '—',
      noRequests: 'No request is switched on: switch at least one on in the settings.',

      thWay: 'Outcome',
      wayDirect: 'Direct',
      wayChain: 'Through the chain',
      sc_done: 'answered with a yes',
      sc_unapproved: 'done without a yes',
      sc_lost: 'lost',
      sc_two: 'people with two orders',
      sc_mean: 'mean time to an answer',
      sc_links: 'possible lines for {n} people',
      meanMin: '{n} min',
      outOf: '{a} of {b}',

      foot: 'Simplified; the numbers are illustrative (one step ≈ one minute). The production\'s safety briefing and the head of department have the final word.',

      mode: 'How requests travel',
      modeDirect: 'To the nearest',
      modeChain: 'Through the chain',
      modeKey: 'Switch: to the nearest ↔ through the chain',
      crewSize: 'People on set',
      crewHint: 'Changes only the count of possible lines.',

      presetDirect: 'All to the nearest',
      presetDirectHint: 'Five requests, each to whoever stands nearest',
      presetChain: 'All through the chain',
      presetChainHint: 'The same requests through the head of department and the 1st AD',
      presetExit: 'The stand in the exit',
      presetExitHint: 'Safety goes straight to the 1st AD; press M for the direct way',
      presetOvertime: 'Thirty minutes over',
      presetOvertimeHint: 'Production decides time and money',

      legendLine: 'line of the chain (one line up)',
      legendCall: 'safety call, at once',
      legendLost: 'lost request',
      legendTwo: 'no yes, two orders',

      capStartDirect: ['{n} request waits at the start. It goes to whoever stands nearest, whatever their department. Press →.',
        '{n} requests wait at the start (whoever has two sends one a minute). Each goes to whoever stands nearest, whatever their department. Press →.'],
      capStartChain: ['{n} request waits at the start. It goes up its line, then through the 1st AD to whoever decides. Press →.',
        '{n} requests wait at the start (whoever has two sends one a minute). Each goes up its line, then through the 1st AD to whoever decides. Press →.'],
      capNone: 'No request is switched on.',
      capMinute: 'Minute {m}:',
      capLost: ['request {list} is lost: whoever heard it neither decides it nor does it.',
        'requests {list} are lost: whoever heard them neither decides them nor does them.'],
      capUnapproved: '{who} does request {num} at once, and nobody who decides has said yes.',
      capCounter: '{head} calls their crew member back to work: {who} now has two orders.',
      capCall: 'request {num} is safety: {from} → {to} at once, ahead of everything.',
      capWait: '{who}: request {num} waits a minute, {behind} goes first.',
      capDone: ['request {list} has its answer.', 'requests {list} have their answers.'],
      capYes: '{who} says yes to request {num}.',
      capHop: 'request {num}: {from} → {to}.',
      capQuietDirect: 'nothing more happens: lost requests do not come back.',
      capQuietNone: 'nothing more happens.',
      capQuietChain: 'every request has its answer.',
      capEndDirect: 'Fast, but nobody who decides said yes. Press M for the same day through the chain.',
      capEndChain: 'Slower, but every request has an answer from whoever decides, and nobody has two orders. Press M for the direct way.',
      and: ' and ',

      explain: '<p><b>Who decides what.</b> The director decides what the shot is. Production (the producer and the ' +
        'production manager) decides money and schedule. The 1st AD runs the floor: the order of work, the calls, the ' +
        'clock and the halt. Each head of department decides how their department does its part and speaks for it: the ' +
        'DoP for the look of the shot (with the gaffer for lamps and power and the key grip for stands and rigging), the ' +
        'sound mixer for sound, the props master for props.</p>' +
        '<p><b>Through the chain.</b> A request goes to its own head of department, through the 1st AD to whoever ' +
        'decides it, then to the head of the department that does it, who gives it to their crew. Everyone has one boss ' +
        'and one line up. The lines in the chart are the routes of messages on the floor, not rank: production and the ' +
        'director do not work for the 1st AD, they speak to the floor through the 1st AD. Messages gather at the 1st AD, so one sometimes waits a minute. Safety does not wait: whoever ' +
        'sees a hazard says so at once, out loud, to the 1st AD, who halts the work and calls the department that owns ' +
        'the equipment.</p>' +
        '<p><b>Straight to the nearest.</b> It is faster, but whoever heard it often does not decide: the request is ' +
        'lost, or someone from the right department does it without a yes and their head calls them back, so one person ' +
        'holds two orders that contradict each other. When everyone may talk to everyone, n people have n(n−1)/2 ' +
        'possible lines (40 people: 780); through the heads of department, n − 1 (40 people: 39).</p>' +
        '<p><b>Common mistakes.</b> "Direct is faster, so it is better": it arrives sooner, but without a yes. "The 1st AD ' +
        'only slows things down": the wait is a minute, and in return nobody gets two orders. "Safety must wait for the ' +
        'chain": no, it goes straight to the 1st AD, ahead of everything.</p>' +
        '<p><b>Simplified.</b> The production is made up and the minutes are illustrative. On a real set the director ' +
        'and the DoP talk directly all day, and many messages go over the radio. The production\'s safety briefing and ' +
        'the head of department always have the final word.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
