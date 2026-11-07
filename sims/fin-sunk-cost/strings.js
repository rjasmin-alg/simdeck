/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-sunk-cost, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). No glossary terms: the finance terms are not in
   kit/glossary.js yet, so the pairs are written out (NOTES.md "Term pairs"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Projekt koji kasni, odlučen na dva načina',
      eur: '{n} €',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi, u eurima; korist je vrijednost kroz vijek sustava, bez diskontiranja.',

      laneSunk: 'Prema već potrošenom',
      laneSunkSub: 'potrošeno računa kao gubitak ako odustanemo',
      laneFwd: 'Prema onome što tek dolazi',
      laneFwdSub: 'samo trošak i korist koji tek dolaze',
      gateShort: 'O{g}',
      gateLong: 'Odluka {g}',
      monthHead: 'mjesec',
      totCash: 'potrošeno {c}',
      totTeam: ['{n} čovjek-mjesec', '{n} čovjek-mjeseca', '{n} čovjek-mjeseci'],
      totBenefit: 'korist {b}',
      laterLive: '→ m{m}',
      laterLong: 'pušta se u rad u mjesecu {m}',

      tTitle0: 'Odluka 0, prije početka. Ništa još nije potrošeno; stari sustav ima {w} knjigovodstvene vrijednosti.',
      tTitle: 'Odluka {g}, kraj mjeseca {m}: procjena {e} ukupno, još {r}. Već potrošeno {s}; stari sustav još vrijedi {w}.',
      gComing: 'Tek dolazi',
      gSunk: 'Već utonulo',
      hOption: 'Mogućnost',
      hBenefit: 'Korist',
      hCash: 'Novac',
      hPeople: 'Vrijeme ljudi',
      hFwd: '= Gledajući naprijed',
      hSpent: '− Potrošeno, „baceno” ako odustanemo',
      hBook: '− Stari sustav, „gubitak” ako ga zamijenimo',
      hSunk: '= Prema potrošenom',
      oContinue0: 'Započni razvoj',
      oSwitch0: 'Kupi gotov proizvod',
      oStop0: 'Zadrži stari sustav',
      oContinue: 'Nastavi razvoj',
      oSwitch: 'Prijeđi na gotov proizvod',
      oStop: 'Odustani, zadrži stari',
      sContinue: ['još {n} mjesec, 4 osobe', 'još {n} mjeseca, 4 osobe', 'još {n} mjeseci, 4 osobe'],
      sContinue0: ['{n} mjesec, 4 osobe', '{n} mjeseca, 4 osobe', '{n} mjeseci, 4 osobe'],
      sSwitch: '3 mjeseca, 2 osobe',
      sStop: 'tim se vraća drugom poslu',
      sStop0: 'ništa se ne mijenja, tim ostaje na drugom poslu',
      hidden: '?',
      voteHint: 'Glasajte: nastaviti, prijeći ili odustati? → otkriva oba načina.',
      whole: 'Ako se {s} računa kao trošak u svakom retku, kako i jest (potrošen je u svakom slučaju): {list}. Redoslijed je isti kao gledajući naprijed.',
      noGate: 'Nema odluke: nijedna strana više ne razvija sustav.',
      noProduct: 'gotov proizvod nije u ponudi',

      fTitle: 'Svaki put do vlastitog kraja (cijeli projekt, od mjeseca 0)',
      fPath: 'Odluke',
      fLive: 'U radu',
      fBenefit: 'Korist',
      fCash: 'Novac',
      fPeople: 'Vrijeme ljudi',
      fNet: 'Neto',
      fOld: 'Stari sustav',
      liveIn: 'mjesec {m}',
      liveNever: 'nikad',
      oldWritten: 'otpisan u mjesecu {m}: {w}',
      oldKept: 'u knjigama još {w}',
      fOldNote: '{w} knjigovodstvene vrijednosti starog sustava postaje trošak na svakom putu: otpisom ili amortizacijom dok radi.',

      pOverrun: 'Prekoračenje',
      ovNone: 'nema',
      ovModerate: 'umjereno',
      ovSevere: 'veliko',
      pValue: 'Vrijednost čovjek-mjeseca na drugom poslu',
      pOld: 'Knjigovodstvena vrijednost starog sustava',
      pProduct: 'Gotov proizvod u ponudi',

      prOverrun: 'Projekt koji kasni',
      prOverrunHint: 'Kod odluke 2 jedan način prelazi na proizvod, drugi nastavlja.',
      prOnTrack: 'Na vrijeme',
      prOnTrackHint: 'Bez prekoračenja oba načina nastavljaju i slažu se.',
      prTeamFree: 'Vrijeme tima ne broji se',
      prTeamFreeHint: 'Bez oportunitetnog troška nastavak je opet najbolji.',
      prOldBooks: 'Stari sustav u knjigama',
      prOldBooksHint: 'Otpis starog sustava odvraća od početka.',
      prNoWayOut: 'Bez izlaza',
      prNoWayOutHint: 'Nema proizvoda, procjena stalno raste.',

      legBuild: 'razvoj',
      legSetup: 'uvođenje proizvoda',
      legLive: 'novi sustav radi (★ pušten u rad)',
      legKept: 'stari sustav ostaje',
      legChoices: '▶ nastavi · ↪ prijeđi · ■ odustani',

      nContinue0: 'započeti razvoj',
      nSwitch0: 'kupiti gotov proizvod',
      nStop0: 'zadržati stari sustav',
      nContinue: 'nastaviti razvoj',
      nSwitch: 'prijeći na gotov proizvod',
      nStop: 'odustati',

      cOpen0: 'Odluka 0: razviti novi sustav u kući (plan {p}), kupiti gotov proizvod ili zadržati stari sustav? Ništa još nije potrošeno, a stari sustav u knjigama vrijedi {w}.',
      cOpen0NoProduct: 'Odluka 0: razviti novi sustav u kući (plan {p}) ili zadržati stari sustav? Gotovog proizvoda nema. Stari sustav u knjigama vrijedi {w}.',
      cOpenGrew: 'Odluka {g}, mjesec {m}: procjena je narasla s {a} na {b}. Već je potrošeno {s}. Nastaviti, prijeći ili odustati?',
      cOpenHeld: 'Odluka {g}, mjesec {m}: procjena ostaje {b}. Već je potrošeno {s}. Nastaviti, prijeći ili odustati?',
      gOnlySunk: 'Razvija još samo strana koja odlučuje prema potrošenom.',
      gOnlyFwd: 'Razvija još samo strana koja odlučuje prema onome što dolazi.',
      gLive: '{lane}: {p}.',
      cAgree: 'Oba načina odlučivanja slažu se: {opt}. Gledajući naprijed to vrijedi {f}, {d} više od sljedeće mogućnosti.',
      cDiffer: 'Prema potrošenom: {optS}. Prema onome što dolazi: {optF}, jer vrijedi {f} prema {f2}.',
      rSpent: 'Odustajanje bi „bacilo” {s}, no taj je novac potrošen u svakom slučaju.',
      rBook: 'Zamjena bi otpisala {w} starog sustava: gubitak na papiru, trošak koji dolazi u svakom slučaju.',
      cNoGate: 'Odluka {g}, mjesec {m}: nema se što odlučiti, nijedna strana više ne razvija sustav.',
      cMonthSame: 'Mjesec {m}: {p}.',
      cMonthDiffer: 'Mjesec {m}. Prema potrošenom: {a}. Prema onome što dolazi: {b}.',
      pBuild: 'razvoj, još {c}; ukupno potrošeno {s}',
      pSetup: 'uvođenje proizvoda, mjesec {k} od 3; ukupno potrošeno {s}',
      pGoliveBuild: 'novi sustav pušten je u rad i donosi {bn}; stari se otpisuje uz {w}, gubitak na papiru bez novca',
      pGoliveSwitch: 'gotov proizvod pušten je u rad i donosi {bn}; stari se otpisuje uz {w}, gubitak na papiru bez novca',
      pLive: 'novi sustav radi od mjeseca {l}, ništa se više ne troši',
      pLiveSwitch: 'proizvod radi od mjeseca {l}, ništa se više ne troši',
      pKept: 'stari sustav ostaje, tim radi drugo; ništa se više ne troši',
      cEndSame: 'Oba načina išla su istim putem: neto {net} za cijeli projekt.',
      cEnd: 'Do vlastitog kraja: prema potrošenom neto {a}, prema onome što dolazi {b}. Putevi su se razišli kod odluke {g}.',
      gEndFwd: 'Odlučivanje prema onome što dolazi bolje je za {d}.',
      gEndSunk: 'Ovaj put bolje je prošlo odlučivanje prema potrošenom, za {d}: procjena kod odluke bila je pogrešna.',
      gEndEven: 'Neto je isti.',

      nMonths: ['{n} mjesec', '{n} mjeseca', '{n} mjeseci'],

      explain: '<p><b>Nepovratni trošak</b> (<i>sunk cost</i>) je novac koji je već potrošen i ne može se vratiti. ' +
        'On je isti kojim god putem krenete: ako nastavite, potrošen je; ako odustanete, potrošen je. Zato ne može ' +
        'promijeniti koja je mogućnost bolja. Tablica to pokazuje: kad se isti iznos oduzme od svakog retka, ' +
        'redoslijed ostaje isti.</p>' +
        '<p>Isto vrijedi za <b>knjigovodstvenu vrijednost</b> (<i>book value</i>) starog sustava. Kad se zamijeni, ' +
        'ostatak se otpisuje (<i>write-off</i>, gubitak na papiru); kad ostane, ista se svota amortizira kroz ' +
        'preostali vijek. Ukupni trošak je isti, a novca nema: plaćen je davno (MRS 16 o prestanku priznavanja ' +
        'imovine).</p>' +
        '<p>Računa se samo ono što tek dolazi: <b>korist</b> koju će sustav donijeti, <b>novac</b> koji tek treba ' +
        'potrošiti i <b>oportunitetni trošak</b> (<i>opportunity cost</i>) ljudi: plaću primaju u svakom slučaju, ' +
        'ali dok rade na projektu, ne rade ništa drugo. Ovdje je to broj čovjek-mjeseci puta vrijednost ' +
        'čovjek-mjeseca na drugom poslu.</p>' +
        '<p>„Već smo uložili previše da bismo stali” zove se <b>eskalacija predanosti</b> (<i>escalation of ' +
        'commitment</i>): što je više potrošeno, to se teže odustaje. Gledati naprijed ne znači uvijek odustati; ' +
        'znači odlučiti kao da danas birate iznova. Odluka je dobra koliko i procjena onoga što dolazi: u ' +
        'primjeru „Bez izlaza” i procjena kod odluke 2 prekratka je.</p>' +
        '<p>Pretpostavke: razvoj stoji 20 000 € mjesečno izvan tima i 4 osobe, plan 4 mjeseca, korist ' +
        '400 000 €; gotov proizvod 120 000 € kroz 3 mjeseca, 2 osobe, korist 320 000 €; ' +
        'ništa razvijeno ne prenosi se na proizvod. Izostavljeni su diskontiranje, porezi, trošak rada starog ' +
        'sustava i njegova prodaja.</p>'
    },
    en: {
      stage: 'An overrunning project, decided two ways',
      eur: '€{n}',
      illustrative: 'Amounts are made-up but plausible, in euros; a benefit is the value over the system’s life, not discounted.',

      laneSunk: 'By already spent',
      laneSunkSub: 'counts what is spent as lost if we leave',
      laneFwd: 'By still to spend',
      laneFwdSub: 'only the cost and benefit still to come',
      gateShort: 'G{g}',
      gateLong: 'Gate {g}',
      monthHead: 'month',
      totCash: '{c} spent',
      totTeam: ['{n} person-month', '{n} person-months'],
      totBenefit: 'benefit {b}',
      laterLive: '→ m{m}',
      laterLong: 'goes live in month {m}',

      tTitle0: 'Gate 0, before the start. Nothing spent yet; the old system has {w} of book value.',
      tTitle: 'Gate {g}, end of month {m}: estimate {e} in all, {r} to go. Already spent {s}; old system still worth {w}.',
      gComing: 'Still to come',
      gSunk: 'Already sunk',
      hOption: 'Option',
      hBenefit: 'Benefit',
      hCash: 'Cash',
      hPeople: 'People’s time',
      hFwd: '= Looking forward',
      hSpent: '− Spent, “wasted” if we leave',
      hBook: '− Old system, “lost” if replaced',
      hSunk: '= By already spent',
      oContinue0: 'Start building',
      oSwitch0: 'Buy a ready-made product',
      oStop0: 'Keep the old system',
      oContinue: 'Keep building',
      oSwitch: 'Switch to the product',
      oStop: 'Stop, keep the old one',
      sContinue: ['{n} more month, 4 people', '{n} more months, 4 people'],
      sContinue0: ['{n} month, 4 people', '{n} months, 4 people'],
      sSwitch: '3 months, 2 people',
      sStop: 'the team goes back to other work',
      sStop0: 'nothing changes, the team stays on other work',
      hidden: '?',
      voteHint: 'Vote: continue, switch or stop? → reveals both ways of deciding.',
      whole: 'Counting the {s} as a cost in every row, as it really is (it is spent either way): {list}. The same order as looking forward.',
      noGate: 'No gate: neither lane is still building.',
      noProduct: 'no ready-made product on offer',

      fTitle: 'Each path run to its own end (whole project, from month 0)',
      fPath: 'Choices',
      fLive: 'Live',
      fBenefit: 'Benefit',
      fCash: 'Cash',
      fPeople: 'People’s time',
      fNet: 'Net',
      fOld: 'Old system',
      liveIn: 'month {m}',
      liveNever: 'never',
      oldWritten: 'written off in month {m}: {w}',
      oldKept: '{w} still on the books',
      fOldNote: 'The old system’s {w} of book value becomes an expense on every path: written off, or depreciated while it runs.',

      pOverrun: 'Overrun',
      ovNone: 'none',
      ovModerate: 'moderate',
      ovSevere: 'severe',
      pValue: 'Value of a person-month elsewhere',
      pOld: 'Old system’s book value',
      pProduct: 'Ready-made product on offer',

      prOverrun: 'A project that overruns',
      prOverrunHint: 'At gate 2 one way switches to the product, the other keeps building.',
      prOnTrack: 'On time',
      prOnTrackHint: 'No overrun: both ways continue and agree.',
      prTeamFree: 'Team time not counted',
      prTeamFreeHint: 'Without the opportunity cost, continuing is best again.',
      prOldBooks: 'Old system on the books',
      prOldBooksHint: 'The old system’s write-off puts one way off starting.',
      prNoWayOut: 'No way out',
      prNoWayOutHint: 'No product, and the estimate keeps growing.',

      legBuild: 'building',
      legSetup: 'setting up the product',
      legLive: 'new system live (★ goes live)',
      legKept: 'old system stays',
      legChoices: '▶ continue · ↪ switch · ■ stop',

      nContinue0: 'start building',
      nSwitch0: 'buy the ready-made product',
      nStop0: 'keep the old system',
      nContinue: 'keep building',
      nSwitch: 'switch to the ready-made product',
      nStop: 'stop',

      cOpen0: 'Gate 0: build a new system in-house (planned {p}), buy a ready-made product, or keep the old system? Nothing is spent yet, and the old system is worth {w} on the books.',
      cOpen0NoProduct: 'Gate 0: build a new system in-house (planned {p}) or keep the old system? No ready-made product is on offer. The old system is worth {w} on the books.',
      cOpenGrew: 'Gate {g}, month {m}: the estimate grew from {a} to {b}. {s} is already spent. Continue, switch or stop?',
      cOpenHeld: 'Gate {g}, month {m}: the estimate holds at {b}. {s} is already spent. Continue, switch or stop?',
      gOnlySunk: 'Only the lane deciding by already spent is still building.',
      gOnlyFwd: 'Only the lane deciding by still to spend is still building.',
      gLive: '{lane}: {p}.',
      cAgree: 'Both ways of deciding agree: {opt}. Looking forward it is worth {f}, {d} more than the next option.',
      cDiffer: 'By already spent: {optS}. By still to spend: {optF}, worth {f} against {f2}.',
      rSpent: 'Leaving would “waste” the {s}, but that money is spent whichever way.',
      rBook: 'Replacing would write off the old system’s {w}: a loss on paper, an expense that comes either way.',
      cNoGate: 'Gate {g}, month {m}: nothing to decide, neither lane is still building.',
      cMonthSame: 'Month {m}: {p}.',
      cMonthDiffer: 'Month {m}. By already spent: {a}. By still to spend: {b}.',
      pBuild: 'building, {c} more; {s} spent in all',
      pSetup: 'setting up the product, month {k} of 3; {s} spent in all',
      pGoliveBuild: 'the new system goes live, bringing {bn}; the old one is written off at {w}, a loss on paper with no cash',
      pGoliveSwitch: 'the ready-made product goes live, bringing {bn}; the old one is written off at {w}, a loss on paper with no cash',
      pLive: 'the new system has run since month {l}; nothing more is spent',
      pLiveSwitch: 'the product has run since month {l}; nothing more is spent',
      pKept: 'the old system stays, the team works on other things; nothing more is spent',
      cEndSame: 'Both ways took the same path: net {net} for the whole project.',
      cEnd: 'Run to their own end: by already spent, net {a}; by still to spend, {b}. The paths parted at gate {g}.',
      gEndFwd: 'Deciding by still to spend comes out {d} better.',
      gEndSunk: 'This time deciding by already spent came out {d} better: the estimate at the gate was wrong.',
      gEndEven: 'The net is the same.',

      nMonths: ['{n} month', '{n} months'],

      explain: '<p>A <b>sunk cost</b> is money already spent that cannot be got back. It is the same whichever way ' +
        'you go: continue, and it is spent; stop, and it is spent. So it cannot change which option is better. The ' +
        'table shows it: take the same amount off every row and the order stays the same.</p>' +
        '<p>The same holds for the old system’s <b>book value</b>. Replace it, and the rest is written off (a ' +
        '<i>write-off</i>, a loss on paper); keep it, and the same amount is depreciated over the life it has left. ' +
        'The total expense is the same, and there is no cash in it: that was paid long ago (IAS 16 on ' +
        'derecognition).</p>' +
        '<p>Only what is still to come counts: the <b>benefit</b> the system will bring, the <b>cash</b> still to ' +
        'spend, and the <b>opportunity cost</b> of the people: they are paid either way, but while they work on the ' +
        'project they do nothing else. Here it is the person-months times what a person-month would produce ' +
        'elsewhere.</p>' +
        '<p>“We have put in too much to stop now” is called <b>escalation of commitment</b>: the more is spent, the ' +
        'harder it is to leave. Looking forward does not always mean stopping; it means deciding as if you were ' +
        'choosing afresh today. A decision is as good as the estimate of what is still to come: in “No way out” ' +
        'even the estimate at gate 2 is too short.</p>' +
        '<p>Assumptions: building costs €20,000 a month outside the team plus 4 people, planned for 4 months, ' +
        'benefit €400,000; the ready-made product €120,000 over 3 months, 2 people, benefit €320,000; nothing built ' +
        'carries over to the product. Left out: discounting, tax, the old system’s running costs and selling it.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
