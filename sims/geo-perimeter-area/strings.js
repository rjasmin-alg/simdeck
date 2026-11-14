/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of geo-perimeter-area, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). The symbols are the
   textbooks' own: Croatian o (opseg) and P (površina), English P (perimeter) and A (area); the page takes them from
   symO and symP. No formulas, no decimals: the curriculum counts (MAT OŠ D.3.3, D.4.2). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Kvadratna mreža s obojenim kvadratima, njihovim rubom, opsegom i površinom',

      // the audience switch (shared by the ari- and geo- pages)
      audLabel: 'Za koga',
      audGroup: 'Prikaz za',
      audTeacher: 'Učitelj',
      audAdult: 'Odrasli',
      audChild: 'Dijete',
      audTeacherHint: 'Za projekciju: sve postavke, tipična pogreška i pitanje prije odgovora.',
      audAdultHint: 'Uz svaki korak piše zašto vrijedi.',
      audChildHint: 'Velika slika, malo riječi.',

      // symbols and units
      symO: 'o',
      symP: 'P',
      wO: 'opseg',
      wP: 'površina',
      cmFmt: '{n} cm',
      cm2Fmt: '{n} cm²',

      // panel
      mode: 'Što radimo',
      mode_paint: 'Boji',
      mode_twelve: 'Pravokutnici',
      mode_walk: 'Obiđi rub',
      n: 'Broj kvadrata',
      hide: 'Najprije pitaj',
      hideHint: 'Sakrij brojeve i najprije pitaj razred (V).',
      revealKey: 'Pokaži ili sakrij odgovor',
      reveal: 'Pokaži',
      back: 'Natrag',
      next: 'Dalje',
      nextKey: 'Sljedeća stranica ruba',
      toEnd: 'Cijeli rub',
      restart: 'Ispočetka',
      clear: 'Obriši sve',
      paintHint: 'Klikni ili povuci po kvadratima: bojiš prazne, brišeš obojene.',

      // presets
      p_eight: 'Lik od 8 kvadrata',
      p_notch: 'Popuni kut',
      'p_same-perimeter': 'Isti opseg?',
      p_twelve: '12 kvadrata',
      p_sixteen: '16 kvadrata: 4 × 4',
      p_walk: 'Obiđi pravokutnik',
      'p_walk-u': 'Obiđi slovo U',
      p_blank: 'Prazan papir',
      ph_eight: 'Prebroji kvadrate i rub. (V pokazuje)',
      ph_notch: 'Oboji prazan kut: što će biti s opsegom?',
      'ph_same-perimeter': 'Dva lika, isti opseg.',
      ph_twelve: 'Složi 12 kvadrata u sve pravokutnike. (V pokazuje)',
      ph_sixteen: 'Isti broj, različite stvari.',
      ph_walk: 'Hodaj po rubu i broji.',
      'ph_walk-u': 'Rub ulazi u udubinu.',
      ph_blank: 'Oboji svoj lik.',

      // legend
      legSquare: 'jedinični kvadrat: 1 cm²',
      legEdge: 'rub: opseg',
      legWalked: 'rub, još neobiđen',

      // words on the paper
      wStart: 'početak',
      wShape: 'lik {n}',

      // mode paint: top
      askPaint: 'Kolika je površina, a koliki opseg?',
      readP: '{sym} = {v}',
      readO: '{sym} = {v}',
      unknown: '?',
      paintEmpty: 'Oboji kvadrate!',
      paintEmptySub: 'Klikni na kvadrat ili povuci po papiru.',
      squaresN: ['{n} kvadrat', '{n} kvadrata', '{n} kvadrata'],
      squaresGen: ['{n} kvadrata', '{n} kvadrata', '{n} kvadrata'],
      sidesN: ['{n} stranica na rubu', '{n} stranice na rubu', '{n} stranica na rubu'],
      sidesSq: ['{n} stranica kvadrata', '{n} stranice kvadrata', '{n} stranica kvadrata'],
      shapesN: ['{n} lik', '{n} lika', '{n} likova'],
      pieceRead: 'lik {i}: {P}, {o}',

      // mode twelve: top
      rectName: '{b} × {a}',
      sumSides: '{sym} = {sum} = {o}',
      tRect: 'pravokutnik',
      tSame: 'Isti {P}, različit {o}',

      // mode walk: top
      walkSay0: 'Hodaj po rubu i broji!',
      walkSay: 'Prijeđeno: {v}',
      walkSayDone: 'Cijeli rub: {sym} = {v}',
      walkSub: 'Svaka stranica kvadrata na rubu duga je 1 cm.',
      walkEmpty: 'Nema lika za obilazak.',

      // captions: paint
      cPaintEmpty: 'Klikni na kvadrate i oboji lik. Svaki kvadrat je 1 cm² površine, svaka njegova stranica 1 cm ruba.',
      cAskPaint: 'Razred broji: koliko kvadrata lik prekriva (površina), a koliko stranica kvadrata leži na rubu (opseg)? V pokazuje.',
      cPaint: 'Lik prekriva {P}: površina {Pv}. Rub čini {o}: opseg {ov}.',
      cAdd_4: 'Novi kvadrat ne dodiruje lik: površina + 1 cm², opseg + 4 cm.',
      cAdd_2: 'Novi kvadrat dodiruje lik jednom stranicom: ona nestaje s ruba, tri nove dolaze. Površina + 1 cm², opseg + 2 cm.',
      cAdd_0: 'Površina + 1 cm², a opseg se nije promijenio: dvije stranice nestale su s ruba, dvije su došle.',
      cAdd_m2: 'Površina + 1 cm², a opseg − 2 cm: tri stranice nestale su s ruba, došla je samo jedna.',
      cAdd_m4: 'Kvadrat je popunio rupu: površina + 1 cm², opseg − 4 cm.',
      cDel: 'Obrisan kvadrat: površina − 1 cm², opseg {d}.',
      cMany: 'Tim potezom: površina {dP}, opseg {dO}.',
      dPlus2: '+ {n} cm²',
      dMinus2: '− {n} cm²',
      dPlus: '+ {n} cm',
      dMinus: '− {n} cm',
      dSame: 'isti',
      cPieces: 'Ovo su {n}: svaki ima svoju površinu i svoj opseg. Kvadrati koji se dodiruju samo vrhom nisu jedan lik.',
      cHole: 'Lik ima rupu: i rub rupe je rub lika, pa je u opsegu.',
      cMistSameO: 'Česta pogreška: misliti da likovi jednakog opsega imaju jednaku površinu. Ovdje su opsezi jednaki, a površine nisu.',
      cSameNum: 'Opseg i površina ovdje su isti broj, {n}, ali nisu ista stvar: {n} cm ruba, {n} cm² površine.',
      whyPaint: 'Zašto: površina broji kvadrate koje lik prekriva, opseg broji stranice kvadrata na rubu. Stranica koju dijele dva obojena kvadrata nije na rubu.',
      cPaintC: 'P broji kvadrate. o broji rub.',
      cAskPaintC: 'Prebroji!',

      // captions: twelve
      cAskTw: 'Razred zbraja stranice: koliki je opseg ovog pravokutnika? V pokazuje.',
      cTw: ['Isti {n} kvadrat složen je u pravokutnik {r}: površina je opet {Pv}, a opseg {ov}.', 'Ista {n} kvadrata složena su u pravokutnik {r}: površina je opet {Pv}, a opseg {ov}.', 'Istih {n} kvadrata složeno je u pravokutnik {r}: površina je opet {Pv}, a opseg {ov}.'],
      cTwMore: 'Složi i ostale pravokutnike (gumbi gore) i usporedi ih u tablici.',
      cTwOne: ['Od {n} kvadrata slaže se samo jedan pravokutnik: {r}.', 'Od {n} kvadrata slaže se samo jedan pravokutnik: {r}.', 'Od {n} kvadrata slaže se samo jedan pravokutnik: {r}.'],
      cMistSameP: 'Česta pogreška: misliti da likovi jednake površine imaju jednak opseg. Svi imaju površinu {Pv}, a opseg ide od {min} do {max}.',
      whyTw: 'Zašto: u izduženom pravokutniku kvadrati dijele manje stranica sa susjedima, pa ih je više na rubu. Najmanji opseg ima pravokutnik najsličniji kvadratu.',
      cTwC: 'Isti kvadrati, drugi rub!',
      cAskTwC: 'Koliki je opseg?',

      // captions: walk
      cWalkEmpty: 'Nema obojenih kvadrata: u načinu Boji oboji lik pa ga obiđi.',
      cWalk0: 'Krećemo iz donjeg lijevog vrha lika i hodamo po rubu. Svaka stranica kvadrata na rubu je 1 cm; brojimo ih.',
      cWalk: ['Prijeđena je {n} stranica: {v} ruba.', 'Prijeđene su {n} stranice: {v} ruba.', 'Prijeđeno je {n} stranica: {v} ruba.'],
      cWalkJump: 'Lik ima rupu: i rub rupe je rub lika, pa obilazimo i njega.',
      cWalkPiece: 'Lik {i} je obiđen: opseg {v}. Sad obilazimo lik {j}.',
      cWalkDone: 'Natrag na početku: cijeli rub dug je {v}, to je opseg.',
      cWalkDoneMany: 'Svaki lik je obiđen; svaki ima svoj opseg.',
      cMistEdge: 'Česta pogreška: brojiti kvadrate uz rub ({e}) umjesto njihovih stranica na rubu ({o}). Kutni kvadrat daje dvije stranice.',
      whyWalk: 'Zašto: opseg je duljina ruba. Na kvadratnoj mreži rub čine stranice kvadrata od po 1 cm, pa ga mjerimo brojeći ih.',
      cWalkC: 'Hodaj po rubu!',
      cWalkDoneC: 'Rub je dug {v}.',

      // stage labels
      paintLabel: 'Kvadratna mreža: obojeno {P}; površina {Pv}, opseg {ov}.',
      paintLabelHidden: 'Kvadratna mreža s obojenim likom; površina i opseg su skriveni.',
      twLabel: 'Pravokutnik {r} od {n}; površina {Pv}, opseg {ov}.',
      walkLabel: ['Obilazak ruba: prijeđena je {n} stranica.', 'Obilazak ruba: prijeđene su {n} stranice.', 'Obilazak ruba: prijeđeno je {n} stranica.'],

      explain: '<p><b>Površina</b> (P) lika na kvadratnoj mreži je broj jediničnih kvadrata koje prekriva. Ako je stranica kvadrata 1 cm, kvadrat prekriva 1 centimetar kvadratni, pa pišemo P = 8 cm².</p><p><b>Opseg</b> (o) je duljina ruba lika. Na kvadratnoj mreži rub čine stranice kvadrata, svaka duga 1 cm: obiđemo rub i prebrojimo ih, pa pišemo o = 14 cm. Opseg pravokutnika je zbroj duljina njegovih stranica, npr. 4 cm + 3 cm + 4 cm + 3 cm = 14 cm.</p><p>To su <b>različite stvari</b>. Od 12 jediničnih kvadrata slažu se pravokutnici 1 × 12, 2 × 6 i 3 × 4: svi imaju P = 12 cm², a opsege 26 cm, 16 cm i 14 cm. I obratno, likovi jednakog opsega mogu imati različite površine. Ne računamo formulom: brojimo kvadrate i stranice.</p>'
    },

    en: {
      stage: 'Squared paper with coloured squares, their edge, perimeter and area',

      audLabel: 'For',
      audGroup: 'Show for',
      audTeacher: 'Teacher',
      audAdult: 'Adult',
      audChild: 'Child',
      audTeacherHint: 'For the projector: every setting, the typical mistake, and asking before answering.',
      audAdultHint: 'Says why each step holds.',
      audChildHint: 'A big picture, few words.',

      symO: 'P',
      symP: 'A',
      wO: 'perimeter',
      wP: 'area',
      cmFmt: '{n} cm',
      cm2Fmt: '{n} cm²',

      mode: 'What we do',
      mode_paint: 'Colour',
      mode_twelve: 'Rectangles',
      mode_walk: 'Walk the edge',
      n: 'Number of squares',
      hide: 'Ask first',
      hideHint: 'Hide the numbers and ask the class first (V).',
      revealKey: 'Show or hide the answer',
      reveal: 'Show',
      back: 'Back',
      next: 'Next',
      nextKey: 'Next side of the edge',
      toEnd: 'Whole edge',
      restart: 'Start again',
      clear: 'Clear all',
      paintHint: 'Click or drag over the squares: you colour empty ones and erase coloured ones.',

      p_eight: 'A shape of 8 squares',
      p_notch: 'Fill the corner',
      'p_same-perimeter': 'Same perimeter?',
      p_twelve: '12 squares',
      p_sixteen: '16 squares: 4 × 4',
      p_walk: 'Walk round a rectangle',
      'p_walk-u': 'Walk round a U',
      p_blank: 'Blank paper',
      ph_eight: 'Count the squares and the edge. (V shows)',
      ph_notch: 'Colour the empty corner: what happens to the perimeter?',
      'ph_same-perimeter': 'Two shapes, the same perimeter.',
      ph_twelve: 'Lay 12 squares as every rectangle. (V shows)',
      ph_sixteen: 'The same number, different things.',
      ph_walk: 'Walk along the edge and count.',
      'ph_walk-u': 'The edge goes into the dent.',
      ph_blank: 'Colour your own shape.',

      legSquare: 'unit square: 1 cm²',
      legEdge: 'edge: perimeter',
      legWalked: 'edge, not yet walked',

      wStart: 'start',
      wShape: 'shape {n}',

      askPaint: 'What is the area, and what is the perimeter?',
      readP: '{sym} = {v}',
      readO: '{sym} = {v}',
      unknown: '?',
      paintEmpty: 'Colour some squares!',
      paintEmptySub: 'Click a square or drag across the paper.',
      squaresN: ['{n} square', '{n} squares'],
      squaresGen: ['{n} square', '{n} squares'],
      sidesN: ['{n} side on the edge', '{n} sides on the edge'],
      sidesSq: ['{n} side of a square', '{n} sides of squares'],
      shapesN: ['{n} shape', '{n} shapes'],
      pieceRead: 'shape {i}: {P}, {o}',

      rectName: '{b} × {a}',
      sumSides: '{sym} = {sum} = {o}',
      tRect: 'rectangle',
      tSame: 'The same {P}, a different {o}',

      walkSay0: 'Walk along the edge and count!',
      walkSay: 'Walked: {v}',
      walkSayDone: 'The whole edge: {sym} = {v}',
      walkSub: 'Each side of a square on the edge is 1 cm long.',
      walkEmpty: 'No shape to walk round.',

      cPaintEmpty: 'Click squares to colour a shape. Each square is 1 cm² of area, each of its sides 1 cm of edge.',
      cAskPaint: 'The class counts: how many squares does the shape cover (area), and how many sides of squares lie on its edge (perimeter)? V shows.',
      cPaint: 'The shape covers {P}: area {Pv}. Its edge is {o}: perimeter {ov}.',
      cAdd_4: 'The new square does not touch the shape: area + 1 cm², perimeter + 4 cm.',
      cAdd_2: 'The new square touches the shape along one side: that side leaves the edge and three new ones join it. Area + 1 cm², perimeter + 2 cm.',
      cAdd_0: 'Area + 1 cm², but the perimeter has not changed: two sides left the edge and two joined it.',
      cAdd_m2: 'Area + 1 cm², but perimeter − 2 cm: three sides left the edge and only one joined it.',
      cAdd_m4: 'The square filled a hole: area + 1 cm², perimeter − 4 cm.',
      cDel: 'A square erased: area − 1 cm², perimeter {d}.',
      cMany: 'With that drag: area {dP}, perimeter {dO}.',
      dPlus2: '+ {n} cm²',
      dMinus2: '− {n} cm²',
      dPlus: '+ {n} cm',
      dMinus: '− {n} cm',
      dSame: 'the same',
      cPieces: 'These are {n}: each has its own area and its own perimeter. Squares that touch only at a corner are not one shape.',
      cHole: 'The shape has a hole: the hole\'s edge is the shape\'s edge too, so it counts in the perimeter.',
      cMistSameO: 'A common mistake: thinking that shapes with the same perimeter have the same area. Here the perimeters are equal and the areas are not.',
      cSameNum: 'Perimeter and area are the same number here, {n}, but not the same thing: {n} cm of edge, {n} cm² of surface.',
      whyPaint: 'Why: the area counts the squares the shape covers, the perimeter counts the sides of squares on its edge. A side shared by two coloured squares is not on the edge.',
      cPaintC: 'A counts squares. P counts the edge.',
      cAskPaintC: 'Count them!',

      cAskTw: 'The class adds the sides: what is this rectangle\'s perimeter? V shows.',
      cTw: ['The same {n} square, laid as a {r} rectangle: the area is {Pv} again, the perimeter {ov}.', 'The same {n} squares, laid as a {r} rectangle: the area is {Pv} again, the perimeter {ov}.'],
      cTwMore: 'Lay the other rectangles too (the buttons above) and compare them in the table.',
      cTwOne: ['{n} square makes only one rectangle: {r}.', '{n} squares make only one rectangle: {r}.'],
      cMistSameP: 'A common mistake: thinking that shapes with the same area have the same perimeter. They all have area {Pv}, and the perimeter goes from {min} to {max}.',
      whyTw: 'Why: in a long thin rectangle the squares share fewer sides with neighbours, so more sides lie on the edge. The rectangle closest to a square has the smallest perimeter.',
      cTwC: 'The same squares, another edge!',
      cAskTwC: 'What is the perimeter?',

      cWalkEmpty: 'No coloured squares: colour a shape in Colour mode, then walk round it.',
      cWalk0: 'We start at the shape\'s bottom left corner and walk along the edge. Each side of a square on the edge is 1 cm; we count them.',
      cWalk: ['{n} side walked: {v} of edge.', '{n} sides walked: {v} of edge.'],
      cWalkJump: 'The shape has a hole: the hole\'s edge is the shape\'s edge too, so we walk round it as well.',
      cWalkPiece: 'Shape {i} is walked round: perimeter {v}. Now shape {j}.',
      cWalkDone: 'Back at the start: the whole edge is {v} long; that is the perimeter.',
      cWalkDoneMany: 'Every shape is walked round; each has its own perimeter.',
      cMistEdge: 'A common mistake: counting the squares along the edge ({e}) instead of their sides on the edge ({o}). A corner square gives two sides.',
      whyWalk: 'Why: the perimeter is the length of the edge. On squared paper the edge is made of sides of squares, 1 cm each, so we measure it by counting them.',
      cWalkC: 'Walk along the edge!',
      cWalkDoneC: 'The edge is {v} long.',

      paintLabel: 'Squared paper: {P} coloured; area {Pv}, perimeter {ov}.',
      paintLabelHidden: 'Squared paper with a coloured shape; area and perimeter are hidden.',
      twLabel: 'A {r} rectangle of {n}; area {Pv}, perimeter {ov}.',
      walkLabel: ['Walking the edge: {n} side walked.', 'Walking the edge: {n} sides walked.'],

      explain: '<p>The <b>area</b> (A) of a shape on squared paper is the number of unit squares it covers. When a square\'s side is 1 cm, the square covers 1 square centimetre, so we write A = 8 cm².</p><p>The <b>perimeter</b> (P) is the length of the shape\'s edge. On squared paper the edge is made of sides of squares, each 1 cm long: we walk round the edge and count them, and write P = 14 cm. A rectangle\'s perimeter is the sum of the lengths of its sides, for example 4 cm + 3 cm + 4 cm + 3 cm = 14 cm.</p><p>They are <b>different things</b>. Twelve unit squares make the rectangles 1 × 12, 2 × 6 and 3 × 4: all have A = 12 cm², and their perimeters are 26 cm, 16 cm and 14 cm. And the other way round, shapes with the same perimeter can have different areas. No formula: we count squares and sides.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
