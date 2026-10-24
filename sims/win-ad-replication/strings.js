/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-ad-replication, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* marks an English term in italics on the Croatian page (the page turns it into <em lang="en">); none of the
   page's terms is in kit/glossary.js yet, so they are written out this way, English term then the Croatian in
   parentheses at the first mention (NOTES.md, "Term pairs"). The title and subtitle come from sim.json (title,
   concept). DC names, USNs, attribute names (telephoneNumber, title), phone numbers and times are data, shown with
   translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tri kontrolera domene u prstenu, svaki sa svojim USN-om, vektorom ažurnosti, gornjim oznakama i metapodacima atributa korisnika ana; uz njih povlačenje u ovom koraku i popis izvornih promjena',

      // DC cards
      thAttr: 'atribut',
      thValue: 'vrijednost',
      thVer: 'ver.',
      thOrig: 'izvor',
      thOrigUsn: 'izv. USN',
      thTime: 'vrijeme',
      thLocal: 'lok. USN',
      partner: 'partner',
      objOf: 'korisnik {u}',
      bWrites: 'piše',
      bPulls: 'povlači',
      bSends: 'šalje',
      vTitle0: 'asistentica',
      vTitle1: 'docentica',

      // the pull box
      boxStart: 'Polazno stanje',
      boxStartText: 'Sva tri DC-a su usklađena: svaki unos UTD i HWM jednak je partnerovu USN-u.',
      boxStartObj: 'Oba atributa korisnika {u} davno su zapisana na {dc}; svaki DC ih čuva pod svojim lokalnim USN-om.',
      boxWrite: 'Izvorna promjena na {dc}',
      boxVer: 'verzija {a} → {b}',
      boxOnlyThis: 'mijenjaju se samo USN i taj jedan atribut',
      boxPull: 'Povlačenje {dest} ← {src}',
      boxAsk: '{dest} traži promjene kojima je USN na {src} iznad {hwm}',
      boxNone: '{src} nema promjena iznad toga',
      outApplied: 'primijenjena, lokalni USN {usn}',
      outOver: 'prepisuje {held}',
      outLost: 'gubi, ostaje {held}',
      outUtd: 'izostavljena: UTD[{o}] = {v}',
      outOwn: 'izostavljena: promjena s {dest}',
      outSame: 'već je ima',
      boxUtd: 'UTD preuzima vektor od {src}',
      boxUtdSame: 'UTD ostaje',

      // the edits box
      editsTitle: 'Izvorne promjene',
      editsNone: 'još nijedna',
      heldBy: ['ima je {list}', 'imaju je {list}', 'imaju je {list}'],
      heldNone: 'nema je nijedan DC',
      fateKept: 'ostaje',
      fateOver: 'prepisana redom',
      fateLost: 'izgubljena',

      // packets
      chipN: ['{n} promjena', '{n} promjene', '{n} promjena'],
      chipNone: 'ništa',

      // controls
      pEdits1: 'Promjene na DC01',
      pEdit2: 'Mijenja i DC02',
      pT2: 'DC02 mijenja nakon',
      pSame: 'Isti atribut',
      pSameHint: 'Isključeno: DC02 mijenja title.',
      pDirect: 'DC03 povlači i izravno od DC01',
      prOne: 'Jedna promjena',
      prSame: 'Isti atribut: vrijeme',
      prVer: 'Verzija prije vremena',
      prDiff: 'Različiti atributi',
      prDamp: 'Prigušivanje',

      // legend
      lgPull: 'povlačenje',
      lgWin: 'pobjeđuje',
      lgLost: 'izgubljeno',
      lgSkip: 'izostavljeno (UTD)',
      lgChanged: 'promijenjeno u koraku',

      // captions: the start
      capStart: 'Tri DC-a u prstenu i svaki prima upise: *multi-master replication* (replikacija s više glavnih kopija). ' +
        'Svaki broji svoje promjene vlastitim brojačem, *update sequence number* (slijedni broj promjene, USN): DC01 je na ' +
        '{u1}, DC02 na {u2}, DC03 na {u3}. Ti brojevi nisu zajednički.',
      planOne: ['DC01 jednom mijenja {attr}.', 'DC01 mijenja {attr} {n} puta.', 'DC01 mijenja {attr} {n} puta.'],
      planSame: ['DC01 jednom mijenja {attr}, DC02 isti atribut {when}, prije nego što išta stigne do njega.',
        'DC01 mijenja {attr} {n} puta, DC02 isti atribut {when}, prije nego što išta stigne do njega.',
        'DC01 mijenja {attr} {n} puta, DC02 isti atribut {when}, prije nego što išta stigne do njega.'],
      planDiff: ['DC01 jednom mijenja {attr}, DC02 {attr2} {when}.',
        'DC01 mijenja {attr} {n} puta, DC02 {attr2} {when}.',
        'DC01 mijenja {attr} {n} puta, DC02 {attr2} {when}.'],
      whenAfter: '{t} s nakon prve promjene',
      whenSame: 'u istoj sekundi',

      // captions: a write
      capWrite: '*Originating write* (izvorna promjena) na {dc}: {attr} = {value}. USN na {dc} raste s {from} na {usn}, ' +
        'verzija atributa s {v0} na {v}; izvorni i lokalni USN su {usn}, vrijeme {time}.',
      capWriteAgain: 'Ponovna promjena istog atributa na {dc}: {attr} = {value}, USN {usn}, verzija {v}.',
      capConcurrent: '{dc} još nema promjenu s {other}: obje imaju verziju {v} i nijedna ne zna za drugu.',
      capConcurrentVer: ['{dc} još nema promjenu s {other}: ondje je verzija {vo}, ovdje {v}.', '{dc} još nema promjene s {other}: ondje je verzija {vo}, ovdje {v}.', '{dc} još nema promjene s {other}: ondje je verzija {vo}, ovdje {v}.'],

      // captions: a pull
      capPull: '{dest} traži od {src} promjene iznad svoje *high-watermark* (gornja oznaka) {hwm}.',
      capPullNone: '{dest} traži od {src} promjene iznad svoje gornje oznake {hwm}: nema ih.',
      capApplied: '{dest} zapisuje {attr} = {value} pod svojim USN-om {usn}, ali čuva izvorni USN {ou} s {od} — po tome ' +
        'drugi DC-ovi znaju da je već ima.',
      capAppliedShort: '{dest} zapisuje {attr} = {value} pod USN-om {usn} (izvorni USN {ou} s {od}).',
      capWinVersion: 'Sukob na {attr}: verzija {v} pobjeđuje verziju {vh}, iako je {held} upisan kasnije.',
      capWinVersionPlain: 'Sukob na {attr}: verzija {v} pobjeđuje verziju {vh}.',
      capWinTime: 'Ista verzija {v} na oba DC-a: pobjeđuje kasnije vrijeme, {value}.',
      capWinId: 'Ista verzija {v} i isto vrijeme: pobjeđuje veći invocationID, {od}.',
      capLostVersion: '{attr} = {value} s {od} gubi: {dest} ima verziju {vh}, veću od {v}, pa je zadržava i ne troši USN.',
      capLostTime: '{attr} = {value} s {od} gubi: ista verzija {v}, a {held} na {dest} upisan je kasnije. {dest} ne troši USN.',
      capLostId: '{attr} = {value} s {od} gubi: ista verzija i vrijeme, a {hd} ima veći invocationID.',
      capLostSeen: '{dest} ju je ipak vidio: njegov UTD za {od} raste na {u}.',
      capUtd: '{src} izostavlja {attr} s {od} (izvorni USN {ou}): *up-to-dateness vector* (vektor ažurnosti) od {dest} ' +
        'za {od} već je {v} — promjena je stigla drugim putem.',
      capUtdLost: '{src} izostavlja {attr} = {value} s {od}: UTD od {dest} za {od} već je {v}. Taj je vektor {dest} preuzeo od DC-a na kojem je ta promjena izgubila sukob, pa se ona više ne šalje.',
      capOwn: '{src} izostavlja {attr}: ta je promjena nastala na samom {dest}.',
      capSame: '{dest} već ima tu promjenu {attr}.',
      capHwm: 'Gornja oznaka za {src} raste s {from} na {to}.',

      // captions: the end
      capEndKept: 'Sva tri DC-a imaju iste vrijednosti. Ništa nije izgubljeno.',
      capEndLost: 'Sva tri DC-a imaju iste vrijednosti. {value} s {dc} izgubljen je, a nitko o tome ne dobiva poruku.',

      explain: '<p>Svaki kontroler domene prima upise. Svaki broji svoje promjene vlastitim brojačem, ' +
        '<em lang="en">update sequence number</em> (slijedni broj promjene, USN). USN-ovi nisu zajednički: ista promjena ' +
        'ima na svakom DC-u drugi lokalni USN.</p>' +
        '<p>Uz svaki atribut DC čuva metapodatke replikacije: verziju, izvorni DC, izvorni USN i vrijeme izvorne promjene, ' +
        'te svoj lokalni USN. <em lang="en">Originating write</em> (izvorna promjena) postavlja sve to; replicirana ' +
        'promjena dobiva novi lokalni USN, a izvorne podatke zadržava.</p>' +
        '<p>DC povlači promjene od partnera. Za svakog partnera pamti <em lang="en">high-watermark</em> (gornja oznaka): ' +
        'partnerov USN do kojeg je već pitao. Partner šalje samo atribute s lokalnim USN-om iznad nje, i to njihovu ' +
        'trenutnu vrijednost; nepromijenjeni atributi i ostatak objekta ne putuju.</p>' +
        '<p><em lang="en">Up-to-dateness vector</em> (vektor ažurnosti) za svaki izvorni DC pamti najveći izvorni USN koji ' +
        'je već stigao. Promjenu koju odredište već ima izvor izostavlja: <em lang="en">propagation dampening</em> ' +
        '(prigušivanje širenja). Zato promjena koja stiže dvama putovima prelazi svaki DC samo jednom.</p>' +
        '<p>Sukob se razrješava po atributu: veća verzija pobjeđuje; uz istu verziju kasnije vrijeme; uz isto vrijeme veći ' +
        'invocationID izvornog DC-a (pravi su invocationID-ovi GUID-ovi, pa je taj ishod zapravo slučajan; ovdje ime DC-a ' +
        'stoji umjesto njega). Najnovija promjena dakle ne pobjeđuje uvijek, a promjene različitih atributa istog ' +
        'objekta nikad nisu u sukobu. Gubitnik nestaje bez poruke.</p>' +
        '<p>Ova stranica ne prikazuje rasporede, lokacije ni KCC, sukobe imena ni vraćanje USN-a.</p>'
    },

    en: {
      stage: 'Three domain controllers in a ring, each with its USN, up-to-dateness vector, high-watermarks and the metadata of user ana\'s attributes; beside them this step\'s pull and the list of originating writes',

      // DC cards
      thAttr: 'attribute',
      thValue: 'value',
      thVer: 'ver',
      thOrig: 'origin',
      thOrigUsn: 'orig. USN',
      thTime: 'time',
      thLocal: 'loc. USN',
      partner: 'partner',
      objOf: 'user {u}',
      bWrites: 'writes',
      bPulls: 'pulls',
      bSends: 'sends',
      vTitle0: 'assistant',
      vTitle1: 'lecturer',

      // the pull box
      boxStart: 'Start',
      boxStartText: 'All three DCs are in step: every UTD and HWM entry equals the partner\'s USN.',
      boxStartObj: 'Both attributes of user {u} were written on {dc} long ago; each DC keeps them under its own local USN.',
      boxWrite: 'Originating write on {dc}',
      boxVer: 'version {a} → {b}',
      boxOnlyThis: 'only the USN and that one attribute change',
      boxPull: 'Pull {dest} ← {src}',
      boxAsk: '{dest} asks for changes whose USN on {src} is above {hwm}',
      boxNone: '{src} has no changes above it',
      outApplied: 'applied, local USN {usn}',
      outOver: 'overwrites {held}',
      outLost: 'loses, {held} stays',
      outUtd: 'left out: UTD[{o}] = {v}',
      outOwn: 'left out: a change from {dest}',
      outSame: 'already held',
      boxUtd: 'UTD takes over the vector of {src}',
      boxUtdSame: 'UTD unchanged',

      // the edits box
      editsTitle: 'Originating writes',
      editsNone: 'none yet',
      heldBy: ['held by {list}', 'held by {list}'],
      heldNone: 'no DC holds it',
      fateKept: 'stays',
      fateOver: 'replaced in order',
      fateLost: 'lost',

      // packets
      chipN: ['{n} change', '{n} changes'],
      chipNone: 'nothing',

      // controls
      pEdits1: 'Edits on DC01',
      pEdit2: 'DC02 edits too',
      pT2: 'DC02 edits after',
      pSame: 'Same attribute',
      pSameHint: 'Off: DC02 changes title.',
      pDirect: 'DC03 also pulls from DC01 directly',
      prOne: 'One change',
      prSame: 'Same attribute: time',
      prVer: 'Version beats time',
      prDiff: 'Different attributes',
      prDamp: 'Dampening',

      // legend
      lgPull: 'a pull',
      lgWin: 'wins',
      lgLost: 'lost',
      lgSkip: 'left out (UTD)',
      lgChanged: 'changed in this step',

      // captions: the start
      capStart: 'Three DCs in a ring, and each takes writes: multi-master replication. Each counts its own changes with its ' +
        'own counter, the update sequence number (USN): DC01 is at {u1}, DC02 at {u2}, DC03 at {u3}. The numbers are not ' +
        'shared.',
      planOne: ['DC01 changes {attr} once.', 'DC01 changes {attr} {n} times.'],
      planSame: ['DC01 changes {attr} once; DC02 changes the same attribute {when}, before anything has reached it.',
        'DC01 changes {attr} {n} times; DC02 changes the same attribute {when}, before anything has reached it.'],
      planDiff: ['DC01 changes {attr} once; DC02 changes {attr2} {when}.',
        'DC01 changes {attr} {n} times; DC02 changes {attr2} {when}.'],
      whenAfter: '{t} s after the first edit',
      whenSame: 'in the same second',

      // captions: a write
      capWrite: 'An originating write on {dc}: {attr} = {value}. The USN of {dc} goes from {from} to {usn}, the attribute\'s ' +
        'version from {v0} to {v}; the originating and local USN are {usn}, the time {time}.',
      capWriteAgain: 'Another change of the same attribute on {dc}: {attr} = {value}, USN {usn}, version {v}.',
      capConcurrent: '{dc} does not have the change from {other} yet: both are version {v} and neither knows of the other.',
      capConcurrentVer: ['{dc} does not have the change from {other} yet: there it is version {vo}, here {v}.', '{dc} does not have the changes from {other} yet: there it is version {vo}, here {v}.'],

      // captions: a pull
      capPull: '{dest} asks {src} for changes above its high-watermark {hwm}.',
      capPullNone: '{dest} asks {src} for changes above its high-watermark {hwm}: there are none.',
      capApplied: '{dest} stores {attr} = {value} under its own USN {usn} but keeps the originating USN {ou} from {od} — ' +
        'that is how the other DCs know it already has it.',
      capAppliedShort: '{dest} stores {attr} = {value} under USN {usn} (originating USN {ou} from {od}).',
      capWinVersion: 'A conflict on {attr}: version {v} beats version {vh}, although {held} was written later.',
      capWinVersionPlain: 'A conflict on {attr}: version {v} beats version {vh}.',
      capWinTime: 'Same version {v} on both DCs: the later time wins, {value}.',
      capWinId: 'Same version {v} and the same time: the higher invocationID wins, {od}.',
      capLostVersion: '{attr} = {value} from {od} loses: {dest} has version {vh}, higher than {v}, keeps it and uses no USN.',
      capLostTime: '{attr} = {value} from {od} loses: the same version {v}, and {held} on {dest} was written later. {dest} uses no USN.',
      capLostId: '{attr} = {value} from {od} loses: the same version and time, and {hd} has the higher invocationID.',
      capLostSeen: '{dest} has still seen it: its UTD for {od} rises to {u}.',
      capUtd: '{src} leaves out {attr} from {od} (originating USN {ou}): the up-to-dateness vector of {dest} for {od} is ' +
        'already {v} — the change came another way.',
      capUtdLost: '{src} leaves out {attr} = {value} from {od}: the UTD of {dest} for {od} is already {v}. {dest} took that vector over from a DC where this change lost the conflict, so it is not sent again.',
      capOwn: '{src} leaves out {attr}: that change was made on {dest} itself.',
      capSame: '{dest} already has that change of {attr}.',
      capHwm: 'The high-watermark for {src} goes from {from} to {to}.',

      // captions: the end
      capEndKept: 'All three DCs hold the same values. Nothing was lost.',
      capEndLost: 'All three DCs hold the same values. {value} from {dc} is lost, and nobody is told.',

      explain: '<p>Every domain controller takes writes. Each counts its own changes with its own counter, the ' +
        '<em lang="en">update sequence number</em> (USN). USNs are not shared: the same change has a different local USN ' +
        'on every DC.</p>' +
        '<p>With every attribute a DC keeps its replication metadata: the version, the originating DC, the originating ' +
        'USN and time, and its own local USN. An <em lang="en">originating write</em> sets all of these; a replicated ' +
        'change gets a new local USN and keeps the originating data.</p>' +
        '<p>A DC pulls changes from its partners. For each partner it remembers a <em lang="en">high-watermark</em>: the ' +
        'partner\'s USN up to which it has already asked. The partner sends only attributes with a local USN above it, ' +
        'with their current value; unchanged attributes and the rest of the object do not travel.</p>' +
        '<p>The <em lang="en">up-to-dateness vector</em> holds, for every originating DC, the highest originating USN that ' +
        'has already arrived. A change the destination already has is left out by the source: ' +
        '<em lang="en">propagation dampening</em>. So a change that arrives by two paths crosses each DC only once.</p>' +
        '<p>A conflict is resolved per attribute: the higher version wins; with the same version the later time; with ' +
        'the same time the higher invocationID of the originating DC (real invocationIDs are GUIDs, so that outcome is ' +
        'effectively arbitrary; here the DC name stands in for it). So the latest edit does not always win, and ' +
        'changes to different attributes of one object never conflict. The loser disappears without a message.</p>' +
        '<p>Schedules, sites and the KCC, naming conflicts and USN rollback are not on this page.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
