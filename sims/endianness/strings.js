/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of endianness, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The glossary has no byte-order terms yet (NOTES.md "Term pairs"), so the Croatian term rule is written out here:
   the English term in italics with the Croatian in parentheses at first mention.
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Vrijednost u memoriji i na žici',

      // params
      width: 'Širina',
      value: 'Vrijednost',
      value_ipv4: '172.16.5.30 (IPv4 adresa)',
      value_port443: '443 (broj vrata)',
      value_textbook: '0x0A0B0C0D',
      value_one: '1',
      value_http: 'tekst „HTTP”',
      value_typed: 'upisana (heksadekadski)',
      host: 'Poredak računala',
      little: 'little-endian',
      big: 'big-endian',
      convert: 'Program poziva ntohl / ntohs',
      convertHint: 'Isključeno: program učita primljene oktete izravno kao broj.',
      textNoConvert: 'Tekst se čita oktet po oktet: nema što pretvarati.',
      textNoWidth: 'Tekst „HTTP” uvijek ima 4 okteta.',

      // presets
      'preset_ipv4-address': 'IPv4 adresa',
      'hint_ipv4-address': '172.16.5.30 bez ntohl na little-endian računalu',
      'preset_port-443': 'Vrata 443',
      'hint_port-443': '16 bitova: 01 BB na žici, bez ntohs 47 873',
      preset_textbook: '0x0A0B0C0D',
      hint_textbook: 'Udžbenički primjer: četiri različita okteta',
      preset_text: 'Tekst „HTTP”',
      hint_text: 'Okteti teksta nemaju poredak',
      'preset_big-host': 'Big-endian računalo',
      'hint_big-host': 'Memorija je ista kao žica, ntohl ne radi ništa',

      // legend
      legendMsb: 'MSB: najznačajniji oktet',
      legendLsb: 'LSB: najmanje značajni oktet',
      legendWire: 'redoslijed slanja',
      legendChanged: 'promijenjeno',

      // stage
      typedLabel: 'Upiši heksadekadski:',
      typedPlaceholder: 'npr. C0A80001',
      valueHead: 'Vrijednost',
      bits: ['{n} bit', '{n} bita', '{n} bitova'],
      dec: 'dekadski',
      dotted: 's točkama',
      cut: 'skraćeno na {bits}: gornji okteti otpadaju',
      textValue: 'tekst',
      rowBig: 'big-endian',
      rowBigSub: 'MSB na najnižoj adresi',
      rowLittle: 'little-endian',
      rowLittleSub: 'LSB na najnižoj adresi',
      thisHost: 'ovo računalo',
      rowWire: 'Na žici',
      rowWireSub: 'mrežni poredak okteta',
      firstSent: 'šalje se prvi',
      nth: '{n}.',
      rowRead: 'Program čita',
      rowReadSub: 'primljene oktete s adresa {from}…',
      readRaw: 'izravno, bez {fn}',
      readText: 'oktet po oktet',
      otherWith: 's {fn}:',
      otherWithout: 'bez {fn}:',
      same: 'isto',
      cellLabel: 'adresa {a}: oktet {b}',
      wireLabel: '{n}. poslani oktet: {b}',

      // captions
      capWireAddr: 'Na žici adresa {v} putuje kao {bytes} (mrežni poredak okteta).',
      capWireValue: 'Na žici vrijednost {v} putuje kao {bytes} (mrežni poredak okteta).',
      capLittle: 'Računalo s little-endian poretkom sprema je obrnuto: {bytes}.',
      capLittleSame: 'Računalo s little-endian poretkom sprema je obrnuto, a okteti {bytes} čitaju se isto u oba smjera.',
      quoted: '„{s}”',
      msb: 'MSB',
      lsb: 'LSB',
      capBig: 'Računalo s big-endian poretkom sprema je istim redom: {bytes}.',
      capRaw: 'Bez {fn} program čita {r}.',
      capConv: 'S {fn} program čita {r}.',
      capNoop: '{fn} ovdje ne radi ništa: program čita {r} s njom i bez nje.',
      capText: 'Tekst {v} čine pojedinačni okteti {bytes}: isti su na žici i u memoriji svakog računala, pa nema što pretvarati.',

      explain: '<p>Broj od 16 ili 32 bita zauzima dva ili četiri uzastopna okteta u memoriji. Koji od njih ide na ' +
        'najnižu adresu, određuje <i lang="en">endianness</i> (poredak okteta). <i lang="en">Big-endian</i> sprema ' +
        'najznačajniji oktet (MSB) na najnižu adresu, <i lang="en">little-endian</i> najmanje značajni (LSB). Većina ' +
        'današnjih stolnih računala i poslužitelja je <i lang="en">little-endian</i>.</p>' +
        '<p>Protokoli interneta šalju višeoktetna polja najznačajnijim oktetom naprijed: <i lang="en">network byte ' +
        'order</i> (mrežni poredak okteta) je <i lang="en">big-endian</i>. Mreža ništa ne pretvara umjesto programa: ' +
        'pošiljatelj poziva <code>htonl</code> ili <code>htons</code>, primatelj <code>ntohl</code> ili ' +
        '<code>ntohs</code>. Na <i lang="en">big-endian</i> računalu one ne rade ništa.</p>' +
        '<p>Bez pretvorbe <i lang="en">little-endian</i> računalo pročita oktete obrnutim redom. Obrću se okteti, ' +
        'nikad bitovi unutar okteta. Tekst (ASCII) i pojedinačni okteti nemaju poredak: samo višeoktetni brojevi ga ' +
        'imaju.</p>'
    },
    en: {
      stage: 'The value in memory and on the wire',

      width: 'Width',
      value: 'Value',
      value_ipv4: '172.16.5.30 (IPv4 address)',
      value_port443: '443 (port number)',
      value_textbook: '0x0A0B0C0D',
      value_one: '1',
      value_http: 'text "HTTP"',
      value_typed: 'typed (hexadecimal)',
      host: 'Host byte order',
      little: 'little-endian',
      big: 'big-endian',
      convert: 'Program calls ntohl / ntohs',
      convertHint: 'Off: the program loads the received bytes as a number directly.',
      textNoConvert: 'Text is read byte by byte: nothing to convert.',
      textNoWidth: 'The text "HTTP" is always 4 bytes.',

      'preset_ipv4-address': 'IPv4 address',
      'hint_ipv4-address': '172.16.5.30 without ntohl on a little-endian host',
      'preset_port-443': 'Port 443',
      'hint_port-443': '16 bits: 01 BB on the wire, 47 873 without ntohs',
      preset_textbook: '0x0A0B0C0D',
      hint_textbook: 'The textbook example: four different bytes',
      preset_text: 'Text "HTTP"',
      hint_text: 'The bytes of text have no order',
      'preset_big-host': 'Big-endian host',
      'hint_big-host': 'Memory equals the wire, ntohl does nothing',

      legendMsb: 'MSB: most significant byte',
      legendLsb: 'LSB: least significant byte',
      legendWire: 'sending order',
      legendChanged: 'changed',

      typedLabel: 'Type hex:',
      typedPlaceholder: 'e.g. C0A80001',
      valueHead: 'Value',
      bits: ['{n} bit', '{n} bits'],
      dec: 'decimal',
      dotted: 'dotted',
      cut: 'cut to {bits}: the upper bytes drop off',
      textValue: 'text',
      rowBig: 'big-endian',
      rowBigSub: 'MSB at the lowest address',
      rowLittle: 'little-endian',
      rowLittleSub: 'LSB at the lowest address',
      thisHost: 'this host',
      rowWire: 'On the wire',
      rowWireSub: 'network byte order',
      firstSent: 'sent first',
      nth: '{n}.',
      rowRead: 'The program reads',
      rowReadSub: 'the received bytes at {from}…',
      readRaw: 'directly, without {fn}',
      readText: 'byte by byte',
      otherWith: 'with {fn}:',
      otherWithout: 'without {fn}:',
      same: 'the same',
      cellLabel: 'address {a}: byte {b}',
      wireLabel: 'byte {n} sent: {b}',

      capWireAddr: 'On the wire {v} travels as {bytes} (network byte order).',
      capWireValue: 'On the wire the value {v} travels as {bytes} (network byte order).',
      capLittle: 'A little-endian host stores it reversed: {bytes}.',
      capLittleSame: 'A little-endian host stores it reversed, and the bytes {bytes} read the same both ways.',
      quoted: '"{s}"',
      msb: 'MSB',
      lsb: 'LSB',
      capBig: 'A big-endian host stores it in the same order: {bytes}.',
      capRaw: 'Without {fn} the program reads {r}.',
      capConv: 'With {fn} the program reads {r}.',
      capNoop: '{fn} does nothing here: the program reads {r} with or without it.',
      capText: 'The text {v} is made of single bytes {bytes}: the same on the wire and in every host\'s memory, so there is nothing to convert.',

      explain: '<p>A 16- or 32-bit number takes two or four consecutive bytes in memory. Which of them goes to the ' +
        'lowest address is the byte order (endianness). Big-endian stores the most significant byte (MSB) at the ' +
        'lowest address, little-endian the least significant one (LSB). Most desktop and server processors today ' +
        'are little-endian.</p>' +
        '<p>Internet protocols send multi-byte fields most significant byte first: network byte order is ' +
        'big-endian. The network converts nothing for the program: the sender calls <code>htonl</code> or ' +
        '<code>htons</code>, the receiver <code>ntohl</code> or <code>ntohs</code>. On a big-endian host they do ' +
        'nothing.</p>' +
        '<p>Without the conversion a little-endian host reads the bytes in reverse order. The bytes are reversed, ' +
        'never the bits inside a byte. Text (ASCII) and single bytes have no byte order: only multi-byte numbers ' +
        'do.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
