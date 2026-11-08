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
      // split brain (task dns-split-brain)
      prSplit: 'Dva primarna',
      prSplitHint: 'Ista zona na dva primarna, bez prijenosa; izmjena na P2, pa upit svakome',
      prRetire: 'Dva primarna: popravak',
      prRetireHint: 'P1 postaje sekundarni od P2; serijski brojevi odlučuju',

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

      // split brain (task dns-split-brain): two primaries of one zone
      sbStage: 'Dva primarna poslužitelja iste zone, dvije skupine klijenata i izravni upit svakom poslužitelju',
      sbKind1: 'samostalni poslužitelj imena',
      sbKind2: 'poslužitelj imena u imeniku',
      sbRoleS: 'sekundarni od {m}',
      sbNone: '— nema zapisa',
      sbNext: 'osvježavanje {at}',
      sbTwo: 'Dva primarna za {zone}, bez prijenosa zone: dvije zone',
      sbOne: 'Primarni za {zone} i njegov sekundarni: jedna zona',
      sbGroup: 'Skupina {g}',
      sbDhcp: 'DHCP (opcija 6) daje poslužitelj imena {p}',
      sbAsk: 'rekurzivni upit',
      sbNotAsked: 'još nije pitala',
      sbDirect: 'Nerekurzivni upit izravno svakom poslužitelju',
      sbDirectNot: 'još nije poslan',
      sbNx: 'NXDOMAIN (ne postoji)',
      lgdP1: 'P1 i skupina H',
      lgdP2: 'P2 i skupina D',
      lgdPrimary: 'primarni',
      lgdSecondary: 'sekundarni',
      lgdZone: 'jedna zona',
      capSbStart: '{p1} i {p2} oba su primarni poslužitelj zone {zone}, a prijenosa zone nema ni u jednom smjeru: svaki ima svoj serijski broj i svoje zapise, pa i drukčiju adresu na vrhu zone. Skupina H od DHCP-a dobiva {p1} kao poslužitelj imena, skupina D {p2}.',
      capSbAsk: 'Skupina {g} pita svoj poslužitelj imena, {p}: {apex} je {v1}, a {app} {v2}. Odgovor dolazi iz kopije na {p}, sa zastavicom aa.',
      capSbOther: 'Skupina {g} za isto ime {apex} dobiva {v}: jedno ime, dva odgovora, i nijedan nije pogreška.',
      capSbStill: 'Izmjena na {p2} do {p1} ne stiže, jer je nitko ne prenosi.',
      capSbOnly: 'Novi zapis vidi samo skupina {g}.',
      capSbEdit: 'Na {p2} je dodan zapis {app} A {v}, a serijski broj podignut na {serial}. {p1} za to ne zna: dva primarna ne uspoređuju serijske brojeve i ne prenose zonu jedan drugome.',
      capSbDirect: 'Isti upiti, sad nerekurzivno i izravno svakom poslužitelju. Oba poslužitelja odgovaraju sa zastavicom aa i oba su u pravu za svoju kopiju. Zona s dva primarna dvije su zone.',
      capSbEnd: 'Ono što razriješi jedno računalo govori samo što zna poslužitelj imena koji mu je dodijeljen. R vraća na početak.',
      capRtStart: 'Ovdje završava primjer „Dva primarna”: {p1} i {p2} imaju svaki svoju zonu, pa skupina H za {apex} dobiva {h}, a skupina D {d}. Popravak: jedan ostaje primarni, a drugi postaje njegov sekundarni.',
      capRtConvert: '{p1} više nije primarni nego sekundarni od {p2}. Kopija mu ostaje ista (serijski broj {s1}) dok ne pita {p2}, a to će učiniti pri osvježavanju, {at}. Zonu preuzima samo ako je serijski broj na {p2} veći, a {s2} jest veći.',
      capRtNotYet: 'Uloga se promijenila, ali kopija nije: {p1} kao sekundarni odgovara iz stare kopije, i dalje sa zastavicom aa.',
      capRtRefresh: '{t}, osvježavanje: {p1} pita {p2} za serijski broj. {s2} je veći od {s1}, pa {p1} preuzima cijelu zonu (prijenos zone), a stara kopija s njegovim vrhom zone nestaje.',
      capRtSame: 'Sad obje skupine dobivaju isto: jedna zona, jedan izvor.',
      capRtDirect: 'Izravno i nerekurzivno: oba poslužitelja daju iste odgovore sa zastavicom aa, {p1} kao sekundarni iz kopije koju je preuzeo od {p2}.',
      noteSplit: 'U ovom su primjeru koraci zadani (→); E, K i V rade u primjerima s jednim primarnim.',

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
        'početka prikaza; jedan korak skače na sljedeći zanimljiv trenutak, a niz jednakih provjera je jedan korak.</p>',

      explainSplit: '<p><strong>Dva primarna.</strong> Zona ima jedan [[primary server]]: na njemu se uređuje, a ' +
        'sekundarni od njega preuzimaju kopiju, [[zone transfer]]. Kad su dva poslužitelja oba primarna za istu zonu i ' +
        'nijedan drugome ne prenosi zonu, ništa ih ne uspoređuje: svaki odgovara iz svoje kopije i svaki se izjašnjava ' +
        'kao autoritet zastavicom <code>aa</code>, <i>authoritative answer</i> (mjerodavan odgovor). Zastavica kaže tko ' +
        'tvrdi da je mjerodavan, ali ne i je li tvrdnja istinita.</p>' +
        '<p>Klijent ne bira odgovor: pita poslužitelj imena koji mu je dodijeljen (DHCP, opcija 6), i to je jedini razlog ' +
        'zašto vidi baš taj. Ono što razriješi jedno računalo nije „ono što zona kaže”. Tko je za zonu mjerodavan i što ' +
        'tvrdi, provjerava se tako da se svakom poslužitelju koji se za nju izjašnjava izravno pošalje <i>non-recursive ' +
        'query</i> (nerekurzivni upit). Dva primarna nisu ni zalihost: zalihost su dvije kopije iste zone, a ovo su ' +
        'dvije zone s istim imenom, <i>split-brain</i> (razdvojeni mozak).</p>' +
        '<p>Popravak: jedan ostaje primarni, a drugi postaje njegov sekundarni ili se ukloni. Sekundarni preuzima zonu ' +
        'samo ako je serijski broj na primarnom veći od njegova, pa se brojevi provjere prije prelaska. Namjerno ' +
        'različiti odgovori po mreži iz koje klijent pita (pogledi) drugo su pitanje i ovdje se ne prikazuju.</p>'
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
      // split brain (task dns-split-brain)
      prSplit: 'Two primaries',
      prSplitHint: 'One zone on two primaries, no transfer; an edit on P2, then ask each',
      prRetire: 'Two primaries: the fix',
      prRetireHint: 'P1 becomes a secondary of P2; the serials decide',

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

      // split brain (task dns-split-brain): two primaries of one zone
      sbStage: 'Two primary servers of one zone, two groups of clients and a direct query to each server',
      sbKind1: 'stand-alone name server',
      sbKind2: 'directory-integrated name server',
      sbRoleS: 'secondary of {m}',
      sbNone: '— no record',
      sbNext: 'refresh {at}',
      sbTwo: 'Two primaries for {zone}, no zone transfer: two zones',
      sbOne: 'A primary for {zone} and its secondary: one zone',
      sbGroup: 'Group {g}',
      sbDhcp: 'DHCP (option 6) gives name server {p}',
      sbAsk: 'recursive query',
      sbNotAsked: 'has not asked yet',
      sbDirect: 'Non-recursive query straight to each server',
      sbDirectNot: 'not sent yet',
      sbNx: 'NXDOMAIN (no such name)',
      lgdP1: 'P1 and group H',
      lgdP2: 'P2 and group D',
      lgdPrimary: 'primary',
      lgdSecondary: 'secondary',
      lgdZone: 'one zone',
      capSbStart: '{p1} and {p2} are both primary for {zone}, with no zone transfer either way: each has its own serial and its own records, even a different address at the zone apex. DHCP gives group H {p1} as its name server, group D {p2}.',
      capSbAsk: 'Group {g} asks its name server, {p}: {apex} is {v1} and {app} is {v2}. The answer comes from the copy on {p}, with the aa flag.',
      capSbOther: 'Group {g} gets {v} for the same name {apex}: one name, two answers, and neither is an error.',
      capSbStill: 'The edit on {p2} never reaches {p1}, because nothing carries it.',
      capSbOnly: 'Only group {g} sees the new record.',
      capSbEdit: '{app} A {v} is added on {p2} and its serial raised to {serial}. {p1} does not know: two primaries compare no serials and transfer no zone to each other.',
      capSbDirect: 'The same queries, now non-recursive and straight to each server. Both servers answer with the aa flag and each is right about its own copy. A zone with two primaries is two zones.',
      capSbEnd: 'What one computer resolves tells you only what its assigned name server knows. R starts over.',
      capRtStart: 'This is where "Two primaries" ends: {p1} and {p2} each have a zone of their own, so group H gets {h} for {apex} and group D gets {d}. The fix: one stays primary, the other becomes its secondary.',
      capRtConvert: '{p1} is no longer a primary but a secondary of {p2}. Its copy stays the same (serial {s1}) until it asks {p2}, which it does at the refresh, {at}. It takes the zone only if the serial on {p2} is greater, and {s2} is greater.',
      capRtNotYet: 'The role has changed, the copy has not: as a secondary {p1} answers from its old copy, still with the aa flag.',
      capRtRefresh: '{t}, refresh: {p1} asks {p2} for the serial. {s2} is greater than {s1}, so {p1} takes the whole zone (a zone transfer), and the old copy with its zone apex is gone.',
      capRtSame: 'Now both groups get the same: one zone, one source.',
      capRtDirect: 'Directly and non-recursively: both servers give the same answers with the aa flag, {p1} as a secondary, from the copy it took from {p2}.',
      noteSplit: 'In this example the steps are fixed (→); E, K and V work in the examples with one primary.',

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
        'of the run; one step jumps to the next interesting moment, and a run of identical checks is one step.</p>',

      explainSplit: '<p><strong>Two primaries.</strong> A zone has one [[primary server]]: it is edited there, and the ' +
        'secondaries take their copy from it by a [[zone transfer]]. When two servers are both primary for one zone and ' +
        'neither transfers the zone to the other, nothing compares them: each answers from its own copy and each claims ' +
        'authority with the <code>aa</code> flag (<i>authoritative answer</i>). The flag says who claims to be ' +
        'authoritative, not whether the claim is true.</p>' +
        '<p>A client does not choose its answer: it asks the name server it was given (DHCP, option 6), and that is the ' +
        'only reason it sees that one. What one computer resolves is not "what the zone says". Who is authoritative ' +
        'for a zone, and what each one claims, is checked by sending a <i>non-recursive query</i> straight to every ' +
        'server that claims the zone. Nor are two primaries redundancy: redundancy is two copies of one zone, and ' +
        'these are two zones with one name, a <i>split-brain</i>.</p>' +
        '<p>The fix: one stays primary, and the other becomes its secondary or is removed. A secondary takes the zone ' +
        'only if the primary\'s serial is greater than its own, so the serials are checked before the switch. ' +
        'Deliberately different answers by the network a client asks from (views) are another matter and not shown ' +
        'here.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
