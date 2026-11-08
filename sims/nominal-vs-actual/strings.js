/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of nominal-vs-actual, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term.
   Terms missing from kit/glossary.js are written out (term*) and listed in NOTES.md. Croatian terms: URM ch06, ch07. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Nazivna propusnost i ostvarena brzina prijenosa',
      dec: ',',

      rate: 'Nazivna propusnost',
      packet: 'Veličina IP paketa',
      l1: 'Preambula + razmak',
      l2: 'Ethernet + FCS',
      l34: 'TCP/IP zaglavlja',
      duplex: 'Dupleks',
      full: 'puni',
      'half-both': 'polu, oba smjera',
      stations: 'Stanice koje šalju',
      stationsOff: 'Puni dupleks: svaka stanica ima svoju vezu, nitko ne dijeli medij.',
      loss: 'Izgubljeni okviri',
      unit: 'Jedinica',
      unitMb: 'Mb/s',
      unitMB: 'MB/s',

      'preset_book-ex1': '100 Mb/s, mjereno 82',
      'hint_book-ex1': 'Primjer 1: zaglavlja objašnjavaju oko 5 Mb/s; probaj gubitak 14 %',
      'preset_book-ex4': 'Preglednik: 11 MB/s',
      'hint_book-ex4': 'Primjer 4: bajtovi u sekundi, ne bitovi',
      'preset_tiny-frames': 'Najmanji okviri',
      'hint_tiny-frames': '1 Gb/s, paketi od 46 B: 1\u00a0488\u00a0095 okvira u sekundi',
      'preset_gigabit-full': 'Gigabit, veliki okviri',
      'hint_gigabit-full': 'Isključi preambulu i razmak: koliko oni koštaju?',
      'preset_shared-hub': 'Koncentrator, 3 stanice',
      'hint_shared-hub': 'Polu-dupleks: tri stanice dijele isti medij',

      legData: 'korisni podaci',
      legL34: 'TCP/IP zaglavlja',
      legL2: 'Ethernet zaglavlje + FCS',
      legL1: 'preambula + razmak',
      legShare: 'drugima (dijeljeni medij)',
      legRetry: 'ponovno slanje',
      legChanged: 'promijenjeno zadnjom postavkom',

      roadTitle: 'Širina ceste = nazivna propusnost',
      roadFinish: 'cilj',
      roadCars: ['{n} vozilo od 20 nosi korisne podatke do cilja', '{n} vozila od 20 nose korisne podatke do cilja', '{n} vozila od 20 nosi korisne podatke do cilja'],
      resTitle: 'Ostvarena brzina prijenosa',
      resOther: '= {v}',
      resFps: '{v} okvira/s na vezi',
      resEff: 'učinkovitost okvira {v} %',

      barNominal: 'nazivna propusnost {v}',
      barAchieved: 'ostvareno {v}',
      segData: 'Korisni podaci',
      segL34: 'TCP/IP zaglavlja',
      segL2: 'Ethernet zaglavlje + FCS',
      segL1: 'Preambula + razmak',
      segShare: 'Drugim stanicama',
      segRetry: 'Ponovno slanje',
      percent: '{v} %',
      mbps: '{v} Mb/s',
      mBps: '{v} MB/s',
      gbps: '{v} Gb/s',
      bytes: '{v} B',

      frameTitle: 'Jedan okvir na žici, u mjerilu: {w} B, od toga {d} B korisnih podataka',
      f_preamble: 'preambula + SFD',
      f_dst: 'odredište',
      f_src: 'izvor',
      f_type: 'tip',
      f_ip: 'IP',
      f_tcp: 'TCP',
      f_data: 'podaci',
      f_pad: 'nadopuna',
      f_fcs: 'FCS',
      f_gap: 'razmak',

      termNominal: '<i lang="en">nominal bandwidth</i> (nazivna propusnost)',
      termOverhead: '<i lang="en">overhead</i> (režijski trošak)',
      termHalf: '<i lang="en">half duplex</i> (polu-dupleks)',
      termCollision: '<i lang="en">collision</i> (kolizija)',

      capTotal: 'Od {wire} okteta na žici korisno je {data}: [[achieved throughput]] je {v} na vezi nazivne propusnosti {r}, bez ikakvog kvara.',
      capOff: 'Bez {off}, od {wire} okteta na žici korisno je {data}: {v} od {r}. Stvarni promet ih ipak nosi.',
      capLoss: '{p} % okvira se izgubi i šalje ponovno: od {g} korisnih ostaje {v} od nazivnih {r}.',
      capDuplex: 'Na polu-dupleksu oba smjera čekaju svoj red: svaki dobiva {v} od nazivnih {r}. Ništa nije pokvareno; medij je dijeljen.',
      capShared: ['{n} stanica dijeli isti polu-dupleksni medij: svaka dobiva {v} od nazivnih {r}. Ništa nije pokvareno; medij je dijeljen.',
        '{n} stanice dijele isti polu-dupleksni medij: svaka dobiva {v} od nazivnih {r}. Ništa nije pokvareno; medij je dijeljen.',
        '{n} stanica dijeli isti polu-dupleksni medij: svaka dobiva {v} od nazivnih {r}. Ništa nije pokvareno; medij je dijeljen.'],
      capLossToo: 'U tome je već uračunato {p} % okvira poslanih ponovno.',
      capBytes: 'U bajtovima: {mb} ÷ 8 = {MB}.',
      offL1: 'preambule + razmaka',
      offL2: 'Ethernet zaglavlja + FCS-a',
      offL34: 'TCP/IP zaglavlja',
      offAnd: ' i ',

      explain:
        '<p>U analogiji ceste {nb} je širina ceste: koliko veza po specifikaciji može nositi. Vozila koja stvarno stignu ' +
        'do cilja su [[achieved throughput]]. Ona je gotovo uvijek manja, iz triju razloga, a nijedan nije kvar.</p>' +
        '<p><b>Uokvirivanje.</b> Svaki paket putuje kao Ethernet [[frame]]: 8 B preambule i graničnika početka okvira, 14 B ' +
        'zaglavlja, 4 B provjere ispravnosti okvira (FCS) i 12 B tišine prije sljedećeg okvira. TCP i IP dodaju još 40 B. ' +
        'Uz pakete od 1500 B taj {oh} je 78 od 1538 B (5 %), uz pakete od 46 B 78 od 84 B (93 %).</p>' +
        '<p><b>Dijeljeni medij.</b> Na koncentratoru je veza {hd}: medijem u jednom trenutku putuje samo jedan okvir, pa ' +
        'se svi koji šalju izmjenjuju. Na punom dupleksu (preklopnik) svaki smjer ima cijelu propusnost. Ovdje su ' +
        'zanemareni {co} i čekanje nakon nje; stvarna ostvarena brzina je još manja.</p>' +
        '<p><b>Ponovno slanje.</b> Izgubljen okvir šalje se ponovno i medij zauzima dvaput.</p>' +
        '<p><b>Jedinice.</b> Propusnost se mjeri u bitovima u sekundi, preglednik pokazuje bajtove u sekundi: 11 MB/s je ' +
        '88 Mb/s.</p>' +
        '<p><b>Kodiranje nije oduzeto.</b> Oglašenih 10, 100 ili 1000 Mb/s već su podaci nakon linijskog kodiranja: 10 Mb/s ' +
        's Manchester kodiranjem na žici je 20 Mbauda, 100 Mb/s s 4B/5B 125 Mbauda. Zato kodiranje nije dio trake ' +
        '(simulator „Linijsko kodiranje: NRZ i Manchester”).</p>'
    },
    en: {
      stage: 'Nominal bandwidth and achieved throughput',
      dec: '.',

      rate: 'Nominal bandwidth',
      packet: 'IP packet size',
      l1: 'Preamble + gap',
      l2: 'Ethernet + FCS',
      l34: 'TCP/IP headers',
      duplex: 'Duplex',
      full: 'full',
      'half-both': 'half, both ways',
      stations: 'Stations sending',
      stationsOff: 'Full duplex: every station has its own link, nobody shares the medium.',
      loss: 'Frames lost',
      unit: 'Unit',
      unitMb: 'Mb/s',
      unitMB: 'MB/s',

      'preset_book-ex1': '100 Mb/s, measured 82',
      'hint_book-ex1': 'Example 1: headers explain about 5 Mb/s; try a loss of 14 %',
      'preset_book-ex4': 'Browser: 11 MB/s',
      'hint_book-ex4': 'Example 4: bytes per second, not bits',
      'preset_tiny-frames': 'Smallest frames',
      'hint_tiny-frames': '1 Gb/s, 46 B packets: 1\u00a0488\u00a0095 frames per second',
      'preset_gigabit-full': 'Gigabit, large frames',
      'hint_gigabit-full': 'Turn off preamble and gap: what do they cost?',
      'preset_shared-hub': 'Hub, 3 stations',
      'hint_shared-hub': 'Half duplex: three stations share one medium',

      legData: 'useful data',
      legL34: 'TCP/IP headers',
      legL2: 'Ethernet header + FCS',
      legL1: 'preamble + gap',
      legShare: 'others (shared medium)',
      legRetry: 'retries',
      legChanged: 'changed by the last setting',

      roadTitle: 'Road width = nominal bandwidth',
      roadFinish: 'finish',
      roadCars: ['{n} car of 20 carries useful data to the finish', '{n} cars of 20 carry useful data to the finish'],
      resTitle: 'Achieved throughput',
      resOther: '= {v}',
      resFps: '{v} frames/s on the link',
      resEff: 'frame efficiency {v} %',

      barNominal: 'nominal bandwidth {v}',
      barAchieved: 'achieved {v}',
      segData: 'Useful data',
      segL34: 'TCP/IP headers',
      segL2: 'Ethernet header + FCS',
      segL1: 'Preamble + gap',
      segShare: 'Other stations',
      segRetry: 'Retries',
      percent: '{v} %',
      mbps: '{v} Mb/s',
      mBps: '{v} MB/s',
      gbps: '{v} Gb/s',
      bytes: '{v} B',

      frameTitle: 'One frame on the wire, to scale: {w} B, {d} B of it useful data',
      f_preamble: 'preamble + SFD',
      f_dst: 'destination',
      f_src: 'source',
      f_type: 'type',
      f_ip: 'IP',
      f_tcp: 'TCP',
      f_data: 'data',
      f_pad: 'padding',
      f_fcs: 'FCS',
      f_gap: 'gap',

      termNominal: 'nominal bandwidth',
      termOverhead: 'overhead',
      termHalf: 'half duplex',
      termCollision: 'collision',

      capTotal: 'Of {wire} octets on the wire, {data} are useful: the [[achieved throughput]] is {v} on a link with a nominal bandwidth of {r}, and nothing is broken.',
      capOff: 'Without the {off}, {data} of {wire} octets on the wire are useful: {v} of {r}. Real traffic carries them all the same.',
      capLoss: '{p} % of frames are lost and sent again: of {g} of useful data, {v} remain of the nominal {r}.',
      capDuplex: 'On half duplex the two directions take turns: each gets {v} of the nominal {r}. Nothing is broken; the medium is shared.',
      capShared: ['{n} station uses one half-duplex medium: it gets {v} of the nominal {r}. Nothing is broken; the medium is shared.',
        '{n} stations share one half-duplex medium: each gets {v} of the nominal {r}. Nothing is broken; the medium is shared.'],
      capLossToo: 'That already counts {p} % of frames sent again.',
      capBytes: 'In bytes: {mb} ÷ 8 = {MB}.',
      offL1: 'preamble + gap',
      offL2: 'Ethernet header + FCS',
      offL34: 'TCP/IP headers',
      offAnd: ' and ',

      explain:
        '<p>The {nb} is the width of the road: what the link can carry by specification. The [[achieved throughput]] is ' +
        'the cars that actually reach the finish. It is almost always lower, for three reasons, and none of them is a ' +
        'fault.</p>' +
        '<p><b>Framing.</b> Every packet travels as an Ethernet [[frame]]: 8 B of preamble and start frame delimiter, a ' +
        '14 B header, a 4 B frame check sequence (FCS) and 12 B of silence before the next frame. TCP and IP add ' +
        'another 40 B. With 1500 B packets this {oh} is 78 of 1538 B (5 %), with 46 B packets 78 of 84 B (93 %).</p>' +
        '<p><b>Shared medium.</b> On a hub the link is {hd}: one frame at a time travels on the medium, so everyone who ' +
        'sends takes turns. On full duplex (a switch) each direction has the whole bandwidth. This ignores the {co} and ' +
        'the waiting after it; the real achieved throughput is lower still.</p>' +
        '<p><b>Retries.</b> A lost frame is sent again and takes the medium twice.</p>' +
        '<p><b>Units.</b> Bandwidth is measured in bits per second, a browser shows bytes per second: 11 MB/s is 88 Mb/s.</p>' +
        '<p><b>Coding is not taken off.</b> The advertised 10, 100 or 1000 Mb/s is already the data rate after line ' +
        'coding: 10 Mb/s with Manchester coding is 20 Mbaud on the wire, 100 Mb/s with 4B/5B is 125 Mbaud. So coding ' +
        'is not part of the bar (the simulator “Line coding: NRZ vs Manchester”).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
