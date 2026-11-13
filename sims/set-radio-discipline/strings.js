/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of set-radio-discipline, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian: crews' loanwords (1st AD, gaffer, key grip,
   grip, PA, copy) and the terms marked (check) in NOTES.md "For the owner". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dvije minute radioveze na setu: kanali, preklapanja i poziv „Stop!”',
      dec: ',',

      channels: 'Razgovor unutar odjela',
      channels_one: 'na glavnom kanalu',
      channels_own: 'na kanalu odjela',
      rate: 'Svaki odjel javlja se svakih',
      rate_60: '1 min',
      rate_30: '30 s',
      rate_15: '15 s',
      len: 'Jedna poruka traje',
      lenOff: 'Kratke poruke: 4 s i „copy”.',
      short: 'Kratko, s „copy”',
      shortHint: 'Kome, od koga, što: 4 s; primatelj kaže „copy”.',
      side: 'Sporedni kanal',
      sideHint: 'Na glavnom kratak poziv, razgovor na sporednom.',
      word: 'Dogovorena riječ',
      wordHint: 'Za hitnoću: svi ostali prije pritiska čekaju sekundu tišine.',

      preset_crowded: 'Jedan kanal',
      hint_crowded: 'svakih 30 s po 12 s: stop se ne čuje',
      preset_quiet: 'Manje prometa',
      hint_quiet: 'iste navike, svake minute: 4 s',
      preset_own: 'Kanal po odjelu',
      hint_own: 'odjeli razgovaraju na svojim kanalima: 24 s',
      preset_short: '+ kratko, „copy”',
      hint_short: 'ništa se ne gubi bez znanja: 17 s',
      preset_side: '+ sporedni kanal',
      hint_side: 'razgovor između odjela izvan glavnog: 5 s',
      preset_word: '+ dogovorena riječ',
      hint_word: 'stop ide u prvoj tišini: 2 s',

      st_ad: '1st AD',
      st_camera: 'Kamera',
      st_electric: 'Elektrika (gaffer)',
      st_grip: 'Grip (key grip)',
      st_art: 'Rekvizita',
      st_base: 'PA na blokadi ceste',
      letter_ad: 'A',
      letter_camera: 'K',
      letter_electric: 'E',
      letter_grip: 'G',
      letter_art: 'R',
      letter_base: 'P',
      farNote: 'daleko: ne čuje set',

      ch_main: 'Glavni kanal',
      ch_mainSub: '1st AD i poruke za njega',
      ch_side: 'Sporedni kanal',
      ch_sideSub: 'razgovor maknut s glavnog',
      ch_own: 'Kanal odjela',
      queue: 'Čekaju glavni kanal',
      queueLabel: 'Čekaju glavni kanal, najviše {n} u istoj sekundi',
      qMax: 'najviše {n}',

      scHeard: 'Stop se čuje nakon',
      scNever: 'Stop se ne čuje',
      scNeverVal: 'ni do 2:00',
      scDoubled: 'Preklopljeno',
      scLost: 'Izgubljeno, a nitko ne zna',
      scRepeats: 'Ponovljeno',
      scWaiting: 'Čeka u 0:39',
      scBusy: 'Glavni zauzet prije stopa',
      busyOf: '{s} od 40 s',
      cmpHead: 'Isti promet',
      cmpNone: 'bez pravila',
      cmpAll: 'sa sva tri',
      cmpNever: 'ne čuje se',

      mkNeed: '0:40 treba stop',
      mkHeard: 'čuje se',
      mkNot: 'do 2:00 se ne čuje',

      what_msg: 'poruka',
      what_hail: 'kratak poziv na sporedni kanal',
      what_stop: 'Stop!',
      is_doubled: 'preklopljeno',
      is_lost: 'izgubljeno',
      is_repeat: 'ponovljeno',
      is_cut: 'prekinuto',
      barLabel: '{who}, {from}–{to}: {what}',

      legDoubled: 'preklopljeno: nitko ne čuje',
      legLost: 'izgubljeno bez znanja',
      legRepeat: 'ponovljeno',
      legCopy: '„copy” natrag',
      legStop: 'Stop! od 1st AD-a',

      sec: ['{n} s', '{n} s', '{n} s'],
      doubledN: ['{n} preklopljeni prijenos', '{n} preklopljena prijenosa', '{n} preklopljenih prijenosa'],
      lostN: ['{n} poruka izgubljena', '{n} poruke izgubljene', '{n} poruka izgubljeno'],
      triesN: ['{n} pokušaj', '{n} pokušaja', '{n} pokušaja'],

      capHeard: 'Stop se čuje nakon {d} ({tries}).',
      capNever: 'Stop se ne čuje do 2:00 ({tries}).',
      capCounts: '{doubled}; {lost} bez da itko zna.',
      capNoLost: '{doubled}; nijedna poruka nije izgubljena bez znanja.',
      why_far: 'PA na blokadi ne čuje set i pritisne preko stopa.',
      why_queue: 'Čim kanal utihne, svi koji čekaju pritisnu zajedno, i stop se preklopi s njima.',
      why_wait: 'Stop čeka {w} da završi poruka koja je već u eteru.',
      why_once: 'Stop ide čim kanal utihne, i nitko ne pritisne s njim.',
      why_busy: 'Kanal nijednom ne utihne dovoljno da stop prođe.',

      foot: 'Pojednostavljeno: brojke su izmišljene i služe za usporedbu. Konačnu riječ imaju sigurnosni brifing produkcije i šef odjela.',

      explain:
        '<p><b>Jedan glas u isto vrijeme.</b> Kanal ručne radiostanice nosi jedan glas. Tko pritisne dok netko drugi ' +
        'govori, ili dvoje koji pritisnu u istom trenutku, preklope se: ne čuje se nijedan. Onaj tko govori ne čuje ' +
        'nikoga, jer tipka je ili za govor ili za slušanje.</p>' +
        '<p><b>Red i trenutak tišine.</b> Tko čuje da je kanal zauzet, čeka. Ali svi koji čekaju pritisnu čim kanal ' +
        'utihne, i preklope se opet. Što više ljudi na kanalu i što dulje govore, to je red dulji, a „Stop!” čeka u ' +
        'istom redu kao i svi ostali.</p>' +
        '<p><b>Daleko.</b> PA (asistent produkcije) na blokadi ceste ne čuje set, pa pritisne kad god ima nešto reći, ' +
        'i preko 1st AD-a. Osluškivanje prije govora ne pomaže onome tko ne čuje.</p>' +
        '<p><b>Kanali.</b> Svaki odjel ima svoj kanal za svoj razgovor; glavni kanal pripada pozivima 1st AD-a i ' +
        'porukama za 1st AD-a. Razgovor između odjela: kratak poziv na glavnom („Grip, ovdje kamera, prijeđi na ' +
        'sporedni”), a razgovor na sporednom kanalu.</p>' +
        '<p><b>Kratko i potvrđeno.</b> Kome, od koga, što, a primatelj odgovori „copy” (primljeno). Bez toga se ' +
        'preklopljena poruka izgubi, a nitko ne zna; s „copy” pošiljatelj primijeti da odgovora nema i ponovi. To košta ' +
        'sekundu po poruci i štedi izgubljene.</p>' +
        '<p><b>Dogovorena riječ.</b> Dogovorena na sigurnosnom brifingu: prije svakog pritiska svi ostali pričekaju ' +
        'sekundu tišine, a hitni poziv s dogovorenom riječi ide odmah. Stop tako uzme prvu tišinu, prije reda. Ali ne ' +
        'može ući u tuđ govor, jer tko govori ne čuje ništa: uz duge poruke i dalje čeka da završe, uz kratke ne dugo. ' +
        'A tko je daleko, ne čuje ni riječ.</p>' +
        '<p><b>Isto kao u mreži.</b> Dijeljeni kanal, preklapanja i stanica koja ne čuje druge isti su mehanizam kao ' +
        'na stranicama <a href="../csma-cd/index.html">CSMA/CD</a> i <a href="../hidden-node/index.html">skriveni čvor</a>.</p>' +
        '<p><b>Pojednostavljeno.</b> Trajanja, učestalost i raspored poruka su izmišljeni ali uvjerljivi; domet, teren, ' +
        'jači signal koji nadjača slabiji i praćenje više kanala nisu u modelu, a stranica ne kaže zašto treba stati. ' +
        'Konačnu riječ imaju sigurnosni brifing produkcije i šef odjela.</p>'
    },
    en: {
      stage: 'Two minutes of radio on set: channels, doubled calls and the call to stop',
      dec: '.',

      channels: 'Talk within a department',
      channels_one: 'on the main channel',
      channels_own: 'on its own channel',
      rate: 'Each department talks every',
      rate_60: '1 min',
      rate_30: '30 s',
      rate_15: '15 s',
      len: 'One message takes',
      lenOff: 'Short messages: 4 s and "copy".',
      short: 'Short, with "copy"',
      shortHint: 'Who for, who from, what: 4 s; the receiver says "copy".',
      side: 'Side channel',
      sideHint: 'A short call on main, the talk on the side channel.',
      word: 'Agreed word',
      wordHint: 'For emergencies: everyone else waits a quiet second first.',

      preset_crowded: 'One channel',
      hint_crowded: '12 s every 30 s: the stop is not heard',
      preset_quiet: 'Less traffic',
      hint_quiet: 'same habits, every minute: 4 s',
      preset_own: 'Own channels',
      hint_own: 'departments talk on their own channels: 24 s',
      preset_short: '+ short, "copy"',
      hint_short: 'nothing lost unnoticed: 17 s',
      preset_side: '+ side channel',
      hint_side: 'talk between departments off main: 5 s',
      preset_word: '+ agreed word',
      hint_word: 'the stop goes in the first quiet second: 2 s',

      st_ad: '1st AD',
      st_camera: 'Camera',
      st_electric: 'Electric (gaffer)',
      st_grip: 'Grip (key grip)',
      st_art: 'Props',
      st_base: 'PA at the road block',
      letter_ad: 'A',
      letter_camera: 'C',
      letter_electric: 'E',
      letter_grip: 'G',
      letter_art: 'P',
      letter_base: 'B',
      farNote: 'far off: hears nobody on set',

      ch_main: 'Main channel',
      ch_mainSub: 'to and from the 1st AD',
      ch_side: 'Side channel',
      ch_sideSub: 'talk moved off main',
      ch_own: 'Department channel',
      queue: 'Waiting for main',
      queueLabel: 'Waiting for the main channel, at most {n} in one second',
      qMax: 'max {n}',

      scHeard: 'Stop heard after',
      scNever: 'Stop not heard',
      scNeverVal: 'by 2:00',
      scDoubled: 'Doubled',
      scLost: 'Lost, nobody knows',
      scRepeats: 'Repeated',
      scWaiting: 'Waiting at 0:39',
      scBusy: 'Main busy before the stop',
      busyOf: '{s} of 40 s',
      cmpHead: 'Same traffic',
      cmpNone: 'no practice',
      cmpAll: 'all three',
      cmpNever: 'not heard',

      mkNeed: '0:40 stop needed',
      mkHeard: 'heard',
      mkNot: 'not heard by 2:00',

      what_msg: 'message',
      what_hail: 'short call to the side channel',
      what_stop: 'Stop!',
      is_doubled: 'doubled',
      is_lost: 'lost',
      is_repeat: 'repeated',
      is_cut: 'cut off',
      barLabel: '{who}, {from}–{to}: {what}',

      legDoubled: 'doubled: nobody hears',
      legLost: 'lost, nobody knows',
      legRepeat: 'repeated',
      legCopy: '"copy" back',
      legStop: 'Stop! from the 1st AD',

      sec: ['{n} s', '{n} s'],
      doubledN: ['{n} doubled transmission', '{n} doubled transmissions'],
      lostN: ['{n} message lost', '{n} messages lost'],
      triesN: ['{n} try', '{n} tries'],

      capHeard: 'The stop is heard after {d} ({tries}).',
      capNever: 'The stop is not heard by 2:00 ({tries}).',
      capCounts: '{doubled}; {lost} without anyone knowing.',
      capNoLost: '{doubled}; no message lost without anyone knowing.',
      why_far: 'The PA at the road block hears nobody on set and presses over the stop.',
      why_queue: 'The moment the channel goes quiet, everyone waiting presses together, and the stop is doubled with them.',
      why_wait: 'The stop waits {w} for a message already on air to end.',
      why_once: 'The stop goes as soon as the channel is quiet, and nobody presses with it.',
      why_busy: 'The channel is never quiet long enough for the stop to get through.',

      foot: 'Simplified: the numbers are made up, for comparison. The production\'s safety briefing and the head of department have the final word.',

      explain:
        '<p><b>One voice at a time.</b> A handheld radio channel carries one voice. Whoever presses while someone else ' +
        'is talking, or two people who press at the same moment, block each other: neither is heard. Whoever is ' +
        'talking hears nobody, because the button is either talk or listen.</p>' +
        '<p><b>The queue and the quiet moment.</b> Whoever hears the channel busy waits. But everyone waiting presses ' +
        'the moment it goes quiet, and they double again. The more people on a channel and the longer they talk, the ' +
        'longer the queue, and "Stop!" waits in the same queue as everyone else.</p>' +
        '<p><b>Far off.</b> The PA (production assistant) at the road block hears nobody on set, so they press ' +
        'whenever they have something to say, even over the 1st AD. Listening first does not help someone who cannot ' +
        'hear.</p>' +
        '<p><b>Channels.</b> Each department has a channel for its own talk; the main channel belongs to the 1st AD\'s ' +
        'calls and to messages for the 1st AD. Talk between departments: a short call on main ("Grip from camera, go ' +
        'to the side channel"), the talk on the side channel.</p>' +
        '<p><b>Short and acknowledged.</b> Who for, who from, what, and whoever it is for says "copy". Without it a ' +
        'doubled message is lost and nobody knows; with "copy" the sender notices no answer came and repeats. It costs ' +
        'a second a message and saves the lost ones.</p>' +
        '<p><b>The agreed word.</b> Agreed in the safety briefing: before every press everyone else waits a quiet ' +
        'second, and an emergency call with the agreed word goes at once. So the stop takes the first quiet second, ' +
        'ahead of the queue. But it cannot cut into someone already talking, because whoever is talking hears nothing: ' +
        'with long messages it still waits for them to end, with short ones not for long. And whoever is far off does ' +
        'not hear the word either.</p>' +
        '<p><b>The same as in a network.</b> A shared channel, doubled transmissions and a station that cannot hear ' +
        'the others are the same mechanism as on the <a href="../csma-cd/index.html">CSMA/CD</a> and ' +
        '<a href="../hidden-node/index.html">hidden node</a> pages.</p>' +
        '<p><b>Simplified.</b> The lengths, rates and timing of the messages are made up but plausible; range, terrain, ' +
        'a stronger signal drowning a weaker one and listening to several channels are not in the model, and the page ' +
        'does not say why work has to stop. The production\'s safety briefing and the head of department have the ' +
        'final word.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
