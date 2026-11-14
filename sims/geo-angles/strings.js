/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of geo-angles, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The names of points, arms and parts (V, T, a, b, aVb, 1, 2) are data: the page writes
   them with translate="no". The title and subtitle come from sim.json. No degrees: grade 4 compares an angle with a
   right angle only (MAT OŠ C.4.1); measuring is grade 5. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Kvadratna mreža s kutom: vrh, dva kraka i dio ravnine između njih',

      // the audience switch (shared by the ari- and geo- pages)
      audLabel: 'Za koga',
      audGroup: 'Prikaz za',
      audTeacher: 'Učitelj',
      audAdult: 'Odrasli',
      audChild: 'Dijete',
      audTeacherHint: 'Za projekciju: sve postavke, tipična pogreška i pitanje prije odgovora.',
      audAdultHint: 'Uz svaki odgovor piše zašto vrijedi.',
      audChildHint: 'Velika slika, malo riječi.',

      // panel
      mode: 'Što gledamo',
      mode_kind: 'Vrsta kuta',
      mode_point: 'Točka',
      mode_name: 'Ime kuta',
      kb: 'Okreni krak b',
      la: 'Duljina kraka a',
      lb: 'Duljina kraka b',
      cmFmt: '{n} cm',
      shorter: 'Kraći krakovi',
      longer: 'Dulji krakovi',
      square: 'Trokut',
      squareHint: 'Prisloni trokut: vrh pravog kuta u V, rub na krak a.',
      swap: 'Zamijeni a i b',
      hide: 'Najprije pitaj',
      hideHint: 'Sakrij odgovor i najprije pitaj razred (V).',
      revealKey: 'Pokaži ili sakrij odgovor',
      reveal: 'Pokaži',
      dragHint: 'Povuci vrh V ili kraj kraka da ga okreneš i produljiš; klik na papir premješta točku T.',

      // presets
      p_kinds: 'Okreni krak b',
      p_short: 'Kratki krakovi',
      p_tilted: 'Nakrivljeni kut',
      p_near: 'Skoro pravi?',
      p_far: 'Daleko od vrha',
      p_arm: 'Na kraku',
      p_outside: 'Uz krak',
      p_name: 'Kut aVb',
      p_swap: 'Kut aVb, krakovi zamijenjeni',
      ph_kinds: 'Okreći krak b i gledaj kako se mijenja vrsta kuta.',
      ph_short: 'Mala slika, a kut? (V pokazuje)',
      ph_tilted: 'Nijedan krak nije vodoravan. (V pokazuje)',
      ph_near: 'Izgleda kao pravi. (V pokazuje)',
      ph_far: 'T je daleko od luka. (V pokazuje)',
      ph_arm: 'T je iza nacrtanog kraja kraka. (V pokazuje)',
      ph_outside: 'T je tik uz krak. (V pokazuje)',
      ph_name: 'Koji je dio kut aVb? (V pokazuje)',
      ph_swap: 'Isti krakovi, druga imena. (V pokazuje)',

      // legend
      legArms: 'krakovi',
      legAngle: 'kut',
      legArc: 'luk',

      // words on the paper
      wSquare: 'trokut',
      wAngle: 'kut aVb',
      wOther: 'kut bVa',
      wPart: 'dio {n}',

      // kinds
      k_acute: 'šiljasti',
      k_right: 'pravi',
      k_obtuse: 'tupi',
      k_big: 'veći od pola okreta',

      // the questions and the class's answers
      ask_kind: 'Koji je ovo kut?',
      ask_point: 'Pripada li T kutu aVb?',
      ask_name: 'Koji je dio kut aVb?',
      gAcute: 'Šiljasti',
      gRight: 'Pravi',
      gObtuse: 'Tupi',
      gYes: 'Pripada',
      gNo: 'Ne pripada',
      gOne: 'Dio 1',
      gTwo: 'Dio 2',
      guessWas: 'Odgovor razreda: {g}',
      gOk: 'točno',
      gBad: 'netočno',

      // mode kind: top
      kSay: 'Kut aVb je {kind}.',
      kSub_acute: 'Krak b prolazi unutar pravog kuta trokuta.',
      kSub_right: 'Krak b leži točno na rubu trokuta.',
      kSub_obtuse: 'Krak b prolazi izvan pravog kuta trokuta.',
      kSubPlain: 'vrh V · krakovi a i b',

      // mode point: top
      ptIn: 'T je između krakova.',
      ptVertex: 'T je vrh V.',
      ptArmA: 'T je na kraku a.',
      ptArmB: 'T je na kraku b.',
      ptOut: 'T nije između krakova.',
      ptYes: 'T pripada kutu aVb.',
      ptNo: 'T ne pripada kutu aVb.',

      // mode name: top
      nmSay: 'Kut aVb je dio {n}.',
      nmSub: 'Od a do b, suprotno od kazaljke na satu: {kind}',

      // captions: kind
      cAsk_kind: 'Razred odgovara: šiljasti, pravi ili tupi. V pokazuje odgovor.',
      cK_acute: 'Krak b prolazi unutar pravog kuta trokuta: kut aVb je manji od pravog, to je šiljasti kut.',
      cK_right: 'Krak b leži točno na drugom rubu trokuta: kut aVb je pravi. Pravi kut označavamo lukom s točkom.',
      cK_obtuse: 'Krak b prolazi izvan pravog kuta trokuta: kut aVb je veći od pravog, to je tupi kut.',
      cKArms: 'Produlji ili skrati krakove: kut ostaje isti.',
      cKp_acute: 'Kut aVb je manji od pravog kuta: to je šiljasti kut. Uključi „Trokut” i usporedi.',
      cKp_right: 'Kut aVb je pravi kut. Pravi kut označavamo lukom s točkom. Uključi „Trokut” i usporedi.',
      cKp_obtuse: 'Kut aVb je veći od pravog kuta: to je tupi kut. Uključi „Trokut” i usporedi.',
      cMist_notOnEdge: 'Česta pogreška: procjenjivati kut od oka. Trokut pokazuje da krak b leži točno na njegovu rubu: kut je pravi.',
      cMist_tilted: 'Česta pogreška: misliti da pravi kut mora stajati uspravno. I nakrivljen, kut je pravi kad krak b leži na rubu trokuta.',
      cMist_nearRight: 'Česta pogreška: misliti da je kut pravi jer tako izgleda. Krak b ne leži na rubu trokuta.',
      cMist_arms: 'Česta pogreška: suditi o kutu po duljini krakova ili veličini slike. Važno je koliko su krakovi razmaknuti: usporedi s pravim kutom trokuta.',
      whyKind: 'Zašto: kut trokuta je pravi kut. Kut manji od pravog je šiljasti, veći je tupi; krakovi mogu biti dugi ili kratki.',
      cKC_acute: 'Šiljasti kut!',
      cKC_right: 'Pravi kut!',
      cKC_obtuse: 'Tupi kut!',
      cAskC: 'Što misliš?',

      // captions: point
      cAsk_point: 'Razred odgovara: Pripada ili Ne pripada. V pokazuje odgovor.',
      cP_in: 'T je između krakova, pa pripada kutu aVb.',
      cP_inFar: 'Kut nije samo mali dio unutar luka: to je cijeli dio ravnine između krakova, i daleko od vrha.',
      cP_vertex: 'T je vrh V, a vrh pripada kutu.',
      cP_arm: 'T je na kraku, a krakovi pripadaju kutu aVb.',
      cP_armFar: 'Krak je polupravac: nastavlja se i iza dijela koji smo nacrtali.',
      cP_out: 'T nije između krakova: ne pripada kutu aVb. T je u drugom dijelu ravnine, u kutu bVa.',
      cMist_arcOnly: 'Česta pogreška: misliti da je kut samo mali dio unutar luka kojim ga označavamo.',
      cMist_onArm: 'Česta pogreška: misliti da vrh i krakovi ne pripadaju kutu, ili da krak završava gdje smo ga prestali crtati.',
      cMist_otherPart: 'Česta pogreška: misliti da T pripada kutu jer je blizu kraka ili vrha. T nije između krakova.',
      cMist_between: 'Česta pogreška: tražiti kut negdje drugdje. T je između krakova, tik uz vrh.',
      whyPoint: 'Zašto: krakovi su polupravci, pa se kut proteže sve do ruba papira i dalje. Točka mu pripada kad je između krakova ili na njima.',
      cPC_yes: 'Da! T pripada kutu.',
      cPC_no: 'Ne. T ne pripada kutu.',

      // captions: name
      cAsk_name: 'Razred odgovara: dio 1 ili dio 2. V pokazuje odgovor.',
      cN_one: 'Od kraka a do kraka b okrećemo se suprotno od kretanja kazaljke na satu i prolazimo dijelom 1: to je kut aVb. Dio 2 je kut bVa.',
      cN_two: 'Krakovi su zamijenjeni. Od a do b, suprotno od kretanja kazaljke na satu, sada prolazimo dijelom 2: kut aVb je veći od pola okreta. Dio 1 je sada kut bVa.',
      cMist_clockwise: 'Česta pogreška: kut aVb čitati u smjeru kazaljke na satu ili uvijek uzeti manji dio.',
      whyName: 'Zašto: dva kraka dijele ravninu na dva dijela i oba su kutovi. Oznaka aVb kaže kojim redom: od a do b, suprotno od kretanja kazaljke na satu.',
      cNC: 'Od a do b, suprotno od kazaljke na satu.',

      // stage labels
      kLabel: 'Kut aVb s vrhom V i krakovima a i b. {verdict}',
      ptLabel: 'Kut aVb i točka T. {verdict}',
      nmLabel: 'Dva kraka dijele ravninu na dio 1 i dio 2. {verdict}',

      explain: '<p>Dva <b>polupravca</b> sa zajedničkom početnom točkom dijele ravninu na dva dijela. Svaki od tih dijelova, zajedno s polupravcima, je <b>kut</b>. Zajednička točka je <b>vrh</b> kuta V, a polupravci su njegovi <b>krakovi</b> a i b. Kut nije samo mali dio unutar luka kojim ga označavamo: to je cijeli dio ravnine između krakova, a krakovi su polupravci, pa se nastavljaju i iza dijela koji smo nacrtali.</p><p>Kut <b>uspoređujemo s pravim kutom</b>, kutom trokuta: vrh pravog kuta trokuta stavimo u V, a rub na krak a. Ako krak b prolazi unutar pravog kuta, kut je <b>šiljasti</b>; ako leži na rubu trokuta, kut je <b>pravi</b>; ako prolazi izvan, kut je <b>tupi</b>. Duljina krakova pritom ništa ne mijenja.</p><p>Točka <b>pripada kutu</b> kad je između krakova, na kraku ili u vrhu. Oznaka <b>kut aVb</b> čita se od kraka a do kraka b <b>suprotno od kretanja kazaljke na satu</b>: zamijenimo li imena krakova, kut aVb postaje onaj drugi dio ravnine.</p>'
    },

    en: {
      stage: 'Squared paper with an angle: a vertex, two arms and the part of the plane between them',

      audLabel: 'For whom',
      audGroup: 'View for',
      audTeacher: 'Teacher',
      audAdult: 'Adult',
      audChild: 'Child',
      audTeacherHint: 'For the projector: every setting, the typical mistake, and asking before the answer.',
      audAdultHint: 'Each answer says why it holds.',
      audChildHint: 'A big picture, few words.',

      mode: 'What we look at',
      mode_kind: 'Kind of angle',
      mode_point: 'Point',
      mode_name: 'Naming',
      kb: 'Turn arm b',
      la: 'Length of arm a',
      lb: 'Length of arm b',
      cmFmt: '{n} cm',
      shorter: 'Shorter arms',
      longer: 'Longer arms',
      square: 'Set square',
      squareHint: 'Lay the set square: its right-angle corner at V, an edge on arm a.',
      swap: 'Swap a and b',
      hide: 'Ask first',
      hideHint: 'Hide the answer and ask the class first (V).',
      revealKey: 'Show or hide the answer',
      reveal: 'Show',
      dragHint: 'Drag the vertex V, or the end of an arm to turn and lengthen it; a click on the paper moves T.',

      p_kinds: 'Turn arm b',
      p_short: 'Short arms',
      p_tilted: 'A tilted angle',
      p_near: 'Almost right?',
      p_far: 'Far from the vertex',
      p_arm: 'On an arm',
      p_outside: 'Next to an arm',
      p_name: 'Angle aVb',
      p_swap: 'Angle aVb, arms swapped',
      ph_kinds: 'Turn arm b and watch the kind of angle change.',
      ph_short: 'A small picture, and the angle? (V shows)',
      ph_tilted: 'Neither arm is level. (V shows)',
      ph_near: 'It looks like a right angle. (V shows)',
      ph_far: 'T is far from the arc. (V shows)',
      ph_arm: 'T is past the drawn end of an arm. (V shows)',
      ph_outside: 'T is right next to an arm. (V shows)',
      ph_name: 'Which part is angle aVb? (V shows)',
      ph_swap: 'The same arms, other names. (V shows)',

      legArms: 'arms',
      legAngle: 'angle',
      legArc: 'arc',

      wSquare: 'set square',
      wAngle: 'angle aVb',
      wOther: 'angle bVa',
      wPart: 'part {n}',

      k_acute: 'acute',
      k_right: 'right',
      k_obtuse: 'obtuse',
      k_big: 'more than half a turn',

      ask_kind: 'What kind of angle is this?',
      ask_point: 'Does T belong to angle aVb?',
      ask_name: 'Which part is angle aVb?',
      gAcute: 'Acute',
      gRight: 'Right',
      gObtuse: 'Obtuse',
      gYes: 'Belongs',
      gNo: 'Does not belong',
      gOne: 'Part 1',
      gTwo: 'Part 2',
      guessWas: 'The class said: {g}',
      gOk: 'right',
      gBad: 'wrong',

      kSay: 'Angle aVb is {kind}.',
      kSub_acute: 'Arm b runs inside the set square\'s right angle.',
      kSub_right: 'Arm b lies exactly on the set square\'s edge.',
      kSub_obtuse: 'Arm b runs outside the set square\'s right angle.',
      kSubPlain: 'vertex V · arms a and b',

      ptIn: 'T is between the arms.',
      ptVertex: 'T is the vertex V.',
      ptArmA: 'T is on arm a.',
      ptArmB: 'T is on arm b.',
      ptOut: 'T is not between the arms.',
      ptYes: 'T belongs to angle aVb.',
      ptNo: 'T does not belong to angle aVb.',

      nmSay: 'Angle aVb is part {n}.',
      nmSub: 'From a to b, anticlockwise: {kind}',

      cAsk_kind: 'The class answers: acute, right or obtuse. V shows the answer.',
      cK_acute: 'Arm b runs inside the set square\'s right angle: angle aVb is smaller than a right angle, it is an acute angle.',
      cK_right: 'Arm b lies exactly on the set square\'s other edge: angle aVb is a right angle. A right angle is marked with an arc and a dot.',
      cK_obtuse: 'Arm b runs outside the set square\'s right angle: angle aVb is bigger than a right angle, it is an obtuse angle.',
      cKArms: 'Lengthen or shorten the arms: the angle stays the same.',
      cKp_acute: 'Angle aVb is smaller than a right angle: it is an acute angle. Turn on "Set square" and compare.',
      cKp_right: 'Angle aVb is a right angle. A right angle is marked with an arc and a dot. Turn on "Set square" and compare.',
      cKp_obtuse: 'Angle aVb is bigger than a right angle: it is an obtuse angle. Turn on "Set square" and compare.',
      cMist_notOnEdge: 'A common mistake: judging an angle by eye. The set square shows that arm b lies exactly on its edge: the angle is right.',
      cMist_tilted: 'A common mistake: thinking a right angle must stand upright. Tilted too, the angle is right when arm b lies on the set square\'s edge.',
      cMist_nearRight: 'A common mistake: thinking the angle is right because it looks so. Arm b does not lie on the set square\'s edge.',
      cMist_arms: 'A common mistake: judging an angle by the length of its arms or the size of the picture. What counts is how far apart the arms open: compare with the set square\'s right angle.',
      whyKind: 'Why: the set square\'s corner is a right angle. An angle smaller than a right angle is acute, a bigger one is obtuse; the arms may be long or short.',
      cKC_acute: 'An acute angle!',
      cKC_right: 'A right angle!',
      cKC_obtuse: 'An obtuse angle!',
      cAskC: 'What do you think?',

      cAsk_point: 'The class answers: Belongs or Does not belong. V shows the answer.',
      cP_in: 'T is between the arms, so it belongs to angle aVb.',
      cP_inFar: 'An angle is not only the small part inside the arc: it is the whole part of the plane between the arms, far from the vertex too.',
      cP_vertex: 'T is the vertex V, and the vertex belongs to the angle.',
      cP_arm: 'T is on an arm, and the arms belong to angle aVb.',
      cP_armFar: 'An arm is a ray: it goes on past the part we drew.',
      cP_out: 'T is not between the arms: it does not belong to angle aVb. T is in the other part of the plane, in angle bVa.',
      cMist_arcOnly: 'A common mistake: thinking an angle is only the small part inside the arc that marks it.',
      cMist_onArm: 'A common mistake: thinking the vertex and the arms do not belong to the angle, or that an arm ends where we stopped drawing it.',
      cMist_otherPart: 'A common mistake: thinking T belongs to the angle because it is close to an arm or to the vertex. T is not between the arms.',
      cMist_between: 'A common mistake: looking for the angle somewhere else. T is between the arms, close to the vertex.',
      whyPoint: 'Why: the arms are rays, so the angle reaches the edge of the paper and beyond. A point belongs to it when it is between the arms or on them.',
      cPC_yes: 'Yes! T belongs to the angle.',
      cPC_no: 'No. T does not belong to the angle.',

      cAsk_name: 'The class answers: part 1 or part 2. V shows the answer.',
      cN_one: 'From arm a to arm b we turn anticlockwise and pass through part 1: that is angle aVb. Part 2 is angle bVa.',
      cN_two: 'The arms are swapped. From a to b, anticlockwise, we now pass through part 2: angle aVb is more than half a turn. Part 1 is now angle bVa.',
      cMist_clockwise: 'A common mistake: reading angle aVb clockwise, or always taking the smaller part.',
      whyName: 'Why: two arms split the plane in two parts and both are angles. The name aVb says the order: from a to b, anticlockwise.',
      cNC: 'From a to b, anticlockwise.',

      kLabel: 'Angle aVb with vertex V and arms a and b. {verdict}',
      ptLabel: 'Angle aVb and a point T. {verdict}',
      nmLabel: 'Two arms split the plane into part 1 and part 2. {verdict}',

      explain: '<p>Two <b>rays</b> with a common starting point split the plane in two parts. Each of these parts, together with the rays, is an <b>angle</b>. The common point is the angle\'s <b>vertex</b> V and the rays are its <b>arms</b> a and b. An angle is not only the small part inside the arc that marks it: it is the whole part of the plane between the arms, and the arms are rays, so they go on past the part we drew.</p><p>We <b>compare an angle with a right angle</b>, the corner of a set square: put the set square\'s right-angle corner at V and an edge on arm a. If arm b runs inside the right angle, the angle is <b>acute</b>; if it lies on the set square\'s edge, the angle is <b>right</b>; if it runs outside, the angle is <b>obtuse</b>. The length of the arms changes nothing.</p><p>A point <b>belongs to an angle</b> when it is between the arms, on an arm or at the vertex. The name <b>angle aVb</b> is read from arm a to arm b <b>anticlockwise</b>: swap the arms\' names and angle aVb becomes the other part of the plane.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
