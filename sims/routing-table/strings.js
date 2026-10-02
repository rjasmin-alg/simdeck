/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of routing-table, in both languages (docs/sim-ui.md §9). Croatian is the original (the URM
   book's fragment tablica-usmjeravanja.html and chapter 11); English is written for simdeck. Croatian terms follow
   the book: usmjernik, tablica usmjeravanja, zapis, odredišna mreža, prefiks, sljedeći skok, zadani put, najdulji
   podudarajući prefiks. Terms missing from kit/glossary.js (router, routing table, next hop, longest prefix match)
   are written out in both tables, and so is default route: the glossary has the UL book's "zadana ruta", the URM
   book says "zadani put". The pairs are listed in NOTES.md. Addresses, prefixes and router names are data, not
   words: the page puts them in translate="no" elements. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tablica usmjeravanja usmjernika R2 i odredišna adresa paketa u binarnom zapisu',
      dest: 'Odredišna adresa paketa',
      order: 'Redoslijed zapisa',
      orderBook: 'kao u knjizi',
      orderReversed: 'obrnut',
      presetBook: 'Primjer iz knjige',
      presetBookHint: 'Poglavlje 11, Primjer 2: paket za 10.1.2.55 stiže na R2. Podudara li se sa svim četirima ' +
        'zapisima, ili samo s nekima?',
      presetDefault: 'Odredište 172.16.5.5',
      presetDefaultHint: 'Koji zapis pobjeđuje sad, i zašto?',
      presetEight: 'Odredište 10.5.0.1',
      presetEightHint: 'Koji se zapisi podudaraju, i koji pobjeđuje?',
      presetSixteen: 'Odredište 10.1.3.7',
      presetSixteenHint: 'Adresa je blizu mreže 10.1.2.0. Podudara li se s /24?',
      presetReversed: 'Zadani put prvi',
      presetReversedHint: 'Ista tablica, obrnutim redom: zadani put je sad prvi zapis. Mijenja li to odluku?',
      legendMatch: 'bit jednak odredištu',
      legendIgnored: 'bit se ne uspoređuje',
      legendDiff: 'prvi različit bit',
      destLabel: 'odredište',
      colEntry: 'zapis',
      colBits: 'bitovi koje zapis uspoređuje (duljina prefiksa)',
      colResult: 'podudara se?',
      colHop: 'sljedeći skok',
      hop: 'preko {r}',
      noBits: 'prefiks /0 ne uspoređuje nijedan bit',
      resultYes: 'da',
      resultNo: 'ne',
      resultWait: '?',
      winner: 'pobjeđuje',
      firstInTable: 'prvi u tablici',
      outcome: 'R2 šalje paket preko {r}',
      captionStart: 'Paket za {dest} stiže na usmjernik R2. R2 uspoređuje odredište sa svakim zapisom tablice: zapis ' +
        's prefiksom /n podudara se ako je prvih n bitova adrese jednako njegovoj mreži. Pritisni →.',
      captionMatch: 'Zapis {entry}: prvih {n} bitova od {dest} jednako je mreži {net}. Podudara se.',
      captionMatchDefault: 'Zapis {entry} je zadani put: prefiks duljine nula ne uspoređuje nijedan bit, pa se po ' +
        'definiciji podudara sa svakom adresom, i s {dest}.',
      captionMiss: 'Zapis {entry}: {bit}. bit (u {octet}. oktetu) od {dest} razlikuje se od mreže {net}. Ne podudara ' +
        'se, a ostali bitovi više nisu važni.',
      captionChoose: 'Adresa {dest} podudara se s {count}: {list}. Pobjeđuje najdulji podudarajući prefiks, {win}, pa R2 ' +
        'paket šalje {hop}.',
      captionChooseDefault: 'Adresa {dest} podudara se samo sa zadanim putom {win}: nijedan specifičniji zapis ne odgovara, pa ' +
        'R2 paket šalje {hop}.',
      captionNotFirst: 'Prvi podudarajući zapis u tablici je {first}, ali redoslijed ne odlučuje: odlučuje duljina ' +
        'prefiksa.',
      matchCount: ['{count} zapisom', '{count} zapisa', '{count} zapisa'],
      listAnd: ' i ',
      explain: '<p><em lang="en">Routing table</em> (tablica usmjeravanja) usmjernika ima po jedan zapis za svaku ' +
        'odredišnu mrežu koju zna: mrežu, duljinu prefiksa i sljedeći skok (<em lang="en">next hop</em>). Zapis s ' +
        'prefiksom /n podudara se s odredišnom adresom paketa ako je prvih n bitova adrese jednako prvih n bitova ' +
        'mreže; ostali bitovi se ne gledaju.</p>' +
        '<p><strong>Zašto najdulji, ne prvi ili zadnji.</strong> Zadani put (<em lang="en">default route</em>, ' +
        'prefiks duljine nula) po definiciji odgovara svakoj adresi. Kad bi tablica birala prvi podudarajući zapis, ' +
        'zadani put bi po redoslijedu često pobijedio i onda kad postoji puno precizniji zapis za istu adresu. ' +
        'Pravilo najduljeg podudarajućeg prefiksa (<em lang="en">longest prefix match</em>) umjesto toga uvijek bira ' +
        '<strong>najspecifičniji</strong> opis odredišta, onaj koji o mreži kaže najviše, bez obzira gdje u tablici ' +
        'taj zapis stoji.</p>' +
        '<p>Brojevi to čine očitim: 10.1.2.0/24 opisuje 256 adresa, a 10.0.0.0/8 njih preko šesnaest milijuna. Zadani ' +
        'put time nikad nije prvi izbor: on je posljednji, za slučaj da se ništa specifičnije ne podudara.</p>'
    },
    en: {
      stage: 'Router R2\'s routing table and the packet\'s destination address in binary',
      dest: 'Packet\'s destination address',
      order: 'Order of the entries',
      orderBook: 'as in the book',
      orderReversed: 'reversed',
      presetBook: 'Example from the book',
      presetBookHint: 'Chapter 11, Example 2: a packet for 10.1.2.55 arrives at R2. Does it match all four entries, ' +
        'or only some?',
      presetDefault: 'Destination 172.16.5.5',
      presetDefaultHint: 'Which entry wins now, and why?',
      presetEight: 'Destination 10.5.0.1',
      presetEightHint: 'Which entries match, and which one wins?',
      presetSixteen: 'Destination 10.1.3.7',
      presetSixteenHint: 'The address is close to the network 10.1.2.0. Does it match the /24?',
      presetReversed: 'Default route first',
      presetReversedHint: 'The same table in reverse order: the default route is now the first entry. Does that ' +
        'change the decision?',
      legendMatch: 'bit equals the destination',
      legendIgnored: 'bit not compared',
      legendDiff: 'first differing bit',
      destLabel: 'destination',
      colEntry: 'entry',
      colBits: 'bits the entry compares (prefix length)',
      colResult: 'match?',
      colHop: 'next hop',
      hop: 'via {r}',
      noBits: 'prefix /0 compares no bit',
      resultYes: 'yes',
      resultNo: 'no',
      resultWait: '?',
      winner: 'wins',
      firstInTable: 'first in the table',
      outcome: 'R2 sends the packet via {r}',
      captionStart: 'A packet for {dest} arrives at router R2. R2 compares the destination with every entry in its ' +
        'table: an entry with prefix /n matches when the first n bits of the address equal its network. Press →.',
      captionMatch: 'Entry {entry}: the first {n} bits of {dest} equal the network {net}. It matches.',
      captionMatchDefault: 'Entry {entry} is the default route: a prefix of length zero compares no bit, so by ' +
        'definition it matches every address, {dest} too.',
      captionMiss: 'Entry {entry}: bit {bit} (in octet {octet}) of {dest} differs from the network {net}. No match, ' +
        'and the remaining bits no longer matter.',
      captionChoose: '{count} match {dest}: {list}. The longest matching prefix wins, {win}, so R2 sends the packet ' +
        '{hop}.',
      captionChooseDefault: 'Only the default route {win} matches {dest}: no more specific entry fits, so R2 sends ' +
        'the packet {hop}.',
      captionNotFirst: 'The first matching entry in the table is {first}, but the order does not decide: the prefix ' +
        'length does.',
      matchCount: ['{count} entry', '{count} entries'],
      listAnd: ' and ',
      explain: '<p>A router\'s <em>routing table</em> has one entry for every destination network it knows: the ' +
        'network, the prefix length and the <em>next hop</em>. An entry with prefix /n matches a packet\'s ' +
        'destination address when the first n bits of the address equal the first n bits of the network; the other ' +
        'bits are not looked at.</p>' +
        '<p><strong>Why the longest, not the first or the last.</strong> The <em>default route</em> (prefix length ' +
        'zero) matches every address by definition. If the table chose the first matching entry, the default route ' +
        'would often win by its position even when there is a much more precise entry for the same address. The ' +
        '<em>longest prefix match</em> rule instead always picks the <strong>most specific</strong> description of ' +
        'the destination, the one that says the most about the network, wherever that entry stands in the table.</p>' +
        '<p>The numbers make it plain: 10.1.2.0/24 describes 256 addresses, 10.0.0.0/8 more than sixteen million. So ' +
        'the default route is never the first choice: it is the last, for when nothing more specific matches.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
