/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of csma-ca-rts-cts, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). Croatian terms follow the URM book, ch. 17 (and sims/hidden-node): skriveni
   čvor, stanica, access point (in italics, untranslated, as in the book), okvir, potvrda primitka (ACK), polje
   trajanja, NAV (virtualni osjetnik zauzeća medija), slučajno čekanje, odsječak. None of them is in kit/glossary.js
   yet, so they are written out here (NOTES.md, "Term pairs"). A, B, C, the frame names (RTS, CTS, DATA, ACK), DIFS,
   SIFS, CW and the numbers are data, shown with translate="no".
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Stanice A i C, access point B, tko koga čuje, i vremenska crta po odsječcima',
      rtscts: 'RTS/CTS',
      hidden: 'A i C se ne čuju',
      threshold: 'RTS_Threshold',
      dataA: 'DATA od A',
      dataC: 'DATA od C',
      backoffA: 'Brojač A',
      backoffC: 'Brojač C',
      seed: 'Sjeme',
      presetHiddenNoRts: 'Skriveni čvor, bez RTS/CTS',
      presetHiddenNoRtsHint: 'Poglavlje 17, Primjer 1: A i C izvuku isti broj. Što B čuje? Kako A i C saznaju da nešto nije u redu?',
      presetHiddenRts: 'Skriveni čvor, s RTS/CTS',
      presetHiddenRtsHint: 'Isti raspored, RTS/CTS uključen. Odakle C zna da treba šutjeti kad nikad ne čuje A?',
      presetNotHidden: 'Stanice se čuju',
      presetNotHiddenHint: 'A i C se čuju, bez RTS/CTS-a. Što se događa s brojačem od C dok A šalje?',
      presetRtsCollision: 'Sudar RTS okvira',
      presetRtsCollisionHint: 'Skriveni čvor, RTS/CTS uključen, isti broj kao u prvom primjeru. Koliko se odsječaka izgubi sada, a koliko bez RTS/CTS-a?',
      presetThreshold: 'Prag RTS_Threshold',
      presetThresholdHint: 'Prag je 3 odsječka: A šalje kratak okvir, C dug. Koja stanica šalje RTS, i zašto?',
      legendA: 'okvir od A',
      legendC: 'okvir od C',
      legendB: 'odgovor od B',
      legendGarbage: 'B čuje samo smetnju',
      legendNav: 'NAV: šuti',
      legendFrozen: 'brojač stoji',
      station: 'stanica',
      ap: 'access point',
      rangeOf: 'domet {who}',
      inRange: 'A ↔ C: u dometu',
      outRange: 'A ↔ C: izvan dometa',
      rowAtB: 'B čuje',
      slot: 'odsječak',
      counter: 'brojač',
      navUntil: 'NAV do {until}.',
      attempt: '{k}. pokušaj',
      stDifs: 'čeka DIFS',
      stCount: 'odbrojava',
      stGo: 'brojač na 0, šalje sljedeće',
      stTx: 'dobila CTS, šalje DATA',
      stFrozen: 'medij zauzet, brojač stoji',
      stNav: 'NAV: šuti',
      stSend: 'šalje',
      stAwait: 'čeka odgovor',
      stDone: 'isporučeno',
      stBSend: 'šalje odgovor',
      stBGarbage: 'samo smetnja',
      stBHear: 'prima',
      stBQuiet: 'tišina',
      factDelivered: 'Isporučeno',
      factGarbage: 'Odsječci smetnje na B',
      factSlots: 'Odsječak',
      captionStart: '{hearing} {rtsState} Obje stanice imaju okvir za B. Prije slanja svaka čeka DIFS i odbrojava slučajno čekanje: A od {a}, C od {c}. Pritisni → za sljedeći događaj.',
      startHidden: 'A i C se ne čuju, ali obje čuju B.',
      startHear: 'A i C se čuju, i obje čuju B.',
      rtsOn: 'RTS/CTS je uključen.',
      rtsOff: 'RTS/CTS je isključen.',
      rtsThreshold: 'RTS/CTS je uključen za okvire dulje od {th} odsječka.',
      evFirst: 'Odsječak 1 je slobodan (DIFS): A i C počinju odbrojavati.',
      evDifsStart: 'Odsječak 1 je slobodan (DIFS): {who} počinje odbrojavati od {bo}.',
      evZeroDifs: '{who} ima brojač 0: šalje odmah nakon DIFS-a.',
      evStart: '{who} je odbrojala do 0 i šalje {kind} prema B ({k}. pokušaj).',
      evStartBoth: 'A i C su došle do 0 u istom odsječku i obje šalju (A {ka}, C {kc}): nijedna ne zna za drugu.',
      evStartRts: '{who} je odbrojala do 0 i šalje RTS; polje trajanja: {dur} odsječaka.',
      evNoRts: 'Okvir od {who} je kratak (≤ praga), pa ide bez RTS-a.',
      evUnheard: '{who} ne čuje {other} i broji dalje.',
      evCollide: 'Na B se preklapaju dva okvira: B čuje samo smetnju. Ni A ni C to ne primjećuju dok šalju.',
      evReplyCts: 'B odgovara CTS-om nakon SIFS-a; polje trajanja: {dur} odsječaka.',
      evReplyData: '{who} je dobila CTS i šalje DATA.',
      evReplyAck: 'B je ispravno primio okvir od {owner} i nakon SIFS-a vraća ACK.',
      evNav: '{who} čuje {kind} od {from} i postavlja NAV do {until}. odsječka.',
      evNavHidden: '{who} ne čuje {other}, ali čuje CTS od B. Polje trajanja kaže {dur} odsječaka, pa {who2} postavlja NAV (virtualni osjetnik zauzeća medija) do {until}. odsječka i šuti.',
      evFreeze: '{who} čuje da je medij zauzet: brojač staje na {bo}.',
      evResume: '{who} je opet čula DIFS slobodan i nastavlja od {bo}, gdje je stala.',
      evTimeout: '{who} nije dobila {kind}: okvir je izgubljen. CW se udvostručuje na {cw}, novo izvlačenje: {bo}.',
      evDelivered: 'Stigao je ACK: okvir od {who} je isporučen.',
      evQuiet: 'Medij je tih.',
      captionEnd: 'Gotovo u {n}. odsječku. Smetnja na B: {lost}.',
      captionCut: 'Prikaz staje nakon {n} odsječaka; nisu isporučena oba okvira.',
      slots: ['{n} odsječak', '{n} odsječka', '{n} odsječaka'],
      explain: '<p><strong>Zašto izbjegavanje, a ne otkrivanje.</strong> Bežična stanica dok šalje ne čuje nikog ' +
        'drugog: vlastiti signal nadjača sve. Zato 802.11 ne može otkriti sudar kao Ethernet (CSMA/CD), nego ga ' +
        'izbjegava (CSMA/CA): prije slanja medij mora biti slobodan jedan DIFS, a zatim stanica odbrojava ' +
        '<em>random backoff</em> (slučajno čekanje) od 0 do CW odsječaka. Dok čuje da je medij zauzet, brojač stoji i ' +
        'nastavlja se nakon novog DIFS-a.</p>' +
        '<p><strong>Gubitak se vidi po izostanku potvrde.</strong> Svaki jednoodredišni okvir B potvrđuje ACK-om ' +
        '(potvrda primitka) nakon kratkog SIFS-a. Ako ACK ne stigne, pošiljatelj pretpostavi da je okvir izgubljen, ' +
        'udvostruči CW (15, 31, 63 … do 1023) i pokuša ponovno.</p>' +
        '<p><strong>Skriveni čvor.</strong> Osluškivanje je lokalno. A i C čuju <em>access point</em> B, ali ne jedna ' +
        'drugu, pa C odbrojava i šalje dok A šalje, a okviri se preklope na B: to je <em>hidden node</em> (skriveni ' +
        'čvor). Pogrešno je misliti da C čeka jer čuje A: C A uopće ne čuje.</p>' +
        '<p><strong>RTS/CTS.</strong> A najprije pošalje kratak RTS, B odgovori CTS-om. Oba nose polje trajanja do kraja ' +
        'razmjene, a svaka stanica koja čuje bilo koji od njih upiše ga u <em>NAV</em> (Network Allocation Vector, ' +
        'virtualni osjetnik zauzeća medija) i šuti. C dobiva poruku od B, kojeg čuje. RTS/CTS ne sprječava sve sudare: ' +
        'dva RTS-a se još mogu sudariti, ali gube jedan odsječak, ne cijeli okvir. Zato se uključuje pragom ' +
        '(RTS_Threshold), samo za dulje okvire. Stanica koja ne čuje ni RTS ni CTS ne zna za rezervaciju.</p>' +
        '<p><strong>Pojednostavnjenje.</strong> Vrijeme teče u odsječcima: RTS, CTS i ACK traju jedan, DATA 2 do 6, ' +
        'DIFS jedan, SIFS je granica između dva odsječka. <em>Brojač A</em> i <em>Brojač C</em> su prva izvlačenja ' +
        '(0 … 15), a ponovna se izvlače iz <em>sjemena</em>, da se svaki prikaz ponovi jednako. <em>DATA od A/C</em> ' +
        'je duljina okvira u odsječcima; RTS_Threshold: RTS/CTS samo za okvire dulje od praga, 0 za svaki. Jedan korak ' +
        'je jedan događaj, ne jedan odsječak.</p>'
    },
    en: {
      stage: 'Stations A and C, access point B, who hears whom, and a timeline in slots',
      rtscts: 'RTS/CTS',
      hidden: 'A and C cannot hear each other',
      threshold: 'RTS_Threshold',
      dataA: 'A\'s DATA',
      dataC: 'C\'s DATA',
      backoffA: 'A\'s counter',
      backoffC: 'C\'s counter',
      seed: 'Seed',
      presetHiddenNoRts: 'Hidden node, no RTS/CTS',
      presetHiddenNoRtsHint: 'Chapter 17, Primjer 1: A and C draw the same number. What does B hear? How do A and C learn that something went wrong?',
      presetHiddenRts: 'Hidden node, with RTS/CTS',
      presetHiddenRtsHint: 'The same line-up, RTS/CTS on. How does C know to keep quiet when it never hears A?',
      presetNotHidden: 'Stations hear each other',
      presetNotHiddenHint: 'A and C hear each other, no RTS/CTS. What happens to C\'s counter while A sends?',
      presetRtsCollision: 'RTS frames collide',
      presetRtsCollisionHint: 'Hidden node, RTS/CTS on, the same draw as in the first preset. How many slots are lost now, and how many without RTS/CTS?',
      presetThreshold: 'RTS_Threshold',
      presetThresholdHint: 'The threshold is 3 slots: A sends a short frame, C a long one. Which station sends an RTS, and why?',
      legendA: 'frame from A',
      legendC: 'frame from C',
      legendB: 'reply from B',
      legendGarbage: 'B hears only noise',
      legendNav: 'NAV: keeps quiet',
      legendFrozen: 'counter frozen',
      station: 'station',
      ap: 'access point',
      rangeOf: 'range of {who}',
      inRange: 'A ↔ C: in range',
      outRange: 'A ↔ C: out of range',
      rowAtB: 'B hears',
      slot: 'slot',
      counter: 'counter',
      navUntil: 'NAV to {until}',
      attempt: 'attempt {k}',
      stDifs: 'waits DIFS',
      stCount: 'counts down',
      stGo: 'counter at 0, sends next',
      stTx: 'got the CTS, sends DATA',
      stFrozen: 'medium busy, counter frozen',
      stNav: 'NAV: keeps quiet',
      stSend: 'sends',
      stAwait: 'awaits the reply',
      stDone: 'delivered',
      stBSend: 'sends a reply',
      stBGarbage: 'only noise',
      stBHear: 'receives',
      stBQuiet: 'silence',
      factDelivered: 'Delivered',
      factGarbage: 'Slots of noise at B',
      factSlots: 'Slot',
      captionStart: '{hearing} {rtsState} Both stations have a frame for B. Before sending, each waits DIFS and counts down a random backoff: A from {a}, C from {c}. Press → for the next event.',
      startHidden: 'A and C cannot hear each other, but both hear B.',
      startHear: 'A and C hear each other, and both hear B.',
      rtsOn: 'RTS/CTS is on.',
      rtsOff: 'RTS/CTS is off.',
      rtsThreshold: 'RTS/CTS is on for frames longer than {th} slots.',
      evFirst: 'Slot 1 is idle (DIFS): A and C start counting down.',
      evDifsStart: 'Slot 1 is idle (DIFS): {who} starts counting down from {bo}.',
      evZeroDifs: '{who} has a counter of 0: it sends right after DIFS.',
      evStart: '{who} has counted down to 0 and sends {kind} to B (attempt {k}).',
      evStartBoth: 'A and C both reached zero in the same slot and both send (A {ka}, C {kc}): neither knows about the other.',
      evStartRts: '{who} has counted down to 0 and sends an RTS; Duration field: {dur} slots.',
      evNoRts: '{who}\'s frame is short (≤ the threshold), so it goes without an RTS.',
      evUnheard: '{who} does not hear {other} and keeps counting.',
      evCollide: 'Two frames overlap at B: B hears only noise. Neither A nor C notices anything while sending.',
      evReplyCts: 'B answers with a CTS after SIFS; Duration field: {dur} slots.',
      evReplyData: '{who} got the CTS and sends DATA.',
      evReplyAck: 'B received the frame from {owner} intact and sends an ACK after SIFS.',
      evNav: '{who} hears the {kind} from {from} and sets its NAV to slot {until}.',
      evNavHidden: '{who} does not hear {other}, but hears the CTS from B. The Duration field says {dur} slots, so {who2} sets its NAV (Network Allocation Vector) to slot {until} and keeps quiet.',
      evFreeze: '{who} hears the medium busy: its counter stops at {bo}.',
      evResume: '{who} has heard the medium idle for DIFS again and resumes from {bo}, where it stopped.',
      evTimeout: '{who} got no {kind}: the frame is lost. CW doubles to {cw}; new draw: {bo}.',
      evDelivered: 'The ACK has arrived: the frame from {who} is delivered.',
      evQuiet: 'The medium is idle.',
      captionEnd: 'Done in slot {n}. Noise at B: {lost}.',
      captionCut: 'The run stops after {n} slots; not both frames were delivered.',
      slots: ['{n} slot', '{n} slots'],
      explain: '<p><strong>Avoid, because you cannot detect.</strong> A wireless station that is sending hears no one ' +
        'else: its own signal drowns everything. So 802.11 cannot detect a collision the way Ethernet does (CSMA/CD); ' +
        'it avoids one (CSMA/CA): before sending, the medium must be idle for one DIFS, then the station counts down a ' +
        'random backoff of 0 to CW slots. While it hears the medium busy, the counter stops, and it resumes after a ' +
        'new DIFS.</p>' +
        '<p><strong>A loss shows as a missing acknowledgement.</strong> B acknowledges every unicast frame with an ACK ' +
        'after a short SIFS. If the ACK does not come, the sender assumes the frame was lost, doubles CW (15, 31, 63 … ' +
        'up to 1023) and tries again.</p>' +
        '<p><strong>The hidden node.</strong> Carrier sense is local. A and C hear the access point B, but not each ' +
        'other, so C counts down and sends while A is sending, and the frames overlap at B. It is wrong to think that ' +
        'C waits because it hears A: C does not hear A at all.</p>' +
        '<p><strong>RTS/CTS.</strong> A first sends a short RTS, and B answers with a CTS. Both carry a Duration field ' +
        'up to the end of the exchange, and every station that hears either writes it into its NAV (Network Allocation ' +
        'Vector) and keeps quiet. C gets the message from B, which it does hear. RTS/CTS does not prevent every ' +
        'collision: two RTS frames can still collide, but they lose one slot, not a whole frame. That is why a ' +
        'threshold (RTS_Threshold) switches it on for longer frames only. A station that hears neither the RTS nor ' +
        'the CTS does not know about the reservation.</p>' +
        '<p><strong>A simplification.</strong> Time runs in slots: RTS, CTS and ACK take one, DATA 2 to 6, DIFS one, ' +
        'and SIFS is the boundary between two slots. <em>A\'s counter</em> and <em>C\'s counter</em> are the first ' +
        'draws (0 … 15); the retries are drawn from the <em>seed</em>, so every run replays the same. <em>A\'s/C\'s ' +
        'DATA</em> is the frame length in slots; RTS_Threshold: RTS/CTS only for frames longer than the threshold, 0 ' +
        'for every frame. One step is one event, not one slot.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
