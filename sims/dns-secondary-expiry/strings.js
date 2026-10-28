/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of dns-secondary-expiry, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term.
   Server names, zone names, addresses and serial numbers are data: the page writes them with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Primarni i sekundarni poslužitelj zone, mjerači vremena sekundarnog i klijent koji ga pita',

      // time
      dayAt: 'dan {d}, {hm}',
      dateAt: '{wd} {d}. {m}. {hm}',
      weekdays: 'ned,pon,uto,sri,čet,pet,sub',
      months: '1,2,3,4,5,6,7,8,9,10,11,12',
      group: '{a}\u00a0{b}',
      sec: '{v} s',
      dD: '{v}\u00a0d',
      dH: '{v}\u00a0h',
      dMin: '{v}\u00a0min',
      span: '{from} – {to}',

      // cards
      roleP: 'primarni',
      roleS: 'sekundarni',
      pUp: '▲ radi',
      pDown: '✕ isključen',
      sOk: '✓ mjerodavan',
      sRetry: '↻ ponavlja pokušaje',
      sExpired: '✕ istekao: SERVFAIL',
      serialLbl: 'serijski broj',
      recsA: 'zapisi A',
      differs: '≠ P',
      lastXfer: 'zadnji prijenos zone',
      lastOk: 'zadnja uspješna provjera',
      clientLab: 'Klijent',
      clientEstate: 'Render farma (colo)',
      clientAsks: 'pita S',
      clientGets: 'dobiva',

      // the check between S and P
      kRefresh: 'osvježavanje',
      kRetry: 'ponovni pokušaj',
      oTransfer: '✓ prijenos zone',
      oCurrent: '✓ isti broj',
      oFail: '✕ nema odgovora',
      linkIdle: 'u ovom koraku S ne pita P',
      linkAsk: 'S pita P za serijski broj',

      // timers
      tmTitle: 'Mjerači vremena na S',
      tmRefresh: 'Osvježavanje',
      tmRetry: 'Ponovni pokušaj',
      tmExpire: 'Istek',
      tmNextRefresh: 'sljedeće {at}',
      tmNextRetry: 'sljedeći {at}',
      tmOffRefresh: 'stoji do uspješne provjere',
      tmOffRetry: 'ne treba: zadnja provjera je uspjela',
      tmExpireAt: '{at}, još {left}',
      tmExpiredAt: 'istekao {at}',

      // log
      logTitle: 'Dnevnik',
      lgStart: 'provjera uspjela',
      lgEdit: 'P uređen, serijski broj podignut',
      lgEditNo: 'P uređen, serijski broj isti',
      lgKill: 'P isključen',
      lgRevive: 'P ponovno radi',
      lgNoop: 'bez učinka',
      lgExpired: 'istek: SERVFAIL',

      // params
      pRefresh: 'REFRESH (osvježavanje)',
      pRetry: 'RETRY (ponovni pokušaj)',
      pExpire: 'EXPIRE (istek)',
      pBump: 'Podići serijski broj pri izmjeni',
      pScene: 'Zona',
      pEditAt: 'Izmjena u',
      pKillAt: 'Isključenje u',
      pReviveAt: 'Uključenje u',
      bEdit: 'Uredi zonu na P',
      bKill: 'Isključi P',
      bRevive: 'Uključi P',
      bHint: 'u sljedećem koraku',

      // presets
      prEdit: 'Izmjena zone',
      prEditHint: 'P mijenja zapis klijent i podiže serijski broj; S izmjenu preuzima pri osvježavanju',
      prNoBump: 'Zaboravljen broj',
      prNoBumpHint: 'Ista izmjena, serijski broj ostaje isti',
      prDies: 'Primarni se ugasi',
      prDiesHint: 'P se ugasi odmah nakon uspješne provjere; vrijeme teče',
      prEstate: 'qm.internal',
      prEstateHint: 'SOA iz datoteke zone imanja; loom se gasi u utorak 10. 11. navečer',
      prRevived: 'Vraćen na vrijeme',
      prRevivedHint: 'Kao „Primarni se ugasi”, ali P se vrati peti dan',

      // legend
      lgdRefresh: 'osvježavanje',
      lgdRetry: 'ponovni pokušaj',
      lgdExpire: 'rok isteka',
      lgdExpired: 'istekla kopija',
      lgdChanged: 'promijenjeno',

      // captions
      capStart: '{t}: {s} je upravo pitao {p} za serijski broj zone {zone}. Broj {serial} je isti na oba, pa {s} zadržava svoju kopiju i odgovara klijentima.',
      capXfer: 'Zadnji prijenos zone bio je {xfer}.',
      capTimers: 'Osvježavanje svakih {refresh}; ako {p} ne odgovori, ponovni pokušaj svakih {retry}; istek {expire} nakon zadnje uspješne provjere, dakle {at}.',
      capPress: 'Pritisni →.',
      capPressK: 'Pritisni → ili isključi P (K).',
      capEdit: '{t}: na {p} je zapis {name} promijenjen u {value}, a serijski broj podignut na {serial}.',
      capEditNoBump: '{t}: na {p} je zapis {name} promijenjen u {value}, ali serijski broj je ostao {serial}.',
      capNotYet: '{s} to još ne zna: klijent i dalje dobiva {old}.',
      capEditSkip: '{t}: {p} je isključen, pa se zona na njemu ne može urediti.',
      capKill: '{t}: {p} je isključen. {s} to ne vidi dok ga ne pita, a klijent i dalje dobiva odgovor iz kopije.',
      capRevive: '{t}: {p} ponovno radi. {s} će to vidjeti pri sljedećem pokušaju, {next}.',
      capReviveQuiet: '{t}: {p} ponovno radi. {s} nije ni primijetio da ga nije bilo: nijedna provjera nije pala u to vrijeme.',
      capNoop: '{t}: bez učinka.',
      capCheck: '{t}, {kind}:',
      capTransfer: '{p} ima serijski broj {sp}, veći od {ss} na {s}, pa {s} preuzima zonu (prijenos zone) i odsad daje {value}.',
      capReload: '{p} opet odgovara, pa {s} ponovno preuzima cijelu zonu (prijenos zone) i opet je mjerodavan.',
      capCurrent: 'broj {sp} na {p} jednak je onome na {s}, pa {s} zadržava svoju kopiju.',
      capCurrentDiff: 'broj {sp} na {p} jednak je onome na {s}, pa {s} zadržava svoju kopiju, iako {p} za ime {name} ima {pv}, a {s} {sv}. Uspoređuju se brojevi, a ne sadržaj.',
      capRestart: 'Provjera je uspjela, pa se rok isteka računa ispočetka: sad pada na {exp}.',
      capFailRefresh: '{p} ne odgovara. {s} prelazi na ponovne pokušaje svakih {retry} i dotle odgovara iz kopije; rok isteka ostaje {exp}.',
      capFailRetry: '{p} i dalje ne odgovara; sljedeći pokušaj za {retry}. Do isteka je ostalo {left}.',
      capFailExpired: '{p} ne odgovara; {s} i dalje vraća SERVFAIL.',
      capExpired: '{t}: od zadnjeg uspješnog osvježavanja prošlo je EXPIRE = {expire}. Sekundarni prestaje biti mjerodavan i na svaki upit vraća SERVFAIL.',
      capExpiredMore: 'Pokušaj u istoj sekundi također nije uspio; {s} nastavlja pokušavati svakih {retry}.',
      capRunRetry: '{span}: još {n}; {p} ni na jedan ne odgovara. Klijent cijelo vrijeme dobiva odgovor iz kopije i ne vidi nikakvu razliku. Do isteka je ostalo {left}.',
      capRunRetryExpired: '{span}: još {n}; {p} ni na jedan ne odgovara, a {s} i dalje vraća SERVFAIL.',
      capRunRefresh: '{span}: još {n}, svako s istim serijskim brojem {serial}. Svako je uspješno, pa se rok isteka stalno pomiče i nikad ne dođe; sad pada na {exp}.',
      capRunDiff: '{s} i dalje daje {sv}, a {p} {pv}: dva odgovora za isto ime, bez ijedne poruke o pogrešci.',
      capEndUp: 'Dalje se ništa ne mijenja bez nove radnje ({keys}).',
      capEndUpR: 'Dalje se ništa ne mijenja; R vraća na početak.',
      capEndDown: 'Dalje se ništa ne mijenja dok se {p} ne vrati (V); tada {s} ponovno preuzima zonu.',
      retries: ['{n} ponovni pokušaj', '{n} ponovna pokušaja', '{n} ponovnih pokušaja'],
      refreshes: ['{n} osvježavanje', '{n} osvježavanja', '{n} osvježavanja'],

      noteKillDown: 'P je već isključen.',
      noteReviveUp: 'P već radi.',
      noteEditDown: 'P je isključen: zona se na njemu ne može urediti.',
      noteOnce: 'U jednom prikazu svaka radnja ide samo jednom; R vraća na početak.',
      noteLimit: 'Prikaz je na granici od 20 koraka.',

      explain: '<p>Zona se uređuje na jednom poslužitelju; to je [[primary server]]. Sekundarni poslužitelj, ' +
        '[[=secondary server]], zonu dobiva od primarnog i odgovara iz svoje kopije; čin u kojem je dobiva zove se ' +
        '[[zone transfer]]. Oba su mjerodavna, svaki je [[authoritative server]]; razlika je samo u tome odakle im ' +
        'podaci.</p>' +
        '<p>Četiri broja iz zapisa SOA upravljaju sekundarnim. Svakih <code>REFRESH</code> sekundi on pita primarni za ' +
        'serijski broj (<code>SERIAL</code>). Ako je broj na primarnom veći, preuzima zonu; ako nije, zadržava svoju ' +
        'kopiju. <strong>Uspoređuju se brojevi, a ne sadržaj</strong>, pa izmjena bez podignutog broja nikad ne stigne. ' +
        'I provjera s istim brojem je uspješna.</p>' +
        '<p>Ako primarni ne odgovori, sekundarni pokušava ponovno svakih <code>RETRY</code> sekundi i dotle odgovara iz ' +
        'kopije, kao da se ništa nije dogodilo. Tek kad od zadnje uspješne provjere prođe <code>EXPIRE</code> sekundi, ' +
        'prestaje biti mjerodavan i na svaki upit vraća <code>SERVFAIL</code>. Sekundarni je zato [[cache]] s rokom ' +
        'trajanja, a ne pričuvna kopija koja preživi primarni: mrtvi primarni obori zonu, samo kasnije. Rok se računa od ' +
        'zadnje uspješne provjere, ne od zadnjeg prijenosa zone.</p>' +
        '<p>Model: jedan sekundarni, bez obavijesti NOTIFY, pa izmjene stižu samo pri osvježavanju. Vrijeme teče od ' +
        'početka prikaza; jedan korak skače na sljedeći zanimljiv trenutak, a niz jednakih provjera je jedan korak.</p>'
    },
    en: {
      stage: 'The primary and the secondary server of a zone, the secondary\'s timers and a client that asks it',

      dayAt: 'day {d}, {hm}',
      dateAt: '{wd} {d} {m} {hm}',
      weekdays: 'Sun,Mon,Tue,Wed,Thu,Fri,Sat',
      months: 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',
      group: '{a},{b}',
      sec: '{v} s',
      dD: '{v}\u00a0d',
      dH: '{v}\u00a0h',
      dMin: '{v}\u00a0min',
      span: '{from} – {to}',

      roleP: 'primary',
      roleS: 'secondary',
      pUp: '▲ running',
      pDown: '✕ switched off',
      sOk: '✓ authoritative',
      sRetry: '↻ retrying',
      sExpired: '✕ expired: SERVFAIL',
      serialLbl: 'serial',
      recsA: 'A records',
      differs: '≠ P',
      lastXfer: 'last zone transfer',
      lastOk: 'last successful check',
      clientLab: 'Client',
      clientEstate: 'Render farm (colo)',
      clientAsks: 'asks S',
      clientGets: 'gets',

      kRefresh: 'refresh',
      kRetry: 'retry',
      oTransfer: '✓ zone transfer',
      oCurrent: '✓ same serial',
      oFail: '✕ no answer',
      linkIdle: 'S does not ask P this step',
      linkAsk: 'S asks P for the serial',

      tmTitle: 'Timers on S',
      tmRefresh: 'Refresh',
      tmRetry: 'Retry',
      tmExpire: 'Expire',
      tmNextRefresh: 'next {at}',
      tmNextRetry: 'next {at}',
      tmOffRefresh: 'stopped until a check succeeds',
      tmOffRetry: 'not needed: the last check succeeded',
      tmExpireAt: '{at}, {left} left',
      tmExpiredAt: 'expired {at}',

      logTitle: 'Log',
      lgStart: 'check succeeded',
      lgEdit: 'P edited, serial raised',
      lgEditNo: 'P edited, serial unchanged',
      lgKill: 'P switched off',
      lgRevive: 'P back up',
      lgNoop: 'no effect',
      lgExpired: 'expired: SERVFAIL',

      pRefresh: 'REFRESH',
      pRetry: 'RETRY',
      pExpire: 'EXPIRE',
      pBump: 'Raise the serial on an edit',
      pScene: 'Zone',
      pEditAt: 'Edit at',
      pKillAt: 'Switched off at',
      pReviveAt: 'Switched on at',
      bEdit: 'Edit the zone on P',
      bKill: 'Switch P off',
      bRevive: 'Switch P on',
      bHint: 'at the next step',

      prEdit: 'Zone edit',
      prEditHint: 'P changes the klijent record and raises the serial; S picks it up at its refresh',
      prNoBump: 'Forgotten serial',
      prNoBumpHint: 'The same edit, the serial stays the same',
      prDies: 'The primary dies',
      prDiesHint: 'P dies right after a successful check; time runs',
      prEstate: 'qm.internal',
      prEstateHint: 'SOA from the estate\'s zone file; loom goes off on Tuesday 10 Nov in the evening',
      prRevived: 'Back in time',
      prRevivedHint: 'As "The primary dies", but P comes back on day 5',

      lgdRefresh: 'refresh',
      lgdRetry: 'retry',
      lgdExpire: 'expire deadline',
      lgdExpired: 'expired copy',
      lgdChanged: 'changed',

      capStart: '{t}: {s} has just asked {p} for the serial of the zone {zone}. {serial} is the same on both, so {s} keeps its copy and answers clients.',
      capXfer: 'The last zone transfer was {xfer}.',
      capTimers: 'Refresh every {refresh}; if {p} does not answer, retry every {retry}; expire {expire} after the last successful check, that is {at}.',
      capPress: 'Press →.',
      capPressK: 'Press →, or switch P off (K).',
      capEdit: '{t}: on {p}, the {name} record is changed to {value} and the serial raised to {serial}.',
      capEditNoBump: '{t}: on {p}, the {name} record is changed to {value}, but the serial stays {serial}.',
      capNotYet: '{s} does not know yet: the client still gets {old}.',
      capEditSkip: '{t}: {p} is switched off, so its zone cannot be edited.',
      capKill: '{t}: {p} is switched off. {s} does not see it until it asks, and the client still gets answers from the copy.',
      capRevive: '{t}: {p} is running again. {s} will see it at its next retry, {next}.',
      capReviveQuiet: '{t}: {p} is running again. {s} never noticed it was gone: no check fell in that time.',
      capNoop: '{t}: no effect.',
      capCheck: '{t}, {kind}:',
      capTransfer: '{p} has serial {sp}, greater than {ss} on {s}, so {s} takes the zone (zone transfer) and from now on gives {value}.',
      capReload: '{p} answers again, so {s} takes the whole zone again (zone transfer) and is authoritative again.',
      capCurrent: 'serial {sp} on {p} equals the one on {s}, so {s} keeps its copy.',
      capCurrentDiff: 'serial {sp} on {p} equals the one on {s}, so {s} keeps its copy, although {p} has {pv} for {name} and {s} has {sv}. The numbers are compared, not the contents.',
      capRestart: 'The check succeeded, so the expiry deadline starts over: it is now {exp}.',
      capFailRefresh: '{p} does not answer. {s} switches to retries every {retry} and meanwhile answers from its copy; the expiry deadline stays at {exp}.',
      capFailRetry: '{p} still does not answer; next retry in {retry}. Time left until the expiry: {left}.',
      capFailExpired: '{p} does not answer; {s} still answers SERVFAIL.',
      capExpired: '{t}: EXPIRE = {expire} have passed since the last successful refresh. The secondary stops being authoritative and answers SERVFAIL to every query.',
      capExpiredMore: 'The retry in the same second failed too; {s} keeps trying every {retry}.',
      capRunRetry: '{span}: another {n}; {p} answers none of them. All this time the client gets answers from the copy and sees no difference. Time left until the expiry: {left}.',
      capRunRetryExpired: '{span}: another {n}; {p} answers none of them, and {s} still answers SERVFAIL.',
      capRunRefresh: '{span}: another {n}, each with the same serial {serial}. Each succeeds, so the expiry deadline keeps moving and never arrives; it is now {exp}.',
      capRunDiff: '{s} still gives {sv} and {p} gives {pv}: two answers for one name, and not one error message.',
      capEndUp: 'Nothing changes from here without a new action ({keys}).',
      capEndUpR: 'Nothing changes from here; R goes back to the start.',
      capEndDown: 'Nothing changes from here until {p} comes back (V); then {s} takes the zone again.',
      retries: ['{n} retry', '{n} retries'],
      refreshes: ['{n} refresh', '{n} refreshes'],

      noteKillDown: 'P is already switched off.',
      noteReviveUp: 'P is already running.',
      noteEditDown: 'P is switched off: its zone cannot be edited.',
      noteOnce: 'Each action happens once per run; R goes back to the start.',
      noteLimit: 'The run is at its limit of 20 steps.',

      explain: '<p>A zone has one [[primary server]], where it is edited, and one or more secondaries. A ' +
        '[[secondary server]] gets the zone from the primary by a [[zone transfer]] and answers from its copy. Each is ' +
        'an [[authoritative server]]; they differ only in where their data comes from.</p>' +
        '<p>Four numbers in the SOA record drive the secondary. Every <code>REFRESH</code> seconds it asks the primary ' +
        'for the serial (<code>SERIAL</code>). If the primary\'s is greater, it takes the zone; if not, it keeps its ' +
        'copy. <strong>The numbers are compared, not the contents</strong>, so an edit without a raised serial never ' +
        'arrives. A check with the same serial is a success too.</p>' +
        '<p>If the primary does not answer, the secondary tries again every <code>RETRY</code> seconds and meanwhile ' +
        'answers from its copy as if nothing had happened. Only when <code>EXPIRE</code> seconds have passed since the ' +
        'last successful check does it stop being authoritative and answer <code>SERVFAIL</code> to every query. A ' +
        'secondary is therefore a [[cache]] with a timer, not a backup that survives the primary: a dead primary takes ' +
        'the zone down, only later. The clock runs from the last successful check, not from the last zone transfer.</p>' +
        '<p>The model: one secondary, no NOTIFY messages, so changes arrive only at a refresh. Time runs from the start ' +
        'of the run; one step jumps to the next interesting moment, and a run of identical checks is one step.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
