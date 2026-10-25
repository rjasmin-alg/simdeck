/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of csma-cd, in both languages (docs/sim-ui.md §9). Same keys in hr and en. {name} is a
   placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). The glossary has none of this sim's terms
   yet, so the explanation writes the pairs out (English in italics, Croatian in parentheses; NOTES.md, Term pairs).
   Station letters, n, k and numbers are data, not language. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dijeljeni medij i vremenska crta odsječaka',
      pScene: 'Primjer',
      // params
      pStations: 'Broj stanica',
      pStationsFull: 'Veza punog dupleksa spaja točno dva kraja.',
      pDuplex: 'Način rada veze',
      half: 'polu-dupleks',
      full: 'puni dupleks',
      pFrameSlots: 'Duljina okvira (odsječaka)',
      pSeed: 'Sjeme slučajnog k',
      seedScript: 'iz primjera',
      bNewDraw: 'Nova izvlačenja',
      // presets
      prTwo: 'Dvije stanice, kolizija',
      prTwoHint: 'A izvlači k = 0, B k = 1',
      prSame: 'Isti k, nova kolizija',
      prSameHint: 'Obje izvlače k = 1, pa se sudaraju opet; raspon raste na 0…3',
      prWait: 'Čekaju isti okvir',
      prWaitHint: 'A i B čekaju da C završi, pa šalju istodobno',
      prThree: 'Tri stanice',
      prThreeHint: 'A prolazi, B i C se sudaraju još jednom',
      prFull: 'Puni dupleks',
      prFullHint: 'Računalo na vlastitom priključku preklopnika: nema kolizije',
      // legend
      legendSend: 'šalje (medij zauzet)',
      legendIdle: 'medij slobodan',
      legendColl: 'kolizija i ometanje',
      legendWait: 'odbrojava k',
      legendDefer: 'čeka zauzeti medij',
      legendNow: 'ovaj odsječak',
      // stage
      slot: 'odsječak',
      medium: 'medij',
      bus: 'dijeljeni medij (polu-dupleks)',
      link: 'veza punog dupleksa: svaki smjer svoj put',
      switchName: 'preklopnik',
      switchRef: 'preklopnik',
      laneTo: '{a} → {b}',
      mIdle: 'slobodan',
      mBusy: 'zauzet: {id}',
      mColl: 'kolizija',
      laneIdle: 'slobodno',
      laneBusy: 'okvir u prijenosu',
      phReady: 'okvir spreman',
      phIdle: 'nema okvira',
      phDefer: 'osluškuje: zauzeto, čeka',
      phSend: 'šalje {v}/{f}',
      phJam: 'kolizija · ometanje',
      phWait: 'odbrojava: {v}',
      phDone: 'isporučeno ✓',
      phGaveUp: 'okvir odbačen ⊘',
      drawLine: 'k = {k} iz 0…{max}',
      cellSend: '{id} šalje',
      cellEnd: '{id} završava okvir',
      cellJam: '{id} u koliziji',
      cellWait: '{id} odbrojava, još {v}',
      cellDefer: '{id} čeka zauzeti medij',
      cellDrop: '{id} odbacuje okvir',
      cellIdle: 'medij slobodan',
      cellColl: 'kolizija',
      // captions
      and: 'i',
      capStartHalf: ['{ids} ima okvir spreman. Prije slanja osluškuje dijeljeni medij.',
        '{ids} imaju okvir spreman. Prije slanja svaka osluškuje dijeljeni medij.',
        '{ids} imaju okvir spreman. Prije slanja svaka osluškuje dijeljeni medij.'],
      capLater: ['{ids} dobiva svoj okvir tek u odsječku {t}.', '{ids} dobivaju svoje okvire tek u odsječku {t}.', '{ids} dobivaju svoje okvire tek u odsječku {t}.'],
      capStartFull: 'A i preklopnik spojeni su vezom punog dupleksa: svaki ima svoj put za slanje i svoj za primanje.',
      capReady: ['{ids} ima okvir spreman.', '{ids} imaju okvir spreman.', '{ids} imaju okvir spreman.'],
      capFullIdle: 'nitko ne šalje; oba smjera su slobodna.',
      capSlot: 'Odsječak {t}:',
      capArrive: ['{ids} dobiva okvir.', '{ids} dobivaju okvire.', '{ids} dobivaju okvire.'],
      capCollNew: '{ids} nalaze medij slobodnim i šalju istodobno: kolizija.',
      capCollDefer: '{ids} čekaju kraj istog okvira i šalju čim se medij oslobodi (1-perzistentno): kolizija.',
      capCollSame: '{ids} imaju isti k = {k}, pa nakon odbrojavanja šalju istodobno: opet kolizija.',
      capJam: 'Svaka to primijeti dok šalje, pošalje signal ometanja i stane.',
      capDrawsSame: 'Svaka broji kolizije svog okvira: sada je n = {n}, pa biraju k između 0 i {max}: {list}.',
      capDrawsMixed: 'Svaki bira k prema svom n: {list}.',
      drawItem: '{id} k = {k}',
      drawItemN: '{id} (n = {n}, 0…{max}) k = {k}',
      capTie: '{ids} imaju isti k: sudarit će se opet.',
      capDrop: ['{ids}: šesnaesta kolizija istog okvira, okvir se odbacuje (previše kolizija).',
        '{ids}: šesnaesta kolizija istog okvira, okviri se odbacuju (previše kolizija).',
        '{ids}: šesnaesta kolizija istog okvira, okviri se odbacuju (previše kolizija).'],
      capStart: '{id} osluškuje, medij je slobodan, pa šalje okvir (1/{f}).',
      capStartAfterDefer: 'medij je slobodan i {id} odmah šalje (1/{f}): čekalo se samo da prethodni okvir završi.',
      capStartAfterWait: 'k je odbrojan; {id} osluškuje, medij je slobodan, pa šalje (1/{f}).',
      capStartK0: '{id} je izvukla k = 0, pa odmah osluškuje: medij je slobodan i šalje (1/{f}).',
      capContinue: '{id} šalje dalje ({v}/{f}).',
      capDeliver: '{id} šalje zadnji dio okvira bez kolizije: okvir je isporučen, a brojač n vraća se na 0.',
      capDefer: ['{ids} osluškuje: medij je zauzet okvirom stanice {by}, pa čeka i šalje čim se oslobodi.',
        '{ids} osluškuju: medij je zauzet okvirom stanice {by}, pa čekaju i šalju čim se oslobodi.',
        '{ids} osluškuju: medij je zauzet okvirom stanice {by}, pa čekaju i šalju čim se oslobodi.'],
      capWait: ['Odbrojava: {list}.', 'Odbrojavaju: {list}.', 'Odbrojavaju: {list}.'],
      waitItem: '{id} = {v}',
      capWaitDone: ['{ids} odbrojava zadnji odsječak; u sljedećem osluškuje medij.', '{ids} odbrojavaju zadnji odsječak; u sljedećem osluškuju medij.',
        '{ids} odbrojavaju zadnji odsječak; u sljedećem osluškuju medij.'],
      capIdle: 'nitko ne šalje, medij je slobodan.',
      capEnd: 'Kraj: isporučeno {frames}, {colls} u {slots}.',
      capEndDrop: 'Odbačeno: {n}.',
      frames: ['{n} okvir', '{n} okvira', '{n} okvira'],
      colls: ['{n} kolizija', '{n} kolizije', '{n} kolizija'],
      slots: ['{n} odsječak', '{n} odsječka', '{n} odsječaka'],
      capCap: ['Demonstracija staje nakon {slots}; još čeka: {ids}.', 'Demonstracija staje nakon {slots}; još čekaju: {ids}.', 'Demonstracija staje nakon {slots}; još čekaju: {ids}.'],
      capFullStart: 'A i preklopnik šalju istodobno, svaki svojim putem. Nema dijeljenog medija, pa nema ni kolizije: CSMA/CD nema što raditi.',
      capFullContinue: 'Oba okvira putuju dalje, svaki u svom smjeru.',
      capFullDeliver: 'Oba okvira stižu. U punom dupleksu CSMA/CD nije zamijenjen boljim mehanizmom: samo nema posla.',
      explain: '<p><b>CSMA/CD</b> (<i lang="en">Carrier Sense Multiple Access with Collision Detection</i>) pravilo je slanja na ' +
        '<i lang="en">shared medium</i> (dijeljeni medij) u <i lang="en">half duplex</i> (polu-dupleks) radu, npr. stanice na ' +
        'koncentratoru. Prije slanja stanica osluškuje medij, <i lang="en">carrier sense</i> (osluškivanje medija): ako je ' +
        'zauzet, čeka i šalje čim se oslobodi.</p>' +
        '<p>Osluškivanje ne sprječava sudar: dvije stanice koje u istom trenutku nađu medij slobodnim šalju obje, signali ' +
        'se preklope i nijedan se okvir ne može pročitati. To je <i lang="en">collision</i> (kolizija). Pošiljatelj je ' +
        'otkriva dok šalje, jer čuje nešto drugo od onoga što šalje; prekida slanje i šalje 32-bitni <i lang="en">jam ' +
        'signal</i> (signal ometanja) da je primijete svi.</p>' +
        '<p>Zatim svaka stanica u koliziji čeka slučajan broj <i lang="en">slot times</i> (vremenskih odsječaka): ' +
        '<i lang="en">binary exponential backoff</i> (binarno eksponencijalno odustajanje). Nakon n-te kolizije istog ' +
        'okvira k se bira između 0 i 2<sup>min(n, 10)</sup> − 1: 0…1, pa 0…3, pa 0…7. Dvije stanice s istim k opet se ' +
        'sudaraju, ali raspon raste pa sudar postaje sve manje vjerojatan. Nakon 16 kolizija okvir se odbacuje.</p>' +
        '<p>Odsječak traje 512 bitova (51,2 µs na 10 Mbit/s), a okvir mora imati barem 64 okteta = 512 bitova: pošiljatelj ' +
        'mora još slati kad vijest o koliziji stigne natrag do njega. Kraći okvir primatelj odbacuje kao ostatak ' +
        'kolizije. Zato se okvir može sudariti samo u svom prvom odsječku: nakon toga sve su ga stanice čule i čekaju. Ovdje okvir traje nekoliko odsječaka, bez rasprostiranja signala po kabelu.</p>' +
        '<p>U <i lang="en">full duplex</i> (puni dupleks) radu, npr. računalo na vlastitom priključku preklopnika, svaki ' +
        'smjer ima svoj put. Nema dijeljenog medija, nema kolizije, a CSMA/CD nema što raditi. Nije zamijenjen boljim ' +
        'mehanizmom; samo više nema posla. Skup uređaja koji se mogu sudariti je <i lang="en">collision domain</i> ' +
        '(kolizijska domena).</p>'
    },
    en: {
      stage: 'Shared medium and the slot timeline',
      pScene: 'Example',
      pStations: 'Stations',
      pStationsFull: 'A full-duplex link joins exactly two ends.',
      pDuplex: 'Link mode',
      half: 'half duplex',
      full: 'full duplex',
      pFrameSlots: 'Frame length (slots)',
      pSeed: 'Seed of the random k',
      seedScript: 'from the example',
      bNewDraw: 'New draws',
      prTwo: 'Two stations collide',
      prTwoHint: 'A draws k = 0, B draws k = 1',
      prSame: 'Same k, collide again',
      prSameHint: 'Both draw k = 1 and collide again; the range grows to 0…3',
      prWait: 'Waiting for the same frame',
      prWaitHint: 'A and B wait for C to finish, then send at once',
      prThree: 'Three stations',
      prThreeHint: 'A gets through, B and C collide once more',
      prFull: 'Full duplex',
      prFullHint: 'A computer on its own switch port: no collision',
      legendSend: 'sending (medium busy)',
      legendIdle: 'medium idle',
      legendColl: 'collision and jam',
      legendWait: 'counting k down',
      legendDefer: 'waits for the busy medium',
      legendNow: 'this slot',
      slot: 'slot',
      medium: 'medium',
      bus: 'shared medium (half duplex)',
      link: 'full-duplex link: one path per direction',
      switchName: 'switch',
      switchRef: 'the switch',
      laneTo: '{a} → {b}',
      mIdle: 'idle',
      mBusy: 'busy: {id}',
      mColl: 'collision',
      laneIdle: 'idle',
      laneBusy: 'frame on its way',
      phReady: 'frame ready',
      phIdle: 'no frame',
      phDefer: 'senses busy, waits',
      phSend: 'sending {v}/{f}',
      phJam: 'collision · jam',
      phWait: 'backoff counter: {v}',
      phDone: 'delivered ✓',
      phGaveUp: 'frame dropped ⊘',
      drawLine: 'k = {k} from 0…{max}',
      cellSend: '{id} sends',
      cellEnd: '{id} ends its frame',
      cellJam: '{id} collides',
      cellWait: '{id} counts down, {v} left',
      cellDefer: '{id} waits for the busy medium',
      cellDrop: '{id} drops the frame',
      cellIdle: 'medium idle',
      cellColl: 'collision',
      and: 'and',
      capStartHalf: ['{ids} has a frame ready. Before sending, it senses the shared medium.',
        '{ids} have a frame ready. Before sending, each senses the shared medium.'],
      capLater: ['{ids} gets its frame only in slot {t}.', '{ids} get their frames only in slot {t}.'],
      capStartFull: 'A and the switch are joined by a full-duplex link: each has its own path to send and its own to receive.',
      capReady: ['{ids} has a frame ready.', '{ids} have a frame ready.'],
      capFullIdle: 'nobody sends; both directions are idle.',
      capSlot: 'Slot {t}:',
      capArrive: ['{ids} gets a frame.', '{ids} get frames.'],
      capCollNew: '{ids} find the medium idle and send at once: collision.',
      capCollDefer: '{ids} were waiting for the same frame and send the moment the medium goes idle (1-persistent): collision.',
      capCollSame: '{ids} drew the same k = {k}, so they send at once when it runs out: collision again.',
      capJam: 'Each notices it while sending, sends a jam signal and stops.',
      capDrawsSame: 'Each counts the collisions of its own frame: now n = {n}, so they pick k from 0 to {max}: {list}.',
      capDrawsMixed: 'Each picks k by its own n: {list}.',
      drawItem: '{id} k = {k}',
      drawItemN: '{id} (n = {n}, 0…{max}) k = {k}',
      capTie: '{ids} have the same k: they will collide again.',
      capDrop: ['{ids}: the sixteenth collision of the same frame, so the frame is dropped (excessive collisions).',
        '{ids}: the sixteenth collision of the same frame, so the frames are dropped (excessive collisions).'],
      capStart: '{id} senses the medium idle and sends its frame (1/{f}).',
      capStartAfterDefer: 'the medium goes idle and {id} sends at once (1/{f}): it only waited for the previous frame to end.',
      capStartAfterWait: '{id} has counted its k down, senses the medium idle and sends (1/{f}).',
      capStartK0: '{id} drew k = 0, so it senses at once: the medium is idle and it sends (1/{f}).',
      capContinue: '{id} keeps sending ({v}/{f}).',
      capDeliver: '{id} sends the last part of its frame without a collision: the frame is delivered, and its counter n goes back to 0.',
      capDefer: ['{ids} senses the medium busy with {by}\'s frame, so it waits and sends as soon as it goes idle.',
        '{ids} sense the medium busy with {by}\'s frame, so they wait and send as soon as it goes idle.'],
      capWait: ['Counting down: {list}.', 'Counting down: {list}.'],
      waitItem: '{id} = {v}',
      capWaitDone: ['{ids} counts down its last slot and senses the medium in the next.', '{ids} count down their last slot and sense the medium in the next.'],
      capIdle: 'nobody sends, the medium is idle.',
      capEnd: 'Done: {frames} delivered, {colls} in {slots}.',
      capEndDrop: 'Dropped: {n}.',
      frames: ['{n} frame', '{n} frames'],
      colls: ['{n} collision', '{n} collisions'],
      slots: ['{n} slot', '{n} slots'],
      capCap: ['The demo stops after {slots}; still waiting: {ids}.', 'The demo stops after {slots}; still waiting: {ids}.'],
      capFullStart: 'A and the switch send at the same time, each on its own path. There is no shared medium, so no collision: CSMA/CD has nothing to do.',
      capFullContinue: 'Both frames travel on, each in its own direction.',
      capFullDeliver: 'Both frames arrive. In full duplex CSMA/CD was not replaced by something better: it simply has no work.',
      explain: '<p><b>CSMA/CD</b> (<i>Carrier Sense Multiple Access with Collision Detection</i>) is the rule for sending on a ' +
        '<i>shared medium</i> in <i>half duplex</i>, such as stations on a hub. Before sending, a station listens to the ' +
        'medium (<i>carrier sense</i>): if it is busy, the station waits and sends as soon as it goes idle.</p>' +
        '<p>Listening does not prevent a collision: two stations that find the medium idle at the same moment both send, ' +
        'the signals overlap and neither frame can be read. That is a <i>collision</i>. A sender detects it while sending, ' +
        'because it hears something other than what it sends; it stops and sends a 32-bit <i>jam signal</i> so that every ' +
        'station notices.</p>' +
        '<p>Then each colliding station waits a random number of <i>slot times</i>: <i>binary exponential backoff</i>. ' +
        'After the n-th collision of the same frame, k is drawn from 0 to 2<sup>min(n, 10)</sup> − 1: 0…1, then 0…3, ' +
        'then 0…7. Two stations with the same k collide again, but the range grows, so a repeat becomes less and less ' +
        'likely. After 16 collisions the frame is dropped.</p>' +
        '<p>A slot lasts 512 bit times (51.2 µs at 10 Mb/s), and a frame must be at least 64 octets = 512 bits: the sender ' +
        'must still be sending when the news of a collision gets back to it. A receiver drops anything shorter as a ' +
        'collision fragment. So a frame can only collide in its first slot: after that every station has heard it and ' +
        'waits. Here a frame lasts a few slots, without the signal travelling along the cable.</p>' +
        '<p>In <i>full duplex</i>, such as a computer on its own switch port, each direction has its own path. There is ' +
        'no shared medium and no collision, and CSMA/CD has nothing to do. It was not replaced by something better; it ' +
        'simply has no work left. The set of devices that can collide with each other is a <i>collision domain</i>.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
