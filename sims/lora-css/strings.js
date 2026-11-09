/* SPDX-License-Identifier: AGPL-3.0-or-later
   lora-css: every visible string of the page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come
   from sim.json. Numbers arrive formatted by the page (decimal comma in Croatian), with their units. The glossary has
   none of this sim's terms yet, so the Croatian term pairs are written out (NOTES.md, "Term pairs"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Cvrkuti LoRa paketa u vremenu i frekvenciji, uz vrijeme u eteru, domet i čekanje',
      // params
      SF: 'Faktor širenja (SF)',
      BW: 'Širina pojasa',
      CR: 'Omjer kodiranja',
      payload: 'Podaci u paketu',
      n: 'Okolina',
      nFree: 'slobodni prostor',
      nBuilt: 'izgrađeno',
      view: 'Prikaz',
      view_window: 'prvih 100 ms',
      view_packet: 'cijeli paket',
      view_symbols: '4 simbola',
      zoomNote: 'Prva {n} podatkovna simbola: svaki počinje na jednom od {m} pomaka.',
      bytes: ['{n} bajt', '{n} bajta', '{n} bajtova'],
      bytesGen: ['{n} bajta', '{n} bajta', '{n} bajtova'],
      // presets
      preset_sf7: 'SF7: kratko i brzo',
      preset_sf7Hint: 'Simbol 1,024 ms, paket od 20 bajtova 56,6 ms u eteru, zatim 5,6 s šutnje.',
      preset_sf12: 'SF12: daleko i sporo',
      preset_sf12Hint: 'Simbol 32,8 ms, paket 1,3 s (23 puta dulje), domet tek oko 4 puta veći, 131 s čekanja.',
      'preset_sf9-bw': 'SF9 i širina pojasa',
      'preset_sf9-bwHint': 'SF9 na 125 / 250 / 500 kHz: 185 / 93 / 46 ms. Dvostruka širina pojasa prepolovi vrijeme i stoji 3 dB.',
      'preset_sf-step': 'Korak SF10 → SF11',
      'preset_sf-stepHint': 'Vrijeme u eteru 371 → 741 ms, dvostruko, za samo 2,5 dB bolju osjetljivost. Usporedite retke u tablici.',
      // legend
      legendUp: 'cvrkut prema gore',
      legendDown: 'cvrkut prema dolje',
      legendData: 'simbol: početak i vrijednost',
      legendPre: 'preambula',
      legendWrap: 'preklop',
      legendChanged: 'promjena > 10 %',
      // plot
      axisTime: 'vrijeme',
      axisFreq: 'kHz od sredine',
      bracketPre: 'preambula: 8',
      bracketSync: 'sinkr. 4,25',
      bracketData: ['podaci: {n} simbol', 'podaci: {n} simbola', 'podaci: {n} simbola'],
      winPart: 'Prikazano prvih {win} od {toa} paketa.',
      winAll: 'Cijeli paket ({toa}) stane u prvih {win}.',
      packetAll: 'Cijeli paket: {toa}.',
      endMark: 'kraj',
      // card
      cardSymbol: 'Simbol',
      cardTs: 'traje',
      cardBits: 'nosi',
      cardBitsVal: '{n} bitova',
      cardOffsets: 'mogućih pomaka',
      cardSymbols: 'Simbola u paketu (preambula + podaci):',
      cardSymbolsVal: '{pre} + {pay} = {all}',
      cardRate: 'brzina',
      cardSnr: 'SNR na granici',
      cardSens: 'osjetljivost',
      // bars
      barToa: 'Vrijeme u eteru',
      barRange: 'Domet prema SF7 / 125 kHz',
      barWait: 'Šutnja nakon paketa (radni ciklus 1 %)',
      barRef: 'SF7 na 125 kHz',
      refNote: 'oznaka: SF7 na 125 kHz; puna traka: SF12, 50 bajtova, 4/8',
      // table
      thSf: 'SF',
      thTs: 'simbol',
      thToa: 'u eteru',
      thSens: 'osjetlj. dBm',
      thRange: 'domet',
      thWait: 'šutnja',
      // units (numbers come formatted)
      ms: '{v} ms',
      s: '{v} s',
      dB: '{v} dB',
      dBm: '{v} dBm',
      kHz: '{v} kHz',
      bps: '{v} bit/s',
      kbps: '{v} kbit/s',
      times: '× {v}',
      // captions
      capSf7: 'SF7: svaki simbol traje {ts} i nosi 7 bitova. Paket od {pl} traje {toa}; nakon njega uređaj mora šutjeti {wait} (radni ciklus 1 %).',
      capSf: 'SF{sf}: svaki simbol traje {ts} i nosi {sf} bitova. Paket od {pl} traje {toa}, {x} puta dulje nego na SF7, a domet raste tek oko {r} puta ({env}).',
      capSfDe: 'SF{sf}: svaki simbol traje {ts} i nosi {sf} bitova (podatkovni {d}: optimizacija za nisku brzinu). Paket od {pl} traje {toa}, {x} puta dulje nego na SF7, a domet raste tek oko {r} puta ({env}).',
      envFree: 'u slobodnom prostoru',
      envBuilt: 'u izgrađenom području',
      capNoise: ' Prijamnik ga još dekodira i kad je signal {snr} ispod šuma.',
      capBw: ' Na {bw} simbol je {k} puta kraći nego na 125 kHz, a osjetljivost za {db} lošija.',
      // footer
      explain: '<p>LoRa šalje podatke <i>chirps</i> (cvrkutima): frekvencija u jednom simbolu linearno raste preko cijele ' +
        '<i>bandwidth</i> (širine pojasa) BW, a na vrhu se preklopi na dno i nastavi rasti. Takav <i>spread spectrum</i> ' +
        '(prošireni spektar) raširi malo podataka po širokom pojasu, pa ih prijamnik izvuče i ispod razine šuma.</p>' +
        '<p><i>Spreading factor</i> (faktor širenja) SF određuje koliko je mogućih početaka cvrkuta: 2<sup>SF</sup>. Simbol je ' +
        'cvrkut koji počinje na jednom od tih pomaka; vrijednost pomaka nosi SF bitova. Simbol traje T<sub>s</sub> = 2<sup>SF</sup> / BW: ' +
        'svaki korak SF-a ga udvostruči, a dvostruka širina pojasa prepolovi.</p>' +
        '<p>Paket počinje <i>preamble</i> (preambulom) od 8 cvrkuta bez pomaka, zatim dolaze 2 simbola sinkronizacije i 2,25 cvrkuta prema dolje, ' +
        'pa podaci. Broj podatkovnih simbola raste s brojem bajtova i s omjerom kodiranja (4/5 … 4/8 dodaje zaštitne bitove). <i>Time on air</i> ' +
        '(vrijeme u eteru) je zbroj svih simbola puta T<sub>s</sub>. Kad simbol traje dulje od 16 ms (SF11 i SF12 na 125 kHz, SF12 na 250 kHz), ' +
        'uključena je optimizacija za nisku brzinu, pa podatkovni simbol nosi 2 bita manje.</p>' +
        '<p>Što je SF veći, prijamnik treba manji omjer signala i šuma: −7,5 dB na SF7, 2,5 dB manje po koraku, −20 dB na SF12. ' +
        'Signal ispod šuma ipak se prima. Iz toga slijedi <i>sensitivity</i> (osjetljivost) = −174 + 10·log<sub>10</sub>(BW) + 6 + SNR. ' +
        'Tih 12,5 dB <i>link budget</i> (bilance veze) između SF7 i SF12 daje oko 4 puta veći domet u slobodnom prostoru i oko 2,3 puta ' +
        'u izgrađenom području (prigušenje raste s 2. odnosno 3,5. potencijom udaljenosti, ilustrativno).</p>' +
        '<p>U podpojasu 868 MHz koji ovdje uzimamo smije se odašiljati najviše 1 % vremena (<i>duty cycle</i>, radni ciklus). Pojednostavljeno: nakon paketa uređaj šuti 99 puta ' +
        'dulje nego što je odašiljao. SF12 zato nije „bolji“: za oko 4 puta veći domet plaća se 23 puta duljim zauzećem kanala i ' +
        'čekanjem od dvije minute.</p>' +
        '<p>LoRa nije LoRaWAN: LoRa je modulacija (ovi cvrkuti), a LoRaWAN mrežni protokol iznad nje, s pristupnicima i mrežnim poslužiteljem.</p>'
    },
    en: {
      stage: 'The chirps of a LoRa packet in time and frequency, with time on air, range and wait',
      SF: 'Spreading factor (SF)',
      BW: 'Bandwidth',
      CR: 'Coding rate',
      payload: 'Payload',
      n: 'Surroundings',
      nFree: 'free space',
      nBuilt: 'built-up',
      view: 'Show',
      view_window: 'first 100 ms',
      view_packet: 'whole packet',
      view_symbols: '4 symbols',
      zoomNote: 'The first {n} data symbols: each starts at one of {m} offsets.',
      bytes: ['{n} byte', '{n} bytes'],
      bytesGen: ['{n} byte', '{n} bytes'],
      preset_sf7: 'SF7: short and fast',
      preset_sf7Hint: 'Symbol 1.024 ms, a 20-byte packet is 56.6 ms on air, then 5.6 s of silence.',
      preset_sf12: 'SF12: far and slow',
      preset_sf12Hint: 'Symbol 32.8 ms, packet 1.3 s (23 times longer), range only about 4 times larger, 131 s wait.',
      'preset_sf9-bw': 'SF9 and bandwidth',
      'preset_sf9-bwHint': 'SF9 at 125 / 250 / 500 kHz: 185 / 93 / 46 ms. Doubling the bandwidth halves the time and costs 3 dB.',
      'preset_sf-step': 'Step SF10 → SF11',
      'preset_sf-stepHint': 'Time on air 371 → 741 ms, doubled, for only 2.5 dB more sensitivity. Compare the rows in the table.',
      legendUp: 'up-chirp',
      legendDown: 'down-chirp',
      legendData: 'symbol: start and value',
      legendPre: 'preamble',
      legendWrap: 'wrap',
      legendChanged: 'changed > 10 %',
      axisTime: 'time',
      axisFreq: 'kHz from centre',
      bracketPre: 'preamble: 8',
      bracketSync: 'sync 4.25',
      bracketData: ['data: {n} symbol', 'data: {n} symbols'],
      winPart: 'Showing the first {win} of a {toa} packet.',
      winAll: 'The whole packet ({toa}) fits in the first {win}.',
      packetAll: 'Whole packet: {toa}.',
      endMark: 'end',
      cardSymbol: 'Symbol',
      cardTs: 'lasts',
      cardBits: 'carries',
      cardBitsVal: '{n} bits',
      cardOffsets: 'possible offsets',
      cardSymbols: 'Symbols in the packet (preamble + data):',
      cardSymbolsVal: '{pre} + {pay} = {all}',
      cardRate: 'bit rate',
      cardSnr: 'SNR at the limit',
      cardSens: 'sensitivity',
      barToa: 'Time on air',
      barRange: 'Range against SF7 / 125 kHz',
      barWait: 'Silence after the packet (1 % duty cycle)',
      barRef: 'SF7 at 125 kHz',
      refNote: 'mark: SF7 at 125 kHz; full bar: SF12, 50 bytes, 4/8',
      thSf: 'SF',
      thTs: 'symbol',
      thToa: 'on air',
      thSens: 'sens. dBm',
      thRange: 'range',
      thWait: 'silence',
      ms: '{v} ms',
      s: '{v} s',
      dB: '{v} dB',
      dBm: '{v} dBm',
      kHz: '{v} kHz',
      bps: '{v} bit/s',
      kbps: '{v} kbit/s',
      times: '× {v}',
      capSf7: 'SF7: each symbol lasts {ts} and carries 7 bits. A packet of {pl} takes {toa}; after it the device must stay silent for {wait} (1 % duty cycle).',
      capSf: 'SF{sf}: each symbol lasts {ts} and carries {sf} bits. A packet of {pl} takes {toa}, {x} times longer than at SF7, while range grows only about {r} times ({env}).',
      capSfDe: 'SF{sf}: each symbol lasts {ts} and carries {sf} bits (data symbols {d}: low-data-rate optimisation). A packet of {pl} takes {toa}, {x} times longer than at SF7, while range grows only about {r} times ({env}).',
      envFree: 'free space',
      envBuilt: 'built-up area',
      capNoise: ' The receiver still decodes it with the signal {snr} below the noise.',
      capBw: ' At {bw} a symbol is {k} times shorter than at 125 kHz, and the sensitivity {db} worse.',
      explain: '<p>LoRa sends data as chirps: within one symbol the frequency rises linearly across the whole bandwidth BW, ' +
        'wraps from the top to the bottom and keeps rising. This spread spectrum spreads a little data over a wide band, so the ' +
        'receiver can pull it out even below the noise.</p>' +
        '<p>The spreading factor SF sets how many starting points a chirp can have: 2<sup>SF</sup>. A symbol is a chirp that starts ' +
        'at one of these offsets; the offset\'s value carries SF bits. A symbol lasts T<sub>s</sub> = 2<sup>SF</sup> / BW: every SF ' +
        'step doubles it, and doubling the bandwidth halves it.</p>' +
        '<p>A packet starts with a preamble of 8 chirps without offset, then 2 sync symbols and 2.25 down-chirps, then the data. The ' +
        'number of data symbols grows with the bytes and with the coding rate (4/5 … 4/8 adds protection bits). The time on air is ' +
        'all the symbols times T<sub>s</sub>. When a symbol lasts longer than 16 ms (SF11 and SF12 at 125 kHz, SF12 at 250 kHz), ' +
        'the low-data-rate optimisation is on, so a data symbol carries 2 bits fewer.</p>' +
        '<p>The higher the SF, the lower the signal-to-noise ratio the receiver needs: −7.5 dB at SF7, 2.5 dB less per step, −20 dB at ' +
        'SF12. A signal below the noise is still received. From this, sensitivity = −174 + 10·log<sub>10</sub>(BW) + 6 + SNR. Those ' +
        '12.5 dB of link budget between SF7 and SF12 give about 4 times the range in free space and about 2.3 times in a built-up area ' +
        '(loss with the 2nd or 3.5th power of distance, illustrative).</p>' +
        '<p>In the 868 MHz sub-band taken here a device may transmit at most 1 % of the time (duty cycle). Simplified: after a packet it stays silent 99 times as ' +
        'long as it transmitted. So SF12 is not "better": about 4 times the range costs 23 times the channel time and a two-minute wait.</p>' +
        '<p>LoRa is not LoRaWAN: LoRa is the modulation (these chirps), LoRaWAN the network protocol on top of it, with gateways and a network server.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
