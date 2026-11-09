/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ctcss, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). The radio terms are not in
   kit/glossary.js yet, so the term pairs are written out here (NOTES.md "Term pairs").
   Numbers come in already formatted (a decimal comma in Croatian). Station letters are data (translate="no").
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Repetitor R s tonskom šumnom bravom, stanice A, B i C, detektor tona i vremenska traka po četvrtinama sekunde',
      hz: '{f} Hz',
      // params
      squelch: 'Šumna brava na R',
      sqTone: 'tonska (CTCSS)',
      sqCarrier: 'po nositelju',
      rxTone: 'Postavljeni ton na R',
      schedule: 'Tko odašilje',
      schA: 'A',
      schB: 'B',
      schC: 'C',
      schAB: 'A i B',
      scheduleHint: 'Svaka 3 s od početka; uz A i B, B se uključuje u 1,5 s i odašilje do 3,5 s.',
      toneA: 'Ton stanice A',
      toneB: 'Ton stanice B',
      toneC: 'Ton stanice C',
      noTone: 'bez tona',
      weak: 'Preslaba stanica',
      weakNone: 'nijedna',
      // presets
      presetRight: 'Pravi ton',
      presetRightHint: 'A šalje 88,5 Hz: detektoru treba 0,5 s, tek onda se zvučnik otvara.',
      presetNo: 'Bez tona',
      presetNoHint: 'B ne šalje ton: tonska brava ostaje zatvorena. Prebaci R na bravu po nositelju.',
      presetWrong: 'Krivi ton',
      presetWrongHint: 'C šalje 91,5 Hz, samo 3 Hz od 88,5: detektor ga prepozna, ali to nije postavljeni ton.',
      presetHidden: 'Skriveni korisnik',
      presetHiddenHint: 'A govori s tonom, B bez tona upada u 1,5 s: slušatelj B nikad ne čuje, a A postaje nečitljiv.',
      // legend
      legendKeyed: 'odašilje (nositelj)',
      legendTone: 'šalje podzvučni ton',
      legendListen: 'detektor skuplja zvuk',
      legendFound: 'ton pronađen',
      legendOpen: 'zvučnik otvoren',
      legendMuted: 'zvučnik zatvoren',
      legendDouble: 'dupliranje: dva nositelja odjednom',
      legendChanged: 'promijenjeno u ovom koraku',
      // stations
      stationName: 'Stanica {id}',
      keyedOn: 'odašilje',
      keyedOff: 'ne odašilje',
      sends: 'šalje {f} Hz',
      sendsNone: 'bez tona',
      weakTag: 'preslaba: ispod praga',
      // repeater
      rRole: 'repetitor',
      modeTone: 'tonska šumna brava, {f} Hz',
      modeCarrier: 'šumna brava po nositelju',
      carrierYes: 'nositelj: ima ga',
      carrierNo: 'nositelj: nema, samo šum',
      spkOpen: 'zvučnik otvoren',
      spkMuted: 'zvučnik zatvoren',
      hearing: 'čuješ stanicu {st}',
      hearingDouble: '{a} i {b} odjednom: nečitljivo',
      filtered: 'ton se filtrira ispod 300 Hz: čuje se samo govor',
      mutedNoise: 'samo šum, nema što čuti',
      mutedWait: 'čeka ton',
      mutedWrong: 'nositelj bez postavljenog tona',
      mutedNext: 'otvara se od sljedeće četvrtine sekunde',
      // detector
      detName: 'Detektor tona',
      detOff: 'Isključen: brava po nositelju ne traži ton.',
      collected: 'skupljeno zvuka',
      ofHalf: '{x} od 0,5 s',
      best: 'najjači ton',
      over: '{m} dB iznad medijana',
      need: 'treba ≥ 12 dB',
      decSet: '{f} Hz: postavljeni ton',
      decOther: '{f} Hz: nije postavljeni ton',
      decNone: 'nema tona',
      decWait: 'čeka 0,5 s zvuka',
      decIdle: 'nema nositelja',
      checkOk: 'najnovijih 0,25 s: {f} Hz je još tu',
      checkLost: 'najnovijih 0,25 s: ton je nestao',
      chartLabel: 'Snaga na svih 49 standardnih tonova, u dB iznad medijana',
      axisMedian: 'medijan',
      axisThr: '+12 dB',
      axisSet: 'postavljeni',
      // strip
      rowDet: 'detektor',
      rowSpk: 'zvučnik',
      timeUnit: 's',
      slotLabel: 'Odsječak {n}',
      cellNone: 'nema',
      cellLost: 'nestao',
      // captions
      capStartTone: 'R ima tonsku šumnu bravu na {f} Hz: zvučnik se otvara samo za nositelja koji nosi taj podzvučni ton. Koračaj po četvrtinu sekunde.',
      capStartCarrier: 'R ima šumnu bravu po nositelju: zvučnik se otvara za svaki nositelj iznad praga, s tonom ili bez njega. Koračaj po četvrtinu sekunde.',
      capTime: '{a}–{b} s:',
      capKeyTone: '{st} uključuje odašiljač s tonom {f} Hz.',
      capKeyNoTone: '{st} uključuje odašiljač bez tona.',
      capKeyWeak: 'Stanica {st} uključuje odašiljač, ali je preslaba: ispod praga R čuje samo šum.',
      capRelease: '{st} isključuje odašiljač.',
      capNoise: 'Samo šum: zvučnik ostaje zatvoren.',
      capCarrierOff: 'Nositelja više nema: zvučnik se zatvara.',
      capToneOff: 'Nositelja više nema: zvučnik se zatvara, detektor se prazni.',
      capCarrierOpen: 'Nositelj je iznad praga: brava po nositelju otvara se odmah, s tonom ili bez. Čuješ stanicu {st}.',
      capFiltered: 'Njezin ton od {f} Hz filtrira se ispod 300 Hz, pa se ne čuje.',
      capDoubleCarrier: '{a} i {b} odašilju odjednom: dupliranje. Brava po nositelju propušta oba, nečitljivo.',
      capCarrierStay: 'Brava po nositelju ostaje otvorena: čuješ stanicu {st}.',
      capMutes: 'Zvučnik se zatvara.',
      capOpens: 'Zvučnik se otvara.',
      capStaysOpen: 'Zvučnik ostaje otvoren.',
      capStaysMuted: 'Zvučnik ostaje zatvoren.',
      capListen: 'R ima nositelj i skuplja zvuk: 0,25 od 0,5 s. Premalo za odluku.',
      capLock: 'Prijamnik je skupio 0,5 s zvuka: najjači ton je {f} Hz, {m} dB iznad medijana svih 49 tonova (treba 12). To je postavljeni ton, pa se zvučnik otvara od sljedeće četvrtine sekunde.',
      capLockClipped: 'Prvih {x} s govora je izgubljeno.',
      capOpen: 'Zvučnik je otvoren: čuješ stanicu {st}. Ton od {f} Hz filtrira se ispod 300 Hz, pa ga nitko ne čuje.',
      capOpensGarble: 'Zvučnik se otvara, ali samo za zbrku.',
      capHold: 'Ton je još tu ({m} dB iznad medijana): zvučnik ostaje otvoren, čuješ stanicu {st}.',
      capWrong: 'Najjači ton je {b} Hz, {m} dB iznad medijana: ton postoji, ali to nije postavljeni ton od {f} Hz.',
      capWrongSpill: 'I stupac za {f} Hz je visok: {b} Hz je samo {d} Hz dalje i prelijeva se u njega. Odlučuje samo najjači ton.',
      capNone: 'Najjači ton, {b} Hz, samo je {m} dB iznad medijana, manje od 12 dB: nema tona.',
      capTryCarrier: 'Prebaci R na bravu po nositelju: otvorit će se odmah.',
      capLost: 'Ton od {f} Hz nestao je iz najnovije četvrtine sekunde: R odmah zatvara zvučnik i ponovno skuplja zvuk.',
      capLostMix: 'U mješavini dvaju tonova {f} Hz više nije najjači: R odmah zatvara zvučnik i ponovno skuplja zvuk. Dva jednako jaka tona: odluka može skakati s jednog na drugi.',
      capLostStill: 'Stanica {st} je još u eteru, ali bez postavljenog tona.',
      capDoubleStart: 'Tonska brava se za stanicu {b} nikad ne bi otvorila, ali se nositelj stanice {b} miješa s nositeljem stanice {a}: dupliranje. Zvučnik je otvoren, a stanica {a} je nečitljiva.',
      capDoubleBoth: 'Obje stanice nose postavljeni ton, ali {a} i {b} odašilju odjednom: dupliranje. Zvučnik je otvoren, a čuje se samo zbrka.',
      capDoubleOn: 'Dupliranje traje: {a} i {b} odašilju odjednom, nečitljivo.',
      capDoubleMuted: 'Dva nositelja odjednom: dupliranje. Zvučnik je zatvoren, ali tko sluša bez tona, čuje samo zbrku.',
      capEndAll: 'Ukupno:',
      capEndOne: 'stanica {st} čuje se {h} s od {k} s u eteru.',
      capEndHidden: 'Slušatelj s tonskom bravom nikad nije čuo stanicu {b}, a ipak je nositelj stanice {b} pokvario odašiljanje stanice {a} od {t} s. CTCSS skriva druge korisnike od tebe; kanal ne postaje privatan.',
      // explanation
      explain:
        '<p><i>Squelch</i> (šumna brava) drži zvučnik zatvorenim dok na frekvenciji nema ničega osim šuma. Brava ' +
        '<b>po nositelju</b> otvara se čim primljeni signal prijeđe prag, za bilo koga. Slabiji signal od praga ostaje ' +
        'zatvoren kao i šum.</p>' +
        '<p><i>CTCSS</i> (tonska šumna brava) traži još nešto: uz govor odašiljač šalje stalni <i>sub-audible tone</i> ' +
        '(podzvučni ton), jedan od 49 standardnih između 67,0 i 254,1 Hz. Prijamnik otvara zvučnik samo kad pronađe ' +
        'baš svoj postavljeni ton. Ton se prije zvučnika filtrira (ispod oko 300 Hz), pa ga nitko ne čuje.</p>' +
        '<p>Detektor skupi 0,5 s demoduliranog zvuka (ton od 67 Hz u tom vremenu napravi oko 33 titraja), izmjeri ' +
        'snagu na svih 49 tonova i prihvati najjači samo ako je barem 12 dB iznad medijana svih 49. Pola sekunde daje ' +
        'razlučivost od oko 2 Hz, dovoljno za najbliže standardne tonove (2,4 Hz razmaka). Zato se tonska brava ne ' +
        'otvara odmah: prvih pola sekunde govora se gubi.</p>' +
        '<p>CTCSS kanal ne čini privatnim. Stanica bez tona ili s drugim tonom ne čuje se na tvom prijamniku, ali njen ' +
        'nositelj i dalje dijeli isti kanal: kad dvije stanice odašilju odjednom, repetitor prenosi zbrku ' +
        '(dupliranje). Zato se prije odašiljanja sluša bez tonske brave.</p>' +
        '<p>Izvan ovog prikaza: DCS (digitalno kodirana brava), ton od 1750 Hz za otvaranje repetitora, rep šumne ' +
        'brave i obrnuti fazni skok na kraju odašiljanja, te sam FM demodulator.</p>' +
        '<p class="sd-attrib">Šumna brava, prag i dupliranje prema tečaju 50ohm.de (DARC e.V., AJW-Referat, ' +
        'hrvatski prijevod), licenca CC BY 4.0, sažeto i prerađeno.</p>'
    },
    en: {
      stage: 'Repeater R with tone squelch, stations A, B and C, the tone detector and a time strip in quarter seconds',
      hz: '{f} Hz',
      squelch: 'Squelch on R',
      sqTone: 'tone (CTCSS)',
      sqCarrier: 'carrier',
      rxTone: 'Tone set on R',
      schedule: 'Who transmits',
      schA: 'A',
      schB: 'B',
      schC: 'C',
      schAB: 'A and B',
      scheduleHint: 'Each for 3 s from the start; with A and B, B keys up at 1.5 s and transmits until 3.5 s.',
      toneA: 'Station A tone',
      toneB: 'Station B tone',
      toneC: 'Station C tone',
      noTone: 'no tone',
      weak: 'Too weak a station',
      weakNone: 'none',
      presetRight: 'Right tone',
      presetRightHint: 'A sends 88.5 Hz: the detector needs 0.5 s before the speaker opens.',
      presetNo: 'No tone',
      presetNoHint: 'B sends no tone: tone squelch stays shut. Switch R to carrier squelch.',
      presetWrong: 'Wrong tone',
      presetWrongHint: 'C sends 91.5 Hz, 3 Hz from 88.5: the detector finds it, but it is not the set tone.',
      presetHidden: 'Hidden user',
      presetHiddenHint: 'A talks with the tone, B keys up without one at 1.5 s: the listener never hears B, and A becomes unreadable.',
      legendKeyed: 'transmitting (carrier)',
      legendTone: 'sends a sub-audible tone',
      legendListen: 'detector collecting audio',
      legendFound: 'tone found',
      legendOpen: 'loudspeaker open',
      legendMuted: 'loudspeaker muted',
      legendDouble: 'doubling: two carriers at once',
      legendChanged: 'changed in this step',
      stationName: 'Station {id}',
      keyedOn: 'transmitting',
      keyedOff: 'not transmitting',
      sends: 'sends {f} Hz',
      sendsNone: 'no tone',
      weakTag: 'too weak: under the threshold',
      rRole: 'repeater',
      modeTone: 'tone squelch, {f} Hz',
      modeCarrier: 'carrier squelch',
      carrierYes: 'carrier: present',
      carrierNo: 'carrier: none, noise only',
      spkOpen: 'loudspeaker open',
      spkMuted: 'loudspeaker muted',
      hearing: 'you hear {st}',
      hearingDouble: '{a} and {b} at once: unreadable',
      filtered: 'the tone is filtered out below 300 Hz: you hear only speech',
      mutedNoise: 'only noise, nothing to hear',
      mutedWait: 'waiting for the tone',
      mutedWrong: 'a carrier without the set tone',
      mutedNext: 'opens from the next quarter second',
      detName: 'Tone detector',
      detOff: 'Off: carrier squelch does not look for a tone.',
      collected: 'audio collected',
      ofHalf: '{x} of 0.5 s',
      best: 'strongest tone',
      over: '{m} dB over the median',
      need: 'needs ≥ 12 dB',
      decSet: '{f} Hz: the set tone',
      decOther: '{f} Hz: not the set tone',
      decNone: 'no tone',
      decWait: 'waiting for 0.5 s of audio',
      decIdle: 'no carrier',
      checkOk: 'newest 0.25 s: {f} Hz still there',
      checkLost: 'newest 0.25 s: the tone is gone',
      chartLabel: 'Power at all 49 standard tones, in dB over the median',
      axisMedian: 'median',
      axisThr: '+12 dB',
      axisSet: 'set',
      rowDet: 'detector',
      rowSpk: 'speaker',
      timeUnit: 's',
      slotLabel: 'Slot {n}',
      cellNone: 'none',
      cellLost: 'lost',
      capStartTone: 'R has tone squelch at {f} Hz: the loudspeaker opens only for a carrier that carries this sub-audible tone. Step a quarter second at a time.',
      capStartCarrier: 'R has carrier squelch: the loudspeaker opens for any carrier above the threshold, tone or not. Step a quarter second at a time.',
      capTime: '{a}–{b} s:',
      capKeyTone: '{st} keys up, sending a tone of {f} Hz.',
      capKeyNoTone: '{st} keys up without a tone.',
      capKeyWeak: '{st} keys up, but too weak: under the threshold, R hears only noise.',
      capRelease: '{st} releases.',
      capNoise: 'Only noise: the loudspeaker stays muted.',
      capCarrierOff: 'The carrier is gone: the loudspeaker mutes.',
      capToneOff: 'The carrier is gone: the loudspeaker mutes and the detector empties.',
      capCarrierOpen: 'The carrier is above the threshold: carrier squelch opens at once, tone or not. You hear {st}.',
      capFiltered: 'Its {f} Hz tone is filtered out below 300 Hz, so it is not heard.',
      capDoubleCarrier: '{a} and {b} transmit at once: doubling. Carrier squelch passes both, unreadable.',
      capCarrierStay: 'Carrier squelch stays open: you hear {st}.',
      capMutes: 'The loudspeaker mutes.',
      capOpens: 'The loudspeaker opens.',
      capStaysOpen: 'The loudspeaker stays open.',
      capStaysMuted: 'The loudspeaker stays muted.',
      capListen: 'R has a carrier and collects audio: 0.25 of 0.5 s. Too little to decide.',
      capLock: 'The receiver has collected 0.5 s of audio: the strongest tone is {f} Hz, {m} dB above the median of all 49 tones (12 needed). It is the set tone, so the loudspeaker opens from the next quarter second.',
      capLockClipped: 'The first {x} s of speech is lost.',
      capOpen: 'The loudspeaker is open: you hear {st}. The {f} Hz tone is filtered out below 300 Hz, so nobody hears it.',
      capOpensGarble: 'The loudspeaker opens, but only to garble.',
      capHold: 'The tone is still there ({m} dB over the median): the loudspeaker stays open, you hear {st}.',
      capWrong: 'The strongest tone is {b} Hz, {m} dB above the median: there is a tone, but not the set {f} Hz.',
      capWrongSpill: 'The {f} Hz bar is high too: {b} Hz is only {d} Hz away and spills into it. Only the strongest tone counts.',
      capNone: 'The strongest tone, {b} Hz, is only {m} dB above the median, short of 12 dB: no tone.',
      capTryCarrier: 'Switch R to carrier squelch: it opens at once.',
      capLost: 'The {f} Hz tone is gone from the newest quarter second: R mutes at once and collects audio again.',
      capLostMix: 'In the mix of two tones, {f} Hz is no longer the strongest: R mutes at once and collects audio again. With two equally strong tones the decision can jump from one to the other.',
      capLostStill: '{st} is still on the air, but without the set tone.',
      capDoubleStart: 'Tone squelch would never open for {b}, but the carrier of {b} mixes with the carrier of {a}: doubling. The loudspeaker is open, and {a} is unreadable.',
      capDoubleBoth: 'Both stations carry the set tone, but {a} and {b} transmit at once: doubling. The loudspeaker is open, and only garble comes out.',
      capDoubleOn: 'Doubling goes on: {a} and {b} transmit at once, unreadable.',
      capDoubleMuted: 'Two carriers at once: doubling. The loudspeaker is muted, but anyone listening without the tone hears only garble.',
      capEndAll: 'In all:',
      capEndOne: '{st} was heard for {h} s of {k} s on the air.',
      capEndHidden: 'The tone-squelch listener never heard {b}, yet the carrier of {b} ruined {a} from {t} s. CTCSS hides other users from you; it does not make the channel private.',
      explain:
        '<p>A <i>squelch</i> keeps the loudspeaker muted while there is nothing on the frequency but noise. ' +
        '<b>Carrier squelch</b> opens as soon as the received signal is above the threshold, for anyone. A signal ' +
        'weaker than the threshold stays muted, like noise.</p>' +
        '<p><i>CTCSS</i> (tone squelch) asks for more: along with the speech the transmitter sends a steady ' +
        '<i>sub-audible tone</i>, one of 49 standard tones between 67.0 and 254.1 Hz. The receiver opens the ' +
        'loudspeaker only when it finds its own set tone. The tone is filtered out before the loudspeaker (below ' +
        'about 300 Hz), so nobody hears it.</p>' +
        '<p>The detector collects 0.5 s of demodulated audio (a 67 Hz tone makes about 33 cycles in that time), ' +
        'measures the power at all 49 tones and accepts the strongest only if it is at least 12 dB above the median ' +
        'of all 49. Half a second gives a resolution of about 2 Hz, enough for the closest standard tones (2.4 Hz ' +
        'apart). That is why tone squelch does not open at once: the first half second of speech is lost.</p>' +
        '<p>CTCSS does not make a channel private. A station without the tone, or with another one, is not heard ' +
        'on your receiver, but its carrier still shares the channel: when two stations transmit at once, the ' +
        'repeater passes on garble (doubling). That is why you listen without tone squelch before you transmit.</p>' +
        '<p>Not shown: DCS (digital-coded squelch), the 1750 Hz tone burst that opens a repeater, the squelch tail ' +
        'and the reverse burst at the end of a transmission, and the FM demodulator itself.</p>' +
        '<p class="sd-attrib">Squelch, threshold and doubling after the 50ohm.de course (DARC e.V., AJW-Referat, ' +
        'Croatian translation), licence CC BY 4.0, summarised and adapted.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
